/**
 * World Scale Manager
 *
 * Handles realistic scaling of countries, states, and settlements
 * Ensures population-appropriate settlement sizes and proper geographic distribution
 */

import { Vector3 } from '@babylonjs/core';

export interface TerritoryBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
}

export interface ScaledCountry {
  id: string;
  name: string;
  bounds: TerritoryBounds;
  states: ScaledState[];
}

export interface ScaledState {
  id: string;
  name: string;
  countryId: string;
  bounds: TerritoryBounds;
  settlements: ScaledSettlement[];
  terrain?: string;
}

export interface ScaledSettlement {
  id: string;
  name: string;
  stateId?: string;
  countryId?: string;
  position: Vector3;
  radius: number; // Based on population
  population: number;
  settlementType: string;
}

export class WorldScaleManager {
  private worldSize: number;
  private seed: string;

  // Scale constants
  private static readonly COUNTRY_MIN_SIZE = 200; // Minimum country dimension
  private static readonly COUNTRY_MAX_SIZE = 400; // Maximum country dimension
  private static readonly STATE_MIN_SIZE = 60; // Minimum state dimension
  private static readonly STATE_MAX_SIZE = 150; // Maximum state dimension

  // Population to settlement radius mapping
  private static readonly POP_SCALE = {
    tiny: { min: 0, max: 50, radius: 20 },
    small: { min: 51, max: 200, radius: 35 },
    medium: { min: 201, max: 1000, radius: 55 },
    large: { min: 1001, max: 5000, radius: 80 },
    huge: { min: 5001, max: Infinity, radius: 120 }
  };

  constructor(worldSize: number = 1024, seed: string = 'world') {
    this.worldSize = worldSize;
    this.seed = seed;
  }

  /**
   * Calculate settlement radius based on population
   */
  public static getSettlementRadius(population: number): number {
    for (const tier of Object.values(WorldScaleManager.POP_SCALE)) {
      if (population >= tier.min && population <= tier.max) {
        // Scale within the tier
        const tierProgress = (population - tier.min) / (tier.max - tier.min);
        const nextTier = Object.values(WorldScaleManager.POP_SCALE)
          .find(t => t.min > tier.max);

        if (nextTier) {
          return tier.radius + tierProgress * (nextTier.radius - tier.radius);
        }
        return tier.radius;
      }
    }
    return 20; // Default minimum
  }

  /**
   * Calculate building count for a settlement based on population
   */
  public static getBuildingCount(population: number): number {
    // Rough estimate: 1 building per 3-5 people
    const avgOccupancy = 4;
    return Math.ceil(population / avgOccupancy);
  }

  /**
   * Distribute countries across the world map
   */
  public distributeCountries(countries: any[]): ScaledCountry[] {
    if (countries.length === 0) return [];

    const scaledCountries: ScaledCountry[] = [];
    const half = this.worldSize / 2;

    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(countries.length));
    const rows = Math.ceil(countries.length / cols);

    const cellWidth = this.worldSize / cols;
    const cellHeight = this.worldSize / rows;

    countries.forEach((country, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Calculate country bounds within cell
      const cellMinX = -half + col * cellWidth;
      const cellMaxX = -half + (col + 1) * cellWidth;
      const cellMinZ = -half + row * cellHeight;
      const cellMaxZ = -half + (row + 1) * cellHeight;

      // Add some padding between countries
      const padding = 20;
      const countryBounds: TerritoryBounds = {
        minX: cellMinX + padding,
        maxX: cellMaxX - padding,
        minZ: cellMinZ + padding,
        maxZ: cellMaxZ - padding,
        centerX: (cellMinX + cellMaxX) / 2,
        centerZ: (cellMinZ + cellMaxZ) / 2
      };

      scaledCountries.push({
        id: country.id,
        name: country.name,
        bounds: countryBounds,
        states: []
      });
    });

