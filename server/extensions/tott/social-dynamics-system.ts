/**
 * Social Dynamics System
 * 
 * Implements Phase 5 of TotT integration:
 * - Enhanced relationships (compatibility, charge, spark, trust)
 * - Salience tracking (who's important to whom)
 * - Autonomous social interactions
 * 
 * Based on Talk of the Town's relationship.py and person.py social mechanics
 */

import { storage } from '../../db/storage';
import type { Character, BigFivePersonality } from '@shared/schema';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RelationshipDetails {
  compatibility: number;           // -1 to 1, based on personality similarity
  charge: number;                  // Social affinity (friendship)
  chargeIncrement: number;         // How much charge changes per interaction
  spark: number;                   // Romantic attraction
  sparkIncrement: number;          // How much spark changes per interaction
  trust: number;                   // 0 to 1, built through positive interactions
  
  // Modifiers
  ageDifferenceEffect: number;     // -1 to 1, how age gap affects relationship
  jobLevelDifferenceEffect: number; // -1 to 1, how job status affects relationship
  
  // History
  firstMetDate: Date;
  lastInteractionDate: Date;
  totalInteractions: number;
  conversationCount: number;
  
  // States
  areFriends: boolean;
  areEnemies: boolean;
  areRomantic: boolean;
}

export interface SalienceData {
  [characterId: string]: number;  // 0 to 1, how salient/important this person is
}

export interface SocialInteractionResult {
  initiatorId: string;
  targetId: string;
  location: string;
  interactionType: 'conversation' | 'observation' | 'passing';
  chargeChange: number;
  sparkChange: number;
  trustChange: number;
  salienceChange: number;
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Relationship thresholds
  friendshipChargeThreshold: 10,
  enemyChargeThreshold: -10,
  romanticSparkThreshold: 15,
  
  // Increment modifiers
  ownerExtroversionBoost: 0.3,
  subjectAgreeablenessBoost: 0.3,
  sexDifferenceReduction: 0.8,
  
  // Age difference effects
  maxAgeDifferenceForFriendship: 15,
  ageDifferenceImpactOnCharge: 0.5,
  
  // Job level difference effects
  jobLevelDifferenceImpact: 0.3,
  
  // Trust
  trustChargeBoost: 0.2,
  trustDecayRate: 0.01,
  
  // Spark decay
  sparkDecayRate: 0.05,
  
  // Salience
  baseSalienceForStranger: 0.1,
  salienceBoostForInteraction: 0.05,
  salienceDecayRate: 0.001,
  maxSalience: 1.0,
  
  // Interaction probabilities
  baseChanceToSocialize: 0.3,
  extroversionBoostToSocialize: 0.4,
  salienceBoostToSocialize: 0.5,
};

// ============================================================================
// CORE FUNCTIONS: RELATIONSHIP CALCULATIONS
// ============================================================================

/**
 * Calculate compatibility between two characters based on Big Five personality traits
 * Following TotT's logic: similar O, E, A leads to compatibility
 */
export function calculateCompatibility(char1: Character, char2: Character): number {
  const traits1 = char1.personality as BigFivePersonality | null;
  const traits2 = char2.personality as BigFivePersonality | null;
  
  if (!traits1 || !traits2) {
    return 0;
  }
  
  // Calculate absolute differences in O, E, A (the traits that affect friendship)
  const diff = 
    Math.abs(traits1.openness - traits2.openness) +
    Math.abs(traits1.extroversion - traits2.extroversion) +
    Math.abs(traits1.agreeableness - traits2.agreeableness);
  
  // Normalize from 0-6 scale (max difference) to -1 to 1 compatibility scale
  // 0 difference = 1.0 compatibility
  // 6 difference = -1.0 compatibility
  const normalized = (3.0 - diff) / 3.0;
  
  return normalized;
}

/**
 * Calculate initial charge increment (how much they like/dislike each other per interaction)
 * Based on compatibility, extroversion, and agreeableness
 */
