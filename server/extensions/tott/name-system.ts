/**
 * Advanced Name System
 * 
 * Implements comprehensive naming with middle names, suffixes, maiden names,
 * and inheritance patterns.
 * Based on Talk of the Town's name.py system.
 * 
 * Features:
 * - Middle names
 * - Suffixes (Jr, Sr, II, III, IV, V)
 * - Maiden name tracking
 * - Name inheritance (Jr/Sr patterns)
 * - Nickname generation
 * - Name history tracking
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface FullName {
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;        // Jr, Sr, II, III, etc.
  maidenName: string | null;    // Birth last name (for married people)
  nickname: string | null;      // Informal name
  fullName: string;             // Complete formatted name
  formalName: string;           // Formal version
  casualName: string;           // What friends call them
}

export interface NameHistory {
  birthName: string;            // Full name at birth
  previousNames: string[];      // All previous names
  nameChanges: Array<{
    from: string;
    to: string;
    reason: 'marriage' | 'divorce' | 'adoption' | 'preference';
    timestep: number;
  }>;
}

// Suffix ordering for inheritance
const SUFFIX_ORDER = ['Jr', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Common nickname patterns
const NICKNAME_PATTERNS: Record<string, string[]> = {
  'Alexander': ['Alex', 'Xander', 'Lex'],
  'Alexandra': ['Alex', 'Lexi', 'Sandra'],
  'Elizabeth': ['Liz', 'Beth', 'Lizzy', 'Betty'],
  'William': ['Will', 'Bill', 'Billy', 'Liam'],
  'Michael': ['Mike', 'Mikey', 'Mick'],
  'Michelle': ['Micki', 'Shelly'],
  'Robert': ['Rob', 'Bob', 'Bobby'],
  'Katherine': ['Kate', 'Katie', 'Kathy'],
  'Christopher': ['Chris', 'Topher'],
  'Christina': ['Chris', 'Tina'],
  'Benjamin': ['Ben', 'Benny'],
  'Samuel': ['Sam', 'Sammy'],
  'Jonathan': ['Jon', 'Johnny'],
  'Jennifer': ['Jen', 'Jenny'],
  'Nicholas': ['Nick', 'Nicky'],
  'Daniel': ['Dan', 'Danny'],
  'Matthew': ['Matt'],
  'Patricia': ['Pat', 'Patty', 'Trish'],
  'Richard': ['Rick', 'Dick', 'Ricky'],
  'Thomas': ['Tom', 'Tommy'],
  'Anthony': ['Tony'],
  'Andrew': ['Andy', 'Drew'],
  'Joshua': ['Josh'],
  'Joseph': ['Joe', 'Joey'],
  'Margaret': ['Maggie', 'Meg', 'Peggy'],
  'David': ['Dave', 'Davey']
};

// ============================================================================
// CORE NAME FUNCTIONS
// ============================================================================

/**
 * Generate a full name with middle name and potential suffix
 */
export function generateFullName(
  firstName: string,
  lastName: string,
  gender: 'male' | 'female',
  father?: Character,
  mother?: Character
): FullName {
  // Generate middle name
  const middleName = generateMiddleName(firstName, gender, father, mother);
  
  // Determine suffix (if named after parent)
  const suffix = determineSuffix(firstName, middleName, lastName, father, mother);
  
  // Generate nickname
  const nickname = generateNickname(firstName);
  
  // Format names
  const fullName = formatFullName(firstName, middleName, lastName, suffix);
  const formalName = formatFormalName(firstName, middleName, lastName, suffix);
  const casualName = nickname || firstName;
  
  return {
    firstName,
    middleName,
    lastName,
    suffix,
    maidenName: null,  // Set on marriage
    nickname,
    fullName,
    formalName,
    casualName
  };
}

/**
 * Generate middle name
 * Often honors family members
 */
function generateMiddleName(
  firstName: string,
  gender: 'male' | 'female',
  father?: Character,
  mother?: Character
): string | null {
  // 70% chance of having a middle name
  if (Math.random() > 0.7) return null;
  
  const strategies = [
    // Honor grandfather's first name
    () => {
      if (Math.random() < 0.3 && father) {
        const fatherData = (father as any).customData || {};
        const grandFatherName = fatherData.fatherName;
        if (grandFatherName) return grandFatherName;
      }
      return null;
    },
    
    // Honor grandmother's maiden name
    () => {
      if (Math.random() < 0.2 && mother) {
        const motherData = (mother as any).customData || {};
        const maidenName = motherData.maidenName;
        if (maidenName) return maidenName;
      }
      return null;
    },
    
    // Mother's first name (especially for girls)
    () => {
      if (Math.random() < 0.15 && mother && gender === 'female') {
        return mother.firstName;
      }
      return null;
    },
    
    // Father's first name (especially for boys)
    () => {
      if (Math.random() < 0.15 && father && gender === 'male') {
        return father.firstName;
      }
      return null;
    },
    
    // Random common middle names
    () => {
      const commonMaleMiddle = ['James', 'Lee', 'Michael', 'Alexander', 'Joseph', 'David', 'Thomas'];
      const commonFemaleMiddle = ['Marie', 'Ann', 'Lynn', 'Elizabeth', 'Rose', 'Grace', 'Mae'];
      const list = gender === 'male' ? commonMaleMiddle : commonFemaleMiddle;
      return list[Math.floor(Math.random() * list.length)];
    }
  ];
  
  // Try strategies in order until one works
  for (const strategy of strategies) {
    const result = strategy();
    if (result) return result;
  }
  
  // Fallback
  return null;
}

