/**
 * Artifact & Signal System
 * 
 * Implements objects with history that trigger thoughts and transmit knowledge.
 * Based on Talk of the Town's artifact.py system.
 * 
 * Features:
 * - Artifacts (photos, documents, gravestones, heirlooms)
 * - Signal transmission (objects trigger memories/thoughts)
 * - Emotional associations
 * - Provenance tracking
 * - Knowledge transfer through objects
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type ArtifactType = 
  | 'photograph' 
  | 'gravestone' 
  | 'document' 
  | 'heirloom' 
  | 'letter'
  | 'diary'
  | 'wedding_ring'
  | 'painting'
  | 'book';

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  description: string;
  
  // Origin
  createdAt: number;               // Timestep created
  createdBy: string | null;        // Character ID who created it
  originEvent: string | null;      // Event that created it (wedding, death, etc.)
  
  // Subjects (people/places in the artifact)
  subjects: string[];              // Character IDs depicted/mentioned
  location: string | null;         // Place depicted (if any)
  
  // Ownership & location
  currentOwner: string | null;     // Character ID who owns it
  currentLocation: string | null;  // Where it currently is
  provenance: Array<{              // Ownership history
    owner: string;
    from: number;
    to: number | null;
    reason: string;
  }>;
  
  // Knowledge transmission
  transmitsKnowledge: {
    facts: string[];               // What facts it reveals
    relationships: string[];       // What relationships it shows
    events: string[];              // What events it documents
  };
  
  // Emotional associations
  emotionalValue: number;          // 0-1, how emotionally significant
  sentimentalTo: string[];         // Character IDs who find it sentimental
  
  // State
  condition: 'pristine' | 'good' | 'worn' | 'damaged' | 'destroyed';
  isPublic: boolean;               // Can anyone see it (e.g., gravestone)
  destroyed: boolean;
  destroyedAt: number | null;
}

export interface Signal {
  artifactId: string;
  observerId: string;
  timestamp: number;
  knowledgeGained: string[];       // What was learned
  emotionalResponse: {
    type: 'joy' | 'sadness' | 'nostalgia' | 'anger' | 'neutral';
    intensity: number;              // 0-1
  };
  thoughtsTriggered: string[];     // Thoughts/memories evoked
}

// ============================================================================
// ARTIFACT CREATION
// ============================================================================

/**
 * Create a photograph
 */
export async function createPhotograph(
  subjects: string[],
  photographer: string | null,
  location: string | null,
  worldId: string,
  currentTimestep: number
): Promise<Artifact> {
  const subjectNames = await Promise.all(
    subjects.map(async id => {
      const char = await storage.getCharacter(id);
      return char?.firstName || 'Unknown';
    })
  );
  
  const artifact: Artifact = {
    id: generateArtifactId(),
    type: 'photograph',
    name: `Photograph of ${subjectNames.join(', ')}`,
    description: `A photograph capturing ${subjectNames.join(', ')}${location ? ` at ${location}` : ''}`,
    createdAt: currentTimestep,
    createdBy: photographer,
    originEvent: 'photograph_taken',
    subjects,
    location,
    currentOwner: photographer,
    currentLocation: null,
    provenance: photographer ? [{
      owner: photographer,
      from: currentTimestep,
      to: null,
      reason: 'photographer'
    }] : [],
    transmitsKnowledge: {
      facts: subjects.map(id => `appearance of ${id}`),
      relationships: [],
      events: []
    },
    emotionalValue: 0.6 + (Math.random() * 0.3), // 0.6-0.9
    sentimentalTo: [...subjects, ...(photographer ? [photographer] : [])],
    condition: 'pristine',
    isPublic: false,
    destroyed: false,
    destroyedAt: null
  };
  
  await saveArtifact(artifact, worldId);
  
  console.log(`📸 Photograph created: ${artifact.name}`);
  
  return artifact;
}

/**
 * Create a gravestone when someone dies
 */
