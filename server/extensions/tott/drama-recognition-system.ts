/**
 * Drama Recognition System
 * 
 * Excavates dramatic narratives from the emergent simulation.
 * Based on Talk of the Town's drama.py StoryRecognizer.
 * 
 * Features:
 * - Unrequited love detection
 * - Love triangle recognition
 * - Extramarital affairs
 * - Friendship betrayals
 * - Rivalries (general, sibling, business)
 * - Misanthropes
 * - Narrative generation
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & DRAMA STRUCTURES
// ============================================================================

export interface UnrequitedLove {
  type: 'unrequited_love';
  lover: string;              // Character ID who loves
  nonreciprocator: string;    // Character ID who doesn't love back
  loverName: string;
  nonreciprocatorName: string;
  intensity: number;          // 0-1, how strong the unrequited love is
  description: string;
}

export interface LoveTriangle {
  type: 'love_triangle';
  characters: [string, string, string]; // IDs: A loves B, B loves C, C loves A
  names: [string, string, string];
  pattern: string;            // Description of the pattern
  description: string;
}

export interface ExtramaritalAffair {
  type: 'extramarital_affair';
  marriedPerson: string;      // Character ID
  spouse: string;             // Character ID
  loveInterest: string;       // Character ID (not the spouse)
  marriedPersonName: string;
  spouseName: string;
  loveInterestName: string;
  intensity: number;
  description: string;
}

export interface AsymmetricFriendship {
  type: 'asymmetric_friendship';
  friendlyPerson: string;     // Character ID who considers other a friend
  hostilePerson: string;      // Character ID who dislikes the friendly person
  friendlyPersonName: string;
  hostilePersonName: string;
  description: string;
}

export interface Rivalry {
  type: 'rivalry' | 'sibling_rivalry' | 'business_rivalry';
  person1: string;
  person2: string;
  person1Name: string;
  person2Name: string;
  intensity: number;          // How much they dislike each other
  context?: string;           // 'siblings', 'business_owners', etc.
  description: string;
}

export interface Misanthrope {
  type: 'misanthrope';
  person: string;
  personName: string;
  dislikedCount: number;
  description: string;
}

export type DramaEvent = 
  | UnrequitedLove 
  | LoveTriangle 
  | ExtramaritalAffair 
  | AsymmetricFriendship 
  | Rivalry 
  | Misanthrope;

export interface DramaAnalysis {
  unrequitedLove: UnrequitedLove[];
  loveTriangles: LoveTriangle[];
  extramaritalAffairs: ExtramaritalAffair[];
  asymmetricFriendships: AsymmetricFriendship[];
  rivalries: Rivalry[];
  siblingRivalries: Rivalry[];
  businessRivalries: Rivalry[];
  misanthropes: Misanthrope[];
  totalDramaCount: number;
  timestamp: number;
}

// Thresholds for drama detection
const THRESHOLDS = {
  loveIntensity: 50,          // Spark > 50 = love
  dislikeIntensity: -30,      // Charge < -30 = dislike
  strongDislike: -50,         // Charge < -50 = strong dislike
  misanthropeThreshold: 5     // Dislikes 5+ people = misanthrope
};

// ============================================================================
// DRAMA EXCAVATION
// ============================================================================

/**
 * Excavate all dramatic situations in the world
 */
export async function excavateDrama(worldId: string): Promise<DramaAnalysis> {
  console.log('🎭 Excavating dramatic narratives...');
  
  const unrequitedLove = await excavateUnrequitedLove(worldId);
  console.log(`  Found ${unrequitedLove.length} cases of unrequited love`);
  
  const loveTriangles = await excavateLoveTriangles(worldId);
  console.log(`  Found ${loveTriangles.length} love triangles`);
  
  const extramaritalAffairs = await excavateExtramaritalAffairs(worldId);
  console.log(`  Found ${extramaritalAffairs.length} extramarital affairs`);
  
  const asymmetricFriendships = await excavateAsymmetricFriendships(worldId);
  console.log(`  Found ${asymmetricFriendships.length} asymmetric friendships`);
  
  const rivalries = await excavateRivalries(worldId);
  console.log(`  Found ${rivalries.length} rivalries`);
  
  const siblingRivalries = await excavateSiblingRivalries(worldId);
  console.log(`  Found ${siblingRivalries.length} sibling rivalries`);
  
  const businessRivalries = await excavateBusinessRivalries(worldId);
  console.log(`  Found ${businessRivalries.length} business rivalries`);
  
  const misanthropes = await excavateMisanthropes(worldId);
  console.log(`  Found ${misanthropes.length} misanthropes`);
  
  const totalDramaCount = 
    unrequitedLove.length +
    loveTriangles.length +
    extramaritalAffairs.length +
    asymmetricFriendships.length +
    rivalries.length +
    siblingRivalries.length +
    businessRivalries.length +
    misanthropes.length;
  
  return {
    unrequitedLove,
    loveTriangles,
    extramaritalAffairs,
    asymmetricFriendships,
    rivalries,
    siblingRivalries,
    businessRivalries,
    misanthropes,
    totalDramaCount,
    timestamp: Date.now()
  };
}

