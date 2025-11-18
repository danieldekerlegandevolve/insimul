import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, real, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============= TALK OF THE TOWN TYPE DEFINITIONS =============

// Occupation types (integrated from tott-types.ts)
export type OccupationVocation = 
  | 'Owner' | 'Manager' | 'Worker' | 'Doctor' | 'Lawyer' | 'Apprentice'
  | 'Secretary' | 'Cashier' | 'Janitor' | 'Builder' | 'HotelMaid' | 'Waiter'
  | 'Laborer' | 'Groundskeeper' | 'Bottler' | 'Cook' | 'Dishwasher' | 'Stocker'
  | 'Seamstress' | 'Farmhand' | 'Miner' | 'Painter' | 'BankTeller' | 'Grocer'
  | 'Bartender' | 'Concierge' | 'DaycareProvider' | 'Landlord' | 'Baker'
  | 'Plasterer' | 'Barber' | 'Butcher' | 'Firefighter' | 'PoliceOfficer'
  | 'Carpenter' | 'TaxiDriver' | 'BusDriver' | 'Blacksmith' | 'Woodworker'
  | 'Stonecutter' | 'Dressmaker' | 'Distiller' | 'Plumber' | 'Joiner'
  | 'Innkeeper' | 'Nurse' | 'Farmer' | 'Shoemaker' | 'Brewer' | 'TattooArtist'
  | 'Puddler' | 'Clothier' | 'Teacher' | 'Principal' | 'Tailor' | 'Druggist'
  | 'InsuranceAgent' | 'Jeweler' | 'FireChief' | 'PoliceChief' | 'Realtor'
  | 'Mortician' | 'Engineer' | 'Pharmacist' | 'Architect' | 'Optometrist'
  | 'Dentist' | 'PlasticSurgeon' | 'Professor' | 'Mayor';

export type BusinessType = 
  | 'Generic' | 'LawFirm' | 'ApartmentComplex' | 'Bakery' | 'Hospital' | 'Bank'
  | 'Hotel' | 'Restaurant' | 'GroceryStore' | 'Bar' | 'Daycare' | 'School'
  | 'PoliceStation' | 'FireStation' | 'TownHall' | 'Church' | 'Farm' | 'Factory'
  | 'Shop' | 'Mortuary' | 'RealEstateOffice' | 'InsuranceOffice' | 'JewelryStore'
  | 'TattoParlor' | 'Brewery' | 'Pharmacy' | 'DentalOffice' | 'OptometryOffice'
  | 'University';

export type ShiftType = 'day' | 'night';

export type TerminationReason = 
  | 'retirement' | 'firing' | 'quit' | 'death' | 'business_closure' | 'promotion' | 'relocation';

export type EventType = 
  | 'birth' | 'death' | 'marriage' | 'divorce' | 'move' | 'departure'
  | 'hiring' | 'retirement' | 'home_purchase' | 'business_founding' | 'business_closure'
  | 'promotion' | 'graduation' | 'accident' | 'crime' | 'festival' | 'election';

export type TimeOfDay = 'day' | 'night';

export type ActivityOccasion = 
  | 'working' | 'relaxing' | 'studying' | 'shopping' | 'socializing'
  | 'sleeping' | 'eating' | 'exercising' | 'commuting';

export type LocationType = 'home' | 'work' | 'leisure' | 'school';

export type BuildingType = 'residence' | 'business' | 'vacant';

export type ResidenceType = 
  | 'house' | 'apartment' | 'mansion' | 'cottage' | 'townhouse' | 'mobile_home';

export type PersonalityStrength = 
  | 'very_high' | 'high' | 'somewhat_high' | 'neutral'
  | 'somewhat_low' | 'low' | 'very_low';

// Personality and character types
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

// Business and occupation structures
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

// Mental models and cognition
export interface MentalModel {
  characterId: string;
  beliefs: Record<string, any>;
  lastUpdated: number;
  confidence: number; // 0.0 - 1.0
}

export interface Thought {
  content: string;
  timestep: number;
  emotion?: string;
  related_to?: string[];
}

// Helper functions for TotT
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

// ============= END TOTT TYPE DEFINITIONS =============

