/**
 * Physical Appearance System
 * 
 * Implements facial features, inheritance, and attraction mechanics.
 * Based on Talk of the Town's face.py system.
 * 
 * Features:
 * - Facial feature generation (eyes, hair, skin, nose, mouth, etc.)
 * - Genetic inheritance from parents
 * - Attraction based on appearance
 * - Age-based changes (gray hair, wrinkles)
 * - Distinctive features (freckles, scars, etc.)
 * 
 * TotT References:
 * - face.py lines 1-335 (complete Face system)
 * - appearance.py attraction mechanics
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface Feature {
  value: string;                    // e.g., 'blue', 'brown', 'tall', 'short'
  variantId: number;               // 0-999, for graphical variation
  inheritedFrom: string | null;    // Character ID
  exactVariantInherited: boolean;  // True if exact appearance inherited
}

export interface Appearance {
  // Skin
  skinColor: Feature;
  
  // Head
  headSize: Feature;
  headShape: Feature;
  
  // Hair
  hairLength: Feature;
  hairColor: Feature;
  hairStyle: Feature;
  
  // Face
  eyebrowSize: Feature;
  eyebrowColor: Feature;
  eyeSize: Feature;
  eyeShape: Feature;
  eyeColor: Feature;
  eyeHorizontalSettedness: Feature;
  eyeVerticalSettedness: Feature;
  
  earSize: Feature;
  earAngle: Feature;
  
  noseSize: Feature;
  noseShape: Feature;
  
  mouthSize: Feature;
  mouthShape: Feature;
  
  // Facial hair (mostly for males)
  facialHairStyle: Feature;
  
  // Distinctive features
  freckles: Feature;
  birthmark: Feature;
  scar: Feature;
  tattoo: Feature;  // From experience, not genetics
  glasses: Feature; // From need, not genetics
  
  // Age-based
  wrinkles: Feature;
  
  // Overall attractiveness (calculated)
  attractiveness: number; // 0-1
}

// Feature distributions (simplified from TotT's config)
const FEATURE_DISTRIBUTIONS = {
  skinColor: {
    male: [
      [[0.0, 0.3], 'pale'],
      [[0.3, 0.6], 'fair'],
      [[0.6, 0.8], 'olive'],
      [[0.8, 0.9], 'tan'],
      [[0.9, 1.0], 'dark']
    ],
    female: [
      [[0.0, 0.3], 'pale'],
      [[0.3, 0.6], 'fair'],
      [[0.6, 0.8], 'olive'],
      [[0.8, 0.9], 'tan'],
      [[0.9, 1.0], 'dark']
    ]
  },
  hairColor: {
    male: [
      [[0.0, 0.15], 'black'],
      [[0.15, 0.4], 'dark brown'],
      [[0.4, 0.65], 'brown'],
      [[0.65, 0.8], 'light brown'],
      [[0.8, 0.9], 'blonde'],
      [[0.9, 0.95], 'red'],
      [[0.95, 1.0], 'auburn']
    ],
    female: [
      [[0.0, 0.15], 'black'],
      [[0.15, 0.4], 'dark brown'],
      [[0.4, 0.65], 'brown'],
      [[0.65, 0.8], 'light brown'],
      [[0.8, 0.9], 'blonde'],
      [[0.9, 0.95], 'red'],
      [[0.95, 1.0], 'auburn']
    ]
  },
  eyeColor: {
    male: [
      [[0.0, 0.3], 'brown'],
      [[0.3, 0.5], 'hazel'],
      [[0.5, 0.7], 'green'],
      [[0.7, 0.9], 'blue'],
      [[0.9, 1.0], 'gray']
    ],
    female: [
      [[0.0, 0.3], 'brown'],
      [[0.3, 0.5], 'hazel'],
      [[0.5, 0.7], 'green'],
      [[0.7, 0.9], 'blue'],
      [[0.9, 1.0], 'gray']
    ]
  },
  hairLength: {
    male: [
      [[0.0, 0.3], 'short'],
      [[0.3, 0.6], 'medium'],
      [[0.6, 0.8], 'long'],
      [[0.8, 0.9], 'very long'],
      [[0.9, 1.0], 'bald']
    ],
    female: [
      [[0.0, 0.2], 'short'],
      [[0.2, 0.5], 'medium'],
      [[0.5, 0.8], 'long'],
      [[0.8, 1.0], 'very long']
    ]
  },
  size: [  // Generic size distribution
    [[0.0, 0.2], 'very small'],
    [[0.2, 0.4], 'small'],
    [[0.4, 0.6], 'average'],
    [[0.6, 0.8], 'large'],
    [[0.8, 1.0], 'very large']
  ],
  shape: [  // Generic shape distribution
    [[0.0, 0.25], 'narrow'],
    [[0.25, 0.5], 'oval'],
    [[0.5, 0.75], 'round'],
    [[0.75, 1.0], 'wide']
  ]
};

// Heritability rates (how likely features are inherited)
const HERITABILITY = {
  skinColor: 1.0,    // Always inherited
  hairColor: 0.9,
  eyeColor: 0.85,
  noseShape: 0.8,
  eyeShape: 0.75,
  mouthShape: 0.7,
  headShape: 0.7,
  earShape: 0.65,
  hairLength: 0.3,   // More cultural than genetic
  facialHair: 0.4
};

// ============================================================================
// CORE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate appearance for a new character
 */
