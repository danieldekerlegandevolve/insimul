/**
 * College Education System
 * 
 * Implements higher education with colleges, majors, degrees, and job requirements.
 * Based on Talk of the Town's occupation.py education mechanics.
 * 
 * Features:
 * - College attendance (ages 18-22)
 * - Multiple majors and fields of study
 * - Degree completion tracking
 * - Job requirements based on education
 * - Student life stage
 * - Dropout mechanics
 * - Academic performance
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { getPersonality, type BigFivePersonality } from './personality-behavior-system.js';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type EducationLevel = 'none' | 'high_school' | 'some_college' | 'bachelors' | 'masters' | 'doctorate';

export type Major = 
  | 'business' | 'engineering' | 'computer_science' | 'medicine' | 'law'
  | 'education' | 'psychology' | 'biology' | 'chemistry' | 'physics'
  | 'mathematics' | 'english' | 'history' | 'art' | 'music'
  | 'political_science' | 'economics' | 'sociology' | 'philosophy'
  | 'nursing' | 'architecture' | 'agriculture' | 'communications';

export interface EducationData {
  level: EducationLevel;
  major: Major | null;
  institution: string | null;
  
  // Current student status
  isStudent: boolean;
  enrolledAt: number | null;         // Timestep enrolled
  expectedGraduation: number | null; // Expected timestep
  currentYear: number;                // 1-4 for undergrad
  
  // Performance
  gpa: number;                        // 0-4.0
  creditsCompleted: number;
  creditsRequired: number;
  
  // Status
  graduated: boolean;
  graduatedAt: number | null;
  droppedOut: boolean;
  droppedOutAt: number | null;
  dropoutReason: string | null;
}

export interface Degree {
  level: EducationLevel;
  major: Major;
  institution: string;
  graduatedAt: number;
  gpa: number;
}

// College attendance rate (by personality/family background)
const BASE_COLLEGE_ATTENDANCE_RATE = 0.60; // 60% go to college

// Degree durations (in timesteps/days, assuming 1 day = 1 timestep)
const DEGREE_DURATIONS = {
  bachelors: 1460,  // ~4 years (365 * 4)
  masters: 730,     // ~2 years
  doctorate: 1825   // ~5 years
};

// GPA thresholds
const GPA_THRESHOLDS = {
  excellent: 3.7,
  good: 3.0,
  passing: 2.0,
  failing: 1.5
};

// Job education requirements
const JOB_EDUCATION_REQUIREMENTS: Record<string, { level: EducationLevel; preferredMajors?: Major[] }> = {
  'doctor': { level: 'doctorate', preferredMajors: ['medicine', 'biology'] },
  'lawyer': { level: 'doctorate', preferredMajors: ['law', 'political_science'] },
  'professor': { level: 'doctorate' },
  'engineer': { level: 'bachelors', preferredMajors: ['engineering', 'physics', 'mathematics'] },
  'software_developer': { level: 'bachelors', preferredMajors: ['computer_science', 'engineering', 'mathematics'] },
  'accountant': { level: 'bachelors', preferredMajors: ['business', 'economics', 'mathematics'] },
  'teacher': { level: 'bachelors', preferredMajors: ['education'] },
  'nurse': { level: 'bachelors', preferredMajors: ['nursing', 'biology'] },
  'architect': { level: 'bachelors', preferredMajors: ['architecture', 'engineering', 'art'] },
  'journalist': { level: 'bachelors', preferredMajors: ['communications', 'english', 'political_science'] },
  'scientist': { level: 'masters', preferredMajors: ['biology', 'chemistry', 'physics'] },
  'psychologist': { level: 'masters', preferredMajors: ['psychology'] },
  'manager': { level: 'bachelors', preferredMajors: ['business', 'economics'] },
  'artist': { level: 'none', preferredMajors: ['art'] },
  'musician': { level: 'none', preferredMajors: ['music'] },
  'chef': { level: 'none' },
  'construction_worker': { level: 'none' },
  'retail_worker': { level: 'high_school' },
  'secretary': { level: 'high_school', preferredMajors: ['business', 'communications'] }
};

// Major categories for selection
const MAJOR_CATEGORIES = {
  stem: ['engineering', 'computer_science', 'biology', 'chemistry', 'physics', 'mathematics', 'medicine'],
  business: ['business', 'economics', 'accounting'],
  humanities: ['english', 'history', 'philosophy', 'art', 'music'],
  social_sciences: ['psychology', 'sociology', 'political_science', 'education'],
  professional: ['law', 'nursing', 'architecture', 'agriculture', 'communications']
};

// ============================================================================
// COLLEGE DECISION
// ============================================================================

/**
 * Determine if character should attend college
 * Based on personality, intelligence, and family background
 */
