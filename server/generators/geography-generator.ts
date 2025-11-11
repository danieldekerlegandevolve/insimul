/**
 * Procedural Geography Generator
 * Creates towns, cities, districts, streets, and buildings
 */

import { storage } from '../db/storage';

export interface Location {
  id: string;
  name: string;
  type: 'district' | 'street' | 'building' | 'landmark';
  x: number;
  y: number;
  width?: number;
  height?: number;
  parentId?: string;
  properties: Record<string, any>;
}

export interface GeographyConfig {
  worldId: string;
  settlementId: string; // Now generates for a specific settlement
  settlementName: string;
  settlementType: 'village' | 'town' | 'city';
  population: number;
  foundedYear: number;
  terrain: 'plains' | 'hills' | 'mountains' | 'coast' | 'river' | 'forest' | 'desert';
  countryId?: string;
  stateId?: string;
}

export class GeographyGenerator {
  private locationNames = {
    districts: ['Downtown', 'Riverside', 'Hillside', 'Old Town', 'Market Quarter', 'Industrial District',
               'Residential Heights', 'West End', 'East Side', 'North Ward', 'South Gate'],
    streets: ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington St',
             'Lincoln Ave', 'Jefferson Blvd', 'Madison Way', 'Monroe Dr', 'Adams St', 'High St',
             'Park Ave', 'Church St', 'Market St', 'Mill Rd', 'Spring St', 'River Rd', 'Hill St'],
    landmarks: ['Town Square', 'Central Park', 'Old Mill', 'Clock Tower', 'Town Hall', 'Public Library',
               'Train Station', 'Post Office', 'Fire Station', 'Police Station', 'Cemetery'],
    businesses: ["General Store", "Hardware Store", "Grocery", "Pharmacy", "Diner", "Café", 
                "Restaurant", "Bakery", "Barber Shop", "Salon", "Bank", "Hotel", "Theater",
                "Bookstore", "Tailor", "Shoe Store", "Auto Repair", "Gas Station"]
  };

  /**
   * Generate complete geography for a settlement
   */
  async generate(config: GeographyConfig): Promise<{
    districts: Location[];
    streets: Location[];
    buildings: Location[];
    landmarks: Location[];
  }> {
    console.log(`🗺️  Generating geography for ${config.settlementName} (${config.settlementType}, pop: ${config.population})...`);
    
    const districts = this.generateDistricts(config);
    const streets = this.generateStreets(config, districts);
    const landmarks = this.generateLandmarks(config, districts);
    const buildings = this.generateBuildings(config, districts, streets);
    
    // Update settlement with geography
    await storage.updateSettlement(config.settlementId, {
      districts,
      streets,
      landmarks,
    });
    
    console.log(`✅ Generated ${districts.length} districts, ${streets.length} streets, ${buildings.length} buildings`);
    
    return { districts, streets, buildings, landmarks };
  }

  /**
   * Generate districts/neighborhoods
   */
  private generateDistricts(config: GeographyConfig): Location[] {
    const numDistricts = this.getDistrictCount(config.settlementType);
    const districts: Location[] = [];
    const mapSize = this.getMapSize(config.settlementType);
    
    for (let i = 0; i < numDistricts; i++) {
      const angle = (i / numDistricts) * 2 * Math.PI;
      const radius = mapSize / 3;
      
      districts.push({
        id: `district-${i}`,
        name: this.locationNames.districts[i % this.locationNames.districts.length],
        type: 'district',
        x: mapSize / 2 + Math.cos(angle) * radius,
        y: mapSize / 2 + Math.sin(angle) * radius,
        width: mapSize / 4,
        height: mapSize / 4,
        properties: {
          wealth: Math.random() * 100,
          crime: Math.random() * 50,
          established: config.foundedYear + Math.floor(Math.random() * 50)
        }
      });
    }
    
    return districts;
  }

  /**
   * Generate streets
   */
  private generateStreets(config: GeographyConfig, districts: Location[]): Location[] {
    const streetsPerDistrict = this.getStreetsPerDistrict(config.settlementType);
    const streets: Location[] = [];
    let streetIndex = 0;
    
    for (const district of districts) {
      for (let i = 0; i < streetsPerDistrict; i++) {
        const streetName = this.locationNames.streets[streetIndex % this.locationNames.streets.length];
        
        streets.push({
          id: `street-${streetIndex}`,
          name: streetName,
          type: 'street',
          x: (district.x || 0) + (Math.random() - 0.5) * (district.width || 100),
          y: (district.y || 0) + (Math.random() - 0.5) * (district.height || 100),
          parentId: district.id,
          properties: {
            length: 200 + Math.random() * 300,
            condition: Math.random() > 0.7 ? 'poor' : 'good',
            traffic: Math.random() > 0.5 ? 'high' : 'low'
          }
        });
        
        streetIndex++;
      }
    }
    
    return streets;
  }

  /**
   * Generate landmarks
   */
  private generateLandmarks(config: GeographyConfig, districts: Location[]): Location[] {
    const numLandmarks = Math.min(this.locationNames.landmarks.length, districts.length * 2);
    const landmarks: Location[] = [];
    
    for (let i = 0; i < numLandmarks; i++) {
      const district = districts[i % districts.length];
      
      landmarks.push({
        id: `landmark-${i}`,
        name: this.locationNames.landmarks[i],
        type: 'landmark',
        x: (district.x || 0) + (Math.random() - 0.5) * 50,
        y: (district.y || 0) + (Math.random() - 0.5) * 50,
        parentId: district.id,
        properties: {
          visitors: Math.floor(Math.random() * 1000),
          historical: Math.random() > 0.5,
          established: config.foundedYear + Math.floor(Math.random() * (new Date().getFullYear() - config.foundedYear))
        }
      });
    }
    
    return landmarks;
  }

  /**
   * Generate buildings (residences and businesses)
   */
  private generateBuildings(config: GeographyConfig, districts: Location[], streets: Location[]): Location[] {
    const buildingsPerStreet = this.getBuildingsPerStreet(config.settlementType);
    const buildings: Location[] = [];
    let buildingIndex = 0;
    
    for (const street of streets) {
      for (let i = 0; i < buildingsPerStreet; i++) {
        const isResidence = Math.random() > 0.3; // 70% residential
        const name = isResidence 
          ? `${Math.floor(buildingIndex / 2) + 1} ${street.name}`
          : this.locationNames.businesses[buildingIndex % this.locationNames.businesses.length];
        
        buildings.push({
          id: `building-${buildingIndex}`,
          name,
          type: 'building',
          x: (street.x || 0) + i * 20,
          y: (street.y || 0) + (Math.random() - 0.5) * 10,
          width: 15,
          height: 15,
          parentId: street.id,
          properties: {
            buildingType: isResidence ? 'residence' : 'business',
            floors: Math.floor(Math.random() * 3) + 1,
            condition: Math.random() > 0.7 ? 'poor' : Math.random() > 0.3 ? 'average' : 'excellent',
            built: config.foundedYear + Math.floor(Math.random() * 100),
            occupants: isResidence ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 10)
          }
        });
        
        buildingIndex++;
      }
    }
    
    return buildings;
  }

  /**
   * Get number of districts based on settlement type
   */
  private getDistrictCount(type: string): number {
    switch (type) {
      case 'village': return 2;
      case 'town': return 4;
      case 'city': return 8;
      default: return 4;
    }
  }

  /**
   * Get map size based on settlement type
   */
  private getMapSize(type: string): number {
    switch (type) {
      case 'village': return 500;
      case 'town': return 1000;
      case 'city': return 2000;
      default: return 1000;
    }
  }

  /**
   * Get streets per district
   */
  private getStreetsPerDistrict(type: string): number {
    switch (type) {
      case 'village': return 3;
      case 'town': return 5;
      case 'city': return 8;
      default: return 5;
    }
  }

  /**
   * Get buildings per street
   */
  private getBuildingsPerStreet(type: string): number {
    switch (type) {
      case 'village': return 5;
      case 'town': return 10;
      case 'city': return 15;
      default: return 10;
    }
  }

  /**
   * Generate a random natural feature
   */
  generateNaturalFeature(terrain: string): Location {
    const features: Record<string, string[]> = {
      plains: ['Oak Grove', 'Wheat Field', 'Prairie', 'Meadow'],
      hills: ['Rocky Hill', 'Vista Point', 'Rolling Hills', 'Highland'],
      mountains: ['Mountain Pass', 'Summit', 'Cave', 'Gorge'],
      coast: ['Beach', 'Harbor', 'Lighthouse', 'Pier'],
      river: ['River Bend', 'Bridge', 'Falls', 'Ford']
    };
    
    const names = features[terrain] || features.plains;
    const name = names[Math.floor(Math.random() * names.length)];
    
    return {
      id: `natural-${Date.now()}`,
      name,
      type: 'landmark',
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      properties: {
        natural: true,
        terrain
      }
    };
  }
}
