import { GeneratedConlang, ConlangConfig } from '@/types/language';

export interface MorphophonologicalRule {
  name: string;
  type: 'vowel-harmony' | 'consonant-gradation' | 'ablaut' | 'umlaut' | 'sandhi' | 'mutation';
  description: string;
  environment: string;
  examples: {
    base: string;
    modified: string;
    context: string;
    meaning: string;
  }[];
  frequency: 'systematic' | 'common' | 'lexicalized';
}

export class MorphophonologyGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generateRules(): MorphophonologicalRule[] {
    const rules: MorphophonologicalRule[] = [];

    // Generate vowel harmony if appropriate
    if (this.shouldGenerateVowelHarmony()) {
      rules.push(this.generateVowelHarmony());
    }

    // Generate consonant gradation for agglutinative languages
    if (this.shouldGenerateConsonantGradation()) {
      rules.push(this.generateConsonantGradation());
    }

    // Generate ablaut for fusional languages
    if (this.shouldGenerateAblaut()) {
      rules.push(this.generateAblaut());
    }

    // Generate sandhi rules
    if (this.shouldGenerateSandhi()) {
      rules.push(this.generateSandhiRule());
    }

    // Generate mutation for Celtic-like languages
    if (this.shouldGenerateMutation()) {
      rules.push(this.generateMutation());
    }

    return rules;
  }

  private shouldGenerateVowelHarmony(): boolean {
    return this.conlang.phonemes.vowels.length >= 6 && Math.random() < 0.4;
  }

  private shouldGenerateConsonantGradation(): boolean {
    return this.conlang.features.agglutinative && Math.random() < 0.3;
  }

  private shouldGenerateAblaut(): boolean {
    return this.conlang.features.fusional && Math.random() < 0.5;
  }

  private shouldGenerateSandhi(): boolean {
    return Math.random() < 0.6;
  }

  private shouldGenerateMutation(): boolean {
    return this.config.complexity === 'complex' && Math.random() < 0.2;
  }

  private generateVowelHarmony(): MorphophonologicalRule {
    return {
      name: 'Front-Back Vowel Harmony',
      type: 'vowel-harmony',
      description: 'Vowels in suffixes harmonize with the frontness/backness of the root vowel',
      environment: 'Within morphological words',
      examples: [
        {
          base: this.generateWord(2),
          modified: this.generateWord(2) + 'in',
          context: 'with front vowel suffix',
          meaning: 'plural marker with front vowels'
        },
        {
          base: this.generateWord(2),
          modified: this.generateWord(2) + 'un',
          context: 'with back vowel suffix',
          meaning: 'plural marker with back vowels'
        }
      ],
      frequency: 'systematic'
    };
  }

  private generateConsonantGradation(): MorphophonologicalRule {
    return {
      name: 'Consonant Gradation',
      type: 'consonant-gradation',
      description: 'Consonants alternate between strong and weak grades in different morphological contexts',
      environment: 'In closed vs. open syllables',
      examples: [
        {
          base: 'katu',
          modified: 'kadun',
          context: 'genitive case',
          meaning: 'street → of the street'
        },
        {
          base: 'tupa',
          modified: 'tuvan',
          context: 'genitive case',
          meaning: 'house → of the house'
        }
      ],
      frequency: 'systematic'
    };
  }

  private generateAblaut(): MorphophonologicalRule {
    return {
      name: 'Verbal Ablaut',
      type: 'ablaut',
      description: 'Root vowels change to indicate different tense/aspect categories',
      environment: 'In verbal paradigms',
      examples: [
        {
          base: 'sing',
          modified: 'sang',
          context: 'past tense',
          meaning: 'sing → sang'
        },
        {
          base: 'drink',
          modified: 'drank',
          context: 'past tense',
          meaning: 'drink → drank'
        }
      ],
      frequency: 'lexicalized'
    };
  }

  private generateSandhiRule(): MorphophonologicalRule {
    return {
      name: 'Vowel Sandhi',
      type: 'sandhi',
      description: 'Adjacent vowels at morpheme boundaries undergo fusion or deletion',
      environment: 'At morpheme boundaries',
      examples: [
        {
          base: 'mata + ari',
          modified: 'matari',
          context: 'compound formation',
          meaning: 'eye + day → sun'
        },
        {
          base: 'kala + ika',
          modified: 'kalika',
          context: 'derivational suffix',
          meaning: 'fish + diminutive → little fish'
        }
      ],
      frequency: 'common'
    };
  }

  private generateMutation(): MorphophonologicalRule {
    return {
      name: 'Initial Consonant Mutation',
      type: 'mutation',
      description: 'Word-initial consonants change in specific grammatical contexts',
      environment: 'After certain particles or in specific constructions',
      examples: [
        {
          base: 'tad',
          modified: 'dad',
          context: 'after possessive',
          meaning: 'father → his father'
        },
        {
          base: 'pen',
          modified: 'ben',
          context: 'after definite article',
          meaning: 'head → the head'
        }
      ],
      frequency: 'systematic'
    };
  }

  private generateWord(syllables?: number): string {
    const syllableCount = syllables || Math.floor(Math.random() * 3) + 1;
    let word = '';
    
    for (let i = 0; i < syllableCount; i++) {
      const consonant = this.conlang.phonemes.consonants[Math.floor(Math.random() * this.conlang.phonemes.consonants.length)];
      const vowel = this.conlang.phonemes.vowels[Math.floor(Math.random() * this.conlang.phonemes.vowels.length)];
      word += consonant + vowel;
    }
    
    return word;
  }
}