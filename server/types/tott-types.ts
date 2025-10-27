/**
 * Talk of the Town Type Definitions
 * Core types for the TotT integration into Insimul
 */

// ============= OCCUPATION TYPES =============

export type OccupationVocation = 
  | 'Owner' 
  | 'Manager' 
  | 'Worker' 
  | 'Doctor' 
  | 'Lawyer' 
  | 'Apprentice'
  | 'Secretary'
  | 'Cashier'
  | 'Janitor'
  | 'Builder'
  | 'HotelMaid'
  | 'Waiter'
  | 'Laborer'
  | 'Groundskeeper'
  | 'Bottler'
  | 'Cook'
  | 'Dishwasher'
  | 'Stocker'
  | 'Seamstress'
  | 'Farmhand'
  | 'Miner'
  | 'Painter'
  | 'BankTeller'
  | 'Grocer'
  | 'Bartender'
  | 'Concierge'
  | 'DaycareProvider'
  | 'Landlord'
  | 'Baker'
  | 'Plasterer'
  | 'Barber'
  | 'Butcher'
  | 'Firefighter'
  | 'PoliceOfficer'
  | 'Carpenter'
  | 'TaxiDriver'
  | 'BusDriver'
  | 'Blacksmith'
  | 'Woodworker'
  | 'Stonecutter'
  | 'Dressmaker'
  | 'Distiller'
  | 'Plumber'
  | 'Joiner'
  | 'Innkeeper'
  | 'Nurse'
  | 'Farmer'
  | 'Shoemaker'
  | 'Brewer'
  | 'TattooArtist'
  | 'Puddler'
  | 'Clothier'
  | 'Teacher'
  | 'Principal'
  | 'Tailor'
  | 'Druggist'
  | 'InsuranceAgent'
  | 'Jeweler'
  | 'FireChief'
  | 'PoliceChief'
  | 'Realtor'
  | 'Mortician'
  | 'Engineer'
  | 'Pharmacist'
  | 'Architect'
  | 'Optometrist'
  | 'Dentist'
  | 'PlasticSurgeon'
  | 'Professor'
  | 'Mayor';

export interface OccupationLevel {
  level: number; // 1-5
  title: string;
  description: string;
}

export type ShiftType = 'day' | 'night';

export type TerminationReason = 
  | 'retirement' 
  | 'firing' 
  | 'quit' 
  | 'death' 
  | 'business_closure' 
  | 'promotion' 
  | 'relocation';

// ============= BUSINESS TYPES =============

export type BusinessType = 
  | 'Generic'
  | 'LawFirm'
  | 'ApartmentComplex'
  | 'Bakery'
  | 'Hospital'
  | 'Bank'
  | 'Hotel'
  | 'Restaurant'
  | 'GroceryStore'
  | 'Bar'
  | 'Daycare'
  | 'School'
  | 'PoliceStation'
  | 'FireStation'
  | 'TownHall'
  | 'Church'
  | 'Farm'
  | 'Factory'
  | 'Shop'
  | 'Mortuary'
  | 'RealEstateOffice'
  | 'InsuranceOffice'
  | 'JewelryStore'
  | 'TattoParlor'
  | 'Brewery'
  | 'Pharmacy'
  | 'DentalOffice'
  | 'OptometryOffice'
  | 'University';

export interface BusinessVacancy {
  occupation: OccupationVocation;
  shift: ShiftType;
  isSupplemental: boolean;
}

export interface ApartmentUnit {
  unitNumber: number;
  residentIds: string[];
  rentAmount: number;
  isVacant: boolean;
}

export interface BusinessData {
  units?: ApartmentUnit[]; // For ApartmentComplex
  specialization?: string; // For LawFirm, Hospital, etc.
  capacity?: number;
  services?: string[];
}

// ============= LOCATION TYPES =============

export type BuildingType = 'residence' | 'business' | 'vacant';

export type LocationType = 'home' | 'work' | 'leisure' | 'school';

export type ResidenceType = 
  | 'house'
  | 'apartment'
  | 'mansion'
  | 'cottage'
  | 'townhouse'
  | 'mobile_home';

// ============= PERSONALITY TYPES =============

export interface BigFivePersonality {
  openness: number; // -1 to 1
  conscientiousness: number; // -1 to 1
  extroversion: number; // -1 to 1
  agreeableness: number; // -1 to 1
  neuroticism: number; // -1 to 1
}

export interface DerivedTraits {
  gregarious: boolean; // E > 0.4 && A > 0.4 && N < -0.2
  cold: boolean; // E < -0.4 && A < 0 && C > 0.4
  creative: boolean; // O > 0.5
  organized: boolean; // C > 0.5
  anxious: boolean; // N > 0.5
  friendly: boolean; // A > 0.5 && E > 0
}

export type PersonalityStrength = 
  | 'very_high' // > 0.7
  | 'high' // 0.4 - 0.7
  | 'somewhat_high' // 0.1 - 0.4
  | 'neutral' // -0.1 - 0.1
  | 'somewhat_low' // -0.4 - -0.1
  | 'low' // -0.7 - -0.4
  | 'very_low'; // < -0.7

// ============= MIND & COGNITION TYPES =============

export interface MentalModel {
  characterId: string;
  beliefs: Record<string, any>;
  lastUpdated: number; // timestep
  confidence: number; // 0.0 - 1.0
}