export function calculateChargeIncrement(
  owner: Character,
  subject: Character,
  compatibility: number
): number {
  const ownerTraits = owner.personality as BigFivePersonality | null;
  const subjectTraits = subject.personality as BigFivePersonality | null;
  
  if (!ownerTraits || !subjectTraits) {
    return compatibility;
  }
  
  let increment = compatibility;
  
  // Extroverts are more likely to like people
  increment += ownerTraits.extroversion * CONFIG.ownerExtroversionBoost;
  
  // Agreeable people are more liked
  increment += subjectTraits.agreeableness * CONFIG.subjectAgreeablenessBoost;
  
  // Opposite-sex friendships are slightly less likely (research-based)
  if (owner.gender !== subject.gender) {
    increment *= CONFIG.sexDifferenceReduction;
  }
  
  return increment;
}

/**
 * Calculate initial spark increment (romantic attraction)
 * Only non-zero if: same age range, compatible sexuality, not family
 */
export function calculateSparkIncrement(
  owner: Character,
  subject: Character,
  currentYear: number
): number {
  // Check if both are adults
  const ownerAge = currentYear - (owner.birthYear || 0);
  const subjectAge = currentYear - (subject.birthYear || 0);
  
  if (ownerAge < 18 || subjectAge < 18) {
    return 0;
  }
  
  // Check sexuality compatibility (simplified - assume attracted to opposite sex)
  if (owner.gender === subject.gender) {
    return 0; // Simplification - could add sexuality system later
  }
  
  // TODO: Check if family members (need family relationship data)
  
  // Base spark on personality attraction
  const ownerTraits = owner.personality as BigFivePersonality | null;
  const subjectTraits = subject.personality as BigFivePersonality | null;
  
  if (!ownerTraits || !subjectTraits) {
    return 0;
  }
  
  let spark = 0;
  
  // Research shows: people attracted to similar openness, opposite neuroticism
  spark += (1 - Math.abs(ownerTraits.openness - subjectTraits.openness)) * 0.3;
  spark += Math.abs(ownerTraits.neuroticism - subjectTraits.neuroticism) * 0.2;
  
  // Extroverts find extroverts attractive
  spark += ownerTraits.extroversion * subjectTraits.extroversion * 0.2;
  
  // Conscientiousness attracts
  spark += subjectTraits.conscientiousness * 0.3;
  
  return spark;
}

/**
 * Calculate age difference effect on relationship
 * Smaller age gaps = stronger relationships
 */
export function calculateAgeDifferenceEffect(
  ownerAge: number,
  subjectAge: number
): number {
  const ageDiff = Math.abs(ownerAge - subjectAge);
  
  if (ageDiff === 0) return 1.0;
  if (ageDiff > CONFIG.maxAgeDifferenceForFriendship) {
    return -CONFIG.ageDifferenceImpactOnCharge;
  }
  
  // Linear decrease
  const effect = 1.0 - (ageDiff / CONFIG.maxAgeDifferenceForFriendship);
  return effect * CONFIG.ageDifferenceImpactOnCharge;
}

/**
 * Calculate job level difference effect
 * Similar job levels = better relationships
 */
export function calculateJobLevelDifferenceEffect(
  char1: Character,
  char2: Character
): number {
  const occupation1 = (char1.socialAttributes as Record<string, any>)?.currentOccupation;
  const occupation2 = (char2.socialAttributes as Record<string, any>)?.currentOccupation;
  
  // If either unemployed, neutral effect
  if (!occupation1 || !occupation2) {
    return 0;
  }
  
  // Simplified job level mapping (could be enhanced)
  const jobLevels: Record<string, number> = {
    'Manager': 4,
    'Doctor': 4,
    'Lawyer': 4,
    'Teacher': 3,
    'Nurse': 3,
    'Cashier': 2,
    'Waiter': 2,
    'Farmer': 2,
    'Miner': 1,
    'Worker': 1,
  };
  
  const level1 = jobLevels[occupation1.vocation] || 2;
  const level2 = jobLevels[occupation2.vocation] || 2;
  const levelDiff = Math.abs(level1 - level2);
  
  if (levelDiff === 0) return 1.0;
  if (levelDiff > 2) return -CONFIG.jobLevelDifferenceImpact;
  
  return 1.0 - (levelDiff / 2.0) * CONFIG.jobLevelDifferenceImpact;
}

/**
 * Calculate trust based on current charge
 * Positive relationships build trust
 */
