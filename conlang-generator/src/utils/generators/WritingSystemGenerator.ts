import { WritingSystem, ConlangConfig, GeneratedConlang } from '@/types/language';

export class WritingSystemGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generate(): WritingSystem {
    const type = this.selectWritingSystemType();
    const direction = this.selectWritingDirection();
    
    return {
      type,
      direction,
      hasSpaces: this.determineSpacing(type),
      characters: this.generateCharacters(type),
      numerals: this.generateNumerals(),
      punctuation: this.generatePunctuation(type),
      specialFeatures: this.generateSpecialFeatures(type),
    };
  }

  private selectWritingSystemType(): WritingSystem['type'] {
    const types: WritingSystem['type'][] = ['alphabetic', 'syllabic', 'logographic', 'featural', 'mixed'];
    
    // Weight selection based on complexity and cultural context
    const weights = this.getTypeWeights();
    return this.weightedSelection(types, weights);
  }

  private getTypeWeights(): number[] {
    const baseWeights = [0.4, 0.2, 0.15, 0.1, 0.15]; // alphabetic, syllabic, logographic, featural, mixed
    
    // Adjust based on complexity
    if (this.config.complexity === 'simple') {
      baseWeights[0] += 0.2; // Favor alphabetic
      baseWeights[2] -= 0.1; // Reduce logographic
    } else if (this.config.complexity === 'complex') {
      baseWeights[2] += 0.1; // Favor logographic
      baseWeights[3] += 0.1; // Favor featural
    }
    
    return baseWeights;
  }

  private selectWritingDirection(): WritingSystem['direction'] {
    const directions: WritingSystem['direction'][] = ['ltr', 'rtl', 'ttb', 'boustrophedon'];
    const weights = [0.6, 0.2, 0.15, 0.05];
    return this.weightedSelection(directions, weights);
  }

  private determineSpacing(type: WritingSystem['type']): boolean {
    const spacingProbabilities = {
      alphabetic: 0.8,
      syllabic: 0.6,
      logographic: 0.3,
      featural: 0.7,
      mixed: 0.7
    };
    
    return Math.random() < spacingProbabilities[type];
  }

  private generateCharacters(type: WritingSystem['type']): string[] {
    switch (type) {
      case 'alphabetic':
        return this.generateAlphabeticCharacters();
      case 'syllabic':
        return this.generateSyllabicCharacters();
      case 'logographic':
        return this.generateLogographicCharacters();
      case 'featural':
        return this.generateFeaturalCharacters();
      case 'mixed':
        return this.generateMixedCharacters();
      default:
        return this.generateAlphabeticCharacters();
    }
  }

  private generateAlphabeticCharacters(): string[] {
    const characters: string[] = [];
    
    // Generate consonant characters
    this.conlang.phonemes.consonants.forEach(consonant => {
      const baseChar = this.phoneToChar(consonant);
      characters.push(baseChar);
      
      // Add diacritic variants
      if (Math.random() < 0.3) {
        characters.push(baseChar + '́', baseChar + '̀', baseChar + '̂');
      }
    });
    
    // Generate vowel characters
    this.conlang.phonemes.vowels.forEach(vowel => {
      const baseChar = this.phoneToChar(vowel);
      characters.push(baseChar);
      
      // Add tone markers if tonal
      if (this.conlang.features.hasTones) {
        characters.push(baseChar + '́', baseChar + '̀', baseChar + '̂', baseChar + '̌', baseChar + '̄');
      }
    });
    
    return characters;
  }

  private generateSyllabicCharacters(): string[] {
    const characters: string[] = [];
    const maxSyllables = Math.min(120, this.conlang.phonemes.consonants.length * this.conlang.phonemes.vowels.length);
    
    for (let i = 0; i < maxSyllables; i++) {
      characters.push(String.fromCharCode(0x3040 + (i % 96)));
    }
    
    // Add special symbols for consonant-final syllables
    for (let i = 0; i < 20; i++) {
      characters.push(String.fromCharCode(0x30A0 + i));
    }
    
    return characters;
  }

  private generateLogographicCharacters(): string[] {
    const characters: string[] = [];
    const concepts = [
      ...Object.keys(this.conlang.sampleWords),
      'abstract', 'concrete', 'action', 'state', 'relation', 'quality'
    ];
    
    concepts.forEach((_, i) => {
      characters.push(String.fromCharCode(0x4E00 + (i % 2000)));
    });
    
    // Add radical components
    for (let i = 0; i < 50; i++) {
      characters.push(String.fromCharCode(0x2E80 + i));
    }
    
    return characters;
  }

  private generateFeaturalCharacters(): string[] {
    const characters: string[] = [];
    const baseShapes = ['○', '□', '△', '◇', '☆', '◎', '■', '▲', '◆', '★'];
    const modifiers = ['ˈ', 'ˌ', '˘', '˙', '¨', '˜', '´', '`', '^', '¯'];
    
    baseShapes.forEach(base => {
      characters.push(base);
      modifiers.slice(0, 5).forEach(mod => {
        characters.push(base + mod);
        if (Math.random() < 0.3) {
          characters.push(base + mod + mod);
        }
      });
    });
    
    return characters;
  }

  private generateMixedCharacters(): string[] {
    const characters: string[] = [];
    
    // Alphabetic for common words
    this.conlang.phonemes.consonants.slice(0, 15).forEach(c => {
      characters.push(this.phoneToChar(c));
    });
    
    // Logographic for frequent concepts
    for (let i = 0; i < 30; i++) {
      characters.push(String.fromCharCode(0x4E00 + i));
    }
    
    // Syllabic for grammatical elements
    for (let i = 0; i < 20; i++) {
      characters.push(String.fromCharCode(0x3040 + i));
    }
    
    return characters;
  }

  private generateNumerals(): string[] {
    const culturalSystems = [
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      ['○', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
      ['◯', '𝟏', '𝟐', '𝟑', '𝟒', '𝟓', '𝟔', '𝟕', '𝟖', '𝟗'],
      ['⚬', '⚭', '⚮', '⚯', '⚰', '⚱', '⚲', '⚳', '⚴', '⚵'],
      ['∅', '|', '||', '|||', '||||', '|||||', '||||||', '|||||||', '||||||||', '|||||||||']
    ];
    
    const systemIndex = this.selectNumeralSystem();
    return culturalSystems[systemIndex];
  }

  private selectNumeralSystem(): number {
    if (this.conlang.culturalContext?.region.includes('Mountain')) return 4;
    if (this.conlang.culturalContext?.region.includes('Coastal')) return 1;
    return Math.floor(Math.random() * 5);
  }

  private generatePunctuation(type: WritingSystem['type']): string[] {
    const basePunctuation = ['.', ',', '?', '!', ':', ';'];
    const advancedPunctuation = ['"', "'", '(', ')', '[', ']', '{', '}', '—', '–', '…'];
    
    let punctuation = [...basePunctuation];
    
    if (type === 'logographic') {
      punctuation.push('。', '、', '？', '！', '：', '；', '「', '」', '『', '』');
    } else if (type === 'featural') {
      punctuation.push('◦', '◦◦', '◦◦◦', '▪', '▪▪', '▫');
    }
    
    if (this.config.complexity !== 'simple') {
      punctuation.push(...advancedPunctuation);
    }
    
    return punctuation;
  }

  private generateSpecialFeatures(type: WritingSystem['type']): string[] {
    const features: string[] = [];
    
    const typeFeatures = {
      alphabetic: [
        'Consonant clusters written as ligatures',
        'Vowel diacritics for tone marking',
        'Case distinction for proper nouns',
        'Contextual letter forms (initial, medial, final)',
        'Calligraphic variants for formal writing'
      ],
      syllabic: [
        'Inherent vowel system with /a/ as default',
        'Consonant conjuncts for clusters',
        'Virama-like symbol for consonant-final syllables',
        'Vowel length indicated by doubling',
        'Tone marks as superscript symbols'
      ],
      logographic: [
        'Semantic and phonetic components',
        'Radical-based organization system',
        'Compound characters for abstract concepts',
        'Simplified forms for common words',
        'Variant forms for different registers',
        'Cursive script for rapid writing'
      ],
      featural: [
        'Visual representation of articulatory features',
        'Systematic shape modifications for related sounds',
        'Stacking system for consonant clusters',
        'Geometric harmony in character design',
        'Modular construction allows new character creation'
      ],
      mixed: [
        'Logographic characters for core vocabulary',
        'Syllabic script for grammatical morphemes',
        'Alphabetic elements for foreign words',
        'Context determines script choice'
      ]
    };
    
    features.push(...this.selectRandom(typeFeatures[type], 3));
    
    // Add universal features
    if (this.conlang.features.hasTones) {
      features.push('Tone marks integrated into character design');
    }
    
    if (this.conlang.features.hasHonorific) {
      features.push('Honorific markers in formal writing');
    }
    
    if (this.config.complexity === 'complex') {
      features.push('Multiple historical layers in orthography');
      features.push('Regional variants of character forms');
    }
    
    return features;
  }

  private phoneToChar(phone: string): string {
    const mapping: { [key: string]: string } = {
      'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
      'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'ʃ': 'š', 'ʒ': 'ž',
      'm': 'm', 'n': 'n', 'ŋ': 'ŋ', 'l': 'l', 'r': 'r', 'w': 'w', 'j': 'y',
      'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
      'ɛ': 'ë', 'ɔ': 'ö', 'ə': 'ə'
    };
    
    return mapping[phone] || phone;
  }

  private weightedSelection<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  private selectRandom<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}