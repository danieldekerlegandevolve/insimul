/**
 * Volition System Extension for Insimul
 * Adds weighted action selection to the existing rule system
 */

import { storage } from '../../db/storage';
import type { Rule } from '../../../shared/schema';
import { checkImpulseCondition } from './impulse-system';
import { checkDirectionalRelationship } from '../tott/relationship-utils';

export interface VolitionRule extends Rule {
  weight?: number; // Base weight for volition selection
}

/**
 * Select an action from available volition rules
 */
export async function selectVolition(
  characterId: string,
  worldId: string
): Promise<Rule | null> {
  // Get all volition-type rules for this world
  const allRules = await storage.getRulesByWorld(worldId);
  const volitionRules = allRules.filter(r => r.ruleType === 'volition');
  
  if (volitionRules.length === 0) return null;
  
  // Evaluate which rules have their conditions met
  const availableVolitions: Array<{ rule: Rule; weight: number }> = [];
  
  for (const rule of volitionRules) {
    const conditionsMet = await evaluateConditions(rule, characterId);
    if (conditionsMet) {
      // Calculate weight (use priority as base weight if not specified)
      const baseWeight = (rule as any).weight || rule.priority || 5;
      
      // Apply modifiers based on current state
      const modifiedWeight = await applyWeightModifiers(rule, characterId, baseWeight);
      
      availableVolitions.push({ rule, weight: modifiedWeight });
    }
  }
  
  if (availableVolitions.length === 0) return null;
  
  // Weighted random selection
  const totalWeight = availableVolitions.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const volition of availableVolitions) {
    random -= volition.weight;
    if (random <= 0) {
      // Store selection in character's socialAttributes for history
      const character = await storage.getCharacter(characterId);
      if (character) {
        const socialAttributes = character.socialAttributes || {};
        socialAttributes.lastVolition = {
          ruleId: volition.rule.id,
          name: volition.rule.name,
          weight: volition.weight,
          timestamp: Date.now()
        };
        await storage.updateCharacter(characterId, { socialAttributes });
      }
      
      return volition.rule;
    }
  }
  
  return availableVolitions[availableVolitions.length - 1].rule;
}

/**
 * Evaluate rule conditions
 */
async function evaluateConditions(rule: Rule, characterId: string): Promise<boolean> {
  if (!rule.conditions || rule.conditions.length === 0) return true;
  
  for (const condition of rule.conditions) {
    let met = false;
    
    // Handle different condition types
    switch (condition.type) {
      case 'predicate':
        // Handle impulse conditions
        if (condition.predicate === 'has_impulse' || condition.predicate === 'impulse') {
          const type = condition.value?.type || condition.first;
          const minStrength = condition.value?.strength || 0.5;
          const target = condition.second;
          met = await checkImpulseCondition(characterId, type, minStrength, target);
        }
        // Handle relationship conditions
        else if (condition.predicate === 'relationship') {
          const operator = condition.first || '>';
          const otherId = condition.second;
          const type = condition.value?.type;
          const minStrength = condition.value?.strength;
          met = await checkDirectionalRelationship(characterId, otherId, operator, type, minStrength);
        }
        // Handle other predicates through character data
        else {
          const character = await storage.getCharacter(characterId);
          if (character) {
            // Check various character attributes
            if (condition.predicate === 'has_trait' && condition.first) {
              // Traits could be stored in socialAttributes or personality
              const traits = character.socialAttributes?.traits;
              met = Array.isArray(traits) && traits.includes(condition.first);
            } else if (condition.predicate === 'occupation' && condition.value) {
              met = character.occupation === condition.value;
            }
            // Add more predicate checks as needed
          }
        }
        break;
        
      case 'comparison':
        // Handle numeric comparisons
        const character = await storage.getCharacter(characterId);
        if (character) {
          const value = getNestedValue(character, condition.first || '');
          met = compareValues(value, condition.operator || 'equals', condition.value);
        }
        break;
        
      // Add more condition types as needed
    }
    
    if (!met) return false;
  }
  
  return true;
}

/**
 * Apply weight modifiers based on character state
 */
async function applyWeightModifiers(
  rule: Rule,
  characterId: string,
  baseWeight: number
): Promise<number> {
  let weight = baseWeight;
  const character = await storage.getCharacter(characterId);
  if (!character) return weight;
  
  // Apply impulse-based modifiers
  if (character.mentalModels?.impulses) {
    const ruleName = rule.name.toLowerCase();
    
    // Boost weight based on relevant impulses
    if (ruleName.includes('romantic') && character.mentalModels.impulses.romantic) {
      weight *= 1 + (character.mentalModels.impulses.romantic.strength * 0.5);
    }
    if (ruleName.includes('aggressive') && character.mentalModels.impulses.aggressive) {
      weight *= 1 + (character.mentalModels.impulses.aggressive.strength * 0.5);
    }
    if (ruleName.includes('social') && character.mentalModels.impulses.social) {
      weight *= 1 + (character.mentalModels.impulses.social.strength * 0.3);
    }
  }
  
  // Apply relationship-based modifiers
  if (rule.tags?.includes('relationship') && character.relationships) {
    const relationshipCount = Object.keys(character.relationships).length;
    weight *= 1 + (relationshipCount * 0.1); // More relationships = more social actions
  }
  
  // Apply personality-based modifiers
  if (character.personality) {
    if (rule.tags?.includes('social') && character.personality.extroversion) {
      weight *= 1 + (character.personality.extroversion * 0.3);
    }
    if (rule.tags?.includes('creative') && character.personality.openness) {
      weight *= 1 + (character.personality.openness * 0.3);
    }
  }
  
  return Math.max(0.1, weight); // Ensure weight stays positive
}

/**
 * Helper: Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current?.[part] === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Helper: Compare values
 */
function compareValues(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case 'equals': return actual === expected;
    case 'greater': return actual > expected;
    case 'less': return actual < expected;
    case 'exists': return actual !== undefined && actual !== null;
    default: return false;
  }
}