export function calculateTrust(charge: number): number {
  if (charge <= 0) return 0;
  
  const trust = charge * CONFIG.trustChargeBoost;
  return Math.min(1.0, Math.max(0, trust));
}

// ============================================================================
// CORE FUNCTIONS: RELATIONSHIP MANAGEMENT
// ============================================================================

/**
 * Initialize or get relationship details between two characters
 */
export async function getRelationshipDetails(
  char1Id: string,
  char2Id: string,
  currentYear: number
): Promise<RelationshipDetails> {
  const char1 = await storage.getCharacter(char1Id);
  const char2 = await storage.getCharacter(char2Id);
  
  if (!char1 || !char2) {
    throw new Error('Character not found');
  }
  
  // Check if relationship details exist in socialAttributes
  const socialAttributes = (char1.socialAttributes as any) || {};
  const relationshipData = socialAttributes.relationshipDetails || {};
  const existing = relationshipData[char2Id];
  
  if (existing) {
    return existing;
  }
  
  // Create new relationship
  const compatibility = calculateCompatibility(char1, char2);
  const chargeIncrement = calculateChargeIncrement(char1, char2, compatibility);
  const sparkIncrement = calculateSparkIncrement(char1, char2, currentYear);
  
  const char1Age = currentYear - (char1.birthYear || 0);
  const char2Age = currentYear - (char2.birthYear || 0);
  
  const newRelationship: RelationshipDetails = {
    compatibility,
    charge: chargeIncrement,
    chargeIncrement,
    spark: sparkIncrement,
    sparkIncrement,
    trust: calculateTrust(chargeIncrement),
    ageDifferenceEffect: calculateAgeDifferenceEffect(char1Age, char2Age),
    jobLevelDifferenceEffect: calculateJobLevelDifferenceEffect(char1, char2),
    firstMetDate: new Date(),
    lastInteractionDate: new Date(),
    totalInteractions: 0,
    conversationCount: 0,
    areFriends: false,
    areEnemies: false,
    areRomantic: false,
  };
  
  return newRelationship;
}

/**
 * Update relationship after an interaction
 */
export async function updateRelationship(
  char1Id: string,
  char2Id: string,
  interactionQuality: number, // -1 to 1, how positive the interaction was
  currentYear: number
): Promise<RelationshipDetails> {
  const relationship = await getRelationshipDetails(char1Id, char2Id, currentYear);
  const char1 = await storage.getCharacter(char1Id);
  
  if (!char1) {
    throw new Error('Character not found');
  }
  
  // Update charge
  const chargeChange = relationship.chargeIncrement * interactionQuality;
  relationship.charge += chargeChange;
  
  // Update spark (with decay)
  const sparkChange = relationship.sparkIncrement * interactionQuality;
  relationship.spark = (relationship.spark * (1 - CONFIG.sparkDecayRate)) + sparkChange;
  relationship.sparkIncrement *= (1 - CONFIG.sparkDecayRate);
  
  // Update trust
  if (interactionQuality > 0) {
    relationship.trust = calculateTrust(relationship.charge);
  } else {
    relationship.trust *= (1 - CONFIG.trustDecayRate);
  }
  
  // Update counters
  relationship.totalInteractions++;
  relationship.lastInteractionDate = new Date();
  
  // Update states
  relationship.areFriends = relationship.charge >= CONFIG.friendshipChargeThreshold;
  relationship.areEnemies = relationship.charge <= CONFIG.enemyChargeThreshold;
  relationship.areRomantic = relationship.spark >= CONFIG.romanticSparkThreshold;
  
  // Save to character's socialAttributes
  const socialAttributes = (char1.socialAttributes as any) || {};
  const relationshipDetails = socialAttributes.relationshipDetails || {};
  relationshipDetails[char2Id] = relationship;
  socialAttributes.relationshipDetails = relationshipDetails;
  
  await storage.updateCharacter(char1Id, {
    socialAttributes: socialAttributes as Record<string, any>
  });
  
  return relationship;
}

// ============================================================================
// CORE FUNCTIONS: SALIENCE SYSTEM
// ============================================================================

/**
 * Get salience value (how important/memorable another character is)
 */
