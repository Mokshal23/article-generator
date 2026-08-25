import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Check, Cloud, Database, CheckCircle2 } from 'lucide-react';
import {
  getStoredVaultId,
  saveStoredVaultId,
  pullFromCloudBlob,
  pushToCloudBlob,
  getLastSyncTime,
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
  const [vaultId, setVaultId] = useState('mokshal-vault');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setVaultId(getStoredVaultId() || 'mokshal-vault');
    setLastSync(getLastSyncTime());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setErrorMsg('');
    try {
      saveStoredVaultId(vaultId);
      // Push first to make sure current device data is in Blob
      await pushToCloudBlob(vaultId);
      // Then pull and merge
      const result = await pullFromCloudBlob(vaultId);
      if (result) {
        setSyncSuccess(true);
        setLastSync(Date.now());
        onSyncCompleted(result.articles, result.vocab);
        setTimeout(() => setSyncSuccess(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (ts: number) => {
    if (!ts) return 'Never';
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 sm:p-6 shadow-2xl text-slate-300 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">
              Vercel Blob Cloud Sync
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="p-3 rounded-lg bg-[#101b17] border border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-300 font-light">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-normal text-emerald-200">Vercel Blob Storage Connected</div>
            <div className="text-[11px] text-emerald-400/80">
              Articles and vocabulary sync automatically in the background across all your devices.
            </div>
          </div>
        </div>

        {syncSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300 font-light">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Synced successfully with Vercel Blob!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-300 font-light">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 font-light mb-1">
              Private Sync Vault ID
            </label>
            <input
              type="text"
              value={vaultId}
              onChange={(e) => setVaultId(e.target.value)}
              placeholder="mokshal-vault"
              className="w-full bg-[#11131b] border border-[#1e2230] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-500 font-light">
              Both your Desktop and iPad share this Vault ID: <code>{vaultId}</code>.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-light pt-1">
            <span>Library: {articleCount} essays</span>
            <span>Last sync: {formatTime(lastSync)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md hover:bg-[#161824] text-slate-400 text-xs font-light transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#1d2232] hover:bg-[#272d42] text-slate-100 border border-[#2e354e] text-xs font-light transition-colors"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
                <span>Syncing...</span>
              </>
            ) : syncSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Synced!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
