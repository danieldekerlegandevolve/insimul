/**
 * Sci-Fi Space Colony World Generator
 * 
 * Creates a futuristic space colony with:
 * - Multiple space stations and colonies
 * - Corporate hierarchies
 * - Diverse occupations (engineers, scientists, pilots)
 * - Multi-generational families in space
 */

import type { IStorage } from '../storage';

export async function generateSciFiWorld(storage: IStorage): Promise<string> {
  console.log('🚀 Generating Sci-Fi Space Colony World...');

  const world = await storage.createWorld({
    name: 'Titan Colony Network',
    description: 'A network of space colonies orbiting Saturn\'s moon Titan in the year 2250',
    systemTypes: ['insimul'],
    config: {
      era: 'future',
      technology: 'advanced',
      ftl: true
    }
  });

  const worldId = world.id;

  // Create "country" (governing body)
  const government = await storage.createCountry({
    worldId,
    name: 'Titan Colonial Authority',
    governmentType: 'democracy',
    economicSystem: 'mixed'
  });

  // Create settlements (space stations/colonies)
  const mainStation = await storage.createSettlement({
    worldId,
    countryId: government.id,
    name: 'Central Hub Station',
    settlementType: 'city',
    population: 50000,
    terrain: 'space'
  });

  const miningColony = await storage.createSettlement({
    worldId,
    countryId: government.id,
    name: 'Titan Mining Outpost Alpha',
    settlementType: 'town',
    population: 5000,
    terrain: 'ice'
  });

  const researchStation = await storage.createSettlement({
    worldId,
    countryId: government.id,
    name: 'Scientific Research Station Beta',
    settlementType: 'town',
    population: 2000,
    terrain: 'orbital'
  });

  // Create corporate families
  const corporations = [
    { name: 'Chen', corp: 'Titan Mining Corp', role: 'CEO', station: mainStation.id },
    { name: 'Rodriguez', corp: 'Colonial Authority', role: 'governor', station: mainStation.id },
    { name: 'Okafor', corp: 'Research Institute', role: 'director', station: researchStation.id },
    { name: 'Nakamura', corp: 'Transport Guild', role: 'captain', station: mainStation.id }
  ];

  for (const corp of corporations) {
    // Create founder generation (born on Earth)
    const founder = await storage.createCharacter({
      worldId,
      firstName: corp.name,
      lastName: 'Generation-1',
      gender: Math.random() > 0.5 ? 'male' : 'female',
      birthYear: 2180,
      isAlive: true,
      occupation: corp.role,
      currentLocation: corp.corp === 'Titan Mining Corp' ? miningColony.id : corp.station
    });

    // Create second generation (born in space)
    for (let i = 0; i < 2; i++) {
      await storage.createCharacter({
        worldId,
        firstName: `${corp.name}-${i + 1}`,
        lastName: 'Generation-2',
        gender: i % 2 === 0 ? 'male' : 'female',
        birthYear: 2210 + i * 5,
        isAlive: true,
        occupation: i === 0 ? 'engineer' : 'scientist',
        currentLocation: corp.station,
        parentIds: [founder.id]
      });
    }

    // Create third generation (native colonists)
    for (let i = 0; i < 3; i++) {
      await storage.createCharacter({
        worldId,
        firstName: `${corp.name}-G3-${i + 1}`,
        lastName: 'Generation-3',
        gender: i % 2 === 0 ? 'female' : 'male',
        birthYear: 2240 + i * 2,
        isAlive: true,
        occupation: ['pilot', 'technician', 'medic'][i],
        currentLocation: i === 2 ? researchStation.id : corp.station
      });
    }
  }

  // Create diverse working class
  const workers = [
    { name: 'Singh', job: 'mechanic', loc: miningColony.id },
    { name: 'Kowalski', job: 'pilot', loc: mainStation.id },
    { name: 'Yamamoto', job: 'biologist', loc: researchStation.id },
    { name: 'Mbaye', job: 'doctor', loc: mainStation.id },
    { name: 'O\'Brien', job: 'security', loc: mainStation.id }
  ];

  for (const worker of workers) {
    await storage.createCharacter({
      worldId,
      firstName: worker.name,
      lastName: 'Worker',
      gender: Math.random() > 0.5 ? 'male' : 'female',
      birthYear: 2220,
      isAlive: true,
      occupation: worker.job,
      currentLocation: worker.loc
    });
  }

  console.log(`✅ Sci-Fi World created: ${worldId}`);
  console.log(`   - 1 governing body, 3 space colonies`);
  console.log(`   - 4 corporate families (3 generations)`);
  console.log(`   - 5 independent workers`);
  
  return worldId;
}