/**
 * Excavate unrequited love cases
 * A loves B, but B doesn't love A
 */
async function excavateUnrequitedLove(worldId: string): Promise<UnrequitedLove[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const unrequitedCases: UnrequitedLove[] = [];
  
  for (const person1 of characters) {
    // Get who person1 loves (high spark)
    const person1Loves = await getCharactersLovedBy(person1.id);
    
    for (const person2Id of person1Loves) {
      // Check if person2 loves person1 back
      const person2Loves = await getCharactersLovedBy(person2Id);
      
      if (!person2Loves.includes(person1.id)) {
        // Unrequited!
        const person2 = await storage.getCharacter(person2Id);
        if (!person2) continue;
        
        const intensity = await getLoveIntensity(person1.id, person2Id);
        
        unrequitedCases.push({
          type: 'unrequited_love',
          lover: person1.id,
          nonreciprocator: person2Id,
          loverName: person1.firstName,
          nonreciprocatorName: person2.firstName,
          intensity,
          description: `${person1.firstName}'s love for ${person2.firstName} is not reciprocated 💔`
        });
      }
    }
  }
  
  return unrequitedCases;
}

/**
 * Excavate love triangles
 * A loves B, B loves C, C loves A (but none are mutual)
 */
async function excavateLoveTriangles(worldId: string): Promise<LoveTriangle[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const triangles: LoveTriangle[] = [];
  const processedSets = new Set<string>();
  
  for (const person1 of characters) {
    const person1Loves = await getCharactersLovedBy(person1.id);
    
    for (const person2Id of person1Loves) {
      // Check if person1's love is unrequited
      const person2Loves = await getCharactersLovedBy(person2Id);
      
      if (!person2Loves.includes(person1.id)) {
        // Person1 loves Person2 (unrequited), check who Person2 loves
        
        for (const person3Id of person2Loves) {
          // Check if person3 loves person1 (completing triangle)
          const person3Loves = await getCharactersLovedBy(person3Id);
          
          if (person3Loves.includes(person1.id) && !person2Loves.includes(person3Id)) {
            // Triangle found: 1→2, 2→3, 3→1
            
            // Create unique set ID to avoid duplicates
            const setId = [person1.id, person2Id, person3Id].sort().join('-');
            if (processedSets.has(setId)) continue;
            processedSets.add(setId);
            
            const person2 = await storage.getCharacter(person2Id);
            const person3 = await storage.getCharacter(person3Id);
            
            if (!person2 || !person3) continue;
            
            triangles.push({
              type: 'love_triangle',
              characters: [person1.id, person2Id, person3Id],
              names: [person1.firstName, person2.firstName, person3.firstName],
              pattern: '1→2→3→1',
              description: `Love triangle: ${person1.firstName} 💖 ${person2.firstName} 💖 ${person3.firstName} 💖 ${person1.firstName}`
            });
          }
        }
      }
    }
  }
  
  return triangles;
}

/**
 * Excavate extramarital affairs
 * Married person loves someone other than spouse
 */
async function excavateExtramaritalAffairs(worldId: string): Promise<ExtramaritalAffair[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const affairs: ExtramaritalAffair[] = [];
  
  for (const person of characters) {
    if (!person.spouseId) continue; // Not married
    
    const loves = await getCharactersLovedBy(person.id);
    
    // Check if they love someone other than spouse
    for (const loveId of loves) {
      if (loveId !== person.spouseId) {
        // Affair!
        const spouse = await storage.getCharacter(person.spouseId);
        const lover = await storage.getCharacter(loveId);
        
        if (!spouse || !lover) continue;
        
        const intensity = await getLoveIntensity(person.id, loveId);
        
        affairs.push({
          type: 'extramarital_affair',
          marriedPerson: person.id,
          spouse: person.spouseId,
          loveInterest: loveId,
          marriedPersonName: person.firstName,
          spouseName: spouse.firstName,
          loveInterestName: lover.firstName,
          intensity,
          description: `${person.firstName} is married to ${spouse.firstName}, but in love with ${lover.firstName} 💔💍`
        });
      }
    }
  }
  
  return affairs;
}

