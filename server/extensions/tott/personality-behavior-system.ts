/**
 * Personality-Driven Behavior System
 * 
 * Implements deep personality effects based on the Big Five model.
 * Based on Talk of the Town's personality.py and behavioral patterns.
 * 
 * This system makes characters with different personalities behave
 * fundamentally differently in all aspects of simulation.
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// PERSONALITY TYPES & CONSTANTS
// ============================================================================

export interface BigFivePersonality {
  openness: number;        // 0-1: Curious, imaginative vs. cautious, conventional
  conscientiousness: number; // 0-1: Organized, disciplined vs. spontaneous, careless
  extroversion: number;    // 0-1: Outgoing, energetic vs. solitary, reserved
  agreeableness: number;   // 0-1: Friendly, compassionate vs. critical, uncooperative
  neuroticism: number;     // 0-1: Anxious, sensitive vs. secure, confident
}

// TotT personality thresholds
const PERSONALITY_THRESHOLDS = {
  high: 0.7,
  medium: 0.5,
  low: 0.3
};

// ============================================================================
// CORE PERSONALITY EFFECTS
// ============================================================================

/**
 * Get personality from character
 */
export function getPersonality(character: Character): BigFivePersonality {
  const customData = (character as any).customData || {};
  return customData.personality || {
    openness: 0.5,
    conscientiousness: 0.5,
    extroversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5
  };
}

/**
 * Calculate social interaction desire based on personality
 * Extroverts seek more interactions, introverts fewer
 */
export function getSocialDesire(personality: BigFivePersonality): number {
  // Base on extroversion
  let desire = personality.extroversion;
  
  // Agreeableness makes characters more willing to interact
  desire += personality.agreeableness * 0.2;
  
  // Neuroticism makes characters more hesitant
  desire -= personality.neuroticism * 0.1;
  
  return Math.max(0.1, Math.min(1.0, desire));
}

/**
 * Calculate how many people a character prefers to be around
 * Extroverts like crowds, introverts prefer solitude/small groups
 */
export function getPreferredGroupSize(personality: BigFivePersonality): {
  min: number;
  max: number;
  ideal: number;
} {
  const extroversion = personality.extroversion;
  
  if (extroversion > PERSONALITY_THRESHOLDS.high) {
    // High extrovert: Loves crowds
    return { min: 3, max: 15, ideal: 8 };
  } else if (extroversion > PERSONALITY_THRESHOLDS.medium) {
    // Moderate: Likes small groups
    return { min: 2, max: 8, ideal: 4 };
  } else {
    // Introvert: Prefers solitude or pairs
    return { min: 0, max: 3, ideal: 1 };
  }
}

/**
 * Calculate conversation topic preferences
 */
export function getConversationPreferences(personality: BigFivePersonality): {
  preferredTopics: string[];
  avoidedTopics: string[];
  conversationLength: number; // Multiplier for conversation length
} {
  const topics: string[] = [];
  const avoided: string[] = [];
  
  // Openness affects intellectual/creative topics
  if (personality.openness > PERSONALITY_THRESHOLDS.high) {
    topics.push('ideas', 'philosophy', 'art', 'travel', 'innovation');
  } else if (personality.openness < PERSONALITY_THRESHOLDS.low) {
    topics.push('routine', 'tradition', 'family');
    avoided.push('abstract_ideas', 'change');
  }
  
  // Conscientiousness affects work/responsibility topics
  if (personality.conscientiousness > PERSONALITY_THRESHOLDS.high) {
    topics.push('work', 'plans', 'goals', 'organization');
  } else if (personality.conscientiousness < PERSONALITY_THRESHOLDS.low) {
    avoided.push('responsibility', 'deadlines');
  }
  
  // Extroversion affects social topics
  if (personality.extroversion > PERSONALITY_THRESHOLDS.high) {
    topics.push('gossip', 'social_events', 'parties');
  } else if (personality.extroversion < PERSONALITY_THRESHOLDS.low) {
    avoided.push('small_talk', 'gossip');
    topics.push('deep_conversation');
  }
  
  // Agreeableness affects conflict topics
  if (personality.agreeableness > PERSONALITY_THRESHOLDS.high) {
    avoided.push('conflict', 'criticism', 'competition');
    topics.push('cooperation', 'harmony');
  } else if (personality.agreeableness < PERSONALITY_THRESHOLDS.low) {
    topics.push('debate', 'criticism');
  }
  
  // Neuroticism affects emotional topics
  if (personality.neuroticism > PERSONALITY_THRESHOLDS.high) {
    topics.push('worries', 'problems', 'emotions');
  }
  
  // Conversation length based on extroversion
  const length = 0.5 + (personality.extroversion * 1.0); // 0.5x to 1.5x
  
  return {
    preferredTopics: topics,
    avoidedTopics: avoided,
    conversationLength: length
  };
}

