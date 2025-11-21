/**
 * Procedural Building Generator
 *
 * Generates 3D buildings procedurally based on business/residence types,
 * population, world style, and terrain.
 */

import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3, Texture, VertexData, DynamicTexture } from '@babylonjs/core';

export interface BuildingStyle {
  name: string;
  baseColor: Color3;
  roofColor: Color3;
  windowColor: Color3;
  doorColor: Color3;
  materialType: 'wood' | 'stone' | 'brick' | 'metal' | 'glass';
  architectureStyle: 'medieval' | 'modern' | 'futuristic' | 'rustic' | 'industrial';
}

export interface BuildingSpec {
  id: string;
  type: 'business' | 'residence' | 'municipal';
  businessType?: string;
  floors: number;
  width: number;
  depth: number;
  style: BuildingStyle;
  position: Vector3;
  rotation: number;
  hasChimney?: boolean;
  hasBalcony?: boolean;
  windowCount?: { width: number; height: number };
}

export class ProceduralBuildingGenerator {
  private scene: Scene;
  private buildingMeshes: Map<string, Mesh> = new Map();

  // Building type to architecture mapping
  private static BUILDING_TYPES: Record<string, Partial<BuildingSpec>> = {
    // Businesses
    'Bakery': { floors: 2, width: 12, depth: 10, hasChimney: true },
    'Restaurant': { floors: 2, width: 15, depth: 12 },
    'Tavern': { floors: 2, width: 14, depth: 14, hasBalcony: true },
    'Inn': { floors: 3, width: 16, depth: 14, hasBalcony: true },
    'Market': { floors: 1, width: 20, depth: 15 },
    'Shop': { floors: 2, width: 10, depth: 8 },
    'Blacksmith': { floors: 1, width: 12, depth: 10, hasChimney: true },
    'LawFirm': { floors: 3, width: 12, depth: 10 },
    'Bank': { floors: 2, width: 14, depth: 12 },
    'Hospital': { floors: 3, width: 20, depth: 18 },
    'School': { floors: 2, width: 18, depth: 16 },
    'Church': { floors: 1, width: 16, depth: 24 },
    'Theater': { floors: 2, width: 18, depth: 20 },
    'Library': { floors: 3, width: 16, depth: 14 },
    'ApartmentComplex': { floors: 5, width: 18, depth: 16, hasBalcony: true },

    // Residences
    'residence_small': { floors: 1, width: 8, depth: 8 },
    'residence_medium': { floors: 2, width: 10, depth: 10, hasChimney: true },
    'residence_large': { floors: 2, width: 14, depth: 12, hasBalcony: true, hasChimney: true },
    'residence_mansion': { floors: 3, width: 20, depth: 18, hasBalcony: true, hasChimney: true },
  };

  // World style presets
  private static STYLE_PRESETS: Record<string, BuildingStyle> = {
    'medieval_wood': {
      name: 'Medieval Wood',
      baseColor: new Color3(0.55, 0.35, 0.2),
      roofColor: new Color3(0.3, 0.2, 0.15),
      windowColor: new Color3(0.9, 0.9, 0.7),
      doorColor: new Color3(0.4, 0.25, 0.15),
      materialType: 'wood',
      architectureStyle: 'medieval'
    },
    'medieval_stone': {
      name: 'Medieval Stone',
      baseColor: new Color3(0.6, 0.6, 0.55),
      roofColor: new Color3(0.35, 0.2, 0.15),
      windowColor: new Color3(0.7, 0.8, 0.9),
      doorColor: new Color3(0.3, 0.2, 0.1),
      materialType: 'stone',
      architectureStyle: 'medieval'
    },
    'modern_concrete': {
      name: 'Modern Concrete',
      baseColor: new Color3(0.7, 0.7, 0.7),
      roofColor: new Color3(0.3, 0.3, 0.3),
      windowColor: new Color3(0.6, 0.7, 0.8),
      doorColor: new Color3(0.5, 0.5, 0.5),
      materialType: 'brick',
      architectureStyle: 'modern'
    },
    'futuristic_metal': {
      name: 'Futuristic Metal',
      baseColor: new Color3(0.6, 0.65, 0.7),
      roofColor: new Color3(0.2, 0.25, 0.3),
      windowColor: new Color3(0.5, 0.7, 0.9),
      doorColor: new Color3(0.3, 0.4, 0.5),
      materialType: 'metal',
      architectureStyle: 'futuristic'
    },
    'rustic_cottage': {
      name: 'Rustic Cottage',
      baseColor: new Color3(0.7, 0.5, 0.3),
      roofColor: new Color3(0.5, 0.35, 0.2),
      windowColor: new Color3(0.8, 0.85, 0.7),
      doorColor: new Color3(0.5, 0.3, 0.2),
      materialType: 'wood',
      architectureStyle: 'rustic'
    }
  };

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Get building style based on world type and terrain
   */
  public static getStyleForWorld(worldType?: string, terrain?: string): BuildingStyle {
    const type = (worldType || '').toLowerCase();
    const terr = (terrain || '').toLowerCase();

    if (type.includes('medieval') || type.includes('fantasy')) {
      if (terr.includes('forest') || terr.includes('rural')) {
        return ProceduralBuildingGenerator.STYLE_PRESETS['medieval_wood'];
      }
      return ProceduralBuildingGenerator.STYLE_PRESETS['medieval_stone'];
    } else if (type.includes('cyberpunk') || type.includes('sci-fi') || type.includes('futuristic')) {
      return ProceduralBuildingGenerator.STYLE_PRESETS['futuristic_metal'];
    } else if (type.includes('modern')) {
      return ProceduralBuildingGenerator.STYLE_PRESETS['modern_concrete'];
    } else if (terr.includes('rural') || terr.includes('village')) {
      return ProceduralBuildingGenerator.STYLE_PRESETS['rustic_cottage'];
    }

    // Default
    return ProceduralBuildingGenerator.STYLE_PRESETS['medieval_wood'];
  }

