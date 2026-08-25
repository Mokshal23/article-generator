import React from 'react';
import { BookOpen, Plus, Bookmark, BookA, SlidersHorizontal, KeyRound } from 'lucide-react';
import type { Article } from '../types/article';

interface NavbarProps {
  currentArticle: Article | null;
  onNewArticle: () => void;
  onOpenLibrary: () => void;
  onOpenVocab: () => void;
  onOpenSettings: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
  vocabCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentArticle,
  onNewArticle,
  onOpenLibrary,
  onOpenVocab,
  onOpenSettings,
  onOpenApiKey,
  hasApiKey,
  vocabCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#090a0f]/95 backdrop-blur-md border-b border-[#161822] transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenLibrary}>
            <div className="w-7 h-7 rounded bg-[#161924] border border-[#232738] flex items-center justify-center text-slate-300">
              <BookOpen className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
            </div>
            <span className="font-serif tracking-tight text-slate-200 text-base font-normal">
              Aeon<span className="text-slate-400 font-light">CAT</span>
            </span>
          </div>

          {currentArticle && (
            <div className="hidden md:flex items-center gap-2 pl-3 ml-2 border-l border-[#1c202d] text-xs text-slate-400 font-light">
              <span className="truncate max-w-[280px] text-slate-300">{currentArticle.title}</span>
              <span className="text-slate-600">•</span>
              <span>{currentArticle.actualWordCount.toLocaleString()} words</span>
              <span className="text-slate-600">•</span>
              <span>~{currentArticle.readingTimeMinutes} min read</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={onNewArticle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161924] hover:bg-[#1f2433] text-slate-200 hover:text-white border border-[#232738] text-xs font-light transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>New Essay</span>
          </button>

          <button
            onClick={onOpenLibrary}
            title="Library & History"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#161822] text-slate-400 hover:text-slate-200 text-xs font-light transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Library</span>
          </button>

          <button
            onClick={onOpenVocab}
            title="CAT Vocabulary Bank"
            className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#161822] text-slate-400 hover:text-slate-200 text-xs font-light transition-colors"
          >
            <BookA className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Vocab</span>
            {vocabCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#1c2130] text-[10px] text-slate-300 font-mono">
                {vocabCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            title="Reading Preferences"
            className="p-2 rounded-md hover:bg-[#161822] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <button
            onClick={onOpenApiKey}
            title={hasApiKey ? 'Gemini API Key Configured' : 'Configure Gemini API Key'}
            className={'p-2 rounded-md transition-colors ' + (
              hasApiKey
                ? 'text-slate-400 hover:text-slate-200 hover:bg-[#161822]'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
            )}
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

        </div>
      </div>
    </header>
  );
};
