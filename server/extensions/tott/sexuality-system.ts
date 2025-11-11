/**
 * Sexuality & Fertility System
 * 
 * Implements sexual orientation, fertility traits, and reproductive compatibility.
 * Based on Talk of the Town's person.py attributes and relationship mechanics.
 * 
 * Features:
 * - Sexual orientation (heterosexual, homosexual, bisexual, asexual)
 * - Fertility traits (fertile, infertile, reduced fertility)
 * - Romantic compatibility checks
 * - Adoption mechanics for infertile/same-sex couples
 * - Coming out events
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type SexualOrientation = 'heterosexual' | 'homosexual' | 'bisexual' | 'asexual';

export interface SexualityData {
  orientation: SexualOrientation;
  orientationStrength: number;  // 0-1, how strong the preference is
  isOut: boolean;               // Has publicly come out (for non-heterosexual)
  cameOutAt: number | null;     // Age when came out
  fertility: FertilityStatus;
  adoptionPreference: number;   // 0-1, willingness to adopt
}

export type FertilityStatus = 'fertile' | 'infertile' | 'reduced';

export interface FertilityData {
  status: FertilityStatus;
  conceptionChanceModifier: number;  // 0-1, multiplier on base conception chance
  infertilityReason?: string;        // Medical reason if infertile
}

// Population distribution (realistic percentages)
const ORIENTATION_DISTRIBUTION = {
  heterosexual: 0.90,   // ~90%
  homosexual: 0.05,     // ~5%
  bisexual: 0.04,       // ~4%
  asexual: 0.01         // ~1%
};

const INFERTILITY_RATE = 0.10;      // ~10% of population
const REDUCED_FERTILITY_RATE = 0.15; // ~15% additional

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate sexual orientation
 * Based on population distribution with genetic/environmental factors
 */
export function generateSexualOrientation(): SexualOrientation {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [orientation, probability] of Object.entries(ORIENTATION_DISTRIBUTION)) {
    cumulative += probability;
    if (roll < cumulative) {
      return orientation as SexualOrientation;
    }
  }
  
  return 'heterosexual'; // Fallback
}

/**
 * Generate fertility status
 */
export function generateFertilityStatus(
  gender: 'male' | 'female',
  age: number = 20
): FertilityData {
  // Age affects fertility
  let infertilityChance = INFERTILITY_RATE;
  let reducedFertilityChance = REDUCED_FERTILITY_RATE;
  
  if (age > 35) {
    // Fertility decreases with age (especially for women)
    const ageFactor = (age - 35) / 20; // Increases over time
    reducedFertilityChance += ageFactor * 0.3;
    infertilityChance += ageFactor * 0.1;
  }
  
  const roll = Math.random();
  
  if (roll < infertilityChance) {
    // Infertile
    const reasons = [
      'medical condition',
      'genetic factors',
      'undetermined causes',
      'reproductive system complications'
    ];
    
    return {
      status: 'infertile',
      conceptionChanceModifier: 0,
      infertilityReason: reasons[Math.floor(Math.random() * reasons.length)]
    };
  } else if (roll < infertilityChance + reducedFertilityChance) {
    // Reduced fertility
    return {
      status: 'reduced',
      conceptionChanceModifier: 0.3 + (Math.random() * 0.4), // 30-70% of normal
      infertilityReason: 'reduced fertility'
    };
  } else {
    // Fertile
    return {
      status: 'fertile',
      conceptionChanceModifier: 1.0
    };
  }
}

/**
 * Generate complete sexuality data
 */
