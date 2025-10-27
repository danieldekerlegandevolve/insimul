/**
 * Unified World Generator
 * Combines genealogy and geography generation for complete world creation
 */

import { storage } from '../storage';
import { GenealogyGenerator } from './genealogy-generator';
import { GeographyGenerator } from './geography-generator';
import type { InsertWorld } from '../../shared/schema';

export interface WorldGenerationConfig {
  worldName: string;
  worldDescription?: string;
  settlementName: string;
  settlementDescription?: string;
  settlementType: 'village' | 'town' | 'city';
  terrain: 'plains' | 'hills' | 'mountains' | 'coast' | 'river' | 'forest' | 'desert';
  foundedYear: number;
  currentYear: number;
  numFoundingFamilies: number;
  generations: number;
  marriageRate: number;
  fertilityRate: number;
  deathRate: number;
  generateGeography: boolean;
  generateGenealogy: boolean;
  // Optional country/state info
  countryName?: string;
  governmentType?: string;
  economicSystem?: string;
}

export class WorldGenerator {
  private genealogyGen = new GenealogyGenerator();
  private geographyGen = new GeographyGenerator();

  /**
   * Generate a complete world with geographical hierarchy (world → country → settlement)
   */
  async generateWorld(config: WorldGenerationConfig): Promise<{
    worldId: string;
    countryId: string;
    settlementId: string;
    population: number;
    families: number;
    generations: number;
    districts: number;
    buildings: number;
  }> {
    console.log(`🌍 Generating world: ${config.worldName}...`);
    console.log(`   Settlement: ${config.settlementName} (${config.settlementType})`);
    console.log(`   Terrain: ${config.terrain}, Period: ${config.foundedYear} - ${config.currentYear}`);
    
    // Create world (abstract universe)
    const worldData: InsertWorld = {
      name: config.worldName,
      description: config.worldDescription || `A procedurally generated world`,
      currentYear: config.currentYear,
      systemTypes: ['insimul', 'tott'],
      generationConfig: {
        numFoundingFamilies: config.numFoundingFamilies,
        generations: config.generations,
        marriageRate: config.marriageRate,
        fertilityRate: config.fertilityRate,
        deathRate: config.deathRate
      }
    };
    
    const world = await storage.createWorld(worldData);
    console.log(`✅ Created world: ${world.id}`);
    
    // Create country within the world
    const countryData = {
      worldId: world.id,
      name: config.countryName || `Kingdom of ${config.settlementName}`,
      description: `A ${config.governmentType || 'feudal'} realm`,
      governmentType: config.governmentType || 'monarchy',
      economicSystem: config.economicSystem || 'agricultural',
      foundedYear: config.foundedYear
    };
    
    const country = await storage.createCountry(countryData);
    console.log(`✅ Created country: ${country.id}`);
    
    // Create settlement within the country
    const settlementData = {
      worldId: world.id,
      countryId: country.id,
      name: config.settlementName,
      description: config.settlementDescription || `A ${config.settlementType} in ${country.name}`,
      settlementType: config.settlementType,
      terrain: config.terrain,
      population: 0,
      foundedYear: config.foundedYear,
      generationConfig: {
        numFoundingFamilies: config.numFoundingFamilies,
        generations: config.generations,
        marriageRate: config.marriageRate,
        fertilityRate: config.fertilityRate,
        deathRate: config.deathRate
      }
    };
    
    const settlement = await storage.createSettlement(settlementData);
    console.log(`✅ Created settlement: ${settlement.id}`);
    
    let population = 0;
    let families = 0;
    let generationsCreated = 0;
    let districts = 0;
    let buildings = 0;
    
    // Generate genealogy for the settlement
    if (config.generateGenealogy) {
      console.log('\n📖 Generating genealogy...');
      const genealogyResult = await this.genealogyGen.generate({
        worldId: world.id,
        startYear: config.foundedYear,
        currentYear: config.currentYear,
        numFoundingFamilies: config.numFoundingFamilies,
        generationsToGenerate: config.generations,
        marriageRate: config.marriageRate,
        fertilityRate: config.fertilityRate,
        deathRate: config.deathRate
      });
      
      population = genealogyResult.totalCharacters;
      families = genealogyResult.families.length;
      generationsCreated = genealogyResult.generations;
      
      // Store family trees in settlement
      const familyTrees = genealogyResult.families.map(f => ({
        surname: f.surname,
        founderId: f.founders.father.id,
        generations: Object.fromEntries(f.generations)
      }));
      
      await storage.updateSettlement(settlement.id, {
        familyTrees,
        currentGeneration: generationsCreated
      });
    }
    
    // Generate geography for the settlement
    if (config.generateGeography) {
      console.log('\n🗺️  Generating geography...');
      const geographyResult = await this.geographyGen.generate({
        worldId: world.id,
        settlementId: settlement.id,
        settlementName: settlement.name,
        settlementType: config.settlementType,
        population: population || this.estimatePopulation(config.settlementType),
        foundedYear: config.foundedYear,
        terrain: config.terrain,
        countryId: country.id
      });
      
      districts = geographyResult.districts.length;
      buildings = geographyResult.buildings.length;
    }
    
    // Update settlement population
    await storage.updateSettlement(settlement.id, {
      population
    });
    
    console.log('\n✅ World generation complete!');
    console.log(`   Population: ${population}`);
    console.log(`   Families: ${families}`);
    console.log(`   Generations: ${generationsCreated}`);
    console.log(`   Districts: ${districts}`);
    console.log(`   Buildings: ${buildings}`);
    
    return {
      worldId: world.id,
      countryId: country.id,
      settlementId: settlement.id,
      population,
      families,
      generations: generationsCreated,
      districts,
      buildings
    };
  }