/**
 * Calculate stress response based on personality
 * How characters react to negative events
 */
export function getStressResponse(personality: BigFivePersonality): {
  stressMultiplier: number; // How much stress they feel
  recoveryRate: number;     // How fast they recover
  copingStrategy: string;   // How they cope
} {
  // Neuroticism greatly affects stress
  const stressMultiplier = 0.5 + (personality.neuroticism * 1.5); // 0.5x to 2.0x
  
  // Conscientiousness and low neuroticism help recovery
  const recoveryRate = (personality.conscientiousness * 0.5) + ((1 - personality.neuroticism) * 0.5);
  
  // Determine coping strategy
  let copingStrategy = 'balanced';
  if (personality.extroversion > PERSONALITY_THRESHOLDS.high) {
    copingStrategy = 'social_support'; // Seek others
  } else if (personality.extroversion < PERSONALITY_THRESHOLDS.low) {
    copingStrategy = 'isolation'; // Withdraw
  } else if (personality.conscientiousness > PERSONALITY_THRESHOLDS.high) {
    copingStrategy = 'problem_solving'; // Plan and organize
  } else if (personality.openness > PERSONALITY_THRESHOLDS.high) {
    copingStrategy = 'creative_outlet'; // Art, hobbies
  }
  
  return { stressMultiplier, recoveryRate, copingStrategy };
}

/**
 * Calculate relationship formation speed
 * How quickly characters form attachments
 */
export function getRelationshipFormationRate(personality: BigFivePersonality): number {
  // Agreeableness makes friendships form faster
  let rate = personality.agreeableness * 0.6;
  
  // Extroversion helps too
  rate += personality.extroversion * 0.3;
  
  // Neuroticism slows it down (trust issues)
  rate -= personality.neuroticism * 0.1;
  
  return Math.max(0.2, Math.min(1.0, rate));
}

/**
 * Calculate risk-taking tendency
 * Used for major life decisions
 */
export function getRiskTolerance(personality: BigFivePersonality): number {
  // Openness encourages risk-taking
  let risk = personality.openness * 0.5;
  
  // Conscientiousness discourages it
  risk -= personality.conscientiousness * 0.3;
  
  // Neuroticism makes people cautious
  risk -= personality.neuroticism * 0.2;
  
  return Math.max(0.0, Math.min(1.0, risk));
}

/**
 * Calculate work ethic / productivity modifier
 */
export function getWorkEthic(personality: BigFivePersonality): number {
  // Conscientiousness is primary driver
  let ethic = personality.conscientiousness * 0.7;
  
  // Neuroticism can cause perfectionism
  if (personality.neuroticism > PERSONALITY_THRESHOLDS.high) {
    ethic += 0.2;
  }
  
  // Low agreeableness can mean competitiveness
  if (personality.agreeableness < PERSONALITY_THRESHOLDS.low) {
    ethic += 0.1;
  }
  
  return Math.max(0.3, Math.min(1.0, ethic));
}

// ============================================================================
// BEHAVIORAL DECISION MODIFIERS
// ============================================================================

/**
 * Should character attend a social event?
 * Based on TotT's event attendance patterns
 */