export async function createGravestone(
  deceasedId: string,
  worldId: string,
  cemeteryLocation: string,
  currentTimestep: number
): Promise<Artifact> {
  const deceased = await storage.getCharacter(deceasedId);
  if (!deceased) throw new Error('Deceased character not found');
  
  const customData = (deceased as any).customData || {};
  const birthYear = customData.birthYear as number || 1900;
  const deathYear = customData.deathYear as number || currentTimestep;
  
  // Generate inscription
  const familyRoles: string[] = [];
  if (deceased.spouseId) {
    familyRoles.push(deceased.gender === 'male' ? 'Husband' : 'Wife');
  }
  
  const children = customData.childIds as string[] || [];
  if (children.length > 0) {
    familyRoles.push(deceased.gender === 'male' ? 'Father' : 'Mother');
  }
  
  const occupation = customData.occupation as string | undefined;
  
  const roleText = familyRoles.length > 0 ? `A loving ${familyRoles.join(' and ')}` : '';
  const occupationText = occupation ? `\n${occupation}` : '';
  
  const inscription = `Here lies\n${deceased.firstName} ${deceased.lastName}\n${birthYear} - ${deathYear}${occupationText}\n${roleText}\nRest in Peace`;
  
  const artifact: Artifact = {
    id: generateArtifactId(),
    type: 'gravestone',
    name: `Gravestone of ${deceased.firstName} ${deceased.lastName}`,
    description: inscription,
    createdAt: currentTimestep,
    createdBy: null,
    originEvent: 'death',
    subjects: [deceasedId],
    location: cemeteryLocation,
    currentOwner: null,
    currentLocation: cemeteryLocation,
    provenance: [],
    transmitsKnowledge: {
      facts: [
        `${deceasedId} died`,
        `${deceasedId} birth year: ${birthYear}`,
        `${deceasedId} death year: ${deathYear}`,
        ...(occupation ? [`${deceasedId} occupation: ${occupation}`] : [])
      ],
      relationships: [],
      events: ['death']
    },
    emotionalValue: 0.9,
    sentimentalTo: [
      ...(deceased.spouseId ? [deceased.spouseId] : []),
      ...children
    ],
    condition: 'pristine',
    isPublic: true,  // Anyone can visit
    destroyed: false,
    destroyedAt: null
  };
  
  await saveArtifact(artifact, worldId);
  
  console.log(`🪦 Gravestone erected: ${deceased.firstName} ${deceased.lastName}`);
  
  return artifact;
}

/**
 * Create a wedding ring
 */
export async function createWeddingRing(
  wearerId: string,
  spouseId: string,
  worldId: string,
  currentTimestep: number
): Promise<Artifact> {
  const wearer = await storage.getCharacter(wearerId);
  const spouse = await storage.getCharacter(spouseId);
  
  if (!wearer || !spouse) throw new Error('Characters not found');
  
  const artifact: Artifact = {
    id: generateArtifactId(),
    type: 'wedding_ring',
    name: `Wedding ring of ${wearer.firstName}`,
    description: `A ring symbolizing the marriage between ${wearer.firstName} and ${spouse.firstName}`,
    createdAt: currentTimestep,
    createdBy: null,
    originEvent: 'marriage',
    subjects: [wearerId, spouseId],
    location: null,
    currentOwner: wearerId,
    currentLocation: 'worn',
    provenance: [{
      owner: wearerId,
      from: currentTimestep,
      to: null,
      reason: 'marriage'
    }],
    transmitsKnowledge: {
      facts: [`${wearerId} is married`],
      relationships: [`${wearerId} married to ${spouseId}`],
      events: ['marriage']
    },
    emotionalValue: 1.0,
    sentimentalTo: [wearerId, spouseId],
    condition: 'pristine',
    isPublic: true,  // Visible when worn
    destroyed: false,
    destroyedAt: null
  };
  
  await saveArtifact(artifact, worldId);
  
  console.log(`💍 Wedding ring created for ${wearer.firstName}`);
  
  return artifact;
}

/**
 * Create a letter
 */
