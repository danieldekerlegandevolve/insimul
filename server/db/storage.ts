import {
  type Rule,
  type InsertRule,
  type Grammar,
  type InsertGrammar,
  type Character,
  type InsertCharacter,
  type World,
  type InsertWorld,
  type Country,
  type InsertCountry,
  type State,
  type InsertState,
  type Settlement,
  type InsertSettlement,
  type Lot,
  type InsertLot,
  type Business,
  type InsertBusiness,
  type Residence,
  type InsertResidence,
  type Occupation,
  type InsertOccupation,
  type Simulation,
  type InsertSimulation,
  type Action,
  type InsertAction,
  type Truth,
  type InsertTruth,
  type Quest,
  type InsertQuest,
  type VisualAsset,
  type InsertVisualAsset,
  type AssetCollection,
  type InsertAssetCollection,
  type GenerationJob,
  type InsertGenerationJob
} from "@shared/schema";
import type {
  WorldLanguage,
  InsertWorldLanguage,
  LanguageChatMessage,
  InsertLanguageChatMessage,
  LanguageScopeType
} from "@shared/language";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import { MongoStorage } from "./mongo-storage";

export interface IStorage {
  // Worlds (now the primary container)
  getWorld(id: string): Promise<World | undefined>;
  getWorlds(): Promise<World[]>;
  createWorld(world: InsertWorld): Promise<World>;
  updateWorld(id: string, world: Partial<InsertWorld>): Promise<World | undefined>;
  deleteWorld(id: string): Promise<boolean>;

