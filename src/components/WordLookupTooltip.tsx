import React from 'react';
import { BookmarkPlus, Check, Volume2, X } from 'lucide-react';
import type { DefinitionResult } from '../services/dictionary';

interface WordLookupTooltipProps {
  result: DefinitionResult | null;
  isLoading: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onSaveToVocab: (result: DefinitionResult) => void;
  isSaved: boolean;
}

export const WordLookupTooltip: React.FC<WordLookupTooltipProps> = ({
  result,
  isLoading,
  position,
  onClose,
  onSaveToVocab,
  isSaved,
}) => {
  if (!position) return null;

  const playPronunciation = () => {
    if (!result?.word) return;
    try {
      const utterance = new SpeechSynthesisUtterance(result.word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn(e);
    }
  };

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const leftPos = Math.min(Math.max(16, position.x - 140), screenWidth - 320);

  return (
    <div
      style={{ top: (position.y + 12) + 'px', left: leftPos + 'px' }}
      className="fixed z-50 w-72 sm:w-80 bg-[#0f1118] border border-[#222738] shadow-2xl rounded-lg p-3.5 text-xs text-slate-300 backdrop-blur-md"
    >
      <div className="flex items-start justify-between pb-2 mb-2 border-b border-[#1c202e]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-100 font-serif tracking-wide">{result?.word}</span>
          {result?.phonetic && (
            <span className="text-[11px] text-slate-500 font-mono">{result.phonetic}</span>
          )}
          {result?.word && (
            <button
              onClick={playPronunciation}
              className="p-1 hover:text-slate-100 text-slate-500 transition-colors"
              title="Pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-slate-500 font-light">Retrieving lexicon analysis...</div>
      ) : result ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#181d2b] text-[10px] text-slate-400 italic">
              {result.partOfSpeech}
            </span>
          </div>

          <p className="text-slate-300 font-light leading-relaxed text-[12px]">
            {result.definition}
          </p>

          {result.etymology && (
            <div className="pt-1 text-[11px] text-slate-500 font-light">
              <span className="text-slate-400">Etymology:</span> {result.etymology}
            </div>
          )}

          {result.example && (
            <div className="pt-1 text-[11px] text-slate-400 italic bg-[#141722] p-1.5 rounded border border-[#1b202e]">
              "{result.example}"
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onSaveToVocab(result)}
              disabled={isSaved}
              className={'flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ' + (
                isSaved
                  ? 'bg-[#18211f] text-emerald-400 border border-emerald-900/50 cursor-default'
                  : 'bg-[#161a26] hover:bg-[#202638] text-slate-200 border border-[#252a3d]'
              )}
            >
              {isSaved ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Saved in Bank</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3 h-3 text-slate-400" />
                  <span>Save to Vocab Bank</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-2 text-slate-500 font-light text-center">
          No explicit dictionary definition found.
        </div>
      )}
    </div>
  );
};
