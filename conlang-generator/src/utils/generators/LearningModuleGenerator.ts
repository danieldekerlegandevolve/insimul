import { LearningModule, GeneratedConlang, ConlangConfig } from '@/types/language';

export class LearningModuleGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  constructor(config: ConlangConfig, conlang: GeneratedConlang) {
    this.config = config;
    this.conlang = conlang;
  }

  generate(): LearningModule[] {
    const modules: LearningModule[] = [];
    
    modules.push(this.generateVocabularyModule());
    modules.push(this.generateGrammarModule());
    modules.push(this.generatePronunciationModule());
    
    return modules;
  }

  private generateVocabularyModule(): LearningModule {
    return {
      id: 'vocab-basic',
      title: 'Essential Vocabulary',
      type: 'vocabulary',
      difficulty: 'beginner',
      content: [
        {
          instruction: `Learn these fundamental words in ${this.conlang.name}. Pay attention to the pronunciation and cultural context.`,
          examples: Object.entries(this.conlang.sampleWords).slice(0, 8).map(
            ([eng, con]) => `${eng} = ${con} [/${con}/]`
          ),
          exercises: this.generateVocabularyExercises()
        }
      ]
    };
  }

  private generateGrammarModule(): LearningModule {
    return {
      id: 'grammar-structure',
      title: 'Grammar Fundamentals',
      type: 'grammar',
      difficulty: 'intermediate',
      content: [
        {
          instruction: `${this.conlang.name} follows ${this.conlang.features.wordOrder} word order. Understanding this pattern is crucial for forming correct sentences.`,
          examples: [
            this.generateGrammarExample('basic-sentence'),
            this.generateGrammarExample('question'),
            this.generateGrammarExample('negation')
          ],
          exercises: this.generateGrammarExercises()
        }
      ]
    };
  }

  private generatePronunciationModule(): LearningModule {
    return {
      id: 'pronunciation',
      title: 'Pronunciation Guide',
      type: 'pronunciation',
      difficulty: 'beginner',
      content: [
        {
          instruction: `Master the sound system of ${this.conlang.name}. This language has ${this.conlang.phonemes.consonants.length} consonants and ${this.conlang.phonemes.vowels.length} vowels.`,
          examples: [
            ...this.conlang.phonemes.consonants.slice(0, 5).map(c => `${c} as in "${this.generateExampleWord(c)}"`),
            ...this.conlang.phonemes.vowels.slice(0, 3).map(v => `${v} as in "${this.generateExampleWord(v)}"`)
          ],
          exercises: this.generatePronunciationExercises()
        }
      ]
    };
  }

  private generateVocabularyExercises() {
    const exercises = [];
    const words = Object.entries(this.conlang.sampleWords).slice(0, 8);
    
    words.forEach(([english, conlang]) => {
      const wrongAnswers = Object.keys(this.conlang.sampleWords)
        .filter(w => w !== english)
        .slice(0, 3);
      
      exercises.push({
        question: `What does "${conlang}" mean?`,
        type: 'multiple-choice' as const,
        options: [english, ...wrongAnswers].sort(() => Math.random() - 0.5),
        correctAnswer: english,
        explanation: `"${conlang}" means "${english}" in ${this.conlang.name}.`
      });
    });
    
    return exercises;
  }

  private generateGrammarExercises() {
    const exercises = [];
    
    exercises.push({
      question: `What is the basic word order in ${this.conlang.name}?`,
      type: 'multiple-choice' as const,
      options: ['SVO', 'SOV', 'VSO', 'VOS', 'OSV', 'OVS'],
      correctAnswer: this.conlang.features.wordOrder,
      explanation: `${this.conlang.name} uses ${this.conlang.features.wordOrder} word order.`
    });
    
    return exercises;
  }

  private generatePronunciationExercises() {
    const exercises = [];
    
    this.conlang.phonemes.consonants.slice(0, 3).forEach(consonant => {
      exercises.push({
        question: `Which sound does the symbol "${consonant}" represent?`,
        type: 'multiple-choice' as const,
        options: [
          this.getPhoneticDescription(consonant),
          'voiced bilabial stop',
          'voiceless alveolar fricative',
          'voiced velar nasal'
        ].filter((v, i, a) => a.indexOf(v) === i),
        correctAnswer: this.getPhoneticDescription(consonant),
        explanation: `The symbol "${consonant}" represents ${this.getPhoneticDescription(consonant)}.`
      });
    });
    
    return exercises;
  }

  private generateGrammarExample(type: string): string {
    const examples = {
      'basic-sentence': `${this.conlang.sampleWords.person || 'kelu'} ${this.conlang.sampleWords.love || 'ama'} ${this.conlang.sampleWords.music || 'soni'} (Person loves music)`,
      'question': `${this.conlang.sampleWords.water || 'akva'} ${this.conlang.sampleWords.where || 'ubi'}? (Where is water?)`,
      'negation': `${this.conlang.sampleWords.sun || 'sol'} ne ${this.conlang.sampleWords.shine || 'lumi'} (Sun does not shine)`
    };
    
    return examples[type] || 'Example sentence';
  }

  private generateExampleWord(phoneme: string): string {
    const words = Object.values(this.conlang.sampleWords).filter(word => word.includes(phoneme));
    return words[0] || this.generateWord();
  }

  private generateWord(): string {
    const consonant = this.conlang.phonemes.consonants[Math.floor(Math.random() * this.conlang.phonemes.consonants.length)];
    const vowel = this.conlang.phonemes.vowels[Math.floor(Math.random() * this.conlang.phonemes.vowels.length)];
    return consonant + vowel + consonant;
  }

  private getPhoneticDescription(phoneme: string): string {
    const descriptions: { [key: string]: string } = {
      'p': 'voiceless bilabial stop',
      'b': 'voiced bilabial stop',
      't': 'voiceless alveolar stop',
      'd': 'voiced alveolar stop',
      'k': 'voiceless velar stop',
      'g': 'voiced velar stop',
      's': 'voiceless alveolar fricative',
      'z': 'voiced alveolar fricative',
      'm': 'voiced bilabial nasal',
      'n': 'voiced alveolar nasal',
      'l': 'voiced alveolar lateral',
      'r': 'voiced alveolar trill'
    };
    
    return descriptions[phoneme] || 'unknown sound';
  }
}