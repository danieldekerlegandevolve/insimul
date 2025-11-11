/**
 * Insimul Data File Loader
 * 
 * Loads .insimul JSON data files and creates worlds from them.
 * This provides a declarative way to define seed data.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { IStorage } from '../storage';

interface InsimulWorld {
  world: {
    name: string;
    description: string;
    sourceFormats?: string[];
    config?: Record<string, any>;
  };
  countries?: Array<{
    id: string;
    name: string;
    governmentType: string;
    economicSystem: string;
  }>;
  settlements?: Array<{
    id: string;
    countryRef: string;
    name: string;
    settlementType: string;
    population: number;
    terrain: string;
  }>;
  characters?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    birthYear: number;
    occupation?: string;
    locationRef: string;
    race?: string;
    spouseRef?: string;
    parentRefs?: string[];
  }>;
  relationships?: Array<{
    characterRef: string;
    friendRefs?: string[];
    enemyRefs?: string[];
  }>;
  businesses?: Array<{
    id: string;
    name: string;
    businessType: string;
    locationRef: string;
    ownerRef?: string;
  }>;
}

/**
 * Load and generate a world from an .insimul file
 */
export async function loadInsimulWorld(
  storage: IStorage,
  insimulPath: string
): Promise<string> {
  console.log(`📂 Loading world from ${insimulPath}...`);

  // Read and parse the .insimul file
  const fileContent = await fs.readFile(insimulPath, 'utf-8');
  const data: InsimulWorld = JSON.parse(fileContent);

  // Create world
  const world = await storage.createWorld({
    name: data.world.name,
    description: data.world.description,
    sourceFormats: data.world.sourceFormats,
    config: data.world.config
  });

  const worldId = world.id;
  console.log(`✅ Created world: ${data.world.name}`);

  // Maps to track created entities by their reference IDs
  const countryMap = new Map<string, string>();
  const settlementMap = new Map<string, string>();
  const characterMap = new Map<string, string>();
  const businessMap = new Map<string, string>();

  // Create countries
  if (data.countries) {
    for (const countryData of data.countries) {
      const country = await storage.createCountry({
        worldId,
        name: countryData.name,
        governmentType: countryData.governmentType,
        economicSystem: countryData.economicSystem
      });
      countryMap.set(countryData.id, country.id);
      console.log(`  📍 Created country: ${countryData.name}`);
    }
  }

  // Create settlements
  if (data.settlements) {
    for (const settlementData of data.settlements) {
      const countryId = countryMap.get(settlementData.countryRef);
      if (!countryId) {
        console.warn(`⚠️  Country reference not found: ${settlementData.countryRef}`);
        continue;
      }

      const settlement = await storage.createSettlement({
        worldId,
        countryId,
        name: settlementData.name,
        settlementType: settlementData.settlementType as any,
        population: settlementData.population,
        terrain: settlementData.terrain as any
      });
      settlementMap.set(settlementData.id, settlement.id);
      console.log(`  🏘️  Created settlement: ${settlementData.name}`);
    }
  }

  // Create characters (first pass - without relationships)
  if (data.characters) {
    for (const charData of data.characters) {
      const locationId = settlementMap.get(charData.locationRef);
      if (!locationId) {
        console.warn(`⚠️  Location reference not found: ${charData.locationRef}`);
        continue;
      }

      const character = await storage.createCharacter({
        worldId,
        firstName: charData.firstName,
        lastName: charData.lastName,
        gender: charData.gender,
        birthYear: charData.birthYear,
        isAlive: true,
        occupation: charData.occupation,
        currentLocation: locationId
      });
      characterMap.set(charData.id, character.id);
      console.log(`  👤 Created character: ${charData.firstName} ${charData.lastName}`);
    }
  }

  // Update character relationships (second pass)
  if (data.characters) {
    for (const charData of data.characters) {
      const characterId = characterMap.get(charData.id);
      if (!characterId) continue;

      const updates: any = {};

      // Handle spouse reference
      if (charData.spouseRef) {
        const spouseId = characterMap.get(charData.spouseRef);
        if (spouseId) {
          updates.spouseId = spouseId;
        }
      }

      // Handle parent references
      if (charData.parentRefs && charData.parentRefs.length > 0) {
        const parentIds = charData.parentRefs
          .map(ref => characterMap.get(ref))
          .filter(id => id !== undefined);
        if (parentIds.length > 0) {
          updates.parentIds = parentIds;
        }
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateCharacter(characterId, updates);
      }
    }
  }

  // Create explicit relationships (friendships, etc.)
  if (data.relationships) {
    for (const relData of data.relationships) {
      const characterId = characterMap.get(relData.characterRef);
      if (!characterId) continue;

      const updates: any = {};

      if (relData.friendRefs) {
        const friendIds = relData.friendRefs
          .map(ref => characterMap.get(ref))
          .filter(id => id !== undefined);
        if (friendIds.length > 0) {
          updates.friendIds = friendIds;
        }
      }

      if (relData.enemyRefs) {
        const enemyIds = relData.enemyRefs
          .map(ref => characterMap.get(ref))
          .filter(id => id !== undefined);
        if (enemyIds.length > 0) {
          updates.enemyIds = enemyIds;
        }
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateCharacter(characterId, updates);
        console.log(`  🤝 Created relationships for character ${relData.characterRef}`);
      }
    }
  }

  // Create businesses
  if (data.businesses) {
    for (const businessData of data.businesses) {
      const locationId = settlementMap.get(businessData.locationRef);
      if (!locationId) {
        console.warn(`⚠️  Location reference not found: ${businessData.locationRef}`);
        continue;
      }

      const ownerId = businessData.ownerRef
        ? characterMap.get(businessData.ownerRef)
        : undefined;

      await storage.createBusiness({
        worldId,
        name: businessData.name,
        businessType: businessData.businessType as any,
        settlementId: locationId,
        ownerId
      });
      console.log(`  🏢 Created business: ${businessData.name}`);
    }
  }

  console.log(`✨ World "${data.world.name}" loaded successfully!`);
  return worldId;
}

/**
 * Load a world from a preset directory
 */
export async function loadWorldPreset(
  storage: IStorage,
  presetName: 'fantasy' | 'historical' | 'medieval' | 'modern' | 'scifi'
): Promise<string> {
  const insimulPath = path.join(
    __dirname,
    presetName,
    `${presetName}.insimul`
  );
  return loadInsimulWorld(storage, insimulPath);
}