export function generateAppearance(
  gender: 'male' | 'female',
  mother?: Character,
  father?: Character,
  age: number = 20
): Appearance {
  const appearance: Appearance = {
    // Generate all features
    skinColor: generateFeature('skinColor', gender, mother, father),
    headSize: generateFeature('headSize', gender, mother, father),
    headShape: generateFeature('headShape', gender, mother, father),
    hairLength: generateFeature('hairLength', gender, mother, father),
    hairColor: generateFeature('hairColor', gender, mother, father, age),
    hairStyle: generateFeature('hairStyle', gender, mother, father),
    eyebrowSize: generateFeature('eyebrowSize', gender, mother, father),
    eyebrowColor: generateFeature('eyebrowColor', gender, mother, father),
    eyeSize: generateFeature('eyeSize', gender, mother, father),
    eyeShape: generateFeature('eyeShape', gender, mother, father),
    eyeColor: generateFeature('eyeColor', gender, mother, father),
    eyeHorizontalSettedness: generateFeature('eyeHorizontalSettedness', gender, mother, father),
    eyeVerticalSettedness: generateFeature('eyeVerticalSettedness', gender, mother, father),
    earSize: generateFeature('earSize', gender, mother, father),
    earAngle: generateFeature('earAngle', gender, mother, father),
    noseSize: generateFeature('noseSize', gender, mother, father),
    noseShape: generateFeature('noseShape', gender, mother, father),
    mouthSize: generateFeature('mouthSize', gender, mother, father),
    mouthShape: generateFeature('mouthShape', gender, mother, father),
    facialHairStyle: generateFeature('facialHairStyle', gender, mother, father),
    freckles: generateFeature('freckles', gender, mother, father),
    birthmark: generateFeature('birthmark', gender, mother, father),
    scar: { value: 'none', variantId: 0, inheritedFrom: null, exactVariantInherited: false },
    tattoo: { value: 'none', variantId: 0, inheritedFrom: null, exactVariantInherited: false },
    glasses: { value: 'none', variantId: 0, inheritedFrom: null, exactVariantInherited: false },
    wrinkles: generateWrinkles(age),
    attractiveness: 0  // Calculated after
  };
  
  // Calculate attractiveness
  appearance.attractiveness = calculateAttractiveness(appearance, gender);
  
  return appearance;
}

/**
 * Generate a single feature with inheritance
 */
function generateFeature(
  featureType: string,
  gender: 'male' | 'female',
  mother?: Character,
  father?: Character,
  age?: number
): Feature {
  // Check if feature should be inherited
  const heritability = HERITABILITY[featureType as keyof typeof HERITABILITY] || 0.5;
  
  if (mother && father && Math.random() < heritability) {
    // Inherit from parent
    return inheritFeature(featureType, gender, mother, father);
  } else {
    // Generate from population distribution
    return generateFromDistribution(featureType, gender, age);
  }
}

/**
 * Inherit feature from parents
 */
function inheritFeature(
  featureType: string,
  gender: 'male' | 'female',
  mother: Character,
  father: Character
): Feature {
  // Determine which parent to inherit from
  // Some features more likely from same-sex parent
  const sameGenderBias = ['facialHairStyle', 'hairLength'].includes(featureType) ? 0.7 : 0.5;
  
  let source: Character;
  if (Math.random() < sameGenderBias) {
    source = gender === 'male' ? father : mother;
  } else {
    source = Math.random() < 0.5 ? mother : father;
  }
  
  // Get feature from parent
  const parentAppearance = (source as any).customData?.appearance as Appearance | undefined;
  if (!parentAppearance) {
    // Parent has no appearance data, generate randomly
    return generateFromDistribution(featureType, gender);
  }
  
  // Get the specific feature
  const parentFeature = getFeatureByType(parentAppearance, featureType);
  
  // Inherit with possible variation
  const exactInheritance = Math.random() < 0.7; // 70% chance of exact variant
  
  return {
    value: parentFeature.value,
    variantId: exactInheritance ? parentFeature.variantId : Math.floor(Math.random() * 1000),
    inheritedFrom: source.id,
    exactVariantInherited: exactInheritance
  };
}

/**
 * Generate feature from population distribution
 */
