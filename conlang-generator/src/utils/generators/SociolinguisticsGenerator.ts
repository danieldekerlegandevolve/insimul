import { GeneratedConlang, ConlangConfig } from '@/types/language';

export interface SociolinguisticVariation {
  dimension: 'register' | 'age' | 'gender' | 'class' | 'profession' | 'region';
  name: string;
  description: string;
  features: {
    phonological?: string[];
    lexical?: { [standard: string]: string };
    grammatical?: string[];
    pragmatic?: string[];
  };
  examples: {
    context: string;
    standard: string;
    variant: string;
    explanation: string;
  }[];
}

export class SociolinguisticsGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generateVariations(): SociolinguisticVariation[] {
    const variations: SociolinguisticVariation[] = [];

    variations.push(this.generateRegisterVariation());
    variations.push(this.generateAgeVariation());
    variations.push(this.generateProfessionalVariation());

    return variations;
  }

  private generateRegisterVariation(): SociolinguisticVariation {
    return {
      dimension: 'register',
      name: 'Formal Register',
      description: 'Used in official, ceremonial, and academic contexts',
      features: {
        phonological: [
          'Conservative pronunciation with full vowels',
          'Careful articulation of consonant clusters',
          'Slower speech tempo'
        ],
        lexical: this.generateFormalLexicon(),
        grammatical: [
          'Complex sentence structures',
          'Passive voice constructions',
          'Elaborate honorific system'
        ],
        pragmatic: [
          'Indirect speech acts',
          'Elaborate politeness markers',
          'Avoidance of personal pronouns'
        ]
      },
      examples: [
        {
          context: 'Academic presentation',
          standard: this.translateToConlang('The research shows interesting results'),
          variant: this.translateToConlang('The esteemed research demonstrates most fascinating outcomes'),
          explanation: 'Formal register uses more elaborate vocabulary and complex structures'
        }
      ]
    };
  }

  private generateAgeVariation(): SociolinguisticVariation {
    return {
      dimension: 'age',
      name: 'Youth Variety',
      description: 'Spoken by younger generations, showing innovation and change',
      features: {
        phonological: [
          'Vowel mergers in unstressed syllables',
          'Consonant cluster simplification',
          'Rising intonation in statements'
        ],
        lexical: this.generateYouthLexicon(),
        grammatical: [
          'Simplified case marking',
          'Increased use of auxiliary verbs',
          'Word order flexibility'
        ],
        pragmatic: [
          'Direct communication style',
          'Frequent use of discourse markers',
          'Code-switching with other languages'
        ]
      },
      examples: [
        {
          context: 'Casual conversation',
          standard: this.translateToConlang('I am going to the market'),
          variant: this.translateToConlang('Going market, yeah?'),
          explanation: 'Youth variety shows grammatical simplification and casual tone'
        }
      ]
    };
  }

  private generateProfessionalVariation(): SociolinguisticVariation {
    return {
      dimension: 'profession',
      name: 'Scholarly Variety',
      description: 'Used by academics, scribes, and learned professionals',
      features: {
        phonological: [
          'Preservation of archaic pronunciations',
          'Careful distinction of similar sounds',
          'Formal stress patterns'
        ],
        lexical: this.generateScholarlyLexicon(),
        grammatical: [
          'Complex subordination',
          'Archaic verb forms',
          'Elaborate case system'
        ],
        pragmatic: [
          'Precise terminology',
          'Logical discourse structure',
          'Citation of authorities'
        ]
      },
      examples: [
        {
          context: 'Academic discourse',
          standard: this.translateToConlang('This theory explains the phenomenon'),
          variant: this.translateToConlang('This theoretical framework elucidates the aforementioned phenomenon'),
          explanation: 'Scholarly variety employs technical vocabulary and complex syntax'
        }
      ]
    };
  }

  private generateFormalLexicon(): { [standard: string]: string } {
    const formal: { [standard: string]: string } = {};
    const sampleWords = Object.entries(this.conlang.sampleWords).slice(0, 5);
    
    sampleWords.forEach(([english, standard]) => {
      formal[standard] = this.generateFormalVariant(standard);
    });

    return formal;
  }

  private generateYouthLexicon(): { [standard: string]: string } {
    const youth: { [standard: string]: string } = {};
    const sampleWords = Object.entries(this.conlang.sampleWords).slice(0, 5);
    
    sampleWords.forEach(([english, standard]) => {
      youth[standard] = this.generateYouthVariant(standard);
    });

    return youth;
  }

  private generateScholarlyLexicon(): { [standard: string]: string } {
    const scholarly: { [standard: string]: string } = {};
    const sampleWords = Object.entries(this.conlang.sampleWords).slice(0, 5);
    
    sampleWords.forEach(([english, standard]) => {
      scholarly[standard] = this.generateScholarlyVariant(standard);
    });

    return scholarly;
  }

  private generateFormalVariant(word: string): string {
    const formalMarkers = ['vel-', 'san-', 'hon-', '-eth', '-oth', '-ven'];
    const marker = formalMarkers[Math.floor(Math.random() * formalMarkers.length)];
    return marker.startsWith('-') ? word + marker : marker + word;
  }

  private generateYouthVariant(word: string): string {
    if (word.length > 4) {
      return word.slice(0, -1);
    }
    return word + 'i';
  }

  private generateScholarlyVariant(word: string): string {
    const scholarlyMarkers = ['proto-', 'meta-', 'neo-', '-ensis', '-icus', '-alis'];
    const marker = scholarlyMarkers[Math.floor(Math.random() * scholarlyMarkers.length)];
    return marker.startsWith('-') ? word + marker : marker + word;
  }

  private translateToConlang(english: string): string {
    // Simplified translation - in practice this would be more sophisticated
    const words = english.toLowerCase().split(' ');
    return words.map(word => this.conlang.sampleWords[word] || this.generateWord()).join(' ');
  }

  private generateWord(): string {
    const consonant = this.conlang.phonemes.consonants[Math.floor(Math.random() * this.conlang.phonemes.consonants.length)];
    const vowel = this.conlang.phonemes.vowels[Math.floor(Math.random() * this.conlang.phonemes.vowels.length)];
    return consonant + vowel + consonant;
  }
}