export function generateSexualityData(
  gender: 'male' | 'female',
  age: number = 20
): SexualityData {
  const orientation = generateSexualOrientation();
  const fertility = generateFertilityStatus(gender, age);
  
  // Orientation strength (most people have strong preferences)
  const orientationStrength = 0.7 + (Math.random() * 0.3); // 0.7-1.0
  
  // Coming out status (non-heterosexual may or may not be out)
  let isOut = false;
  let cameOutAt = null;
  
  if (orientation !== 'heterosexual') {
    // Chance of being out increases with age
    const outChance = Math.min(0.8, (age - 16) / 30); // 0 at 16, 0.8 at 46+
    isOut = Math.random() < outChance;
    
    if (isOut) {
      // Came out between 16 and current age
      cameOutAt = 16 + Math.floor(Math.random() * (age - 16));
    }
  }
  
  // Adoption preference (higher for infertile/non-hetero couples)
  let adoptionPreference = 0.2 + (Math.random() * 0.3); // Base 20-50%
  
  if (fertility.status === 'infertile') {
    adoptionPreference += 0.3; // +30% if infertile
  }
  if (orientation === 'homosexual') {
    adoptionPreference += 0.2; // +20% for same-sex couples
  }
  
  adoptionPreference = Math.min(1.0, adoptionPreference);
  
  return {
    orientation,
    orientationStrength,
    isOut,
    cameOutAt,
    fertility: fertility.status,
    adoptionPreference
  };
}

// ============================================================================
// COMPATIBILITY CHECKS
// ============================================================================

/**
 * Check romantic compatibility based on orientation
 */
export function checkRomanticCompatibility(
  character1: Character,
  character2: Character
): {
  compatible: boolean;
  compatibilityScore: number; // 0-1
  reason?: string;
} {
  const data1 = getSexualityData(character1);
  const data2 = getSexualityData(character2);
  
  if (!data1 || !data2) {
    return { compatible: true, compatibilityScore: 0.5 }; // Unknown, assume possible
  }
  
  // Same person = no
  if (character1.id === character2.id) {
    return { compatible: false, compatibilityScore: 0, reason: 'same person' };
  }
  
  // Check gender compatibility with orientations
  const gender1 = character1.gender;
  const gender2 = character2.gender;
  
  // Asexual has low romantic interest
  if (data1.orientation === 'asexual' || data2.orientation === 'asexual') {
    return { 
      compatible: false, 
      compatibilityScore: 0.1, 
      reason: 'asexual orientation' 
    };
  }
  
  // Check if orientations allow for this pairing
  const comp1 = isGenderAttractive(data1.orientation, gender1, gender2);
  const comp2 = isGenderAttractive(data2.orientation, gender2, gender1);
  
  if (!comp1 || !comp2) {
    return { 
      compatible: false, 
      compatibilityScore: 0.05, 
      reason: 'incompatible orientations' 
    };
  }
  
  // Compatible! Calculate score based on orientation strength
  const avgStrength = (data1.orientationStrength + data2.orientationStrength) / 2;
  
  return { 
    compatible: true, 
    compatibilityScore: avgStrength 
  };
}

/**
 * Check if a gender is attractive given orientation
 */
function isGenderAttractive(
  orientation: SexualOrientation,
  observerGender: string,
  targetGender: string
): boolean {
  switch (orientation) {
    case 'heterosexual':
      return observerGender !== targetGender;
    case 'homosexual':
      return observerGender === targetGender;
    case 'bisexual':
      return true;
    case 'asexual':
      return false;
    default:
      return false;
  }
}

/**
 * Check reproductive compatibility (can they have biological children?)
 */
