import { storage } from "../db/storage";
import { getGenAI, isGeminiConfigured, GEMINI_MODELS } from "../config/gemini.js";
import type {
  WorldLanguage,
  InsertWorldLanguage,
  LanguageChatMessage,
  InsertLanguageChatMessage,
  LanguageScopeType,
  ConlangConfig,
  LanguageFeatures,
  Phonemes,
  GrammarRules,
  SampleText
} from "@shared/language";

interface BaseLanguage {
  id: string;
  name: string;
  features: LanguageFeatures;
  phonemes: Phonemes;
  grammar: GrammarRules;
}

const BASE_LANGUAGES: BaseLanguage[] = [
  {
    id: "english",
    name: "English",
    features: {
      wordOrder: "SVO",
      hasGender: false,
      hasCase: false,
      hasTones: false,
      agglutinative: false,
      fusional: true,
      isolating: false
    },
    phonemes: {
      consonants: [
        "p",
        "b",
        "t",
        "d",
        "k",
        "g",
        "f",
        "v",
        "θ",
        "ð",
        "s",
        "z",
        "ʃ",
        "ʒ",
        "h",
        "m",
        "n",
        "ŋ",
        "l",
        "r",
        "w",
        "j"
      ],
      vowels: ["i", "ɪ", "e", "ɛ", "æ", "ɑ", "ɔ", "o", "ʊ", "u", "ʌ", "ə"],
      clusters: ["st", "sp", "sk", "tr", "dr", "pl", "bl", "kl", "gl"]
    },
    grammar: {
      verbTenses: ["present", "past", "future", "present perfect", "past perfect"],
      pluralization: "suffix -s/-es",
      articles: ["the", "a", "an"]
    }
  },
  {
    id: "japanese",
    name: "Japanese",
    features: {
      wordOrder: "SOV",
      hasGender: false,
      hasCase: true,
      hasTones: false,
      agglutinative: true,
      fusional: false,
      isolating: false
    },
    phonemes: {
      consonants: [
        "p",
        "b",
        "t",
        "d",
        "k",
        "g",
        "s",
        "z",
        "ʃ",
        "ʒ",
        "h",
        "m",
        "n",
        "ɲ",
        "ŋ",
        "r",
        "w",
        "j"
      ],
      vowels: ["a", "i", "u", "e", "o"],
      clusters: ["ky", "gy", "sh", "ch", "ts"]
    },
    grammar: {
      nounCases: ["nominative", "accusative", "genitive", "dative", "locative"],
      verbTenses: ["present", "past", "volitional", "potential", "causative"],
      pluralization: "context-dependent"
    }
  },
  {
    id: "spanish",
    name: "Spanish",
    features: {
      wordOrder: "SVO",
      hasGender: true,
      hasCase: false,
      hasTones: false,
      agglutinative: false,
      fusional: true,
      isolating: false
    },
    phonemes: {
      consonants: [
        "p",
        "b",
        "t",
        "d",
        "k",
        "g",
        "f",
        "s",
        "θ",
        "x",
        "ʧ",
        "m",
        "n",
        "ɲ",
        "l",
        "ʎ",
        "r",
        "rr"
      ],
      vowels: ["a", "e", "i", "o", "u"],
      clusters: ["pr", "br", "tr", "dr", "kr", "gr", "fl", "pl", "bl"]
    },
    grammar: {
      verbTenses: ["presente", "pretérito", "imperfecto", "futuro", "condicional"],
      genders: ["masculine", "feminine"],
      pluralization: "suffix -s/-es",
      articles: ["el", "la", "los", "las", "un", "una"]
    }
  },
  {
    id: "mandarin",
    name: "Mandarin Chinese",
    features: {
      wordOrder: "SVO",
      hasGender: false,
      hasCase: false,
      hasTones: true,
      agglutinative: false,
      fusional: false,
      isolating: true
    },
    phonemes: {
      consonants: [
        "p",
        "pʰ",
        "b",
        "t",
        "tʰ",
        "d",
        "k",
        "kʰ",
        "g",
        "f",
        "s",
        "ʃ",
        "x",
        "h",
        "m",
        "n",
        "ŋ",
        "l",
        "r"
      ],
      vowels: ["a", "o", "e", "i", "u", "y"],
      clusters: ["zh", "ch", "sh", "ng"]
    },
    grammar: {
      verbTenses: ["aspect-based"],
      pluralization: "particle-based"
    }
  }
];

