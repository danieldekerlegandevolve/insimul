import { Etymology, GeneratedConlang, ConlangConfig } from '@/types/language';

export class EtymologyGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generate(): Etymology[] {
    const etymologies: Etymology[] = [];
    const sampleWords = Object.entries(this.conlang.sampleWords).slice(0, 15);
    
    sampleWords.forEach(([english, conlang]) => {
      etymologies.push({
        word: conlang,
        meaning: english,
        origin: `Proto-${this.conlang.name}ic`,
        evolution: this.generateEvolution(conlang),
        cognates: this.generateCognates(english)
      });
    });
    
    return etymologies;
  }

  private generateEvolution(word: string): string[] {
    const stages = [];
    
    // Proto-stage
    let current = '*' + this.generateProtoForm(word);
    stages.push(`Proto-${this.conlang.name}ic: ${current}`);
    
    // Early stage
    current = this.applyEarlySoundChanges(current);
    stages.push(`Early ${this.conlang.name}: ${current}`);
    
    // Middle stage
    current = this.applyMiddleSoundChanges(current);
    stages.push(`Middle ${this.conlang.name}: ${current}`);
    
    // Modern form
    stages.push(`Modern ${this.conlang.name}: ${word}`);
    
    return stages;
  }

  private generateProtoForm(modernWord: string): string {
    let proto = modernWord;
    
    // Add archaic features
    if (Math.random() < 0.3) {
      proto += ['s', 't', 'n', 'm'][Math.floor(Math.random() * 4)];
    }
    
    if (Math.random() < 0.2) {
      proto = ['s', 'h', 'w'][Math.floor(Math.random() * 3)] + proto;
    }
    
    // Add vowel length
    proto = proto.replace(/([aeiou])/g, (match) => 
      Math.random() < 0.2 ? match + 'ː' : match
    );
    
    return proto;
  }

  private applyEarlySoundChanges(word: string): string {
    let changed = word.replace(/^\*/, '');
    
    // Grimm's law style changes
    changed = changed.replace(/p/g, 'f');
    changed = changed.replace(/t/g, 'θ');
    changed = changed.replace(/k/g, 'x');
    changed = changed.replace(/ː/g, ''); // Vowel shortening
    
    return changed;
  }

  private applyMiddleSoundChanges(word: string): string {
    let changed = word;
    
    // Later sound changes
    changed = changed.replace(/θ/g, 's'); // Fricative merger
    changed = changed.replace(/x/g, 'h'); // Weakening
    changed = changed.replace(/([aeiou])\1/g, '$1'); // Degemination
    
    return changed;
  }

  private generateCognates(english: string): { [language: string]: string } {
    const cognates: { [language: string]: string } = {};
    const relatedLanguages = [
      `North ${this.conlang.name}ic`,
      `South ${this.conlang.name}ic`,
      `Old ${this.conlang.name}`,
      `${this.conlang.name} Creole`
    ];
    
    relatedLanguages.forEach(lang => {
      cognates[lang] = this.generateCognateForm(english, lang);
    });
    
    return cognates;
  }

  private generateCognateForm(english: string, language: string): string {
    const baseWord = this.conlang.sampleWords[english] || this.generateWord();
    let cognate = baseWord;
    
    if (language.includes('North')) {
      cognate = cognate.replace(/a/g, 'ä').replace(/o/g, 'ö');
    } else if (language.includes('South')) {
      cognate = cognate.replace(/i/g, 'e').replace(/u/g, 'o');
    } else if (language.includes('Old')) {
      cognate = cognate + 'n';
    } else if (language.includes('Creole')) {
      cognate = cognate.replace(/([aeiou])/g, '$1$1');
    }
    
    return cognate;
  }

  private generateWord(): string {
    const consonant = this.conlang.phonemes.consonants[Math.floor(Math.random() * this.conlang.phonemes.consonants.length)];
    const vowel = this.conlang.phonemes.vowels[Math.floor(Math.random() * this.conlang.phonemes.vowels.length)];
    return consonant + vowel + consonant;
  }
}