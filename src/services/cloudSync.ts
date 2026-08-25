import type { Article, VocabItem } from '../types/article';
import { getSavedArticles, getSavedVocab } from './storage';

const VAULT_ID_KEY = 'aeoncat_vault_id_v2';
const LAST_SYNC_KEY = 'aeoncat_last_sync_time_v2';
const CLOUD_API_URL = 'https://api.restful-api.dev/objects';

export interface CloudVaultPayload {
  articles: Article[];
  vocab: VocabItem[];
  updatedAt: number;
}

export function getStoredVaultId(): string {
  return localStorage.getItem(VAULT_ID_KEY) || '';
}

export function saveStoredVaultId(id: string): void {
  localStorage.setItem(VAULT_ID_KEY, id.trim());
}

export function getLastSyncTime(): number {
  const t = localStorage.getItem(LAST_SYNC_KEY);
  return t ? parseInt(t, 10) : 0;
}

export function setLastSyncTime(t: number): void {
  localStorage.setItem(LAST_SYNC_KEY, t.toString());
}

// Create a new cloud vault
export async function createNewVault(): Promise<string> {
  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const payload: CloudVaultPayload = {
    articles: localArticles,
    vocab: localVocab,
    updatedAt: Date.now(),
  };

  const res = await fetch(CLOUD_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'AeonCAT User Vault',
      data: payload,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to create cloud vault. Please try again.');
  }

  const created = await res.json();
  const vaultId = created.id;
  saveStoredVaultId(vaultId);
  setLastSyncTime(Date.now());
  return vaultId;
}

// Push local data to existing vault
export async function pushToVault(vaultId?: string): Promise<boolean> {
  const id = vaultId || getStoredVaultId();
  if (!id) return false;

  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const payload: CloudVaultPayload = {
    articles: localArticles,
    vocab: localVocab,
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(`${CLOUD_API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AeonCAT User Vault',
        data: payload,
      }),
    });

    if (res.ok) {
      setLastSyncTime(Date.now());
      return true;
    }
  } catch (err) {
    console.warn('Cloud sync push failed:', err);
  }
  return false;
}

// Pull cloud data from vault and merge
export async function pullFromVault(vaultId?: string): Promise<{
  articles: Article[];
  vocab: VocabItem[];
} | null> {
  const id = vaultId || getStoredVaultId();
  if (!id) return null;

  try {
    const res = await fetch(`${CLOUD_API_URL}/${id}`);
    if (!res.ok) {
      throw new Error(`Vault not found or expired (HTTP ${res.status})`);
    }

    const json = await res.json();
    const cloudPayload: CloudVaultPayload = json.data;

    if (!cloudPayload || !Array.isArray(cloudPayload.articles)) {
      return null;
    }

    const localArticles = getSavedArticles();
    const localVocab = getSavedVocab();

    // 1. Merge articles by ID
    const mergedArticlesMap = new Map<string, Article>();
    localArticles.forEach((a) => mergedArticlesMap.set(a.id, a));
    cloudPayload.articles.forEach((ca) => {
      const existing = mergedArticlesMap.get(ca.id);
      if (!existing || (ca.createdAt && ca.createdAt > (existing.createdAt || 0))) {
        mergedArticlesMap.set(ca.id, ca);
      }
    });

    const mergedArticles = Array.from(mergedArticlesMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    // 2. Merge vocab
    const mergedVocabMap = new Map<string, VocabItem>();
    localVocab.forEach((v) => mergedVocabMap.set(v.word.toLowerCase(), v));
    if (Array.isArray(cloudPayload.vocab)) {
      cloudPayload.vocab.forEach((cv) => {
        if (!mergedVocabMap.has(cv.word.toLowerCase())) {
          mergedVocabMap.set(cv.word.toLowerCase(), cv);
        }
      });
    }

    const mergedVocab = Array.from(mergedVocabMap.values()).sort(
      (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
    );

    // Persist locally
    localStorage.setItem('aeoncat_saved_articles_v1', JSON.stringify(mergedArticles));
    localStorage.setItem('aeoncat_vocab_bank_v1', JSON.stringify(mergedVocab));
    saveStoredVaultId(id);
    setLastSyncTime(Date.now());

    // Push back merged state
    await pushToVault(id);

    return {
      articles: mergedArticles,
      vocab: mergedVocab,
    };
  } catch (err: any) {
    console.warn('Cloud sync pull failed:', err);
    throw err;
  }
}