export function shouldAttendSocialEvent(
  personality: BigFivePersonality,
  eventSize: number,
  isRequired: boolean
): { shouldAttend: boolean; probability: number } {
  if (isRequired) return { shouldAttend: true, probability: 1.0 };
  
  const groupPref = getPreferredGroupSize(personality);
  
  // Base probability from extroversion
  let probability = personality.extroversion * 0.6 + 0.2; // 0.2 to 0.8
  
  // Adjust for event size preference
  if (eventSize < groupPref.min) {
    probability *= 0.5; // Too small/boring
  } else if (eventSize > groupPref.max) {
    probability *= 0.4; // Too crowded/overwhelming
  } else if (eventSize === groupPref.ideal) {
    probability *= 1.5; // Perfect size
  }
  
  // Agreeableness makes them more likely to attend (social obligation)
  probability += personality.agreeableness * 0.2;
  
  // Neuroticism makes them hesitant (social anxiety)
  probability -= personality.neuroticism * 0.15;
  
  return {
    shouldAttend: Math.random() < probability,
    probability: Math.max(0, Math.min(1, probability))
  };
}

/**
 * How does character react to conflict?
 */
export function getConflictResponse(personality: BigFivePersonality): {
  style: 'avoid' | 'confront' | 'compromise' | 'dominate' | 'submit';
  intensity: number;
} {
  // Agreeableness strongly affects conflict style
  if (personality.agreeableness > PERSONALITY_THRESHOLDS.high) {
    if (personality.extroversion > PERSONALITY_THRESHOLDS.medium) {
      return { style: 'compromise', intensity: 0.3 };
    } else {
      return { style: 'submit', intensity: 0.2 };
    }
  } else if (personality.agreeableness < PERSONALITY_THRESHOLDS.low) {
    if (personality.extroversion > PERSONALITY_THRESHOLDS.medium) {
      return { style: 'dominate', intensity: 0.8 };
    } else {
      return { style: 'confront', intensity: 0.6 };
    }
  }
  
  // Medium agreeableness
  if (personality.neuroticism > PERSONALITY_THRESHOLDS.high) {
    return { style: 'avoid', intensity: 0.4 };
  } else {
    return { style: 'compromise', intensity: 0.5 };
  }
}

/**
 * How likely to initiate conversation with stranger?
 */
export function getStrangerApproachProbability(personality: BigFivePersonality): number {
  // Extroversion is primary
  let prob = personality.extroversion * 0.6;
  
  // Openness helps (curiosity)
  prob += personality.openness * 0.2;
  
  // Neuroticism hinders (social anxiety)
  prob -= personality.neuroticism * 0.2;
  
  return Math.max(0.01, Math.min(0.9, prob));
}

/**
 * How likely to help someone in need?
 */
export function getHelpingProbability(
  personality: BigFivePersonality,
  relationship: number = 0.5 // 0-1, how well they know the person
): number {
  // Agreeableness is primary
  let prob = personality.agreeableness * 0.6;
  
  // Conscientiousness (sense of duty)
  prob += personality.conscientiousness * 0.2;
  
  // Existing relationship amplifies
  prob += relationship * 0.3;
  
  // Neuroticism reduces (self-preservation)
  prob -= personality.neuroticism * 0.1;
  
  return Math.max(0.1, Math.min(0.95, prob));
}

/**
 * How likely to gossip/share information?
 */
export function getGossipProbability(personality: BigFivePersonality): number {
  // Extroversion drives gossip
  let prob = personality.extroversion * 0.5;
  
  // Low conscientiousness (less discretion)
  prob += (1 - personality.conscientiousness) * 0.3;
  
  // High agreeableness reduces (don't want to hurt)
  if (personality.agreeableness > PERSONALITY_THRESHOLDS.high) {
    prob *= 0.5;
  }
  
  return Math.max(0.1, Math.min(0.8, prob));
}

/**
 * Location preference at different times of day
 */
