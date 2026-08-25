import type { Article, VocabItem } from '../types/article';
import { getSavedArticles, getSavedVocab } from './storage';

const VAULT_ID_KEY = 'aeoncat_vault_id_v4';
const LAST_SYNC_KEY = 'aeoncat_last_sync_time_v4';

export interface CloudVaultPayload {
  vaultId: string;
  articles: Article[];
  vocab: VocabItem[];
  updatedAt: number;
}

export function getStoredVaultId(): string {
  return localStorage.getItem(VAULT_ID_KEY) || 'mokshal-vault';
}

export function saveStoredVaultId(id: string): void {
  localStorage.setItem(VAULT_ID_KEY, id.trim().toLowerCase());
}

export function getLastSyncTime(): number {
  const t = localStorage.getItem(LAST_SYNC_KEY);
  return t ? parseInt(t, 10) : 0;
}

export function setLastSyncTime(t: number): void {
  localStorage.setItem(LAST_SYNC_KEY, t.toString());
}

// Upload local library to Vercel Blob
export async function pushToCloudBlob(vaultId?: string): Promise<boolean> {
  const id = vaultId || getStoredVaultId();
  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const payload: CloudVaultPayload = {
    vaultId: id,
    articles: localArticles,
    vocab: localVocab,
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(`/api/sync?vault=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setLastSyncTime(Date.now());
      return true;
    }
  } catch (err) {
    console.warn('Vercel Blob push error:', err);
  }
  return false;
}

// Fetch from Vercel Blob and merge
export async function pullFromCloudBlob(vaultId?: string): Promise<{
  articles: Article[];
  vocab: VocabItem[];
  updated: boolean;
} | null> {
  const id = vaultId || getStoredVaultId();

  try {
    const res = await fetch(`/api/sync?vault=${encodeURIComponent(id)}&t=${Date.now()}`);
    if (!res.ok) {
      // If 404 (first time), push our current local articles to initialize the vault
      if (res.status === 404) {
        await pushToCloudBlob(id);
        return {
          articles: getSavedArticles(),
          vocab: getSavedVocab(),
          updated: false,
        };
      }
      return null;
    }

    const cloudData: CloudVaultPayload = await res.json();
    if (!cloudData || !Array.isArray(cloudData.articles)) return null;

    const localArticles = getSavedArticles();
    const localVocab = getSavedVocab();

    // 1. Merge articles by ID
    const articlesMap = new Map<string, Article>();
    localArticles.forEach((a) => articlesMap.set(a.id, a));

    let hasNewData = false;
    cloudData.articles.forEach((ca) => {
      const existing = articlesMap.get(ca.id);
      if (!existing) {
        hasNewData = true;
        articlesMap.set(ca.id, ca);
      } else if (ca.createdAt > (existing.createdAt || 0)) {
        articlesMap.set(ca.id, ca);
      }
    });

    const mergedArticles = Array.from(articlesMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    // 2. Merge vocab
    const vocabMap = new Map<string, VocabItem>();
    localVocab.forEach((v) => vocabMap.set(v.word.toLowerCase(), v));
    if (Array.isArray(cloudData.vocab)) {
      cloudData.vocab.forEach((cv) => {
        if (!vocabMap.has(cv.word.toLowerCase())) {
          hasNewData = true;
          vocabMap.set(cv.word.toLowerCase(), cv);
        }
      });
    }

    const mergedVocab = Array.from(vocabMap.values()).sort(
      (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
    );

    // Save locally
    localStorage.setItem('aeoncat_saved_articles_v1', JSON.stringify(mergedArticles));
    localStorage.setItem('aeoncat_vocab_bank_v1', JSON.stringify(mergedVocab));
    saveStoredVaultId(id);
    setLastSyncTime(Date.now());

    // Push back merged union so both devices stay synchronized
    await pushToCloudBlob(id);

    return {
      articles: mergedArticles,
      vocab: mergedVocab,
      updated: hasNewData,
    };
  } catch (err) {
    console.warn('Vercel Blob pull error:', err);
  }
  return null;
}
