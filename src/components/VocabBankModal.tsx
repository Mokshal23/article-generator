import React, { useState } from 'react';
import { X, BookA, Trash2, Volume2, Search, Download } from 'lucide-react';
import type { VocabItem } from '../types/article';

interface VocabBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabList: VocabItem[];
  onDeleteVocab: (id: string) => void;
}

export const VocabBankModal: React.FC<VocabBankModalProps> = ({
  isOpen,
  onClose,
  vocabList,
  onDeleteVocab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = vocabList.filter(
    (v) =>
      v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playPronunciation = (word: string) => {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabList, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "aeoncat_vocab_deck.json");
    dlAnchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 sm:p-6 shadow-2xl h-[80vh] flex flex-col text-slate-300">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <BookA className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">CAT Vocabulary Deck ({vocabList.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            {vocabList.length > 0 && (
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#131620] hover:bg-[#1a1e2d] text-slate-400 hover:text-slate-200 text-xs border border-[#1e2232] transition-colors"
                title="Export Vocab JSON"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="py-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved vocabulary..."
              className="w-full bg-[#11131b] border border-[#1b1e2a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 font-light"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-light text-xs">
              {vocabList.length === 0
                ? 'No vocabulary saved yet. Click on any word in the essay to look up and save.'
                : 'No matching words found.'}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg bg-[#11131b] border border-[#1c1f2c] hover:border-[#282d40] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-serif text-slate-100 font-normal">{item.word}</span>
                    {item.partOfSpeech && (
                      <span className="px-1.5 py-0.2 rounded bg-[#171a26] text-[10px] text-slate-400 italic">
                        {item.partOfSpeech}
                      </span>
                    )}
                    <button
                      onClick={() => playPronunciation(item.word)}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteVocab(item.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove from deck"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-slate-300 font-light leading-relaxed">
                  {item.definition}
                </p>

                {item.etymology && (
                  <p className="mt-1 text-[11px] text-slate-500 font-light">
                    <span className="text-slate-400">Etymology:</span> {item.etymology}
                  </p>
                )}

                {item.articleTitle && (
                  <p className="mt-2 text-[10px] text-slate-600 font-light truncate">
                    From: {item.articleTitle}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