export async function getSalience(
  observerId: string,
  subjectId: string
): Promise<number> {
  const observer = await storage.getCharacter(observerId);
  
  if (!observer) {
    return 0;
  }
  
  const socialAttributes = (observer.socialAttributes as Record<string, any>) || {};
  const salience: SalienceData = socialAttributes.salience || {};
  
  return salience[subjectId] || CONFIG.baseSalienceForStranger;
}

/**
 * Update salience after an interaction or observation
 */
export async function updateSalience(
  observerId: string,
  subjectId: string,
  boost: number = CONFIG.salienceBoostForInteraction
): Promise<number> {
  const observer = await storage.getCharacter(observerId);
  
  if (!observer) {
    throw new Error('Observer not found');
  }
  
  const socialAttributes = (observer.socialAttributes as any) || {};
  const salience: SalienceData = socialAttributes.salience || {};
  
  const current = salience[subjectId] || CONFIG.baseSalienceForStranger;
  const updated = Math.min(CONFIG.maxSalience, current + boost);
  
  salience[subjectId] = updated;
  socialAttributes.salience = salience;
  
  await storage.updateCharacter(observerId, {
    socialAttributes: socialAttributes as Record<string, any>
  });
  
  return updated;
}

/**
 * Decay salience for all characters (call periodically to simulate forgetting)
 */
export async function decaySalience(characterId: string): Promise<void> {
  const character = await storage.getCharacter(characterId);
  
  if (!character) {
    return;
  }
  
  const socialAttributes = (character.socialAttributes as any) || {};
  const salience: SalienceData = socialAttributes.salience || {};
  
  // Decay all salience values
  for (const subjectId in salience) {
    salience[subjectId] = Math.max(
      CONFIG.baseSalienceForStranger,
      salience[subjectId] * (1 - CONFIG.salienceDecayRate)
    );
  }
  
  socialAttributes.salience = salience;
  
  await storage.updateCharacter(characterId, {
    socialAttributes: socialAttributes as Record<string, any>
  });
}

/**
 * Get most salient people for a character
 */
export async function getMostSalientPeople(
  characterId: string,
  limit: number = 10
): Promise<Array<{ characterId: string; salience: number }>> {
  const character = await storage.getCharacter(characterId);
  
  if (!character) {
    return [];
  }
  
  const socialAttributes = (character.socialAttributes as Record<string, any>) || {};
  const salience: SalienceData = socialAttributes.salience || {};
  
  const sorted = Object.entries(salience)
    .map(([id, value]) => ({ characterId: id, salience: value }))
    .sort((a, b) => b.salience - a.salience)
    .slice(0, limit);
  
  return sorted;
}

// ============================================================================
// CORE FUNCTIONS: SOCIAL INTERACTIONS
// ============================================================================

/**
 * Determine if a character should socialize based on personality and context
 */
export function shouldSocialize(character: Character, salienceOfOther: number): boolean {
  const traits = character.personality as BigFivePersonality | null;
  
  if (!traits) {
    return Math.random() < CONFIG.baseChanceToSocialize;
  }
  
  // Extroverts socialize more
  const extroversionBoost = traits.extroversion * CONFIG.extroversionBoostToSocialize;
  
  // More salient people are approached more
  const salienceBoost = salienceOfOther * CONFIG.salienceBoostToSocialize;
  
  const totalChance = CONFIG.baseChanceToSocialize + extroversionBoost + salienceBoost;
  
  return Math.random() < Math.min(0.9, totalChance);
}

/**
 * Simulate a social interaction between two characters
 */
