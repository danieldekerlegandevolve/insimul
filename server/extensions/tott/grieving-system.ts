/**
 * Grieving System
 * 
 * Implements emotional response to death of family members and loved ones.
 * Based on Talk of the Town's grieving mechanics in person.py.
 * 
 * Characters experience grief after losing:
 * - Spouses
 * - Parents
 * - Children
 * - Siblings
 * - Close friends
 * 
 * Grief affects:
 * - Social behavior (reduced interaction)
 * - Work performance
 * - Mood
 * - Decision making
 * 
 * Recovery is influenced by:
 * - Personality (neuroticism extends grief)
 * - Time since death
 * - Support network
 * - Coping style
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { getPersonality, getStressResponse, type BigFivePersonality } from './personality-behavior-system.js';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface GrievingState {
  deceased: string;                    // ID of deceased person
  relationship: string;                // Type: 'spouse', 'parent', 'child', 'sibling', 'friend'
  deathTimestep: number;              // When they died
  intensity: number;                   // 0-1, how intense the grief is
  stage: 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance';
  lastUpdated: number;                 // Last time grief was updated
}

export interface GrievingData {
  activeGrief: GrievingState[];       // Current grief states
  pastGrief: GrievingState[];         // Resolved grief (for history)
}

// Grief intensity by relationship type
const GRIEF_INTENSITY = {
  spouse: 1.0,      // Most intense
  child: 0.95,      // Nearly as intense
  parent: 0.8,      // Very intense
  sibling: 0.7,     // Intense
  friend: 0.5,      // Moderate
  other: 0.3        // Mild
};

// Grief stages and their durations (in timesteps/days)
const GRIEF_STAGES = {
  denial: 7,        // ~1 week
  anger: 14,        // ~2 weeks
  bargaining: 21,   // ~3 weeks
  depression: 60,   // ~2 months
  acceptance: 90    // ~3 months total
};

// Behavioral modifiers during grief
const GRIEF_MODIFIERS = {
  socialReduction: 0.6,     // 60% reduction in social desire
  workPerformance: 0.7,     // 70% of normal work performance
  riskAversion: 0.5,        // More cautious
  stressMultiplier: 1.5     // 50% more stressed
};

// ============================================================================
// CORE GRIEF FUNCTIONS
// ============================================================================

/**
 * Initiate grief when a character dies
 * Called by death event or lifecycle system
 */
export async function initiateGrief(
  characterId: string,
  deceasedId: string,
  relationship: string,
  currentTimestep: number
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const customData = (character as any).customData || {};
  const grievingData: GrievingData = customData.grieving || {
    activeGrief: [],
    pastGrief: []
  };
  
  // Calculate initial intensity based on relationship
  const baseIntensity = GRIEF_INTENSITY[relationship as keyof typeof GRIEF_INTENSITY] || GRIEF_INTENSITY.other;
  
  // Modify by personality (neuroticism increases intensity)
  const personality = getPersonality(character);
  const personalityModifier = 0.5 + (personality.neuroticism * 0.5); // 0.5 to 1.0
  const intensity = Math.min(1.0, baseIntensity * personalityModifier);
  
  // Create new grief state
  const newGrief: GrievingState = {
    deceased: deceasedId,
    relationship,
    deathTimestep: currentTimestep,
    intensity,
    stage: 'denial',
    lastUpdated: currentTimestep
  };
  
  grievingData.activeGrief.push(newGrief);
  
  // Update character
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      grieving: grievingData
    }
  } as any);
  
  console.log(`💔 ${character.firstName} is grieving ${relationship}: intensity ${intensity.toFixed(2)}`);
}

/**
 * Update grief states for a character
 * Called during simulation timesteps
 */
export async function updateGrief(
  characterId: string,
  currentTimestep: number
): Promise<{
  activeGrief: number;
  stagesProgressed: number;
}> {
  const character = await storage.getCharacter(characterId);
  if (!character) return { activeGrief: 0, stagesProgressed: 0 };
  
  const customData = (character as any).customData || {};
  const grievingData: GrievingData = customData.grieving || {
    activeGrief: [],
    pastGrief: []
  };
  
  let stagesProgressed = 0;
  const personality = getPersonality(character);
  const stressResponse = getStressResponse(personality);
  
  // Update each active grief
  for (const grief of grievingData.activeGrief) {
    const timeSinceDeath = currentTimestep - grief.deathTimestep;
    const timeSinceUpdate = currentTimestep - grief.lastUpdated;
    
    // Progress through stages
    const { newStage, progressed } = progressGriefStage(grief, timeSinceDeath, stressResponse.recoveryRate);
    
    if (progressed) {
      grief.stage = newStage;
      grief.lastUpdated = currentTimestep;
      stagesProgressed++;
    }
    
    // Decay intensity over time
    grief.intensity = calculateGriefIntensity(
      grief,
      timeSinceDeath,
      stressResponse.recoveryRate
    );
  }
  
  // Move resolved grief to past
  const stillGrieving = grievingData.activeGrief.filter(g => g.intensity > 0.05);
  const resolved = grievingData.activeGrief.filter(g => g.intensity <= 0.05);
  
  grievingData.activeGrief = stillGrieving;
  grievingData.pastGrief.push(...resolved);
  
  // Update character
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      grieving: grievingData
    }
  } as any);
  
  return {
    activeGrief: stillGrieving.length,
    stagesProgressed
  };
}

