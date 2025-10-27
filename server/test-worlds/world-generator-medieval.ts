/**
 * Medieval Fantasy World Generator
 * 
 * Creates a traditional medieval fantasy world with:
 * - Noble houses and succession
 * - Knights and peasants
 * - Feudal relationships
 * - Multiple settlements (castles, towns, villages)
 */

import type { IStorage } from '../storage';

export async function generateMedievalWorld(storage: IStorage): Promise<string> {
  console.log('🏰 Generating Medieval Fantasy World...');

  // Create world
  const world = await storage.createWorld({
    name: 'Medieval Kingdom of Avaloria',
    description: 'A traditional medieval fantasy kingdom with noble houses, knights, and feudal structures',
    systemTypes: ['insimul', 'ensemble', 'kismet'],
    config: {
      era: 'medieval',
      magic: 'low',
      technology: 'feudal'
    }
  });

  const worldId = world.id;

  // Create country
  const country = await storage.createCountry({
    worldId,
    name: 'Avaloria',
    governmentType: 'monarchy',
    economicSystem: 'feudal'
  });

  // Create settlements
  const capital = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Castle Avalon',
    settlementType: 'city',
    population: 5000,
    terrain: 'hills'
  });

  const town = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Riverside Town',
    settlementType: 'town',
    population: 1000,
    terrain: 'river'
  });

  const village = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Peasant Village',
    settlementType: 'village',
    population: 200,
    terrain: 'plains'
  });

  // Create noble families
  const families = [
    { surname: 'Pendragon', occupation: 'king', settlement: capital.id },
    { surname: 'Lancaster', occupation: 'duke', settlement: capital.id },
    { surname: 'York', occupation: 'duke', settlement: capital.id },
    { surname: 'Stark', occupation: 'count', settlement: town.id },
    { surname: 'Lannister', occupation: 'count', settlement: town.id }
  ];

  const characterIds: Record<string, string[]> = {};

  for (const family of families) {
    const familyChars: string[] = [];

    // Create patriarch
    const father = await storage.createCharacter({
      worldId,
      firstName: `Lord ${family.surname}`,
      lastName: family.surname,
      gender: 'male',
      birthYear: 1350,
      isAlive: true,
      occupation: family.occupation,
      currentLocation: family.settlement
    });
    familyChars.push(father.id);

    // Create matriarch
    const mother = await storage.createCharacter({
      worldId,
      firstName: `Lady ${family.surname}`,
      lastName: family.surname,
      gender: 'female',
      birthYear: 1355,
      isAlive: true,
      occupation: 'noble',
      currentLocation: family.settlement,
      spouseId: father.id
    });
    familyChars.push(mother.id);

    // Update father's spouse
    await storage.updateCharacter(father.id, { spouseId: mother.id });

    // Create children
    for (let i = 0; i < 3; i++) {
      const child = await storage.createCharacter({
        worldId,
        firstName: `${family.surname} Child ${i + 1}`,
        lastName: family.surname,
        gender: i === 0 ? 'male' : (i % 2 === 0 ? 'female' : 'male'),
        birthYear: 1375 + i * 2,
        isAlive: true,
        occupation: 'noble',
        currentLocation: family.settlement,
        parentIds: [father.id, mother.id]
      });
      familyChars.push(child.id);
    }

    characterIds[family.surname] = familyChars;
  }

  // Create commoners
  const commoners = [
    { firstName: 'Thomas', occupation: 'blacksmith', location: capital.id },
    { firstName: 'William', occupation: 'merchant', location: capital.id },
    { firstName: 'Henry', occupation: 'knight', location: capital.id },
    { firstName: 'John', occupation: 'farmer', location: village.id },
    { firstName: 'Robert', occupation: 'miller', location: town.id },
    { firstName: 'Richard', occupation: 'baker', location: town.id }
  ];

  for (const commoner of commoners) {
    await storage.createCharacter({
      worldId,
      firstName: commoner.firstName,
      lastName: 'Commoner',
      gender: 'male',
      birthYear: 1360,
      isAlive: true,
      occupation: commoner.occupation,
      currentLocation: commoner.location
    });
  }

  // Create some friendships between nobles
  const pendragons = characterIds['Pendragon'];
  const lancasters = characterIds['Lancaster'];
  if (pendragons && lancasters && pendragons.length > 2 && lancasters.length > 2) {
    await storage.updateCharacter(pendragons[2], {
      friendIds: [lancasters[2]]
    });
  }

  console.log(`✅ Medieval World created: ${worldId}`);
  console.log(`   - 1 country, 3 settlements`);
  console.log(`   - 5 noble families (~20 nobles)`);
  console.log(`   - 6 commoners`);
  
  return worldId;
}