function generateFromDistribution(
  featureType: string,
  gender: 'male' | 'female',
  age?: number
): Feature {
  // Handle age-based hair color (gray hair)
  if (featureType === 'hairColor' && age && age > 50) {
    if (Math.random() < (age - 50) / 50) {  // Increasing chance with age
      return {
        value: age > 70 ? 'white' : 'gray',
        variantId: Math.floor(Math.random() * 1000),
        inheritedFrom: null,
        exactVariantInherited: false
      };
    }
  }
  
  // Get distribution
  let distribution: any;
  if (featureType in FEATURE_DISTRIBUTIONS) {
    const dist = FEATURE_DISTRIBUTIONS[featureType as keyof typeof FEATURE_DISTRIBUTIONS];
    distribution = (dist as any)[gender] || dist;
  } else {
    // Use generic distributions
    if (featureType.includes('Size')) {
      distribution = FEATURE_DISTRIBUTIONS.size;
    } else if (featureType.includes('Shape')) {
      distribution = FEATURE_DISTRIBUTIONS.shape;
    } else {
      // Default to simple distribution
      distribution = [
        [[0.0, 0.5], 'average'],
        [[0.5, 1.0], 'notable']
      ];
    }
  }
  
  // Select from distribution
  const roll = Math.random();
  const selected = distribution.find((entry: any) => {
    const [range] = entry;
    return roll >= range[0] && roll < range[1];
  });
  
  const value = selected ? selected[1] : 'average';
  
  return {
    value,
    variantId: Math.floor(Math.random() * 1000),
    inheritedFrom: null,
    exactVariantInherited: false
  };
}

/**
 * Get feature by type from appearance
 */
function getFeatureByType(appearance: Appearance, featureType: string): Feature {
  const featureMap: Record<string, keyof Appearance> = {
    skinColor: 'skinColor',
    headSize: 'headSize',
    headShape: 'headShape',
    hairLength: 'hairLength',
    hairColor: 'hairColor',
    hairStyle: 'hairStyle',
    eyebrowSize: 'eyebrowSize',
    eyebrowColor: 'eyebrowColor',
    eyeSize: 'eyeSize',
    eyeShape: 'eyeShape',
    eyeColor: 'eyeColor',
    noseSize: 'noseSize',
    noseShape: 'noseShape',
    mouthSize: 'mouthSize',
    mouthShape: 'mouthShape',
    facialHairStyle: 'facialHairStyle'
  };
  
  const key = featureMap[featureType] || 'hairColor';
  return appearance[key] as Feature;
}

/**
 * Generate age-based wrinkles
 */
function generateWrinkles(age: number): Feature {
  let value = 'none';
  if (age > 30) value = 'minimal';
  if (age > 45) value = 'noticeable';
  if (age > 60) value = 'prominent';
  if (age > 75) value = 'heavy';
  
  return {
    value,
    variantId: Math.floor(Math.random() * 1000),
    inheritedFrom: null,
    exactVariantInherited: false
  };
}

// ============================================================================
// ATTRACTION CALCULATION
// ============================================================================

/**
 * Calculate overall attractiveness score
 * Based on feature symmetry, conventional beauty standards, and variation
 */
