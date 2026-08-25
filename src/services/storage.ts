import type { Article, VocabItem, ReaderPreferences } from '../types/article';
import { DEFAULT_ARTICLES } from '../data/defaultArticles';

const ARTICLES_KEY = 'aeoncat_saved_articles_v1';
const VOCAB_KEY = 'aeoncat_vocab_bank_v1';
const PREFS_KEY = 'aeoncat_reader_prefs_v1';
const API_KEY_KEY = 'aeoncat_gemini_api_key';
const MODEL_KEY = 'aeoncat_gemini_model';

export function getSavedArticles(): Article[] {
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    if (!raw) {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(DEFAULT_ARTICLES));
      return DEFAULT_ARTICLES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ARTICLES;
  }
}

export function saveArticle(article: Article): void {
  const articles = getSavedArticles();
  const existingIndex = articles.findIndex(a => a.id === article.id);
  if (existingIndex >= 0) {
    articles[existingIndex] = article;
  } else {
    articles.unshift(article);
  }
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

export function deleteArticle(id: string): void {
  const articles = getSavedArticles().filter(a => a.id !== id);
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

export function getSavedVocab(): VocabItem[] {
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVocabItem(item: Omit<VocabItem, 'id' | 'savedAt'>): VocabItem {
  const list = getSavedVocab();
  const existing = list.find(v => v.word.toLowerCase() === item.word.toLowerCase());
  if (existing) return existing;

  const newItem: VocabItem = {
    ...item,
    id: 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    savedAt: Date.now(),
  };
  list.unshift(newItem);
  localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
  return newItem;
}

export function deleteVocabItem(id: string): void {
  const list = getSavedVocab().filter(v => v.id !== id);
  localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
}

export const DEFAULT_PREFS: ReaderPreferences = {
  fontSize: 'lg',
  fontFamily: 'serif',
  lineSpacing: 'relaxed',
  columnWidth: 'medium',
};

export function getReaderPrefs(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveReaderPrefs(prefs: ReaderPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Retrieves API key: checks localStorage first, then falls back to VITE_GEMINI_API_KEY env variable
export function getEffectiveApiKey(): string {
  const stored = localStorage.getItem(API_KEY_KEY);
  if (stored && stored.trim()) return stored.trim();

  // Vercel / Vite env variable fallback
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  return '';
}

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function saveStoredApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key.trim());
}

export function hasEnvApiKey(): boolean {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return !!(envKey && typeof envKey === 'string' && envKey.trim());
}

export function getStoredModel(): string {
  const model = localStorage.getItem(MODEL_KEY);
  if (!model || model.includes('2.0-flash-lite') || model.includes('1.5-pro')) {
    return 'gemini-3.5-flash-lite';
  }
  return model;
}

export function saveStoredModel(model: string): void {
  localStorage.setItem(MODEL_KEY, model.trim());
}
