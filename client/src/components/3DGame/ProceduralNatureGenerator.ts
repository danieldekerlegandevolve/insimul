/**
 * Procedural Nature Generator
 *
 * Generates trees, vegetation, rocks, water features, and other natural elements
 * based on terrain type and biome.
 */

import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3, InstancedMesh, Matrix } from '@babylonjs/core';

export interface BiomeStyle {
  name: string;
  treeType: 'pine' | 'oak' | 'palm' | 'dead' | 'none';
  treeDensity: number; // 0-1
  grassColor: Color3;
  rockColor: Color3;
  hasWater: boolean;
  hasFlowers: boolean;
  flowerColors: Color3[];
}

export class ProceduralNatureGenerator {
  private scene: Scene;
  private treeMeshes: Mesh[] = [];
  private rockMeshes: Mesh[] = [];
  private vegetationMeshes: Mesh[] = [];

  // Biome presets
  private static BIOME_PRESETS: Record<string, BiomeStyle> = {
    'forest': {
      name: 'Forest',
      treeType: 'oak',
      treeDensity: 0.7,
      grassColor: new Color3(0.2, 0.5, 0.15),
      rockColor: new Color3(0.4, 0.4, 0.35),
      hasWater: true,
      hasFlowers: true,
      flowerColors: [new Color3(1, 0.3, 0.3), new Color3(1, 1, 0.4), new Color3(0.5, 0.3, 0.8)]
    },
    'plains': {
      name: 'Plains',
      treeType: 'oak',
      treeDensity: 0.2,
      grassColor: new Color3(0.3, 0.6, 0.2),
      rockColor: new Color3(0.5, 0.5, 0.45),
      hasWater: false,
      hasFlowers: true,
      flowerColors: [new Color3(1, 0.8, 0.2), new Color3(1, 1, 0.5)]
    },
    'mountains': {
      name: 'Mountains',
      treeType: 'pine',
      treeDensity: 0.3,
      grassColor: new Color3(0.25, 0.45, 0.2),
      rockColor: new Color3(0.45, 0.45, 0.5),
      hasWater: true,
      hasFlowers: false,
      flowerColors: []
    },
    'desert': {
      name: 'Desert',
      treeType: 'palm',
      treeDensity: 0.05,
      grassColor: new Color3(0.7, 0.6, 0.4),
      rockColor: new Color3(0.6, 0.5, 0.4),
      hasWater: false,
      hasFlowers: false,
      flowerColors: []
    },
    'tundra': {
      name: 'Tundra',
      treeType: 'pine',
      treeDensity: 0.15,
      grassColor: new Color3(0.5, 0.6, 0.5),
      rockColor: new Color3(0.5, 0.5, 0.55),
      hasWater: true,
      hasFlowers: false,
      flowerColors: []
    },
    'wasteland': {
      name: 'Wasteland',
      treeType: 'dead',
      treeDensity: 0.1,
      grassColor: new Color3(0.4, 0.3, 0.2),
      rockColor: new Color3(0.3, 0.3, 0.3),
      hasWater: false,
      hasFlowers: false,
      flowerColors: []
    }
  };

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Get biome style from terrain type
   */
  public static getBiomeFromTerrain(terrain?: string): BiomeStyle {
    const terr = (terrain || '').toLowerCase();

    if (terr.includes('forest') || terr.includes('wood')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['forest'];
    } else if (terr.includes('plain') || terr.includes('grass') || terr.includes('field')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['plains'];
    } else if (terr.includes('mountain') || terr.includes('hill')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['mountains'];
    } else if (terr.includes('desert') || terr.includes('sand')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['desert'];
    } else if (terr.includes('tundra') || terr.includes('snow') || terr.includes('ice')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['tundra'];
    } else if (terr.includes('waste') || terr.includes('dead')) {
      return ProceduralNatureGenerator.BIOME_PRESETS['wasteland'];
    }

    // Default
    return ProceduralNatureGenerator.BIOME_PRESETS['plains'];
  }

  /**
   * Generate trees across an area
   */
  public generateTrees(
    biome: BiomeStyle,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    avoidPositions: Vector3[] = [],
    avoidRadius: number = 15
  ): void {
    if (biome.treeType === 'none' || biome.treeDensity === 0) return;

    const area = (bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ);
    const treeCount = Math.floor((area / 100) * biome.treeDensity);

    // Create a template tree for instancing
    const templateTree = this.createTree(biome.treeType, `template_tree_${biome.treeType}`);
    templateTree.setEnabled(false);

    for (let i = 0; i < treeCount; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
      const position = new Vector3(x, 0, z);

      // Check if too close to settlements/NPCs
      const tooClose = avoidPositions.some(avoid =>
        Vector3.Distance(position, avoid) < avoidRadius
      );

      if (!tooClose) {
        const instance = templateTree.createInstance(`tree_${i}`);
        instance.position = position;
        instance.rotation.y = Math.random() * Math.PI * 2;

        // Slight variation in scale
        const scale = 0.8 + Math.random() * 0.4;
        instance.scaling = new Vector3(scale, scale, scale);

        this.treeMeshes.push(instance);
      }
    }
  }

