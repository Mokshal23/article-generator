export interface ArticleSection {
  id: string;
  heading?: string;
  content: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  targetWordCount: number;
  actualWordCount: number;
  readingTimeMinutes: number;
  content: string;
  sections?: ArticleSection[];
  createdAt: number;
  isFavorite?: boolean;
  thesis?: string;
  tone?: string;
  frameworks?: string[];
}

export interface VocabItem {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  etymology?: string;
  example?: string;
  articleId?: string;
  articleTitle?: string;
  savedAt: number;
}

export interface ReaderPreferences {
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  columnWidth: 'narrow' | 'medium' | 'wide';
}
