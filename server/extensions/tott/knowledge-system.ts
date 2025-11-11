/**
 * Knowledge & Belief System (Phase 6)
 * 
 * Prolog-First Design:
 * - TypeScript utilities initialize and update knowledge predicates
 * - Prolog queries and reasons about knowledge during simulation
 * - Mental models track what characters know about others
 * - Beliefs formed from evidence, affected by trust
 * 
 * Based on Talk of the Town's mind.py and belief.py
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EvidenceType = 
  | 'observation'      // Directly observed
  | 'hearsay'         // Heard from someone else
  | 'direct_experience' // Personal interaction
  | 'rumor'           // Unverified information
  | 'testimony';      // Formal statement

export type KnownFact = 
  | 'name' | 'age' | 'occupation' | 'location' | 'spouse' 
  | 'family' | 'personality' | 'appearance' | 'residence';

export interface Evidence {
  type: EvidenceType;
  strength: number;  // 0-1
  timestamp: number;
  sourceId?: string;  // Who told them (for hearsay/rumor/testimony)
  description?: string;
}

export interface BeliefFacet {
  quality: string;  // 'friendly', 'trustworthy', 'greedy', 'brave', etc.
  confidence: number;  // 0-1
  evidence: Evidence[];
  lastUpdated: number;
  isTrue?: boolean;  // Optional: track if belief is actually true (for analysis)
}

export interface MentalModel {
  subjectId: string;
  confidence: number;  // 0-1, how well they know this person
  lastUpdated: number;  // Timestep when last interacted/learned
  
  // Known facts (boolean flags)
  knownFacts: {
    [K in KnownFact]?: boolean;
  };
  
  // Known specific values
  knownValues: {
    [attribute: string]: any;
  };
  
  // Beliefs about the subject
  beliefs: {
    [quality: string]: BeliefFacet;
  };
}

export interface CharacterKnowledge {
  mentalModels: {
    [subjectId: string]: MentalModel;
  };
}

export interface KnowledgePropagationResult {
  speakerId: string;
  listenerId: string;
  subjectId: string;
  factsShared: string[];
  valuesShared: string[];
  beliefsShared: string[];
  success: boolean;
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Mental model confidence
  initialConfidence: 0.1,  // Just met
  familyInitialConfidence: 0.6,  // Family members start higher
  coworkerInitialConfidence: 0.3,  // Coworkers start medium
  
  // Knowledge sharing
  minSalienceToShare: 0.3,  // Only share about salient people
  minTrustToAccept: 0.5,  // Need trust to accept hearsay
  maxTrustToReject: 0.3,  // Low trust = reject information
  
  // Belief formation
  minEvidenceForBelief: 1.0,  // Total evidence strength needed
  evidenceDecayRate: 0.01,  // Evidence weakens over time
  
  // Memory
  baseMemoryStrength: 0.5,
  strongMemoryThreshold: 0.8,
  memoryDecayMultiplier: 1000,  // Timesteps before decay matters
  
  // Evidence strength by type
  evidenceStrength: {
    direct_experience: 0.9,
    observation: 0.7,
    testimony: 0.6,
    hearsay: 0.4,
    rumor: 0.2
  }
};

// ============================================================================
// CORE FUNCTIONS: MENTAL MODEL MANAGEMENT
// ============================================================================

/**
 * Initialize a mental model when characters first meet
 */
