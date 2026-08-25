import React from 'react';
import { X, Bookmark, Trash2, Check } from 'lucide-react';
import type { Article } from '../types/article';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  currentArticleId: string;
  onSelectArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
}

export const LibraryDrawer: React.FC<LibraryDrawerProps> = ({
  isOpen,
  onClose,
  articles,
  currentArticleId,
  onSelectArticle,
  onDeleteArticle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#0c0e14] border-l border-[#191c28] h-full flex flex-col p-5 shadow-2xl text-slate-300">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">Essay Library</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {articles.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-light text-xs">
              No saved essays yet.
            </div>
          ) : (
            articles.map((art) => {
              const isSelected = art.id === currentArticleId;
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    onSelectArticle(art);
                    onClose();
                  }}
                  className={'p-3.5 rounded-lg border cursor-pointer transition-colors relative group ' + (
                    isSelected
                      ? 'bg-[#141722] border-slate-600/70 text-slate-100'
                      : 'bg-[#10121a] border-[#1b1e2a] hover:bg-[#151722] text-slate-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-serif font-normal leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    {isSelected && (
                      <span className="p-1 text-slate-400 shrink-0">
                        <Check className="w-3.5 h-3.5 text-slate-300" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-light">
                    <div className="flex items-center gap-2">
                      <span>{art.actualWordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{art.readingTimeMinutes} min</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArticle(art.id);
                      }}
                      title="Delete Essay"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