/**
 * Excavate asymmetric friendships
 * A considers B a friend, but B dislikes A
 */
async function excavateAsymmetricFriendships(worldId: string): Promise<AsymmetricFriendship[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const asymmetric: AsymmetricFriendship[] = [];
  
  for (const person1 of characters) {
    const person1Friends = await getFriends(person1.id);
    
    for (const person2Id of person1Friends) {
      // Check if person2 dislikes person1
      const dislikes = await characterDislikes(person2Id, person1.id);
      
      if (dislikes) {
        const person2 = await storage.getCharacter(person2Id);
        if (!person2) continue;
        
        asymmetric.push({
          type: 'asymmetric_friendship',
          friendlyPerson: person1.id,
          hostilePerson: person2Id,
          friendlyPersonName: person1.firstName,
          hostilePersonName: person2.firstName,
          description: `${person1.firstName} considers ${person2.firstName} a friend, but ${person2.firstName} dislikes ${person1.firstName} 😔`
        });
      }
    }
  }
  
  return asymmetric;
}

/**
 * Excavate rivalries
 * Mutual dislike between two characters
 */
async function excavateRivalries(worldId: string): Promise<Rivalry[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const rivalries: Rivalry[] = [];
  const processedPairs = new Set<string>();
  
  for (const person1 of characters) {
    const person1Dislikes = await getCharactersDislikedBy(person1.id);
    
    for (const person2Id of person1Dislikes) {
      // Create unique pair ID
      const pairId = [person1.id, person2Id].sort().join('-');
      if (processedPairs.has(pairId)) continue;
      processedPairs.add(pairId);
      
      // Check if person2 also dislikes person1 (mutual)
      const mutualDislike = await characterDislikes(person2Id, person1.id);
      
      if (mutualDislike) {
        const person2 = await storage.getCharacter(person2Id);
        if (!person2) continue;
        
        const intensity = await getDislikeIntensity(person1.id, person2Id);
        
        rivalries.push({
          type: 'rivalry',
          person1: person1.id,
          person2: person2Id,
          person1Name: person1.firstName,
          person2Name: person2.firstName,
          intensity,
          description: `${person1.firstName} and ${person2.firstName} are rivals ⚔️`
        });
      }
    }
  }
  
  return rivalries;
}

/**
 * Excavate sibling rivalries
 * Mutual dislike between siblings
 */
async function excavateSiblingRivalries(worldId: string): Promise<Rivalry[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const siblingRivalries: Rivalry[] = [];
  const processedPairs = new Set<string>();
  
  for (const person1 of characters) {
    const siblings = await getSiblings(person1.id);
    
    for (const person2Id of siblings) {
      // Create unique pair ID
      const pairId = [person1.id, person2Id].sort().join('-');
      if (processedPairs.has(pairId)) continue;
      processedPairs.add(pairId);
      
      // Check mutual dislike
      const person1DislikesPerson2 = await characterDislikes(person1.id, person2Id);
      const person2DislikesPerson1 = await characterDislikes(person2Id, person1.id);
      
      if (person1DislikesPerson2 && person2DislikesPerson1) {
        const person2 = await storage.getCharacter(person2Id);
        if (!person2) continue;
        
        const intensity = await getDislikeIntensity(person1.id, person2Id);
        
        siblingRivalries.push({
          type: 'sibling_rivalry',
          person1: person1.id,
          person2: person2Id,
          person1Name: person1.firstName,
          person2Name: person2.firstName,
          intensity,
          context: 'siblings',
          description: `${person1.firstName} and ${person2.firstName} are rival siblings 👫⚔️`
        });
      }
    }
  }
  
  return siblingRivalries;
}

/**
 * Excavate business rivalries
 * Mutual dislike between business owners in same industry
 */