/**
 * Determine suffix (Jr, Sr, II, III, etc.)
 * TotT pattern: Jr if exact match with living parent, II/III if same name in family
 */
function determineSuffix(
  firstName: string,
  middleName: string | null,
  lastName: string,
  father?: Character,
  mother?: Character
): string | null {
  if (!father) return null;
  
  // Check if named after father (exact first + last match)
  const fatherNameData = (father as any).customData?.name as FullName | undefined;
  
  if (father.firstName === firstName && father.lastName === lastName) {
    // Named after father
    const fatherSuffix = fatherNameData?.suffix;
    
    if (!fatherSuffix || fatherSuffix === 'Sr') {
      // Father has no suffix or is Sr → child is Jr
      return 'Jr';
    } else if (fatherSuffix === 'Jr') {
      // Father is Jr → grandfather exists, child is III
      return 'III';
    } else if (SUFFIX_ORDER.includes(fatherSuffix)) {
      // Father has numbered suffix → increment
      const index = SUFFIX_ORDER.indexOf(fatherSuffix);
      return SUFFIX_ORDER[index + 1] || null;
    }
  }
  
  return null;
}

/**
 * Generate nickname from first name
 */
function generateNickname(firstName: string): string | null {
  // 40% chance of using nickname
  if (Math.random() > 0.4) return null;
  
  // Check if name has common nicknames
  if (firstName in NICKNAME_PATTERNS) {
    const options = NICKNAME_PATTERNS[firstName];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate simple nickname (first syllable or shortened)
  if (firstName.length > 6) {
    return firstName.substring(0, 4);
  }
  
  return null;
}

/**
 * Format full name
 */
function formatFullName(
  firstName: string,
  middleName: string | null,
  lastName: string,
  suffix: string | null
): string {
  let name = firstName;
  if (middleName) name += ` ${middleName}`;
  name += ` ${lastName}`;
  if (suffix) name += ` ${suffix}`;
  return name;
}

/**
 * Format formal name
 */
function formatFormalName(
  firstName: string,
  middleName: string | null,
  lastName: string,
  suffix: string | null
): string {
  let name = firstName;
  if (middleName) name += ` ${middleName.charAt(0)}.`;
  name += ` ${lastName}`;
  if (suffix) name += ` ${suffix}`;
  return name;
}

// ============================================================================
// MARRIAGE & NAME CHANGES
// ============================================================================

/**
 * Update name on marriage
 * Most common: woman takes husband's last name, tracks maiden name
 */
export async function updateNameOnMarriage(
  characterId: string,
  spouseId: string,
  currentTimestep: number,
  takeSpouseName: boolean = true
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  const spouse = await storage.getCharacter(spouseId);
  
  if (!character || !spouse) return;
  
  const customData = (character as any).customData || {};
  const nameData = customData.name as FullName | undefined;
  
  if (!nameData || !takeSpouseName) return;
  
  // Store maiden name (birth last name)
  const maidenName = nameData.maidenName || character.lastName;
  
  // Take spouse's last name
  const newLastName = spouse.lastName;
  
  // Update name
  const updatedName: FullName = {
    ...nameData,
    lastName: newLastName,
    maidenName,
    fullName: formatFullName(nameData.firstName, nameData.middleName, newLastName, nameData.suffix),
    formalName: formatFormalName(nameData.firstName, nameData.middleName, newLastName, nameData.suffix)
  };
  
  // Update history
  const nameHistory = customData.nameHistory as NameHistory | undefined || {
    birthName: nameData.fullName,
    previousNames: [],
    nameChanges: []
  };
  
  nameHistory.previousNames.push(nameData.fullName);
  nameHistory.nameChanges.push({
    from: nameData.fullName,
    to: updatedName.fullName,
    reason: 'marriage',
    timestep: currentTimestep
  });
  
  // Save
  await storage.updateCharacter(characterId, {
    lastName: newLastName,
    customData: {
      ...customData,
      name: updatedName,
      nameHistory
    }
  } as any);
  
  console.log(`💍 ${nameData.fullName} → ${updatedName.fullName} (married)`);
}

/**
 * Update name on divorce (restore maiden name)
 */
export async function updateNameOnDivorce(
  characterId: string,
  currentTimestep: number,
  restoreMaidenName: boolean = true
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const customData = (character as any).customData || {};
  const nameData = customData.name as FullName | undefined;
  
  if (!nameData || !nameData.maidenName || !restoreMaidenName) return;
  
  // Restore maiden name
  const restoredLastName = nameData.maidenName;
  
  const updatedName: FullName = {
    ...nameData,
    lastName: restoredLastName,
    maidenName: null,  // No longer applicable
    fullName: formatFullName(nameData.firstName, nameData.middleName, restoredLastName, nameData.suffix),
    formalName: formatFormalName(nameData.firstName, nameData.middleName, restoredLastName, nameData.suffix)
  };
  
  // Update history
  const nameHistory = customData.nameHistory as NameHistory | undefined || {
    birthName: nameData.fullName,
    previousNames: [],
    nameChanges: []
  };
  
  nameHistory.previousNames.push(nameData.fullName);
  nameHistory.nameChanges.push({
    from: nameData.fullName,
    to: updatedName.fullName,
    reason: 'divorce',
    timestep: currentTimestep
  });
  
  // Save
  await storage.updateCharacter(characterId, {
    lastName: restoredLastName,
    customData: {
      ...customData,
      name: updatedName,
      nameHistory
    }
  } as any);
  
  console.log(`💔 ${nameData.fullName} → ${updatedName.fullName} (divorced, restored maiden name)`);
}

// ============================================================================
// SUFFIX MANAGEMENT
// ============================================================================

/**
 * Update parent's suffix when child is born with Jr
 * Father becomes Sr when son becomes Jr
 */
export async function updateParentSuffixOnBirth(
  parentId: string,
  childSuffix: string | null
): Promise<void> {
  if (childSuffix !== 'Jr') return;
  
  const parent = await storage.getCharacter(parentId);
  if (!parent) return;
  
  const customData = (parent as any).customData || {};
  const nameData = customData.name as FullName | undefined;
  
  if (!nameData || nameData.suffix) return;  // Already has suffix
  
  // Parent becomes Sr
  const updatedName: FullName = {
    ...nameData,
    suffix: 'Sr',
    fullName: formatFullName(nameData.firstName, nameData.middleName, nameData.lastName, 'Sr'),
    formalName: formatFormalName(nameData.firstName, nameData.middleName, nameData.lastName, 'Sr')
  };
  
  await storage.updateCharacter(parentId, {
    suffix: 'Sr',
    customData: {
      ...customData,
      name: updatedName
    }
  } as any);
  
  console.log(`👨‍👦 ${parent.firstName} ${parent.lastName} is now ${updatedName.fullName}`);
}

// ============================================================================
// NAME QUERIES
// ============================================================================

/**
 * Get full name data for character
 */
export async function getFullName(characterId: string): Promise<FullName | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  const customData = (character as any).customData || {};
  return customData.name as FullName | undefined || null;
}