  /**
   * Generate just genealogy for an existing world/settlement
   */
  async generateGenealogy(worldId: string, config: {
    settlementId?: string;
    numFoundingFamilies: number;
    generations: number;
    marriageRate?: number;
    fertilityRate?: number;
    deathRate?: number;
    startYear?: number;
  }): Promise<any> {
    const world = await storage.getWorld(worldId);
    if (!world) throw new Error('World not found');
    
    return await this.genealogyGen.generate({
      worldId,
      settlementId: config.settlementId,
      startYear: config.startYear || 1900,
      currentYear: world.currentYear || 2000,
      numFoundingFamilies: config.numFoundingFamilies,
      generationsToGenerate: config.generations,
      marriageRate: config.marriageRate || 0.7,
      fertilityRate: config.fertilityRate || 0.6,
      deathRate: config.deathRate || 0.3
    });
  }

  /**
   * Generate just geography for an existing settlement
   */
  async generateGeography(settlementId: string, config: {
    foundedYear?: number;
  }): Promise<any> {
    const settlement = await storage.getSettlement(settlementId);
    if (!settlement) throw new Error('Settlement not found');
    
    const characters = await storage.getCharactersByWorld(settlement.worldId);
    
    return await this.geographyGen.generate({
      worldId: settlement.worldId,
      settlementId: settlement.id,
      settlementName: settlement.name,
      settlementType: settlement.settlementType as any,
      population: characters.length || this.estimatePopulation(settlement.settlementType),
      foundedYear: config.foundedYear || settlement.foundedYear || 1900,
      terrain: settlement.terrain as any,
      countryId: settlement.countryId ?? undefined,
      stateId: settlement.stateId ?? undefined
    });
  }

  /**
   * Estimate population based on settlement type
   */
  private estimatePopulation(type: string): number {
    switch (type) {
      case 'village': return 500;
      case 'town': return 5000;
      case 'city': return 50000;
      default: return 5000;
    }
  }

  /**
   * Get preset configurations
   */
  static getPresets(): Record<string, Partial<WorldGenerationConfig>> {
    return {
      medievalVillage: {
        worldName: 'Medieval Realm',
        settlementName: 'Thornbrook',
        settlementType: 'village',
        terrain: 'plains',
        foundedYear: 1200,
        currentYear: 1300,
        numFoundingFamilies: 5,
        generations: 4,
        marriageRate: 0.8,
        fertilityRate: 0.7,
        deathRate: 0.4,
        governmentType: 'feudal',
        economicSystem: 'agricultural'
      },
      colonialTown: {
        worldName: 'New World',
        settlementName: 'Port Haven',
        settlementType: 'town',
        terrain: 'coast',
        foundedYear: 1650,
        currentYear: 1750,
        numFoundingFamilies: 10,
        generations: 4,
        marriageRate: 0.75,
        fertilityRate: 0.65,
        deathRate: 0.35,
        governmentType: 'republic',
        economicSystem: 'mercantile'
      },
      modernCity: {
        worldName: 'Contemporary World',
        settlementName: 'Riverside',
        settlementType: 'city',
        terrain: 'river',
        foundedYear: 1850,
        currentYear: 2000,
        numFoundingFamilies: 20,
        generations: 6,
        marriageRate: 0.65,
        fertilityRate: 0.5,
        deathRate: 0.2,
        governmentType: 'democracy',
        economicSystem: 'mixed'
      },
      fantasyRealm: {
        worldName: 'Mystical Lands',
        settlementName: 'Dragonspire',
        settlementType: 'city',
        terrain: 'mountains',
        foundedYear: 500,
        currentYear: 1000,
        numFoundingFamilies: 12,
        generations: 20,
        marriageRate: 0.7,
        fertilityRate: 0.6,
        deathRate: 0.35,
        governmentType: 'empire',
        economicSystem: 'feudal'
      }
    };
  }
}
