/**
 * Relationship Utilities for Insimul
 * Enhances the existing relationship system with directional support
 */

import { storage } from '../storage';
import type { Character } from '../../shared/schema';

export interface DirectionalRelationship {
  type: string; // romantic, friendship, rivalry, etc.
  strength: number; // -1.0 to 1.0
  reciprocal?: number; // Strength in opposite direction
  lastModified: number;
}

/**
 * Set a directional relationship using the existing relationships field
 */
export async function setRelationship(
  fromCharacterId: string,
  toCharacterId: string,
  type: string,
  strength: number,
  reciprocal?: number
): Promise<void> {
  const fromChar = await storage.getCharacter(fromCharacterId);
  if (!fromChar) return;
  
  // Use existing relationships field
  const relationships = fromChar.relationships || {};
  
  // Store relationship data
  relationships[toCharacterId] = {
    type,
    strength: Math.max(-1, Math.min(1, strength)),
    reciprocal,
    lastModified: Date.now()
  };
  
  await storage.updateCharacter(fromCharacterId, { relationships });
  
  // If reciprocal is specified, also set the reverse relationship
  if (reciprocal !== undefined) {
    const toChar = await storage.getCharacter(toCharacterId);
    if (toChar) {
      const toRelationships = toChar.relationships || {};
      toRelationships[fromCharacterId] = {
        type,
        strength: Math.max(-1, Math.min(1, reciprocal)),
        reciprocal: strength,
        lastModified: Date.now()
      };
      await storage.updateCharacter(toCharacterId, { relationships: toRelationships });
    }
  }
}

/**
 * Get relationship strength between characters
 */
export async function getRelationshipStrength(
  fromCharacterId: string,
  toCharacterId: string
): Promise<number> {
  const character = await storage.getCharacter(fromCharacterId);
  if (!character?.relationships?.[toCharacterId]) return 0;
  
  return character.relationships[toCharacterId].strength || 0;
}

/**
 * Check directional relationship condition for rules
 * Supports >Self (forward), <Other (backward), <>Both (mutual)
 */
export async function checkDirectionalRelationship(
  selfId: string,
  otherId: string,
  operator: string,
  type?: string,
  minStrength?: number
): Promise<boolean> {
  switch (operator) {
    case '>':
    case '>Self':
      // Check relationship from Self to Other
      const forward = await getRelationshipStrength(selfId, otherId);
      if (minStrength !== undefined && forward < minStrength) return false;
      if (type) {
        const char = await storage.getCharacter(selfId);
        if (char?.relationships?.[otherId]?.type !== type) return false;
      }
      return true;
      
    case '<':
    case '<Other':
      // Check relationship from Other to Self
      const backward = await getRelationshipStrength(otherId, selfId);
      if (minStrength !== undefined && backward < minStrength) return false;
      if (type) {
        const char = await storage.getCharacter(otherId);
        if (char?.relationships?.[selfId]?.type !== type) return false;
      }
      return true;
      
    case '<>':
    case '<>Both':
      // Check mutual relationship
      const rel1 = await getRelationshipStrength(selfId, otherId);
      const rel2 = await getRelationshipStrength(otherId, selfId);
      if (minStrength !== undefined && (rel1 < minStrength || rel2 < minStrength)) return false;
      if (Math.abs(rel1 - rel2) > 0.3) return false; // Not mutual enough
      if (type) {
        const char1 = await storage.getCharacter(selfId);
        const char2 = await storage.getCharacter(otherId);
        if (char1?.relationships?.[otherId]?.type !== type) return false;
        if (char2?.relationships?.[selfId]?.type !== type) return false;
      }
      return true;
      
    default:
      return false;
  }
}

/**
 * Modify relationship strength
 */
export async function modifyRelationship(
  fromCharacterId: string,
  toCharacterId: string,
  change: number,
  cause?: string
): Promise<void> {
  const character = await storage.getCharacter(fromCharacterId);
  if (!character) return;
  
  const relationships = character.relationships || {};
  const current = relationships[toCharacterId] || { 
    type: 'acquaintance', 
    strength: 0,
    lastModified: Date.now()
  };
  
  current.strength = Math.max(-1, Math.min(1, current.strength + change));
  current.lastModified = Date.now();
  
  // Add to character's thoughts for history
  const thoughts = character.thoughts || [];
  thoughts.push({
    timestamp: Date.now(),
    content: `Relationship with ${toCharacterId} changed by ${change} (${cause || 'unknown'})`
  });
  
  await storage.updateCharacter(fromCharacterId, { 
    relationships,
    thoughts: thoughts.slice(-100) // Keep last 100 thoughts
  });
}

/**
 * Get all relationships for a character
 */
export async function getCharacterRelationships(characterId: string): Promise<Record<string, DirectionalRelationship>> {
  const character = await storage.getCharacter(characterId);
  return character?.relationships || {};
}

/**
 * Query relationships across world
 */
export async function queryRelationships(
  worldId: string,
  filter?: {
    type?: string;
    minStrength?: number;
    maxStrength?: number;
  }
): Promise<Array<{ from: string; to: string; relationship: DirectionalRelationship }>> {
  const characters = await storage.getCharactersByWorld(worldId);
  const results: Array<{ from: string; to: string; relationship: DirectionalRelationship }> = [];
  
  for (const character of characters) {
    if (character.relationships) {
      for (const [targetId, rel] of Object.entries(character.relationships)) {
        if (filter) {
          if (filter.type && rel.type !== filter.type) continue;
          if (filter.minStrength !== undefined && rel.strength < filter.minStrength) continue;
          if (filter.maxStrength !== undefined && rel.strength > filter.maxStrength) continue;
        }
        results.push({
          from: character.id,
          to: targetId,
          relationship: rel
        });
      }
    }
  }
  
  return results;
}