export function shouldAttendCollege(
  character: Character,
  personality: BigFivePersonality
): { shouldAttend: boolean; probability: number } {
  let probability = BASE_COLLEGE_ATTENDANCE_RATE;
  
  // Conscientiousness strongly predicts college attendance
  probability += (personality.conscientiousness - 0.5) * 0.4; // ±20%
  
  // Openness (intellectual curiosity)
  probability += (personality.openness - 0.5) * 0.3; // ±15%
  
  // Neuroticism (anxiety about failure) can reduce attendance
  probability -= (personality.neuroticism - 0.5) * 0.2; // ±10%
  
  // Family background (parents with degrees encourage college)
  const customData = (character as any).customData || {};
  const parentEducation = customData.parentEducation as EducationLevel | undefined;
  
  if (parentEducation === 'bachelors' || parentEducation === 'masters' || parentEducation === 'doctorate') {
    probability += 0.25; // +25% if parents went to college
  }
  
  // Wealth/economics (can they afford it?)
  const wealth = customData.wealth as number | undefined;
  if (wealth && wealth < 1000) {
    probability -= 0.15; // -15% if poor
  } else if (wealth && wealth > 10000) {
    probability += 0.15; // +15% if wealthy
  }
  
  probability = Math.max(0, Math.min(1, probability));
  
  return {
    shouldAttend: Math.random() < probability,
    probability
  };
}

/**
 * Select a major based on personality and interests
 */
export function selectMajor(personality: BigFivePersonality, gender: string): Major {
  const weights: Partial<Record<Major, number>> = {};
  
  // STEM fields - high openness, low neuroticism
  if (personality.openness > 0.6 && personality.neuroticism < 0.5) {
    weights.engineering = 0.15;
    weights.computer_science = 0.12;
    weights.physics = 0.08;
    weights.mathematics = 0.08;
    weights.chemistry = 0.07;
    weights.biology = 0.10;
  }
  
  // Business - high conscientiousness, moderate extroversion
  if (personality.conscientiousness > 0.5 && personality.extroversion > 0.4) {
    weights.business = 0.15;
    weights.economics = 0.10;
  }
  
  // Humanities - high openness, high agreeableness
  if (personality.openness > 0.6 && personality.agreeableness > 0.5) {
    weights.english = 0.08;
    weights.history = 0.08;
    weights.philosophy = 0.06;
    weights.art = 0.07;
    weights.music = 0.05;
  }
  
  // Social sciences - high agreeableness, high openness
  if (personality.agreeableness > 0.6) {
    weights.psychology = 0.12;
    weights.sociology = 0.08;
    weights.education = 0.10;
  }
  
  // Medicine/Nursing - high conscientiousness, high agreeableness
  if (personality.conscientiousness > 0.6 && personality.agreeableness > 0.6) {
    weights.medicine = 0.08;
    weights.nursing = 0.10;
  }
  
  // Law - low agreeableness, high conscientiousness
  if (personality.conscientiousness > 0.6 && personality.agreeableness < 0.5) {
    weights.law = 0.10;
  }
  
  // Extroverted fields
  if (personality.extroversion > 0.6) {
    weights.communications = 0.10;
    weights.political_science = 0.08;
  }
  
  // Architecture - openness + conscientiousness
  if (personality.openness > 0.6 && personality.conscientiousness > 0.5) {
    weights.architecture = 0.08;
  }
  
  // Ensure we have at least some options
  if (Object.keys(weights).length === 0) {
    // Default options
    weights.business = 0.2;
    weights.psychology = 0.2;
    weights.english = 0.15;
    weights.communications = 0.15;
    weights.sociology = 0.15;
    weights.history = 0.15;
  }
  
  // Weighted random selection
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (const [major, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return major as Major;
    }
  }
  
  // Fallback
  return 'business';
}

// ============================================================================
// ENROLLMENT
// ============================================================================

/**
 * Enroll character in college
 */
export async function enrollInCollege(
  characterId: string,
  major: Major,
  institution: string,
  currentTimestep: number
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) return;
  
  const creditsRequired = 120; // Standard bachelor's degree
  const expectedGraduation = currentTimestep + DEGREE_DURATIONS.bachelors;
  
  const educationData: EducationData = {
    level: 'some_college',
    major,
    institution,
    isStudent: true,
    enrolledAt: currentTimestep,
    expectedGraduation,
    currentYear: 1,
    gpa: 3.0, // Start at B average
    creditsCompleted: 0,
    creditsRequired,
    graduated: false,
    graduatedAt: null,
    droppedOut: false,
    droppedOutAt: null,
    dropoutReason: null
  };
  
  const customData = (character as any).customData || {};
  
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      education: educationData
    }
  } as any);
  
  console.log(`🎓 ${character.firstName} enrolled in ${institution} studying ${major}`);
}

