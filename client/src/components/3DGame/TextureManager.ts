import { Scene, StandardMaterial, Texture } from "babylonjs";
import type { VisualAsset } from "@shared/schema";

/**
 * TextureManager handles loading and applying AI-generated textures
 * to Babylon.js materials in the 3D game world.
 */
export class TextureManager {
  private scene: Scene;
  private textureCache: Map<string, Texture> = new Map();
  private assetCache: Map<string, VisualAsset> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Fetch available textures for a world from the API
   */
  async fetchWorldTextures(worldId: string): Promise<VisualAsset[]> {
    try {
      const response = await fetch(`/api/worlds/${worldId}/assets?assetType=texture_ground,texture_wall,texture_material`);
      if (!response.ok) {
        throw new Error(`Failed to fetch textures: ${response.statusText}`);
      }
      const assets: VisualAsset[] = await response.json();

      // Cache the assets
      assets.forEach(asset => {
        this.assetCache.set(asset.id, asset);
      });

      return assets;
    } catch (error) {
      console.error("Error fetching world textures:", error);
      return [];
    }
  }

  /**
   * Fetch textures by specific type
   */
  async fetchTexturesByType(worldId: string, textureType: 'ground' | 'wall' | 'material'): Promise<VisualAsset[]> {
    try {
      const response = await fetch(`/api/worlds/${worldId}/assets?assetType=texture_${textureType}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${textureType} textures: ${response.statusText}`);
      }
      const assets: VisualAsset[] = await response.json();

      // Cache the assets
      assets.forEach(asset => {
        this.assetCache.set(asset.id, asset);
      });

      return assets;
    } catch (error) {
      console.error(`Error fetching ${textureType} textures:`, error);
      return [];
    }
  }

  /**
   * Load a texture from a visual asset
   */
  loadTexture(asset: VisualAsset): Texture {
    // Check cache first
    if (this.textureCache.has(asset.id)) {
      return this.textureCache.get(asset.id)!;
    }

    // Create new texture
    const texture = new Texture(`/${asset.filePath}`, this.scene);

    // Make it seamless/tileable
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;

    // Cache it
    this.textureCache.set(asset.id, texture);

    return texture;
  }

  /**
   * Load texture by asset ID
   */
  async loadTextureById(assetId: string): Promise<Texture | null> {
    try {
      // Check cache first
      if (this.textureCache.has(assetId)) {
        return this.textureCache.get(assetId)!;
      }

      // Check if we have the asset cached
      let asset = this.assetCache.get(assetId);

      // If not, fetch it
      if (!asset) {
        const response = await fetch(`/api/assets/${assetId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch asset ${assetId}`);
        }
        asset = await response.json();
        this.assetCache.set(assetId, asset);
      }

      return this.loadTexture(asset);
    } catch (error) {
      console.error(`Error loading texture ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Apply texture to ground material
   */
  applyGroundTexture(asset: VisualAsset, options?: {
    uScale?: number;
    vScale?: number;
    useBump?: boolean;
  }) {
    const groundMesh = this.scene.getMeshByName("ground");
    if (!groundMesh) {
      console.warn("Ground mesh not found");
      return;
    }

    let material = groundMesh.material as StandardMaterial;
    if (!material) {
      material = new StandardMaterial("ground-mat", this.scene);
      groundMesh.material = material;
    }

    const texture = this.loadTexture(asset);
    texture.uScale = options?.uScale ?? 8;
    texture.vScale = options?.vScale ?? 8;

    material.diffuseTexture = texture;

    // If the texture has metadata indicating it's a PBR texture, we might want to handle bump maps
    if (options?.useBump !== false) {
      // For now, keep the existing bump texture or use the same texture
      if (!material.bumpTexture) {
        const bumpTexture = texture.clone();
        if (bumpTexture) {
          bumpTexture.uScale = options?.uScale ?? 12;
          bumpTexture.vScale = options?.vScale ?? 12;
          material.bumpTexture = bumpTexture;
        }
      }
    }

    console.log(`Applied ground texture: ${asset.name}`);
  }

  /**
   * Apply texture to all settlement buildings
   */
  applySettlementTextures(asset: VisualAsset, options?: {
    uScale?: number;
    vScale?: number;
  }) {
    const settlements = this.scene.meshes.filter(mesh =>
      mesh.name.startsWith("settlement-") && mesh.name.includes("-base")
    );

    settlements.forEach(settlement => {
      let material = settlement.material as StandardMaterial;
      if (!material) {
        material = new StandardMaterial(`${settlement.name}-mat`, this.scene);
        settlement.material = material;
      }

      const texture = this.loadTexture(asset);
      texture.uScale = options?.uScale ?? 2;
      texture.vScale = options?.vScale ?? 2;

      material.diffuseTexture = texture;
    });

    console.log(`Applied settlement textures: ${asset.name} to ${settlements.length} buildings`);
  }

  /**
   * Apply texture to roads
   */
  applyRoadTexture(asset: VisualAsset, options?: {
    uScale?: number;
    vScale?: number;
  }) {
    const roads = this.scene.meshes.filter(mesh => mesh.name.startsWith("road-"));

    roads.forEach(road => {
      let material = road.material as StandardMaterial;
      if (!material) {
        material = new StandardMaterial(`${road.name}-mat`, this.scene);
        road.material = material;
      }

      const texture = this.loadTexture(asset);
      texture.uScale = options?.uScale ?? 4;
      texture.vScale = options?.vScale ?? 4;

      material.diffuseTexture = texture;
    });

    console.log(`Applied road textures: ${asset.name} to ${roads.length} roads`);
  }

  /**
   * Get cached asset by ID
   */
  getAsset(assetId: string): VisualAsset | undefined {
    return this.assetCache.get(assetId);
  }

  /**
   * Clear all cached textures and assets
   */
  clearCache() {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    this.assetCache.clear();
  }

  /**
   * Dispose of the texture manager and clean up resources
   */
  dispose() {
    this.clearCache();
  }
}