  /**
   * Generate a building from specification
   */
  public generateBuilding(spec: BuildingSpec): Mesh {
    const parent = new Mesh(`building_${spec.id}`, this.scene);
    parent.position = spec.position.clone();
    parent.rotation.y = spec.rotation;

    // Create main building structure
    const building = this.createBuildingStructure(spec);
    building.parent = parent;

    // Add roof
    const roof = this.createRoof(spec);
    roof.parent = parent;

    // Add windows
    this.addWindows(spec, building);

    // Add door
    this.addDoor(spec, building);

    // Optional features
    if (spec.hasChimney) {
      const chimney = this.createChimney(spec);
      chimney.parent = parent;
    }

    if (spec.hasBalcony && spec.floors > 1) {
      const balcony = this.createBalcony(spec);
      balcony.parent = parent;
    }

    this.buildingMeshes.set(spec.id, parent);
    return parent;
  }

  /**
   * Create main building structure
   */
  private createBuildingStructure(spec: BuildingSpec): Mesh {
    const floorHeight = 4;
    const totalHeight = spec.floors * floorHeight;

    const building = MeshBuilder.CreateBox(
      `building_main_${spec.id}`,
      {
        width: spec.width,
        height: totalHeight,
        depth: spec.depth
      },
      this.scene
    );

    building.position.y = totalHeight / 2;

    // Create material
    const material = new StandardMaterial(`building_mat_${spec.id}`, this.scene);
    material.diffuseColor = spec.style.baseColor;
    material.specularColor = new Color3(0.1, 0.1, 0.1);

    // Add texture based on material type
    if (spec.style.materialType === 'brick') {
      material.diffuseColor = spec.style.baseColor.scale(0.9);
      // Could add brick texture here
    } else if (spec.style.materialType === 'stone') {
      material.diffuseColor = spec.style.baseColor.scale(0.95);
      // Could add stone texture here
    }

    building.material = material;
    building.checkCollisions = true;

    return building;
  }

  /**
   * Create roof
   */
  private createRoof(spec: BuildingSpec): Mesh {
    const floorHeight = 4;
    const totalHeight = spec.floors * floorHeight;
    const roofHeight = 3;

    let roof: Mesh;

    if (spec.style.architectureStyle === 'medieval' || spec.style.architectureStyle === 'rustic') {
      // Peaked roof
      roof = MeshBuilder.CreateCylinder(
        `roof_${spec.id}`,
        {
          diameterTop: 0,
          diameterBottom: Math.max(spec.width, spec.depth) * 1.2,
          height: roofHeight,
          tessellation: 4
        },
        this.scene
      );
      roof.rotation.y = Math.PI / 4;
    } else if (spec.style.architectureStyle === 'modern' || spec.style.architectureStyle === 'futuristic') {
      // Flat roof
      roof = MeshBuilder.CreateBox(
        `roof_${spec.id}`,
        {
          width: spec.width + 0.5,
          height: 0.5,
          depth: spec.depth + 0.5
        },
        this.scene
      );
    } else {
      // Pyramid roof
      roof = MeshBuilder.CreateCylinder(
        `roof_${spec.id}`,
        {
          diameterTop: 1,
          diameterBottom: Math.max(spec.width, spec.depth) * 1.1,
          height: roofHeight,
          tessellation: 6
        },
        this.scene
      );
    }

    roof.position.y = totalHeight + roofHeight / 2;

    // Roof material
    const roofMat = new StandardMaterial(`roof_mat_${spec.id}`, this.scene);
    roofMat.diffuseColor = spec.style.roofColor;
    roofMat.specularColor = Color3.Black();
    roof.material = roofMat;

    return roof;
  }