// ============================================================================
// ACADEMIC PROGRESS
// ============================================================================

/**
 * Update student progress (called periodically during simulation)
 */
export async function updateStudentProgress(
  characterId: string,
  currentTimestep: number
): Promise<{
  creditsEarned: number;
  yearAdvanced: boolean;
  graduated: boolean;
  droppedOut: boolean;
}> {
  const character = await storage.getCharacter(characterId);
  if (!character) return { creditsEarned: 0, yearAdvanced: false, graduated: false, droppedOut: false };
  
  const customData = (character as any).customData || {};
  const education = customData.education as EducationData | undefined;
  
  if (!education || !education.isStudent) {
    return { creditsEarned: 0, yearAdvanced: false, graduated: false, droppedOut: false };
  }
  
  const personality = getPersonality(character);
  
  // Calculate credits earned this period (semester)
  // Base: 15 credits per semester (30 per year)
  let creditsPerSemester = 15;
  
  // Conscientiousness affects performance
  creditsPerSemester *= (0.7 + (personality.conscientiousness * 0.6)); // 0.7-1.3x
  
  // Openness (intellectual engagement)
  creditsPerSemester *= (0.9 + (personality.openness * 0.2)); // 0.9-1.1x
  
  // Neuroticism (stress affects performance)
  creditsPerSemester *= (1.1 - (personality.neuroticism * 0.2)); // 0.9-1.1x
  
  creditsPerSemester = Math.max(6, Math.min(18, creditsPerSemester)); // 6-18 credits
  
  // Update credits
  education.creditsCompleted += creditsPerSemester;
  
  // Update GPA (varies slightly based on performance)
  const gpaChange = (Math.random() - 0.5) * 0.2 * personality.conscientiousness;
  education.gpa = Math.max(0, Math.min(4.0, education.gpa + gpaChange));
  
  // Check for year advancement (every 365 days / 30 credits)
  let yearAdvanced = false;
  const yearsSince = Math.floor((currentTimestep - (education.enrolledAt || 0)) / 365);
  if (yearsSince > education.currentYear && yearsSince <= 4) {
    education.currentYear = yearsSince;
    yearAdvanced = true;
    console.log(`🎓 ${character.firstName} advanced to year ${education.currentYear}`);
  }
  
  // Check for graduation
  let graduated = false;
  if (education.creditsCompleted >= education.creditsRequired && !education.graduated) {
    graduated = true;
    education.graduated = true;
    education.graduatedAt = currentTimestep;
    education.isStudent = false;
    education.level = 'bachelors';
    
    // Create degree record
    const degree: Degree = {
      level: 'bachelors',
      major: education.major!,
      institution: education.institution!,
      graduatedAt: currentTimestep,
      gpa: education.gpa
    };
    
    const degrees = customData.degrees as Degree[] || [];
    degrees.push(degree);
    
    customData.degrees = degrees;
    
    console.log(`🎓🎉 ${character.firstName} graduated with ${education.major} degree! (GPA: ${education.gpa.toFixed(2)})`);
  }
  
  // Check for dropout
  let droppedOut = false;
  if (!education.graduated) {
    const dropoutChance = calculateDropoutChance(education, personality, currentTimestep);
    
    if (Math.random() < dropoutChance) {
      droppedOut = true;
      education.droppedOut = true;
      education.droppedOutAt = currentTimestep;
      education.isStudent = false;
      
      // Determine reason
      const reasons = [
        'financial difficulties',
        'academic struggles',
        'personal reasons',
        'lack of interest',
        'health issues'
      ];
      
      if (education.gpa < GPA_THRESHOLDS.passing) {
        education.dropoutReason = 'academic struggles';
      } else if (personality.neuroticism > 0.7) {
        education.dropoutReason = 'personal reasons';
      } else {
        education.dropoutReason = reasons[Math.floor(Math.random() * reasons.length)];
      }
      
      console.log(`⚠️ ${character.firstName} dropped out of college (${education.dropoutReason})`);
    }
  }
  
  // Save updated education
  await storage.updateCharacter(characterId, {
    customData: {
      ...customData,
      education
    }
  } as any);
  
  return {
    creditsEarned: creditsPerSemester,
    yearAdvanced,
    graduated,
    droppedOut
  };
}

/**
 * Calculate dropout probability
 */