export async function initializeMentalModel(
  observerId: string,
  subjectId: string,
  initialFacts: KnownFact[] = ['name'],
  relationshipType?: 'family' | 'coworker' | 'stranger',
  currentTimestep: number = 0
): Promise<MentalModel> {
  const observer = await storage.getCharacter(observerId);
  
  if (!observer) {
    throw new Error('Observer not found');
  }
  
  // Get or initialize knowledge structure
  const knowledge = (observer.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  
  // Check if mental model already exists
  if (knowledge.mentalModels[subjectId]) {
    return knowledge.mentalModels[subjectId];
  }
  
  // Determine initial confidence based on relationship
  let confidence = CONFIG.initialConfidence;
  if (relationshipType === 'family') {
    confidence = CONFIG.familyInitialConfidence;
  } else if (relationshipType === 'coworker') {
    confidence = CONFIG.coworkerInitialConfidence;
  }
  
  // Create mental model
  const knownFacts: { [K in KnownFact]?: boolean } = {};
  for (const fact of initialFacts) {
    knownFacts[fact] = true;
  }
  
  const mentalModel: MentalModel = {
    subjectId,
    confidence,
    lastUpdated: currentTimestep,
    knownFacts,
    knownValues: {},
    beliefs: {}
  };
  
  knowledge.mentalModels[subjectId] = mentalModel;
  
  // Save to database
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
  
  return mentalModel;
}

/**
 * Get mental model, creating if doesn't exist
 */
export async function getMentalModel(
  observerId: string,
  subjectId: string,
  createIfMissing: boolean = true,
  currentTimestep: number = 0
): Promise<MentalModel | null> {
  const observer = await storage.getCharacter(observerId);
  
  if (!observer) {
    return null;
  }
  
  const knowledge = (observer.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  
  if (knowledge.mentalModels[subjectId]) {
    return knowledge.mentalModels[subjectId];
  }
  
  if (createIfMissing) {
    return await initializeMentalModel(observerId, subjectId, ['name'], 'stranger', currentTimestep);
  }
  
  return null;
}

/**
 * Update mental model confidence
 */
export async function updateMentalModelConfidence(
  observerId: string,
  subjectId: string,
  confidenceDelta: number,
  currentTimestep: number
): Promise<number> {
  const model = await getMentalModel(observerId, subjectId, true, currentTimestep);
  
  if (!model) {
    throw new Error('Failed to get/create mental model');
  }
  
  model.confidence = Math.min(1.0, Math.max(0, model.confidence + confidenceDelta));
  model.lastUpdated = currentTimestep;
  
  const observer = await storage.getCharacter(observerId);
  const knowledge = (observer!.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  knowledge.mentalModels[subjectId] = model;
  
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
  
  return model.confidence;
}

// ============================================================================
// CORE FUNCTIONS: KNOWLEDGE FACTS
// ============================================================================

/**
 * Add a known fact
 */
export async function addKnownFact(
  observerId: string,
  subjectId: string,
  fact: KnownFact,
  currentTimestep: number = 0
): Promise<void> {
  const model = await getMentalModel(observerId, subjectId, true, currentTimestep);
  
  if (!model) {
    throw new Error('Failed to get/create mental model');
  }
  
  model.knownFacts[fact] = true;
  model.lastUpdated = currentTimestep;
  
  const observer = await storage.getCharacter(observerId);
  const knowledge = (observer!.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  knowledge.mentalModels[subjectId] = model;
  
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
}

/**
 * Add a known value
 */
export async function addKnownValue(
  observerId: string,
  subjectId: string,
  attribute: string,
  value: any,
  currentTimestep: number = 0
): Promise<void> {
  const model = await getMentalModel(observerId, subjectId, true, currentTimestep);
  
  if (!model) {
    throw new Error('Failed to get/create mental model');
  }
  
  model.knownValues[attribute] = value;
  model.lastUpdated = currentTimestep;
  
  const observer = await storage.getCharacter(observerId);
  const knowledge = (observer!.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  knowledge.mentalModels[subjectId] = model;
  
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
}

/**
 * Check if observer knows fact about subject
 */
export async function knowsFact(
  observerId: string,
  subjectId: string,
  fact: KnownFact
): Promise<boolean> {
  const model = await getMentalModel(observerId, subjectId, false);
  
  if (!model) {
    return false;
  }
  
  return model.knownFacts[fact] === true;
}

/**
 * Check if observer knows specific value
 */
export async function knowsValue(
  observerId: string,
  subjectId: string,
  attribute: string
): Promise<boolean> {
  const model = await getMentalModel(observerId, subjectId, false);
  
  if (!model) {
    return false;
  }
  
  return attribute in model.knownValues;
}

// ============================================================================
// CORE FUNCTIONS: BELIEFS
// ============================================================================

/**
 * Add or update a belief
 */
export async function addBelief(
  observerId: string,
  subjectId: string,
  quality: string,
  confidence: number,
  evidence: Evidence,
  currentTimestep: number = 0
): Promise<BeliefFacet> {
  const model = await getMentalModel(observerId, subjectId, true, currentTimestep);
  
  if (!model) {
    throw new Error('Failed to get/create mental model');
  }
  
  // Get or create belief
  let belief = model.beliefs[quality];
  
  if (!belief) {
    belief = {
      quality,
      confidence,
      evidence: [evidence],
      lastUpdated: currentTimestep
    };
  } else {
    // Add new evidence
    belief.evidence.push(evidence);
    
    // Recalculate confidence based on all evidence
    const totalStrength = belief.evidence.reduce((sum, e) => sum + e.strength, 0);
    const avgStrength = totalStrength / belief.evidence.length;
    belief.confidence = Math.min(1.0, avgStrength);
    belief.lastUpdated = currentTimestep;
  }
  
  model.beliefs[quality] = belief;
  model.lastUpdated = currentTimestep;
  
  const observer = await storage.getCharacter(observerId);
  const knowledge = (observer!.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  knowledge.mentalModels[subjectId] = model;
  
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
  
  return belief;
}

/**
 * Get belief about subject
 */
export async function getBelief(
  observerId: string,
  subjectId: string,
  quality: string
): Promise<BeliefFacet | null> {
  const model = await getMentalModel(observerId, subjectId, false);
  
  if (!model) {
    return null;
  }
  
  return model.beliefs[quality] || null;
}

/**
 * Update belief confidence based on new evidence
 */
export async function updateBelief(
  observerId: string,
  subjectId: string,
  quality: string,
  newEvidence: Evidence,
  currentTimestep: number
): Promise<BeliefFacet> {
  return await addBelief(observerId, subjectId, quality, 0, newEvidence, currentTimestep);
}

// ============================================================================
// CORE FUNCTIONS: KNOWLEDGE PROPAGATION
// ============================================================================

/**
 * Propagate knowledge from speaker to listener
 * This is called when characters converse
 */
export async function propagateKnowledge(
  speakerId: string,
  listenerId: string,
  subjectId: string,
  currentTimestep: number,
  trustOverride?: number
): Promise<KnowledgePropagationResult> {
  const speaker = await storage.getCharacter(speakerId);
  const listener = await storage.getCharacter(listenerId);
  
  if (!speaker || !listener) {
    throw new Error('Speaker or listener not found');
  }
  
  // Get speaker's knowledge about subject
  const speakerModel = await getMentalModel(speakerId, subjectId, false);
  
  if (!speakerModel) {
    return {
      speakerId,
      listenerId,
      subjectId,
      factsShared: [],
      valuesShared: [],
      beliefsShared: [],
      success: false,
      timestamp: currentTimestep
    };
  }
  
  // Check trust (from Phase 5 relationships)
  let trust = trustOverride !== undefined ? trustOverride : 0.5;
  
  const speakerKnowledge = (speaker.socialAttributes as any)?.relationshipDetails?.[listenerId];
  if (speakerKnowledge) {
    trust = speakerKnowledge.trust || 0.5;
  }
  
  // Get or create listener's mental model
  const listenerModel = await getMentalModel(listenerId, subjectId, true, currentTimestep);
  
  if (!listenerModel) {
    throw new Error('Failed to create listener mental model');
  }
  
  const factsShared: string[] = [];
  const valuesShared: string[] = [];
  const beliefsShared: string[] = [];
  
  // Share facts that speaker knows but listener doesn't
  for (const [fact, known] of Object.entries(speakerModel.knownFacts)) {
    if (known && !listenerModel.knownFacts[fact as KnownFact]) {
      // Listener learns fact if they trust speaker
      if (trust >= CONFIG.minTrustToAccept) {
        await addKnownFact(listenerId, subjectId, fact as KnownFact, currentTimestep);
        factsShared.push(fact);
      }
    }
  }
  
  // Share known values
  for (const [attr, value] of Object.entries(speakerModel.knownValues)) {
    if (!(attr in listenerModel.knownValues)) {
      if (trust >= CONFIG.minTrustToAccept) {
        await addKnownValue(listenerId, subjectId, attr, value, currentTimestep);
        valuesShared.push(attr);
      }
    }
  }
  
  // Share beliefs (as hearsay evidence)
  for (const [quality, belief] of Object.entries(speakerModel.beliefs)) {
    const hearsayStrength = belief.confidence * trust * CONFIG.evidenceStrength.hearsay;
    
    if (hearsayStrength > 0.2) {  // Only share strong beliefs
      const hearsayEvidence: Evidence = {
        type: 'hearsay',
        strength: hearsayStrength,
        timestamp: currentTimestep,
        sourceId: speakerId,
        description: `Heard from ${speaker.firstName}`
      };
      
      await addBelief(listenerId, subjectId, quality, hearsayStrength, hearsayEvidence, currentTimestep);
      beliefsShared.push(quality);
    }
  }
  
  return {
    speakerId,
    listenerId,
    subjectId,
    factsShared,
    valuesShared,
    beliefsShared,
    success: factsShared.length > 0 || valuesShared.length > 0 || beliefsShared.length > 0,
    timestamp: currentTimestep
  };
}

/**
 * Propagate all relevant knowledge during a conversation
 */
export async function propagateAllKnowledge(
  speakerId: string,
  listenerId: string,
  currentTimestep: number
): Promise<KnowledgePropagationResult[]> {
  const speaker = await storage.getCharacter(speakerId);
  
  if (!speaker) {
    return [];
  }
  
  const speakerKnowledge = (speaker.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  const results: KnowledgePropagationResult[] = [];
  
  // Get salience values from Phase 5
  const salience = (speaker.socialAttributes as any)?.salience || {};
  
  // Share knowledge about salient people
  for (const [subjectId, model] of Object.entries(speakerKnowledge.mentalModels)) {
    const salienceValue = salience[subjectId] || 0;
    
    // Only share about people who are sufficiently salient
    if (salienceValue >= CONFIG.minSalienceToShare) {
      const result = await propagateKnowledge(speakerId, listenerId, subjectId, currentTimestep);
      if (result.success) {
        results.push(result);
      }
    }
  }
  
  return results;
}

// ============================================================================
// CORE FUNCTIONS: INITIALIZATION HELPERS
// ============================================================================

/**
 * Initialize knowledge for all coworkers at a business
 */
export async function initializeCoworkerKnowledge(
  businessId: string,
  worldId: string,
  currentTimestep: number = 0
): Promise<number> {
  // Import from hiring system
  const { getBusinessEmployees } = await import('./hiring-system.js');
  const employees = await getBusinessEmployees(businessId, worldId);
  
  let initialized = 0;
  
  for (const employee1 of employees) {
    for (const employee2 of employees) {
      if (employee1.character.id !== employee2.character.id) {
        // Initialize mental model
        await initializeMentalModel(
          employee1.character.id,
          employee2.character.id,
          ['name', 'occupation'],
          'coworker',
          currentTimestep
        );
        
        // Add basic professional belief
        await addBelief(
          employee1.character.id,
          employee2.character.id,
          'professional',
          0.5,
          {
            type: 'observation',
            strength: 0.5,
            timestamp: currentTimestep,
            description: 'Works together'
          },
          currentTimestep
        );
        
        initialized++;
      }
    }
  }
  
  return initialized;
}

/**
 * Initialize knowledge for family members
 */
export async function initializeFamilyKnowledge(
  characterId: string,
  currentTimestep: number = 0
): Promise<number> {
  const character = await storage.getCharacter(characterId);
  
  if (!character) {
    return 0;
  }
  
  const familyIds = [
    ...(character.parentIds || []),
    ...(character.childIds || []),
    ...(character.immediateFamilyIds || [])
  ];
  
  let initialized = 0;
  
  for (const familyMemberId of familyIds) {
    await initializeMentalModel(
      characterId,
      familyMemberId,
      ['name', 'age', 'family', 'personality'],
      'family',
      currentTimestep
    );
    
    // Family members get strong trust belief
    await addBelief(
      characterId,
      familyMemberId,
      'trustworthy',
      0.8,
      {
        type: 'direct_experience',
        strength: 0.9,
        timestamp: currentTimestep,
        description: 'Family member'
      },
      currentTimestep
    );
    
    initialized++;
  }
  
  return initialized;
}

/**
 * Get complete knowledge summary for character
 */
export async function getKnowledgeSummary(observerId: string) {
  const observer = await storage.getCharacter(observerId);
  
  if (!observer) {
    throw new Error('Observer not found');
  }
  
  const knowledge = (observer.mentalModels as CharacterKnowledge) || { mentalModels: {} };
  
  return {
    observerId,
    totalMentalModels: Object.keys(knowledge.mentalModels).length,
    models: Object.entries(knowledge.mentalModels).map(([subjectId, model]) => ({
      subjectId,
      confidence: model.confidence,
      lastUpdated: model.lastUpdated,
      knownFactsCount: Object.values(model.knownFacts).filter(Boolean).length,
      knownValuesCount: Object.keys(model.knownValues).length,
      beliefsCount: Object.keys(model.beliefs).length,
      beliefs: Object.entries(model.beliefs).map(([quality, belief]) => ({
        quality,
        confidence: belief.confidence,
        evidenceCount: belief.evidence.length
      }))
    }))
  };
}