    return scaledCountries;
  }

  /**
   * Distribute states within a country
   */
  public distributeStates(country: ScaledCountry, states: any[]): ScaledState[] {
    if (states.length === 0) return [];

    const scaledStates: ScaledState[] = [];
    const countryWidth = country.bounds.maxX - country.bounds.minX;
    const countryHeight = country.bounds.maxZ - country.bounds.minZ;

    // Calculate grid layout for states
    const cols = Math.ceil(Math.sqrt(states.length));
    const rows = Math.ceil(states.length / cols);

    const cellWidth = countryWidth / cols;
    const cellHeight = countryHeight / rows;

    states.forEach((state, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const cellMinX = country.bounds.minX + col * cellWidth;
      const cellMaxX = country.bounds.minX + (col + 1) * cellWidth;
      const cellMinZ = country.bounds.minZ + row * cellHeight;
      const cellMaxZ = country.bounds.minZ + (row + 1) * cellHeight;

      // Small padding between states
      const padding = 5;
      const stateBounds: TerritoryBounds = {
        minX: cellMinX + padding,
        maxX: cellMaxX - padding,
        minZ: cellMinZ + padding,
        maxZ: cellMaxZ - padding,
        centerX: (cellMinX + cellMaxX) / 2,
        centerZ: (cellMinZ + cellMaxZ) / 2
      };

      scaledStates.push({
        id: state.id,
        name: state.name,
        countryId: country.id,
        bounds: stateBounds,
        settlements: [],
        terrain: state.terrain
      });
    });

    return scaledStates;
  }

  /**
   * Distribute settlements within a state or country
   */
  public distributeSettlements(
    territory: { bounds: TerritoryBounds; id: string },
    settlements: any[],
    isState: boolean = false
  ): ScaledSettlement[] {
    const scaledSettlements: ScaledSettlement[] = [];
    const rand = this.createSeededRandom(`${this.seed}_${territory.id}`);

    settlements.forEach((settlement, index) => {
      const population = settlement.population || 100;
      const radius = WorldScaleManager.getSettlementRadius(population);

      // Position settlements avoiding overlap
      let position: Vector3;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        const x = territory.bounds.minX + rand() * (territory.bounds.maxX - territory.bounds.minX);
        const z = territory.bounds.minZ + rand() * (territory.bounds.maxZ - territory.bounds.minZ);
        position = new Vector3(x, 0, z);

        // Check if too close to other settlements
        const tooClose = scaledSettlements.some(other => {
          const dist = Vector3.Distance(position, other.position);
          return dist < (radius + other.radius + 10); // 10 unit buffer
        });

        if (!tooClose) break;
        attempts++;
      } while (attempts < maxAttempts);

      // If couldn't find good position, use grid fallback
      if (attempts >= maxAttempts) {
        const cols = Math.ceil(Math.sqrt(settlements.length));
        const row = Math.floor(index / cols);
        const col = index % cols;

        const cellWidth = (territory.bounds.maxX - territory.bounds.minX) / cols;
        const cellHeight = (territory.bounds.maxZ - territory.bounds.minZ) / Math.ceil(settlements.length / cols);

        position = new Vector3(
          territory.bounds.minX + col * cellWidth + cellWidth / 2,
          0,
          territory.bounds.minZ + row * cellHeight + cellHeight / 2
        );
      }

      scaledSettlements.push({
        id: settlement.id,
        name: settlement.name,
        stateId: isState ? territory.id : settlement.stateId,
        countryId: !isState ? territory.id : settlement.countryId,
        position,
        radius,
        population,
        settlementType: settlement.settlementType || 'town'
      });
    });

    return scaledSettlements;
  }

  /**
   * Generate lot positions within a settlement
   */
  public generateLotPositions(
    settlement: ScaledSettlement,
    lotCount: number
  ): Vector3[] {
    const positions: Vector3[] = [];
    const rand = this.createSeededRandom(`${this.seed}_${settlement.id}_lots`);

    // Arrange in a grid with some randomization
    const cols = Math.ceil(Math.sqrt(lotCount));
    const rows = Math.ceil(lotCount / cols);

    const lotSpacing = 8; // Distance between lot centers
    const gridWidth = (cols - 1) * lotSpacing;
    const gridHeight = (rows - 1) * lotSpacing;

    for (let i = 0; i < lotCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const baseX = settlement.position.x - gridWidth / 2 + col * lotSpacing;
      const baseZ = settlement.position.z - gridHeight / 2 + row * lotSpacing;

      // Add some jitter
      const jitterX = (rand() - 0.5) * 3;
      const jitterZ = (rand() - 0.5) * 3;

      positions.push(new Vector3(
        baseX + jitterX,
        0,
        baseZ + jitterZ
      ));
    }

    return positions;
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }

    return () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  /**
   * Get settlement tier description
   */
  public static getSettlementTier(population: number): string {
    if (population < 100) return 'hamlet';
    if (population < 500) return 'village';
    if (population < 2000) return 'town';
    if (population < 10000) return 'city';
    return 'metropolis';
  }

  /**
   * Calculate recommended world size based on data
   */
  public static calculateOptimalWorldSize(data: {
    countryCount: number;
    stateCount: number;
    settlementCount: number;
  }): number {
    // Base size on largest entity count
    const maxEntities = Math.max(data.countryCount, data.stateCount / 2, data.settlementCount / 5);

    if (maxEntities <= 4) return 512;
    if (maxEntities <= 9) return 768;
    if (maxEntities <= 16) return 1024;
    if (maxEntities <= 25) return 1536;
    return 2048;
  }
}
