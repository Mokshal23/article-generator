import React, { useState, useEffect } from 'react';
import { X, KeyRound, Check, ExternalLink, Cpu, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey, getStoredModel, saveStoredModel, hasEnvApiKey, getEffectiveApiKey } from '../services/storage';
import { fetchAvailableModels } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]);
  const [saved, setSaved] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const isEnvActive = hasEnvApiKey();

  useEffect(() => {
    const key = getStoredApiKey();
    setApiKey(key);
    setSelectedModel(getStoredModel());

    const effective = getEffectiveApiKey();
    if (effective) {
      setIsLoadingModels(true);
      fetchAvailableModels(effective).then((models) => {
        if (models.length > 0) {
          setAvailableModels(models);
          if (!models.includes(getStoredModel())) {
            setSelectedModel(models[0]);
          }
        }
        setIsLoadingModels(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredApiKey(apiKey);
    saveStoredModel(selectedModel);
    setSaved(true);
    onKeySaved();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0c0e14] border border-[#1c202e] rounded-xl p-5 shadow-2xl text-slate-300">
        
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">Gemini Model & API Key</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isEnvActive && !apiKey && (
          <div className="mb-3 p-2.5 rounded-lg bg-[#101b17] border border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-300 font-light">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Vercel Environment Variable (<code>VITE_GEMINI_API_KEY</code>) is active across all devices.</span>
          </div>
        )}

        <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
          {isEnvActive && !apiKey
            ? 'You do not need to enter a key. An environment key is connected. You can still enter a custom key below to override it.'
            : 'Your key is saved locally in your browser. Or set VITE_GEMINI_API_KEY on Vercel to use automatically on all devices.'}
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-light mb-1">API Key (Optional Override)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEnvActive ? 'Using Vercel Environment Key' : 'AIzaSy...'}
              className="w-full bg-[#11131b] border border-[#1e2230] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400 font-light flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span>Active Model</span>
              </label>
              {isLoadingModels && (
                <span className="text-[10px] text-slate-500 font-light animate-pulse">Checking available models...</span>
              )}
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#11131b] border border-[#1e2230] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>Get a free Gemini API key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md hover:bg-[#161824] text-slate-400 text-xs font-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 rounded-md bg-[#1d2232] hover:bg-[#272d42] text-slate-100 border border-[#2e354e] text-xs font-light transition-colors"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{saved ? 'Saved' : 'Save & Connect'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
