/**
 * Hiring System Extension for Insimul
 * Implements Talk of the Town hiring mechanics with relationship-based preferences
 */

import { storage } from '../../db/storage';
import type { Character, OccupationVocation, ShiftType, TerminationReason } from '@shared/schema';
import { getRelationshipStrength } from './relationship-utils.js';

export interface OccupationData {
  id: string;
  businessId: string;
  vocation: OccupationVocation;
  shift: ShiftType;
  startYear: number;
  endYear?: number;
  yearsExperience: number;
  terminationReason?: TerminationReason;
  level: number;
  isSupplemental: boolean;
  hiredAsFavor: boolean;
}

export interface CandidateEvaluation {
  characterId: string;
  characterName: string;
  qualified: boolean;
  score: number;
  breakdown: {
    qualificationScore: number;
    relationshipBonus: number;
    experienceBonus: number;
    ageBonus: number;
  };
  relationships?: Array<{
    type: string;
    targetId: string;
    targetName: string;
    strength: number;
  }>;
}

/**
 * Evaluate a candidate for a specific position
 */
export async function evaluateCandidate(
  businessId: string,
  candidateId: string,
  vocation: OccupationVocation,
  hiringManagerId: string,
  currentYear: number = 1900
): Promise<CandidateEvaluation> {
  const candidate = await storage.getCharacter(candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }

  // Base qualification score
  let qualificationScore = 50;
  let qualified = true;

  // Age check - must be at least 16 years old
  const age = currentYear - (candidate.birthYear || 1880);
  if (age < 16) {
    qualified = false;
    qualificationScore -= 50;
  }

  // Age bonus (prime working years 25-50)
  const ageBonus = age >= 25 && age <= 50 ? 10 : 0;

  // Education bonus for certain vocations
  const educationVocations: OccupationVocation[] = [
    'Doctor', 'Lawyer', 'Teacher', 'Professor', 'Pharmacist', 
    'Dentist', 'Optometrist', 'Architect', 'Engineer'
  ];
  if (educationVocations.includes(vocation)) {
    if (candidate.collegeGraduate) {
      qualificationScore += 20;
    } else {
      qualified = false;
      qualificationScore -= 30;
    }
  }

  // Check retirement status
  if (candidate.retired) {
    qualified = false;
    qualificationScore -= 40;
  }

  // Experience bonus - check previous occupations in customData
  let experienceBonus = 0;
  const customData = (candidate as any).customData as Record<string, any> | undefined;
  const occupationHistory = ((customData?.occupations as OccupationData[]) || []);
  const relevantExperience = occupationHistory.filter(occ => occ.vocation === vocation);
  if (relevantExperience.length > 0) {
    const totalYears = relevantExperience.reduce((sum, occ) => sum + occ.yearsExperience, 0);
    experienceBonus = Math.min(30, totalYears * 3); // Up to 30 points for 10+ years
    qualificationScore += experienceBonus;
  }

  // Relationship bonus - check relationships with hiring manager
  let relationshipBonus = 0;
  const relationships: CandidateEvaluation['relationships'] = [];
  
  if (hiringManagerId) {
    const relationshipStrength = await getRelationshipStrength(hiringManagerId, candidateId);
    
    if (relationshipStrength > 0) {
      // Positive relationships give bonuses
      relationshipBonus = Math.round(relationshipStrength * 40); // Up to 40 points
      
      // Check relationship type from hiring manager's perspective
      const manager = await storage.getCharacter(hiringManagerId);
      const relationship = manager?.relationships?.[candidateId];
      
      if (relationship) {
        relationships.push({
          type: relationship.type,
          targetId: hiringManagerId,
          targetName: manager?.firstName + ' ' + manager?.lastName || 'Unknown',
          strength: relationshipStrength
        });

        // Extra bonus for family relationships
        if (relationship.type === 'family' || relationship.type === 'familial') {
          relationshipBonus += 20;
        }
      }
      
      qualificationScore += relationshipBonus;
    } else if (relationshipStrength < -0.3) {
      // Strong negative relationships disqualify
      qualified = false;
      qualificationScore -= 50;
    }
  }

  // Final score calculation
  const finalScore = Math.max(0, Math.min(100, qualificationScore + ageBonus));

  return {
    characterId: candidateId,
    characterName: `${candidate.firstName} ${candidate.lastName}`,
    qualified,
    score: finalScore,
    breakdown: {
      qualificationScore,
      relationshipBonus,
      experienceBonus,
      ageBonus
    },
    relationships: relationships.length > 0 ? relationships : undefined
  };
}

/**
 * Find qualified candidates for a position
 */
export async function findCandidates(
  businessId: string,
  vocation: OccupationVocation,
  shift: ShiftType,
  hiringManagerId: string,
  worldId: string,
  currentYear: number = 1900,
  limit: number = 10
): Promise<CandidateEvaluation[]> {
  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }

  // Get all characters in the world
  const allCharacters = await storage.getCharactersByWorld(worldId);
  
  // Filter to those who are employable
  const employable = allCharacters.filter(char => {
    const age = currentYear - (char.birthYear || 1880);
    const currentOccupation = (char.customData as any)?.currentOccupation as OccupationData | undefined;
    
    return (
      age >= 16 && 
      !char.retired && 
      char.status === 'active' &&
      !currentOccupation // Not currently employed
    );
  });

  // Evaluate each candidate
  const evaluations: CandidateEvaluation[] = [];
  for (const char of employable) {
    try {
      const evaluation = await evaluateCandidate(
        businessId,
        char.id,
        vocation,
        hiringManagerId,
        currentYear
      );
      evaluations.push(evaluation);
    } catch (error) {
      console.error(`Error evaluating candidate ${char.id}:`, error);
    }
  }

  // Sort by score (highest first) and filter to qualified candidates
  const qualified = evaluations
    .filter(e => e.qualified)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return qualified;
}

