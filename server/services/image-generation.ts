/**
 * Image Generation Service
 *
 * Provides unified interface for generating images from text prompts
 * using various AI image generation providers (Gemini Imagen, Stable Diffusion, DALL-E, Flux)
 */

import { getGenAI, isGeminiConfigured, GEMINI_MODELS } from '../config/gemini.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import type { GenerationProvider } from '@shared/schema';

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: string;
  quality?: 'standard' | 'high' | 'ultra';
  numberOfImages?: number;
  seed?: number;
}

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface ImageGenerationResult {
  success: boolean;
  images?: GeneratedImage[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Base class for image generation providers
 */
abstract class ImageProvider {
  abstract name: GenerationProvider;
  abstract isAvailable(): Promise<boolean>;
  abstract generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
}

/**
 * Gemini Imagen Provider
 * Uses Google's Gemini API with Imagen for image generation
 */
class GeminiImagenProvider extends ImageProvider {
  name: GenerationProvider = 'gemini-imagen';

  async isAvailable(): Promise<boolean> {
    return isGeminiConfigured();
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      if (!isGeminiConfigured()) {
        return {
          success: false,
          error: 'Gemini API is not configured. Please set GEMINI_API_KEY in your environment.',
        };
      }

      const ai = getGenAI();

      // Construct enhanced prompt with style and quality parameters
      let enhancedPrompt = params.prompt;

      if (params.style) {
        enhancedPrompt = `${enhancedPrompt}, ${params.style} style`;
      }

      // Add quality modifiers
      if (params.quality === 'high' || params.quality === 'ultra') {
        enhancedPrompt = `${enhancedPrompt}, highly detailed, high quality`;
      }

      if (params.quality === 'ultra') {
        enhancedPrompt = `${enhancedPrompt}, masterpiece, professional`;
      }

      // Add negative prompt handling
      if (params.negativePrompt) {
        enhancedPrompt = `${enhancedPrompt}. Avoid: ${params.negativePrompt}`;
      }

      // Use Gemini's vision capabilities to generate images
      // Note: As of now, Gemini API primarily supports image analysis rather than generation
      // We'll use the text generation to create detailed descriptions that could be used
      // with other image generation tools, or we'll integrate when Imagen becomes available

      const response = await ai.models.generateContent({
        model: GEMINI_MODELS.PRO,
        contents: `You are an expert at creating detailed image generation prompts. Given this request: "${params.prompt}", create a highly detailed, specific image generation prompt that would produce the best possible result. Include details about composition, lighting, style, colors, and mood. Return ONLY the enhanced prompt, no explanations.`,
      });

      const enhancedPromptFromAI = response.text || enhancedPrompt;

      // For now, return metadata that includes the enhanced prompt
      // In production, this would call actual Imagen API when available
      return {
        success: false,
        error: 'Gemini Imagen is not yet available via API. Enhanced prompt generated for use with other providers.',
        metadata: {
          enhancedPrompt: enhancedPromptFromAI,
          originalPrompt: params.prompt,
          provider: 'gemini-imagen',
          note: 'Use this enhanced prompt with Stable Diffusion or other image generation services',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Gemini image generation failed: ${error.message}`,
      };
    }
  }
}

/**
 * Stable Diffusion Provider
 * Can be configured to use local installation or API (HuggingFace, Replicate, etc.)
 */
class StableDiffusionProvider extends ImageProvider {
  name: GenerationProvider = 'stable-diffusion';

  async isAvailable(): Promise<boolean> {
    // Check for Stable Diffusion API key or local installation
    return !!(process.env.STABLE_DIFFUSION_API_KEY || process.env.REPLICATE_API_KEY);
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      const apiKey = process.env.REPLICATE_API_KEY || process.env.STABLE_DIFFUSION_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'Stable Diffusion is not configured. Set REPLICATE_API_KEY or STABLE_DIFFUSION_API_KEY in your environment.',
        };
      }

      // Use Replicate API for Stable Diffusion
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt || '',
            width: params.width || 1024,
            height: params.height || 1024,
            num_outputs: params.numberOfImages || 1,
            seed: params.seed,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json();

      // Poll for completion
      let result = prediction;
      while (result.status === 'starting' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Token ${apiKey}` },
        });
        result = await pollResponse.json();
      }

      if (result.status === 'failed') {
        return {
          success: false,
          error: result.error || 'Image generation failed',
        };
      }

      // Download generated images
      const images: GeneratedImage[] = [];
      for (const url of result.output || []) {
        const imageResponse = await fetch(url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        images.push({
          data: imageBuffer,
          mimeType: 'image/png',
          width: params.width || 1024,
          height: params.height || 1024,
          metadata: { url },
        });
      }

      return {
        success: true,
        images,
        metadata: {
          provider: 'stable-diffusion',
          predictionId: result.id,
          prompt: params.prompt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Stable Diffusion generation failed: ${error.message}`,
      };
    }
  }
}

/**
 * DALL-E Provider
 * Uses OpenAI's DALL-E for image generation
 */
class DalleProvider extends ImageProvider {
  name: GenerationProvider = 'dalle';

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in your environment.',
        };
      }

      // Determine DALL-E version and size based on params
      const size = params.quality === 'ultra'
        ? '1792x1024'
        : params.quality === 'high'
          ? '1024x1024'
          : '512x512';

      const model = params.quality === 'ultra' || params.quality === 'high'
        ? 'dall-e-3'
        : 'dall-e-2';

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: params.prompt,
          n: params.numberOfImages || 1,
          size,
          quality: params.quality === 'ultra' ? 'hd' : 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();

      // Download generated images
      const images: GeneratedImage[] = [];
      for (const item of result.data || []) {
        const imageResponse = await fetch(item.url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        const [width, height] = size.split('x').map(Number);
        images.push({
          data: imageBuffer,
          mimeType: 'image/png',
          width,
          height,
          metadata: {
            url: item.url,
            revisedPrompt: item.revised_prompt,
          },
        });
      }

      return {
        success: true,
        images,
        metadata: {
          provider: 'dalle',
          model,
          prompt: params.prompt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `DALL-E generation failed: ${error.message}`,
      };
    }
  }
}

/**
 * Flux Provider
 * Uses Black Forest Labs' Flux via Replicate
 */
class FluxProvider extends ImageProvider {
  name: GenerationProvider = 'flux';

  async isAvailable(): Promise<boolean> {
    return !!process.env.REPLICATE_API_KEY;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      const apiKey = process.env.REPLICATE_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'Replicate API key is not configured. Set REPLICATE_API_KEY in your environment.',
        };
      }

      // Determine which Flux model to use based on quality
      const fluxModel = params.quality === 'ultra'
        ? 'black-forest-labs/flux-1.1-pro'
        : params.quality === 'high'
          ? 'black-forest-labs/flux-pro'
          : 'black-forest-labs/flux-schnell';

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: fluxModel,
          input: {
            prompt: params.prompt,
            width: params.width || 1024,
            height: params.height || 1024,
            num_outputs: params.numberOfImages || 1,
            seed: params.seed,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json();

      // Poll for completion
      let result = prediction;
      while (result.status === 'starting' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Token ${apiKey}` },
        });
        result = await pollResponse.json();
      }

      if (result.status === 'failed') {
        return {
          success: false,
          error: result.error || 'Image generation failed',
        };
      }

      // Download generated images
      const images: GeneratedImage[] = [];
      for (const url of result.output || []) {
        const imageResponse = await fetch(url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        images.push({
          data: imageBuffer,
          mimeType: 'image/png',
          width: params.width || 1024,
          height: params.height || 1024,
          metadata: { url },
        });
      }

      return {
        success: true,
        images,
        metadata: {
          provider: 'flux',
          model: fluxModel,
          predictionId: result.id,
          prompt: params.prompt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Flux generation failed: ${error.message}`,
      };
    }
  }
}

/**
 * Image Generation Manager
 * Manages multiple image generation providers
 */
class ImageGenerationManager {
  private providers: Map<GenerationProvider, ImageProvider>;

  constructor() {
    this.providers = new Map();
    this.registerProviders();
  }

  private registerProviders() {
    const providers = [
      new GeminiImagenProvider(),
      new StableDiffusionProvider(),
      new DalleProvider(),
      new FluxProvider(),
    ];

    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }
  }

  async getAvailableProviders(): Promise<GenerationProvider[]> {
    const available: GenerationProvider[] = [];

    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }

    return available;
  }

  async generateImage(
    provider: GenerationProvider,
    params: ImageGenerationParams
  ): Promise<ImageGenerationResult> {
    const imageProvider = this.providers.get(provider);

    if (!imageProvider) {
      return {
        success: false,
        error: `Unknown provider: ${provider}`,
      };
    }

    if (!(await imageProvider.isAvailable())) {
      return {
        success: false,
        error: `Provider ${provider} is not available. Check API key configuration.`,
      };
    }

    return imageProvider.generateImage(params);
  }

  /**
   * Save generated image to disk
   */
  async saveImage(
    image: GeneratedImage,
    fileName: string,
    outputDir: string = 'client/public/assets/generated'
  ): Promise<string> {
    const fullPath = join(process.cwd(), outputDir);

    // Ensure directory exists
    if (!existsSync(fullPath)) {
      await mkdir(fullPath, { recursive: true });
    }

    const filePath = join(fullPath, fileName);
    await writeFile(filePath, image.data);

    // Return relative path from public directory
    return join('assets/generated', fileName);
  }
}

// Export singleton instance
export const imageGenerator = new ImageGenerationManager();

// Export types and classes
export { ImageGenerationManager, ImageProvider };
