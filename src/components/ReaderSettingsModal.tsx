import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import type { ReaderPreferences } from '../types/article';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: ReaderPreferences;
  onUpdatePrefs: (newPrefs: ReaderPreferences) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 shadow-2xl text-slate-300 space-y-4">
        
        <div className="flex items-center justify-between pb-2 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">Reader Preferences</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-400 font-light mb-1.5">Typeface</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'serif', label: 'Lora Serif', font: 'font-serif' },
              { id: 'sans', label: 'Inter Sans', font: 'font-sans' },
              { id: 'mono', label: 'Mono', font: 'font-mono' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdatePrefs({ ...prefs, fontFamily: f.id as any })}
                className={'py-2 px-2 rounded-lg border text-xs text-center transition-colors ' + f.font + ' ' + (
                  prefs.fontFamily === f.id
                    ? 'bg-[#181c2b] border-slate-500 text-slate-100'
                    : 'bg-[#11131c] border-[#1c202e] text-slate-400 hover:bg-[#161824]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 font-light mb-1.5">Text Size</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'sm', label: 'Small' },
              { id: 'base', label: 'Medium' },
              { id: 'lg', label: 'Large' },
              { id: 'xl', label: 'X-Large' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => onUpdatePrefs({ ...prefs, fontSize: s.id as any })}
                className={'py-1.5 rounded-lg border text-xs text-center transition-colors ' + (
                  prefs.fontSize === s.id
                    ? 'bg-[#181c2b] border-slate-500 text-slate-100'
                    : 'bg-[#11131c] border-[#1c202e] text-slate-400 hover:bg-[#161824]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 font-light mb-1.5">Line Spacing</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Compact' },
              { id: 'relaxed', label: 'Relaxed' },
              { id: 'loose', label: 'Spacious' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => onUpdatePrefs({ ...prefs, lineSpacing: l.id as any })}
                className={'py-1.5 rounded-lg border text-xs text-center transition-colors ' + (
                  prefs.lineSpacing === l.id
                    ? 'bg-[#181c2b] border-slate-500 text-slate-100'
                    : 'bg-[#11131c] border-[#1c202e] text-slate-400 hover:bg-[#161824]'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 font-light mb-1.5">Reading Column Width</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'narrow', label: 'Narrow' },
              { id: 'medium', label: 'Standard' },
              { id: 'wide', label: 'Wide' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => onUpdatePrefs({ ...prefs, columnWidth: w.id as any })}
                className={'py-1.5 rounded-lg border text-xs text-center transition-colors ' + (
                  prefs.columnWidth === w.id
                    ? 'bg-[#181c2b] border-slate-500 text-slate-100'
                    : 'bg-[#11131c] border-[#1c202e] text-slate-400 hover:bg-[#161824]'
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
