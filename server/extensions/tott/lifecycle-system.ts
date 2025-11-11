/**
 * Life Cycle & Advanced Social Dynamics System (Phase 8)
 * 
 * Prolog-First Design:
 * - TypeScript manages life events and state changes
 * - Prolog determines when events occur via rules
 * - Enables complete birth-to-death simulation
 * 
 * Based on Talk of the Town's life.py and marriage.py
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { getRelationshipDetails, updateRelationship } from './social-dynamics-system.js';
import { initializeMentalModel } from './knowledge-system.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type RomanticStatus = 'attracted' | 'dating' | 'engaged' | 'married' | 'divorced';
export type DeathCause = 'old_age' | 'illness' | 'accident' | 'childbirth' | 'other';
export type LifeStage = 'infant' | 'child' | 'adolescent' | 'adult' | 'elderly';

export interface RomanticRelationship {
  character1Id: string;
  character2Id: string;
  status: RomanticStatus;
  startedDating?: number;
  engagementDate?: number;
  marriageDate?: number;
  divorceDate?: number;
  compatibility: number;
  dates: Array<{
    location: string;
    timestamp: number;
    quality: number;
  }>;
}

export interface Pregnancy {
  motherId: string;
  fatherId: string;
  conceptionDate: number;
  dueDate: number;
  complications: string[];
}

export interface Birth {
  id: string;
  motherId: string;
  fatherId: string;
  childId: string;
  birthDate: number;
  location: string;
  witnesses: string[];
}

export interface Education {
  studentId: string;
  teacherId: string;
  subject: string;
  startDate: number;
  endDate?: number;
  lessons: Array<{
    topic: string;
    timestamp: number;
    skillGain: number;
  }>;
  skillLevel: number;
  graduated: boolean;
}

export interface ComingOfAgeEvent {
  characterId: string;
  timestamp: number;
  age: number;
  location: string;
  attendees: string[];
}

export interface Death {
  characterId: string;
  timestamp: number;
  age: number;
  cause: DeathCause;
  location: string;
  estate: {
    totalValue: number;
    assets: Array<{
      type: string;
      id: string;
      value: number;
    }>;
  };
  funeral?: {
    location: string;
    attendees: string[];
    timestamp: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Romantic relationships
  minCompatibilityForAttraction: 0.6,
  minChargeForDating: 10,
  minConversationsForDating: 5,
  minDatingPeriodForProposal: 200,  // Timesteps
  minChargeForMarriage: 15,
  minTrustForMarriage: 0.8,
  
  // Reproduction
  pregnancyDuration: 270,  // ~9 months in days
  minAgeForPregnancy: 18,
  maxAgeForPregnancy: 45,
  basePregnancyRate: 0.15,  // Per period for married couples
  
  // Education
  educationStartAge: 6,
  apprenticeshipStartAge: 14,
  graduationAge: 18,
  skillGainPerLesson: 0.5,
  
  // Life stages
  infantAge: 0,
  childAge: 3,
  adolescentAge: 13,
  adultAge: 18,
  elderlyAge: 65,
  
  // Death
  deathProbabilities: {
    under50: 0.001,
    age50: 0.005,
    age60: 0.02,
    age70: 0.05,
    age80: 0.15,
    age90: 0.30
  }
};

// Store active life events
const activePregnancies = new Map<string, Pregnancy>();
const activeEducation = new Map<string, Education>();
const romanticRelationships = new Map<string, RomanticRelationship>();

// ============================================================================
// ROMANTIC RELATIONSHIPS
// ============================================================================

export async function calculateRomanticCompatibility(
  char1Id: string,
  char2Id: string
): Promise<number> {
  const char1 = await storage.getCharacter(char1Id);
  const char2 = await storage.getCharacter(char2Id);
  
  if (!char1 || !char2) return 0;
  
  const p1 = (char1.personality as any) || {};
  const p2 = (char2.personality as any) || {};
  
  // Personality compatibility
  const opennessMatch = 1 - Math.abs(p1.openness - p2.openness);
  const conscientiousnessMatch = 1 - Math.abs(p1.conscientiousness - p2.conscientiousness);
  const extroversionComplement = Math.abs(p1.extroversion - p2.extroversion);
  const agreeablenessMatch = 1 - Math.abs(p1.agreeableness - p2.agreeableness);
  const neuroticismComplement = 1 - Math.abs(p1.neuroticism - p2.neuroticism);
  
  const personalityScore = (
    opennessMatch * 0.2 +
    conscientiousnessMatch * 0.15 +
    extroversionComplement * 0.1 +
    agreeablenessMatch * 0.25 +
    neuroticismComplement * 0.3
  );
  
  // Age difference
  const age1 = char1.age || 20;
  const age2 = char2.age || 20;
  const ageDiff = Math.abs(age1 - age2);
  const ageScore = Math.max(0, 1 - (ageDiff / 20));
  
  return personalityScore * 0.6 + ageScore * 0.4;
}

export async function developAttraction(
  char1Id: string,
  char2Id: string,
  currentTimestep: number
): Promise<RomanticRelationship> {
  const compatibility = await calculateRomanticCompatibility(char1Id, char2Id);
  
  const relationship: RomanticRelationship = {
    character1Id: char1Id,
    character2Id: char2Id,
    status: 'attracted',
    compatibility,
    dates: []
  };
  
  const key = [char1Id, char2Id].sort().join('_');
  romanticRelationships.set(key, relationship);
  
  return relationship;
}

export async function startDating(
  char1Id: string,
  char2Id: string,
  location: string,
  currentTimestep: number
): Promise<RomanticRelationship> {
  const key = [char1Id, char2Id].sort().join('_');
  let relationship = romanticRelationships.get(key);
  
  if (!relationship) {
    relationship = await developAttraction(char1Id, char2Id, currentTimestep);
  }
  
  relationship.status = 'dating';
  relationship.startedDating = currentTimestep;
  
  // Boost relationship charge
  await updateRelationship(char1Id, char2Id, 5, 1900);
  
  // Initialize deeper mental models
  await initializeMentalModel(char1Id, char2Id, ['name', 'age', 'occupation', 'personality'], 'romantic', currentTimestep);
  await initializeMentalModel(char2Id, char1Id, ['name', 'age', 'occupation', 'personality'], 'romantic', currentTimestep);
  
  romanticRelationships.set(key, relationship);
  return relationship;
}

export async function goOnDate(
  char1Id: string,
  char2Id: string,
  location: string,
  currentTimestep: number
): Promise<{ quality: number; success: boolean }> {
  const key = [char1Id, char2Id].sort().join('_');
  const relationship = romanticRelationships.get(key);
  
  if (!relationship || relationship.status !== 'dating') {
    throw new Error('Characters must be dating to go on a date');
  }
  
  // Date quality based on compatibility and relationship
  const baseQuality = relationship.compatibility;
  const relationshipDetails = await getRelationshipDetails(char1Id, char2Id, 1900);
  const chargeBonus = Math.min(0.3, relationshipDetails.charge / 50);
  
  const quality = Math.min(1, baseQuality + chargeBonus + (Math.random() - 0.5) * 0.2);
  
  relationship.dates.push({
    location,
    timestamp: currentTimestep,
    quality
  });
  
  // Update relationship based on date quality
  const chargeChange = quality > 0.7 ? 3 : quality > 0.5 ? 1 : -1;
  await updateRelationship(char1Id, char2Id, chargeChange, 1900);
  
  romanticRelationships.set(key, relationship);
  
  return {
    quality,
    success: quality > 0.5
  };
}

export async function proposeMarriage(
  proposerId: string,
  proposedToId: string,
  currentTimestep: number
): Promise<{ accepted: boolean; reason?: string }> {
  const key = [proposerId, proposedToId].sort().join('_');
  const relationship = romanticRelationships.get(key);
  
  if (!relationship || relationship.status !== 'dating') {
    return { accepted: false, reason: 'Not dating' };
  }
  
  const relationshipDetails = await getRelationshipDetails(proposerId, proposedToId, 1900);
  
  // Check criteria
  if (relationshipDetails.charge < CONFIG.minChargeForMarriage) {
    return { accepted: false, reason: 'Insufficient relationship charge' };
  }
  
  if (relationshipDetails.trust < CONFIG.minTrustForMarriage) {
    return { accepted: false, reason: 'Insufficient trust' };
  }
  
  const datingDuration = currentTimestep - (relationship.startedDating || 0);
  if (datingDuration < CONFIG.minDatingPeriodForProposal) {
    return { accepted: false, reason: 'Haven not dated long enough' };
  }
  
  // Accepted!
  relationship.status = 'engaged';
  relationship.engagementDate = currentTimestep;
  
  romanticRelationships.set(key, relationship);
  
  return { accepted: true };
}

export async function marry(
  char1Id: string,
  char2Id: string,
  location: string,
  witnesses: string[],
  currentTimestep: number
): Promise<RomanticRelationship> {
  const key = [char1Id, char2Id].sort().join('_');
  const relationship = romanticRelationships.get(key);
  
  if (!relationship) {
    throw new Error('No romantic relationship exists');
  }
  
  relationship.status = 'married';
  relationship.marriageDate = currentTimestep;
  
  // Update character records
  const char1 = await storage.getCharacter(char1Id);
  const char2 = await storage.getCharacter(char2Id);
  
  if (char1 && char2) {
    await storage.updateCharacter(char1Id, {
      spouseId: char2Id,
      marriageYear: timestepToYear(currentTimestep)
    });
    
    await storage.updateCharacter(char2Id, {
      spouseId: char1Id,
      marriageYear: timestepToYear(currentTimestep)
    });
  }
  
  // Significant relationship boost
  await updateRelationship(char1Id, char2Id, 10, 1900);
  
  romanticRelationships.set(key, relationship);
  return relationship;
}

export async function divorce(
  char1Id: string,
  char2Id: string,
  reason: string,
  currentTimestep: number
): Promise<void> {
  const key = [char1Id, char2Id].sort().join('_');
  const relationship = romanticRelationships.get(key);
  
  if (!relationship || relationship.status !== 'married') {
    throw new Error('Characters must be married to divorce');
  }
  
  relationship.status = 'divorced';
  relationship.divorceDate = currentTimestep;
  
  // Update character records
  await storage.updateCharacter(char1Id, {
    spouseId: null,
    divorceYear: timestepToYear(currentTimestep)
  });
  
  await storage.updateCharacter(char2Id, {
    spouseId: null,
    divorceYear: timestepToYear(currentTimestep)
  });
  
  // Massive relationship damage
  await updateRelationship(char1Id, char2Id, -20, 1900);
  
  romanticRelationships.set(key, relationship);
}

// ============================================================================
// REPRODUCTION
// ============================================================================

export async function checkPregnancyEligibility(characterId: string): Promise<boolean> {
  const character = await storage.getCharacter(characterId);
  if (!character) return false;
  
  const age = character.age || 0;
  if (age < CONFIG.minAgeForPregnancy || age > CONFIG.maxAgeForPregnancy) {
    return false;
  }
  
  // Must be married
  if (!character.spouseId) return false;
  
  // Not already pregnant
  if (activePregnancies.has(characterId)) return false;
  
  return true;
}

export async function conceive(
  motherId: string,
  fatherId: string,
  currentTimestep: number
): Promise<Pregnancy> {
  const eligible = await checkPregnancyEligibility(motherId);
  if (!eligible) {
    throw new Error('Mother not eligible for pregnancy');
  }
  
  const pregnancy: Pregnancy = {
    motherId,
    fatherId,
    conceptionDate: currentTimestep,
    dueDate: currentTimestep + CONFIG.pregnancyDuration,
    complications: []
  };
  
  activePregnancies.set(motherId, pregnancy);
  
  // Update character
  await storage.updateCharacter(motherId, {
    isPregnant: true as any
  });
  
  return pregnancy;
}

export async function giveBirth(
  motherId: string,
  location: string,
  currentTimestep: number
): Promise<Birth> {
  const pregnancy = activePregnancies.get(motherId);
  if (!pregnancy) {
    throw new Error('Character is not pregnant');
  }
  
  const mother = await storage.getCharacter(motherId);
  const father = await storage.getCharacter(pregnancy.fatherId);
  
  if (!mother || !father) {
    throw new Error('Parent not found');
  }
  
  // Generate child
  const child = await generateChild(mother, father, currentTimestep);
  
  const birth: Birth = {
    id: `birth_${Date.now()}`,
    motherId,
    fatherId: pregnancy.fatherId,
    childId: child.id,
    birthDate: currentTimestep,
    location,
    witnesses: []
  };
  
  // Clear pregnancy
  activePregnancies.delete(motherId);
  await storage.updateCharacter(motherId, {
    isPregnant: false as any
  });
  
  // Initialize family relationships and knowledge
  await initializeMentalModel(motherId, child.id, ['name', 'age'], 'family', currentTimestep);
  await initializeMentalModel(pregnancy.fatherId, child.id, ['name', 'age'], 'family', currentTimestep);
  
  return birth;
}

async function generateChild(
  mother: Character,
  father: Character,
  birthTimestep: number
): Promise<Character> {
  const gender = Math.random() < 0.5 ? 'Male' : 'Female';
  const mp = (mother.personality as any) || {};
  const fp = (father.personality as any) || {};
  
  const child = await storage.createCharacter({
    worldId: mother.worldId,
    firstName: `Child_${Date.now()}`,  // Would use proper name generator
    lastName: father.lastName,
    gender,
    birthYear: timestepToYear(birthTimestep),
    age: 0,
    isAlive: true,
    
    // Inherit personality
    personality: {
      openness: inheritTrait(mp.openness, fp.openness),
      conscientiousness: inheritTrait(mp.conscientiousness, fp.conscientiousness),
      extroversion: inheritTrait(mp.extroversion, fp.extroversion),
      agreeableness: inheritTrait(mp.agreeableness, fp.agreeableness),
      neuroticism: inheritTrait(mp.neuroticism, fp.neuroticism)
    } as any,
    
    motherId: mother.id,
    fatherId: father.id,
    residenceId: mother.residenceId
  });
  
  return child;
}

function inheritTrait(trait1: number = 0.5, trait2: number = 0.5): number {
  const average = (trait1 + trait2) / 2;
  const variation = (Math.random() - 0.5) * 0.3;
  return Math.max(0, Math.min(1, average + variation));
}

// ============================================================================
// EDUCATION
// ============================================================================

export async function enrollStudent(
  studentId: string,
  teacherId: string,
  subject: string,
  currentTimestep: number
): Promise<Education> {
  const education: Education = {
    studentId,
    teacherId,
    subject,
    startDate: currentTimestep,
    lessons: [],
    skillLevel: 0,
    graduated: false
  };
  
  activeEducation.set(`${studentId}_${subject}`, education);
  
  return education;
}

export async function conductLesson(
  studentId: string,
  teacherId: string,
  subject: string,
  topic: string,
  currentTimestep: number
): Promise<void> {
  const key = `${studentId}_${subject}`;
  const education = activeEducation.get(key);
  
  if (!education) {
    throw new Error('Student not enrolled');
  }
  
  education.lessons.push({
    topic,
    timestamp: currentTimestep,
    skillGain: CONFIG.skillGainPerLesson
  });
  
  education.skillLevel += CONFIG.skillGainPerLesson;
  
  activeEducation.set(key, education);
}

export async function graduate(
  studentId: string,
  subject: string,
  currentTimestep: number
): Promise<Education> {
  const key = `${studentId}_${subject}`;
  const education = activeEducation.get(key);
  
  if (!education) {
    throw new Error('Student not enrolled');
  }
  
  education.graduated = true;
  education.endDate = currentTimestep;
  
  activeEducation.set(key, education);
  return education;
}

// ============================================================================
// LIFE STAGES
// ============================================================================

export function getLifeStage(age: number): LifeStage {
  if (age < CONFIG.childAge) return 'infant';
  if (age < CONFIG.adolescentAge) return 'child';
  if (age < CONFIG.adultAge) return 'adolescent';
  if (age < CONFIG.elderlyAge) return 'adult';
  return 'elderly';
}

export async function comingOfAge(
  characterId: string,
  location: string,
  attendees: string[],
  currentTimestep: number
): Promise<ComingOfAgeEvent> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error('Character not found');
  }
  
  const event: ComingOfAgeEvent = {
    characterId,
    timestamp: currentTimestep,
    age: character.age || 18,
    location,
    attendees
  };
  
  return event;
}

// ============================================================================
// DEATH & INHERITANCE
// ============================================================================

export function calculateDeathProbability(age: number): number {
  if (age < 50) return CONFIG.deathProbabilities.under50;
  if (age < 60) return CONFIG.deathProbabilities.age50;
  if (age < 70) return CONFIG.deathProbabilities.age60;
  if (age < 80) return CONFIG.deathProbabilities.age70;
  if (age < 90) return CONFIG.deathProbabilities.age80;
  return CONFIG.deathProbabilities.age90;
}

export async function die(
  characterId: string,
  cause: DeathCause,
  location: string,
  currentTimestep: number
): Promise<Death> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error('Character not found');
  }
  
  const death: Death = {
    characterId,
    timestamp: currentTimestep,
    age: character.age || 0,
    cause,
    location,
    estate: {
      totalValue: 0,
      assets: []
    }
  };
  
  // Mark character as dead
  await storage.updateCharacter(characterId, {
    isAlive: false,
    deathYear: timestepToYear(currentTimestep)
  });
  
  return death;
}

export async function processInheritance(
  deceasedId: string,
  heirId: string,
  assets: string[],
  currentTimestep: number
): Promise<void> {
  // Transfer assets (would integrate with business/residence systems)
  // For now, just symbolic
  console.log(`${heirId} inherits from ${deceasedId}:`, assets);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function timestepToYear(timestep: number): number {
  // Simple conversion: timestep is days, starting at year 1900
  return 1900 + Math.floor(timestep / 365);
}

export async function getRomanticRelationship(
  char1Id: string,
  char2Id: string
): Promise<RomanticRelationship | null> {
  const key = [char1Id, char2Id].sort().join('_');
  return romanticRelationships.get(key) || null;
}

export async function getActivePregnancy(motherId: string): Promise<Pregnancy | null> {
  return activePregnancies.get(motherId) || null;
}

export async function getEducation(studentId: string, subject: string): Promise<Education | null> {
  const key = `${studentId}_${subject}`;
  return activeEducation.get(key) || null;
}

export async function getCharacterLifeHistory(characterId: string): Promise<any> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  return {
    characterId,
    birthYear: character.birthYear,
    age: character.age,
    isAlive: character.isAlive,
    deathYear: character.deathYear,
    
    // Relationships
    spouseId: character.spouseId,
    marriageYear: character.marriageYear,
    divorceYear: character.divorceYear,
    
    // Family
    motherId: character.motherId,
    fatherId: character.fatherId,
    
    // Life stage
    lifeStage: getLifeStage(character.age || 0)
  };
}