export async function createLetter(
  authorId: string,
  recipientId: string,
  content: string,
  worldId: string,
  currentTimestep: number
): Promise<Artifact> {
  const author = await storage.getCharacter(authorId);
  const recipient = await storage.getCharacter(recipientId);
  
  if (!author || !recipient) throw new Error('Characters not found');
  
  const artifact: Artifact = {
    id: generateArtifactId(),
    type: 'letter',
    name: `Letter from ${author.firstName} to ${recipient.firstName}`,
    description: `A personal letter.\n\n"${content}"`,
    createdAt: currentTimestep,
    createdBy: authorId,
    originEvent: 'letter_written',
    subjects: [authorId, recipientId],
    location: null,
    currentOwner: recipientId,
    currentLocation: null,
    provenance: [
      {
        owner: authorId,
        from: currentTimestep,
        to: currentTimestep,
        reason: 'author'
      },
      {
        owner: recipientId,
        from: currentTimestep,
        to: null,
        reason: 'recipient'
      }
    ],
    transmitsKnowledge: {
      facts: [`relationship between ${authorId} and ${recipientId}`],
      relationships: [`${authorId} communicated with ${recipientId}`],
      events: ['letter_written']
    },
    emotionalValue: 0.5 + (Math.random() * 0.4),
    sentimentalTo: [authorId, recipientId],
    condition: 'good',
    isPublic: false,
    destroyed: false,
    destroyedAt: null
  };
  
  await saveArtifact(artifact, worldId);
  
  console.log(`✉️ Letter created from ${author.firstName} to ${recipient.firstName}`);
  
  return artifact;
}

/**
 * Create an heirloom (family object passed down)
 */
export async function createHeirloom(
  originalOwnerId: string,
  itemName: string,
  description: string,
  worldId: string,
  currentTimestep: number
): Promise<Artifact> {
  const originalOwner = await storage.getCharacter(originalOwnerId);
  if (!originalOwner) throw new Error('Original owner not found');
  
  const artifact: Artifact = {
    id: generateArtifactId(),
    type: 'heirloom',
    name: itemName,
    description,
    createdAt: currentTimestep,
    createdBy: originalOwnerId,
    originEvent: 'heirloom_created',
    subjects: [originalOwnerId],
    location: null,
    currentOwner: originalOwnerId,
    currentLocation: null,
    provenance: [{
      owner: originalOwnerId,
      from: currentTimestep,
      to: null,
      reason: 'original owner'
    }],
    transmitsKnowledge: {
      facts: [`family history of ${originalOwnerId}`],
      relationships: [],
      events: []
    },
    emotionalValue: 0.8,
    sentimentalTo: [originalOwnerId],
    condition: 'good',
    isPublic: false,
    destroyed: false,
    destroyedAt: null
  };
  
  await saveArtifact(artifact, worldId);
  
  console.log(`👑 Heirloom created: ${itemName}`);
  
  return artifact;
}

// ============================================================================
// SIGNAL TRANSMISSION
// ============================================================================

/**
 * Character observes an artifact and gains knowledge
 */
export async function observeArtifact(
  artifactId: string,
  observerId: string,
  currentTimestep: number
): Promise<Signal> {
  const artifact = await getArtifact(artifactId);
  if (!artifact) throw new Error('Artifact not found');
  
  const observer = await storage.getCharacter(observerId);
  if (!observer) throw new Error('Observer not found');
  
  // Gain knowledge from artifact
  const knowledgeGained: string[] = [...artifact.transmitsKnowledge.facts];
  
  // Determine emotional response
  const isSentimental = artifact.sentimentalTo.includes(observerId);
  const isAboutLoved = await checkIfAboutLovedOne(artifact, observerId);
  
  let emotionalType: 'joy' | 'sadness' | 'nostalgia' | 'anger' | 'neutral' = 'neutral';
  let emotionalIntensity = 0.3;
  
  if (artifact.type === 'gravestone' && artifact.subjects.includes(observerId)) {
    // Own gravestone (shouldn't happen but...)
    emotionalType = 'neutral';
  } else if (artifact.type === 'gravestone') {
    emotionalType = 'sadness';
    emotionalIntensity = isSentimental ? 0.8 : 0.5;
  } else if (artifact.type === 'photograph' && isSentimental) {
    emotionalType = 'nostalgia';
    emotionalIntensity = 0.7;
  } else if (artifact.type === 'wedding_ring' && isSentimental) {
    emotionalType = 'joy';
    emotionalIntensity = 0.8;
  } else if (artifact.type === 'letter' && isSentimental) {
    emotionalType = 'nostalgia';
    emotionalIntensity = 0.6;
  } else if (artifact.type === 'heirloom' && isSentimental) {
    emotionalType = 'nostalgia';
    emotionalIntensity = 0.7;
  } else if (isAboutLoved) {
    emotionalType = 'nostalgia';
    emotionalIntensity = 0.6;
  }
  
  // Generate thoughts
  const thoughtsTriggered: string[] = [];
  
  if (artifact.type === 'gravestone' && isSentimental) {
    thoughtsTriggered.push(`I miss ${artifact.subjects[0]}`);
    thoughtsTriggered.push(`I remember them fondly`);
  } else if (artifact.type === 'photograph') {
    thoughtsTriggered.push(`That was a good time`);
  } else if (artifact.type === 'wedding_ring' && artifact.subjects.includes(observerId)) {
    thoughtsTriggered.push(`Symbol of my marriage`);
  }
  
  const signal: Signal = {
    artifactId,
    observerId,
    timestamp: currentTimestep,
    knowledgeGained,
    emotionalResponse: {
      type: emotionalType,
      intensity: emotionalIntensity
    },
    thoughtsTriggered
  };
  
  // Apply knowledge to observer
  await applyKnowledge(observer.id, knowledgeGained);
  
  console.log(`👀 ${observer.firstName} observed ${artifact.name}: ${emotionalType} (${thoughtsTriggered.length} thoughts)`);
  
  return signal;
}