/**
 * Progress through grief stages
 */
function progressGriefStage(
  grief: GrievingState,
  timeSinceDeath: number,
  recoveryRate: number
): { newStage: GrievingState['stage']; progressed: boolean } {
  // Adjust stage durations by recovery rate
  const denialDuration = GRIEF_STAGES.denial / recoveryRate;
  const angerDuration = denialDuration + (GRIEF_STAGES.anger / recoveryRate);
  const bargainingDuration = angerDuration + (GRIEF_STAGES.bargaining / recoveryRate);
  const depressionDuration = bargainingDuration + (GRIEF_STAGES.depression / recoveryRate);
  
  let newStage = grief.stage;
  let progressed = false;
  
  if (grief.stage === 'denial' && timeSinceDeath > denialDuration) {
    newStage = 'anger';
    progressed = true;
  } else if (grief.stage === 'anger' && timeSinceDeath > angerDuration) {
    newStage = 'bargaining';
    progressed = true;
  } else if (grief.stage === 'bargaining' && timeSinceDeath > bargainingDuration) {
    newStage = 'depression';
    progressed = true;
  } else if (grief.stage === 'depression' && timeSinceDeath > depressionDuration) {
    newStage = 'acceptance';
    progressed = true;
  }
  
  return { newStage, progressed };
}

/**
 * Calculate current grief intensity
 */
function calculateGriefIntensity(
  grief: GrievingState,
  timeSinceDeath: number,
  recoveryRate: number
): number {
  const baseIntensity = GRIEF_INTENSITY[grief.relationship as keyof typeof GRIEF_INTENSITY] || GRIEF_INTENSITY.other;
  
  // Decay curve: starts at full intensity, gradually decreases
  // Faster recovery with higher recoveryRate
  const decayRate = 0.01 * recoveryRate; // Base 1% per day with recovery modifier
  const decayFactor = Math.exp(-decayRate * timeSinceDeath);
  
  // Stage affects intensity
  const stageModifier = {
    denial: 0.8,
    anger: 1.0,        // Peak intensity
    bargaining: 0.9,
    depression: 0.7,
    acceptance: 0.3
  }[grief.stage];
  
  return Math.max(0, baseIntensity * decayFactor * stageModifier);
}

/**
 * Get total grief impact on a character
 * Returns combined effect of all active grief
 */
export async function getGriefImpact(characterId: string): Promise<{
  isGrieving: boolean;
  totalIntensity: number;
  socialModifier: number;
  workModifier: number;
  riskModifier: number;
  stressModifier: number;
  dominantStage: GrievingState['stage'] | null;
}> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return {
      isGrieving: false,
      totalIntensity: 0,
      socialModifier: 1.0,
      workModifier: 1.0,
      riskModifier: 1.0,
      stressModifier: 1.0,
      dominantStage: null
    };
  }
  
  const customData = (character as any).customData || {};
  const grievingData: GrievingData = customData.grieving || {
    activeGrief: [],
    pastGrief: []
  };
  
  if (grievingData.activeGrief.length === 0) {
    return {
      isGrieving: false,
      totalIntensity: 0,
      socialModifier: 1.0,
      workModifier: 1.0,
      riskModifier: 1.0,
      stressModifier: 1.0,
      dominantStage: null
    };
  }
  
  // Sum intensities (can stack if multiple losses)
  const totalIntensity = grievingData.activeGrief.reduce((sum, g) => sum + g.intensity, 0);
  const normalizedIntensity = Math.min(1.0, totalIntensity); // Cap at 1.0
  
  // Get dominant stage (highest intensity grief)
  const dominantGrief = grievingData.activeGrief.reduce((prev, curr) =>
    curr.intensity > prev.intensity ? curr : prev
  );
  
  // Calculate modifiers based on intensity
  const socialModifier = 1.0 - (GRIEF_MODIFIERS.socialReduction * normalizedIntensity);
  const workModifier = 1.0 - ((1 - GRIEF_MODIFIERS.workPerformance) * normalizedIntensity);
  const riskModifier = 1.0 - (GRIEF_MODIFIERS.riskAversion * normalizedIntensity);
  const stressModifier = 1.0 + ((GRIEF_MODIFIERS.stressMultiplier - 1) * normalizedIntensity);
  
  return {
    isGrieving: true,
    totalIntensity: normalizedIntensity,
    socialModifier,
    workModifier,
    riskModifier,
    stressModifier,
    dominantStage: dominantGrief.stage
  };
}

/**
 * Apply grief modifiers to a probability
 */
