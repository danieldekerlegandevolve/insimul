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
  type Simulation,
  type InsertSimulation,
  type Action,
  type InsertAction,
  type Truth,
  type InsertTruth,
  type Quest,
  type InsertQuest
} from "@shared/schema";
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
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;
  deleteBusiness(id: string): Promise<boolean>;

  // Residences
  getResidence(id: string): Promise<Residence | undefined>;
  getResidencesBySettlement(settlementId: string): Promise<Residence[]>;
  createResidence(residence: InsertResidence): Promise<Residence>;
  updateResidence(id: string, residence: Partial<InsertResidence>): Promise<Residence | undefined>;
  deleteResidence(id: string): Promise<boolean>;

  // Rules (single rule entities)
  getRule(id: string): Promise<Rule | undefined>;
  getRulesByWorld(worldId: string): Promise<Rule[]>;
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

  // Actions
  getAction(id: string): Promise<Action | undefined>;
  getActionsByWorld(worldId: string): Promise<Action[]>;
  getActionsByType(worldId: string, actionType: string): Promise<Action[]>;
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
