/**
 * Simplified MongoDB Database Initialization
 * Seeds a Talk of the Town world without PostgreSQL dependencies
 */

import { storage } from '../storage';
import { tottExampleRules } from '../rules/tott-example-rules';
import type { InsertWorld, InsertCharacter, InsertRule } from '../../shared/schema';

export class MongoSimpleInitializer {
  /**
   * Check if database is initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      const worlds = await storage.getWorlds();
      return worlds.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Generate a personality (Big Five traits)
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
   * Seed sample Talk of the Town world
   */
  async seedSampleWorld(): Promise<string> {
    console.log('🌱 Seeding Talk of the Town world...');
    
    // Create world (no population field - will be calculated dynamically)
    const worldData: InsertWorld = {
      name: 'Smalltown, USA',
      description: 'A procedurally generated small American town circa 1950',
      currentYear: 1950,
      config: {
        currentMonth: 1,
        currentDay: 1,
        timeOfDay: 'day',
        state: 'Illinois',
        cityMotto: 'Progress Through Community',
        industries: ['agriculture', 'manufacturing', 'retail'],
        businesses: [],
        residences: [],
        lots: [],
        events: []
      }
    };
    
    const world = await storage.createWorld(worldData);
    console.log(`✅ Created world: ${world.name} (ID: ${world.id})`);
    
    // Create founding families
    console.log('👨‍👩‍👧‍👦 Creating founding families...');
    const families = await this.createFoundingFamilies(world.id);
    
    // Create businesses
    console.log('🏢 Creating businesses...');
    await this.createBusinesses(world.id, families);
    
    // Seed rules
    console.log('📜 Loading behavioral rules...');
    await this.seedRules(world.id);

    // Seed grammars
    console.log('📖 Loading Tracery grammars...');
    await this.seedGrammars(world.id);

    // Get final character count (population is now calculated dynamically)
    const characters = await storage.getCharactersByWorld(world.id);
    console.log(`✅ World seeded with ${characters.length} characters`);
    
    return world.id;
  }
  
  /**
   * Create founding families
   */
  private async createFoundingFamilies(worldId: string): Promise<any[]> {
    const families = [];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'];
    const maleNames = ['John', 'Robert', 'James', 'William', 'Charles'];
    const femaleNames = ['Mary', 'Patricia', 'Barbara', 'Betty', 'Dorothy'];
    
    for (let i = 0; i < 5; i++) {
      // Create father
      const father = await storage.createCharacter({
        worldId,
        firstName: maleNames[i],
        lastName: surnames[i],
        gender: 'male',
        birthYear: 1915 + Math.floor(Math.random() * 10),
        isAlive: true,
        personality: this.generatePersonality(),
        socialAttributes: {
          occupation: null,
          retired: false,
          education: Math.random() > 0.7 ? 'college' : 'highschool'
        }
      });
      
      // Create mother
      const mother = await storage.createCharacter({
        worldId,
        firstName: femaleNames[i],
        lastName: surnames[i],
        gender: 'female',
        birthYear: 1918 + Math.floor(Math.random() * 10),
        isAlive: true,
        spouseId: father.id,
        maidenName: surnames[(i + 2) % 5],
        personality: this.generatePersonality(),
        socialAttributes: {
          occupation: null,
          retired: false,
          education: Math.random() > 0.8 ? 'college' : 'highschool'
        }
      });
      
      // Update father with spouse
      await storage.updateCharacter(father.id, { spouseId: mother.id });
      
      // Create 1-3 children
      const numChildren = 1 + Math.floor(Math.random() * 3);
      const children = [];
      
      for (let j = 0; j < numChildren; j++) {
        const child = await storage.createCharacter({
          worldId,
          firstName: j % 2 === 0 ? maleNames[(i + j + 1) % 5] : femaleNames[(i + j + 1) % 5],
          lastName: surnames[i],
          gender: j % 2 === 0 ? 'male' : 'female',
          birthYear: 1935 + Math.floor(Math.random() * 10),
          isAlive: true,
          parentIds: [father.id, mother.id],
          personality: this.generatePersonality(),
          socialAttributes: {
            occupation: null,
            education: 'highschool'
          }
        });
        children.push(child);
      }
      
      // Update parents with children
      const childIds = children.map(c => c.id);
      await storage.updateCharacter(father.id, { childIds });
      await storage.updateCharacter(mother.id, { childIds });
      
      families.push({ surname: surnames[i], father, mother, children });
    }
    
    return families;
  }
  
