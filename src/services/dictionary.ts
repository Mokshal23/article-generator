import { getStoredApiKey, getStoredModel } from './storage';

export interface DefinitionResult {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  etymology?: string;
  example?: string;
  synonyms?: string[];
}

const CAT_ACADEMIC_LEXICON: Record<string, DefinitionResult> = {
  contemporary: {
    word: 'contemporary',
    phonetic: '/kənˈtem.pə.rər.i/',
    partOfSpeech: 'adjective / noun',
    definition: 'Living, occurring, or existing at the same time; belonging to or occurring in the present.',
    etymology: 'From Latin com- ("together with") + tempus, tempor- ("time").',
    example: 'The contemporary pursuit of cognitive enhancement and somatic surveillance.',
    synonyms: ['modern', 'current', 'coexistent', 'present-day']
  },
  enhancement: {
    word: 'enhancement',
    phonetic: '/ɪnˈhɑːns.mənt/',
    partOfSpeech: 'noun',
    definition: 'An increase or improvement in quality, value, performance, or extent.',
    etymology: 'From Old French enhaucier ("to raise, elevate").',
    example: 'Algorithmic enhancement of nocturnal recovery and sleep hygiene.',
    synonyms: ['augmentation', 'optimization', 'refinement']
  },
  pursuit: {
    word: 'pursuit',
    phonetic: '/pəˈsjuːt/',
    partOfSpeech: 'noun',
    definition: 'The action of following or pursuing someone or something; an activity that one engages in.',
    etymology: 'From Anglo-Norman purseute ("prosecution, pursuit").',
    example: 'The scientific pursuit of neural ground truths.',
    synonyms: ['quest', 'endeavor', 'search']
  },
  cognitive: {
    word: 'cognitive',
    phonetic: '/ˈkɒɡ.nə.tɪv/',
    partOfSpeech: 'adjective',
    definition: 'Relating to cognition; the mental action or process of acquiring knowledge and understanding through thought and experience.',
    etymology: 'From Latin cognoscere ("to know, recognize").',
    example: 'Cognitive faculties undergo crucial consolidation during slow-wave and REM sleep.',
    synonyms: ['intellectual', 'mental', 'cerebral']
  },
  epistemic: {
    word: 'epistemic',
    phonetic: '/ˌep.əˈstiː.mɪk/',
    partOfSpeech: 'adjective',
    definition: 'Relating to knowledge or to the degree of its validation and cognitive warrant.',
    etymology: 'From Greek episteme ("knowledge, science") + -ic.',
    example: 'The epistemic limit of wrist-worn actigraphy compared to clinical EEG.',
    synonyms: ['cognitive', 'gnosiological', 'theoretical']
  },
  heuristic: {
    word: 'heuristic',
    phonetic: '/ˌhjʊəˈrɪs.tɪk/',
    partOfSpeech: 'noun / adjective',
    definition: 'A practical rule-of-thumb or cognitive shortcut used for problem-solving or classification.',
    etymology: 'From Greek heuriskein ("to discover, find out").',
    example: 'Fitbit relies on empirical Bayesian heuristics developed across millions of nights.',
    synonyms: ['rule-of-thumb', 'exploratory', 'trial-and-error']
  },
  reification: {
    word: 'reification',
    phonetic: '/ˌriː.ɪ.fɪˈkeɪ.ʃən/',
    partOfSpeech: 'noun',
    definition: 'Treating an abstract idea or metric as if it were a concrete, tangible material reality.',
    etymology: 'From Latin res ("thing") + facere ("to make").',
    example: 'The reification of subjective vitality into a singular, commercialized recovery score.',
    synonyms: ['objectification', 'hypostatization']
  },
  teleological: {
    word: 'teleological',
    phonetic: '/ˌtiː.li.əˈlɒdʒ.ɪ.kəl/',
    partOfSpeech: 'adjective',
    definition: 'Relating to the explanation of phenomena by the purpose they serve rather than by postulated causes.',
    etymology: 'From Greek telos ("end, goal, purpose") + logos ("discourse").',
    example: 'Whoop adopts a teleological recovery paradigm focused entirely on athletic preparedness.',
    synonyms: ['purpose-driven', 'goal-oriented']
  },
  dialectic: {
    word: 'dialectic',
    phonetic: '/ˌdaɪ.əˈlek.tɪk/',
    partOfSpeech: 'noun / adjective',
    definition: 'The discourse between two opposing viewpoints seeking mutual resolution through reasoned argument.',
    etymology: 'From Greek dialektike ("art of debate, discussion").',
    example: 'The cyclical dialectic between sleep debt and homeostatic sleep pressure.',
    synonyms: ['dialogue', 'argumentation', 'synthesis']
  },
  concordance: {
    word: 'concordance',
    phonetic: '/kənˈkɔː.dəns/',
    partOfSpeech: 'noun',
    definition: 'Agreement or consistency between multiple diagnostic tests, observations, or empirical models.',
    etymology: 'From Latin concordare ("to be of one mind, agree").',
    example: 'The Apple Watch demonstrated superior multi-class concordance when benchmarked against polysomnography.',
    synonyms: ['agreement', 'harmony', 'congruence']
  },
  photoplethysmography: {
    word: 'photoplethysmography',
    phonetic: '/ˌfoʊ.toʊ.plə.θɪzˈmɒɡ.rə.fi/',
    partOfSpeech: 'noun',
    definition: 'An optical measurement technique using light absorption backscatter to detect microvascular blood volume shifts.',
    etymology: 'From Greek photo- ("light") + plethysmos ("enlargement") + graphein ("to write").',
    example: 'Dual-wavelength photoplethysmography measures capillary blood flux on the dorsal wrist.',
    synonyms: ['PPG', 'optical pulse sensing']
  },
  polysomnography: {
    word: 'polysomnography',
    phonetic: '/ˌpɒl.i.sɒmˈnɒɡ.rə.fi/',
    partOfSpeech: 'noun',
    definition: 'The comprehensive gold-standard multi-parametric sleep study recording EEG, EOG, EMG, ECG, and respiratory parameters.',
    etymology: 'From Greek poly ("many") + Latin somnus ("sleep") + Greek graphein ("to write").',
    example: 'Clinical polysomnography remains the definitive standard for sleep staging.',
    synonyms: ['PSG', 'sleep study']
  },
  stochastic: {
    word: 'stochastic',
    phonetic: '/stəˈkæs.tɪk/',
    partOfSpeech: 'adjective',
    definition: 'Having a random probability distribution that may be analyzed statistically but cannot be predicted precisely.',
    etymology: 'From Greek stokhastikos ("aiming at a target, guessing").',
    example: 'Waking states induce stochastic high-frequency accelerations.',
    synonyms: ['probabilistic', 'random']
  },
  atonia: {
    word: 'atonia',
    phonetic: '/eɪˈtoʊ.ni.ə/',
    partOfSpeech: 'noun',
    definition: 'Lack of normal muscle tone; profound temporary skeletal paralysis occurring during REM sleep.',
    etymology: 'From Greek a- ("without") + tonos ("tone, tension").',
    example: 'REM sleep features muscle atonia alongside heightened cortical metabolism.',
    synonyms: ['flaccidity', 'muscle paralysis']
  },
  orthosomnia: {
    word: 'orthosomnia',
    phonetic: '/ˌɔː.θəˈsɒm.ni.ə/',
    partOfSpeech: 'noun',
    definition: 'An unhealthy preoccupation with achieving perfect wearable sleep scores, paradoxically exacerbating insomnia.',
    etymology: 'From Greek orthos ("correct, straight") + Latin somnus ("sleep").',
    example: 'Orthosomnia illustrates the iatrogenic peril of algorithmic self-quantification.',
    synonyms: ['sleep tracking anxiety']
  },
  verisimilitude: {
    word: 'verisimilitude',
    phonetic: '/ˌver.ɪ.sɪˈmɪl.ɪ.tjuːd/',
    partOfSpeech: 'noun',
    definition: 'The appearance or semblance of truth or reality in an empirical model.',
    etymology: 'From Latin verus ("true") + similis ("like").',
    example: 'The wrist tracker reproduces the hypnogram with remarkable verisimilitude.',
    synonyms: ['plausibility', 'authenticity']
  },
  hypnogram: {
    word: 'hypnogram',
    phonetic: '/ˈhɪp.nə.ɡræm/',
    partOfSpeech: 'noun',
    definition: 'A graphical representation of the stages of sleep as a function of time throughout the night.',
    etymology: 'From Greek hypnos ("sleep") + gramma ("drawing, record").',
    example: 'The 30-second epochal hypnogram transitions from light to deep and REM sleep.',
    synonyms: ['sleep graph', 'somnogram']
  },
  iatrogenic: {
    word: 'iatrogenic',
    phonetic: '/aɪˌæt.rəˈdʒen.ɪk/',
    partOfSpeech: 'adjective',
    definition: 'Relating to illness or harm caused by medical examination, diagnostic feedback, or treatment itself.',
    etymology: 'From Greek iatros ("physician") + genesis ("origin").',
    example: 'The iatrogenic effect of pessimistic recovery scores inducing elevated cortisol.',
    synonyms: ['treatment-induced']
  },
  quiescence: {
    word: 'quiescence',
    phonetic: '/kwiˈes.əns/',
    partOfSpeech: 'noun',
    definition: 'A state of quietness, dormancy, or temporary inactivity.',
    etymology: 'From Latin quiescere ("to rest").',
    example: 'Slow-wave sleep is characterized by hemodynamic and metabolic quiescence.',
    synonyms: ['dormancy', 'inactivity', 'stillness']
  }
};