export function getLocationPreferences(personality: BigFivePersonality): {
  morning: string[];
  afternoon: string[];
  evening: string[];
  night: string[];
} {
  const prefs = {
    morning: ['home'],
    afternoon: ['work'],
    evening: ['home'],
    night: ['home']
  };
  
  // Extroverts prefer social locations
  if (personality.extroversion > PERSONALITY_THRESHOLDS.high) {
    prefs.afternoon.push('social_venue', 'public_space');
    prefs.evening.push('bar', 'restaurant', 'social_event');
    prefs.night.push('bar', 'party');
  } else if (personality.extroversion < PERSONALITY_THRESHOLDS.low) {
    // Introverts stay home more
    prefs.afternoon.push('home', 'library');
    prefs.evening = ['home'];
    prefs.night = ['home'];
  }
  
  // Conscientious people have more structured routines
  if (personality.conscientiousness > PERSONALITY_THRESHOLDS.high) {
    prefs.morning = ['home', 'gym'];
    prefs.afternoon = ['work', 'errands'];
  }
  
  // Open people explore more
  if (personality.openness > PERSONALITY_THRESHOLDS.high) {
    prefs.afternoon.push('museum', 'park', 'bookstore');
    prefs.evening.push('cultural_event', 'class');
  }
  
  return prefs;
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Apply personality modifier to any probability
 * Useful for applying personality effects to existing systems
 */
export function applyPersonalityModifier(
  baseProbability: number,
  personality: BigFivePersonality,
  trait: keyof BigFivePersonality,
  strength: number = 0.3 // How much personality affects (0-1)
): number {
  const traitValue = personality[trait];
  
  // Center trait around 0.5, so 0.5 = no effect
  const deviation = (traitValue - 0.5) * 2; // -1 to +1
  
  // Apply modifier
  const modified = baseProbability * (1 + (deviation * strength));
  
  return Math.max(0, Math.min(1, modified));
}

/**
 * Get personality-based action weights
 * For use with volition/action selection systems
 */
export function getActionWeights(
  personality: BigFivePersonality,
  actionType: string
): number {
  let weight = 1.0;
  
  switch (actionType) {
    case 'socialize':
      weight *= (0.5 + personality.extroversion);
      break;
    case 'work':
      weight *= (0.5 + personality.conscientiousness);
      break;
    case 'explore':
      weight *= (0.5 + personality.openness);
      break;
    case 'help':
      weight *= (0.5 + personality.agreeableness);
      break;
    case 'avoid':
      weight *= (0.5 + personality.neuroticism);
      break;
    case 'compete':
      weight *= (0.5 + (1 - personality.agreeableness));
      break;
    case 'create':
      weight *= (0.5 + personality.openness);
      break;
    case 'relax':
      weight *= (0.5 + (1 - personality.conscientiousness));
      break;
  }
  
  return Math.max(0.1, weight);
}

// ============================================================================
// PERSONALITY GENERATION
// ============================================================================

/**
 * Generate random personality with optional parent inheritance
 * Based on TotT's genetic personality inheritance
 */
export function generatePersonality(
  parent1Personality?: BigFivePersonality,
  parent2Personality?: BigFivePersonality
): BigFivePersonality {
  if (!parent1Personality && !parent2Personality) {
    // Random personality
    return {
      openness: Math.random(),
      conscientiousness: Math.random(),
      extroversion: Math.random(),
      agreeableness: Math.random(),
      neuroticism: Math.random()
    };
  }
  
  // Inherit from parents with mutation
  const traits: (keyof BigFivePersonality)[] = [
    'openness', 'conscientiousness', 'extroversion', 'agreeableness', 'neuroticism'
  ];
  
  const personality: any = {};
  
  for (const trait of traits) {
    let value: number;
    
    if (parent1Personality && parent2Personality) {
      // Average of parents with small random mutation
      value = (parent1Personality[trait] + parent2Personality[trait]) / 2;
      value += (Math.random() - 0.5) * 0.2; // ±10% mutation
    } else if (parent1Personality) {
      // Single parent with larger mutation
      value = parent1Personality[trait];
      value += (Math.random() - 0.5) * 0.3; // ±15% mutation
    } else {
      // Single parent (parent2)
      value = parent2Personality![trait];
      value += (Math.random() - 0.5) * 0.3;
    }
    
    personality[trait] = Math.max(0, Math.min(1, value));
  }
  
  return personality as BigFivePersonality;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const PersonalityBehavior = {
  getPersonality,
  getSocialDesire,
  getPreferredGroupSize,
  getConversationPreferences,
  getStressResponse,
  getRelationshipFormationRate,
  getRiskTolerance,
  getWorkEthic,
  shouldAttendSocialEvent,
  getConflictResponse,
  getStrangerApproachProbability,
  getHelpingProbability,
  getGossipProbability,
  getLocationPreferences,
  applyPersonalityModifier,
  getActionWeights,
  generatePersonality
};
