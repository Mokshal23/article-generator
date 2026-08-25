import React, { useState, useEffect } from 'react';
import { X, Cloud, RefreshCw, Check, Copy, Laptop, Tablet } from 'lucide-react';
import { getStoredSyncCode, saveStoredSyncCode, pullFromCloudVault, getLastSyncTime } from '../services/cloudSync';
import type { Article, VocabItem } from '../types/article';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: (articles: Article[], vocab: VocabItem[]) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncCompleted }) => {
  const [syncCode, setSyncCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSyncCode(getStoredSyncCode());
    setLastSync(getLastSyncTime());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = syncCode.trim().toLowerCase();
    if (!cleanCode) return;

    setIsSyncing(true);
    setErrorMsg('');

    try {
      saveStoredSyncCode(cleanCode);
      const result = await pullFromCloudVault(cleanCode);
      if (result) {
        setSyncSuccess(true);
        setLastSync(Date.now());
        onSyncCompleted(result.articles, result.vocab);
        setTimeout(() => setSyncSuccess(false), 2000);
      } else {
        setErrorMsg('Sync reached cloud vault but received an unexpected response. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const generateRandomCode = () => {
    const random = 'vault-' + Math.random().toString(36).substring(2, 7);
    setSyncCode(random);
  };

  const formatTime = (ts: number) => {
    if (!ts) return 'Never synced';
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 shadow-2xl text-slate-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">Cross-Device Cloud Sync</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagram explanation */}
        <div className="mb-4 p-3 rounded-lg bg-[#11141d] border border-[#1d2232] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-slate-300" />
            <span>Desktop</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
            <span>──</span>
            <RefreshCw className="w-3 h-3 text-emerald-400/80 animate-spin-slow" />
            <span>──</span>
          </div>
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-slate-300" />
            <span>iPad / Phone</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
          Type the same <strong>Sync Code</strong> on both your desktop and iPad. All articles and vocabulary will sync automatically in real time.
        </p>

        <form onSubmit={handleConnectAndSync} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400 font-light">Sync Code</label>
              {!syncCode && (
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                >
                  Generate random code
                </button>
              )}
            </div>
            
            <div className="relative flex items-center">
              <input
                type="text"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder="e.g. mokshal-vault"
                className="w-full bg-[#11131b] border border-[#1e2230] rounded-lg px-3 py-2 pr-16 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 font-mono"
              />
              {syncCode && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-light">
            <span>Last synced: {formatTime(lastSync)}</span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-xs text-red-300 font-light">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md hover:bg-[#161824] text-slate-400 text-xs font-light transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSyncing || !syncCode.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#1d2232] hover:bg-[#272d42] text-slate-100 border border-[#2e354e] text-xs font-light transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-300" />
                  <span>Syncing...</span>
                </>
              ) : syncSuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Synced!</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3" />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
