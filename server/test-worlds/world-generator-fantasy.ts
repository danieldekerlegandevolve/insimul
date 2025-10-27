/**
 * High Fantasy World Generator
 * 
 * Creates a high fantasy world with:
 * - Multiple fantasy races (elves, dwarves, humans, etc.)
 * - Magic users and warriors
 * - Ancient lineages and prophecies
 * - Cross-racial relationships and conflicts
 */

import type { IStorage } from '../storage';

export async function generateFantasyWorld(storage: IStorage): Promise<string> {
  console.log('⚔️ Generating High Fantasy World...');

  const world = await storage.createWorld({
    name: 'Realm of Aethermoor',
    description: 'A high fantasy realm where multiple races coexist, magic flows freely, and ancient prophecies guide destiny',
    systemTypes: ['insimul', 'kismet'],
    config: {
      era: 'fantasy',
      magic: 'high',
      races: ['human', 'elf', 'dwarf', 'orc']
    }
  });

  const worldId = world.id;

  // Create racial kingdoms
  const humanKingdom = await storage.createCountry({
    worldId,
    name: 'Kingdom of Aethoria',
    governmentType: 'monarchy',
    economicSystem: 'feudal'
  });

  const elfRealm = await storage.createCountry({
    worldId,
    name: 'Elven Realm of Silverwood',
    governmentType: 'theocracy',
    economicSystem: 'agricultural'
  });

  const dwarfKingdom = await storage.createCountry({
    worldId,
    name: 'Dwarven Holds of Ironpeak',
    governmentType: 'monarchy',
    economicSystem: 'trade-based'
  });

  // Create diverse settlements
  const humanCapital = await storage.createSettlement({
    worldId,
    countryId: humanKingdom.id,
    name: 'Aethoria City',
    settlementType: 'city',
    population: 50000,
    terrain: 'plains'
  });

  const elvishForest = await storage.createSettlement({
    worldId,
    countryId: elfRealm.id,
    name: 'Silverwood Grove',
    settlementType: 'town',
    population: 10000,
    terrain: 'forest'
  });

  const dwarvenHold = await storage.createSettlement({
    worldId,
    countryId: dwarfKingdom.id,
    name: 'Ironpeak Hold',
    settlementType: 'town',
    population: 20000,
    terrain: 'mountains'
  });

  const mixedTown = await storage.createSettlement({
    worldId,
    countryId: humanKingdom.id,
    name: 'Crossroads Haven',
    settlementType: 'town',
    population: 5000,
    terrain: 'plains'
  });

  // Create human royal family
  const humanKing = await storage.createCharacter({
    worldId,
    firstName: 'Aldric',
    lastName: 'Stormborne',
    gender: 'male',
    birthYear: 970,
    isAlive: true,
    occupation: 'king',
    currentLocation: humanCapital.id
  });

  const humanQueen = await storage.createCharacter({
    worldId,
    firstName: 'Elara',
    lastName: 'Stormborne',
    gender: 'female',
    birthYear: 975,
    isAlive: true,
    occupation: 'queen',
    currentLocation: humanCapital.id,
    spouseId: humanKing.id
  });

  await storage.updateCharacter(humanKing.id, { spouseId: humanQueen.id });

  // Prince and Princess
  const prince = await storage.createCharacter({
    worldId,
    firstName: 'Cedric',
    lastName: 'Stormborne',
    gender: 'male',
    birthYear: 995,
    isAlive: true,
    occupation: 'prince',
    currentLocation: humanCapital.id,
    parentIds: [humanKing.id, humanQueen.id]
  });

  const princess = await storage.createCharacter({
    worldId,
    firstName: 'Arianna',
    lastName: 'Stormborne',
    gender: 'female',
    birthYear: 998,
    isAlive: true,
    occupation: 'princess',
    currentLocation: humanCapital.id,
    parentIds: [humanKing.id, humanQueen.id]
  });

  // Create elvish noble line
  const elfLord = await storage.createCharacter({
    worldId,
    firstName: 'Thranduil',
    lastName: 'Moonwhisper',
    gender: 'male',
    birthYear: 700, // Long-lived elves
    isAlive: true,
    occupation: 'elf-lord',
    currentLocation: elvishForest.id
  });

  const elfLady = await storage.createCharacter({
    worldId,
    firstName: 'Celebrían',
    lastName: 'Moonwhisper',
    gender: 'female',
    birthYear: 720,
    isAlive: true,
    occupation: 'mage',
    currentLocation: elvishForest.id,
    spouseId: elfLord.id
  });

  await storage.updateCharacter(elfLord.id, { spouseId: elfLady.id });

  // Elf children
  for (let i = 0; i < 2; i++) {
    await storage.createCharacter({
      worldId,
      firstName: i === 0 ? 'Legolas' : 'Arwen',
      lastName: 'Moonwhisper',
      gender: i === 0 ? 'male' : 'female',
      birthYear: 900 + i * 20,
      isAlive: true,
      occupation: i === 0 ? 'ranger' : 'mage',
      currentLocation: elvishForest.id,
      parentIds: [elfLord.id, elfLady.id]
    });
  }

  // Create dwarven clan
  const dwarfKing = await storage.createCharacter({
    worldId,
    firstName: 'Thorin',
    lastName: 'Ironforge',
    gender: 'male',
    birthYear: 850,
    isAlive: true,
    occupation: 'dwarf-king',
    currentLocation: dwarvenHold.id
  });

  // Dwarf warriors and craftsmen
  const dwarves = ['Gimli', 'Balin', 'Dwalin'];
  for (const name of dwarves) {
    await storage.createCharacter({
      worldId,
      firstName: name,
      lastName: 'Ironforge',
      gender: 'male',
      birthYear: 900,
      isAlive: true,
      occupation: name === 'Gimli' ? 'warrior' : 'craftsman',
      currentLocation: dwarvenHold.id,
      parentIds: [dwarfKing.id]
    });
  }

  // Create mixed-race adventuring party in Crossroads Haven
  const adventurers = [
    { name: 'Gandalf', race: 'human', job: 'wizard' },
    { name: 'Boromir', race: 'human', job: 'warrior' },
    { name: 'Galadriel', race: 'elf', job: 'cleric' },
    { name: 'Grommash', race: 'orc', job: 'barbarian' }
  ];

  const adventurerIds: string[] = [];
  for (const adv of adventurers) {
    const char = await storage.createCharacter({
      worldId,
      firstName: adv.name,
      lastName: 'Adventurer',
      gender: adv.name === 'Galadriel' ? 'female' : 'male',
      birthYear: 980,
      isAlive: true,
      occupation: adv.job,
      currentLocation: mixedTown.id
    });
    adventurerIds.push(char.id);
  }

  // Create adventuring party friendships
  if (adventurerIds.length >= 2) {
    await storage.updateCharacter(adventurerIds[0], {
      friendIds: adventurerIds.slice(1)
    });
  }

  // Create cross-race friendship (human prince and elf)
  const arwen = await storage.getCharactersByWorld(worldId);
  const arwenChar = arwen.find(c => c.firstName === 'Arwen');
  if (arwenChar) {
    await storage.updateCharacter(prince.id, {
      friendIds: [arwenChar.id]
    });
  }

  console.log(`✅ Fantasy World created: ${worldId}`);
  console.log(`   - 3 kingdoms (Human, Elf, Dwarf)`);
  console.log(`   - 4 settlements (cities, forests, mountains)`);
  console.log(`   - Royal families from 3 races`);
  console.log(`   - Adventuring party with cross-race friendships`);
  
  return worldId;
}