/**
 * Check if artifact is about someone the observer loves
 */
async function checkIfAboutLovedOne(artifact: Artifact, observerId: string): Promise<boolean> {
  const observer = await storage.getCharacter(observerId);
  if (!observer) return false;
  
  // Check if any subject is loved by observer
  const customData = (observer as any).customData || {};
  const mentalModels = customData.mentalModels as Record<string, any> | undefined;
  
  if (!mentalModels) return false;
  
  for (const subjectId of artifact.subjects) {
    const model = mentalModels[subjectId];
    if (model && model.spark > 50) {
      return true; // Loves this subject
    }
  }
  
  return false;
}

/**
 * Apply knowledge from artifact to character
 */
async function applyKnowledge(characterId: string, knowledge: string[]): Promise<void> {
  // Would integrate with knowledge system
  // For now, just log
  if (knowledge.length > 0) {
    console.log(`  Knowledge gained: ${knowledge.join(', ')}`);
  }
}

// ============================================================================
// ARTIFACT MANAGEMENT
// ============================================================================

/**
 * Transfer artifact to new owner
 */
export async function transferArtifact(
  artifactId: string,
  newOwnerId: string,
  reason: string,
  currentTimestep: number
): Promise<void> {
  const artifact = await getArtifact(artifactId);
  if (!artifact) throw new Error('Artifact not found');
  
  const oldOwner = artifact.currentOwner;
  
  // Update provenance
  if (oldOwner) {
    const currentOwnership = artifact.provenance.find(p => p.owner === oldOwner && p.to === null);
    if (currentOwnership) {
      currentOwnership.to = currentTimestep;
    }
  }
  
  artifact.provenance.push({
    owner: newOwnerId,
    from: currentTimestep,
    to: null,
    reason
  });
  
  artifact.currentOwner = newOwnerId;
  
  const newOwner = await storage.getCharacter(newOwnerId);
  const oldOwnerChar = oldOwner ? await storage.getCharacter(oldOwner) : null;
  
  console.log(`📦 ${artifact.name} transferred from ${oldOwnerChar?.firstName || 'unknown'} to ${newOwner?.firstName || 'unknown'} (${reason})`);
  
  await saveArtifact(artifact, newOwner?.worldId || '');
}

/**
 * Pass artifact as inheritance when someone dies
 */
export async function inheritArtifact(
  artifactId: string,
  heirId: string,
  currentTimestep: number
): Promise<void> {
  await transferArtifact(artifactId, heirId, 'inheritance', currentTimestep);
}

/**
 * Destroy an artifact
 */
export async function destroyArtifact(
  artifactId: string,
  reason: string,
  currentTimestep: number
): Promise<void> {
  const artifact = await getArtifact(artifactId);
  if (!artifact) return;
  
  artifact.destroyed = true;
  artifact.destroyedAt = currentTimestep;
  artifact.condition = 'destroyed';
  
  console.log(`💥 ${artifact.name} destroyed (${reason})`);
  
  // Note: Keep artifact record for historical purposes
}

