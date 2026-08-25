import type { Article } from '../types/article';
import { getEffectiveApiKey, getStoredModel, saveStoredModel } from './storage';

export interface GenerationParams {
  topic: string;
  targetWordCount: number;
  genre?: string;
  onProgress?: (status: string) => void;
}

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return FALLBACK_MODELS;
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      const generateModels = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''))
        .filter((name: string) => name.includes('gemini') && !name.includes('2.0-flash-lite') && !name.includes('embedding'));
      if (generateModels.length > 0) return generateModels;
    }
  } catch (e) {
    console.warn('Failed to fetch model list, using defaults:', e);
  }
  return FALLBACK_MODELS;
}

export async function generateCatArticle(params: GenerationParams): Promise<Article> {
  const { topic, targetWordCount, genre, onProgress } = params;
  const apiKey = getEffectiveApiKey();

  if (!apiKey) {
    throw new Error('Please configure your Gemini API Key in the top right (or set VITE_GEMINI_API_KEY in Vercel) to generate custom long-form essays.');
  }

  onProgress?.('Executing deep domain research & conceptual mapping...');

  const systemInstruction = `You are an elite academic essayist and scholar writing high-density, analytical long-form essays specifically calibrated to the intellectual difficulty, structural sophistication, and linguistic register of CAT (Common Admission Test - VARC) and prestigious essay journals (Aeon Essays, Nautilus, The Atlantic, Stanford Encyclopedia of Philosophy, Project Syndicate).

CRITICAL CAT ESSAY GUIDELINES:
1. RIGOROUS SYNTACTIC SOPHISTICATION: Use periodic sentences, hypotaxis (layered qualifying subordinate clauses), varied rhythmic cadence, and dialectical synthesis. Avoid simplistic subject-verb-object primer prose.
2. CONCEPTUAL & PHILOSOPHICAL DENSITY: Do not write superficial consumer listicles. Frame the topic within broader epistemology, philosophy of science, political economy, evolutionary dynamics, or cognitive phenomenology.
3. HIGH-REGISTER UNFORCED VOCABULARY: Integrate precise, high-level academic lexicon naturally (e.g., teleological, epistemic, reification, heuristic, stochastic, provenance, verisimilitude, dialectic, hegemony, bifurcate, empirical, surrogate endpoints, iatrogenic).
4. EXHAUSTIVE LENGTH & DEPTH: You MUST write an in-depth, multi-section essay reaching approximately ${targetWordCount} words. Do NOT summarize or rush. Develop every argument with empirical evidence, theoretical frameworks, and thorough critique.
5. FORMATTING: Use Markdown with clear Roman-numeral section headings (# Title, ### I. Heading, ### II. Heading, etc.), structured comparisons, and clean prose.`;

  const userPrompt = `Topic / Inquiry: "${topic}"
Genre / Domain: ${genre || 'Interdisciplinary Academic Analysis'}
Target Word Count: ${targetWordCount} words (Provide a comprehensive, long-form treatise).

Please research and develop a complete CAT-level analytical treatise on this topic.
Structure the response with:
1. An evocative, scholarly title and subtitle.
2. Deep multi-section analysis with rigorous dialectical reasoning, empirical specifics, comparative analysis, and critique.
3. Synthesize the findings into a nuanced final verdict.`;

  let availableModels = FALLBACK_MODELS;
  try {
    const live = await fetchAvailableModels(apiKey);
    if (live && live.length > 0) availableModels = live;
  } catch (e) {
    // fallback
  }

  const preferredModel = getStoredModel();
  const modelsToTry = [
    preferredModel,
    ...availableModels.filter(m => m !== preferredModel),
    ...FALLBACK_MODELS.filter(m => m !== preferredModel && !availableModels.includes(m))
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      onProgress?.(`Synthesizing treatise using ${model}...`);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${response.status}`;
        console.warn(`Model ${model} failed: ${errMsg}. Trying next candidate...`);
        lastError = new Error(errMsg);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        continue;
      }

      saveStoredModel(model);

      onProgress?.('Finalizing typography and metadata...');

      const lines = rawText.split('\n');
      let title = topic;
      let subtitle = '';

      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.replace(/^#\s+/, '').trim();
          break;
        }
      }

      const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.round(wordCount / 230));

      const newArticle: Article = {
        id: 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: title,
        subtitle: subtitle || `An analytical inquiry into ${topic}`,
        author: 'AeonCAT Synthesis Engine',
        genre: genre || 'Academic & Critical Analysis',
        targetWordCount: targetWordCount,
        actualWordCount: wordCount,
        readingTimeMinutes: readingTime,
        createdAt: Date.now(),
        isFavorite: false,
        thesis: `An exhaustive examination of ${topic} through dialectical reasoning and empirical evaluation.`,
        tone: 'Academic, Analytical, Critically Detached',
        content: rawText,
      };

      return newArticle;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All model attempts failed. Please check your Gemini API key permissions in Google AI Studio.');
}