async function excavateBusinessRivalries(worldId: string): Promise<Rivalry[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const businessRivalries: Rivalry[]= [];
  const processedPairs = new Set<string>();
  
  // Get all business owners
  const businessOwners: Array<{ ownerId: string; businessType: string }> = [];
  
  for (const character of characters) {
    const customData = (character as any).customData || {};
    const ownsBusiness = customData.ownsBusiness as string | undefined;
    const businessType = customData.businessType as string | undefined;
    
    if (ownsBusiness && businessType) {
      businessOwners.push({ ownerId: character.id, businessType });
    }
  }
  
  // Check for rivalries between owners of same business type
  for (let i = 0; i < businessOwners.length; i++) {
    for (let j = i + 1; j < businessOwners.length; j++) {
      const owner1 = businessOwners[i];
      const owner2 = businessOwners[j];
      
      if (owner1.businessType !== owner2.businessType) continue;
      
      // Create unique pair ID
      const pairId = [owner1.ownerId, owner2.ownerId].sort().join('-');
      if (processedPairs.has(pairId)) continue;
      processedPairs.add(pairId);
      
      // Check mutual dislike
      const mutualDislike1 = await characterDislikes(owner1.ownerId, owner2.ownerId);
      const mutualDislike2 = await characterDislikes(owner2.ownerId, owner1.ownerId);
      
      if (mutualDislike1 && mutualDislike2) {
        const person1 = await storage.getCharacter(owner1.ownerId);
        const person2 = await storage.getCharacter(owner2.ownerId);
        
        if (!person1 || !person2) continue;
        
        const intensity = await getDislikeIntensity(owner1.ownerId, owner2.ownerId);
        
        businessRivalries.push({
          type: 'business_rivalry',
          person1: owner1.ownerId,
          person2: owner2.ownerId,
          person1Name: person1.firstName,
          person2Name: person2.firstName,
          intensity,
          context: `${owner1.businessType} business owners`,
          description: `${person1.firstName} and ${person2.firstName} are rival ${owner1.businessType} owners 🏢⚔️`
        });
      }
    }
  }
  
  return businessRivalries;
}

/**
 * Excavate misanthropes
 * Characters who dislike many others
 */