  /**
   * Create a single tree mesh
   */
  private createTree(type: 'pine' | 'oak' | 'palm' | 'dead', name: string): Mesh {
    const parent = new Mesh(name, this.scene);

    if (type === 'pine') {
      return this.createPineTree(parent);
    } else if (type === 'oak') {
      return this.createOakTree(parent);
    } else if (type === 'palm') {
      return this.createPalmTree(parent);
    } else {
      return this.createDeadTree(parent);
    }
  }

  /**
   * Create pine tree (conical evergreen)
   */
  private createPineTree(parent: Mesh): Mesh {
    // Trunk
    const trunk = MeshBuilder.CreateCylinder(
      `${parent.name}_trunk`,
      { height: 8, diameterTop: 0.4, diameterBottom: 0.8, tessellation: 8 },
      this.scene
    );
    trunk.position.y = 4;
    trunk.parent = parent;

    const trunkMat = new StandardMaterial(`${parent.name}_trunk_mat`, this.scene);
    trunkMat.diffuseColor = new Color3(0.35, 0.25, 0.15);
    trunk.material = trunkMat;

    // Foliage (3 cones stacked)
    const foliageMat = new StandardMaterial(`${parent.name}_foliage_mat`, this.scene);
    foliageMat.diffuseColor = new Color3(0.15, 0.4, 0.15);

    for (let i = 0; i < 3; i++) {
      const cone = MeshBuilder.CreateCylinder(
        `${parent.name}_foliage_${i}`,
        { height: 4, diameterTop: 0, diameterBottom: 4 - i * 0.5, tessellation: 8 },
        this.scene
      );
      cone.position.y = 6 + i * 2.5;
      cone.parent = parent;
      cone.material = foliageMat;
    }

    return parent;
  }

  /**
   * Create oak tree (rounded canopy)
   */
  private createOakTree(parent: Mesh): Mesh {
    // Trunk
    const trunk = MeshBuilder.CreateCylinder(
      `${parent.name}_trunk`,
      { height: 6, diameterTop: 0.6, diameterBottom: 1, tessellation: 8 },
      this.scene
    );
    trunk.position.y = 3;
    trunk.parent = parent;

    const trunkMat = new StandardMaterial(`${parent.name}_trunk_mat`, this.scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.3, 0.2);
    trunk.material = trunkMat;

    // Canopy (sphere)
    const canopy = MeshBuilder.CreateSphere(
      `${parent.name}_canopy`,
      { diameter: 8, segments: 8 },
      this.scene
    );
    canopy.position.y = 8;
    canopy.parent = parent;
    canopy.scaling.y = 0.7; // Flatten slightly

    const canopyMat = new StandardMaterial(`${parent.name}_canopy_mat`, this.scene);
    canopyMat.diffuseColor = new Color3(0.2, 0.5, 0.15);
    canopy.material = canopyMat;

    return parent;
  }

  /**
   * Create palm tree
   */
  private createPalmTree(parent: Mesh): Mesh {
    // Trunk (curved)
    const trunk = MeshBuilder.CreateCylinder(
      `${parent.name}_trunk`,
      { height: 10, diameterTop: 0.4, diameterBottom: 0.6, tessellation: 8 },
      this.scene
    );
    trunk.position.y = 5;
    trunk.rotation.z = Math.PI / 16; // Slight lean
    trunk.parent = parent;

    const trunkMat = new StandardMaterial(`${parent.name}_trunk_mat`, this.scene);
    trunkMat.diffuseColor = new Color3(0.6, 0.5, 0.3);
    trunk.material = trunkMat;

    // Fronds (flat boxes radiating out)
    const frondMat = new StandardMaterial(`${parent.name}_frond_mat`, this.scene);
    frondMat.diffuseColor = new Color3(0.2, 0.6, 0.2);

    for (let i = 0; i < 8; i++) {
      const frond = MeshBuilder.CreateBox(
        `${parent.name}_frond_${i}`,
        { width: 0.5, height: 4, depth: 0.2 },
        this.scene
      );
      frond.position.y = 10;
      frond.rotation.y = (i / 8) * Math.PI * 2;
      frond.rotation.x = Math.PI / 4;
      frond.parent = parent;
      frond.material = frondMat;
    }

    return parent;
  }

