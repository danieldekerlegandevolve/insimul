/**
 * Modern Urban World Generator
 * 
 * Creates a contemporary urban setting with:
 * - Modern occupations and social structures
 * - Diverse relationships (friends, colleagues, neighbors)
 * - Multiple neighborhoods and districts
 * - Complex social networks
 */

import type { IStorage } from '../storage';

export async function generateModernWorld(storage: IStorage): Promise<string> {
  console.log('🏙️ Generating Modern Urban World...');

  const world = await storage.createWorld({
    name: 'Metro City',
    description: 'A bustling modern metropolis in present day with diverse populations and complex social networks',
    systemTypes: ['insimul', 'ensemble'],
    config: {
      era: 'modern',
      year: 2025,
      technology: 'contemporary'
    }
  });

  const worldId = world.id;

  const country = await storage.createCountry({
    worldId,
    name: 'United Republic',
    governmentType: 'democracy',
    economicSystem: 'mixed'
  });

  // Create diverse neighborhoods
  const downtown = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Downtown District',
    settlementType: 'city',
    population: 500000,
    terrain: 'urban'
  });

  const suburbs = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Suburban Heights',
    settlementType: 'town',
    population: 50000,
    terrain: 'plains'
  });

  const techPark = await storage.createSettlement({
    worldId,
    countryId: country.id,
    name: 'Tech Innovation Park',
    settlementType: 'town',
    population: 10000,
    terrain: 'urban'
  });

  // Create diverse family structures
  const families = [
    // Nuclear family in suburbs
    { surname: 'Anderson', type: 'nuclear', location: suburbs.id, occupation: 'teacher' },
    // Single-parent family
    { surname: 'Martinez', type: 'single-parent', location: downtown.id, occupation: 'nurse' },
    // Multi-generational family
    { surname: 'Kim', type: 'multi-gen', location: suburbs.id, occupation: 'restaurant-owner' },
    // Young professional couple
    { surname: 'Patel', type: 'couple', location: techPark.id, occupation: 'software-engineer' }
  ];

  const allCharIds: string[] = [];

  for (const family of families) {
    if (family.type === 'nuclear') {
      const father = await storage.createCharacter({
        worldId,
        firstName: 'James',
        lastName: family.surname,
        gender: 'male',
        birthYear: 1985,
        isAlive: true,
        occupation: family.occupation,
        currentLocation: family.location
      });

      const mother = await storage.createCharacter({
        worldId,
        firstName: 'Sarah',
        lastName: family.surname,
        gender: 'female',
        birthYear: 1987,
        isAlive: true,
        occupation: 'engineer',
        currentLocation: family.location,
        spouseId: father.id
      });

      await storage.updateCharacter(father.id, { spouseId: mother.id });

      // Two kids
      for (let i = 0; i < 2; i++) {
        const child = await storage.createCharacter({
          worldId,
          firstName: i === 0 ? 'Emma' : 'Noah',
          lastName: family.surname,
          gender: i === 0 ? 'female' : 'male',
          birthYear: 2010 + i * 2,
          isAlive: true,
          occupation: 'student',
          currentLocation: family.location,
          parentIds: [father.id, mother.id]
        });
        allCharIds.push(child.id);
      }

      allCharIds.push(father.id, mother.id);

    } else if (family.type === 'single-parent') {
      const parent = await storage.createCharacter({
        worldId,
        firstName: 'Maria',
        lastName: family.surname,
        gender: 'female',
        birthYear: 1990,
        isAlive: true,
        occupation: family.occupation,
        currentLocation: family.location
      });

      const child = await storage.createCharacter({
        worldId,
        firstName: 'Carlos',
        lastName: family.surname,
        gender: 'male',
        birthYear: 2015,
        isAlive: true,
        occupation: 'student',
        currentLocation: family.location,
        parentIds: [parent.id]
      });

      allCharIds.push(parent.id, child.id);

    } else if (family.type === 'multi-gen') {
      // Grandparents
      const grandpa = await storage.createCharacter({
        worldId,
        firstName: 'Jin',
        lastName: family.surname,
        gender: 'male',
        birthYear: 1950,
        isAlive: true,
        occupation: family.occupation,
        currentLocation: family.location
      });

      const grandma = await storage.createCharacter({
        worldId,
        firstName: 'Mei',
        lastName: family.surname,
        gender: 'female',
        birthYear: 1952,
        isAlive: true,
        occupation: 'retired',
        currentLocation: family.location,
        spouseId: grandpa.id
      });

      await storage.updateCharacter(grandpa.id, { spouseId: grandma.id });

      // Parents
      const parent = await storage.createCharacter({
        worldId,
        firstName: 'David',
        lastName: family.surname,
        gender: 'male',
        birthYear: 1980,
        isAlive: true,
        occupation: 'chef',
        currentLocation: family.location,
        parentIds: [grandpa.id, grandma.id]
      });

      // Child
      const child = await storage.createCharacter({
        worldId,
        firstName: 'Sophie',
        lastName: family.surname,
        gender: 'female',
        birthYear: 2012,
        isAlive: true,
        occupation: 'student',
        currentLocation: family.location,
        parentIds: [parent.id]
      });

      allCharIds.push(grandpa.id, grandma.id, parent.id, child.id);

    } else if (family.type === 'couple') {
      const person1 = await storage.createCharacter({
        worldId,
        firstName: 'Raj',
        lastName: family.surname,
        gender: 'male',
        birthYear: 1995,
        isAlive: true,
        occupation: family.occupation,
        currentLocation: family.location
      });

      const person2 = await storage.createCharacter({
        worldId,
        firstName: 'Priya',
        lastName: family.surname,
        gender: 'female',
        birthYear: 1996,
        isAlive: true,
        occupation: 'data-scientist',
        currentLocation: family.location,
        spouseId: person1.id
      });

      await storage.updateCharacter(person1.id, { spouseId: person2.id });

      allCharIds.push(person1.id, person2.id);
    }
  }

  // Create friend networks
  if (allCharIds.length >= 4) {
    await storage.updateCharacter(allCharIds[0], {
      friendIds: [allCharIds[1], allCharIds[2]]
    });
    await storage.updateCharacter(allCharIds[1], {
      friendIds: [allCharIds[0], allCharIds[3]]
    });
  }

  console.log(`✅ Modern World created: ${worldId}`);
  console.log(`   - 1 country, 3 urban areas`);
  console.log(`   - 4 diverse family structures`);
  console.log(`   - Complex social networks`);
  
  return worldId;
}
