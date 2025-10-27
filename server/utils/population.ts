/**
 * Population Utilities
 * Calculate population dynamically based on actual characters
 */

import { storage } from '../storage';

/**
 * Get the actual population of a world by counting characters
 */
export async function getWorldPopulation(worldId: string): Promise<number> {
  const characters = await storage.getCharactersByWorld(worldId);
  return characters.filter(c => c.isAlive !== false).length;
}

/**
 * Get the actual population of a settlement by counting characters
 */
export async function getSettlementPopulation(settlementId: string): Promise<number> {
  const characters = await storage.getCharactersByWorld(''); // We need to add a method to get by settlement
  return characters.filter(c => 
    c.isAlive !== false && 
    c.currentLocation === settlementId
  ).length;
}

/**
 * Get the actual population of a country by counting characters in its settlements
 */
export async function getCountryPopulation(countryId: string): Promise<number> {
  // Get all settlements in this country
  const settlements = await storage.getSettlementsByCountry(countryId);
  const settlementIds = settlements.map(s => s.id);
  
  // Count characters in any of these settlements
  const characters = await storage.getCharactersByWorld(''); // Need to filter by settlement
  return characters.filter(c => 
    c.isAlive !== false && 
    c.currentLocation && 
    settlementIds.includes(c.currentLocation)
  ).length;
}

/**
 * Update settlement population based on actual character count
 * This should be called after character creation/deletion
 */
export async function updateSettlementPopulation(settlementId: string): Promise<void> {
  const actualPopulation = await getSettlementPopulation(settlementId);
  await storage.updateSettlement(settlementId, {
    population: actualPopulation
  });
}

/**
 * Get population summary for display
 */
export async function getPopulationSummary(worldId: string): Promise<{
  totalCharacters: number;
  aliveCharacters: number;
  deadCharacters: number;
  bySettlement: Array<{
    settlementId: string;
    settlementName: string;
    population: number;
  }>;
}> {
  const characters = await storage.getCharactersByWorld(worldId);
  const alive = characters.filter(c => c.isAlive !== false);
  const dead = characters.filter(c => c.isAlive === false);
  
  // Group by settlement
  const bySettlement = new Map<string, number>();
  alive.forEach(c => {
    if (c.currentLocation) {
      bySettlement.set(
        c.currentLocation,
        (bySettlement.get(c.currentLocation) || 0) + 1
      );
    }
  });
  
  // Get settlement names
  const settlements = await storage.getSettlementsByWorld(worldId);
  const settlementMap = new Map(settlements.map(s => [s.id, s.name]));
  
  return {
    totalCharacters: characters.length,
    aliveCharacters: alive.length,
    deadCharacters: dead.length,
    bySettlement: Array.from(bySettlement.entries()).map(([id, count]) => ({
      settlementId: id,
      settlementName: settlementMap.get(id) || 'Unknown',
      population: count
    }))
  };
}