function calculateAttractiveness(appearance: Appearance, gender: 'male' | 'female'): number {
  let score = 0.5; // Base 50%
  
  // Eye symmetry bonus
  if (appearance.eyeHorizontalSettedness.value === 'average') score += 0.1;
  if (appearance.eyeVerticalSettedness.value === 'average') score += 0.1;
  
  // Feature proportions
  if (appearance.eyeSize.value === 'average' || appearance.eyeSize.value === 'large') score += 0.05;
  if (appearance.noseSize.value === 'average' || appearance.noseSize.value === 'small') score += 0.05;
  if (appearance.mouthSize.value === 'average') score += 0.05;
  
  // Hair
  if (appearance.hairLength.value !== 'bald') score += 0.05;
  
  // Eye color (rare colors slight bonus)
  if (['green', 'gray'].includes(appearance.eyeColor.value)) score += 0.03;
  
  // Distinctive features (can be attractive or not)
  if (appearance.freckles.value === 'light') score += 0.03;
  if (appearance.freckles.value === 'heavy') score -= 0.02;
  if (appearance.birthmark.value === 'prominent') score -= 0.05;
  if (appearance.scar.value === 'prominent') score -= 0.05;
  
  // Facial hair (gender-specific)
  if (gender === 'male' && appearance.facialHairStyle.value === 'well-groomed') score += 0.05;
  
  // Random variation (genetics are complex)
  score += (Math.random() - 0.5) * 0.2; // ±10%
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate attraction between two characters based on appearance
 */
export function calculatePhysicalAttraction(
  character1Appearance: Appearance,
  character2Appearance: Appearance
): number {
  // Base attraction from attractiveness scores
  let attraction = (character1Appearance.attractiveness + character2Appearance.attractiveness) / 2;
  
  // Feature preferences (simplified)
  // People tend to be attracted to different or similar features
  
  // Eye color attraction (opposites or same can be attractive)
  if (character1Appearance.eyeColor.value === character2Appearance.eyeColor.value) {
    attraction += 0.05; // Similarity bonus
  }
  
  // Hair color (variety bonus)
  if (character1Appearance.hairColor.value !== character2Appearance.hairColor.value) {
    attraction += 0.03;
  }
  
  // Facial symmetry preference
  const hasSymmetricalFeatures = (
    character2Appearance.eyeHorizontalSettedness.value === 'average' &&
    character2Appearance.eyeVerticalSettedness.value === 'average'
  );
  if (hasSymmetricalFeatures) attraction += 0.05;
  
  // Random personal preference
  attraction += (Math.random() - 0.5) * 0.15;
  
  return Math.max(0, Math.min(1, attraction));
}

// ============================================================================
// AGE-BASED CHANGES
// ============================================================================

/**
 * Update appearance for aging
 */
export function updateAppearanceForAge(
  appearance: Appearance,
  newAge: number
): Appearance {
  const updated = { ...appearance };
  
  // Gray/white hair
  if (newAge > 50) {
    const grayChance = (newAge - 50) / 50; // 0 at 50, 1 at 100
    if (Math.random() < grayChance && !['gray', 'white'].includes(updated.hairColor.value)) {
      updated.hairColor = {
        ...updated.hairColor,
        value: newAge > 70 ? 'white' : 'gray'
      };
    }
  }
  
  // Hair loss (males more prone)
  if (newAge > 40 && updated.hairLength.value !== 'bald') {
    const baldChance = (newAge - 40) / 80; // Gradual increase
    if (Math.random() < baldChance * 0.3) { // 30% of males eventually
      updated.hairLength = {
        ...updated.hairLength,
        value: 'bald'
      };
    }
  }
  
  // Wrinkles
  updated.wrinkles = generateWrinkles(newAge);
  
  // Slight attractiveness decline with age (aging)
  const ageFactor = Math.max(0.7, 1 - ((newAge - 20) / 100));
  updated.attractiveness = appearance.attractiveness * ageFactor;
  
  return updated;
}

// ============================================================================
// DESCRIPTION GENERATION
// ============================================================================

/**
 * Generate natural language description of appearance
 */
export function describeAppearance(appearance: Appearance, gender: 'male' | 'female'): string {
  const parts: string[] = [];
  
  // Overall attractiveness
  const attractDesc = appearance.attractiveness > 0.7 ? 'attractive' :
                     appearance.attractiveness > 0.5 ? 'pleasant-looking' :
                     appearance.attractiveness > 0.3 ? 'average-looking' : 'plain';
  
  parts.push(`A ${attractDesc} ${gender === 'male' ? 'man' : 'woman'}`);
  
  // Skin
  parts.push(`with ${appearance.skinColor.value} skin`);
  
  // Hair
  if (appearance.hairLength.value !== 'bald') {
    parts.push(`${appearance.hairLength.value} ${appearance.hairColor.value} hair`);
  } else {
    parts.push('a bald head');
  }
  
  // Eyes
  parts.push(`${appearance.eyeSize.value} ${appearance.eyeColor.value} eyes`);
  
  // Notable features
  if (appearance.noseSize.value !== 'average') {
    parts.push(`a ${appearance.noseSize.value} nose`);
  }
  
  // Distinctive features
  if (appearance.freckles.value !== 'none') {
    parts.push(`${appearance.freckles.value} freckles`);
  }
  
  if (appearance.wrinkles.value !== 'none') {
    parts.push(`${appearance.wrinkles.value} wrinkles`);
  }
  
  // Facial hair (males)
  if (gender === 'male' && appearance.facialHairStyle.value !== 'none') {
    parts.push(`${appearance.facialHairStyle.value} facial hair`);
  }
  
  return parts.join(', ') + '.';
}

/**
 * Generate short appearance summary
 */
export function getAppearanceSummary(appearance: Appearance): string {
  return `${appearance.hairColor.value}-haired with ${appearance.eyeColor.value} eyes`;
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Apply appearance to character at creation
 */
export async function initializeCharacterAppearance(
  characterId: string,
  gender: 'male' | 'female',
  motherId?: string,
  fatherId?: string,
  age: number = 20
): Promise<void> {
  let mother, father;
  
  if (motherId) mother = await storage.getCharacter(motherId);
  if (fatherId) father = await storage.getCharacter(fatherId);
  
  const appearance = generateAppearance(gender, mother, father, age);
  
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const customData = (character as any).customData || {};
  
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      appearance
    }
  } as any);
}

// All functions are already exported above with 'export function'
