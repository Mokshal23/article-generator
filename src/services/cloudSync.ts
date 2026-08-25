import type { Article, VocabItem } from '../types/article';
import { getSavedArticles, getSavedVocab } from './storage';

const SYNC_CODE_KEY = 'aeoncat_sync_code_v1';
const LAST_SYNC_KEY = 'aeoncat_last_sync_timestamp';

// Multi-endpoint cloud vault endpoints for high reliability
const CLOUD_SYNC_URL = 'https://kvdb.io/Ank8e24VzFvE7k4gT12345/';

export interface SyncPayload {
  articles: Article[];
  vocab: VocabItem[];
  updatedAt: number;
}

export function getStoredSyncCode(): string {
  return localStorage.getItem(SYNC_CODE_KEY) || '';
}

export function saveStoredSyncCode(code: string): void {
  localStorage.setItem(SYNC_CODE_KEY, code.trim().toLowerCase());
}

export function getLastSyncTime(): number {
  const t = localStorage.getItem(LAST_SYNC_KEY);
  return t ? parseInt(t, 10) : 0;
}

export function setLastSyncTime(t: number): void {
  localStorage.setItem(LAST_SYNC_KEY, t.toString());
}

// Hash code to safe alphanumeric key
function getVaultKey(code: string): string {
  const clean = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return 'vault_' + clean;
}

// Upload local data to cloud vault
export async function pushToCloudVault(code: string): Promise<boolean> {
  if (!code || !code.trim()) return false;

  const key = getVaultKey(code);
  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const payload: SyncPayload = {
    articles: localArticles,
    vocab: localVocab,
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(`${CLOUD_SYNC_URL}${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setLastSyncTime(Date.now());
      return true;
    }
  } catch (err) {
    console.warn('Cloud sync push error:', err);
  }
  return false;
}

// Pull cloud data and merge with local data
export async function pullFromCloudVault(code: string): Promise<{
  articles: Article[];
  vocab: VocabItem[];
  updated: boolean;
} | null> {
  if (!code || !code.trim()) return null;

  const key = getVaultKey(code);

  try {
    const res = await fetch(`${CLOUD_SYNC_URL}${encodeURIComponent(key)}?t=${Date.now()}`);
    if (!res.ok) {
      // If vault does not exist yet in cloud, create it by pushing current local data
      if (res.status === 404) {
        await pushToCloudVault(code);
        return {
          articles: getSavedArticles(),
          vocab: getSavedVocab(),
          updated: false,
        };
      }
      return null;
    }

    const cloudData: SyncPayload = await res.json();
    if (!cloudData || !Array.isArray(cloudData.articles)) return null;

    const localArticles = getSavedArticles();
    const localVocab = getSavedVocab();

    // 1. Merge articles by ID
    const mergedArticlesMap = new Map<string, Article>();
    // First insert local
    localArticles.forEach((a) => mergedArticlesMap.set(a.id, a));
    // Merge or update with cloud
    cloudData.articles.forEach((ca) => {
      const existing = mergedArticlesMap.get(ca.id);
      if (!existing || (ca.createdAt && ca.createdAt > (existing.createdAt || 0))) {
        mergedArticlesMap.set(ca.id, ca);
      }
    });

    const mergedArticles = Array.from(mergedArticlesMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    // 2. Merge vocab by word
    const mergedVocabMap = new Map<string, VocabItem>();
    localVocab.forEach((v) => mergedVocabMap.set(v.word.toLowerCase(), v));
    if (Array.isArray(cloudData.vocab)) {
      cloudData.vocab.forEach((cv) => {
        if (!mergedVocabMap.has(cv.word.toLowerCase())) {
          mergedVocabMap.set(cv.word.toLowerCase(), cv);
        }
      });
    }

    const mergedVocab = Array.from(mergedVocabMap.values()).sort(
      (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
    );

    // Save merged results locally
    localStorage.setItem('aeoncat_saved_articles_v1', JSON.stringify(mergedArticles));
    localStorage.setItem('aeoncat_vocab_bank_v1', JSON.stringify(mergedVocab));
    setLastSyncTime(Date.now());

    // Push back merged union so both devices stay completely synchronized
    await pushToCloudVault(code);

    return {
      articles: mergedArticles,
      vocab: mergedVocab,
      updated: true,
    };
  } catch (err) {
    console.warn('Cloud sync pull error:', err);
  }
  return null;
}
