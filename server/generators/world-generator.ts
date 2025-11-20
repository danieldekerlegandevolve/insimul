/**
 * Unified World Generator
 * Combines genealogy and geography generation for complete world creation
 */

import { storage } from '../db/storage';
import { GenealogyGenerator } from './genealogy-generator';
import { GeographyGenerator } from './geography-generator';
import type { InsertWorld, Business, Character, BusinessType, OccupationVocation } from '../../shared/schema';
import { foundBusiness, closeBusiness } from '../extensions/tott/business-system.js';
import { fillVacancy } from '../extensions/tott/hiring-system.js';
import { generateDefaultRoutine, setRoutine, updateAllWhereabouts } from '../extensions/tott/routine-system.js';
import { triggerAutomaticEvents } from '../extensions/tott/event-system.js';
// Phase 5-10: TotT Social Simulation Integration
import { updateRelationship } from '../extensions/tott/social-dynamics-system.js';
import { initializeFamilyKnowledge, initializeCoworkerKnowledge } from '../extensions/tott/knowledge-system.js';
import { addMoney } from '../extensions/tott/economics-system.js';
import { adjustCommunityMorale, scheduleFestival } from '../extensions/tott/town-events-system.js';
// GenAI Visual Asset Generation Integration
import { visualAssetGenerator } from '../services/visual-asset-generator.js';

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
  // TotT integration options
  generateBusinesses?: boolean;
  assignEmployment?: boolean;
  generateRoutines?: boolean;
  simulateHistory?: boolean;
  historyFidelity?: 'low' | 'medium' | 'high';
  // Phase 5-10: TotT Social Simulation
  initializeSocialDynamics?: boolean;  // Phase 5: Relationships
  initializeKnowledge?: boolean;       // Phase 6: Mental models
  initializeWealth?: boolean;          // Phase 9: Starting money
  initializeCommunityMorale?: boolean; // Phase 10: Community
  scheduleFestival?: boolean;          // Phase 10: Initial festival
  // GenAI Visual Asset Generation
  generateVisualAssets?: boolean;      // Master toggle for visual generation
  generateCharacterPortraits?: boolean; // Generate portraits for all characters
  generateBuildingExteriors?: boolean;  // Generate exteriors for all buildings
  generateSettlementMaps?: boolean;     // Generate settlement maps
  visualGenerationProvider?: 'flux' | 'gemini-imagen' | 'dalle' | 'stable-diffusion';
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
    businesses: number;
    employed: number;
    routines: number;
    events: number;
    visualAssets: {
      portraits: number;
      buildings: number;
      maps: number;
    };
  }> {
    console.log(`🌍 Generating world: ${config.worldName}...`);
    console.log(`   Settlement: ${config.settlementName} (${config.settlementType})`);
    console.log(`   Terrain: ${config.terrain}, Period: ${config.foundedYear} - ${config.currentYear}`);
    
    // Create world (abstract universe)
    const worldData: InsertWorld = {
      name: config.worldName,
      description: config.worldDescription || `A procedurally generated world`,
      currentYear: config.currentYear,
      sourceFormats: ['insimul', 'tott'],
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
    
    let businessCount = 0;
    let employedCount = 0;
    let routineCount = 0;
    let eventCount = 0;
    
    // TotT Integration: Business Generation
    if (config.generateBusinesses && population > 0) {
      console.log('\n🏢 Founding initial businesses...');
      const businesses = await this.generateInitialBusinesses({
        worldId: world.id,
        settlementId: settlement.id,
        population: population,
        currentYear: config.currentYear,
        terrain: config.terrain
      });
      businessCount = businesses.length;
      
      // TotT Integration: Employment Assignment
      if (config.assignEmployment && businesses.length > 0) {
        console.log('\n👔 Assigning employment...');
        employedCount = await this.assignInitialEmployment({
          worldId: world.id,
          businesses: businesses,
          currentYear: config.currentYear
        });
      }
    }
    
    // TotT Integration: Routine Generation
    if (config.generateRoutines && population > 0) {
      console.log('\n⏰ Generating daily routines...');
      routineCount = await this.generateInitialRoutines({
        worldId: world.id,
        currentYear: config.currentYear
      });
      
      // Set initial whereabouts (everyone at home at noon)
      console.log('\n📍 Setting initial whereabouts...');
      await updateAllWhereabouts(world.id, 0, 'day', 12);
    }
    
    // Phase 5-10: TotT Social Simulation Integration (following game.py patterns)
    
    // Phase 5: Initialize Social Dynamics (relationships for families & coworkers)
    if (config.initializeSocialDynamics && population > 0) {
      console.log('\n💫 Initializing social dynamics (Phase 5)...');
      await this.initializeSocialDynamics({
        worldId: world.id,
        currentYear: config.currentYear
      });
    }
    
    // Phase 6: Initialize Knowledge & Mental Models (like TotT's implant_knowledge)
    if (config.initializeKnowledge && population > 0) {
      console.log('\n🧠 Implanting knowledge (Phase 6)...');
      await this.implantKnowledge({
        worldId: world.id,
        currentTimestep: 0
      });
    }
    
    // Phase 9: Initialize Wealth (starting money)
    if (config.initializeWealth && population > 0) {
      console.log('\n💰 Initializing wealth (Phase 9)...');
      await this.initializeWealth({
        worldId: world.id,
        currentYear: config.currentYear
      });
    }
    
    // Phase 10: Initialize Community Morale & Schedule Festival
    if (config.initializeCommunityMorale && population > 0) {
      console.log('\n🎪 Initializing community (Phase 10)...');
      await adjustCommunityMorale(world.id, 50); // Start at base morale
      
      if (config.scheduleFestival) {
        // Schedule a founding festival
        await scheduleFestival(
          world.id,
          'founders_day',
          'town_square',
          7 // Week from now
        );
      }
    }
    
    // TotT Integration: Historical Simulation
    if (config.simulateHistory && population > 0) {
      const fidelity = config.historyFidelity || 'low';
      console.log(`\n⏳ Simulating historical events (${fidelity} fidelity)...`);
      eventCount = await this.simulateHistory({
        worldId: world.id,
        startYear: config.foundedYear,
        endYear: config.currentYear,
        fidelity: fidelity
      });
    }

    // GenAI Visual Asset Generation
    let portraitCount = 0;
    let buildingAssetCount = 0;
    let mapCount = 0;

    if (config.generateVisualAssets) {
      const provider = config.visualGenerationProvider || 'flux';

      // Generate character portraits
      if (config.generateCharacterPortraits && population > 0) {
        console.log('\n🎨 Generating character portraits...');
        portraitCount = await this.generateCharacterPortraitsForWorld({
          worldId: world.id,
          provider
        });
      }

      // Generate building exteriors
      if (config.generateBuildingExteriors && businessCount > 0) {
        console.log('\n🏢 Generating building exteriors...');
        buildingAssetCount = await this.generateBuildingExteriorsForWorld({
          worldId: world.id,
          provider
        });
      }

      // Generate settlement maps
      if (config.generateSettlementMaps) {
        console.log('\n🗺️  Generating settlement maps...');
        mapCount = await this.generateSettlementMapsForSettlement({
          settlementId: settlement.id,
          provider
        });
      }
    }

    console.log('\n✅ World generation complete!');
    console.log(`   Population: ${population}`);
    console.log(`   Families: ${families}`);
    console.log(`   Generations: ${generationsCreated}`);
    console.log(`   Districts: ${districts}`);
    console.log(`   Buildings: ${buildings}`);
    console.log(`   Businesses: ${businessCount}`);
    console.log(`   Employed: ${employedCount}`);
    console.log(`   Routines: ${routineCount}`);
    console.log(`   Historical Events: ${eventCount}`);
    if (config.generateVisualAssets) {
      console.log(`   Visual Assets Generated:`);
      console.log(`     - Character Portraits: ${portraitCount}`);
      console.log(`     - Building Exteriors: ${buildingAssetCount}`);
      console.log(`     - Settlement Maps: ${mapCount}`);
    }

    return {
      worldId: world.id,
      countryId: country.id,
      settlementId: settlement.id,
      population,
      families,
      generations: generationsCreated,
      districts,
      buildings,
      businesses: businessCount,
      employed: employedCount,
      routines: routineCount,
      events: eventCount,
      visualAssets: {
        portraits: portraitCount,
        buildings: buildingAssetCount,
        maps: mapCount
      }
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
   * Generate initial businesses for the settlement based on population and terrain
   */
  private async generateInitialBusinesses(config: {
    worldId: string;
    settlementId: string;
    population: number;
    currentYear: number;
    terrain: string;
  }): Promise<Business[]> {
    const businesses: Business[] = [];
    
    // Determine what businesses are needed
    const businessPlan = this.determineBusinessMix(
      config.population,
      config.terrain,
      config.currentYear
    );
    
    console.log(`   Planning ${businessPlan.length} businesses...`);
    
    // Get available characters to be founders
    const characters = await storage.getCharactersByWorld(config.worldId);
    const adultCharacters = characters.filter(c =>
      this.getAge(c, config.currentYear) >= 18 &&
      this.getAge(c, config.currentYear) <= 65 &&
      c.isAlive
    );
    
    // Shuffle to randomize founder selection
    const availableFounders = adultCharacters.sort(() => Math.random() - 0.5);
    
    // Create businesses and assign founders
    for (const businessType of businessPlan) {
      const founder = availableFounders.pop();
      if (founder) {
        try {
          const business = await foundBusiness({
            worldId: config.worldId,
            founderId: founder.id,
            name: this.generateBusinessName(businessType, founder),
            businessType: businessType,
            address: `${businessType} Street`,
            currentYear: config.currentYear,
            currentTimestep: 0,
            initialVacancies: this.getVacanciesForBusinessType(businessType)
          });
          
          businesses.push(business);
          console.log(`   ✓ Founded ${business.name}`);
        } catch (error) {
          console.error(`   ✗ Failed to found ${businessType}:`, error);
        }
      }
    }
    
    return businesses;
  }

  /**
   * Determine business mix based on population, terrain, and era
   */
  private determineBusinessMix(
    population: number,
    terrain: string,
    year: number
  ): BusinessType[] {
    const businesses: BusinessType[] = [];
    
    // Core essentials (always needed)
    businesses.push('Agriculture');
    
    if (population > 100) {
      businesses.push('Retail');
      businesses.push('Restaurant');
    }
    
    if (population > 300) {
      businesses.push('Medicine');
      businesses.push('Construction');
      businesses.push('Manufacturing');
    }
    
    if (population > 500) {
      businesses.push('Law');
      businesses.push('Education');
      businesses.push('Financial');
    }
    
    if (population > 1000) {
      businesses.push('Entertainment');
      businesses.push('Government');
    }
    
    // Terrain-specific
    if (terrain === 'mountains') {
      businesses.push('Mining');
    } else if (terrain === 'coast' || terrain === 'river') {
      businesses.push('Transportation');
    } else if (terrain === 'forest') {
      businesses.push('Logging');
    }
    
    // Era-specific adjustments
    if (year < 1900) {
      // More agricultural in pre-industrial era
      businesses.push('Agriculture');
    } else if (year > 1950) {
      // More retail/service in modern era
      businesses.push('Retail');
      if (population > 500) {
        businesses.push('Healthcare');
      }
    }
    
    return businesses;
  }

  /**
   * Generate business name based on type and founder
   */
  private generateBusinessName(businessType: BusinessType, founder: Character): string {
    const templates: Record<string, string[]> = {
      'Agriculture': ['Farm', 'Ranch', 'Farmstead'],
      'Retail': ['General Store', 'Shop', 'Mercantile'],
      'Restaurant': ['Tavern', 'Inn', 'Eatery'],
      'Medicine': ['Clinic', 'Practice', 'Medical Office'],
      'Construction': ['Builders', 'Construction Co.', 'Contractors'],
      'Manufacturing': ['Smithy', 'Workshop', 'Factory'],
      'Law': ['Law Office', 'Legal Services', 'Attorney at Law'],
      'Education': ['School', 'Academy', 'Institute'],
      'Financial': ['Bank', 'Savings & Loan', 'Credit Union'],
      'Entertainment': ['Theater', 'Hall', 'Playhouse'],
      'Government': ['Town Hall', 'City Hall', 'Municipal Building'],
      'Mining': ['Mine', 'Quarry', 'Mining Co.'],
      'Transportation': ['Shipping Co.', 'Transport', 'Freight'],
      'Logging': ['Lumber Mill', 'Logging Co.', 'Timber']
    };
    
    const typeTemplates = templates[businessType] || ['Business'];
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    
    return `${founder.lastName}'s ${template}`;
  }

  /**
   * Get initial vacancies for a business type
   */
  private getVacanciesForBusinessType(businessType: BusinessType): {
    day: OccupationVocation[];
    night: OccupationVocation[];
  } {
    const vacancies: Record<string, { day: OccupationVocation[]; night: OccupationVocation[] }> = {
      'Agriculture': { day: ['Farmer', 'Farmer'], night: [] },
      'Retail': { day: ['Cashier', 'Cashier'], night: [] },
      'Restaurant': { day: ['Chef', 'Waiter'], night: ['Bartender'] },
      'Medicine': { day: ['Doctor', 'Nurse'], night: ['Nurse'] },
      'Construction': { day: ['Construction Worker', 'Construction Worker'], night: [] },
      'Manufacturing': { day: ['Factory Worker', 'Factory Worker'], night: [] },
      'Law': { day: ['Lawyer', 'Secretary'], night: [] },
      'Education': { day: ['Teacher', 'Teacher'], night: [] },
      'Financial': { day: ['Banker', 'Accountant'], night: [] },
      'Entertainment': { day: ['Performer'], night: ['Performer'] },
      'Government': { day: ['Manager'], night: [] },
      'Mining': { day: ['Miner', 'Miner'], night: [] },
      'Transportation': { day: ['Driver'], night: [] },
      'Logging': { day: ['Logger', 'Logger'], night: [] }
    };
    
    return vacancies[businessType] || { day: [], night: [] };
  }

  /**
   * Assign employment to characters based on businesses
   */
  private async assignInitialEmployment(config: {
    worldId: string;
    businesses: Business[];
    currentYear: number;
  }): Promise<number> {
    const characters = await storage.getCharactersByWorld(config.worldId);
    const employableCharacters = characters.filter(c =>
      this.getAge(c, config.currentYear) >= 18 &&
      this.getAge(c, config.currentYear) <= 65 &&
      c.isAlive
    );
    
    // Shuffle to randomize hiring
    const shuffled = employableCharacters.sort(() => Math.random() - 0.5);
    let employedCount = 0;
    
    for (const business of config.businesses) {
      // Owner is already employed (counted separately)
      
      // Fill day shift vacancies
      const dayVacancies = (business.vacancies as any)?.day || [];
      for (const vocation of dayVacancies) {
        const candidate = shuffled.pop();
        if (candidate) {
          try {
            await fillVacancy(
              business.id,
              vocation,
              'day',
              candidate.id,
              config.currentYear
            );
            employedCount++;
          } catch (error) {
            console.error(`   ✗ Failed to hire ${vocation}:`, error);
          }
        }
      }
      
      // Fill night shift vacancies
      const nightVacancies = (business.vacancies as any)?.night || [];
      for (const vocation of nightVacancies) {
        const candidate = shuffled.pop();
        if (candidate) {
          try {
            await fillVacancy(
              business.id,
              vocation,
              'night',
              candidate.id,
              config.currentYear
            );
            employedCount++;
          } catch (error) {
            console.error(`   ✗ Failed to hire ${vocation}:`, error);
          }
        }
      }
    }
    
    console.log(`   ✓ Assigned ${employedCount} jobs`);
    return employedCount;
  }

  /**
   * Generate daily routines for all characters
   */
  private async generateInitialRoutines(config: {
    worldId: string;
    currentYear: number;
  }): Promise<number> {
    const characters = await storage.getCharactersByWorld(config.worldId);
    let routineCount = 0;
    
    for (const character of characters) {
      // Only generate for living individuals age 10+
      const age = this.getAge(character, config.currentYear);
      if (character.isAlive && age >= 10) {
        try {
          const routine = await generateDefaultRoutine(character.id);
          await setRoutine(character.id, routine);
          routineCount++;
        } catch (error) {
          console.error(`   ✗ Failed to generate routine for ${character.firstName}:`, error);
        }
      }
    }
    
    console.log(`   ✓ Generated ${routineCount} routines`);
    return routineCount;
  }

  /**
   * Simulate historical events over time
   */
  private async simulateHistory(config: {
    worldId: string;
    startYear: number;
    endYear: number;
    fidelity: 'low' | 'medium' | 'high';
  }): Promise<number> {
    const yearsToSimulate = config.endYear - config.startYear;
    const timestepsPerYear = config.fidelity === 'low' ? 4 : // quarterly
                             config.fidelity === 'medium' ? 12 : // monthly
                             730; // daily
    
    let currentYear = config.startYear;
    let timestep = 0;
    let totalEvents = 0;
    
    for (let year = 0; year < yearsToSimulate; year++) {
      currentYear = config.startYear + year;
      
      // Trigger automatic lifecycle events (deaths, retirements, graduations)
      try {
        const events = await triggerAutomaticEvents(
          config.worldId,
          currentYear,
          timestep
        );
        
        totalEvents += events.length;
        
        if (events.length > 0) {
          console.log(`   Year ${currentYear}: ${events.length} events`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to trigger events for ${currentYear}:`, error);
      }
      
      // Potentially found new businesses (5% chance per year)
      if (Math.random() < 0.05) {
        await this.attemptBusinessFounding(config.worldId, currentYear, timestep);
      }
      
      // Potentially close businesses (2% chance per year)
      if (Math.random() < 0.02) {
        await this.attemptBusinessClosure(config.worldId, currentYear, timestep);
      }
      
      timestep += timestepsPerYear;
    }
    
    console.log(`   ✓ Simulated ${yearsToSimulate} years, ${totalEvents} total events`);
    return totalEvents;
  }

  /**
   * Attempt to found a new business during simulation
   */
  private async attemptBusinessFounding(
    worldId: string,
    currentYear: number,
    timestep: number
  ): Promise<void> {
    const characters = await storage.getCharactersByWorld(worldId);
    const unemployed = characters.filter(c => {
      const age = this.getAge(c, currentYear);
      const customData = (c as any).customData as Record<string, any> | undefined;
      return c.isAlive &&
             age >= 25 &&
             age <= 60 &&
             !customData?.currentOccupation;
    });
    
    if (unemployed.length > 0 && Math.random() < 0.3) {
      const founder = unemployed[Math.floor(Math.random() * unemployed.length)];
      const businessTypes: BusinessType[] = ['Retail', 'Restaurant', 'Manufacturing'];
      const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
      
      try {
        await foundBusiness({
          worldId,
          founderId: founder.id,
          name: `${founder.lastName}'s ${businessType}`,
          businessType,
          address: 'Main Street',
          currentYear,
          currentTimestep: timestep
        });
        console.log(`   ✓ ${founder.lastName} founded new ${businessType}`);
      } catch (error) {
        // Silent fail - founding doesn't always succeed
      }
    }
  }

  /**
   * Attempt to close a business during simulation
   */
  private async attemptBusinessClosure(
    worldId: string,
    currentYear: number,
    timestep: number
  ): Promise<void> {
    try {
      const businesses = await storage.getBusinessesByWorld(worldId);
      const activeBusinesses = businesses.filter((b: Business) => !b.isOutOfBusiness);
      
      if (activeBusinesses.length > 5 && Math.random() < 0.5) {
        const businessToClose = activeBusinesses[
          Math.floor(Math.random() * activeBusinesses.length)
        ];
        
        await closeBusiness({
          businessId: businessToClose.id,
          reason: Math.random() < 0.5 ? 'bankruptcy' : 'retirement',
          currentYear,
          currentTimestep: timestep,
          notifyEmployees: true
        });
        console.log(`   ✓ ${businessToClose.name} closed`);
      }
    } catch (error) {
      // Silent fail - closure doesn't always succeed
    }
  }

  /**
   * Get character age at a specific year
   */
  private getAge(character: Character, currentYear: number): number {
    return currentYear - (character.birthYear || 0);
  }

  /**
   * Count employed characters in a world
   */
  private async countEmployed(worldId: string): Promise<number> {
    const characters = await storage.getCharactersByWorld(worldId);
    return characters.filter(c => {
      const customData = (c as any).customData as Record<string, any> | undefined;
      return customData?.currentOccupation;
    }).length;
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
   * Phase 5: Initialize Social Dynamics (based on TotT's relationship initialization)
   * Creates initial relationships for families and coworkers
   */
  private async initializeSocialDynamics(config: {
    worldId: string;
    currentYear: number;
  }): Promise<void> {
    const characters = await storage.getCharactersByWorld(config.worldId);
    let relationshipsCreated = 0;
    
    for (const char1 of characters) {
      // Skip if too young (following TotT: age > 3 for social interactions)
      const age1 = this.getAge(char1, config.currentYear);
      if (age1 <= 3) continue;
      
      for (const char2 of characters) {
        if (char1.id >= char2.id) continue; // Avoid duplicates
        
        const age2 = this.getAge(char2, config.currentYear);
        if (age2 <= 3) continue;
        
        // Initialize relationship if they're family or coworkers
        const customData1 = (char1 as any).customData as Record<string, any> | undefined;
        const customData2 = (char2 as any).customData as Record<string, any> | undefined;
        
        const isFamilyRelated = (
          char1.fatherId === char2.fatherId ||
          char1.motherId === char2.motherId ||
          char1.spouseId === char2.id ||
          char2.spouseId === char1.id
        );
        
        const areCoworkers = (
          customData1?.currentOccupation?.company === customData2?.currentOccupation?.company &&
          customData1?.currentOccupation?.company !== undefined
        );
        
        if (isFamilyRelated || areCoworkers) {
          try {
            const relationshipType = isFamilyRelated ? 'family' : 'coworker';
            // Use initializeRelationshipWithCompatibility since initializeRelationship doesn't exist
            await updateRelationship(char1.id, char2.id, 5, 1900); // Bootstrap with positive charge
            relationshipsCreated++;
          } catch (error) {
            // Silent fail - relationship may already exist
          }
        }
      }
    }
    
    console.log(`   ✓ Created ${relationshipsCreated} initial relationships`);
  }
  
  /**
   * Phase 6: Implant Knowledge (based on TotT's implant_knowledge method)
   * Gives characters initial knowledge of family members and coworkers
   */
  private async implantKnowledge(config: {
    worldId: string;
    currentTimestep: number;
  }): Promise<void> {
    const characters = await storage.getCharactersByWorld(config.worldId);
    let mentalModelsCreated = 0;
    
    for (const observer of characters) {
      // Following TotT pattern: only for age > 3
      if ((observer as any).age <= 3) continue;
      
      // Initialize knowledge of family members
      try {
        await initializeFamilyKnowledge(observer.id, config.currentTimestep);
        mentalModelsCreated += 5; // Estimate: parents, siblings, spouse, children
      } catch (error) {
        // Silent fail
      }
      
      // Initialize knowledge of coworkers
      const customData = (observer as any).customData as Record<string, any> | undefined;
      if (customData?.currentOccupation) {
        try {
          await initializeCoworkerKnowledge(observer.id, config.currentTimestep);
          mentalModelsCreated += 3; // Estimate: a few coworkers
        } catch (error) {
          // Silent fail
        }
      }
    }
    
    console.log(`   ✓ Implanted ~${mentalModelsCreated} mental models`);
  }
  
  /**
   * Phase 9: Initialize Wealth (give characters starting money based on occupation)
   */
  private async initializeWealth(config: {
    worldId: string;
    currentYear: number;
  }): Promise<void> {
    const characters = await storage.getCharactersByWorld(config.worldId);
    let wealthInitialized = 0;
    
    for (const character of characters) {
      const age = this.getAge(character, config.currentYear);
      if (age < 18) continue; // Only adults get money
      
      // Determine starting wealth based on occupation/age
      const customData = (character as any).customData as Record<string, any> | undefined;
      let startingMoney = 100; // Base amount
      
      if (customData?.currentOccupation) {
        // Employed: more money
        startingMoney = 300 + Math.random() * 200;
      } else {
        // Unemployed: less money
        startingMoney = 50 + Math.random() * 100;
      }
      
      // Older characters have accumulated more wealth
      if (age > 40) {
        startingMoney *= 1.5;
      }
      if (age > 60) {
        startingMoney *= 2;
      }
      
      try {
        await addMoney(
          character.id,
          Math.round(startingMoney),
          'Initial wealth at world generation',
          0
        );
        wealthInitialized++;
      } catch (error) {
        // Silent fail
      }
    }
    
    console.log(`   ✓ Initialized wealth for ${wealthInitialized} characters`);
  }

  /**
   * Generate character portraits for all characters in a world
   */
  private async generateCharacterPortraitsForWorld(config: {
    worldId: string;
    provider: 'flux' | 'gemini-imagen' | 'dalle' | 'stable-diffusion';
  }): Promise<number> {
    try {
      const assetIds = await visualAssetGenerator.batchGenerateCharacterPortraits(
        config.worldId,
        config.provider
      );
      console.log(`   ✓ Generated ${assetIds.length} character portraits`);
      return assetIds.length;
    } catch (error) {
      console.error('   ✗ Failed to generate character portraits:', error);
      return 0;
    }
  }

  /**
   * Generate building exteriors for all businesses in a world
   */
  private async generateBuildingExteriorsForWorld(config: {
    worldId: string;
    provider: 'flux' | 'gemini-imagen' | 'dalle' | 'stable-diffusion';
  }): Promise<number> {
    try {
      const assetIds = await visualAssetGenerator.batchGenerateBuildingExteriors(
        config.worldId,
        config.provider
      );
      console.log(`   ✓ Generated ${assetIds.length} building exteriors`);
      return assetIds.length;
    } catch (error) {
      console.error('   ✗ Failed to generate building exteriors:', error);
      return 0;
    }
  }

  /**
   * Generate all map types for a settlement
   */
  private async generateSettlementMapsForSettlement(config: {
    settlementId: string;
    provider: 'flux' | 'gemini-imagen' | 'dalle' | 'stable-diffusion';
  }): Promise<number> {
    try {
      const assetIds = await visualAssetGenerator.batchGenerateSettlementMaps(
        config.settlementId,
        config.provider
      );
      console.log(`   ✓ Generated ${assetIds.length} settlement maps`);
      return assetIds.length;
    } catch (error) {
      console.error('   ✗ Failed to generate settlement maps:', error);
      return 0;
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
        economicSystem: 'agricultural',
        generateBusinesses: true,
        assignEmployment: true,
        generateRoutines: true,
        simulateHistory: true,
        historyFidelity: 'low',
        // Phase 5-10: TotT Social Simulation
        initializeSocialDynamics: true,
        initializeKnowledge: true,
        initializeWealth: true,
        initializeCommunityMorale: true,
        scheduleFestival: true,
        // GenAI Visual Asset Generation
        generateVisualAssets: true,
        generateCharacterPortraits: true,
        generateBuildingExteriors: true,
        generateSettlementMaps: true,
        visualGenerationProvider: 'flux'
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
        economicSystem: 'mercantile',
        generateBusinesses: true,
        assignEmployment: true,
        generateRoutines: true,
        simulateHistory: true,
        historyFidelity: 'low',
        // GenAI Visual Asset Generation
        generateVisualAssets: true,
        generateCharacterPortraits: true,
        generateBuildingExteriors: true,
        generateSettlementMaps: true,
        visualGenerationProvider: 'flux'
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
        economicSystem: 'mixed',
        generateBusinesses: true,
        assignEmployment: true,
        generateRoutines: true,
        simulateHistory: true,
        historyFidelity: 'medium',
        // GenAI Visual Asset Generation
        generateVisualAssets: true,
        generateCharacterPortraits: true,
        generateBuildingExteriors: true,
        generateSettlementMaps: true,
        visualGenerationProvider: 'flux'
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
        economicSystem: 'feudal',
        generateBusinesses: true,
        assignEmployment: true,
        generateRoutines: true,
        simulateHistory: true,
        historyFidelity: 'low',
        // GenAI Visual Asset Generation
        generateVisualAssets: true,
        generateCharacterPortraits: true,
        generateBuildingExteriors: true,
        generateSettlementMaps: true,
        visualGenerationProvider: 'flux'
      }
    };
  }
}
