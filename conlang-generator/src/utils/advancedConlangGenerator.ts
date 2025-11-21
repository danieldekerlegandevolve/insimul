import { WritingSystem, CulturalContext, SampleText, Etymology, LearningModule, DialectVariation } from '@/types/language';
import { GeneratedConlang, ConlangConfig } from '@/types/language';

// Import specialized generators
import { MorphophonologyGenerator, MorphophonologicalRule } from './generators/MorphophonologyGenerator';
import { SociolinguisticsGenerator, SociolinguisticVariation } from './generators/SociolinguisticsGenerator';
import { WritingSystemGenerator } from './generators/WritingSystemGenerator';
import { CulturalContextGenerator } from './generators/CulturalContextGenerator';
import { SampleTextGenerator } from './generators/SampleTextGenerator';
import { EtymologyGenerator } from './generators/EtymologyGenerator';
import { LearningModuleGenerator } from './generators/LearningModuleGenerator';

export class AdvancedConlangGenerator {
  private config: ConlangConfig;
  private conlang: GeneratedConlang;

  // Specialized generators
  private morphophonologyGenerator: MorphophonologyGenerator;
  private sociolinguisticsGenerator: SociolinguisticsGenerator;
  private writingSystemGenerator: WritingSystemGenerator;
  private culturalContextGenerator: CulturalContextGenerator;
  private sampleTextGenerator: SampleTextGenerator;
  private etymologyGenerator: EtymologyGenerator;
  private learningModuleGenerator: LearningModuleGenerator;

  constructor(config: ConlangConfig, baseConlang: GeneratedConlang) {
    this.config = config;
    this.conlang = baseConlang;

    // Initialize specialized generators
    this.morphophonologyGenerator = new MorphophonologyGenerator(config, baseConlang);
    this.sociolinguisticsGenerator = new SociolinguisticsGenerator(config, baseConlang);
    this.writingSystemGenerator = new WritingSystemGenerator(config, baseConlang);
    this.culturalContextGenerator = new CulturalContextGenerator(config);
    this.sampleTextGenerator = new SampleTextGenerator(config, baseConlang);
    this.etymologyGenerator = new EtymologyGenerator(config, baseConlang);
    this.learningModuleGenerator = new LearningModuleGenerator(config, baseConlang);
  }

  // Public interface methods - delegate to specialized generators
  generateMorphophonologicalRules(): MorphophonologicalRule[] {
    return this.morphophonologyGenerator.generateRules();
  }

  generateSociolinguisticVariations(): SociolinguisticVariation[] {
    return this.sociolinguisticsGenerator.generateVariations();
  }

  generateWritingSystem(): WritingSystem {
    return this.writingSystemGenerator.generate();
  }

  generateCulturalContext(): CulturalContext {
    return this.culturalContextGenerator.generate();
  }

  generateSampleTexts(): SampleText[] {
    return this.sampleTextGenerator.generate();
  }

  generateEtymologies(): Etymology[] {
    return this.etymologyGenerator.generate();
  }

  generateLearningModules(): LearningModule[] {
    return this.learningModuleGenerator.generate();
  }

  // Dialect generation - keeping this in main class as it's more complex
  generateDialectVariations(): DialectVariation[] {
    const dialects: DialectVariation[] = [];
    const regions = ['Northern', 'Southern', 'Eastern', 'Western', 'Central', 'Coastal'];
    
    regions.slice(0, 3).forEach(region => {
      dialects.push({
        name: `${region} ${this.conlang.name}`,
        region: `${region} Region`,
        differences: {
          phonological: this.generatePhonologicalDifferences(region),
          lexical: this.generateLexicalDifferences(region),
          grammatical: this.generateGrammaticalDifferences(region)
        }
      });
    });
    
    return dialects;
  }

  private generatePhonologicalDifferences(region: string): string[] {
    const changePatterns = {
      Northern: [
        '/r/ realized as uvular [ʀ]',
        'Vowel raising: /e/ → [i] in unstressed syllables',
        'Final consonant devoicing'
      ],
      Southern: [
        '/θ/ merged with /f/',
        'Vowel lowering: /i/ → [e] before /r/',
        'Consonant cluster simplification'
      ],
      Eastern: [
        'Palatalization of /k/ before front vowels',
        '/l/ vocalized to [w] in coda position',
        'Tone sandhi in compound words'
      ],
      Western: [
        'Fricative voicing in intervocalic position',
        'Vowel harmony disruption',
        'Stress shift to initial syllable'
      ],
      Central: [
        'Conservative phonology with archaic distinctions',
        'Preservation of consonant length',
        'Tonal register split'
      ],
      Coastal: [
        'Nasal vowels before fricatives',
        'Consonant lenition in unstressed syllables',
        'Intonational changes due to substrate influence'
      ]
    };
    
    return changePatterns[region] || changePatterns.Central;
  }

  private generateLexicalDifferences(region: string): { [word: string]: string } {
    const differences: { [word: string]: string } = {};
    const sampleWords = Object.entries(this.conlang.sampleWords).slice(0, 5);
    
    sampleWords.forEach(([english, standard]) => {
      differences[standard] = this.generateDialectWord(standard, region);
    });
    
    return differences;
  }

  private generateDialectWord(standardWord: string, region: string): string {
    const transformations = {
      Northern: (word: string) => word.replace(/a/g, 'ä'),
      Southern: (word: string) => word + 'i',
      Eastern: (word: string) => 'k' + word,
      Western: (word: string) => word.replace(/o/g, 'u'),
      Central: (word: string) => word, // Conservative
      Coastal: (word: string) => word.replace(/r/g, 'l')
    };
    
    const transform = transformations[region] || transformations.Central;
    return transform(standardWord);
  }

  private generateGrammaticalDifferences(region: string): string[] {
    const grammarPatterns = {
      Northern: [
        'Uses auxiliary verb for future tense',
        'Postpositional rather than prepositional phrases',
        'Evidentiality marking on all verbs'
      ],
      Southern: [
        'Simplified case system with only 3 cases',
        'Serial verb constructions common',
        'No grammatical gender distinction'
      ],
      Eastern: [
        'Complex honorific system with 5 levels',
        'Classifier system for counting nouns',
        'Switch-reference marking in subordinate clauses'
      ],
      Western: [
        'Ergative-absolutive alignment',
        'Inclusive/exclusive pronoun distinction',
        'Aspectual rather than temporal verb system'
      ],
      Central: [
        'Conservative grammar preserving archaic forms',
        'Complex verbal morphology',
        'Extensive case system'
      ],
      Coastal: [
        'Simplified morphology due to contact',
        'Borrowed grammatical constructions',
        'Analytic rather than synthetic tendencies'
      ]
    };
    
    return grammarPatterns[region] || grammarPatterns.Central;
  }

  // Utility methods for backward compatibility and shared functionality
  private selectRandom<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

// Export the interfaces for use in components
export type { MorphophonologicalRule, SociolinguisticVariation };