function calculateDropoutChance(
  education: EducationData,
  personality: BigFivePersonality,
  currentTimestep: number
): number {
  let dropoutChance = 0.02; // Base 2% per semester
  
  // GPA affects dropout
  if (education.gpa < GPA_THRESHOLDS.failing) {
    dropoutChance += 0.15; // +15% if failing
  } else if (education.gpa < GPA_THRESHOLDS.passing) {
    dropoutChance += 0.08; // +8% if struggling
  }
  
  // Conscientiousness (low = more likely to drop out)
  dropoutChance += (0.5 - personality.conscientiousness) * 0.1;
  
  // Neuroticism (high = stress leads to dropout)
  dropoutChance += (personality.neuroticism - 0.5) * 0.08;
  
  // Openness (intellectual interest) reduces dropout
  dropoutChance -= (personality.openness - 0.5) * 0.05;
  
  return Math.max(0, Math.min(0.3, dropoutChance)); // Cap at 30%
}

// ============================================================================
// JOB ELIGIBILITY
// ============================================================================

/**
 * Check if character meets education requirements for a job
 */
export function meetsEducationRequirement(
  character: Character,
  jobTitle: string
): {
  meets: boolean;
  hasPreferredMajor: boolean;
  educationLevel: EducationLevel;
  requiredLevel: EducationLevel;
} {
  const customData = (character as any).customData || {};
  const education = customData.education as EducationData | undefined;
  const degrees = customData.degrees as Degree[] | undefined;
  
  const requirement = JOB_EDUCATION_REQUIREMENTS[jobTitle];
  
  if (!requirement) {
    // No specific requirement
    return {
      meets: true,
      hasPreferredMajor: false,
      educationLevel: education?.level || 'none',
      requiredLevel: 'none'
    };
  }
  
  const currentLevel = education?.level || 'none';
  const meetsLevel = educationLevelMeetsRequirement(currentLevel, requirement.level);
  
  // Check for preferred major
  let hasPreferredMajor = false;
  if (requirement.preferredMajors && degrees) {
    hasPreferredMajor = degrees.some(degree => 
      requirement.preferredMajors!.includes(degree.major)
    );
  }
  
  return {
    meets: meetsLevel,
    hasPreferredMajor,
    educationLevel: currentLevel,
    requiredLevel: requirement.level
  };
}

/**
 * Check if education level meets requirement
 */
function educationLevelMeetsRequirement(
  currentLevel: EducationLevel,
  requiredLevel: EducationLevel
): boolean {
  const hierarchy: EducationLevel[] = ['none', 'high_school', 'some_college', 'bachelors', 'masters', 'doctorate'];
  const currentIndex = hierarchy.indexOf(currentLevel);
  const requiredIndex = hierarchy.indexOf(requiredLevel);
  
  return currentIndex >= requiredIndex;
}

/**
 * Get education level label
 */
export function getEducationLevelLabel(level: EducationLevel): string {
  const labels: Record<EducationLevel, string> = {
    none: 'No formal education',
    high_school: 'High school diploma',
    some_college: 'Some college',
    bachelors: "Bachelor's degree",
    masters: "Master's degree",
    doctorate: 'Doctoral degree (PhD)'
  };
  
  return labels[level];
}

/**
 * Get major label
 */
export function getMajorLabel(major: Major): string {
  return major.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get education data for character
 */
export async function getEducation(characterId: string): Promise<EducationData | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  const customData = (character as any).customData || {};
  return customData.education as EducationData | undefined || null;
}

/**
 * Get all degrees for character
 */
export async function getDegrees(characterId: string): Promise<Degree[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  const customData = (character as any).customData || {};
  return customData.degrees as Degree[] || [];
}

/**
 * Check if character is currently a student
 */
export async function isStudent(characterId: string): Promise<boolean> {
  const education = await getEducation(characterId);
  return education?.isStudent || false;
}

// ============================================================================
// DESCRIPTION
// ============================================================================

/**
 * Describe education status
 */
export function describeEducation(education: EducationData): string {
  if (education.isStudent) {
    return `Currently studying ${getMajorLabel(education.major!)} at ${education.institution} (Year ${education.currentYear}, GPA: ${education.gpa.toFixed(2)})`;
  } else if (education.graduated) {
    return `${getEducationLevelLabel(education.level)} in ${getMajorLabel(education.major!)} from ${education.institution}`;
  } else if (education.droppedOut) {
    return `Attended ${education.institution} for ${getMajorLabel(education.major!)} but did not complete (${education.dropoutReason})`;
  } else {
    return getEducationLevelLabel(education.level);
  }
}

// All functions are already exported above with 'export function' or 'export async function'
