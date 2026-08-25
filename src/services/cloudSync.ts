import type { Article, VocabItem } from '../types/article';
import { getSavedArticles, getSavedVocab } from './storage';

const VAULT_ID_KEY = 'aeoncat_vault_id_v5';
const LAST_SYNC_KEY = 'aeoncat_last_sync_time_v5';
const CUSTOM_SYNC_HOST_KEY = 'aeoncat_sync_host_v5';

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

export function getStoredSyncHost(): string {
  return localStorage.getItem(CUSTOM_SYNC_HOST_KEY) || '';
}

export function saveStoredSyncHost(host: string): void {
  localStorage.setItem(CUSTOM_SYNC_HOST_KEY, host.trim().replace(/\/+$/, ''));
}

export function getLastSyncTime(): number {
  const t = localStorage.getItem(LAST_SYNC_KEY);
  return t ? parseInt(t, 10) : 0;
}

export function setLastSyncTime(t: number): void {
  localStorage.setItem(LAST_SYNC_KEY, t.toString());
}

// Determines the correct sync endpoint
function getSyncApiEndpoint(vaultId: string): string {
  const customHost = getStoredSyncHost();
  if (customHost) {
    return `${customHost}/api/sync?vault=${encodeURIComponent(vaultId)}`;
  }
  return `/api/sync?vault=${encodeURIComponent(vaultId)}`;
}

// Upload local library to Vercel Blob
export async function pushToCloudBlob(vaultId?: string): Promise<{ ok: boolean; message?: string }> {
  const id = vaultId || getStoredVaultId();
  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const payload: CloudVaultPayload = {
    vaultId: id,
    articles: localArticles,
    vocab: localVocab,
    updatedAt: Date.now(),
  };

  const endpoint = getSyncApiEndpoint(id);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setLastSyncTime(Date.now());
      return { ok: true, message: `Uploaded ${localArticles.length} articles to cloud.` };
    }

    const errData = await res.json().catch(() => ({}));
    return { ok: false, message: errData.error || `HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Network request failed' };
  }
}

// Fetch from Vercel Blob and merge
export async function pullFromCloudBlob(vaultId?: string): Promise<{
  articles: Article[];
  vocab: VocabItem[];
  updated: boolean;
  message: string;
} | null> {
  const id = vaultId || getStoredVaultId();
  const endpoint = getSyncApiEndpoint(id) + `&t=${Date.now()}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      if (res.status === 404) {
        // First time initialization: push current local data to Blob
        await pushToCloudBlob(id);
        return {
          articles: getSavedArticles(),
          vocab: getSavedVocab(),
          updated: false,
          message: 'Initialized new cloud vault with current articles.',
        };
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const cloudData: CloudVaultPayload = await res.json();
    if (!cloudData || !Array.isArray(cloudData.articles)) return null;

    const localArticles = getSavedArticles();
    const localVocab = getSavedVocab();

    // 1. Merge articles by ID
    const articlesMap = new Map<string, Article>();
    localArticles.forEach((a) => articlesMap.set(a.id, a));

    let hasNew = false;
    cloudData.articles.forEach((ca) => {
      const existing = articlesMap.get(ca.id);
      if (!existing) {
        hasNew = true;
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
          hasNew = true;
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

    // Push back merged union to cloud
    await pushToCloudBlob(id);

    return {
      articles: mergedArticles,
      vocab: mergedVocab,
      updated: hasNew,
      message: `Synced ${mergedArticles.length} total articles across devices.`,
    };
  } catch (err: any) {
    throw err;
  }
}