  // Countries
  getCountry(id: string): Promise<Country | undefined>;
  getCountriesByWorld(worldId: string): Promise<Country[]>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: string, country: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: string): Promise<boolean>;

  // States
  getState(id: string): Promise<State | undefined>;
  getStatesByWorld(worldId: string): Promise<State[]>;
  getStatesByCountry(countryId: string): Promise<State[]>;
  createState(state: InsertState): Promise<State>;
  updateState(id: string, state: Partial<InsertState>): Promise<State | undefined>;
  deleteState(id: string): Promise<boolean>;

  // Settlements
  getSettlement(id: string): Promise<Settlement | undefined>;
  getSettlementsByWorld(worldId: string): Promise<Settlement[]>;
  getSettlementsByCountry(countryId: string): Promise<Settlement[]>;
  getSettlementsByState(stateId: string): Promise<Settlement[]>;
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  updateSettlement(id: string, settlement: Partial<InsertSettlement>): Promise<Settlement | undefined>;
  deleteSettlement(id: string): Promise<boolean>;

  // Lots
  getLot(id: string): Promise<Lot | undefined>;
  getLotsBySettlement(settlementId: string): Promise<Lot[]>;
  createLot(lot: InsertLot): Promise<Lot>;
  updateLot(id: string, lot: Partial<InsertLot>): Promise<Lot | undefined>;
  deleteLot(id: string): Promise<boolean>;

  // Businesses
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessesBySettlement(settlementId: string): Promise<Business[]>;
  getBusinessesByWorld(worldId: string): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;
  deleteBusiness(id: string): Promise<boolean>;

  // Residences
  getResidence(id: string): Promise<Residence | undefined>;
  getResidencesBySettlement(settlementId: string): Promise<Residence[]>;
  createResidence(residence: InsertResidence): Promise<Residence>;
  updateResidence(id: string, residence: Partial<InsertResidence>): Promise<Residence | undefined>;
  deleteResidence(id: string): Promise<boolean>;

  // Occupations (TotT)
  getOccupation(id: string): Promise<Occupation | undefined>;
  getOccupationsByCharacter(characterId: string): Promise<Occupation[]>;
  getOccupationsByBusiness(businessId: string): Promise<Occupation[]>;
  getCurrentOccupation(characterId: string): Promise<Occupation | undefined>;
  createOccupation(occupation: InsertOccupation): Promise<Occupation>;
  updateOccupation(id: string, occupation: Partial<InsertOccupation>): Promise<Occupation | undefined>;
  deleteOccupation(id: string): Promise<boolean>;

  // Rules (can be base or world-specific)
  getRule(id: string): Promise<Rule | undefined>;
  getRulesByWorld(worldId: string): Promise<Rule[]>;
  getBaseRules(): Promise<Rule[]>; // Get all base rules (isBase=true, worldId=null)
  getBaseRulesByCategory(category: string): Promise<Rule[]>; // Get base rules by category
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: string, rule: Partial<InsertRule>): Promise<Rule | undefined>;
  deleteRule(id: string): Promise<boolean>;

  // Grammars (Tracery templates for narrative generation)
  getGrammar(id: string): Promise<Grammar | undefined>;
  getGrammarByName(worldId: string, name: string): Promise<Grammar | undefined>;
  getGrammarsByWorld(worldId: string): Promise<Grammar[]>;
  createGrammar(grammar: InsertGrammar): Promise<Grammar>;
  updateGrammar(id: string, grammar: Partial<InsertGrammar>): Promise<Grammar | undefined>;
  deleteGrammar(id: string): Promise<boolean>;

  // Characters
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersByWorld(worldId: string): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, character: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<boolean>;

  // Simulations
  getSimulation(id: string): Promise<Simulation | undefined>;
  getSimulationsByWorld(worldId: string): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  updateSimulation(id: string, simulation: Partial<InsertSimulation>): Promise<Simulation | undefined>;
  deleteSimulation(id: string): Promise<boolean>;

  // Actions (can be base or world-specific)
  getAction(id: string): Promise<Action | undefined>;
  getActionsByWorld(worldId: string): Promise<Action[]>;
  getActionsByType(worldId: string, actionType: string): Promise<Action[]>;
  getBaseActions(): Promise<Action[]>; // Get all base actions (isBase=true, worldId=null)
  getBaseActionsByType(actionType: string): Promise<Action[]>; // Get base actions by type
  createAction(action: InsertAction): Promise<Action>;
  updateAction(id: string, action: Partial<InsertAction>): Promise<Action | undefined>;
  deleteAction(id: string): Promise<boolean>;

  // Truths
  getTruth(id: string): Promise<Truth | undefined>;
  getTruthsByWorld(worldId: string): Promise<Truth[]>;
  getTruthsByCharacter(characterId: string): Promise<Truth[]>;
  createTruth(entry: InsertTruth): Promise<Truth>;
  updateTruth(id: string, entry: Partial<InsertTruth>): Promise<Truth | undefined>;
  deleteTruth(id: string): Promise<boolean>;

  // Quests
  getQuest(id: string): Promise<Quest | undefined>;
  getQuestsByWorld(worldId: string): Promise<Quest[]>;
  getQuestsByPlayer(playerName: string): Promise<Quest[]>;
  getQuestsByPlayerCharacterId(characterId: string): Promise<Quest[]>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: string, quest: Partial<InsertQuest>): Promise<Quest | undefined>;
  deleteQuest(id: string): Promise<boolean>;

  // Visual Assets
  getVisualAsset(id: string): Promise<VisualAsset | undefined>;
  getVisualAssetsByIds(ids: string[]): Promise<VisualAsset[]>;
  getVisualAssetsByWorld(worldId: string): Promise<VisualAsset[]>;
  getVisualAssetsByType(worldId: string, assetType: string): Promise<VisualAsset[]>;
  getVisualAssetsByEntity(entityId: string, entityType: string): Promise<VisualAsset[]>;
  getVisualAssetsForCleanup(options: { worldId?: string; status?: string; olderThan?: Date | null }): Promise<VisualAsset[]>;
  createVisualAsset(asset: InsertVisualAsset): Promise<VisualAsset>;
  updateVisualAsset(id: string, asset: Partial<InsertVisualAsset>): Promise<VisualAsset | undefined>;
  deleteVisualAsset(id: string): Promise<boolean>;

  // Asset Collections
  getAssetCollection(id: string): Promise<AssetCollection | undefined>;
  getAssetCollectionsByWorld(worldId: string): Promise<AssetCollection[]>;
  createAssetCollection(collection: InsertAssetCollection): Promise<AssetCollection>;
  updateAssetCollection(id: string, collection: Partial<InsertAssetCollection>): Promise<AssetCollection | undefined>;
  deleteAssetCollection(id: string): Promise<boolean>;

  // Generation Jobs
  getGenerationJob(id: string): Promise<GenerationJob | undefined>;
  getGenerationJobsByWorld(worldId: string): Promise<GenerationJob[]>;
  getGenerationJobsByStatus(worldId: string, status: string): Promise<GenerationJob[]>;
  createGenerationJob(job: InsertGenerationJob): Promise<GenerationJob>;
  updateGenerationJob(id: string, job: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined>;
  deleteGenerationJob(id: string): Promise<boolean>;

  // Languages (real and constructed)
  getWorldLanguage(id: string): Promise<WorldLanguage | undefined>;
  getWorldLanguagesByWorld(worldId: string): Promise<WorldLanguage[]>;
  getWorldLanguagesByScope(
    worldId: string,
    scopeType: LanguageScopeType,
    scopeId: string
  ): Promise<WorldLanguage[]>;
  createWorldLanguage(language: InsertWorldLanguage): Promise<WorldLanguage>;
  updateWorldLanguage(id: string, language: Partial<InsertWorldLanguage>): Promise<WorldLanguage | undefined>;
  deleteWorldLanguage(id: string): Promise<boolean>;

  // Language-aware chat
  getLanguageChatMessages(languageId: string): Promise<LanguageChatMessage[]>;
  createLanguageChatMessage(message: InsertLanguageChatMessage): Promise<LanguageChatMessage>;

  // Users
  getUser(id: string): Promise<import("@shared/schema").User | undefined>;
  getUserByUsername(username: string): Promise<import("@shared/schema").User | undefined>;
  getUserByEmail(email: string): Promise<import("@shared/schema").User | undefined>;
  createUser(user: import("@shared/schema").InsertUser): Promise<import("@shared/schema").User>;
  updateUser(id: string, user: Partial<import("@shared/schema").InsertUser>): Promise<import("@shared/schema").User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Player Progress
  getPlayerProgress(id: string): Promise<import("@shared/schema").PlayerProgress | undefined>;
  getPlayerProgressByUser(userId: string, worldId: string): Promise<import("@shared/schema").PlayerProgress | undefined>;
  getPlayerProgressesByUser(userId: string): Promise<import("@shared/schema").PlayerProgress[]>;
  createPlayerProgress(progress: import("@shared/schema").InsertPlayerProgress): Promise<import("@shared/schema").PlayerProgress>;
  updatePlayerProgress(id: string, progress: Partial<import("@shared/schema").InsertPlayerProgress>): Promise<import("@shared/schema").PlayerProgress | undefined>;
  deletePlayerProgress(id: string): Promise<boolean>;

  // Player Sessions
  getPlayerSession(id: string): Promise<import("@shared/schema").PlayerSession | undefined>;
  getPlayerSessionsByUser(userId: string): Promise<import("@shared/schema").PlayerSession[]>;
  createPlayerSession(session: import("@shared/schema").InsertPlayerSession): Promise<import("@shared/schema").PlayerSession>;
  updatePlayerSession(id: string, session: Partial<import("@shared/schema").InsertPlayerSession>): Promise<import("@shared/schema").PlayerSession | undefined>;
  endPlayerSession(id: string, duration: number): Promise<import("@shared/schema").PlayerSession | undefined>;

  // Achievements
  getAchievement(id: string): Promise<import("@shared/schema").Achievement | undefined>;
  getAchievementsByWorld(worldId: string): Promise<import("@shared/schema").Achievement[]>;
  getGlobalAchievements(): Promise<import("@shared/schema").Achievement[]>;
  createAchievement(achievement: import("@shared/schema").InsertAchievement): Promise<import("@shared/schema").Achievement>;
  updateAchievement(id: string, achievement: Partial<import("@shared/schema").InsertAchievement>): Promise<import("@shared/schema").Achievement | undefined>;
  deleteAchievement(id: string): Promise<boolean>;

  // Playthroughs
  getPlaythrough(id: string): Promise<import("@shared/schema").Playthrough | undefined>;
  getPlaythroughsByUser(userId: string): Promise<import("@shared/schema").Playthrough[]>;
  getPlaythroughsByWorld(worldId: string): Promise<import("@shared/schema").Playthrough[]>;
  getUserPlaythroughForWorld(userId: string, worldId: string): Promise<import("@shared/schema").Playthrough | undefined>;
  createPlaythrough(playthrough: import("@shared/schema").InsertPlaythrough): Promise<import("@shared/schema").Playthrough>;
  updatePlaythrough(id: string, playthrough: Partial<import("@shared/schema").InsertPlaythrough>): Promise<import("@shared/schema").Playthrough | undefined>;
  deletePlaythrough(id: string): Promise<boolean>;

  // Playthrough Deltas
  getPlaythroughDelta(id: string): Promise<import("@shared/schema").PlaythroughDelta | undefined>;
  getDeltasByPlaythrough(playthroughId: string): Promise<import("@shared/schema").PlaythroughDelta[]>;
  getDeltasByEntityType(playthroughId: string, entityType: string): Promise<import("@shared/schema").PlaythroughDelta[]>;
  createPlaythroughDelta(delta: import("@shared/schema").InsertPlaythroughDelta): Promise<import("@shared/schema").PlaythroughDelta>;
  deletePlaythroughDelta(id: string): Promise<boolean>;

  // Play Traces
  getPlayTrace(id: string): Promise<import("@shared/schema").PlayTrace | undefined>;
  getTracesByPlaythrough(playthroughId: string): Promise<import("@shared/schema").PlayTrace[]>;
  getTracesByUser(userId: string): Promise<import("@shared/schema").PlayTrace[]>;
  createPlayTrace(trace: import("@shared/schema").InsertPlayTrace): Promise<import("@shared/schema").PlayTrace>;
  deletePlayTrace(id: string): Promise<boolean>;
}

// Export MongoStorage as the default storage implementation
// Use lazy initialization to ensure env vars are loaded first
let _storage: MongoStorage | null = null;

export const storage = new Proxy({} as MongoStorage, {
  get(target, prop) {
    if (!_storage) {
      console.log("Initializing MongoStorage with MONGO_URL:", process.env.MONGO_URL || "undefined (using default)");
      _storage = new MongoStorage();
    }
    return (_storage as any)[prop];
  }
});
