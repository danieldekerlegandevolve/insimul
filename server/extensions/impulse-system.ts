/**
 * Impulse System Extension for Insimul
 * Adds character impulses that decay over time to the existing system
 */

import { storage } from '../storage';
import type { Character } from '../../shared/schema';

export type ImpulseType = 'romantic' | 'aggressive' | 'social' | 'creative' | 'fearful';

export interface CharacterImpulse {
  type: ImpulseType;
  target?: string;
  strength: number; // 0.0 to 1.0
  decay: number; // per time unit
  timestamp: number;
}

/**
 * Add or update an impulse in a character's mentalModels
 */
export async function addImpulse(
  characterId: string,
  type: ImpulseType,
  strength: number,
  target?: string
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  // Use existing mentalModels field for impulses
  const mentalModels = character.mentalModels || {};
  const impulses = mentalModels.impulses || {};
  
  const key = target ? `${type}:${target}` : type;
  
  // Add or update impulse
  impulses[key] = {
    type,
    target,
    strength: Math.min(1, Math.max(0, strength)),
    decay: 0.05, // Default decay rate
    timestamp: Date.now()
  };
  
  // Update character using existing storage
  await storage.updateCharacter(characterId, {
    mentalModels: {
      ...mentalModels,
      impulses
    }
  });
}

/**
 * Get current impulse strength (with decay applied)
 */
export async function getImpulseStrength(
  characterId: string,
  type: ImpulseType,
  target?: string
): Promise<number> {
  const character = await storage.getCharacter(characterId);
  if (!character?.mentalModels?.impulses) return 0;
  
  const key = target ? `${type}:${target}` : type;
  const impulse = character.mentalModels.impulses[key];
  if (!impulse) return 0;
  
  // Apply exponential decay based on time passed
  const timePassed = (Date.now() - impulse.timestamp) / (1000 * 60 * 60); // Hours
  const decayedStrength = impulse.strength * Math.exp(-impulse.decay * timePassed);
  
  return Math.max(0, decayedStrength);
}

/**
 * Check impulse condition for rules
 */
export async function checkImpulseCondition(
  characterId: string,
  type: ImpulseType,
  minStrength: number,
  target?: string
): Promise<boolean> {
  const strength = await getImpulseStrength(characterId, type, target);
  return strength >= minStrength;
}

/**
 * Decay all impulses for a character
 */
export async function decayImpulses(characterId: string): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character?.mentalModels?.impulses) return;
  
  const impulses = character.mentalModels.impulses;
  const now = Date.now();
  const updatedImpulses: Record<string, any> = {};
  
  for (const [key, impulse] of Object.entries(impulses)) {
    const imp = impulse as CharacterImpulse;
    const timePassed = (now - imp.timestamp) / (1000 * 60 * 60); // Hours
    const decayedStrength = imp.strength * Math.exp(-imp.decay * timePassed);
    
    if (decayedStrength > 0.01) {
      updatedImpulses[key] = {
        type: imp.type,
        target: imp.target,
        strength: decayedStrength,
        decay: imp.decay,
        timestamp: now
      };
    }
  }
  
  await storage.updateCharacter(characterId, {
    mentalModels: {
      ...character.mentalModels,
      impulses: updatedImpulses
    }
  });
}