  /**
   * Create businesses and assign owners
   */
  private async createBusinesses(worldId: string, families: any[]): Promise<void> {
    const world = await storage.getWorld(worldId);
    if (!world) return;
    
    const businesses = [
      { name: "Smith's General Store", type: "Store", owner: families[0].father },
      { name: "Johnson's Hardware", type: "Store", owner: families[1].father },
      { name: "Williams Diner", type: "Restaurant", owner: families[2].father },
      { name: "Brown's Barbershop", type: "Barbershop", owner: families[3].father },
      { name: "Davis Medical Clinic", type: "Hospital", owner: families[4].father }
    ];
    
    const businessData = [];
    
    for (const biz of businesses) {
      // Update owner's occupation
      await storage.updateCharacter(biz.owner.id, {
        occupation: 'Owner',
        socialAttributes: {
          ...(biz.owner.socialAttributes || {}),
          occupation: 'Business Owner',
          workplace: biz.name,
          employmentStatus: 'employed'
        }
      });
      
      businessData.push({
        id: `biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: biz.name,
        type: biz.type,
        ownerId: biz.owner.id,
        foundedYear: 1940 + Math.floor(Math.random() * 10),
        employees: [biz.owner.id]
      });
    }
    
    // Store businesses in world data
    await storage.updateWorld(worldId, {
      config: {
        ...(world.config || {}),
        businesses: businessData
      }
    });
  }
  
  /**
   * Seed behavioral rules
   */
  private async seedRules(worldId: string): Promise<void> {
    // Only seed compatible rules (those that don't require PostgreSQL)
    const simpleRules = [
      {
        worldId,
        name: "daily_routine",
        content: "When time advances, characters perform daily activities",
        systemType: "tott",
        ruleType: "trigger",
        priority: 5,
        likelihood: 1.0,
        enabled: true,
        tags: ["routine", "daily"]
      },
      {
        worldId,
        name: "aging",
        content: "Characters age over time",
        systemType: "tott",
        ruleType: "trigger",
        priority: 10,
        likelihood: 1.0,
        enabled: true,
        tags: ["aging", "time"]
      },
      {
        worldId,
        name: "social_interaction",
        content: "Characters interact based on personality",
        systemType: "tott",
        ruleType: "volition",
        priority: 3,
        likelihood: 0.5,
        enabled: true,
        tags: ["social", "personality"]
      }
    ];

    for (const rule of simpleRules) {
      await storage.createRule(rule);
    }

    console.log(`✅ Seeded ${simpleRules.length} behavioral rules`);
  }

  /**
   * Seed Tracery grammars
   */
  private async seedGrammars(worldId: string): Promise<void> {
    const { seedGrammars } = await import('../seed-grammars');

    for (const grammarData of seedGrammars) {
      await storage.createGrammar({
        worldId,
        name: grammarData.name,
        description: grammarData.description,
        grammar: grammarData.grammar,
        tags: grammarData.tags,
        isActive: grammarData.isActive
      });
    }

    console.log(`✅ Seeded ${seedGrammars.length} Tracery grammars`);
  }
  
  /**
   * Reset database
   */
  async resetDatabase(): Promise<void> {
    console.log('⚠️ Resetting database...');

    const worlds = await storage.getWorlds();

    for (const world of worlds) {
      // Delete characters
      const characters = await storage.getCharactersByWorld(world.id);
      for (const char of characters) {
        await storage.deleteCharacter(char.id);
      }

      // Delete rules
      const rules = await storage.getRulesByWorld(world.id);
      for (const rule of rules) {
        await storage.deleteRule(rule.id);
      }

      // Delete grammars
      const grammars = await storage.getGrammarsByWorld(world.id);
      for (const grammar of grammars) {
        await storage.deleteGrammar(grammar.id);
      }

      // Delete world
      await storage.deleteWorld(world.id);
    }

    console.log('✅ Database reset complete');
  }
  
  /**
   * Initialize database
   */
  async initialize(options: { reset?: boolean; seed?: boolean } = {}): Promise<string | null> {
    const { reset = false, seed = true } = options;
    
    try {
      if (reset) {
        await this.resetDatabase();
      }
      
      const initialized = await this.isInitialized();
      
      if (!initialized && seed) {
        return await this.seedSampleWorld();
      } else if (!initialized) {
        console.log('⚠️ Database is empty. Use --seed to create a sample world.');
      } else {
        console.log('✅ Database already initialized');
      }
      
      return null;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }
}

// Export convenience functions
export async function initializeDatabase(options?: any): Promise<string | null> {
  const initializer = new MongoSimpleInitializer();
  return await initializer.initialize(options);
}

export async function resetAndSeedDatabase(): Promise<string> {
  const initializer = new MongoSimpleInitializer();
  const worldId = await initializer.initialize({ reset: true, seed: true });
  return worldId!;
}
