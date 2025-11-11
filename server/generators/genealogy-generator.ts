/**
 * Procedural Genealogy Generator
 * Creates multi-generational family trees with realistic relationships
 */

import { storage } from '../db/storage';
import { nameGenerator } from './name-generator.js';
import type { InsertCharacter } from '../../shared/schema';

interface GenerationConfig {
  worldId: string;
  settlementId?: string;
  startYear: number;
  currentYear: number;
  numFoundingFamilies: number;
  generationsToGenerate: number;
  marriageRate: number;
  fertilityRate: number;
  deathRate: number;
}

interface FamilyLine {
  surname: string;
  generations: Map<number, string[]>; // generation number -> character IDs
  founders: { father: any; mother: any };
}

export class GenealogyGenerator {
  private namePool = {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
           'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth',
           'Joshua', 'George', 'Kevin', 'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
             'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna', 'Michelle',
             'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia', 'Anna'],
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
              'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Young']
  };

  private usedNames = new Set<string>();
  private worldContext: any = null;
  private countryContext: any = null;
  private settlementContext: any = null;

  /**
   * Generate a complete multi-generational genealogy
   */
  async generate(config: GenerationConfig): Promise<{
    families: FamilyLine[];
    totalCharacters: number;
    generations: number;
  }> {
    console.log(`🌳 Generating genealogy for ${config.numFoundingFamilies} families over ${config.generationsToGenerate} generations...`);
    
    // Validate that settlementId is provided
    if (!config.settlementId) {
      throw new Error('settlementId is required for character generation to prevent orphaned characters');
    }
    
    // TypeScript type narrowing - settlementId is now guaranteed to be defined
    const settlementId: string = config.settlementId;
    
    // Load context for name generation
    await this.loadContext(config);
    
    const families: FamilyLine[] = [];
    
    // Batch generate ALL founder names upfront to reduce API calls
    console.log(`   👥 Batch generating names for ${config.numFoundingFamilies} founding families...`);
    const founderNames = await this.batchGenerateFounderNames(config.numFoundingFamilies);
    
    // Create founding generation (Generation 0)
    for (let i = 0; i < config.numFoundingFamilies; i++) {
      const family = await this.createFoundingFamily(config, i, founderNames[i]);
      families.push(family);
    }
    
    // Generate subsequent generations
    for (let gen = 1; gen < config.generationsToGenerate; gen++) {
      console.log(`   👨‍👩‍👧‍👦 Generating generation ${gen}...`);
      
      for (const family of families) {
        await this.generateNextGeneration(config, family, gen);
      }
      
      // Create cross-family marriages
      await this.createMarriages(config, families, gen);
    }
    
    // Count total characters
    let totalCharacters = 0;
    for (const family of families) {
      for (const [_, charIds] of Array.from(family.generations.entries())) {
        totalCharacters += charIds.length;
      }
    }
    
    console.log(`✅ Generated ${totalCharacters} characters across ${config.generationsToGenerate} generations`);
    
    return {
      families,
      totalCharacters,
      generations: config.generationsToGenerate
    };
  }

  /**
   * Batch generate all founder names to reduce API calls
   */
  private async batchGenerateFounderNames(numFamilies: number): Promise<Array<{
    surname: string,
    fatherName: string,
    motherName: string,
    motherMaidenName: string
  }>> {
    if (!nameGenerator.isEnabled() || !this.worldContext) {
      // Fallback to traditional name generation
      return Array(numFamilies).fill(null).map(() => ({
        surname: this.getFallbackName('male') + 'son',
        fatherName: this.getFallbackName('male'),
        motherName: this.getFallbackName('female'),
        motherMaidenName: this.getFallbackName('male') + 'son'
      }));
    }

    try {
      // Generate all male names (for fathers) in one batch
      const maleNames = await nameGenerator.generateCharacterNamesBatch({
        worldName: this.worldContext.name,
        worldDescription: this.worldContext.description || undefined,
        countryName: this.countryContext?.name,
        countryDescription: this.countryContext?.description || undefined,
        settlementName: this.settlementContext?.name,
        settlementType: this.settlementContext?.settlementType,
        gender: 'male',
        generation: 0,
        isFounder: true
      }, numFamilies);

      // Generate all female names (for mothers) in one batch
      const femaleNames = await nameGenerator.generateCharacterNamesBatch({
        worldName: this.worldContext.name,
        worldDescription: this.worldContext.description || undefined,
        countryName: this.countryContext?.name,
        countryDescription: this.countryContext?.description || undefined,
        settlementName: this.settlementContext?.name,
        settlementType: this.settlementContext?.settlementType,
        gender: 'female',
        generation: 0,
        isFounder: true
      }, numFamilies);

      // Combine into founder records
      const founders = [];
      for (let i = 0; i < numFamilies; i++) {
        const male = maleNames[i] || { firstName: this.getFallbackName('male'), lastName: this.getFallbackName('male') + 'son' };
        const female = femaleNames[i] || { firstName: this.getFallbackName('female'), lastName: this.getFallbackName('male') + 'son' };
        
        founders.push({
          surname: male.lastName,
          fatherName: male.firstName,
          motherName: female.firstName,
          motherMaidenName: female.lastName
        });
        
        // Mark names as used
        this.usedNames.add(male.firstName);
        this.usedNames.add(female.firstName);
        this.usedNames.add(male.lastName);
        this.usedNames.add(female.lastName);
      }

      return founders;
    } catch (error) {
      console.warn('Batch founder name generation failed, using fallbacks:', error);
      return Array(numFamilies).fill(null).map(() => ({
        surname: this.getFallbackName('male') + 'son',
        fatherName: this.getFallbackName('male'),
        motherName: this.getFallbackName('female'),
        motherMaidenName: this.getFallbackName('male') + 'son'
      }));
    }
  }

  /**
   * Create a founding family (generation 0)
   */
  private async createFoundingFamily(
    config: GenerationConfig, 
    index: number,
    names?: {surname: string, fatherName: string, motherName: string, motherMaidenName: string}
  ): Promise<FamilyLine> {
    // Use pre-generated names if provided, otherwise generate them
    const surname = names?.surname || await this.getUniqueSurname();
    const fatherName = names?.fatherName || await this.getUniqueName('male', 0, true);
    const motherName = names?.motherName || await this.getUniqueName('female', 0, true);
    const motherMaidenName = names?.motherMaidenName || await this.getUniqueSurname();
    
    // Create father
    const father = await storage.createCharacter({
      worldId: config.worldId,
      firstName: fatherName,
      lastName: surname,
      gender: 'male',
      birthYear: config.startYear - 25,
      isAlive: this.isAlive(config.startYear - 25, config.currentYear, config.deathRate),
      currentLocation: config.settlementId!,
      personality: this.generatePersonality(),
      socialAttributes: {
        generation: 0,
        founderFamily: true
      }
    });
    
    // Create mother
    const mother = await storage.createCharacter({
      worldId: config.worldId,
      firstName: motherName,
      lastName: surname,
      maidenName: motherMaidenName,
      gender: 'female',
      birthYear: config.startYear - 23,
      isAlive: this.isAlive(config.startYear - 23, config.currentYear, config.deathRate),
      spouseId: father.id,
      currentLocation: config.settlementId!,
      personality: this.generatePersonality(),
      socialAttributes: {
        generation: 0,
        founderFamily: true
      }
    });
    
    await storage.updateCharacter(father.id, { spouseId: mother.id });
    
    // Create initial children
    const numChildren = this.rollChildren(config.fertilityRate);
    const children = await this.createChildren(config, father, mother, config.startYear, 1, numChildren);
    
    const childIds = children.map(c => c.id);
    await storage.updateCharacter(father.id, { childIds });
    await storage.updateCharacter(mother.id, { childIds });
    
    const familyLine: FamilyLine = {
      surname,
      generations: new Map(),
      founders: { father, mother }
    };
    
    familyLine.generations.set(0, [father.id, mother.id]);
    familyLine.generations.set(1, childIds);
    
    return familyLine;
  }

  /**
   * Generate the next generation for a family
   */
  private async generateNextGeneration(
    config: GenerationConfig,
    family: FamilyLine,
    generation: number
  ): Promise<void> {
    const previousGen = family.generations.get(generation - 1) || [];
    const newGeneration: string[] = [];
    
    for (const parentId of previousGen) {
      const parent = await storage.getCharacter(parentId);
      if (!parent || !parent.spouseId) continue;
      
      // Check if this parent already has children from previous generation
      if (parent.childIds && parent.childIds.length > 0) continue;
      
      const spouse = await storage.getCharacter(parent.spouseId);
      if (!spouse) continue;
      
      // Determine if couple has children based on age and fertility
      const parentAge = config.currentYear - (parent.birthYear || 0);
      if (parentAge < 20 || parentAge > 45) continue;
      
      if (Math.random() > config.fertilityRate) continue;
      
      const numChildren = this.rollChildren(config.fertilityRate);
      const birthYear = config.startYear + (generation * 25) + Math.floor(Math.random() * 10);
      
      const children = await this.createChildren(
        config,
        parent.gender === 'male' ? parent : spouse,
        parent.gender === 'female' ? parent : spouse,
        birthYear,
        generation + 1,
        numChildren
      );
      
      const childIds = children.map(c => c.id);
      newGeneration.push(...childIds);
      
      await storage.updateCharacter(parent.id, { childIds });
      await storage.updateCharacter(spouse.id, { childIds });
    }
    
    if (newGeneration.length > 0) {
      const existing = family.generations.get(generation) || [];
      family.generations.set(generation, [...existing, ...newGeneration]);
    }
  }

  /**
   * Create marriages between different families
   */
  private async createMarriages(
    config: GenerationConfig,
    families: FamilyLine[],
    generation: number
  ): Promise<void> {
    // Collect all unmarried adults from this generation across all families
    const unmarried: any[] = [];
    
    for (const family of families) {
      const genCharIds = family.generations.get(generation) || [];
      for (const charId of genCharIds) {
        const char = await storage.getCharacter(charId);
        if (char && !char.spouseId && char.isAlive) {
          unmarried.push(char);
        }
      }
    }
    
    // Shuffle and pair them up based on marriage rate
    this.shuffle(unmarried);
    
    for (let i = 0; i < unmarried.length - 1; i += 2) {
      if (Math.random() > config.marriageRate) continue;
      
      const char1 = unmarried[i];
      const char2 = unmarried[i + 1];
      
      // Don't marry siblings or people of same gender
      if (char1.gender === char2.gender) continue;
      if (char1.parentIds && char2.parentIds && 
          char1.parentIds.some((p: string) => char2.parentIds?.includes(p))) continue;
      
      // Create marriage
      await storage.updateCharacter(char1.id, { spouseId: char2.id });
      await storage.updateCharacter(char2.id, { spouseId: char1.id });
      
      // If female, update maiden name and surname
      if (char1.gender === 'female') {
        await storage.updateCharacter(char1.id, {
          maidenName: char1.lastName,
          lastName: char2.lastName
        });
      } else {
        await storage.updateCharacter(char2.id, {
          maidenName: char2.lastName,
          lastName: char1.lastName
        });
      }
    }
  }

  /**
   * Create children for a couple
   */
  private async createChildren(
    config: GenerationConfig,
    father: any,
    mother: any,
    birthYear: number,
    generation: number,
    count: number
  ): Promise<any[]> {
    const children = [];
    
    // Pre-determine genders
    const childrenInfo = Array(count).fill(null).map((_, i) => ({
      gender: Math.random() > 0.5 ? 'male' as const : 'female' as const,
      birthYear: birthYear + i
    }));
    
    // Batch generate all names at once if LLM is available
    let firstNames: string[];
    if (nameGenerator.isEnabled() && this.worldContext) {
      try {
        const maleCount = childrenInfo.filter(c => c.gender === 'male').length;
        const femaleCount = childrenInfo.filter(c => c.gender === 'female').length;
        
        const maleNames = maleCount > 0 ? await nameGenerator.generateCharacterNamesBatch({
          worldName: this.worldContext.name,
          worldDescription: this.worldContext.description || undefined,
          countryName: this.countryContext?.name,
          countryDescription: this.countryContext?.description || undefined,
          settlementName: this.settlementContext?.name,
          settlementType: this.settlementContext?.settlementType,
          gender: 'male',
          generation,
          isFounder: false
        }, maleCount) : [];
        
        const femaleNames = femaleCount > 0 ? await nameGenerator.generateCharacterNamesBatch({
          worldName: this.worldContext.name,
          worldDescription: this.worldContext.description || undefined,
          countryName: this.countryContext?.name,
          countryDescription: this.countryContext?.description || undefined,
          settlementName: this.settlementContext?.name,
          settlementType: this.settlementContext?.settlementType,
          gender: 'female',
          generation,
          isFounder: false
        }, femaleCount) : [];
        
        // Interleave names based on original gender order
        let maleIdx = 0, femaleIdx = 0;
        firstNames = childrenInfo.map(c => {
          if (c.gender === 'male') {
            return maleNames[maleIdx++]?.firstName || this.getFallbackName('male');
          } else {
            return femaleNames[femaleIdx++]?.firstName || this.getFallbackName('female');
          }
        });
      } catch (error) {
        console.warn('Batch name generation failed, using fallbacks');
        firstNames = childrenInfo.map(c => this.getFallbackName(c.gender));
      }
    } else {
      firstNames = childrenInfo.map(c => this.getFallbackName(c.gender));
    }
    
    // Create all children with generated names
    for (let i = 0; i < count; i++) {
      const info = childrenInfo[i];
      const firstName = firstNames[i];
      this.usedNames.add(firstName);
      
      const child = await storage.createCharacter({
        worldId: config.worldId,
        firstName,
        lastName: father.lastName,
        gender: info.gender,
        birthYear: info.birthYear,
        isAlive: this.isAlive(info.birthYear, config.currentYear, config.deathRate),
        parentIds: [father.id, mother.id],
        currentLocation: config.settlementId!,
        personality: this.inheritPersonality(father.personality, mother.personality),
        socialAttributes: {
          generation,
          paternalGrandparents: father.parentIds,
          maternalGrandparents: mother.parentIds
        }
      });
      
      children.push(child);
    }
    
    return children;
  }

  /**
   * Generate personality traits
   */
  private generatePersonality() {
    return {
      openness: Math.random() * 2 - 1,
      conscientiousness: Math.random() * 2 - 1,
      extroversion: Math.random() * 2 - 1,
      agreeableness: Math.random() * 2 - 1,
      neuroticism: Math.random() * 2 - 1
    };
  }

  /**
   * Inherit personality from parents with variation
   */
  private inheritPersonality(p1: any, p2: any) {
    if (!p1 || !p2) return this.generatePersonality();
    
    return {
      openness: this.inheritTrait(p1.openness, p2.openness),
      conscientiousness: this.inheritTrait(p1.conscientiousness, p2.conscientiousness),
      extroversion: this.inheritTrait(p1.extroversion, p2.extroversion),
      agreeableness: this.inheritTrait(p1.agreeableness, p2.agreeableness),
      neuroticism: this.inheritTrait(p1.neuroticism, p2.neuroticism)
    };
  }

  private inheritTrait(t1: number, t2: number): number {
    const avg = (t1 + t2) / 2;
    const variation = (Math.random() - 0.5) * 0.4; // 20% variation
    return Math.max(-1, Math.min(1, avg + variation));
  }

  /**
   * Determine if someone born in birthYear is alive in currentYear
   */
  private isAlive(birthYear: number, currentYear: number, deathRate: number): boolean {
    const age = currentYear - birthYear;
    if (age < 0) return true; // Not born yet
    if (age > 85) return false; // Very old
    
    // Death probability increases with age
    const deathProbability = (age / 100) * deathRate;
    return Math.random() > deathProbability;
  }

  /**
   * Roll number of children based on fertility rate
   */
  private rollChildren(fertilityRate: number): number {
    const roll = Math.random();
    if (roll < (1 - fertilityRate)) return 0;
    if (roll < 0.3) return 1;
    if (roll < 0.6) return 2;
    if (roll < 0.85) return 3;
    if (roll < 0.95) return 4;
    return 5;
  }

  /**
   * Get a fallback name from the name pool
   */
  private getFallbackName(gender: 'male' | 'female'): string {
    const pool = this.namePool[gender];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get a unique name from the pool (or LLM if available)
   */
  private async getUniqueName(gender: 'male' | 'female', generation: number = 0, isFounder: boolean = false): Promise<string> {
    // Try LLM generation if context is available
    if (nameGenerator.isEnabled() && this.worldContext) {
      try {
        const names = await nameGenerator.generateCharacterNames({
          worldName: this.worldContext.name,
          worldDescription: this.worldContext.description,
          countryName: this.countryContext?.name,
          countryDescription: this.countryContext?.description,
          settlementName: this.settlementContext?.name,
          settlementType: this.settlementContext?.settlementType,
          gender,
          generation,
          isFounder
        }, 1);
        
        if (names.length > 0) {
          const firstName = names[0].firstName;
          if (!this.usedNames.has(firstName)) {
            this.usedNames.add(firstName);
            return firstName;
          }
        }
      } catch (error) {
        console.warn('LLM name generation failed, using fallback');
      }
    }
    
    // Fallback to pool
    const pool = this.namePool[gender];
    let name;
    let attempts = 0;
    
    do {
      name = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
      if (attempts > 100) {
        // Add suffix if we've exhausted names
        name = name + ' ' + (attempts - 100);
      }
    } while (this.usedNames.has(name) && attempts < 200);
    
    this.usedNames.add(name);
    return name;
  }

  /**
   * Get a unique surname (or LLM-generated if available)
   */
  private async getUniqueSurname(): Promise<string> {
    // Try LLM generation if context is available
    if (nameGenerator.isEnabled() && this.worldContext) {
      try {
        const names = await nameGenerator.generateCharacterNames({
          worldName: this.worldContext.name,
          worldDescription: this.worldContext.description,
          countryName: this.countryContext?.name,
          countryDescription: this.countryContext?.description,
          settlementName: this.settlementContext?.name,
          settlementType: this.settlementContext?.settlementType,
          gender: 'male', // Use male for surname generation
          generation: 0,
          isFounder: true
        }, 1);
        
        if (names.length > 0) {
          const lastName = names[0].lastName;
          if (!this.usedNames.has(lastName)) {
            this.usedNames.add(lastName);
            return lastName;
          }
        }
      } catch (error) {
        console.warn('LLM surname generation failed, using fallback');
      }
    }
    
    // Fallback to pool
    const pool = this.namePool.surnames;
    let name;
    let attempts = 0;
    
    do {
      name = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
      if (attempts > 50) {
        name = name + (attempts - 50);
      }
    } while (this.usedNames.has(name) && attempts < 100);
    
    this.usedNames.add(name);
    return name;
  }

  /**
   * Shuffle array in place
   */
  private shuffle(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Load world, country, and settlement context for name generation
   */
  private async loadContext(config: GenerationConfig): Promise<void> {
    try {
      this.worldContext = await storage.getWorld(config.worldId);
      
      if (config.settlementId) {
        this.settlementContext = await storage.getSettlement(config.settlementId);
        if (this.settlementContext?.countryId) {
          this.countryContext = await storage.getCountry(this.settlementContext.countryId);
        }
      }
    } catch (error) {
      console.error('Failed to load context for name generation:', error);
    }
  }

  /**
   * Reset used names
   */
  reset(): void {
    this.usedNames.clear();
    this.worldContext = null;
    this.countryContext = null;
    this.settlementContext = null;
  }
}