  /**
   * Add windows to building
   */
  private addWindows(spec: BuildingSpec, building: Mesh): void {
    const floorHeight = 4;
    const windowWidth = 1.5;
    const windowHeight = 2;
    const windowsPerFloor = Math.floor(spec.width / 3);

    const windowMat = new StandardMaterial(`window_mat_${spec.id}`, this.scene);
    windowMat.diffuseColor = spec.style.windowColor;
    windowMat.emissiveColor = spec.style.windowColor.scale(0.3);
    windowMat.alpha = 0.7;

    for (let floor = 0; floor < spec.floors; floor++) {
      const y = floor * floorHeight + floorHeight / 2;

      // Front windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const x = -spec.width / 2 + (i + 1) * (spec.width / (windowsPerFloor + 1));
        const window = MeshBuilder.CreatePlane(
          `window_front_${spec.id}_f${floor}_${i}`,
          { width: windowWidth, height: windowHeight },
          this.scene
        );
        window.position = new Vector3(x, y, spec.depth / 2 + 0.05);
        window.parent = building;
        window.material = windowMat;
      }

      // Back windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const x = -spec.width / 2 + (i + 1) * (spec.width / (windowsPerFloor + 1));
        const window = MeshBuilder.CreatePlane(
          `window_back_${spec.id}_f${floor}_${i}`,
          { width: windowWidth, height: windowHeight },
          this.scene
        );
        window.position = new Vector3(x, y, -spec.depth / 2 - 0.05);
        window.rotation.y = Math.PI;
        window.parent = building;
        window.material = windowMat;
      }
    }
  }

  /**
   * Add door to building
   */
  private addDoor(spec: BuildingSpec, building: Mesh): void {
    const doorWidth = 2;
    const doorHeight = 3;

    const door = MeshBuilder.CreatePlane(
      `door_${spec.id}`,
      { width: doorWidth, height: doorHeight },
      this.scene
    );

    door.position = new Vector3(0, doorHeight / 2, spec.depth / 2 + 0.06);
    door.parent = building;

    const doorMat = new StandardMaterial(`door_mat_${spec.id}`, this.scene);
    doorMat.diffuseColor = spec.style.doorColor;
    doorMat.specularColor = new Color3(0.2, 0.2, 0.2);
    door.material = doorMat;
  }

  /**
   * Create chimney
   */
  private createChimney(spec: BuildingSpec): Mesh {
    const floorHeight = 4;
    const totalHeight = spec.floors * floorHeight;
    const chimneyHeight = 5;

    const chimney = MeshBuilder.CreateBox(
      `chimney_${spec.id}`,
      { width: 1, height: chimneyHeight, depth: 1 },
      this.scene
    );

    chimney.position = new Vector3(
      spec.width / 3,
      totalHeight + chimneyHeight / 2,
      -spec.depth / 4
    );

    const chimneyMat = new StandardMaterial(`chimney_mat_${spec.id}`, this.scene);
    chimneyMat.diffuseColor = spec.style.baseColor.scale(0.7);
    chimney.material = chimneyMat;

    return chimney;
  }

  /**
   * Create balcony
   */
  private createBalcony(spec: BuildingSpec): Mesh {
    const floorHeight = 4;
    const balconyFloor = Math.floor(spec.floors / 2);
    const balconyY = balconyFloor * floorHeight;

    const balcony = MeshBuilder.CreateBox(
      `balcony_${spec.id}`,
      { width: spec.width * 0.6, height: 0.3, depth: 2 },
      this.scene
    );

    balcony.position = new Vector3(0, balconyY, spec.depth / 2 + 1);

    const balconyMat = new StandardMaterial(`balcony_mat_${spec.id}`, this.scene);
    balconyMat.diffuseColor = spec.style.baseColor.scale(0.8);
    balcony.material = balconyMat;

    return balcony;
  }

  /**
   * Generate building spec from business/residence data
   */
  public static createSpecFromData(data: {
    id: string;
    type: 'business' | 'residence';
    businessType?: string;
    position: Vector3;
    worldStyle: BuildingStyle;
    population?: number;
  }): BuildingSpec {
    const defaults = data.businessType && ProceduralBuildingGenerator.BUILDING_TYPES[data.businessType]
      || ProceduralBuildingGenerator.BUILDING_TYPES['residence_medium'];

    // Adjust size based on population for residences
    let floors = defaults.floors || 2;
    let width = defaults.width || 10;
    let depth = defaults.depth || 10;

    if (data.type === 'residence' && data.population) {
      if (data.population > 8) {
        floors = 3;
        width = 14;
        depth = 12;
      } else if (data.population > 4) {
        floors = 2;
        width = 12;
        depth = 10;
      } else {
        floors = 1;
        width = 8;
        depth = 8;
      }
    }

    return {
      id: data.id,
      type: data.type,
      businessType: data.businessType,
      floors,
      width,
      depth,
      style: data.worldStyle,
      position: data.position,
      rotation: Math.random() * Math.PI * 2,
      hasChimney: defaults.hasChimney || false,
      hasBalcony: defaults.hasBalcony || false
    };
  }

  /**
   * Dispose all buildings
   */
  public dispose(): void {
    this.buildingMeshes.forEach(mesh => mesh.dispose());
    this.buildingMeshes.clear();
  }
}