async function excavateMisanthropes(worldId: string): Promise<Misanthrope[]> {
  const characters = await storage.getCharactersByWorld(worldId);
  const misanthropes: Misanthrope[] = [];
  
  for (const person of characters) {
    const disliked = await getCharactersDislikedBy(person.id);
    
    if (disliked.length >= THRESHOLDS.misanthropeThreshold) {
      misanthropes.push({
        type: 'misanthrope',
        person: person.id,
        personName: person.firstName,
        dislikedCount: disliked.length,
        description: `${person.firstName} is a misanthrope (dislikes ${disliked.length} people) 😤`
      });
    }
  }
  
  return misanthropes;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get characters loved by a person (spark > threshold)
 */
async function getCharactersLovedBy(characterId: string): Promise<string[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  const customData = (character as any).customData || {};
  const mentalModels = customData.mentalModels as Record<string, any> | undefined;
  
  if (!mentalModels) return [];
  
  const loved: string[] = [];
  
  for (const [otherId, model] of Object.entries(mentalModels)) {
    const spark = model.spark || 0;
    if (spark > THRESHOLDS.loveIntensity) {
      loved.push(otherId);
    }
  }
  
  return loved;
}

/**
 * Get characters disliked by a person (charge < threshold)
 */
async function getCharactersDislikedBy(characterId: string): Promise<string[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  const customData = (character as any).customData || {};
  const mentalModels = customData.mentalModels as Record<string, any> | undefined;
  
  if (!mentalModels) return [];
  
  const disliked: string[] = [];
  
  for (const [otherId, model] of Object.entries(mentalModels)) {
    const charge = model.charge || 0;
    if (charge < THRESHOLDS.dislikeIntensity) {
      disliked.push(otherId);
    }
  }
  
  return disliked;
}

/**
 * Check if character dislikes another
 */
async function characterDislikes(characterId: string, otherId: string): Promise<boolean> {
  const disliked = await getCharactersDislikedBy(characterId);
  return disliked.includes(otherId);
}

/**
 * Get friends of a character
 */
async function getFriends(characterId: string): Promise<string[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  const customData = (character as any).customData || {};
  return customData.friendIds as string[] || [];
}

/**
 * Get siblings of a character
 */
async function getSiblings(characterId: string): Promise<string[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  // Find characters with same parents
  const siblings: string[] = [];
  
  const customData = (character as any).customData || {};
  const motherId = customData.motherId as string | undefined;
  const fatherId = customData.fatherId as string | undefined;
  
  if (!motherId && !fatherId) return [];
  
  // Get all characters and find siblings
  const allCharacters = await storage.getCharactersByWorld(character.worldId);
  
  for (const other of allCharacters) {
    if (other.id === characterId) continue;
    
    const otherData = (other as any).customData || {};
    const otherMotherId = otherData.motherId as string | undefined;
    const otherFatherId = otherData.fatherId as string | undefined;
    
    if ((motherId && motherId === otherMotherId) || (fatherId && fatherId === otherFatherId)) {
      siblings.push(other.id);
    }
  }
  
  return siblings;
}

/**
 * Get love intensity between two characters
 */
async function getLoveIntensity(characterId: string, otherId: string): Promise<number> {
  const character = await storage.getCharacter(characterId);
  if (!character) return 0;
  
  const customData = (character as any).customData || {};
  const mentalModels = customData.mentalModels as Record<string, any> | undefined;
  
  if (!mentalModels || !mentalModels[otherId]) return 0;
  
  return (mentalModels[otherId].spark || 0) / 100; // Normalize to 0-1
}

/**
 * Get dislike intensity between two characters
 */
async function getDislikeIntensity(characterId: string, otherId: string): Promise<number> {
  const character = await storage.getCharacter(characterId);
  if (!character) return 0;
  
  const customData = (character as any).customData || {};
  const mentalModels = customData.mentalModels as Record<string, any> | undefined;
  
  if (!mentalModels || !mentalModels[otherId]) return 0;
  
  const charge = mentalModels[otherId].charge || 0;
  return Math.abs(charge) / 100; // Normalize to 0-1
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

/**
 * Generate story summary from drama analysis
 */
export function generateStorySummary(analysis: DramaAnalysis): string {
  const stories: string[] = [];
  
  if (analysis.totalDramaCount === 0) {
    return "The town is peaceful with no dramatic situations detected.";
  }
  
  stories.push(`**Dramatic Situations Detected: ${analysis.totalDramaCount}**\n`);
  
  if (analysis.unrequitedLove.length > 0) {
    stories.push(`\n💔 **Unrequited Love (${analysis.unrequitedLove.length})**:`);
    analysis.unrequitedLove.slice(0, 5).forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.loveTriangles.length > 0) {
    stories.push(`\n💖 **Love Triangles (${analysis.loveTriangles.length})**:`);
    analysis.loveTriangles.forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.extramaritalAffairs.length > 0) {
    stories.push(`\n💔💍 **Extramarital Affairs (${analysis.extramaritalAffairs.length})**:`);
    analysis.extramaritalAffairs.forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.rivalries.length > 0) {
    stories.push(`\n⚔️ **Rivalries (${analysis.rivalries.length})**:`);
    analysis.rivalries.slice(0, 5).forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.siblingRivalries.length > 0) {
    stories.push(`\n👫⚔️ **Sibling Rivalries (${analysis.siblingRivalries.length})**:`);
    analysis.siblingRivalries.forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.businessRivalries.length > 0) {
    stories.push(`\n🏢⚔️ **Business Rivalries (${analysis.businessRivalries.length})**:`);
    analysis.businessRivalries.forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.asymmetricFriendships.length > 0) {
    stories.push(`\n😔 **Asymmetric Friendships (${analysis.asymmetricFriendships.length})**:`);
    analysis.asymmetricFriendships.slice(0, 5).forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  if (analysis.misanthropes.length > 0) {
    stories.push(`\n😤 **Misanthropes (${analysis.misanthropes.length})**:`);
    analysis.misanthropes.forEach(drama => {
      stories.push(`- ${drama.description}`);
    });
  }
  
  return stories.join('\n');
}

/**
 * Get most interesting dramas (for UI highlights)
 */
export function getMostInterestingDramas(analysis: DramaAnalysis, limit: number = 10): DramaEvent[] {
  const allDramas: DramaEvent[] = [
    ...analysis.loveTriangles,
    ...analysis.extramaritalAffairs,
    ...analysis.siblingRivalries,
    ...analysis.businessRivalries,
    ...analysis.unrequitedLove,
    ...analysis.rivalries,
    ...analysis.asymmetricFriendships,
    ...analysis.misanthropes
  ];
  
  // Sort by "interestingness" (triangles and affairs most interesting)
  const priorities: Record<string, number> = {
    'love_triangle': 10,
    'extramarital_affair': 9,
    'sibling_rivalry': 8,
    'business_rivalry': 7,
    'unrequited_love': 6,
    'rivalry': 5,
    'asymmetric_friendship': 4,
    'misanthrope': 3
  };
  
  allDramas.sort((a, b) => (priorities[b.type] || 0) - (priorities[a.type] || 0));
  
  return allDramas.slice(0, limit);
}

// All functions are already exported above with 'export function' or 'export async function'