// Rules - single rule entities (can be base rules or world-specific)
// All rules are stored in Insimul format internally for execution
export const rules = pgTable("rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id"), // Nullable for base rules
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // Always stored in Insimul format for execution
  
  // Base rule indicator
  isBase: boolean("is_base").default(false), // true for global rules, false for world-specific
  
  // Authoring format (for display/editing only, not execution)
  sourceFormat: text("source_format").notNull().default("insimul"), // ensemble, kismet, tott, insimul
  
  ruleType: text("rule_type").notNull(), // trigger, volition, trait, default, pattern
  category: text("category"), // psychological, physical, social, economic, etc.
  priority: integer("priority").default(5),
  likelihood: real("likelihood").default(1.0),
  conditions: jsonb("conditions").$type<any[]>().default([]),
  effects: jsonb("effects").$type<any[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  isCompiled: boolean("is_compiled").default(false),
  compiledOutput: jsonb("compiled_output").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grammars - Tracery grammar templates for narrative generation
export const grammars = pgTable("grammars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  name: text("name").notNull().unique(), // e.g., "succession_ceremony"
  description: text("description"),
  grammar: jsonb("grammar").$type<Record<string, string | string[]>>().notNull(), // Tracery grammar object
  tags: jsonb("tags").$type<string[]>().default([]),
  worldType: text("world_type"), // e.g., "cyberpunk", "medieval-fantasy", "custom_pirate_world"
  gameType: text("game_type"), // e.g., "rpg", "language-learning", "simulation"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced characters with full TotT-style attributes
export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  suffix: text("suffix"),
  maidenName: text("maiden_name"),
  birthYear: integer("birth_year"),
  isAlive: boolean("is_alive").default(true),
  gender: text("gender").notNull(), // male, female, other
  
  // Physical and mental attributes
  personality: jsonb("personality").$type<{
    openness: number;
    conscientiousness: number;
    extroversion: number;
    agreeableness: number;
    neuroticism: number;
  }>().default({ openness: 0, conscientiousness: 0, extroversion: 0, agreeableness: 0, neuroticism: 0 }),
  physicalTraits: jsonb("physical_traits").$type<Record<string, any>>().default({}),
  mentalTraits: jsonb("mental_traits").$type<Record<string, any>>().default({}),
  skills: jsonb("skills").$type<Record<string, number>>().default({}),
  
  // Mind and cognition (TotT)
  memory: real("memory").default(0.5), // 0.0-1.0 scale
  mentalModels: jsonb("mental_models").$type<Record<string, any>>().default({}), // belief about others
  thoughts: jsonb("thoughts").$type<any[]>().default([]), // thought history
  
  // Social relationships and affiliations
  relationships: jsonb("relationships").$type<Record<string, any>>().default({}),
  socialAttributes: jsonb("social_attributes").$type<Record<string, any>>().default({}),
  
  // Detailed relationship tracking (TotT)
  coworkerIds: jsonb("coworker_ids").$type<string[]>().default([]),
  friendIds: jsonb("friend_ids").$type<string[]>().default([]),
  neighborIds: jsonb("neighbor_ids").$type<string[]>().default([]),
  immediateFamilyIds: jsonb("immediate_family_ids").$type<string[]>().default([]),
  extendedFamilyIds: jsonb("extended_family_ids").$type<string[]>().default([]),
  parentIds: jsonb("parent_ids").$type<string[]>().default([]),
  childIds: jsonb("child_ids").$type<string[]>().default([]),
  spouseId: varchar("spouse_id"),
  genealogyData: jsonb("genealogy_data").$type<Record<string, any>>().default({}),
  
  // Generation metadata
  generationMethod: text("generation_method"), // manual, ensemble, kismet, tott, insimul
  generationConfig: jsonb("generation_config").$type<Record<string, any>>().default({}),
  
  // Current state
  currentLocation: text("current_location").notNull(), // Characters must always be associated with a location
  occupation: text("occupation"),
  status: text("status").default("active"), // active, inactive, deceased
  
  // TotT-specific fields
  currentOccupationId: varchar("current_occupation_id"), // FK to occupations table
  currentResidenceId: varchar("current_residence_id"), // FK to residences table
  collegeGraduate: boolean("college_graduate").default(false),
  retired: boolean("retired").default(false),
  departureYear: integer("departure_year"), // year they left the city
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced worlds with procedural generation capabilities (now primary container)
// A world is an abstract universe/reality that can contain multiple countries, states, and settlements
// All worlds execute using Insimul engine; rules/actions can be authored in different formats
export const worlds = pgTable("worlds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  targetLanguage: text("target_language"), // For language-learning game type

  // Ownership and permissions
  ownerId: varchar("owner_id"), // User who owns/created this world (nullable for legacy/system worlds)
  visibility: text("visibility").default("private"), // private, unlisted, public
  isTemplate: boolean("is_template").default(false), // Allow others to clone this world

  // Access control
  allowedUserIds: jsonb("allowed_user_ids").$type<string[]>().default([]), // Users with explicit access
  maxPlayers: integer("max_players"), // Optional player limit
  requiresAuth: boolean("requires_auth").default(false), // Require authentication to play

  // Configuration
  config: jsonb("config").$type<Record<string, any>>().default({}),

  // World state and history (abstract, meta-level)
  worldData: jsonb("world_data").$type<Record<string, any>>().default({}),
  historicalEvents: jsonb("historical_events").$type<any[]>().default([]),

  // Generation settings
  generationConfig: jsonb("generation_config").$type<Record<string, any>>().default({}),

  // Version tracking for playthroughs
  version: integer("version").default(1), // Increment when world structure changes

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Countries - nation-states within a world
export const countries = pgTable("countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Government and economy
  governmentType: text("government_type"), // monarchy, republic, democracy, feudal, theocracy, empire
  economicSystem: text("economic_system"), // feudal, mercantile, agricultural, trade-based, craft-guilds, mixed
  socialStructure: jsonb("social_structure").$type<Record<string, any>>().default({}), // class system, nobility tiers, etc.
  
  // Country characteristics
  foundedYear: integer("founded_year"),
  culture: jsonb("culture").$type<Record<string, any>>().default({}),
  culturalValues: jsonb("cultural_values").$type<Record<string, any>>().default({}),
  laws: jsonb("laws").$type<any[]>().default([]),
  
  // Relationships with other countries
  alliances: jsonb("alliances").$type<string[]>().default([]), // IDs of allied countries
  enemies: jsonb("enemies").$type<string[]>().default([]), // IDs of enemy countries
  
  // Status
  isActive: boolean("is_active").default(true),
  dissolvedYear: integer("dissolved_year"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// States - regions within a country (provinces, states, territories)
export const states = pgTable("states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  countryId: varchar("country_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // State characteristics
  stateType: text("state_type").default("province"), // province, state, territory, region, duchy, county
  foundedYear: integer("founded_year"),
  terrain: text("terrain"), // plains, hills, mountains, coast, river, forest, desert
  
  // Governance
  governorId: varchar("governor_id"), // Character ID of the governor/ruler
  localGovernmentType: text("local_government_type"),
  
  // History tracking (for wars, annexations, etc.)
  previousCountryIds: jsonb("previous_country_ids").$type<string[]>().default([]),
  annexationHistory: jsonb("annexation_history").$type<any[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settlements - cities, towns, and villages within a state or country
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  countryId: varchar("country_id"), // Can be directly in a country
  stateId: varchar("state_id"), // Or within a state
  
  name: text("name").notNull(),
  description: text("description"),
  
  // Settlement type and characteristics
  settlementType: text("settlement_type").notNull(), // city, town, village
  terrain: text("terrain"), // plains, hills, mountains, coast, river, forest, desert
  
  // Demographics and founding
  population: integer("population").default(0),
  foundedYear: integer("founded_year"),
  founderIds: jsonb("founder_ids").$type<string[]>().default([]),
  currentGeneration: integer("current_generation").default(0),
  maxGenerations: integer("max_generations").default(10),
  
  // Governance
  mayorId: varchar("mayor_id"), // Character ID of mayor/leader
  localGovernmentType: text("local_government_type"),
  
  // Geography (stored as JSONB for flexibility)
  districts: jsonb("districts").$type<any[]>().default([]),
  streets: jsonb("streets").$type<any[]>().default([]),
  landmarks: jsonb("landmarks").$type<any[]>().default([]),
  
  // Social and economic data
  socialStructure: jsonb("social_structure").$type<Record<string, any>>().default({}),
  economicData: jsonb("economic_data").$type<Record<string, any>>().default({}),
  
  // Genealogy tracking for this settlement
  genealogies: jsonb("genealogies").$type<Record<string, any>>().default({}),
  familyTrees: jsonb("family_trees").$type<Record<string, any>>().default({}),
  
  // TotT-specific tracking
  unemployedCharacterIds: jsonb("unemployed_character_ids").$type<string[]>().default([]),
  vacantLotIds: jsonb("vacant_lot_ids").$type<string[]>().default([]),
  departedCharacterIds: jsonb("departed_character_ids").$type<string[]>().default([]),
  deceasedCharacterIds: jsonb("deceased_character_ids").$type<string[]>().default([]),
  
  // History tracking (for wars, annexations, etc.)
  previousCountryIds: jsonb("previous_country_ids").$type<string[]>().default([]),
  previousStateIds: jsonb("previous_state_ids").$type<string[]>().default([]),
  annexationHistory: jsonb("annexation_history").$type<any[]>().default([]),
  
  // Generation config specific to this settlement
  generationConfig: jsonb("generation_config").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced simulations - all execute using Insimul engine
export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Simulation configuration
  config: jsonb("config").$type<Record<string, any>>().default({}),
  
  // Execution parameters
  startTime: integer("start_time").default(0),
  endTime: integer("end_time"),
  currentTime: integer("current_time").default(0),
  timeStep: integer("time_step").default(1),
  
  // Results and state
  results: jsonb("results").$type<Record<string, any>>().default({}),
  socialRecord: jsonb("social_record").$type<any[]>().default([]), // Track social interactions
  narrativeOutput: jsonb("narrative_output").$type<string[]>().default([]),
  
  // Execution status
  status: text("status").default("pending"), // pending, running, completed, failed, paused
  progress: real("progress").default(0.0),
  errorLog: jsonb("error_log").$type<string[]>().default([]),
  
  // Performance metrics
  executionTime: real("execution_time"),
  rulesExecuted: integer("rules_executed").default(0),
  eventsGenerated: integer("events_generated").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Actions table - stores discrete actions (can be base actions or world-specific)
// All actions are stored in Insimul format internally for execution
export const actions = pgTable("actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id"), // Nullable for base actions
  name: text("name").notNull(),
  description: text("description"),

  // Base action indicator
  isBase: boolean("is_base").default(false), // true for global actions, false for world-specific

  // Authoring format (for display/editing only, not execution)
  sourceFormat: text("source_format").notNull().default("insimul"), // ensemble, kismet, tott, insimul

  // Action categorization
  actionType: text("action_type").notNull(), // social, physical, mental, economic, etc.
  category: text("category"), // conversation, combat, trade, etc.

  // Action properties
  duration: integer("duration").default(1), // time steps to complete
  difficulty: real("difficulty").default(0.5), // 0.0 to 1.0
  energyCost: integer("energy_cost").default(1),

  // Prerequisites and effects
  prerequisites: jsonb("prerequisites").$type<any[]>().default([]),
  effects: jsonb("effects").$type<any[]>().default([]),
  sideEffects: jsonb("side_effects").$type<any[]>().default([]),

  // Targeting and scope
  targetType: text("target_type"), // self, other, location, object, none
  requiresTarget: boolean("requires_target").default(false),
  range: integer("range").default(0), // 0 for same location

  // Availability and triggers
  isAvailable: boolean("is_available").default(true),
  cooldown: integer("cooldown").default(0), // time steps before can use again
  triggerConditions: jsonb("trigger_conditions").$type<any[]>().default([]),

  // Narrative and presentation
  verbPast: text("verb_past"), // e.g., "talked", "fought"
  verbPresent: text("verb_present"), // e.g., "talks", "fights"
  narrativeTemplates: jsonb("narrative_templates").$type<string[]>().default([]),

  // Custom data for extensibility
  customData: jsonb("custom_data").$type<Record<string, any>>().default({}),

  // Tags and metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Truths - stores past, present, and future truths about the world and characters
export const truths = pgTable("truths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  characterId: varchar("character_id"), // null for world-level truth

  // Entry metadata
  title: text("title").notNull(),
  content: text("content").notNull(),
  entryType: text("entry_type").notNull(), // event, backstory, relationship, achievement, milestone, prophecy, plan

  // Temporal information (generic timestep-based)
  timestep: integer("timestep").notNull().default(0), // Generic time unit, can be compared for past/present/future
  timestepDuration: integer("timestep_duration").default(1), // How many timesteps this truth spans
  timeYear: integer("time_year"), // Optional: year in world timeline for display
  timeSeason: text("time_season"), // Optional: spring, summer, fall, winter
  timeDescription: text("time_description"), // Optional: "In the third year of King Edmund's reign"

  // Related entities
  relatedCharacterIds: jsonb("related_character_ids").$type<string[]>().default([]),
  relatedLocationIds: jsonb("related_location_ids").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),

  // Importance and visibility
  importance: integer("importance").default(5), // 1-10, affects visibility
  isPublic: boolean("is_public").default(true), // false for character secrets

  // Source tracking
  source: text("source"), // "imported_ensemble", "user_created", "simulation_generated"
  sourceData: jsonb("source_data").$type<Record<string, any>>().default({}),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quests - stores language learning quests assigned to players
export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  
  // Quest participants (Ensemble-style predicates)
  assignedTo: text("assigned_to").notNull(), // Player character name (first)
  assignedBy: text("assigned_by"), // NPC character name (second)
  assignedToCharacterId: varchar("assigned_to_character_id"), // Player character ID
  assignedByCharacterId: varchar("assigned_by_character_id"), // NPC character ID
  
  // Quest details
  title: text("title").notNull(),
  description: text("description").notNull(),
  questType: text("quest_type").notNull(), // conversation, translation, vocabulary, grammar, cultural
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  targetLanguage: text("target_language").notNull(), // French, English
  
  // Quest objectives and progress
  objectives: jsonb("objectives").$type<any[]>().default([]),
  progress: jsonb("progress").$type<Record<string, any>>().default({}),
  
  // Quest status
  status: text("status").default("active"), // active, completed, failed, abandoned
  completionCriteria: jsonb("completion_criteria").$type<Record<string, any>>().default({}),
  
  // Rewards and XP
  experienceReward: integer("experience_reward").default(0),
  rewards: jsonb("rewards").$type<Record<string, any>>().default({}),
  
  // Timing
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  
  // Metadata
  conversationContext: text("conversation_context"), // Context from the conversation that triggered the quest
  tags: jsonb("tags").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= TALK OF THE TOWN INTEGRATION TABLES =============

// Occupations - tracks character employment history and current jobs
export const occupations = pgTable("occupations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  characterId: varchar("character_id").notNull(),
  businessId: varchar("business_id").notNull(),
  
  // Occupation details
  vocation: text("vocation").notNull(), // Doctor, Lawyer, Worker, etc.
  level: integer("level").default(1), // 1-5 hierarchy
  shift: text("shift").notNull(), // day, night
  
  // Time tracking
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  yearsExperience: integer("years_experience").default(0),
  
  // Termination details
  terminationReason: text("termination_reason"), // retirement, firing, quit, death
  
  // Succession tracking
  predecessorId: varchar("predecessor_id"), // who had this job before
  successorId: varchar("successor_id"), // who took over this job
  
  // Special flags
  isSupplemental: boolean("is_supplemental").default(false),
  hiredAsFavor: boolean("hired_as_favor").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Businesses - companies and organizations that employ characters
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  settlementId: varchar("settlement_id").notNull(), // Businesses belong to settlements
  
  // Business details
  name: text("name").notNull(),
  businessType: text("business_type").notNull(), // LawFirm, ApartmentComplex, Bakery, etc.
  
  // Ownership
  ownerId: varchar("owner_id").notNull(), // current owner's character ID
  founderId: varchar("founder_id").notNull(), // original founder's character ID
  
  // Status
  isOutOfBusiness: boolean("is_out_of_business").default(false),
  foundedYear: integer("founded_year").notNull(),
  closedYear: integer("closed_year"),
  
  // Location (reference to lot)
  lotId: varchar("lot_id"),
  
  // Vacancies (structured storage for job openings)
  vacancies: jsonb("vacancies").$type<{ day: string[], night: string[] }>().default({ day: [], night: [] }),
  
  // Business-specific data
  businessData: jsonb("business_data").$type<Record<string, any>>().default({}), // For ApartmentComplex units, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lots - land parcels with addresses and buildings
export const lots = pgTable("lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  settlementId: varchar("settlement_id").notNull(), // Lots belong to settlements
  
  // Address
  address: text("address").notNull(),
  houseNumber: integer("house_number").notNull(),
  streetName: text("street_name").notNull(),
  block: text("block"),
  districtName: text("district_name"), // Which district/neighborhood
  
  // Building on the lot
  buildingId: varchar("building_id"), // Can be residence or business ID
  buildingType: text("building_type"), // residence, business, vacant
  
  // Spatial relationships
  neighboringLotIds: jsonb("neighboring_lot_ids").$type<string[]>().default([]),
  distanceFromDowntown: integer("distance_from_downtown").default(0),
  
  // History
  formerBuildingIds: jsonb("former_building_ids").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Residences - homes where characters live
export const residences = pgTable("residences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  settlementId: varchar("settlement_id").notNull(), // Residences belong to settlements
  lotId: varchar("lot_id").notNull(),
  
  // Ownership and occupancy
  ownerIds: jsonb("owner_ids").$type<string[]>().default([]), // Can have multiple owners
  residentIds: jsonb("resident_ids").$type<string[]>().default([]), // Who lives here
  
  // Address (inherited from lot but stored for convenience)
  address: text("address").notNull(),
  
  // Residence type
  residenceType: text("residence_type").default("house"), // house, apartment, mansion, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Whereabouts - tracks character location history
export const whereabouts = pgTable("whereabouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull(),
  characterId: varchar("character_id").notNull(),
  
  // Location details
  location: text("location").notNull(), // Can be business ID, residence ID, or description
  locationType: text("location_type").notNull(), // home, work, leisure, school
  occasion: text("occasion"), // working, relaxing, studying, etc.
  
  // Time tracking
  timestep: integer("timestep").notNull(),
  timeOfDay: text("time_of_day").notNull(), // day, night
  date: timestamp("date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertRuleSchema = createInsertSchema(rules).pick({
  worldId: true,
  name: true,
  description: true,
  content: true,
  isBase: true,
  sourceFormat: true,
  ruleType: true,
  category: true,
  priority: true,
  likelihood: true,
  conditions: true,
  effects: true,
  tags: true,
  dependencies: true,
  isActive: true,
  isCompiled: true,
  compiledOutput: true,
});

export const insertGrammarSchema = createInsertSchema(grammars).pick({
  worldId: true,
  name: true,
  description: true,
  grammar: true,
  tags: true,
  worldType: true,
  gameType: true,
  isActive: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorldSchema = createInsertSchema(worlds).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStateSchema = createInsertSchema(states).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSimulationSchema = createInsertSchema(simulations).pick({
  worldId: true,
  name: true,
  description: true,
  config: true,
  startTime: true,
  endTime: true,
  timeStep: true,
  results: true,
  status: true,
  progress: true,
  executionTime: true,
  rulesExecuted: true,
  eventsGenerated: true,
  narrativeOutput: true,
});

export const insertActionSchema = createInsertSchema(actions).pick({
  worldId: true,
  name: true,
  description: true,
  isBase: true,
  sourceFormat: true,
  actionType: true,
  category: true,
  duration: true,
  difficulty: true,
  energyCost: true,
  prerequisites: true,
  effects: true,
  sideEffects: true,
  targetType: true,
  requiresTarget: true,
  range: true,
  isAvailable: true,
  cooldown: true,
  triggerConditions: true,
  verbPast: true,
  verbPresent: true,
  narrativeTemplates: true,
  customData: true,
  tags: true,
  isActive: true,
});

export const insertTruthSchema = createInsertSchema(truths).pick({
  worldId: true,
  characterId: true,
  title: true,
  content: true,
  entryType: true,
  timestep: true,
  timestepDuration: true,
  timeYear: true,
  timeSeason: true,
  timeDescription: true,
  relatedCharacterIds: true,
  relatedLocationIds: true,
  tags: true,
  importance: true,
  isPublic: true,
  source: true,
  sourceData: true,
});

export const insertQuestSchema = createInsertSchema(quests).pick({
  worldId: true,
  assignedTo: true,
  assignedBy: true,
  assignedToCharacterId: true,
  assignedByCharacterId: true,
  title: true,
  description: true,
  questType: true,
  difficulty: true,
  targetLanguage: true,
  objectives: true,
  progress: true,
  status: true,
  completionCriteria: true,
  experienceReward: true,
  rewards: true,
  expiresAt: true,
  conversationContext: true,
  tags: true,
});

// ============= USER AUTHENTICATION AND PLAYER PROGRESS =============

// Users - authentication and account management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  // Profile
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),

  // Account status
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player Progress - tracks player progress across worlds and games
export const playerProgress = pgTable("player_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  worldId: varchar("world_id").notNull(),

  // Player character association
  characterId: varchar("character_id"), // The character this player controls in the game

  // Progress metrics
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  playtime: integer("playtime").default(0), // in seconds

  // Game state
  currentPosition: jsonb("current_position").$type<{ x: number; y: number; z: number }>().default({ x: 0, y: 0, z: 0 }),
  currentLocation: text("current_location"), // Settlement or location name

  // Progress tracking
  questsCompleted: jsonb("quests_completed").$type<string[]>().default([]),
  achievementsUnlocked: jsonb("achievements_unlocked").$type<string[]>().default([]),
  stats: jsonb("stats").$type<Record<string, number>>().default({}),
  inventory: jsonb("inventory").$type<any[]>().default([]),

  // Checkpoints and saves
  lastCheckpoint: jsonb("last_checkpoint").$type<Record<string, any>>().default({}),
  saveData: jsonb("save_data").$type<Record<string, any>>().default({}),

  // Session tracking
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
  sessionsCount: integer("sessions_count").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player Sessions - tracks individual play sessions
export const playerSessions = pgTable("player_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  worldId: varchar("world_id").notNull(),
  progressId: varchar("progress_id").notNull(),

  // Session details
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0), // in seconds

  // Session metrics
  experienceGained: integer("experience_gained").default(0),
  questsCompletedInSession: integer("quests_completed_in_session").default(0),
  achievementsEarnedInSession: integer("achievements_earned_in_session").default(0),

  // Session data
  sessionData: jsonb("session_data").$type<Record<string, any>>().default({}),

  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements - defines available achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id"), // null for global achievements

  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),

  // Achievement criteria
  achievementType: text("achievement_type").notNull(), // quest_completion, level_reached, time_played, social_interaction
  criteria: jsonb("criteria").$type<Record<string, any>>().default({}),

  // Rewards
  experienceReward: integer("experience_reward").default(0),
  rewards: jsonb("rewards").$type<Record<string, any>>().default({}),

  // Metadata
  isHidden: boolean("is_hidden").default(false),
  rarity: text("rarity").default("common"), // common, uncommon, rare, epic, legendary

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= PLAYTHROUGHS AND PLAYER ISOLATION =============

// Playthroughs - player-specific instances of a world
// Each player gets their own isolated playthrough where they can make changes
// without affecting the base world or other players
export const playthroughs = pgTable("playthroughs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  worldId: varchar("world_id").notNull(),

  // Snapshot info - which version of the world this playthrough is based on
  worldSnapshotVersion: integer("world_snapshot_version").notNull().default(1),

  // Playthrough metadata
  name: text("name"), // Player can name their playthrough (e.g., "My First Adventure")
  description: text("description"),
  notes: text("notes"), // Player notes

  // Playthrough state
  status: text("status").default("active"), // active, completed, abandoned, paused
  currentTimestep: integer("current_timestep").default(0),

  // Progress tracking
  playtime: integer("playtime").default(0), // Total playtime in seconds
  actionsCount: integer("actions_count").default(0), // Total actions taken
  decisionsCount: integer("decisions_count").default(0), // Major decisions made

  // Session tracking
  startedAt: timestamp("started_at").defaultNow(),
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
  completedAt: timestamp("completed_at"),

  // Player character
  playerCharacterId: varchar("player_character_id"), // Which character the player controls

  // Save state
  saveData: jsonb("save_data").$type<Record<string, any>>().default({}),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Playthrough Deltas - tracks changes made in a playthrough
// Uses copy-on-write: only stores what changed from the base world
export const playthroughDeltas = pgTable("playthrough_deltas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playthroughId: varchar("playthrough_id").notNull(),

  // What entity changed
  entityType: text("entity_type").notNull(), // character, settlement, rule, action, etc.
  entityId: varchar("entity_id").notNull(), // ID of the base entity (if updating) or new ID (if creating)
  operation: text("operation").notNull(), // create, update, delete

  // The delta data
  deltaData: jsonb("delta_data").$type<Record<string, any>>(), // Only changed fields for updates
  fullData: jsonb("full_data").$type<Record<string, any>>(), // Full object for creates

  // When this change occurred
  timestep: integer("timestep").notNull(),
  appliedAt: timestamp("applied_at").defaultNow(),

  // Metadata
  description: text("description"), // Optional description of the change
  tags: jsonb("tags").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow(),
});

// Play Traces - detailed log of player actions and decisions
// This is the audit trail of everything a player does in their playthrough
export const playTraces = pgTable("play_traces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playthroughId: varchar("playthrough_id").notNull(),
  userId: varchar("user_id").notNull(),

  // Action details
  actionType: text("action_type").notNull(), // move, interact, dialogue, combat, quest_accept, etc.
  actionName: text("action_name"), // Human-readable name
  actionData: jsonb("action_data").$type<Record<string, any>>().default({}),

  // Context
  timestep: integer("timestep").notNull(),
  characterId: varchar("character_id"), // Player's character
  targetId: varchar("target_id"), // Target of the action (NPC, item, location, etc.)
  targetType: text("target_type"), // character, item, location, etc.
  locationId: varchar("location_id"), // Where the action took place

  // Results and outcomes
  outcome: text("outcome"), // success, failure, partial, etc.
  outcomeData: jsonb("outcome_data").$type<Record<string, any>>().default({}),
  stateChanges: jsonb("state_changes").$type<any[]>().default([]), // What changed as a result

  // Narrative
  narrativeText: text("narrative_text"), // Generated narrative description

  // Timing
  durationMs: integer("duration_ms"), // How long the action took (for analytics)
  timestamp: timestamp("timestamp").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for Talk of the Town tables
export const insertOccupationSchema = createInsertSchema(occupations).pick({
  worldId: true,
  characterId: true,
  businessId: true,
  vocation: true,
  level: true,
  shift: true,
  startYear: true,
  endYear: true,
  yearsExperience: true,
  terminationReason: true,
  predecessorId: true,
  successorId: true,
  isSupplemental: true,
  hiredAsFavor: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).pick({
  worldId: true,
  settlementId: true,
  name: true,
  businessType: true,
  ownerId: true,
  founderId: true,
  isOutOfBusiness: true,
  foundedYear: true,
  closedYear: true,
  lotId: true,
  vacancies: true,
  businessData: true,
});

export const insertLotSchema = createInsertSchema(lots).pick({
  worldId: true,
  settlementId: true,
  address: true,
  houseNumber: true,
  streetName: true,
  block: true,
  districtName: true,
  buildingId: true,
  buildingType: true,
  neighboringLotIds: true,
  distanceFromDowntown: true,
  formerBuildingIds: true,
});

export const insertResidenceSchema = createInsertSchema(residences).pick({
  worldId: true,
  settlementId: true,
  lotId: true,
  ownerIds: true,
  residentIds: true,
  address: true,
  residenceType: true,
});

export const insertWhereaboutsSchema = createInsertSchema(whereabouts).pick({
  worldId: true,
  characterId: true,
  location: true,
  locationType: true,
  occasion: true,
  timestep: true,
  timeOfDay: true,
  date: true,
});

// Types
export type Rule = typeof rules.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;

export type Grammar = typeof grammars.$inferSelect;
export type InsertGrammar = z.infer<typeof insertGrammarSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type World = typeof worlds.$inferSelect;
export type InsertWorld = z.infer<typeof insertWorldSchema>;

export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;

export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema>;

export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;

export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;

export type Truth = typeof truths.$inferSelect;
export type InsertTruth = z.infer<typeof insertTruthSchema>;

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;

// Talk of the Town types
export type Occupation = typeof occupations.$inferSelect;
export type InsertOccupation = z.infer<typeof insertOccupationSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Lot = typeof lots.$inferSelect;
export type InsertLot = z.infer<typeof insertLotSchema>;

export type Residence = typeof residences.$inferSelect;
export type InsertResidence = z.infer<typeof insertResidenceSchema>;

export type Whereabouts = typeof whereabouts.$inferSelect;
export type InsertWhereabouts = z.infer<typeof insertWhereaboutsSchema>;

// User and Player Progress insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerProgressSchema = createInsertSchema(playerProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerSessionSchema = createInsertSchema(playerSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Playthrough insert schemas
export const insertPlaythroughSchema = createInsertSchema(playthroughs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaythroughDeltaSchema = createInsertSchema(playthroughDeltas).omit({
  id: true,
  createdAt: true,
});

export const insertPlayTraceSchema = createInsertSchema(playTraces).omit({
  id: true,
  createdAt: true,
});

// User and Player Progress types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PlayerProgress = typeof playerProgress.$inferSelect;
export type InsertPlayerProgress = z.infer<typeof insertPlayerProgressSchema>;

export type PlayerSession = typeof playerSessions.$inferSelect;
export type InsertPlayerSession = z.infer<typeof insertPlayerSessionSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Playthrough types
export type Playthrough = typeof playthroughs.$inferSelect;
export type InsertPlaythrough = z.infer<typeof insertPlaythroughSchema>;

export type PlaythroughDelta = typeof playthroughDeltas.$inferSelect;
export type InsertPlaythroughDelta = z.infer<typeof insertPlaythroughDeltaSchema>;

export type PlayTrace = typeof playTraces.$inferSelect;
export type InsertPlayTrace = z.infer<typeof insertPlayTraceSchema>;
