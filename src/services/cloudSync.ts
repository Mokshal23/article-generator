import type { Article, VocabItem } from '../types/article';
import { getSavedArticles, getSavedVocab } from './storage';

const VAULT_ID_KEY = 'aeoncat_vault_id_v3';
const LAST_SYNC_KEY = 'aeoncat_last_sync_time_v3';

export interface VaultData {
  articles: Article[];
  vocab: VocabItem[];
  exportedAt: number;
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

// Generate a full export JSON string
export function exportVaultToString(): string {
  const data: VaultData = {
    articles: getSavedArticles(),
    vocab: getSavedVocab(),
    exportedAt: Date.now(),
  };
  return JSON.stringify(data);
}

// Import from a raw JSON string and merge
export function importVaultFromString(jsonStr: string): {
  articles: Article[];
  vocab: VocabItem[];
  addedCount: number;
} {
  const parsed: VaultData = JSON.parse(jsonStr);
  if (!parsed || !Array.isArray(parsed.articles)) {
    throw new Error('Invalid vault JSON format.');
  }

  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  const articlesMap = new Map<string, Article>();
  localArticles.forEach((a) => articlesMap.set(a.id, a));

  let addedCount = 0;
  parsed.articles.forEach((importedArt) => {
    if (!articlesMap.has(importedArt.id)) {
      addedCount++;
      articlesMap.set(importedArt.id, importedArt);
    } else {
      // Overwrite if newer
      const existing = articlesMap.get(importedArt.id);
      if (importedArt.createdAt > (existing?.createdAt || 0)) {
        articlesMap.set(importedArt.id, importedArt);
      }
    }
  });

  const mergedArticles = Array.from(articlesMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  const vocabMap = new Map<string, VocabItem>();
  localVocab.forEach((v) => vocabMap.set(v.word.toLowerCase(), v));
  if (Array.isArray(parsed.vocab)) {
    parsed.vocab.forEach((iv) => {
      if (!vocabMap.has(iv.word.toLowerCase())) {
        vocabMap.set(iv.word.toLowerCase(), iv);
      }
    });
  }

  const mergedVocab = Array.from(vocabMap.values()).sort(
    (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
  );

  localStorage.setItem('aeoncat_saved_articles_v1', JSON.stringify(mergedArticles));
  localStorage.setItem('aeoncat_vocab_bank_v1', JSON.stringify(mergedVocab));
  setLastSyncTime(Date.now());

  return {
    articles: mergedArticles,
    vocab: mergedVocab,
    addedCount,
  };
}

// Push to Vercel internal /api/sync endpoint
export async function syncWithVercelServer(vaultId: string): Promise<VaultData | null> {
  const localArticles = getSavedArticles();
  const localVocab = getSavedVocab();

  try {
    const postRes = await fetch(`/api/sync?vault=${encodeURIComponent(vaultId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vaultId,
        articles: localArticles,
        vocab: localVocab,
        updatedAt: Date.now(),
      }),
    });

    if (postRes.ok) {
      setLastSyncTime(Date.now());
      saveStoredVaultId(vaultId);
      return {
        articles: localArticles,
        vocab: localVocab,
        exportedAt: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Vercel serverless sync note:', err);
  }

  return null;
}
