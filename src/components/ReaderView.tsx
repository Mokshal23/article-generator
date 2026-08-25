import React, { useState, useEffect, useRef } from 'react';
import type { Article, ReaderPreferences } from '../types/article';
import { WordLookupTooltip } from './WordLookupTooltip';
import { lookupWord } from '../services/dictionary';
import type { DefinitionResult } from '../services/dictionary';
import { saveVocabItem, getSavedVocab } from '../services/storage';
import { Copy, Check, Clock, FileText, ChevronUp } from 'lucide-react';

interface ReaderViewProps {
  article: Article;
  prefs: ReaderPreferences;
  onNewArticle: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ article, prefs, onNewArticle }) => {
  const [activeWordData, setActiveWordData] = useState<DefinitionResult | null>(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = getSavedVocab();
    setSavedWords(list.map(v => v.word.toLowerCase()));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWordClick = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    const clean = word.toLowerCase().replace(/[^a-z]/g, '').trim();
    if (!clean || clean.length < 2) return;

    setPopupPos({ x: e.clientX, y: e.clientY });
    setWordLoading(true);
    const def = await lookupWord(clean);
    setActiveWordData(def);
    setWordLoading(false);
  };

  const handleCloseTooltip = () => {
    setPopupPos(null);
    setActiveWordData(null);
  };

  const handleSaveVocab = (res: DefinitionResult) => {
    saveVocabItem({
      word: res.word,
      definition: res.definition,
      partOfSpeech: res.partOfSpeech,
      etymology: res.etymology,
      example: res.example,
      articleId: article.id,
      articleTitle: article.title,
    });
    setSavedWords(prev => [...prev, res.word.toLowerCase()]);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(article.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderInteractiveWords = (paragraph: string, pIdx: number) => {
    const tokens = paragraph.split(/(\s+|[.,!?:;()"'\[\]{}—]+)/);
    return tokens.map((token, wIdx) => {
      const isWord = /^[a-zA-Z]{3,}$/.test(token);
      if (isWord) {
        return (
          <span
            key={'w-' + pIdx + '-' + wIdx}
            className="clickable-word"
            onClick={(e) => handleWordClick(e, token)}
          >
            {token}
          </span>
        );
      }
      return <span key={'t-' + pIdx + '-' + wIdx}>{token}</span>;
    });
  };

  const renderInteractiveContent = (markdownText: string) => {
    const lines = markdownText.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={'code-' + idx} className="my-4 text-xs font-mono text-slate-400 overflow-x-auto bg-[#0b0d13] p-3 rounded border border-[#1a1d27]">
              {codeBuffer.join('\n')}
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('+---') || line.startsWith('|') || line.startsWith('+-')) {
        elements.push(
          <div key={'ascii-' + idx} className="my-0 font-mono text-[11px] sm:text-xs text-slate-400 leading-tight overflow-x-auto whitespace-pre bg-[#0b0d13] px-2 py-0.5">
            {line}
          </div>
        );
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={'h1-' + idx} className="text-2xl sm:text-3xl font-serif text-slate-100 font-normal mt-8 mb-4 tracking-tight leading-snug">
            {line.replace(/^#\s+/, '')}
          </h1>
        );
        return;
      }

      if (line.startsWith('*') && line.endsWith('*')) {
        elements.push(
          <p key={'sub-' + idx} className="text-sm font-serif text-slate-400 italic mb-6 font-light">
            {line.replace(/^\*+|\*+$/g, '')}
          </p>
        );
        return;
      }

      if (line.startsWith('### ') || line.startsWith('## ')) {
        const text = line.replace(/^#{2,3}\s+/, '');
        elements.push(
          <h2 key={'h2-' + idx} className="text-lg sm:text-xl font-serif text-slate-200 font-normal mt-10 mb-4 pt-4 border-t border-[#161822] tracking-wide">
            {text}
          </h2>
        );
        return;
      }

      if (line.startsWith('#### ')) {
        const text = line.replace(/^####\s+/, '');
        elements.push(
          <h3 key={'h3-' + idx} className="text-sm sm:text-base font-sans text-slate-300 font-normal mt-6 mb-2 tracking-wide uppercase text-[13px]">
            {text}
          </h3>
        );
        return;
      }

      if (line.trim() === '---') {
        elements.push(<hr key={'hr-' + idx} className="my-8 border-[#171924]" />);
        return;
      }

      if (!line.trim()) return;

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const text = line.trim().replace(/^[*-]\s+/, '');
        elements.push(
          <li key={'li-' + idx} className="ml-4 list-disc text-slate-300 font-light my-1.5 leading-relaxed">
            {renderInteractiveWords(text, idx)}
          </li>
        );
        return;
      }

      if (/^\d+\.\s+/.test(line.trim())) {
        const text = line.trim().replace(/^\d+\.\s+/, '');
        elements.push(
          <li key={'oli-' + idx} className="ml-4 list-decimal text-slate-300 font-light my-1.5 leading-relaxed">
            {renderInteractiveWords(text, idx)}
          </li>
        );
        return;
      }

      elements.push(
        <p key={'p-' + idx} className="my-4 text-slate-300 font-light leading-relaxed">
          {renderInteractiveWords(line, idx)}
        </p>
      );
    });

    return elements;
  };

  const fontClass =
    prefs.fontFamily === 'serif'
      ? 'font-serif'
      : prefs.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const sizeClass =
    prefs.fontSize === 'sm'
      ? 'text-sm'
      : prefs.fontSize === 'base'
      ? 'text-base'
      : prefs.fontSize === 'xl'
      ? 'text-xl'
      : 'text-lg';

  const lineClass =
    prefs.lineSpacing === 'normal'
      ? 'leading-normal'
      : prefs.lineSpacing === 'loose'
      ? 'leading-loose'
      : 'leading-relaxed';

  const colWidthClass =
    prefs.columnWidth === 'narrow'
      ? 'max-w-xl'
      : prefs.columnWidth === 'wide'
      ? 'max-w-3xl'
      : 'max-w-2xl';

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#cbd5e1] relative" onClick={handleCloseTooltip}>
      
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-[#141722] z-40">
        <div
          className="h-full bg-slate-400 transition-all duration-150 ease-out"
          style={{ width: scrollProgress + '%' }}
        />
      </div>

      <div className={'mx-auto px-4 sm:px-6 py-12 ' + colWidthClass}>
        
        <div className="mb-10 pb-6 border-b border-[#161822]">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-light mb-3">
            <span className="px-2 py-0.5 rounded bg-[#13151f] text-slate-400 border border-[#1d202e]">
              {article.genre}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {article.actualWordCount.toLocaleString()} words
            </span>
            <span>•</span>
            <span>{article.readingTimeMinutes} min read</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-serif text-slate-100 font-normal tracking-tight leading-snug">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="mt-3 text-sm sm:text-base text-slate-400 font-light font-serif italic leading-relaxed">
              {article.subtitle}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-[#12141c] flex items-center justify-between text-xs text-slate-500 font-light">
            <div className="flex items-center gap-3">
              <span>By {article.author}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#12141c] hover:bg-[#1a1c28] text-slate-400 hover:text-slate-200 border border-[#1b1e2a] transition-colors"
                title="Copy Full Essay Markdown"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#12141c] hover:bg-[#1a1c28] text-slate-400 hover:text-slate-200 border border-[#1b1e2a] transition-colors"
                title="Print / Save PDF"
              >
                <FileText className="w-3 h-3" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        <article
          ref={contentRef}
          className={'prose-cat ' + fontClass + ' ' + sizeClass + ' ' + lineClass + ' transition-all duration-200'}
        >
          {renderInteractiveContent(article.content)}
        </article>

        <div className="mt-16 pt-8 border-t border-[#161822] text-center text-xs text-slate-500 font-light space-y-4">
          <p>You have reached the end of this analytical treatise.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onNewArticle}
              className="px-4 py-2 rounded-md bg-[#161924] hover:bg-[#1f2433] text-slate-200 border border-[#232738] transition-colors"
            >
              Explore Another Topic
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 rounded-md hover:bg-[#13151f] text-slate-400 hover:text-slate-200 border border-[#191c28] transition-colors flex items-center gap-1"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

      </div>

      <WordLookupTooltip
        result={activeWordData}
        isLoading={wordLoading}
        position={popupPos}
        onClose={handleCloseTooltip}
        onSaveToVocab={handleSaveVocab}
        isSaved={!!activeWordData && savedWords.includes(activeWordData.word.toLowerCase())}
      />

    </div>
  );
};
