import { Language, ConlangConfig, GeneratedConlang, LanguageFeatures, Phonemes, GrammarRules, PhoneticInventory } from '@/types/language';
import { languages } from '@/data/languages';

export class ConlangGenerator {
  private selectedLanguages: Language[];
  private config: ConlangConfig;

  constructor(config: ConlangConfig) {
    this.config = config;
    this.selectedLanguages = languages.filter(lang => 
      config.selectedLanguages.includes(lang.id)
    );
  }

  generate(): GeneratedConlang {
    const features = this.generateFeatures();
    const phonemes = this.generatePhonemes();
    const grammar = this.generateGrammar();
    const sampleWords = this.generateSampleWords(phonemes);
    const rules = this.generateRules(features, grammar);
    const description = this.generateDescription(features);
    const uniqueFeatures = this.generateUniqueFeatures(features);
    const phoneticInventory = this.generatePhoneticInventory(phonemes);

    return {
      name: this.config.name,
      features,
      phonemes,
      grammar,
      sampleWords,
      rules,
      description,
      complexity: this.config.complexity,
      uniqueFeatures,
      phoneticInventory,
    };
  }

  private generateFeatures(): LanguageFeatures {
    const wordOrders = this.selectedLanguages.map(lang => lang.features.wordOrder);
    const wordOrder = this.selectWeighted(wordOrders);

    // Complexity affects feature probability
    const complexityMultiplier = this.config.complexity === 'simple' ? 0.3 : 
                                this.config.complexity === 'moderate' ? 0.6 : 1.0;

    const hasGender = this.calculateBooleanFeature('hasGender') && Math.random() < complexityMultiplier;
    const hasCase = this.calculateBooleanFeature('hasCase') && Math.random() < complexityMultiplier;
    const hasTones = this.calculateBooleanFeature('hasTones');
    const agglutinative = this.calculateBooleanFeature('agglutinative');
    const fusional = this.calculateBooleanFeature('fusional');
    const isolating = this.calculateBooleanFeature('isolating');

    // Advanced features based on complexity
    const hasEvidentiality = this.config.complexity === 'complex' && Math.random() < 0.3;
    const hasAspect = this.config.complexity !== 'simple' && Math.random() < 0.5;
    const hasHonorific = this.config.complexity !== 'simple' && Math.random() < 0.4;

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
      hasHonorific,
    };
  }

  private generatePhonemes(): Phonemes {
    const allConsonants = new Set<string>();
    const allVowels = new Set<string>();
    const allClusters = new Set<string>();

    this.selectedLanguages.forEach(lang => {
      lang.phonemes.consonants.forEach(c => allConsonants.add(c));
      lang.phonemes.vowels.forEach(v => allVowels.add(v));
      lang.phonemes.clusters.forEach(cl => allClusters.add(cl));
    });

    // Complexity affects inventory size
    const sizeMultiplier = this.config.complexity === 'simple' ? 0.6 : 
                          this.config.complexity === 'moderate' ? 0.8 : 1.0;

    const consonantCount = Math.min(30, Math.max(12, Math.floor(allConsonants.size * 0.7 * sizeMultiplier)));
    const vowelCount = Math.min(15, Math.max(3, Math.floor(allVowels.size * 0.8 * sizeMultiplier)));
    const clusterCount = Math.min(20, Math.max(3, Math.floor(allClusters.size * 0.6 * sizeMultiplier)));

    const phonemes: Phonemes = {
      consonants: this.selectRandom(Array.from(allConsonants), consonantCount),
      vowels: this.selectRandom(Array.from(allVowels), vowelCount),
      clusters: this.selectRandom(Array.from(allClusters), clusterCount),
    };

    // Add tones if tonal
    if (this.selectedLanguages.some(lang => lang.features.hasTones)) {
      phonemes.tones = ['high', 'mid', 'low', 'rising', 'falling'];
    }

    // Add stress pattern
    phonemes.stress = this.selectWeighted(['initial', 'final', 'penultimate', 'free']);

    return phonemes;
  }

  private generateGrammar(): GrammarRules {
    const grammar: GrammarRules = {
      verbTenses: [],
    };

    // Combine verb tenses from selected languages
    const allTenses = new Set<string>();
    this.selectedLanguages.forEach(lang => {
      lang.grammar.verbTenses.forEach(tense => allTenses.add(tense));
    });
    
    const tenseCount = this.config.complexity === 'simple' ? 4 : 
                      this.config.complexity === 'moderate' ? 6 : 8;
    grammar.verbTenses = this.selectRandom(Array.from(allTenses), Math.min(tenseCount, allTenses.size));

    // Handle cases if any language has them
    if (this.selectedLanguages.some(lang => lang.grammar.nounCases)) {
      const allCases = new Set<string>();
      this.selectedLanguages.forEach(lang => {
        if (lang.grammar.nounCases) {
          lang.grammar.nounCases.forEach(case_ => allCases.add(case_));
        }
      });
      const caseCount = this.config.complexity === 'simple' ? 3 : 
                       this.config.complexity === 'moderate' ? 5 : 8;
      grammar.nounCases = this.selectRandom(Array.from(allCases), Math.min(caseCount, allCases.size));
    }

    // Handle genders
    if (this.selectedLanguages.some(lang => lang.grammar.genders)) {
      const allGenders = new Set<string>();
      this.selectedLanguages.forEach(lang => {
        if (lang.grammar.genders) {
          lang.grammar.genders.forEach(gender => allGenders.add(gender));
        }
      });
      grammar.genders = Array.from(allGenders).slice(0, this.config.complexity === 'simple' ? 2 : 4);
    }

    // Pluralization
    const pluralizations = this.selectedLanguages
      .map(lang => lang.grammar.pluralization)
      .filter(p => p);
    grammar.pluralization = this.selectWeighted(pluralizations) || 'suffix-based';

    // Advanced grammar features
    if (this.config.complexity !== 'simple') {
      grammar.wordFormation = ['compounding', 'derivation', 'reduplication'];
      grammar.syntaxRules = [
        'head-initial phrases',
        'verb-final subordinate clauses',
        'postpositional phrases'
      ];
    }

    return grammar;
  }

  private generateSampleWords(phonemes: Phonemes): { [key: string]: string } {
    const words: { [key: string]: string } = {};
    const concepts = [
      'water', 'fire', 'earth', 'air', 'sun', 'moon', 'star', 'tree', 'flower',
      'house', 'person', 'love', 'peace', 'strength', 'wisdom', 'journey',
      'mountain', 'river', 'sky', 'light', 'time', 'dream', 'hope', 'fear',
      'joy', 'anger', 'friend', 'family', 'food', 'music'
    ];

    concepts.forEach(concept => {
      words[concept] = this.generateWord(phonemes);
    });

    return words;
  }

  private generateWord(phonemes: Phonemes): string {
    const syllableCount = Math.floor(Math.random() * 3) + 1;
    let word = '';

    for (let i = 0; i < syllableCount; i++) {
      // Sometimes use clusters
      const useCluster = Math.random() < 0.3 && phonemes.clusters.length > 0;
      const consonant = useCluster 
        ? phonemes.clusters[Math.floor(Math.random() * phonemes.clusters.length)]
        : phonemes.consonants[Math.floor(Math.random() * phonemes.consonants.length)];
      
      const vowel = phonemes.vowels[Math.floor(Math.random() * phonemes.vowels.length)];
      
      // Add optional final consonant
      const finalConsonant = Math.random() < 0.4 
        ? phonemes.consonants[Math.floor(Math.random() * phonemes.consonants.length)]
        : '';
      
      word += consonant + vowel + (i === syllableCount - 1 ? finalConsonant : '');
    }

    return word;
  }

  private generateRules(features: LanguageFeatures, grammar: GrammarRules): string[] {
    const rules: string[] = [];

    rules.push(`Word order: ${features.wordOrder}`);
    
    if (features.hasGender && grammar.genders) {
      rules.push(`Grammatical gender: ${grammar.genders.join(', ')}`);
    }

    if (features.hasCase && grammar.nounCases) {
      rules.push(`Noun cases: ${grammar.nounCases.slice(0, 5).join(', ')}${grammar.nounCases.length > 5 ? '...' : ''}`);
    }

    if (features.hasTones) {
      rules.push('Tonal language: Pitch changes affect word meaning');
    }

    if (features.agglutinative) {
      rules.push('Agglutinative: Words formed by adding multiple suffixes');
    }

    if (features.fusional) {
      rules.push('Fusional: Grammatical information encoded in word endings');
    }

    if (features.isolating) {
      rules.push('Isolating: Each word typically represents one grammatical unit');
    }

    if (features.hasEvidentiality) {
      rules.push('Evidentiality: Verbs must indicate source of information');
    }

    if (features.hasAspect) {
      rules.push('Aspectual system: Focus on action completion rather than time');
    }

    if (features.hasHonorific) {
      rules.push('Honorific system: Different forms based on social relationships');
    }

    rules.push(`Verb tenses: ${grammar.verbTenses.join(', ')}`);
    rules.push(`Pluralization: ${grammar.pluralization}`);

    return rules;
  }

  private generateDescription(features: LanguageFeatures): string {
    const influences = this.selectedLanguages.map(lang => lang.name).join(', ');
    const typeDesc = features.agglutinative ? 'agglutinative' : 
                    features.fusional ? 'fusional' : 'isolating';
    
    const complexityDesc = this.config.complexity === 'simple' ? 'straightforward' :
                          this.config.complexity === 'moderate' ? 'moderately complex' : 'highly sophisticated';
    
    const purposeDesc = this.config.purpose === 'artistic' ? 'designed for creative expression' :
                       this.config.purpose === 'auxiliary' ? 'intended for international communication' :
                       this.config.purpose === 'experimental' ? 'created for linguistic experimentation' :
                       'developed for fictional worlds';
    
    return `${this.config.name} is a ${complexityDesc} constructed language ${purposeDesc}, drawing inspiration from ${influences}. It follows a ${features.wordOrder} word order and exhibits ${typeDesc} morphology. ${features.hasTones ? 'It is a tonal language where pitch affects meaning.' : 'It is not tonal.'} ${features.hasGender ? 'The language has grammatical gender.' : 'The language lacks grammatical gender.'} This language represents a unique blend of features from its source languages, creating a distinctive linguistic system.`;
  }

  private generateUniqueFeatures(features: LanguageFeatures): string[] {
    const unique: string[] = [];
    
    if (features.hasEvidentiality) {
      unique.push('Mandatory evidentiality marking on all statements');
    }
    
    if (features.hasTones && features.hasCase) {
      unique.push('Tonal case marking system');
    }
    
    if (features.agglutinative && features.hasHonorific) {
      unique.push('Complex honorific suffix chains');
    }
    
    if (features.hasAspect && !features.hasTones) {
      unique.push('Aspectual vowel harmony system');
    }

    // Add some random unique features based on complexity
    if (this.config.complexity === 'complex') {
      const possibleFeatures = [
        'Tripartite alignment system',
        'Serial verb constructions',
        'Classifier system for nouns',
        'Switch-reference marking',
        'Directional deixis in verbs'
      ];
      unique.push(...this.selectRandom(possibleFeatures, 2));
    }

    return unique;
  }

  private generatePhoneticInventory(phonemes: Phonemes): PhoneticInventory {
    // Organize consonants by place and manner
    const consonantChart: { [key: string]: string[] } = {
      stops: phonemes.consonants.filter(c => ['p', 'b', 't', 'd', 'k', 'g', 'q', 'ʔ'].includes(c)),
      fricatives: phonemes.consonants.filter(c => ['f', 'v', 's', 'z', 'ʃ', 'ʒ', 'θ', 'ð', 'x', 'ɣ', 'h'].includes(c)),
      nasals: phonemes.consonants.filter(c => ['m', 'n', 'ɲ', 'ŋ'].includes(c)),
      liquids: phonemes.consonants.filter(c => ['l', 'r', 'ɬ'].includes(c)),
      glides: phonemes.consonants.filter(c => ['w', 'j'].includes(c)),
    };

    // Organize vowels by height and backness
    const vowelChart: { [key: string]: string[] } = {
      high: phonemes.vowels.filter(v => ['i', 'ɪ', 'u', 'ʊ', 'y'].includes(v)),
      mid: phonemes.vowels.filter(v => ['e', 'ə', 'o', 'ø', 'ɔ'].includes(v)),
      low: phonemes.vowels.filter(v => ['a', 'æ', 'ɑ'].includes(v)),
    };

    // Generate phonotactic rules
    const phonotactics = [
      'Syllables follow (C)(C)V(C) pattern',
      'No consonant clusters at word boundaries',
      'Vowel hiatus is avoided through epenthesis',
      'Stress falls on the penultimate syllable',
    ];

    if (phonemes.tones) {
      phonotactics.push('Tone sandhi occurs in compound words');
    }

    return {
      consonantChart,
      vowelChart,
      phonotactics,
    };
  }

  private calculateBooleanFeature(feature: keyof LanguageFeatures): boolean {
    const count = this.selectedLanguages.filter(lang => lang.features[feature]).length;
    const probability = count / this.selectedLanguages.length;
    return Math.random() < probability;
  }

  private selectWeighted<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private selectRandom<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}