/**
 * Age artifact (condition degrades over time)
 */
export async function ageArtifact(
  artifactId: string,
  timeElapsed: number
): Promise<void> {
  const artifact = await getArtifact(artifactId);
  if (!artifact || artifact.destroyed) return;
  
  // Artifacts degrade over time
  const degradationChance = timeElapsed * 0.0001; // Very slow
  
  if (Math.random() < degradationChance) {
    const conditions: Array<'pristine' | 'good' | 'worn' | 'damaged'> = ['pristine', 'good', 'worn', 'damaged'];
    const currentIndex = conditions.indexOf(artifact.condition as any);
    
    if (currentIndex < conditions.length - 1) {
      artifact.condition = conditions[currentIndex + 1];
      console.log(`⏰ ${artifact.name} condition degraded to ${artifact.condition}`);
    }
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all artifacts in world
 */
export async function getArtifactsByWorld(worldId: string): Promise<Artifact[]> {
  const worldData = await storage.getWorld(worldId);
  if (!worldData) return [];
  
  const customData = (worldData as any).customData || {};
  const artifacts = customData.artifacts as Record<string, Artifact> || {};
  
  return Object.values(artifacts).filter(a => !a.destroyed);
}

/**
 * Get artifacts owned by character
 */
export async function getArtifactsByOwner(ownerId: string): Promise<Artifact[]> {
  const character = await storage.getCharacter(ownerId);
  if (!character) return [];
  
  const all = await getArtifactsByWorld(character.worldId);
  return all.filter(a => a.currentOwner === ownerId);
}

/**
 * Get gravestones in cemetery
 */
export async function getGravestonesInCemetery(
  worldId: string,
  cemeteryLocation: string
): Promise<Artifact[]> {
  const all = await getArtifactsByWorld(worldId);
  return all.filter(a => a.type === 'gravestone' && a.location === cemeteryLocation);
}

/**
 * Get most sentimental artifacts for character
 */
export async function getMostSentimentalArtifacts(
  characterId: string,
  limit: number = 5
): Promise<Artifact[]> {
  const artifacts = await getArtifactsByOwner(characterId);
  
  return artifacts
    .filter(a => a.sentimentalTo.includes(characterId))
    .sort((a, b) => b.emotionalValue - a.emotionalValue)
    .slice(0, limit);
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Save artifact to world
 */
async function saveArtifact(artifact: Artifact, worldId: string): Promise<void> {
  const worldData = await storage.getWorld(worldId);
  if (!worldData) return;
  
  const customData = (worldData as any).customData || {};
  const artifacts = customData.artifacts as Record<string, Artifact> || {};
  artifacts[artifact.id] = artifact;
  
  await storage.updateWorld(worldId, {
    customData: {
      ...customData,
      artifacts
    }
  } as any);
}

/**
 * Get artifact by ID
 */
async function getArtifact(artifactId: string): Promise<Artifact | null> {
  // Would need to search across worlds
  // Simplified implementation
  return null;
}

/**
 * Generate unique artifact ID
 */
function generateArtifactId(): string {
  return `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// DESCRIPTION
// ============================================================================

/**
 * Describe artifact for UI
 */
export function describeArtifact(artifact: Artifact): string {
  const condition = artifact.condition !== 'pristine' ? ` (${artifact.condition})` : '';
  const ownership = artifact.currentOwner ? ` - owned by ${artifact.currentOwner}` : '';
  
  return `${artifact.name}${condition}${ownership}\n${artifact.description}`;
}

/**
 * Get artifact provenance story
 */
export function getProvenanceStory(artifact: Artifact): string {
  if (artifact.provenance.length === 0) {
    return 'No ownership history recorded.';
  }
  
  const story = artifact.provenance.map(p => {
    const duration = p.to ? `${p.to - p.from} days` : 'ongoing';
    return `- ${p.owner} (${p.reason}): ${duration}`;
  });
  
  return `Ownership history:\n${story.join('\n')}`;
}

// All functions are already exported above with 'export function' or 'export async function'