const POS_MAP: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  u: 'interjection',
};

// 1. Check Datamuse dictionary API (High speed, zero CORS issues, 100k+ words)
async function fetchDatamuse(word: string): Promise<DefinitionResult | null> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dr&max=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].defs && data[0].defs.length > 0) {
      const firstDef = data[0].defs[0];
      const [rawPos, ...defParts] = firstDef.split('\t');
      const defText = defParts.join(' ').trim();
      const pos = POS_MAP[rawPos] || rawPos || 'noun';

      return {
        word: data[0].word || word,
        partOfSpeech: pos,
        definition: defText.charAt(0).toUpperCase() + defText.slice(1) + '.',
        synonyms: data[0].tags ? data[0].tags.slice(0, 3) : [],
      };
    }
  } catch (err) {
    console.warn('Datamuse error:', err);
  }
  return null;
}

// 2. Check DictionaryAPI.dev
async function fetchDictionaryApi(word: string): Promise<DefinitionResult | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      const defObj = meaning?.definitions?.[0];

      return {
        word: entry.word || word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
        partOfSpeech: meaning?.partOfSpeech || 'noun',
        definition: defObj?.definition || 'No definition found.',
        example: defObj?.example || undefined,
        synonyms: meaning?.synonyms?.slice(0, 4) || [],
      };
    }
  } catch (err) {
    console.warn('DictionaryAPI error:', err);
  }
  return null;
}