/**
 * Get name history for character
 */
export async function getNameHistory(characterId: string): Promise<NameHistory | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  const customData = (character as any).customData || {};
  return customData.nameHistory as NameHistory | undefined || null;
}

/**
 * Get casual name (what friends call them)
 */
export async function getCasualName(characterId: string): Promise<string> {
  const nameData = await getFullName(characterId);
  if (!nameData) {
    const character = await storage.getCharacter(characterId);
    return character?.firstName || 'Unknown';
  }
  return nameData.casualName;
}

/**
 * Get formal name (for official documents)
 */
export async function getFormalName(characterId: string): Promise<string> {
  const nameData = await getFullName(characterId);
  if (!nameData) {
    const character = await storage.getCharacter(characterId);
    return `${character?.firstName || 'Unknown'} ${character?.lastName || ''}`;
  }
  return nameData.formalName;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize name system for a character at birth
 */
export async function initializeCharacterName(
  characterId: string,
  firstName: string,
  lastName: string,
  gender: 'male' | 'female',
  fatherId?: string,
  motherId?: string
): Promise<void> {
  let father, mother;
  if (fatherId) father = await storage.getCharacter(fatherId);
  if (motherId) mother = await storage.getCharacter(motherId);
  
  const nameData = generateFullName(firstName, lastName, gender, father, mother);
  
  // Create name history
  const nameHistory: NameHistory = {
    birthName: nameData.fullName,
    previousNames: [],
    nameChanges: []
  };
  
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const customData = (character as any).customData || {};
  
  await storage.updateCharacter(characterId, {
    firstName: nameData.firstName,
    middleName: nameData.middleName,
    lastName: nameData.lastName,
    suffix: nameData.suffix,
    customData: {
      ...customData,
      name: nameData,
      nameHistory
    }
  } as any);
  
  // If child has Jr suffix, update parent to Sr
  if (nameData.suffix === 'Jr' && father) {
    await updateParentSuffixOnBirth(father.id, nameData.suffix);
  }
  
  console.log(`👶 Born: ${nameData.fullName}`);
}

// All functions are already exported above with 'export function' or 'export async function'
