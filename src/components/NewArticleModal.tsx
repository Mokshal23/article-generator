import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { generateCatArticle } from '../services/gemini';
import type { Article } from '../types/article';
import { saveArticle } from '../services/storage';

interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleGenerated: (article: Article) => void;
  hasApiKey: boolean;
  onOpenApiKey: () => void;
}

const SAMPLE_TOPICS = [
  'Comparative somnology: Apple Watch vs Whoop vs Fitbit accuracy',
  'The ethics of artificial moral agency and autonomous weapons',
  'Heuristics, bounded rationality, and algorithmic nudge architecture',
  'The evolutionary origins of syntactic recursion in human language',
  'Critique of the commodification of attention in digital economies',
  'Epistemic opacity and explainability in deep neural networks',
];

export const NewArticleModal: React.FC<NewArticleModalProps> = ({
  isOpen,
  onClose,
  onArticleGenerated,
  hasApiKey,
  onOpenApiKey,
}) => {
  const [topic, setTopic] = useState('');
  const [targetWordCount, setTargetWordCount] = useState<number>(2500);
  const [genre] = useState('Academic Epistemology & Technology');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (!hasApiKey) {
      setErrorMessage('Please configure your Gemini API Key first to generate custom articles.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setStatusMessage('Initiating deep domain research...');

    try {
      const article = await generateCatArticle({
        topic: topic.trim(),
        targetWordCount,
        genre,
        onProgress: (status) => setStatusMessage(status),
      });

      saveArticle(article);
      onArticleGenerated(article);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0d0f16] border border-[#1f2332] rounded-xl p-5 sm:p-6 shadow-2xl text-slate-300">
        
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#181b26]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
            <h2 className="text-base font-serif text-slate-100 font-normal">Generate CAT-Level Long-Form Essay</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!hasApiKey && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a1712] border border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-300 font-light">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>A Gemini API key is needed to run live generation on custom topics.</span>
              <button
                type="button"
                onClick={onOpenApiKey}
                className="ml-1 text-amber-200 underline hover:text-white"
              >
                Set API Key
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          
          <div>
            <label className="block text-xs text-slate-400 font-light mb-1.5">
              Topic or Intellectual Inquiry
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How Apple Watch does sleep tracking vs Whoop and Fitbit, accuracy, PSG comparison and differences..."
              disabled={isGenerating}
              className="w-full bg-[#12141e] border border-[#202535] rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 font-light resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5 font-light">
              <Compass className="w-3 h-3" />
              <span>Prompt Ideas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="px-2 py-1 rounded bg-[#131622] hover:bg-[#1b1f30] text-[11px] text-slate-400 hover:text-slate-200 border border-[#1c2132] transition-colors text-left truncate max-w-full"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-light mb-1.5">
              Target Length & Rigor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 1200, label: '~1,200 Words', desc: 'Dense Treatise' },
                { count: 2000, label: '~2,000 Words', desc: 'In-Depth Essay' },
                { count: 3000, label: '~3,000 Words', desc: 'Exhaustive Long-form' },
              ].map((tier) => (
                <button
                  key={tier.count}
                  type="button"
                  onClick={() => setTargetWordCount(tier.count)}
                  className={'p-2.5 rounded-lg border text-left transition-colors ' + (
                    targetWordCount === tier.count
                      ? 'bg-[#181c2b] border-slate-500 text-slate-100'
                      : 'bg-[#11131c] border-[#1c202e] text-slate-400 hover:bg-[#161824]'
                  )}
                >
                  <div className="text-xs font-normal">{tier.label}</div>
                  <div className="text-[10px] text-slate-500 font-light">{tier.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {isGenerating && (
            <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2336] text-xs text-slate-300 font-light space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                <span>{statusMessage}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Synthesizing high-density syntactic structures and empirical evidence...
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-300 font-light">
              {errorMessage}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-md hover:bg-[#161824] text-slate-400 text-xs font-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="px-4 py-1.5 rounded-md bg-[#1d2232] hover:bg-[#272d42] text-slate-100 border border-[#2e354e] text-xs font-light transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Writing...' : 'Generate Essay'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
