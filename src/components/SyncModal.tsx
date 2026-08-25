import React, { useState, useRef } from 'react';
import { X, Check, Copy, Download, Upload, Share2, FileCode, CheckCircle2 } from 'lucide-react';
import {
  exportVaultToString,
  importVaultFromString,
} from '../services/cloudSync';
import type { Article, VocabItem } from '../types/article';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: (articles: Article[], vocab: VocabItem[]) => void;
  articleCount: number;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
  articleCount,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export as File (.json)
  const handleDownloadFile = () => {
    const jsonStr = exportVaultToString();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeoncat_library_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Copy Raw JSON to Clipboard (for instant paste on iPad)
  const handleCopyJson = () => {
    const jsonStr = exportVaultToString();
    navigator.clipboard.writeText(jsonStr);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 3. Import from File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importVaultFromString(text);
        onSyncCompleted(res.articles, res.vocab);
        setImportSuccessMsg(`Successfully imported ${res.articles.length} essays into your library!`);
        setTimeout(() => setImportSuccessMsg(''), 4000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  // 4. Import from Paste
  const handlePasteImport = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.includes('articles')) {
        setErrorMsg('Clipboard does not contain valid AeonCAT library data.');
        return;
      }
      const res = importVaultFromString(clipText);
      onSyncCompleted(res.articles, res.vocab);
      setImportSuccessMsg(`Successfully imported ${res.articles.length} essays into your library!`);
      setTimeout(() => setImportSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Could not read clipboard. Please upload the .json file instead.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 sm:p-6 shadow-2xl text-slate-300 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">
              Transfer & Sync Library ({articleCount} Essays)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {importSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300 font-light">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-300 font-light">
            {errorMsg}
          </div>
        )}

        {/* METHOD 1: Export from Desktop */}
        <div className="p-3.5 rounded-lg bg-[#11131c] border border-[#1d202e] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Step 1: Export from Desktop</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/40">
              100% Reliable
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-light leading-relaxed">
            Download your library file (to AirDrop / message to iPad) or copy the raw library text to clipboard.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadFile}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#161924] hover:bg-[#1f2434] text-slate-200 border border-[#232738] text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json File</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#161924] hover:bg-[#1f2434] text-slate-200 border border-[#232738] text-xs transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Library Data'}</span>
            </button>
          </div>
        </div>

        {/* METHOD 2: Import on iPad */}
        <div className="p-3.5 rounded-lg bg-[#11131c] border border-[#1d202e] space-y-2.5">
          <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Step 2: Import on iPad</span>
          </span>

          <p className="text-[11px] text-slate-400 font-light leading-relaxed">
            On your iPad, open this popup and click either button below to load your desktop essays instantly:
          </p>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#181d2c] hover:bg-[#22293e] text-slate-100 border border-[#273047] text-xs transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-300" />
              <span>Choose .json File</span>
            </button>

            <button
              onClick={handlePasteImport}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#181d2c] hover:bg-[#22293e] text-slate-100 border border-[#273047] text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Paste from Clipboard</span>
            </button>
          </div>
        </div>

        {/* Close */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#151722] hover:bg-[#1c1f2d] text-slate-300 text-xs font-light transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