/**
 * Hire a character for a position
 */
export async function fillVacancy(
  businessId: string,
  candidateId: string,
  vocation: OccupationVocation,
  shift: ShiftType,
  hiringManagerId: string,
  currentYear: number = 1900,
  isSupplemental: boolean = false,
  hiredAsFavor: boolean = false
): Promise<void> {
  const candidate = await storage.getCharacter(candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }

  // Create occupation record
  const occupationId = `occ_${Date.now()}_${candidateId.slice(0, 8)}`;
  const newOccupation: OccupationData = {
    id: occupationId,
    businessId,
    vocation,
    shift,
    startYear: currentYear,
    yearsExperience: 0,
    level: vocation === 'Owner' || vocation === 'Manager' ? 5 : 1,
    isSupplemental,
    hiredAsFavor
  };

  // Store in character's customData
  const existingData = (candidate as any).customData as Record<string, any> | undefined;
  const customData = existingData || {};
  const occupations = (customData.occupations as OccupationData[]) || [];
  occupations.push(newOccupation);
  
  await storage.updateCharacter(candidateId, {
    ...(existingData && {
      customData: {
        ...customData,
        currentOccupation: newOccupation,
        occupations
      }
    }),
    currentOccupationId: occupationId
  } as any);

  // Update business vacancies - remove this position from vacancies
  const vacancies = business.vacancies || { day: [], night: [] };
  if (shift === 'day') {
    vacancies.day = vacancies.day.filter((v: string) => v !== vocation);
  } else {
    vacancies.night = vacancies.night.filter((v: string) => v !== vocation);
  }
  
  await storage.updateBusiness(businessId, { vacancies });

  console.log(`✓ Hired ${candidate.firstName} ${candidate.lastName} as ${vocation} at ${business.name}`);
}

/**
 * Fire an employee
 */
export async function fireEmployee(
  characterId: string,
  reason: TerminationReason,
  currentYear: number = 1900
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const existingData = (character as any).customData as Record<string, any> | undefined;
  const currentOccupation = existingData?.currentOccupation as OccupationData | undefined;
  if (!currentOccupation) {
    throw new Error(`Character ${characterId} has no current occupation`);
  }

  // Update occupation record with end date and reason
  const customDataObj = existingData || {};
  const occupations = (customDataObj.occupations as OccupationData[]) || [];
  const updatedOccupations = occupations.map(occ => {
    if (occ.id === currentOccupation.id) {
      return {
        ...occ,
        endYear: currentYear,
        terminationReason: reason,
        yearsExperience: currentYear - occ.startYear
      };
    }
    return occ;
  });

  // Clear current occupation
  await storage.updateCharacter(characterId, {
    ...((character as any).customData && {
      customData: {
        ...customDataObj,
        currentOccupation: null,
        occupations: updatedOccupations
      }
    }),
    currentOccupationId: undefined as any
  });

  // If retiring, mark character as retired
  if (reason === 'retirement') {
    await storage.updateCharacter(characterId, { retired: true });
  }

  console.log(`✓ Terminated ${character.firstName} ${character.lastName}'s employment (${reason})`);
}

/**
 * Get all employees at a business
 */
export async function getBusinessEmployees(businessId: string, worldId: string): Promise<Array<{
  character: Character;
  occupation: OccupationData;
}>> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  
  const employees = allCharacters
    .filter(char => {
      const customData = (char as any).customData as Record<string, any> | undefined;
      const currentOccupation = customData?.currentOccupation as OccupationData | undefined;
      return currentOccupation && currentOccupation.businessId === businessId;
    })
    .map(char => {
      const customData = (char as any).customData as Record<string, any>;
      return {
        character: char,
        occupation: customData.currentOccupation as OccupationData
      };
    });

  return employees;
}

/**
 * Get a character's occupation history
 */
export async function getOccupationHistory(characterId: string): Promise<OccupationData[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return [];
  }

  const customData = (character as any).customData as Record<string, any> | undefined;
  const occupations = (customData?.occupations as OccupationData[]) || [];
  return occupations.sort((a, b) => b.startYear - a.startYear); // Most recent first
}

/**
 * Promote an employee to a higher level
 */
export async function promoteEmployee(
  characterId: string,
  newVocation: OccupationVocation,
  newLevel: number
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const existingData = (character as any).customData as Record<string, any> | undefined;
  const currentOccupation = existingData?.currentOccupation as OccupationData | undefined;
  if (!currentOccupation) {
    throw new Error(`Character ${characterId} has no current occupation`);
  }

  // Update current occupation
  const updatedOccupation: OccupationData = {
    ...currentOccupation,
    vocation: newVocation,
    level: newLevel
  };

  // Update in history as well
  const customDataObj = existingData || {};
  const occupations = (customDataObj.occupations as OccupationData[]) || [];
  const updatedOccupations = occupations.map(occ => 
    occ.id === currentOccupation.id ? updatedOccupation : occ
  );

  await storage.updateCharacter(characterId, {
    ...((character as any).customData && {
      customData: {
        ...customDataObj,
        currentOccupation: updatedOccupation,
        occupations: updatedOccupations
      }
    })
  } as any);

  console.log(`✓ Promoted ${character.firstName} ${character.lastName} to ${newVocation} (Level ${newLevel})`);
}