type LanguageGenerationMode = "offline" | "llm-hybrid";

interface LanguageGenerationParams {
  worldId: string;
  scopeType: LanguageScopeType;
  scopeId: string;
  config: ConlangConfig;
  description?: string | null;
  makePrimary?: boolean;
  mode?: LanguageGenerationMode;
}

interface LanguageChatParams {
  languageId: string;
  worldId: string;
  scopeType?: LanguageScopeType | null;
  scopeId?: string | null;
  userId?: string | null;
  message: string;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function selectRandom<T>(items: T[], count: number): T[] {
  if (items.length <= count) {
    return [...items];
  }
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function calculateBooleanFeature(langs: BaseLanguage[], key: keyof LanguageFeatures): boolean {
  if (langs.length === 0) {
    return false;
  }
  const count = langs.filter((lang) => (lang.features as any)[key]).length;
  const probability = count / langs.length;
  return Math.random() < probability;
}

function generateFeatures(bases: BaseLanguage[], config: ConlangConfig): LanguageFeatures {
  const langs = bases.length ? bases : BASE_LANGUAGES;
  const wordOrders = langs.map((lang) => lang.features.wordOrder);
  const wordOrder = pickRandom(wordOrders);

  const complexityMultiplier =
    config.complexity === "simple" ? 0.3 : config.complexity === "moderate" ? 0.6 : 1.0;

  const hasGenderBase = calculateBooleanFeature(langs, "hasGender");
  const hasCaseBase = calculateBooleanFeature(langs, "hasCase");
  const hasTones = calculateBooleanFeature(langs, "hasTones");
  const agglutinative = calculateBooleanFeature(langs, "agglutinative");
  const fusional = calculateBooleanFeature(langs, "fusional");
  const isolating = calculateBooleanFeature(langs, "isolating");

  const hasGender = hasGenderBase && Math.random() < complexityMultiplier;
  const hasCase = hasCaseBase && Math.random() < complexityMultiplier;

  const hasEvidentiality = config.complexity === "complex" && Math.random() < 0.3;
  const hasAspect = config.complexity !== "simple" && Math.random() < 0.5;
  const hasHonorific = config.complexity !== "simple" && Math.random() < 0.4;

  return {
    wordOrder,
    hasGender,
    hasCase,
    hasTones,
    agglutinative,
    fusional,
    isolating,
    hasEvidentiality,
    hasAspect,
    hasHonorific
  };
}

function generatePhonemes(bases: BaseLanguage[], config: ConlangConfig): Phonemes {
  const langs = bases.length ? bases : BASE_LANGUAGES;

  const consonantSet = new Set<string>();
  const vowelSet = new Set<string>();
  const clusterSet = new Set<string>();

  langs.forEach((lang) => {
    lang.phonemes.consonants.forEach((c) => consonantSet.add(c));
    lang.phonemes.vowels.forEach((v) => vowelSet.add(v));
    lang.phonemes.clusters.forEach((cl) => clusterSet.add(cl));
  });

  const sizeMultiplier =
    config.complexity === "simple" ? 0.6 : config.complexity === "moderate" ? 0.8 : 1.0;

  const consonantCount = Math.min(
    30,
    Math.max(12, Math.floor(consonantSet.size * 0.7 * sizeMultiplier))
  );
  const vowelCount = Math.min(
    15,
    Math.max(3, Math.floor(vowelSet.size * 0.8 * sizeMultiplier))
  );
  const clusterCount = Math.min(
    20,
    Math.max(3, Math.floor(clusterSet.size * 0.6 * sizeMultiplier))
  );

  const phonemes: Phonemes = {
    consonants: selectRandom(Array.from(consonantSet), consonantCount),
    vowels: selectRandom(Array.from(vowelSet), vowelCount),
    clusters: selectRandom(Array.from(clusterSet), clusterCount)
  };

  if (BASE_LANGUAGES.some((lang) => lang.features.hasTones)) {
    phonemes.tones = ["high", "mid", "low", "rising", "falling"];
  }

  phonemes.stress = pickRandom(["initial", "final", "penultimate", "free"]);

  return phonemes;
}

function generateGrammar(bases: BaseLanguage[], config: ConlangConfig): GrammarRules {
  const langs = bases.length ? bases : BASE_LANGUAGES;

  const allTenses = new Set<string>();
  langs.forEach((lang) => {
    lang.grammar.verbTenses.forEach((tense) => allTenses.add(tense));
  });

  const tenseTarget =
    config.complexity === "simple" ? 4 : config.complexity === "moderate" ? 6 : 8;

  const verbTenses = selectRandom(
    Array.from(allTenses),
    Math.min(tenseTarget, allTenses.size || tenseTarget)
  );

  const grammar: GrammarRules = {
    verbTenses,
    pluralization: "suffix-based"
  };

  const languagesWithCases = langs.filter(
    (lang) => lang.grammar.nounCases && lang.grammar.nounCases.length > 0
  );
  if (languagesWithCases.length > 0) {
    const allCases = new Set<string>();
    languagesWithCases.forEach((lang) => {
      lang.grammar.nounCases!.forEach((caseName) => allCases.add(caseName));
    });
    const caseTarget =
      config.complexity === "simple" ? 3 : config.complexity === "moderate" ? 5 : 8;
    grammar.nounCases = selectRandom(
      Array.from(allCases),
      Math.min(caseTarget, allCases.size || caseTarget)
    );
  }

  const languagesWithGenders = langs.filter(
    (lang) => lang.grammar.genders && lang.grammar.genders.length > 0
  );
  if (languagesWithGenders.length > 0) {
    const allGenders = new Set<string>();
    languagesWithGenders.forEach((lang) => {
      lang.grammar.genders!.forEach((gender) => allGenders.add(gender));
    });
    grammar.genders = Array.from(allGenders).slice(
      0,
      config.complexity === "simple" ? 2 : 4
    );
  }

  const pluralizations = langs
    .map((lang) => lang.grammar.pluralization)
    .filter((p) => p !== undefined && p !== null);
  if (pluralizations.length > 0) {
    grammar.pluralization = pickRandom(pluralizations as string[]);
  }

  if (config.complexity !== "simple") {
    grammar.wordFormation = ["compounding", "derivation", "reduplication"];
    grammar.syntaxRules = [
      "head-initial phrases",
      "verb-final subordinate clauses",
      "postpositional phrases"
    ];
  }

  return grammar;
}

const SAMPLE_CONCEPTS: string[] = [
  "water",
  "fire",
  "earth",
  "air",
  "sun",
  "moon",
  "star",
  "tree",
  "flower",
  "house",
  "person",
  "love",
  "peace",
  "strength",
  "wisdom",
  "journey",
  "mountain",
  "river",
  "sky",
  "light",
  "time",
  "dream",
  "hope",
  "fear",
  "joy",
  "anger",
  "friend",
  "family",
  "food",
  "music"
];

function generateWord(phonemes: Phonemes): string {
  const syllableCount = Math.floor(Math.random() * 3) + 1;
  let word = "";

  for (let i = 0; i < syllableCount; i++) {
    const useCluster = Math.random() < 0.3 && phonemes.clusters.length > 0;
    const consonant = useCluster
      ? phonemes.clusters[Math.floor(Math.random() * phonemes.clusters.length)]
      : phonemes.consonants[Math.floor(Math.random() * phonemes.consonants.length)];

    const vowel = phonemes.vowels[Math.floor(Math.random() * phonemes.vowels.length)];

    const finalConsonant =
      Math.random() < 0.4
        ? phonemes.consonants[Math.floor(Math.random() * phonemes.consonants.length)]
        : "";

    word += consonant + vowel + (i === syllableCount - 1 ? finalConsonant : "");
  }

  return word;
}

function generateSampleWords(phonemes: Phonemes): Record<string, string> {
  const words: Record<string, string> = {};
  SAMPLE_CONCEPTS.forEach((concept) => {
    words[concept] = generateWord(phonemes);
  });
  return words;
}

async function enrichLanguageWithLLM(language: WorldLanguage): Promise<WorldLanguage> {
  if (!isGeminiConfigured()) {
    return language;
  }

  const ai = getGenAI();

  const systemInstruction =
    "You are an expert linguist helping to flesh out a constructed language. " +
    "You will receive basic phonology, grammar, and sample words. " +
    "Return concise JSON with a rich description and a few example sentences.";

  const sampleWordsPreview = language.sampleWords
    ? Object.entries(language.sampleWords)
        .slice(0, 20)
        .map(([english, word]) => `${english} = ${word}`)
        .join("\n")
    : "";

  const prompt = `Language name: ${language.name}

` +
    `Description: ${language.description || "(none)"}
` +
    `Kind: ${language.kind}
` +
    `Word order: ${language.features?.wordOrder || "unknown"}
` +
    `Has gender: ${language.features?.hasGender ? "yes" : "no"}
` +
    `Has case: ${language.features?.hasCase ? "yes" : "no"}
` +
    `Phonemes (consonants): ${(language.phonemes?.consonants || []).join(", ")}
` +
    `Phonemes (vowels): ${(language.phonemes?.vowels || []).join(", ")}
` +
    `Sample words:
${sampleWordsPreview}

` +
    `Generate JSON with:
` +
    `{
` +
    `  "description": string,
` +
    `  "sampleTexts": [
` +
    `    {
` +
    `      "english": string,
` +
    `      "language": string,
` +
    `      "transliteration"?: string,
` +
    `      "grammaticalAnalysis"?: string[],
` +
    `      "type": "greeting" | "question" | "statement" | "poem" | "proverb"
` +
    `    }
` +
    `  ]
` +
    `}
` +
    `Return ONLY valid JSON with that shape.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.PRO,
    config: { systemInstruction },
    contents: prompt
  });

  const text = (response as any).text as string | undefined;
  if (!text) {
    return language;
  }

  let parsed: {
    description?: string;
    sampleTexts?: SampleText[];
  };

  try {
    parsed = JSON.parse(text);
  } catch {
    return language;
  }

  const update: Partial<InsertWorldLanguage> = {};
  if (parsed.description) {
    update.description = parsed.description;
  }
  if (parsed.sampleTexts && Array.isArray(parsed.sampleTexts)) {
    update.sampleTexts = parsed.sampleTexts;
  }

  if (Object.keys(update).length === 0) {
    return language;
  }

  const updated = await storage.updateWorldLanguage(language.id, update);
  return updated || { ...language, ...update };
}

async function generateLanguageOfflineInternal(
  params: LanguageGenerationParams
): Promise<WorldLanguage> {
  const selectedBases = BASE_LANGUAGES.filter((lang) =>
    params.config.selectedLanguages.includes(lang.id)
  );
  const bases = selectedBases.length ? selectedBases : BASE_LANGUAGES;

  const features = generateFeatures(bases, params.config);
  const phonemes = generatePhonemes(bases, params.config);
  const grammar = generateGrammar(bases, params.config);
  const sampleWords = generateSampleWords(phonemes);

  const insert: InsertWorldLanguage = {
    worldId: params.worldId,
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    name: params.config.name,
    description: params.description ?? null,
    kind: "constructed",
    realCode: null,
    isPrimary: params.makePrimary ?? false,
    parentLanguageId: null,
    influenceLanguageIds: [],
    realInfluenceCodes: params.config.selectedLanguages,
    config: params.config,
    features,
    phonemes,
    grammar,
    writingSystem: null,
    culturalContext: null,
    phoneticInventory: null,
    sampleWords,
    sampleTexts: null,
    etymology: null,
    dialectVariations: null,
    learningModules: null
  };

  return storage.createWorldLanguage(insert);
}

export async function generateLanguage(
  params: LanguageGenerationParams
): Promise<WorldLanguage> {
  const mode: LanguageGenerationMode = params.mode ?? "offline";

  if (mode === "offline") {
    return generateLanguageOfflineInternal(params);
  }

  const base = await generateLanguageOfflineInternal(params);
  if (!isGeminiConfigured()) {
    return base;
  }

  return enrichLanguageWithLLM(base);
}

export async function getLanguageById(id: string): Promise<WorldLanguage | undefined> {
  return storage.getWorldLanguage(id);
}

export async function getLanguagesByWorld(worldId: string): Promise<WorldLanguage[]> {
  return storage.getWorldLanguagesByWorld(worldId);
}

export async function getLanguagesByScope(
  worldId: string,
  scopeType: LanguageScopeType,
  scopeId: string
): Promise<WorldLanguage[]> {
  return storage.getWorldLanguagesByScope(worldId, scopeType, scopeId);
}

export async function getLanguageChatHistory(
  languageId: string
): Promise<LanguageChatMessage[]> {
  return storage.getLanguageChatMessages(languageId);
}

export async function sendLanguageChatMessage(
  params: LanguageChatParams
): Promise<{ response: string; inLanguage: string; history: LanguageChatMessage[] }> {
  const language = await storage.getWorldLanguage(params.languageId);
  if (!language) {
    throw new Error("Language not found");
  }

  const history = await storage.getLanguageChatMessages(params.languageId);

  const userMessage: InsertLanguageChatMessage = {
    languageId: params.languageId,
    worldId: params.worldId,
    scopeType: params.scopeType ?? null,
    scopeId: params.scopeId ?? null,
    userId: params.userId ?? null,
    role: "user",
    content: params.message,
    inLanguage: null
  };

  const savedUserMessage = await storage.createLanguageChatMessage(userMessage);

  if (!isGeminiConfigured()) {
    const assistantMessage: InsertLanguageChatMessage = {
      languageId: params.languageId,
      worldId: params.worldId,
      scopeType: params.scopeType ?? null,
      scopeId: params.scopeId ?? null,
      userId: null,
      role: "assistant",
      content: "[Gemini API key not set]",
      inLanguage: ""
    };

    const savedAssistantMessage = await storage.createLanguageChatMessage(assistantMessage);
    const updatedHistory = [...history, savedUserMessage, savedAssistantMessage];

    return {
      response: savedAssistantMessage.content,
      inLanguage: savedAssistantMessage.inLanguage || "",
      history: updatedHistory
    };
  }

  const ai = getGenAI();

  const historyText = history
    .slice(-10)
    .map((msg) => {
      const roleLabel = msg.role === "user" ? "User" : "Assistant";
      const base = `${roleLabel}: ${msg.content}`;
      if (msg.inLanguage) {
        return `${base}
(${language.name}): ${msg.inLanguage}`;
      }
      return base;
    })
    .join("\n\n");

  const systemInstruction =
    `You are a helpful AI assistant that speaks and understands "${language.name}", ` +
    `a constructed language used in a fictional world. ` +
    `You will reply in English and also translate your reply into ${language.name}. ` +
    `Use the provided grammar and sample words as much as possible. ` +
    `Return ONLY valid JSON of the form {"response": string, "inLanguage": string}.`;

  const sampleWordsPreview = language.sampleWords
    ? Object.entries(language.sampleWords)
        .slice(0, 30)
        .map(([english, word]) => `${english} = ${word}`)
        .join("\n")
    : "";

  const prompt = `Language: ${language.name}
` +
    `Description: ${language.description || "(none)"}
` +
    `Word order: ${language.features?.wordOrder || "unknown"}
` +
    `Grammar: ${JSON.stringify(language.grammar || {}, null, 2)}
` +
    `Sample words:
${sampleWordsPreview}

` +
    `Conversation so far:
${historyText || "(no previous messages)"}

` +
    `User: ${params.message}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.PRO,
    config: { systemInstruction },
    contents: prompt
  });

  const text = (response as any).text as string | undefined;
  let parsed: { response?: string; inLanguage?: string } = {};

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
  }

  const englishResponse = parsed.response ||
    "I am unable to generate a proper response at this time.";
  const conlangResponse = parsed.inLanguage || "";

  const assistantMessage: InsertLanguageChatMessage = {
    languageId: params.languageId,
    worldId: params.worldId,
    scopeType: params.scopeType ?? null,
    scopeId: params.scopeId ?? null,
    userId: null,
    role: "assistant",
    content: englishResponse,
    inLanguage: conlangResponse
  };

  const savedAssistantMessage = await storage.createLanguageChatMessage(assistantMessage);

  const updatedHistory = [...history, savedUserMessage, savedAssistantMessage];

  return {
    response: englishResponse,
    inLanguage: conlangResponse,
    history: updatedHistory
  };
}
