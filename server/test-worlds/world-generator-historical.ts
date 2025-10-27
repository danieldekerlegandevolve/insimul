/**
 * Historical Renaissance World Generator
 * 
 * Creates a Renaissance-era Italian city-state with:
 * - Merchant families and banking dynasties
 * - Artists, scholars, and craftsmen
 * - Political intrigue and alliances
 * - Trade networks
 */

import type { IStorage } from '../storage';

export async function generateHistoricalWorld(storage: IStorage): Promise<string> {
  console.log('🎨 Generating Historical Renaissance World...');

  const world = await storage.createWorld({
    name: 'Republic of Florentia',
    description: 'A Renaissance Italian city-state during the height of artistic and commercial achievement (circa 1450)',
    systemTypes: ['insimul', 'tott'],
    config: {
      era: 'renaissance',
      year: 1450,
      culture: 'italian'
    }
  });

  const worldId = world.id;

  const republic = await storage.createCountry({
    worldId,
    name: 'Republic of Florentia',
    governmentType: 'republic',
    economicSystem: 'mercantile'
  });

  // Create city districts
  const merchantDistrict = await storage.createSettlement({
    worldId,
    countryId: republic.id,
    name: 'Merchant Quarter',
    settlementType: 'city',
    population: 10000,
    terrain: 'urban'
  });

  const artisticQuarter = await storage.createSettlement({
    worldId,
    countryId: republic.id,
    name: 'Artistic Quarter',
    settlementType: 'town',
    population: 3000,
    terrain: 'urban'
  });

  const portDistrict = await storage.createSettlement({
    worldId,
    countryId: republic.id,
    name: 'Port District',
    settlementType: 'town',
    population: 5000,
    terrain: 'coast'
  });

  // Create merchant banking families
  const families = [
    { name: 'Medici', role: 'banker', wealth: 'very-high' },
    { name: 'Strozzi', role: 'merchant', wealth: 'high' },
    { name: 'Pazzi', role: 'banker', wealth: 'high' }
  ];

  const familyHeads: string[] = [];

  for (const family of families) {
    // Patriarch
    const patriarch = await storage.createCharacter({
      worldId,
      firstName: `Giovanni`,
      lastName: family.name,
      gender: 'male',
      birthYear: 1390,
      isAlive: true,
      occupation: family.role,
      currentLocation: merchantDistrict.id
    });
    familyHeads.push(patriarch.id);

    // Wife
    const wife = await storage.createCharacter({
      worldId,
      firstName: 'Contessina',
      lastName: family.name,
      gender: 'female',
      birthYear: 1395,
      isAlive: true,
      occupation: 'noble',
      currentLocation: merchantDistrict.id,
      spouseId: patriarch.id
    });

    await storage.updateCharacter(patriarch.id, { spouseId: wife.id });

    // Sons (business heirs)
    for (let i = 0; i < 2; i++) {
      await storage.createCharacter({
        worldId,
        firstName: i === 0 ? 'Cosimo' : 'Lorenzo',
        lastName: family.name,
        gender: 'male',
        birthYear: 1415 + i * 5,
        isAlive: true,
        occupation: family.role,
        currentLocation: merchantDistrict.id,
        parentIds: [patriarch.id, wife.id]
      });
    }

    // Daughter
    await storage.createCharacter({
      worldId,
      firstName: 'Lucrezia',
      lastName: family.name,
      gender: 'female',
      birthYear: 1420,
      isAlive: true,
      occupation: 'noble',
      currentLocation: merchantDistrict.id,
      parentIds: [patriarch.id, wife.id]
    });
  }

  // Create artisans and intellectuals
  const artisans = [
    { name: 'Leonardo', surname: 'da Vinci', job: 'artist', loc: artisticQuarter.id },
    { name: 'Michelangelo', surname: 'Buonarroti', job: 'sculptor', loc: artisticQuarter.id },
    { name: 'Niccolò', surname: 'Machiavelli', job: 'scholar', loc: merchantDistrict.id },
    { name: 'Sandro', surname: 'Botticelli', job: 'painter', loc: artisticQuarter.id },
    { name: 'Filippo', surname: 'Brunelleschi', job: 'architect', loc: merchantDistrict.id }
  ];

  for (const artisan of artisans) {
    await storage.createCharacter({
      worldId,
      firstName: artisan.name,
      lastName: artisan.surname,
      gender: 'male',
      birthYear: 1410,
      isAlive: true,
      occupation: artisan.job,
      currentLocation: artisan.loc
    });
  }

  // Create merchants and traders
  const traders = [
    { name: 'Marco', job: 'silk-merchant', loc: portDistrict.id },
    { name: 'Antonio', job: 'spice-trader', loc: portDistrict.id },
    { name: 'Giuliano', job: 'wool-merchant', loc: merchantDistrict.id }
  ];

  for (const trader of traders) {
    await storage.createCharacter({
      worldId,
      firstName: trader.name,
      lastName: 'Trader',
      gender: 'male',
      birthYear: 1420,
      isAlive: true,
      occupation: trader.job,
      currentLocation: trader.loc
    });
  }

  // Create rivalries/alliances between families
  if (familyHeads.length >= 2) {
    await storage.updateCharacter(familyHeads[0], {
      friendIds: [familyHeads[1]] // Medici-Strozzi alliance
    });
  }

  console.log(`✅ Historical World created: ${worldId}`);
  console.log(`   - 1 republic, 3 city districts`);
  console.log(`   - 3 merchant banking families`);
  console.log(`   - 5 renowned artists/scholars`);
  console.log(`   - 3 traders`);
  
  return worldId;
}
