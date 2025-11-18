/**
 * Visual Asset Generator Service
 *
 * High-level service for generating visual assets for game entities
 * (characters, buildings, maps, textures, etc.)
 */

import { storage } from '../db/storage.js';
import { imageGenerator, type ImageGenerationParams } from './image-generation.js';
import { nanoid } from 'nanoid';
import type {
  GenerationProvider,
  AssetType,
  Character,
  Business,
  Settlement,
  Country,
  InsertVisualAsset,
  InsertGenerationJob,
} from '@shared/schema';

/**
 * Generate a detailed prompt for a character portrait
 */
export function generateCharacterPrompt(character: Character, worldContext?: string): string {
  const parts: string[] = [];

  // Basic description
  parts.push(`A ${character.gender} person`);

  // Add personality-based appearance hints
  const personality = character.personality as any;
  if (personality) {
    if (personality.extroversion > 0.5) {
      parts.push('with a warm, inviting expression');
    } else if (personality.extroversion < -0.5) {
      parts.push('with a reserved, contemplative demeanor');
    }

    if (personality.conscientiousness > 0.5) {
      parts.push('well-groomed, professional appearance');
    }

    if (personality.openness > 0.5) {
      parts.push('with creative, artistic styling');
    }
  }

  // Add occupation-based details
  if (character.occupation) {
    parts.push(`working as a ${character.occupation}`);
  }

  // Add physical traits if available
  const physicalTraits = character.physicalTraits as any;
  if (physicalTraits) {
    if (physicalTraits.hairColor) parts.push(`${physicalTraits.hairColor} hair`);
    if (physicalTraits.eyeColor) parts.push(`${physicalTraits.eyeColor} eyes`);
    if (physicalTraits.height) {
      const heightDesc = physicalTraits.height > 180 ? 'tall' : physicalTraits.height < 160 ? 'short' : 'average height';
      parts.push(heightDesc);
    }
  }

  // Add world context for styling
  if (worldContext) {
    parts.push(`in a ${worldContext} setting`);
  }

  // Technical specs for good portrait
  parts.push('portrait photography, professional lighting, detailed face, high quality');

  return parts.join(', ');
}

/**
 * Generate a detailed prompt for a building
 */
export function generateBuildingPrompt(business: Business, settlement?: Settlement): string {
  const parts: string[] = [];

  // Building type
  const businessType = business.businessType.toLowerCase().replace(/([A-Z])/g, ' $1').trim();
  parts.push(`A ${businessType} building`);

  // Architecture style based on settlement or era
  if (settlement) {
    const foundedYear = settlement.foundedYear || 1900;
    if (foundedYear < 1800) {
      parts.push('medieval architecture');
    } else if (foundedYear < 1900) {
      parts.push('Victorian-era architecture');
    } else if (foundedYear < 1950) {
      parts.push('early 20th century architecture');
    } else {
      parts.push('modern architecture');
    }

    // Terrain influences
    if (settlement.terrain) {
      parts.push(`built in ${settlement.terrain} terrain`);
    }
  }

  // Add business name if it's evocative
  if (business.name) {
    parts.push(`named "${business.name}"`);
  }

  // Technical specs
  parts.push('exterior view, architectural photography, detailed, high quality');

  return parts.join(', ');
}

/**
 * Generate a detailed prompt for a map
 */
export function generateMapPrompt(
  settlement: Settlement,
  mapType: 'terrain' | 'political' | 'region' = 'terrain'
): string {
  const parts: string[] = [];

  if (mapType === 'terrain') {
    parts.push('Fantasy map illustration');
    if (settlement.terrain) {
      parts.push(`showing ${settlement.terrain} terrain`);
    }
    parts.push('with geographical features, rivers, forests, mountains');
  } else if (mapType === 'political') {
    parts.push('Political map');
    parts.push('showing districts, boundaries, major landmarks');
  } else {
    parts.push('Regional overview map');
  }

  parts.push(`of ${settlement.name}`);
  parts.push('cartography style, aged parchment, detailed, hand-drawn aesthetic');

  return parts.join(', ');
}

/**
 * Generate a prompt for procedural textures
 */
export function generateTexturePrompt(
  textureType: 'ground' | 'wall' | 'material',
  material: string,
  style?: string
): string {
  const parts: string[] = [];

  parts.push(`Seamless tileable ${material} ${textureType} texture`);

  if (style) {
    parts.push(`${style} style`);
  }

  parts.push('high resolution, PBR ready, detailed, repeating pattern');
  parts.push('viewed from directly above, flat lighting for texture mapping');

  return parts.join(', ');
}

/**
 * Asset Generation Service
 */