export function checkReproductiveCompatibility(
  character1: Character,
  character2: Character
): {
  canConceive: boolean;
  conceptionChanceModifier: number;
  requiresAdoption: boolean;
  reason?: string;
} {
  // Different genders required for biological reproduction
  if (character1.gender === character2.gender) {
    return {
      canConceive: false,
      conceptionChanceModifier: 0,
      requiresAdoption: true,
      reason: 'same-sex couple'
    };
  }
  
  const data1 = getSexualityData(character1);
  const data2 = getSexualityData(character2);
  
  if (!data1 || !data2) {
    return { canConceive: true, conceptionChanceModifier: 1.0, requiresAdoption: false };
  }
  
  // Check fertility status
  if (data1.fertility === 'infertile' || data2.fertility === 'infertile') {
    return {
      canConceive: false,
      conceptionChanceModifier: 0,
      requiresAdoption: true,
      reason: 'infertility'
    };
  }
  
  // Both fertile or reduced
  let modifier = 1.0;
  
  // Get detailed fertility data
  const customData1 = (character1 as any).customData || {};
  const customData2 = (character2 as any).customData || {};
  const fertility1 = customData1.fertilityData as FertilityData | undefined;
  const fertility2 = customData2.fertilityData as FertilityData | undefined;
  
  if (fertility1) modifier *= fertility1.conceptionChanceModifier;
  if (fertility2) modifier *= fertility2.conceptionChanceModifier;
  
  return {
    canConceive: true,
    conceptionChanceModifier: modifier,
    requiresAdoption: false
  };
}

// ============================================================================
// ADOPTION SYSTEM
// ============================================================================

/**
 * Check if couple wants to adopt
 */
export function checkAdoptionDesire(
  character1: Character,
  character2: Character
): {
  wantsToAdopt: boolean;
  adoptionProbability: number;
} {
  const data1 = getSexualityData(character1);
  const data2 = getSexualityData(character2);
  
  if (!data1 || !data2) {
    return { wantsToAdopt: false, adoptionProbability: 0 };
  }
  
  // Average adoption preference
  const avgPreference = (data1.adoptionPreference + data2.adoptionPreference) / 2;
  
  // Check reproductive compatibility
  const reproCompat = checkReproductiveCompatibility(character1, character2);
  
  // If can't have biological children, much higher adoption desire
  let probability = avgPreference;
  if (reproCompat.requiresAdoption) {
    probability += 0.4; // +40% if must adopt
  }
  
  probability = Math.min(1.0, probability);
  
  return {
    wantsToAdopt: Math.random() < probability,
    adoptionProbability: probability
  };
}

/**
 * Process adoption
 */
export async function adoptChild(
  parent1Id: string,
  parent2Id: string,
  childId: string,
  currentTimestep: number
): Promise<void> {
  const parent1 = await storage.getCharacter(parent1Id);
  const parent2 = await storage.getCharacter(parent2Id);
  const child = await storage.getCharacter(childId);
  
  if (!parent1 || !parent2 || !child) return;
  
  // Update child's parents (adoptive)
  const childData = (child as any).customData || {};
  await storage.updateCharacter(childId, {
    customData: {
      ...childData,
      adoptiveParent1Id: parent1Id,
      adoptiveParent2Id: parent2Id,
      adoptedAt: currentTimestep,
      isAdopted: true
    }
  } as any);
  
  // Update parents' child lists
  const parent1Data = (parent1 as any).customData || {};
  const parent2Data = (parent2 as any).customData || {};
  
  const parent1Children = parent1Data.childIds || [];
  const parent2Children = parent2Data.childIds || [];
  
  await storage.updateCharacter(parent1Id, {
    customData: {
      ...parent1Data,
      childIds: [...parent1Children, childId]
    }
  } as any);
  
  await storage.updateCharacter(parent2Id, {
    customData: {
      ...parent2Data,
      childIds: [...parent2Children, childId]
    }
  } as any);
  
  console.log(`👨‍👩‍👧 ${parent1.firstName} & ${parent2.firstName} adopted ${child.firstName}`);
}

// ============================================================================
// COMING OUT EVENTS
// ============================================================================

/**
 * Character comes out (reveals non-heterosexual orientation)
 */
