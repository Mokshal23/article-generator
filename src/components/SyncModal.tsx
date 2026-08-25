import React, { useState, useEffect } from 'react';
import { X, Cloud, RefreshCw, Check, Copy, Laptop, Tablet, Link2, PlusCircle } from 'lucide-react';
import { getStoredVaultId, saveStoredVaultId, pullFromVault, createNewVault, getLastSyncTime } from '../services/cloudSync';
import type { Article, VocabItem } from '../types/article';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: (articles: Article[], vocab: VocabItem[]) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncCompleted }) => {
  const [vaultId, setVaultId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setVaultId(getStoredVaultId());
    setLastSync(getLastSyncTime());
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareableUrl = vaultId ? `${currentUrl}?vault=${vaultId}` : '';

  const handleCreateVault = async () => {
    setIsSyncing(true);
    setErrorMsg('');
    try {
      const newId = await createNewVault();
      setVaultId(newId);
      setSyncSuccess(true);
      setLastSync(Date.now());
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create cloud vault.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = vaultId.trim();
    if (!cleanId) return;

    setIsSyncing(true);
    setErrorMsg('');

    try {
      saveStoredVaultId(cleanId);
      const result = await pullFromVault(cleanId);
      if (result) {
        setSyncSuccess(true);
        setLastSync(Date.now());
        onSyncCompleted(result.articles, result.vocab);
        setTimeout(() => setSyncSuccess(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed. Please check the Vault ID.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleCopyCode = () => {
    if (!vaultId) return;
    navigator.clipboard.writeText(vaultId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
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

        {/* Sync Device Illustration */}
        <div className="mb-4 p-3 rounded-lg bg-[#11141d] border border-[#1d2232] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-slate-300" />
            <span>Desktop</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
            <span>──</span>
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>──</span>
          </div>
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-slate-300" />
            <span>iPad / Phone</span>
          </div>
        </div>

        {/* Action: Create or Connect */}
        {!vaultId ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              To sync your articles between desktop and iPad, create a cloud vault or paste an existing Vault ID from your other device.
            </p>

            <button
              onClick={handleCreateVault}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#191f2e] hover:bg-[#232b40] text-slate-100 border border-[#2b354e] text-xs transition-colors"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Create New Cloud Vault</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#181b26]"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-600">OR CONNECT EXISTING</span>
              <div className="flex-grow border-t border-[#181b26]"></div>
            </div>

            <form onSubmit={handleConnectAndSync} className="space-y-3">
              <input
                type="text"
                value={vaultId}
                onChange={(e) => setVaultId(e.target.value)}
                placeholder="Paste Vault ID here..."
                className="w-full bg-[#11131b] border border-[#1e2230] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <button
                type="submit"
                disabled={isSyncing || !vaultId.trim()}
                className="w-full py-2 rounded-lg bg-[#141722] hover:bg-[#1c2130] text-slate-200 border border-[#202538] text-xs transition-colors disabled:opacity-50"
              >
                Connect Vault
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-light">Your Active Vault ID</label>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#11131b] border border-[#1e2230] font-mono text-xs text-slate-300 truncate">
                {vaultId}
              </div>
            </div>

            {/* Quick 1-Click Link for iPad */}
            <div className="p-3 rounded-lg bg-[#121622] border border-[#1e2538] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Link for iPad:</span>
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                Send or open this link on your iPad to connect automatically without typing!
              </p>
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
                type="button"
                onClick={() => pullFromVault(vaultId).then((res) => res && onSyncCompleted(res.articles, res.vocab))}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#1d2232] hover:bg-[#272d42] text-slate-100 border border-[#2e354e] text-xs font-light transition-colors"
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
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
