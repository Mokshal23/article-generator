import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReaderView } from './components/ReaderView';
import { NewArticleModal } from './components/NewArticleModal';
import { LibraryDrawer } from './components/LibraryDrawer';
import { VocabBankModal } from './components/VocabBankModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import type { Article, ReaderPreferences, VocabItem } from './types/article';
import {
  getSavedArticles,
  getSavedVocab,
  deleteVocabItem,
  deleteArticle,
  getReaderPrefs,
  saveReaderPrefs,
  getEffectiveApiKey,
} from './services/storage';

export const App: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [prefs, setPrefs] = useState<ReaderPreferences>(getReaderPrefs());
  const [hasApiKey, setHasApiKey] = useState(false);

  const [isNewArticleOpen, setIsNewArticleOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  useEffect(() => {
    const saved = getSavedArticles();
    setArticles(saved);
    if (saved.length > 0) {
      setCurrentArticle(saved[0]);
    }
    setVocabList(getSavedVocab());
    setHasApiKey(!!getEffectiveApiKey());
  }, []);

  const refreshVocab = () => {
    setVocabList(getSavedVocab());
  };

  const handleUpdatePrefs = (newPrefs: ReaderPreferences) => {
    setPrefs(newPrefs);
    saveReaderPrefs(newPrefs);
  };

  const handleArticleGenerated = (newArticle: Article) => {
    const updated = getSavedArticles();
    setArticles(updated);
    setCurrentArticle(newArticle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = (id: string) => {
    deleteArticle(id);
    const updated = getSavedArticles();
    setArticles(updated);
    if (currentArticle?.id === id) {
      setCurrentArticle(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleDeleteVocab = (id: string) => {
    deleteVocabItem(id);
    refreshVocab();
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#cbd5e1] flex flex-col antialiased selection:bg-[#202534] selection:text-white">
      <Navbar
        currentArticle={currentArticle}
        onNewArticle={() => setIsNewArticleOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenVocab={() => {
          refreshVocab();
          setIsVocabOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        hasApiKey={hasApiKey}
        vocabCount={vocabList.length}
      />

      <main className="flex-1">
        {currentArticle ? (
          <ReaderView
            article={currentArticle}
            prefs={prefs}
            onNewArticle={() => setIsNewArticleOpen(true)}
          />
        ) : (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <h2 className="text-xl font-serif text-slate-200 mb-2 font-normal">No essays found</h2>
            <p className="text-xs text-slate-500 font-light mb-6">Create a new CAT essay on any topic you are curious about.</p>
            <button
              onClick={() => setIsNewArticleOpen(true)}
              className="px-4 py-2 rounded-md bg-[#161924] hover:bg-[#1f2433] text-slate-200 border border-[#232738] text-xs font-light transition-colors"
            >
              Generate New Essay
            </button>
          </div>
        )}
      </main>

      <NewArticleModal
        isOpen={isNewArticleOpen}
        onClose={() => setIsNewArticleOpen(false)}
        onArticleGenerated={handleArticleGenerated}
        hasApiKey={hasApiKey}
        onOpenApiKey={() => {
          setIsNewArticleOpen(false);
          setIsApiKeyOpen(true);
        }}
      />

      <LibraryDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        articles={articles}
        currentArticleId={currentArticle?.id || ''}
        onSelectArticle={(art) => setCurrentArticle(art)}
        onDeleteArticle={handleDeleteArticle}
      />

      <VocabBankModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        vocabList={vocabList}
        onDeleteVocab={handleDeleteVocab}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prefs={prefs}
        onUpdatePrefs={handleUpdatePrefs}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onKeySaved={() => setHasApiKey(!!getEffectiveApiKey())}
      />
    </div>
  );
};