export async function comingOut(
  characterId: string,
  currentAge: number
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const customData = (character as any).customData || {};
  const sexualityData = customData.sexuality as SexualityData | undefined;
  
  if (!sexualityData || sexualityData.orientation === 'heterosexual' || sexualityData.isOut) {
    return; // Already out or heterosexual
  }
  
  // Come out
  const updatedSexuality: SexualityData = {
    ...sexualityData,
    isOut: true,
    cameOutAt: currentAge
  };
  
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      sexuality: updatedSexuality
    }
  } as any);
  
  const orientationLabel = sexualityData.orientation === 'homosexual' ? 'gay/lesbian' :
                           sexualityData.orientation === 'bisexual' ? 'bisexual' : 'asexual';
  
  console.log(`🏳️‍🌈 ${character.firstName} came out as ${orientationLabel} at age ${currentAge}`);
}

/**
 * Check if character should come out (probabilistic)
 */
export async function checkComingOut(
  characterId: string,
  currentAge: number,
  currentTimestep: number
): Promise<boolean> {
  const character = await storage.getCharacter(characterId);
  if (!character) return false;
  
  const customData = (character as any).customData || {};
  const sexualityData = customData.sexuality as SexualityData | undefined;
  
  if (!sexualityData || sexualityData.orientation === 'heterosexual' || sexualityData.isOut) {
    return false;
  }
  
  // Probability increases with age
  const baseChance = 0.05; // 5% per year after 16
  if (currentAge < 16) return false;
  
  const yearsSince16 = currentAge - 16;
  const comingOutChance = baseChance * Math.min(yearsSince16 / 5, 1.5); // Caps at 7.5% per year
  
  if (Math.random() < comingOutChance) {
    await comingOut(characterId, currentAge);
    return true;
  }
  
  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get sexuality data from character
 */
export function getSexualityData(character: Character): SexualityData | null {
  const customData = (character as any).customData || {};
  return customData.sexuality as SexualityData | undefined || null;
}

/**
 * Get orientation label
 */
export function getOrientationLabel(orientation: SexualOrientation): string {
  switch (orientation) {
    case 'heterosexual': return 'straight';
    case 'homosexual': return 'gay/lesbian';
    case 'bisexual': return 'bisexual';
    case 'asexual': return 'asexual';
    default: return 'unknown';
  }
}

/**
 * Get fertility label
 */
export function getFertilityLabel(status: FertilityStatus): string {
  switch (status) {
    case 'fertile': return 'fertile';
    case 'infertile': return 'infertile';
    case 'reduced': return 'reduced fertility';
    default: return 'unknown';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize sexuality data for character
 */
export async function initializeCharacterSexuality(
  characterId: string,
  gender: 'male' | 'female',
  age: number = 20
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const sexualityData = generateSexualityData(gender, age);
  const fertilityData = generateFertilityStatus(gender, age);
  
  const customData = (character as any).customData || {};
  
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      sexuality: sexualityData,
      fertilityData
    }
  } as any);
  
  const orientationLabel = getOrientationLabel(sexualityData.orientation);
  const fertilityLabel = getFertilityLabel(sexualityData.fertility);
  
  console.log(`🧬 ${character.firstName}: ${orientationLabel}, ${fertilityLabel}`);
}

// ============================================================================
// DESCRIPTION
// ============================================================================

/**
 * Get orientation description for character
 */
export function describeOrientation(sexuality: SexualityData, isPublic: boolean = false): string {
  if (!isPublic && !sexuality.isOut && sexuality.orientation !== 'heterosexual') {
    return 'orientation not publicly known';
  }
  
  const label = getOrientationLabel(sexuality.orientation);
  const strength = sexuality.orientationStrength > 0.9 ? 'strongly' :
                   sexuality.orientationStrength > 0.7 ? 'predominantly' : 'somewhat';
  
  return `${strength} ${label}`;
}

/**
 * Get fertility description
 */
export function describeFertility(fertilityData: FertilityData): string {
  if (fertilityData.status === 'fertile') {
    return 'normal fertility';
  } else if (fertilityData.status === 'infertile') {
    return `infertile (${fertilityData.infertilityReason || 'unknown reason'})`;
  } else {
    return `${Math.round(fertilityData.conceptionChanceModifier * 100)}% fertility`;
  }
}

// All functions are already exported above with 'export function' or 'export async function'