export function applyGriefModifier(
  baseProbability: number,
  griefImpact: Awaited<ReturnType<typeof getGriefImpact>>,
  modifierType: 'social' | 'work' | 'risk' | 'stress'
): number {
  if (!griefImpact.isGrieving) return baseProbability;
  
  let modifier = 1.0;
  switch (modifierType) {
    case 'social':
      modifier = griefImpact.socialModifier;
      break;
    case 'work':
      modifier = griefImpact.workModifier;
      break;
    case 'risk':
      modifier = griefImpact.riskModifier;
      break;
    case 'stress':
      modifier = griefImpact.stressModifier;
      break;
  }
  
  return baseProbability * modifier;
}

/**
 * Check if character should attend social event given grief
 */
export async function shouldAttendEventWhileGrieving(
  characterId: string,
  eventType: 'funeral' | 'wedding' | 'party' | 'work' | 'other',
  baseAttendanceProbability: number
): Promise<boolean> {
  const griefImpact = await getGriefImpact(characterId);
  
  if (!griefImpact.isGrieving) {
    return Math.random() < baseAttendanceProbability;
  }
  
  // Funerals: More likely to attend if grieving (unless too depressed)
  if (eventType === 'funeral') {
    if (griefImpact.dominantStage === 'depression') {
      return Math.random() < (baseAttendanceProbability * 0.7);
    }
    return Math.random() < (baseAttendanceProbability * 1.2);
  }
  
  // Work: Must attend but performance suffers
  if (eventType === 'work') {
    return Math.random() < (baseAttendanceProbability * griefImpact.workModifier);
  }
  
  // Social events: Much less likely
  if (eventType === 'party') {
    return Math.random() < applyGriefModifier(baseAttendanceProbability, griefImpact, 'social');
  }
  
  // Weddings: Somewhat less likely (bittersweet)
  if (eventType === 'wedding') {
    return Math.random() < (baseAttendanceProbability * 0.8 * griefImpact.socialModifier);
  }
  
  // Other events
  return Math.random() < applyGriefModifier(baseAttendanceProbability, griefImpact, 'social');
}

/**
 * Get grief description for UI/narrative
 */
export async function getGriefDescription(characterId: string): Promise<string | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  const customData = (character as any).customData || {};
  const grievingData: GrievingData = customData.grieving || {
    activeGrief: [],
    pastGrief: []
  };
  
  if (grievingData.activeGrief.length === 0) return null;
  
  const griefImpact = await getGriefImpact(characterId);
  
  // Get dominant grief
  const dominantGrief = grievingData.activeGrief.reduce((prev, curr) =>
    curr.intensity > prev.intensity ? curr : prev
  );
  
  const deceased = await storage.getCharacter(dominantGrief.deceased);
  const deceasedName = deceased ? `${deceased.firstName} ${deceased.lastName}` : 'someone';
  
  const stageDescriptions = {
    denial: `struggling to accept the loss of ${deceasedName}`,
    anger: `angry about losing ${deceasedName}`,
    bargaining: `wondering what could have been done to save ${deceasedName}`,
    depression: `deeply saddened by the loss of ${deceasedName}`,
    acceptance: `coming to terms with losing ${deceasedName}`
  };
  
  const intensityDescriptions = {
    high: 'profoundly',
    medium: 'noticeably',
    low: 'still'
  };
  
  const intensityLevel = griefImpact.totalIntensity > 0.7 ? 'high' :
                        griefImpact.totalIntensity > 0.3 ? 'medium' : 'low';
  
  return `${character.firstName} is ${intensityDescriptions[intensityLevel]} ${stageDescriptions[dominantGrief.stage]}.`;
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Trigger grief for all relevant characters when someone dies
 */
export async function processDeathGrief(
  deceasedId: string,
  worldId: string,
  currentTimestep: number
): Promise<{
  grieversCreated: number;
  relationships: string[];
}> {
  const deceased = await storage.getCharacter(deceasedId);
  if (!deceased) return { grieversCreated: 0, relationships: [] };
  
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let grieversCreated = 0;
  const relationships: string[] = [];
  
  for (const character of allCharacters) {
    if (character.id === deceasedId) continue;
    
    // Check relationship
    let relationship: string | null = null;
    
    // Spouse
    if (character.spouseId === deceasedId) {
      relationship = 'spouse';
    }
    // Parent
    else if (character.motherId === deceasedId || character.fatherId === deceasedId) {
      relationship = 'parent';
    }
    // Child
    else if (deceased.motherId === character.id || deceased.fatherId === character.id) {
      relationship = 'child';
    }
    // Sibling (same parents)
    else if (
      (character.motherId && character.motherId === deceased.motherId) ||
      (character.fatherId && character.fatherId === deceased.fatherId)
    ) {
      relationship = 'sibling';
    }
    // Friend (check relationship strength)
    else {
      // Would need to check relationship system for friends
      // For now, skip
      continue;
    }
    
    if (relationship) {
      await initiateGrief(character.id, deceasedId, relationship, currentTimestep);
      grieversCreated++;
      relationships.push(`${character.firstName} (${relationship})`);
    }
  }
  
  return { grieversCreated, relationships };
}

// All functions are already exported above with 'export async function'