  /**
   * Create dead tree
   */
  private createDeadTree(parent: Mesh): Mesh {
    // Main trunk
    const trunk = MeshBuilder.CreateCylinder(
      `${parent.name}_trunk`,
      { height: 7, diameterTop: 0.3, diameterBottom: 0.7, tessellation: 6 },
      this.scene
    );
    trunk.position.y = 3.5;
    trunk.parent = parent;

    const trunkMat = new StandardMaterial(`${parent.name}_trunk_mat`, this.scene);
    trunkMat.diffuseColor = new Color3(0.3, 0.25, 0.2);
    trunk.material = trunkMat;

    // A few bare branches
    for (let i = 0; i < 3; i++) {
      const branch = MeshBuilder.CreateCylinder(
        `${parent.name}_branch_${i}`,
        { height: 2, diameterTop: 0.1, diameterBottom: 0.2, tessellation: 4 },
        this.scene
      );
      branch.position = new Vector3(0, 5 + i * 0.5, 0);
      branch.rotation.z = Math.PI / 3 + i * 0.2;
      branch.rotation.y = (i / 3) * Math.PI * 2;
      branch.parent = parent;
      branch.material = trunkMat;
    }

    return parent;
  }

  /**
   * Generate rocks across an area
   */
  public generateRocks(
    biome: BiomeStyle,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    count: number = 20
  ): void {
    const rockMat = new StandardMaterial('rock_mat', this.scene);
    rockMat.diffuseColor = biome.rockColor;
    rockMat.specularColor = new Color3(0.1, 0.1, 0.1);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);

      // Random rock size
      const scale = 1 + Math.random() * 3;

      const rock = MeshBuilder.CreateSphere(
        `rock_${i}`,
        { diameter: scale, segments: 6 },
        this.scene
      );

      rock.position = new Vector3(x, scale / 2, z);
      rock.scaling.y = 0.6 + Math.random() * 0.3; // Flatten
      rock.scaling.x = 0.8 + Math.random() * 0.4; // Vary shape
      rock.rotation.y = Math.random() * Math.PI * 2;
      rock.material = rockMat;

      this.rockMeshes.push(rock);
    }
  }

  /**
   * Generate grass patches
   */
  public generateGrass(
    biome: BiomeStyle,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    density: number = 100
  ): void {
    const grassMat = new StandardMaterial('grass_mat', this.scene);
    grassMat.diffuseColor = biome.grassColor;
    grassMat.emissiveColor = biome.grassColor.scale(0.1);

    // Create a template grass tuft
    const grassTemplate = MeshBuilder.CreateBox(
      'grass_template',
      { width: 0.3, height: 1, depth: 0.1 },
      this.scene
    );
    grassTemplate.material = grassMat;
    grassTemplate.setEnabled(false);

    for (let i = 0; i < density; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);

      const grass = grassTemplate.createInstance(`grass_${i}`);
      grass.position = new Vector3(x, 0.5, z);
      grass.rotation.y = Math.random() * Math.PI * 2;
      grass.scaling.y = 0.7 + Math.random() * 0.6;

      this.vegetationMeshes.push(grass);
    }
  }

  /**
   * Generate flowers
   */
  public generateFlowers(
    biome: BiomeStyle,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    count: number = 50
  ): void {
    if (!biome.hasFlowers || biome.flowerColors.length === 0) return;

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);

      // Stem
      const stem = MeshBuilder.CreateCylinder(
        `flower_stem_${i}`,
        { height: 1.5, diameter: 0.1, tessellation: 4 },
        this.scene
      );
      stem.position = new Vector3(x, 0.75, z);

      const stemMat = new StandardMaterial(`flower_stem_mat_${i}`, this.scene);
      stemMat.diffuseColor = new Color3(0.2, 0.5, 0.2);
      stem.material = stemMat;

      // Flower head
      const flowerColor = biome.flowerColors[Math.floor(Math.random() * biome.flowerColors.length)];
      const flower = MeshBuilder.CreateSphere(
        `flower_${i}`,
        { diameter: 0.4, segments: 6 },
        this.scene
      );
      flower.position = new Vector3(x, 1.5, z);

      const flowerMat = new StandardMaterial(`flower_mat_${i}`, this.scene);
      flowerMat.diffuseColor = flowerColor;
      flowerMat.emissiveColor = flowerColor.scale(0.2);
      flower.material = flowerMat;

      this.vegetationMeshes.push(stem);
      this.vegetationMeshes.push(flower);
    }
  }

  /**
   * Dispose all nature elements
   */
  public dispose(): void {
    this.treeMeshes.forEach(mesh => mesh.dispose());
    this.rockMeshes.forEach(mesh => mesh.dispose());
    this.vegetationMeshes.forEach(mesh => mesh.dispose());

    this.treeMeshes = [];
    this.rockMeshes = [];
    this.vegetationMeshes = [];
  }
}