export class VisualAssetGeneratorService {
  /**
   * Generate a character portrait
   */
  async generateCharacterPortrait(
    characterId: string,
    provider: GenerationProvider,
    params?: Partial<ImageGenerationParams>
  ): Promise<string> {
    // Get character data
    const character = await storage.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Get world context
    let worldContext = 'fantasy';
    if (character.worldId) {
      const world = await storage.getWorld(character.worldId);
      if (world?.description) {
        worldContext = world.description;
      }
    }

    // Generate prompt
    const prompt = generateCharacterPrompt(character, worldContext);

    // Create generation job
    const job = await storage.createGenerationJob({
      worldId: character.worldId,
      jobType: 'single_asset',
      assetType: 'character_portrait',
      targetEntityId: characterId,
      targetEntityType: 'character',
      prompt,
      generationProvider: provider,
      generationParams: params || {},
      batchSize: 1,
      status: 'processing',
    });

    // Generate image
    const result = await imageGenerator.generateImage(provider, {
      prompt,
      width: 512,
      height: 512,
      quality: 'high',
      ...params,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      // Update job as failed
      await storage.updateGenerationJob(job.id, {
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
        completedAt: new Date(),
      });
      throw new Error(result.error || 'Image generation failed');
    }

    // Save image to disk
    const image = result.images[0];
    const fileName = `character-${characterId}-${nanoid(10)}.png`;
    const relativePath = await imageGenerator.saveImage(image, fileName);

    // Create visual asset record
    const asset = await storage.createVisualAsset({
      worldId: character.worldId,
      name: `${character.firstName} ${character.lastName} Portrait`,
      description: `Portrait of ${character.firstName} ${character.lastName}`,
      assetType: 'character_portrait',
      characterId: character.id,
      filePath: relativePath,
      fileName,
      fileSize: image.data.length,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      generationProvider: provider,
      generationPrompt: prompt,
      generationParams: params || {},
      purpose: 'authorial',
      usageContext: '2d_ui',
      tags: ['character', 'portrait', character.occupation || 'civilian'].filter(Boolean) as string[],
      status: 'completed',
    });

    // Update job as completed
    await storage.updateGenerationJob(job.id, {
      status: 'completed',
      progress: 1.0,
      completedCount: 1,
      generatedAssetIds: [asset.id],
      completedAt: new Date(),
    });

    return asset.id;
  }

  /**
   * Generate a building exterior image
   */
  async generateBuildingExterior(
    businessId: string,
    provider: GenerationProvider,
    params?: Partial<ImageGenerationParams>
  ): Promise<string> {
    const business = await storage.getBusiness(businessId);
    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    // Get settlement context
    let settlement;
    if (business.settlementId) {
      settlement = await storage.getSettlement(business.settlementId);
    }

    const prompt = generateBuildingPrompt(business, settlement);

    // Create generation job
    const job = await storage.createGenerationJob({
      worldId: business.worldId,
      jobType: 'single_asset',
      assetType: 'building_exterior',
      targetEntityId: businessId,
      targetEntityType: 'business',
      prompt,
      generationProvider: provider,
      generationParams: params || {},
      batchSize: 1,
      status: 'processing',
    });

    const result = await imageGenerator.generateImage(provider, {
      prompt,
      width: 768,
      height: 512,
      quality: 'high',
      ...params,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      await storage.updateGenerationJob(job.id, {
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
        completedAt: new Date(),
      });
      throw new Error(result.error || 'Image generation failed');
    }

    const image = result.images[0];
    const fileName = `building-${businessId}-${nanoid(10)}.png`;
    const relativePath = await imageGenerator.saveImage(image, fileName);

    const asset = await storage.createVisualAsset({
      worldId: business.worldId,
      name: `${business.name} Exterior`,
      description: `Exterior view of ${business.name}`,
      assetType: 'building_exterior',
      businessId: business.id,
      filePath: relativePath,
      fileName,
      fileSize: image.data.length,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      generationProvider: provider,
      generationPrompt: prompt,
      generationParams: params || {},
      purpose: 'authorial',
      usageContext: '2d_ui',
      tags: ['building', business.businessType, 'exterior'],
      status: 'completed',
    });

    await storage.updateGenerationJob(job.id, {
      status: 'completed',
      progress: 1.0,
      completedCount: 1,
      generatedAssetIds: [asset.id],
      completedAt: new Date(),
    });

    return asset.id;
  }

  /**
   * Generate a settlement map
   */
  async generateSettlementMap(
    settlementId: string,
    mapType: 'terrain' | 'political' | 'region',
    provider: GenerationProvider,
    params?: Partial<ImageGenerationParams>
  ): Promise<string> {
    const settlement = await storage.getSettlement(settlementId);
    if (!settlement) {
      throw new Error(`Settlement ${settlementId} not found`);
    }

    const prompt = generateMapPrompt(settlement, mapType);

    const job = await storage.createGenerationJob({
      worldId: settlement.worldId,
      jobType: 'single_asset',
      assetType: `map_${mapType}` as AssetType,
      targetEntityId: settlementId,
      targetEntityType: 'settlement',
      prompt,
      generationProvider: provider,
      generationParams: params || {},
      batchSize: 1,
      status: 'processing',
    });

    const result = await imageGenerator.generateImage(provider, {
      prompt,
      width: 1024,
      height: 768,
      quality: 'high',
      ...params,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      await storage.updateGenerationJob(job.id, {
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
        completedAt: new Date(),
      });
      throw new Error(result.error || 'Image generation failed');
    }

    const image = result.images[0];
    const fileName = `map-${settlementId}-${mapType}-${nanoid(10)}.png`;
    const relativePath = await imageGenerator.saveImage(image, fileName);

    const asset = await storage.createVisualAsset({
      worldId: settlement.worldId,
      name: `${settlement.name} ${mapType} Map`,
      description: `${mapType} map of ${settlement.name}`,
      assetType: `map_${mapType}` as AssetType,
      settlementId: settlement.id,
      filePath: relativePath,
      fileName,
      fileSize: image.data.length,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      generationProvider: provider,
      generationPrompt: prompt,
      generationParams: params || {},
      purpose: 'authorial',
      usageContext: 'map_display',
      tags: ['map', mapType, settlement.settlementType],
      status: 'completed',
    });

    await storage.updateGenerationJob(job.id, {
      status: 'completed',
      progress: 1.0,
      completedCount: 1,
      generatedAssetIds: [asset.id],
      completedAt: new Date(),
    });

    return asset.id;
  }

  /**
   * Generate procedural textures for 3D environments
   */
  async generateTexture(
    worldId: string,
    textureType: 'ground' | 'wall' | 'material',
    material: string,
    provider: GenerationProvider,
    style?: string,
    params?: Partial<ImageGenerationParams>
  ): Promise<string> {
    const prompt = generateTexturePrompt(textureType, material, style);

    const job = await storage.createGenerationJob({
      worldId,
      jobType: 'single_asset',
      assetType: `texture_${textureType}` as AssetType,
      prompt,
      generationProvider: provider,
      generationParams: params || {},
      batchSize: 1,
      status: 'processing',
    });

    const result = await imageGenerator.generateImage(provider, {
      prompt,
      width: 1024,
      height: 1024,
      quality: 'high',
      ...params,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      await storage.updateGenerationJob(job.id, {
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
        completedAt: new Date(),
      });
      throw new Error(result.error || 'Image generation failed');
    }

    const image = result.images[0];
    const fileName = `texture-${textureType}-${material.replace(/\s+/g, '-')}-${nanoid(10)}.png`;
    const relativePath = await imageGenerator.saveImage(image, fileName);

    const asset = await storage.createVisualAsset({
      worldId,
      name: `${material} ${textureType} Texture`,
      description: `Seamless ${material} texture for ${textureType}`,
      assetType: `texture_${textureType}` as AssetType,
      filePath: relativePath,
      fileName,
      fileSize: image.data.length,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      generationProvider: provider,
      generationPrompt: prompt,
      generationParams: params || {},
      purpose: 'procedural',
      usageContext: '3d_game',
      tags: ['texture', textureType, material, style || 'realistic'].filter(Boolean) as string[],
      status: 'completed',
    });

    await storage.updateGenerationJob(job.id, {
      status: 'completed',
      progress: 1.0,
      completedCount: 1,
      generatedAssetIds: [asset.id],
      completedAt: new Date(),
    });

    return asset.id;
  }

  /**
   * Batch generate character portraits for all characters in a world
   */
  async batchGenerateCharacterPortraits(
    worldId: string,
    provider: GenerationProvider,
    params?: Partial<ImageGenerationParams>
  ): Promise<string[]> {
    const characters = await storage.getCharacters(worldId);

    const job = await storage.createGenerationJob({
      worldId,
      jobType: 'batch_generation',
      assetType: 'character_portrait',
      prompt: `Batch generate portraits for ${characters.length} characters`,
      generationProvider: provider,
      generationParams: params || {},
      batchSize: characters.length,
      status: 'processing',
    });

    const assetIds: string[] = [];
    let completed = 0;

    for (const character of characters) {
      try {
        const assetId = await this.generateCharacterPortrait(character.id, provider, params);
        assetIds.push(assetId);
        completed++;

        // Update progress
        await storage.updateGenerationJob(job.id, {
          progress: completed / characters.length,
          completedCount: completed,
        });
      } catch (error) {
        console.error(`Failed to generate portrait for character ${character.id}:`, error);
      }
    }

    await storage.updateGenerationJob(job.id, {
      status: 'completed',
      progress: 1.0,
      completedCount: completed,
      generatedAssetIds: assetIds,
      completedAt: new Date(),
    });

    return assetIds;
  }

  /**
   * Get all visual assets for an entity
   */
  async getEntityAssets(
    entityId: string,
    entityType: 'character' | 'business' | 'settlement' | 'country' | 'state'
  ) {
    return storage.getVisualAssetsByEntity(entityId, entityType);
  }

  /**
   * Get generation job status
   */
  async getJobStatus(jobId: string) {
    return storage.getGenerationJob(jobId);
  }
}

// Export singleton
export const visualAssetGenerator = new VisualAssetGeneratorService();