export async function socialize(
  initiatorId: string,
  targetId: string,
  location: string,
  currentYear: number
): Promise<SocialInteractionResult> {
  const initiator = await storage.getCharacter(initiatorId);
  const target = await storage.getCharacter(targetId);
  
  if (!initiator || !target) {
    throw new Error('Character(s) not found');
  }
  
  // Get current relationship
  const relationshipBefore = await getRelationshipDetails(initiatorId, targetId, currentYear);
  
  // Determine interaction quality based on compatibility and personality
  const initiatorTraits = initiator.personality as BigFivePersonality | null;
  const targetTraits = target.personality as BigFivePersonality | null;
  
  let interactionQuality = relationshipBefore.compatibility;
  
  // Agreeable people make interactions more pleasant
  if (targetTraits) {
    interactionQuality += targetTraits.agreeableness * 0.2;
  }
  
  // Neurotic people make interactions more difficult
  if (initiatorTraits) {
    interactionQuality -= initiatorTraits.neuroticism * 0.1;
  }
  
  // Random variation
  interactionQuality += (Math.random() - 0.5) * 0.3;
  
  // Clamp to -1 to 1
  interactionQuality = Math.max(-1, Math.min(1, interactionQuality));
  
  // Update relationship for both characters
  const relationshipAfter = await updateRelationship(initiatorId, targetId, interactionQuality, currentYear);
  await updateRelationship(targetId, initiatorId, interactionQuality, currentYear);
  
  // Update salience for both
  await updateSalience(initiatorId, targetId);
  await updateSalience(targetId, initiatorId);
  
  // Calculate changes
  const chargeChange = relationshipAfter.charge - relationshipBefore.charge;
  const sparkChange = relationshipAfter.spark - relationshipBefore.spark;
  const trustChange = relationshipAfter.trust - relationshipBefore.trust;
  
  return {
    initiatorId,
    targetId,
    location,
    interactionType: 'conversation',
    chargeChange,
    sparkChange,
    trustChange,
    salienceChange: CONFIG.salienceBoostForInteraction,
    timestamp: new Date(),
  };
}

/**
 * Simulate autonomous socializing at a location
 * Characters at the same location interact based on personality and salience
 */
export async function simulateLocationSocializing(
  worldId: string,
  location: string,
  timestep: number,
  currentYear: number
): Promise<SocialInteractionResult[]> {
  // Get all characters at this location
  const characters = await storage.getCharactersByWorld(worldId);
  const charactersAtLocation = characters.filter(c => {
    // Use current location field
    return c.currentLocation === location && c.isAlive;
  });
  
  if (charactersAtLocation.length < 2) {
    return [];
  }
  
  const interactions: SocialInteractionResult[] = [];
  
  // Each character has a chance to initiate interaction
  for (const initiator of charactersAtLocation) {
    // Randomly select potential targets
    const potentialTargets = charactersAtLocation.filter(c => c.id !== initiator.id);
    
    if (potentialTargets.length === 0) continue;
    
    // Choose target based on salience
    const salienceScores = await Promise.all(
      potentialTargets.map(async (target) => ({
        target,
        salience: await getSalience(initiator.id, target.id),
      }))
    );
    
    // Weight selection by salience
    const totalSalience = salienceScores.reduce((sum, s) => sum + s.salience, 0);
    let random = Math.random() * totalSalience;
    let selectedTarget = potentialTargets[0];
    let selectedSalience = salienceScores[0].salience;
    
    for (const score of salienceScores) {
      random -= score.salience;
      if (random <= 0) {
        selectedTarget = score.target;
        selectedSalience = score.salience;
        break;
      }
    }
    
    // Decide if initiator actually socializes
    if (shouldSocialize(initiator, selectedSalience)) {
      const result = await socialize(initiator.id, selectedTarget.id, location, currentYear);
      interactions.push(result);
    }
  }
  
  return interactions;
}

/**
 * Get social summary for a character
 */
export async function getSocialSummary(characterId: string, currentYear: number) {
  const character = await storage.getCharacter(characterId);
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const socialAttributes = (character.socialAttributes as any) || {};
  const relationshipDetails = socialAttributes.relationshipDetails || {};
  const salience = socialAttributes.salience || {};
  
  const friends: string[] = [];
  const enemies: string[] = [];
  const romanticInterests: string[] = [];
  
  for (const [otherId, details] of Object.entries(relationshipDetails)) {
    const rel = details as RelationshipDetails;
    if (rel.areFriends) friends.push(otherId);
    if (rel.areEnemies) enemies.push(otherId);
    if (rel.areRomantic) romanticInterests.push(otherId);
  }
  
  const mostSalient = await getMostSalientPeople(characterId, 5);
  
  return {
    characterId,
    totalRelationships: Object.keys(relationshipDetails).length,
    friends,
    enemies,
    romanticInterests,
    mostSalientPeople: mostSalient,
    averageCharge: Object.values(relationshipDetails).reduce(
      (sum: number, r: any) => sum + r.charge, 0
    ) / Math.max(1, Object.keys(relationshipDetails).length),
  };
}