// 3. Fallback to AI definition lookup if apiKey is present
async function fetchAiDefinition(word: string): Promise<DefinitionResult | null> {
  const apiKey = getStoredApiKey();
  if (!apiKey) return null;

  try {
    const model = getStoredModel() || 'gemini-3.5-flash-lite';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Provide a clean dictionary entry for the English word "${word}".
Format response strictly as JSON with this exact schema:
{
  "word": "${word}",
  "phonetic": "/.../",
  "partOfSpeech": "noun | verb | adjective | adverb",
  "definition": "Crisp 1-2 sentence definition",
  "etymology": "Brief root origin",
  "example": "Sample sentence in academic or CAT context",
  "synonyms": ["syn1", "syn2"]
}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 250,
        }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }
  } catch (err) {
    console.warn('AI definition error:', err);
  }
  return null;
}

export async function lookupWord(rawWord: string): Promise<DefinitionResult | null> {
  const cleanWord = rawWord.toLowerCase().replace(/[^a-z]/g, '').trim();
  if (!cleanWord || cleanWord.length < 2) return null;

  // 1. Built-in curated cache
  if (CAT_ACADEMIC_LEXICON[cleanWord]) {
    return CAT_ACADEMIC_LEXICON[cleanWord];
  }

  // 2. Try DictionaryAPI.dev
  const dictResult = await fetchDictionaryApi(cleanWord);
  if (dictResult) return dictResult;

  // 3. Try Datamuse (extremely reliable, instant)
  const datamuseResult = await fetchDatamuse(cleanWord);
  if (datamuseResult) return datamuseResult;

  // 4. Try AI-powered definition
  const aiResult = await fetchAiDefinition(cleanWord);
  if (aiResult) return aiResult;

  return null;
}