export interface Thought {
  content: string;
  timestep: number;
  emotion?: string;
  related_to?: string[]; // Character IDs or event IDs
}

// ============= EVENT TYPES =============

export type EventType = 
  | 'birth'
  | 'death'
  | 'marriage'
  | 'divorce'
  | 'move'
  | 'departure'
  | 'hiring'
  | 'retirement'
  | 'home_purchase'
  | 'business_founding'
  | 'business_closure'
  | 'promotion'
  | 'graduation'
  | 'accident'
  | 'crime'
  | 'festival'
  | 'election';

export interface EventSideEffect {
  type: 'predicate' | 'relationship' | 'location' | 'occupation';
  target: string; // Character ID or entity ID
  action: 'set' | 'add' | 'remove' | 'modify';
  value: any;
}

// ============= ROUTINE TYPES =============

export type TimeOfDay = 'day' | 'night';

export type ActivityOccasion = 
  | 'working'
  | 'relaxing'
  | 'studying'
  | 'shopping'
  | 'socializing'
  | 'sleeping'
  | 'eating'
  | 'exercising'
  | 'commuting';

export interface RoutineDecision {
  location: string; // Location ID or description
  occasion: ActivityOccasion;
  duration: number; // In timesteps
  priority: number; // 0-10
}

// ============= HIRING SYSTEM TYPES =============

export interface HiringCandidate {
  characterId: string;
  currentOccupation?: string;
  qualificationScore: number;
  relationshipBonus: number;
  experienceLevel: number;
  totalScore: number;
}

export interface HiringPreferences {
  preferenceToHireFromWithinCompany: number;
  preferenceToHireImmediateFamily: number;
  preferenceToHireExtendedFamily: number;
  preferenceToHireFriend: number;
  preferenceToHireAcquaintance: number;
  dispreferenceToHireEnemy: number;
  unemploymentOccupationLevel: number;
}

export interface QualificationRequirement {
  minAge?: number;
  maxAge?: number;
  requiresCollegeDegree?: boolean;
  requiresExperience?: OccupationVocation[];
  genderRestriction?: 'male' | 'female' | null;
  yearBasedRestriction?: {
    beforeYear?: number;
    afterYear?: number;
  };
}

// ============= CONFIG TYPES =============

export interface OccupationConfig {
  vocation: OccupationVocation;
  baseLevel: number;
  qualifications: QualificationRequirement;
  availableShifts: ShiftType[];
  baseSalary?: number;
  specialActions?: string[]; // e.g., ['deliver_baby', 'file_divorce']
}

export interface TotTConfig {
  dateWorldgenBegins: [number, number, number]; // [year, month, day]
  dateGameplayBegins: [number, number, number]; // [year, month, day]
  jobLevels: Record<OccupationVocation, number>;
  initialJobVacancies: Record<BusinessType, BusinessVacancy[]>;
  hiringPreferences: HiringPreferences;
  occupationConfigs: OccupationConfig[];
  functionToDeterminePersonExNihiloAgeGivenJobLevel?: (jobLevel: number) => number;
}

// ============= HELPER FUNCTIONS =============

export function getPersonalityStrength(value: number): PersonalityStrength {
  if (value > 0.7) return 'very_high';
  if (value > 0.4) return 'high';
  if (value > 0.1) return 'somewhat_high';
  if (value > -0.1) return 'neutral';
  if (value > -0.4) return 'somewhat_low';
  if (value > -0.7) return 'low';
  return 'very_low';
}

export function calculateDerivedTraits(personality: BigFivePersonality): DerivedTraits {
  return {
    gregarious: personality.extroversion > 0.4 && 
                personality.agreeableness > 0.4 && 
                personality.neuroticism < -0.2,
    cold: personality.extroversion < -0.4 && 
          personality.agreeableness < 0 && 
          personality.conscientiousness > 0.4,
    creative: personality.openness > 0.5,
    organized: personality.conscientiousness > 0.5,
    anxious: personality.neuroticism > 0.5,
    friendly: personality.agreeableness > 0.5 && personality.extroversion > 0
  };
}

export function generatePersonExNihiloAge(jobLevel: number): number {
  const min = 18 + 2 * jobLevel;
  const max = 18 + 7 * jobLevel;
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function calculateYearsExperience(startYear: number, currentYear: number, endYear?: number): number {
  const end = endYear || currentYear;
  return Math.max(0, end - startYear);
}

export function isQualifiedForOccupation(
  characterAge: number,
  characterGender: string,
  isCollegeGraduate: boolean,
  currentYear: number,
  requirements: QualificationRequirement
): boolean {
  // Age check
  if (requirements.minAge && characterAge < requirements.minAge) return false;
  if (requirements.maxAge && characterAge > requirements.maxAge) return false;
  
  // Education check
  if (requirements.requiresCollegeDegree && !isCollegeGraduate) return false;
  
  // Gender restriction check (historical accuracy)
  if (requirements.genderRestriction && characterGender !== requirements.genderRestriction) {
    // Check year-based exceptions
    if (requirements.yearBasedRestriction) {
      if (requirements.yearBasedRestriction.afterYear && 
          currentYear >= requirements.yearBasedRestriction.afterYear) {
        // Restriction lifted after certain year
        return true;
      }
    }
    return false;
  }
  
  return true;
}

export function formatDate(year: number, month: number, day: number, timeOfDay: TimeOfDay): string {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const tod = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
  return `${tod} of ${monthNames[month - 1]} ${day}, ${year}`;
}
