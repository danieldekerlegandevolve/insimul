/**
 * Style Presets and Prompt Templates for Visual Asset Generation
 *
 * Provides pre-configured artistic styles and prompt modifiers for consistent
 * visual generation across worlds.
 */

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: 'fantasy' | 'scifi' | 'modern' | 'historical' | 'artistic' | 'custom';

  // Style modifiers added to prompts
  styleModifiers: string[];

  // Common negative prompts for this style
  negativePrompts: string[];

  // Recommended settings
  recommendedProvider?: 'flux' | 'stable-diffusion' | 'dalle' | 'gemini-imagen';
  recommendedQuality?: 'standard' | 'high' | 'ultra';

  // Color palette hints
  colorPalette?: string[];

  // Example image URL (optional)
  exampleImage?: string;
}

export const BUILTIN_STYLE_PRESETS: StylePreset[] = [
  // Fantasy Styles
  {
    id: 'medieval-fantasy',
    name: 'Medieval Fantasy',
    description: 'Classic high fantasy with medieval European aesthetics',
    category: 'fantasy',
    styleModifiers: [
      'medieval fantasy style',
      'dungeons and dragons aesthetic',
      'epic fantasy setting',
      'swords and sorcery theme',
      'tolkienesque atmosphere'
    ],
    negativePrompts: [
      'modern',
      'contemporary',
      'technology',
      'sci-fi',
      'futuristic'
    ],
    recommendedProvider: 'flux',
    colorPalette: ['#8B4513', '#2F4F2F', '#FFD700', '#4B0082', '#8B0000']
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    description: 'Gothic and grim fantasy with dark undertones',
    category: 'fantasy',
    styleModifiers: [
      'dark fantasy aesthetic',
      'gothic horror style',
      'grim and foreboding atmosphere',
      'dark souls inspired',
      'moody lighting, shadows'
    ],
    negativePrompts: [
      'bright',
      'cheerful',
      'colorful',
      'happy',
      'lighthearted'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#1a1a1a', '#4a0e0e', '#2d1b2e', '#1c2321', '#3d3d3d']
  },
  {
    id: 'anime-fantasy',
    name: 'Anime Fantasy',
    description: 'Japanese anime/manga style with fantasy elements',
    category: 'fantasy',
    styleModifiers: [
      'anime style',
      'manga aesthetic',
      'japanese animation inspired',
      'cel shaded',
      'vibrant colors, bold outlines'
    ],
    negativePrompts: [
      'realistic',
      'photographic',
      'western style',
      'gritty',
      'muted colors'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#FF69B4', '#87CEEB', '#FFD700', '#32CD32', '#FF4500']
  },

  // Sci-Fi Styles
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High-tech dystopian future with neon aesthetics',
    category: 'scifi',
    styleModifiers: [
      'cyberpunk aesthetic',
      'neon-lit streets',
      'futuristic dystopia',
      'high tech low life',
      'blade runner inspired'
    ],
    negativePrompts: [
      'medieval',
      'fantasy',
      'natural',
      'rustic',
      'pastoral'
    ],
    recommendedProvider: 'flux',
    colorPalette: ['#FF00FF', '#00FFFF', '#FF1493', '#7B68EE', '#1a1a1a']
  },
  {
    id: 'space-opera',
    name: 'Space Opera',
    description: 'Epic space adventure with retro-futuristic elements',
    category: 'scifi',
    styleModifiers: [
      'space opera aesthetic',
      'retro-futuristic design',
      'star wars inspired',
      'epic sci-fi setting',
      'alien worlds and technology'
    ],
    negativePrompts: [
      'medieval',
      'modern day',
      'realistic',
      'contemporary'
    ],
    recommendedProvider: 'dalle',
    colorPalette: ['#1E3A8A', '#DC2626', '#F59E0B', '#10B981', '#6366F1']
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian-era technology with brass and steam power',
    category: 'scifi',
    styleModifiers: [
      'steampunk aesthetic',
      'victorian era technology',
      'brass and copper machinery',
      'clockwork mechanisms',
      'industrial revolution styling'
    ],
    negativePrompts: [
      'modern',
      'digital',
      'sleek',
      'minimalist',
      'clean lines'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#B87333', '#8B4513', '#2F4F2F', '#DAA520', '#4a4a4a']
  },

  // Artistic Styles
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro 8-bit and 16-bit video game aesthetics',
    category: 'artistic',
    styleModifiers: [
      'pixel art style',
      '16-bit graphics',
      'retro game aesthetic',
      'low resolution, pixelated',
      'limited color palette'
    ],
    negativePrompts: [
      'high resolution',
      'photorealistic',
      'smooth',
      'detailed textures',
      '3d render'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF']
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, artistic watercolor painting style',
    category: 'artistic',
    styleModifiers: [
      'watercolor painting style',
      'soft brush strokes',
      'artistic illustration',
      'hand-painted aesthetic',
      'gentle color blending'
    ],
    negativePrompts: [
      'photorealistic',
      'digital',
      'sharp edges',
      'high contrast',
      'gritty'
    ],
    recommendedProvider: 'dalle',
    colorPalette: ['#E8F4F8', '#FFE5E5', '#FFF9E3', '#E5F5E5', '#F0E5FF']
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    description: 'Bold comic book art with dynamic panels and colors',
    category: 'artistic',
    styleModifiers: [
      'comic book style',
      'graphic novel aesthetic',
      'bold ink lines',
      'dynamic composition',
      'halftone shading'
    ],
    negativePrompts: [
      'photorealistic',
      'soft',
      'muted',
      'subtle',
      'pastel'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#FF0000', '#FFFF00', '#0000FF', '#000000', '#FFFFFF']
  },

  // Historical Styles
  {
    id: 'ancient-civilizations',
    name: 'Ancient Civilizations',
    description: 'Greek, Roman, Egyptian classical antiquity',
    category: 'historical',
    styleModifiers: [
      'ancient civilization aesthetic',
      'classical antiquity style',
      'greco-roman architecture',
      'historical accuracy',
      'ancient world atmosphere'
    ],
    negativePrompts: [
      'modern',
      'medieval',
      'futuristic',
      'fantasy elements'
    ],
    recommendedProvider: 'flux',
    colorPalette: ['#F5DEB3', '#D2691E', '#8B4513', '#FFE4B5', '#CD853F']
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    description: 'European Renaissance art and architecture',
    category: 'historical',
    styleModifiers: [
      'renaissance style',
      'classical art aesthetic',
      'italian renaissance inspired',
      'ornate and detailed',
      'historical european setting'
    ],
    negativePrompts: [
      'modern',
      'futuristic',
      'minimalist',
      'abstract'
    ],
    recommendedProvider: 'dalle',
    colorPalette: ['#8B4513', '#CD853F', '#DAA520', '#2F4F4F', '#800000']
  },

  // Modern Styles
  {
    id: 'noir',
    name: 'Film Noir',
    description: 'Black and white detective aesthetic with dramatic lighting',
    category: 'modern',
    styleModifiers: [
      'film noir aesthetic',
      'black and white photography',
      'dramatic shadows and lighting',
      '1940s detective style',
      'high contrast, moody atmosphere'
    ],
    negativePrompts: [
      'colorful',
      'bright',
      'modern',
      'digital',
      'fantasy'
    ],
    recommendedProvider: 'stable-diffusion',
    colorPalette: ['#000000', '#FFFFFF', '#808080', '#404040', '#C0C0C0']
  },
  {
    id: 'modern-realistic',
    name: 'Modern Realistic',
    description: 'Contemporary photorealistic style',
    category: 'modern',
    styleModifiers: [
      'photorealistic',
      'modern contemporary style',
      'high detail photography',
      'realistic rendering',
      'professional quality'
    ],
    negativePrompts: [
      'stylized',
      'cartoon',
      'anime',
      'painting',
      'abstract'
    ],
    recommendedProvider: 'flux',
    colorPalette: ['#2C3E50', '#ECF0F1', '#3498DB', '#E74C3C', '#95A5A6']
  }
];

/**
 * Get a style preset by ID
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return BUILTIN_STYLE_PRESETS.find(preset => preset.id === id);
}

/**
 * Get all style presets for a category
 */
export function getStylePresetsByCategory(category: StylePreset['category']): StylePreset[] {
  return BUILTIN_STYLE_PRESETS.filter(preset => preset.category === category);
}

/**
 * Apply style preset to a base prompt
 */
export function applyStylePreset(basePrompt: string, styleId: string): {
  enhancedPrompt: string;
  negativePrompt: string;
} {
  const preset = getStylePreset(styleId);

  if (!preset) {
    return {
      enhancedPrompt: basePrompt,
      negativePrompt: ''
    };
  }

  // Add style modifiers to the prompt
  const styleModifiersText = preset.styleModifiers.join(', ');
  const enhancedPrompt = `${basePrompt}, ${styleModifiersText}`;

  // Combine negative prompts
  const negativePrompt = preset.negativePrompts.join(', ');

  return {
    enhancedPrompt,
    negativePrompt
  };
}

/**
 * Negative prompt templates for common quality improvements
 */
export const NEGATIVE_PROMPT_TEMPLATES = {
  quality: 'low quality, blurry, pixelated, jpeg artifacts, compression, bad anatomy',
  unwanted: 'watermark, signature, text, logo, username, artist name',
  deformities: 'deformed, disfigured, mutated, extra limbs, missing limbs, bad proportions',
  technical: 'oversaturated, undersaturated, overexposed, underexposed, noise',
  style: 'amateur, sketch, draft, unfinished, rough',

  // Combined default
  default: 'low quality, blurry, bad anatomy, deformed, watermark, text, amateur'
};
