import { SampleText, GeneratedConlang, ConlangConfig } from '@/types/language';

export class SampleTextGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generate(): SampleText[] {
    const texts: SampleText[] = [];
    
    texts.push(this.generateGreeting());
    texts.push(this.generateQuestion());
    texts.push(this.generateStatement());
    texts.push(this.generatePoem());
    texts.push(this.generateProverb());
    
    return texts;
  }

  private generateGreeting(): SampleText {
    const english = 'Peace be upon you, honored friend.';
    const conlang = this.translateToConlang(english);
    
    return {
      english,
      conlang,
      type: 'greeting',
      transliteration: this.generateTransliteration(conlang),
      grammaticalAnalysis: [
        'Blessing formula + honorific + vocative',
        'Formal register with respect markers'
      ]
    };
  }

  private generateQuestion(): SampleText {
    const english = 'Where does the sacred river flow?';
    const conlang = this.translateToConlang(english);
    
    return {
      english,
      conlang,
      type: 'question',
      transliteration: this.generateTransliteration(conlang),
      grammaticalAnalysis: [
        'Interrogative adverb + auxiliary + adjective + noun + verb',
        'Present tense with locative focus'
      ]
    };
  }

  private generateStatement(): SampleText {
    const english = 'The ancient wisdom guides our path through darkness.';
    const conlang = this.translateToConlang(english);
    
    return {
      english,
      conlang,
      type: 'statement',
      transliteration: this.generateTransliteration(conlang),
      grammaticalAnalysis: [
        'Definite article + adjective + noun + verb + possessive + noun + preposition + noun',
        'Metaphorical construction with instrumental case'
      ]
    };
  }

  private generatePoem(): SampleText {
    const english = 'Stars whisper secrets to the mountain peaks, while winds carry songs across the valleys.';
    const conlang = this.translateToConlang(english);
    
    return {
      english,
      conlang,
      type: 'poem',
      transliteration: this.generateTransliteration(conlang),
      grammaticalAnalysis: [
        'Parallel structure with personification',
        'Temporal subordinate clause',
        'Poetic register with nature imagery'
      ]
    };
  }

  private generateProverb(): SampleText {
    const english = 'The tree that bends in the storm survives, while the rigid oak breaks.';
    const conlang = this.translateToConlang(english);
    
    return {
      english,
      conlang,
      type: 'proverb',
      transliteration: this.generateTransliteration(conlang),
      grammaticalAnalysis: [
        'Relative clause construction',
        'Contrastive conjunction',
        'Wisdom literature with natural metaphor'
      ]
    };
  }

  private translateToConlang(english: string): string {
    const words = english.toLowerCase().replace(/[.,!?;:]/g, '').split(' ');
    const translated = words.map(word => {
      if (this.conlang.sampleWords[word]) {
        return this.conlang.sampleWords[word];
      }
      return this.generateContextualWord(word);
    });
    
    return this.applyWordOrder(translated);
  }

  private generateContextualWord(englishWord: string): string {
    // Generate word based on semantic category
    const semanticCategories: { [key: string]: string[] } = {
      nature: ['mountain', 'river', 'tree', 'star', 'wind', 'storm', 'valley', 'peak'],
      abstract: ['wisdom', 'peace', 'honor', 'secret', 'path', 'darkness', 'light'],
      actions: ['flow', 'guide', 'whisper', 'carry', 'bend', 'break', 'survive'],
      social: ['friend', 'people', 'family', 'person'],
      temporal: ['ancient', 'while', 'through']
    };
    
    for (const [category, words] of Object.entries(semanticCategories)) {
      if (words.includes(englishWord)) {
        return this.generateSemanticWord(category);
      }
    }
    
    return this.generateWord();
  }

  private generateSemanticWord(category: string): string {
    const patterns: { [key: string]: { consonants: string[], vowels: string[] } } = {
      nature: { consonants: ['l', 'r', 'm', 'n', 'w'], vowels: ['a', 'o', 'u'] },
      abstract: { consonants: ['s', 'ʃ', 'h', 'f'], vowels: ['i', 'e'] },
      actions: { consonants: ['p', 't', 'k', 'b', 'd', 'g'], vowels: ['i', 'a'] },
      social: { consonants: ['m', 'n', 'l', 'j'], vowels: ['a', 'e', 'o'] },
      temporal: { consonants: ['t', 'd', 's', 'z'], vowels: ['i', 'u'] }
    };
    
    const pattern = patterns[category];
    if (!pattern) return this.generateWord();
    
    const consonant = pattern.consonants[Math.floor(Math.random() * pattern.consonants.length)];
    const vowel = pattern.vowels[Math.floor(Math.random() * pattern.vowels.length)];
    const finalConsonant = pattern.consonants[Math.floor(Math.random() * pattern.consonants.length)];
    
    return consonant + vowel + finalConsonant;
  }

  private generateWord(): string {
    const consonant = this.conlang.phonemes.consonants[Math.floor(Math.random() * this.conlang.phonemes.consonants.length)];
    const vowel = this.conlang.phonemes.vowels[Math.floor(Math.random() * this.conlang.phonemes.vowels.length)];
    return consonant + vowel + consonant;
  }

  private applyWordOrder(words: string[]): string {
    if (words.length < 3) return words.join(' ');
    
    // Simple word order transformation
    if (this.conlang.features.wordOrder === 'VSO' && words.length >= 3) {
      const [first, second, ...rest] = words;
      return [second, first, ...rest].join(' ');
    }
    
    return words.join(' ');
  }

  private generateTransliteration(conlangText: string): string {
    return conlangText.split('').map(char => {
      const translitMap: { [key: string]: string } = {
        'ʃ': 'sh', 'ʒ': 'zh', 'θ': 'th', 'ð': 'dh', 'ŋ': 'ng',
        'ɲ': 'ny', 'ʎ': 'ly', 'ɬ': 'lh', 'ʔ': "'", 'χ': 'kh'
      };
      return translitMap[char] || char;
    }).join('');
  }
}