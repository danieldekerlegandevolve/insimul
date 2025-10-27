/**
 * Migration Script: Geographical Hierarchy
 * 
 * This script migrates existing worlds to the new geographical hierarchy structure.
 * It creates countries and settlements for each world, and updates references.
 * 
 * Usage:
 *   npm run migrate:geography
 * 
 * Or programmatically:
 *   import { migrateToGeographicalHierarchy } from './server/migrations/migrate-to-geographical-hierarchy';
 *   await migrateToGeographicalHierarchy();
 */

import { storage } from '../storage';

interface LegacyWorld {
  id: string;
  name: string;
  description?: string | null;
  foundedYear?: number | null;
  currentYear?: number | null;
  population?: number | null;
  governmentType?: string | null;
  economicSystem?: string | null;
  locations?: any[] | null;
  buildings?: any[] | null;
  landmarks?: any[] | null;
  genealogies?: any | null;
  familyTrees?: any | null;
  maxGenerations?: number | null;
  currentGeneration?: number | null;
  generationConfig?: any | null;
  [key: string]: any;
}

export async function migrateToGeographicalHierarchy() {
  console.log('🔄 Starting migration to geographical hierarchy...\n');

  try {
    // Get all existing worlds
    const worlds = await storage.getWorlds() as LegacyWorld[];
    console.log(`📊 Found ${worlds.length} worlds to migrate\n`);

    for (const world of worlds) {
      console.log(`\n🌍 Migrating world: ${world.name} (${world.id})`);
      
      // Check if this world already has countries (already migrated)
      const existingCountries = await storage.getCountriesByWorld(world.id);
      if (existingCountries.length > 0) {
        console.log(`   ⏭️  Skipping - already has ${existingCountries.length} countries`);
        continue;
      }

      // Create a country for this world
      const countryName = `Kingdom of ${world.name}`;
      const country = await storage.createCountry({
        worldId: world.id,
        name: countryName,
        description: `The primary nation-state of ${world.name}`,
        governmentType: world.governmentType || 'monarchy',
        economicSystem: world.economicSystem || 'feudal',
        foundedYear: world.foundedYear || null,
      });
      
      console.log(`   ✅ Created country: ${country.name} (${country.id})`);

      // Determine settlement type based on population
      let settlementType: 'village' | 'town' | 'city' = 'town';
      const population = world.population || 0;
      if (population < 2000) {
        settlementType = 'village';
      } else if (population > 20000) {
        settlementType = 'city';
      }

      // Create a settlement for this world
      const settlementName = world.locations?.[0]?.name || `${world.name} Settlement`;
      const settlement = await storage.createSettlement({
        worldId: world.id,
        countryId: country.id,
        name: settlementName,
        description: world.description || `The main settlement of ${world.name}`,
        settlementType,
        terrain: inferTerrain(world),
        population: world.population || 0,
        foundedYear: world.foundedYear || null,
        founderIds: (world as any).founderIds || [],
        districts: world.locations || [],
        streets: extractStreets(world),
        landmarks: world.landmarks || [],
        genealogies: world.genealogies || {},
        familyTrees: world.familyTrees || {},
        maxGenerations: world.maxGenerations || 10,
        currentGeneration: world.currentGeneration || 0,
        generationConfig: world.generationConfig || {},
      });

      console.log(`   ✅ Created settlement: ${settlement.name} (${settlement.id})`);

      // Update world to remove migrated fields (optional - for cleanup)
      // Note: This would require a schema change to allow these fields to be removed
      // For now, we'll leave them for backward compatibility

      console.log(`   ✨ Migration complete for ${world.name}`);
    }

    console.log('\n\n✅ All worlds migrated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the created countries and settlements');
    console.log('   2. Update any lots, businesses, or residences to reference settlements');
    console.log('   3. Test the procedural generation with the new structure');
    console.log('   4. Update any custom code that references old world fields\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Infer terrain type from world data
 */
function inferTerrain(world: LegacyWorld): string {
  // Try to infer from locations or world name
  const worldLower = (world.name || '').toLowerCase();
  const description = (world.description || '').toLowerCase();
  const combined = worldLower + ' ' + description;

  if (combined.includes('mountain') || combined.includes('peak')) return 'mountains';
  if (combined.includes('coast') || combined.includes('harbor') || combined.includes('port')) return 'coast';
  if (combined.includes('river') || combined.includes('valley')) return 'river';
  if (combined.includes('forest') || combined.includes('wood')) return 'forest';
  if (combined.includes('desert') || combined.includes('sand')) return 'desert';
  if (combined.includes('hill')) return 'hills';
  
  // Default to plains
  return 'plains';
}

/**
 * Extract street data from legacy locations
 */
function extractStreets(world: LegacyWorld): any[] {
  const locations = world.locations || [];
  
  // Try to find street-like locations
  const streets = locations.filter((loc: any) => 
    loc.type === 'street' || 
    (loc.name && (loc.name.includes('Street') || loc.name.includes('Avenue') || loc.name.includes('Road')))
  );

  // If no streets found, create some default ones
  if (streets.length === 0 && locations.length > 0) {
    return [
      { id: 'street-1', name: 'Main Street', type: 'street', x: 500, y: 500 },
      { id: 'street-2', name: 'Oak Avenue', type: 'street', x: 600, y: 500 }
    ];
  }

  return streets;
}

/**
 * Migrate lots, businesses, and residences to reference settlements
 * This would need to be called separately after settlements are created
 */
export async function migrateBuildingsToSettlements() {
  console.log('🏢 Migrating buildings to settlements...\n');

  // This would require:
  // 1. Get all lots/businesses/residences without settlementId
  // 2. For each, find the appropriate settlement based on worldId
  // 3. Update the record with the settlementId
  
  console.log('⚠️  Building migration not yet implemented');
  console.log('   Lots, businesses, and residences will need to be manually updated');
  console.log('   or recreated through the procedural generation system.\n');
}

// Allow running directly
if (require.main === module) {
  migrateToGeographicalHierarchy()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
