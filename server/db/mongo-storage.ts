import mongoose, { Schema, Document, Types } from "mongoose";
import type { IStorage } from "./storage.js";
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
  type Simulation,
  type InsertSimulation,
  type Action,
  type InsertAction,
  type Quest,
  type InsertQuest,
  type Truth,
  type InsertTruth
} from "@shared/schema";

// Mongoose Document interfaces
interface RuleDoc extends Omit<Rule, 'id'>, Document {
  _id: string;
}

interface GrammarDoc extends Omit<Grammar, 'id'>, Document {
  _id: string;
}

interface CharacterDoc extends Omit<Character, 'id'>, Document {
  _id: string;
}

interface WorldDoc extends Omit<World, 'id'>, Document {
  _id: string;
}

interface CountryDoc extends Omit<Country, 'id'>, Document {
  _id: string;
}

interface StateDoc extends Omit<State, 'id'>, Document {
  _id: string;
}

interface SettlementDoc extends Omit<Settlement, 'id'>, Document {
  _id: string;
}

interface SimulationDoc extends Omit<Simulation, 'id'>, Document {
  _id: string;
}

interface ActionDoc extends Omit<Action, 'id'>, Document {
  _id: string;
}

interface TruthDoc extends Omit<Truth, 'id'>, Document {
  _id: string;
}

interface QuestDoc extends Omit<Quest, 'id'>, Document {
  _id: string;
}

// Mongoose Schemas
const RuleSchema = new Schema({
  worldId: { type: String, required: false, default: null }, // Optional - null for base rules
  isBase: { type: Boolean, default: false }, // true for global rules, false for world-specific
  content: { type: String, required: true },
  name: { type: String, required: true },
  sourceFormat: { type: String, required: true },
  ruleType: { type: String, required: true },
  category: { type: String, default: null },
  priority: { type: Number, required: true },
  likelihood: { type: Number, required: true },
  conditions: { type: Schema.Types.Mixed, default: [] },
  effects: { type: Schema.Types.Mixed, default: [] },
  tags: { type: [String], default: [] },
  dependencies: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: null },
  isCompiled: { type: Boolean, default: false },
  compiledOutput: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const GrammarSchema = new Schema({
  worldId: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  grammar: { type: Schema.Types.Mixed, required: true },
  tags: { type: Schema.Types.Mixed, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CharacterSchema = new Schema({
  worldId: { type: String, required: true },
  firstName: { type: String, required: true },
  middleName: { type: String, default: null },
  lastName: { type: String, required: true },
  suffix: { type: String, default: null },
  maidenName: { type: String, default: null },
  age: { type: Number, default: null },
  birthYear: { type: Number, default: null },
  isAlive: { type: Boolean, default: true },
  gender: { type: String, required: true },
  personality: { type: Schema.Types.Mixed, default: null },
  physicalTraits: { type: Schema.Types.Mixed, default: null },
  mentalTraits: { type: Schema.Types.Mixed, default: null },
  skills: { type: Schema.Types.Mixed, default: null },
  relationships: { type: Schema.Types.Mixed, default: null },
  socialAttributes: { type: Schema.Types.Mixed, default: null },
  parentIds: { type: Schema.Types.Mixed, default: null },
  childIds: { type: Schema.Types.Mixed, default: null },
  spouseId: { type: String, default: null },
  genealogyData: { type: Schema.Types.Mixed, default: null },
  generationMethod: { type: String, default: null },
  generationConfig: { type: Schema.Types.Mixed, default: null },
  currentLocation: { type: String, default: null },
  occupation: { type: String, default: null },
  status: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WorldSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  sourceFormats: { type: Schema.Types.Mixed, default: null },
  config: { type: Schema.Types.Mixed, default: null },
  worldData: { type: Schema.Types.Mixed, default: null },
  historicalEvents: { type: Schema.Types.Mixed, default: null },
  generationConfig: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CountrySchema = new Schema({
  worldId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  governmentType: { type: String, default: null },
  economicSystem: { type: String, default: null },
  socialStructure: { type: Schema.Types.Mixed, default: null },
  foundedYear: { type: Number, default: null },
  culture: { type: Schema.Types.Mixed, default: null },
  culturalValues: { type: Schema.Types.Mixed, default: null },
  laws: { type: Schema.Types.Mixed, default: null },
  currentYear: { type: Number, default: null },
  currentMonth: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  alliances: { type: Schema.Types.Mixed, default: null },
  enemies: { type: Schema.Types.Mixed, default: null },
  isActive: { type: Boolean, default: true },
  dissolvedYear: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const StateSchema = new Schema({
  worldId: { type: String, required: true },
  countryId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  stateType: { type: String, default: 'province' },
  foundedYear: { type: Number, default: null },
  terrain: { type: String, default: null },
  governorId: { type: String, default: null },
  localGovernmentType: { type: String, default: null },
  previousCountryIds: { type: Schema.Types.Mixed, default: null },
  annexationHistory: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SettlementSchema = new Schema({
  worldId: { type: String, required: true },
  countryId: { type: String, default: null },
  stateId: { type: String, default: null },
  name: { type: String, required: true },
  description: { type: String, default: null },
  settlementType: { type: String, required: true },
  terrain: { type: String, default: null },
  population: { type: Number, default: 0 },
  foundedYear: { type: Number, default: null },
  founderIds: { type: Schema.Types.Mixed, default: null },
  currentGeneration: { type: Number, default: 0 },
  maxGenerations: { type: Number, default: 10 },
  currentYear: { type: Number, default: null },
  currentMonth: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  timeOfDay: { type: String, default: 'day' },
  ordinalDate: { type: Number, default: 0 },
  mayorId: { type: String, default: null },
  localGovernmentType: { type: String, default: null },
  districts: { type: Schema.Types.Mixed, default: null },
  streets: { type: Schema.Types.Mixed, default: null },
  landmarks: { type: Schema.Types.Mixed, default: null },
  socialStructure: { type: Schema.Types.Mixed, default: null },
  economicData: { type: Schema.Types.Mixed, default: null },
  genealogies: { type: Schema.Types.Mixed, default: null },
  familyTrees: { type: Schema.Types.Mixed, default: null },
  unemployedCharacterIds: { type: Schema.Types.Mixed, default: null },
  vacantLotIds: { type: Schema.Types.Mixed, default: null },
  departedCharacterIds: { type: Schema.Types.Mixed, default: null },
  deceasedCharacterIds: { type: Schema.Types.Mixed, default: null },
  previousCountryIds: { type: Schema.Types.Mixed, default: null },
  previousStateIds: { type: Schema.Types.Mixed, default: null },
  annexationHistory: { type: Schema.Types.Mixed, default: null },
  generationConfig: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SimulationSchema = new Schema({
  worldId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  sourceFormats: { type: Schema.Types.Mixed, default: null },
  config: { type: Schema.Types.Mixed, default: null },
  startTime: { type: Number, default: null },
  endTime: { type: Number, default: null },
  currentTime: { type: Number, default: 0 },
  timeStep: { type: Number, default: null },
  results: { type: Schema.Types.Mixed, default: null },
  socialRecord: { type: Schema.Types.Mixed, default: null },
  narrativeOutput: { type: Schema.Types.Mixed, default: null },
  status: { type: String, default: null },
  progress: { type: Number, default: null },
  errorLog: { type: Schema.Types.Mixed, default: null },
  executionTime: { type: Number, default: null },
  rulesExecuted: { type: Number, default: null },
  eventsGenerated: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ActionSchema = new Schema({
  worldId: { type: String, required: false, default: null }, // Optional - null for base actions
  isBase: { type: Boolean, default: false }, // true for global actions, false for world-specific
  name: { type: String, required: true },
  description: { type: String, default: null },
  actionType: { type: String, required: true },
  category: { type: String, default: null },
  sourceFormat: { type: String, default: 'insimul' },
  energyCost: { type: Number, default: null },
  cooldown: { type: Number, default: null },
  targetType: { type: String, default: null },
  prerequisites: { type: Schema.Types.Mixed, default: [] },
  effects: { type: Schema.Types.Mixed, default: [] },
  tags: { type: [String], default: [] },
  customData: { type: Schema.Types.Mixed, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TruthSchema = new Schema({
  worldId: { type: String, required: true },
  characterId: { type: String, default: null },
  title: { type: String, required: true },
  content: { type: String, required: true },
  entryType: { type: String, required: true },
  timestep: { type: Number, required: true, default: 0 },
  timestepDuration: { type: Number, default: null },
  timeYear: { type: Number, default: null },
  timeSeason: { type: String, default: null },
  timeDescription: { type: String, default: null },
  relatedCharacterIds: { type: Schema.Types.Mixed, default: null },
  relatedLocationIds: { type: Schema.Types.Mixed, default: null },
  tags: { type: Schema.Types.Mixed, default: null },
  importance: { type: Number, default: null },
  isPublic: { type: Boolean, default: null },
  source: { type: String, default: null },
  sourceData: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const QuestSchema = new Schema({
  worldId: { type: String, required: true },
  assignedTo: { type: String, required: true },
  assignedBy: { type: String, default: null },
  assignedToCharacterId: { type: String, default: null },
  assignedByCharacterId: { type: String, default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  questType: { type: String, required: true },
  difficulty: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  objectives: { type: Schema.Types.Mixed, default: null },
  progress: { type: Schema.Types.Mixed, default: null },
  status: { type: String, default: 'active' },
  completionCriteria: { type: Schema.Types.Mixed, default: null },
  experienceReward: { type: Number, default: 0 },
  rewards: { type: Schema.Types.Mixed, default: null },
  assignedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  conversationContext: { type: String, default: null },
  tags: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mongoose Models
const RuleModel = mongoose.model<RuleDoc>('Rule', RuleSchema);
const GrammarModel = mongoose.model<GrammarDoc>('Grammar', GrammarSchema);
const CharacterModel = mongoose.model<CharacterDoc>('Character', CharacterSchema);
const WorldModel = mongoose.model<WorldDoc>('World', WorldSchema);
const CountryModel = mongoose.model<CountryDoc>('Country', CountrySchema);
const StateModel = mongoose.model<StateDoc>('State', StateSchema);
const SettlementModel = mongoose.model<SettlementDoc>('Settlement', SettlementSchema);
const SimulationModel = mongoose.model<SimulationDoc>('Simulation', SimulationSchema);
const ActionModel = mongoose.model<ActionDoc>('Action', ActionSchema);
const TruthModel = mongoose.model<TruthDoc>('Truth', TruthSchema);
const QuestModel = mongoose.model<QuestDoc>('Quest', QuestSchema);

// Helper to convert Mongoose doc to our type
function docToRule(doc: RuleDoc): Rule {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToGrammar(doc: GrammarDoc): Grammar {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToCharacter(doc: CharacterDoc): Character {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToWorld(doc: WorldDoc): World {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToCountry(doc: CountryDoc): Country {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToState(doc: StateDoc): State {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToSettlement(doc: SettlementDoc): Settlement {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToSimulation(doc: SimulationDoc): Simulation {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToAction(doc: ActionDoc): Action {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToTruth(doc: TruthDoc): Truth {
  return { ...doc.toObject(), id: doc._id.toString() };
}

function docToQuest(doc: QuestDoc): Quest {
  return { ...doc.toObject(), id: doc._id.toString() };
}

export class MongoStorage implements IStorage {
  private static connectionPromise: Promise<void> | null = null;
  private static isInitializing = false; // Track if we're in initialization to avoid deadlock (static to share across proxy)
  private connected = false;

  constructor(private mongoUrl: string = process.env.MONGO_URL || "mongodb://localhost:27017/insimul") {
    console.log(`MongoStorage initialized with URL: ${this.mongoUrl}`);
  }

  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.connected && mongoose.connection.readyState === 1) {
      return;
    }

    // If a connection is in progress, wait for it
    if (MongoStorage.connectionPromise) {
      await MongoStorage.connectionPromise;
      this.connected = true;
      return;
    }

    // Start new connection
    console.log(`Attempting to connect to MongoDB at: ${this.mongoUrl}`);
    
    MongoStorage.connectionPromise = (async () => {
      try {
        // Disconnect if there's a stale connection
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }

        await mongoose.connect(this.mongoUrl, {
          serverSelectionTimeoutMS: 5000, // Fail faster for debugging
          socketTimeoutMS: 45000,
        });
        
        console.log("MongoDB connected successfully");
        
        // Mark as connected BEFORE initializing sample data to avoid deadlock
        this.connected = true;

        // Initialize with sample data if empty
        const worldCount = await WorldModel.countDocuments();
        if (worldCount === 0) {
          console.log("No worlds found, initializing sample data...");
          MongoStorage.isInitializing = true; // Set flag to skip connect() calls during init
          try {
            await this.initializeSampleData();
            console.log("Sample data initialized successfully");
          } catch (error) {
            console.error("Failed to initialize sample data:", error);
          } finally {
            MongoStorage.isInitializing = false;
          }
        }
      } catch (error) {
        console.error("MongoDB connection failed:", error);
        MongoStorage.connectionPromise = null;
        throw error;
      }
    })();

    await MongoStorage.connectionPromise;
    // this.connected is already set to true inside the promise
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await mongoose.disconnect();
    this.connected = false;
  }

  // World operations
  async getWorld(id: string): Promise<World | undefined> {
    await this.connect();
    const doc = await WorldModel.findById(id);
    return doc ? docToWorld(doc) : undefined;
  }

  async getWorlds(): Promise<World[]> {
    await this.connect();
    const docs = await WorldModel.find();
    return docs.map(docToWorld);
  }

  async createWorld(insertWorld: InsertWorld): Promise<World> {
    // Skip connect if we're in initialization (already connected)
    if (!MongoStorage.isInitializing) {
      await this.connect();
    }
    console.log("Creating world with data:", JSON.stringify(insertWorld, null, 2));
    
    try {
      const doc = await WorldModel.create({
        ...insertWorld,
        currentGeneration: 0,
        founderIds: null,
        familyTrees: null,
        buildings: null,
        landmarks: null,
        worldData: null,
        historicalEvents: null
      });
      console.log("World created successfully with ID:", doc._id);
      return docToWorld(doc);
    } catch (error) {
      console.error("Failed to create world in MongoDB:", error);
      throw error;
    }
  }

  async updateWorld(id: string, updateWorld: Partial<InsertWorld>): Promise<World | undefined> {
    await this.connect();
    const doc = await WorldModel.findByIdAndUpdate(
      id,
      { ...updateWorld, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToWorld(doc) : undefined;
  }

  async deleteWorld(id: string): Promise<boolean> {
    await this.connect();
    
    console.log(`🗑️  Deleting world ${id} with full cascade...`);
    
    // Get world to verify it exists
    const world = await WorldModel.findById(id);
    if (!world) {
      console.log(`   World ${id} not found`);
      return false;
    }
    
    console.log(`   Deleting world: ${world.name}`);
    
    // 1. Delete all rules for this world
    const rules = await RuleModel.deleteMany({ worldId: id });
    if (rules.deletedCount && rules.deletedCount > 0) {
      console.log(`   ✓ Deleted ${rules.deletedCount} rules`);
    }
    
    // 2. Delete all grammars for this world
    const grammars = await GrammarModel.deleteMany({ worldId: id });
    if (grammars.deletedCount && grammars.deletedCount > 0) {
      console.log(`   ✓ Deleted ${grammars.deletedCount} grammars`);
    }
    
    // 3. Delete all simulations for this world
    const simulations = await SimulationModel.deleteMany({ worldId: id });
    if (simulations.deletedCount && simulations.deletedCount > 0) {
      console.log(`   ✓ Deleted ${simulations.deletedCount} simulations`);
    }
    
    // 4. Delete all actions for this world
    const actions = await ActionModel.deleteMany({ worldId: id });
    if (actions.deletedCount && actions.deletedCount > 0) {
      console.log(`   ✓ Deleted ${actions.deletedCount} actions`);
    }
    
    // 5. Delete all truths for this world
    const truths = await TruthModel.deleteMany({ worldId: id });
    if (truths.deletedCount && truths.deletedCount > 0) {
      console.log(`   ✓ Deleted ${truths.deletedCount} truths`);
    }
    
    // 6. Delete all quests for this world
    const quests = await QuestModel.deleteMany({ worldId: id });
    if (quests.deletedCount && quests.deletedCount > 0) {
      console.log(`   ✓ Deleted ${quests.deletedCount} quests`);
    }
    
    // 7. Delete all characters for this world (before settlements)
    const characters = await CharacterModel.deleteMany({ worldId: id });
    if (characters.deletedCount && characters.deletedCount > 0) {
      console.log(`   ✓ Deleted ${characters.deletedCount} characters`);
    }
    
    // 8. Delete all settlements (this will also cascade to lots, businesses, residences)
    const settlements = await SettlementModel.find({ worldId: id });
    console.log(`   Found ${settlements.length} settlements to delete`);
    for (const settlement of settlements) {
      // Use the existing cascade delete for settlements
      await this.deleteSettlement(settlement._id.toString());
    }
    
    // 9. Delete all states
    const states = await StateModel.find({ worldId: id });
    console.log(`   Found ${states.length} states to delete`);
    for (const state of states) {
      await this.deleteState(state._id.toString());
    }
    
    // 10. Delete all countries
    const countries = await CountryModel.find({ worldId: id });
    console.log(`   Found ${countries.length} countries to delete`);
    for (const country of countries) {
      await this.deleteCountry(country._id.toString());
    }
    
    // 11. Finally, delete the world itself
    const result = await WorldModel.findByIdAndDelete(id);
    
    if (result) {
      console.log(`✅ World ${id} (${world.name}) and all associated data deleted successfully`);
    }
    
    return !!result;
  }

  // Country operations
  async getCountry(id: string): Promise<Country | undefined> {
    await this.connect();
    const doc = await CountryModel.findById(id);
    return doc ? docToCountry(doc) : undefined;
  }

  async getCountriesByWorld(worldId: string): Promise<Country[]> {
    await this.connect();
    const docs = await CountryModel.find({ worldId });
    return docs.map(docToCountry);
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    await this.connect();
    const doc = await CountryModel.create(insertCountry);
    return docToCountry(doc);
  }

  async updateCountry(id: string, updateCountry: Partial<InsertCountry>): Promise<Country | undefined> {
    await this.connect();
    const doc = await CountryModel.findByIdAndUpdate(
      id,
      { ...updateCountry, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToCountry(doc) : undefined;
  }

  async deleteCountry(id: string): Promise<boolean> {
    await this.connect();
    
    console.log(`🗑️  Deleting country ${id} with cascade...`);
    
    // Cascade delete: Get all states in this country
    const states = await StateModel.find({ countryId: id });
    console.log(`   Found ${states.length} states to delete`);
    
    // Delete all states (which will cascade delete settlements, etc.)
    for (const state of states) {
      await this.deleteState(state._id.toString());
    }
    
    // Get all settlements directly in this country (without state)
    const settlements = await SettlementModel.find({ countryId: id, stateId: null });
    console.log(`   Found ${settlements.length} direct settlements to delete`);
    
    // Delete all settlements (which will cascade delete characters, lots, businesses, etc.)
    for (const settlement of settlements) {
      await this.deleteSettlement(settlement._id.toString());
    }
    
    // Delete any characters that might have currentLocation set to this country ID
    // (They should be in settlements, but cleanup any edge cases)
    const orphanedChars = await CharacterModel.deleteMany({ currentLocation: id });
    if (orphanedChars.deletedCount && orphanedChars.deletedCount > 0) {
      console.log(`   Deleted ${orphanedChars.deletedCount} orphaned characters`);
    }
    
    // Delete any rules, actions, simulations, truth entries for this country's world
    // Note: These are world-scoped, not country-scoped, so we don't delete them here
    
    // Finally delete the country itself
    const result = await CountryModel.findByIdAndDelete(id);
    console.log(`   ✅ Country ${id} deleted successfully`);
    return !!result;
  }

  // State operations
  async getState(id: string): Promise<State | undefined> {
    await this.connect();
    const doc = await StateModel.findById(id);
    return doc ? docToState(doc) : undefined;
  }

  async getStatesByWorld(worldId: string): Promise<State[]> {
    await this.connect();
    const docs = await StateModel.find({ worldId });
    return docs.map(docToState);
  }

  async getStatesByCountry(countryId: string): Promise<State[]> {
    await this.connect();
    const docs = await StateModel.find({ countryId });
    return docs.map(docToState);
  }

  async createState(insertState: InsertState): Promise<State> {
    await this.connect();
    const doc = await StateModel.create(insertState);
    return docToState(doc);
  }

  async updateState(id: string, updateState: Partial<InsertState>): Promise<State | undefined> {
    await this.connect();
    const doc = await StateModel.findByIdAndUpdate(
      id,
      { ...updateState, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToState(doc) : undefined;
  }

  async deleteState(id: string): Promise<boolean> {
    await this.connect();
    
    console.log(`   🗑️  Deleting state ${id} with cascade...`);
    
    // Cascade delete: Get all settlements in this state
    const settlements = await SettlementModel.find({ stateId: id });
    console.log(`      Found ${settlements.length} settlements to delete`);
    
    // Delete all settlements (which will cascade delete characters, lots, businesses, etc.)
    for (const settlement of settlements) {
      await this.deleteSettlement(settlement._id.toString());
    }
    
    // Delete any characters that might have currentLocation set to this state ID
    // (They should be in settlements, but cleanup any edge cases)
    const orphanedChars = await CharacterModel.deleteMany({ currentLocation: id });
    if (orphanedChars.deletedCount && orphanedChars.deletedCount > 0) {
      console.log(`      Deleted ${orphanedChars.deletedCount} orphaned characters`);
    }
    
    // Finally delete the state itself
    const result = await StateModel.findByIdAndDelete(id);
    console.log(`      ✅ State ${id} deleted`);
    return !!result;
  }

  // Settlement operations
  async getSettlement(id: string): Promise<Settlement | undefined> {
    await this.connect();
    const doc = await SettlementModel.findById(id);
    return doc ? docToSettlement(doc) : undefined;
  }

  async getSettlementsByWorld(worldId: string): Promise<Settlement[]> {
    await this.connect();
    const docs = await SettlementModel.find({ worldId });
    return docs.map(docToSettlement);
  }

  async getSettlementsByCountry(countryId: string): Promise<Settlement[]> {
    await this.connect();
    const docs = await SettlementModel.find({ countryId });
    return docs.map(docToSettlement);
  }

  async getSettlementsByState(stateId: string): Promise<Settlement[]> {
    await this.connect();
    const docs = await SettlementModel.find({ stateId });
    return docs.map(docToSettlement);
  }

  async createSettlement(insertSettlement: InsertSettlement): Promise<Settlement> {
    await this.connect();
    const doc = await SettlementModel.create(insertSettlement);
    return docToSettlement(doc);
  }

  async updateSettlement(id: string, updateSettlement: Partial<InsertSettlement>): Promise<Settlement | undefined> {
    await this.connect();
    const doc = await SettlementModel.findByIdAndUpdate(
      id,
      { ...updateSettlement, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToSettlement(doc) : undefined;
  }

  async deleteSettlement(id: string): Promise<boolean> {
    await this.connect();
    
    console.log(`      🗑️  Deleting settlement ${id} with cascade...`);
    
    // Cascade delete: Delete all characters in this settlement
    const characters = await CharacterModel.find({ currentLocation: id });
    console.log(`         Found ${characters.length} characters to delete`);
    
    for (const character of characters) {
      await CharacterModel.findByIdAndDelete(character._id);
    }
    
    // Delete characters who might have this settlement in other location fields
    const residenceChars = await CharacterModel.deleteMany({ currentResidenceId: id });
    if (residenceChars.deletedCount && residenceChars.deletedCount > 0) {
      console.log(`         Deleted ${residenceChars.deletedCount} characters by residence`);
    }
    
    // Note: Lots, Businesses, and Residences are stub implementations
    // When they get proper schemas, add cascade delete here:
    // - await LotModel.deleteMany({ settlementId: id });
    // - await BusinessModel.deleteMany({ settlementId: id });
    // - await ResidenceModel.deleteMany({ settlementId: id });
    
    // Finally delete the settlement itself
    const result = await SettlementModel.findByIdAndDelete(id);
    console.log(`         ✅ Settlement ${id} deleted (${characters.length} characters removed)`);
    return !!result;
  }

  // Lot operations (stub implementations - no MongoDB schema yet)
  async getLot(id: string): Promise<any | undefined> {
    // TODO: Implement when lot schema is added to MongoDB
    return undefined;
  }

  async getLotsBySettlement(settlementId: string): Promise<any[]> {
    // TODO: Implement when lot schema is added to MongoDB
    return [];
  }

  async createLot(lot: any): Promise<any> {
    // TODO: Implement when lot schema is added to MongoDB
    return { ...lot, id: new Types.ObjectId().toString() };
  }

  async updateLot(id: string, lot: any): Promise<any | undefined> {
    // TODO: Implement when lot schema is added to MongoDB
    return undefined;
  }

  async deleteLot(id: string): Promise<boolean> {
    // TODO: Implement when lot schema is added to MongoDB
    return false;
  }

  // Business operations (stub implementations - no MongoDB schema yet)
  async getBusiness(id: string): Promise<any | undefined> {
    // TODO: Implement when business schema is added to MongoDB
    return undefined;
  }

  async getBusinessesBySettlement(settlementId: string): Promise<any[]> {
    // TODO: Implement when business schema is added to MongoDB
    return [];
  }

  async createBusiness(business: any): Promise<any> {
    // TODO: Implement when business schema is added to MongoDB
    return { ...business, id: new Types.ObjectId().toString() };
  }

  async updateBusiness(id: string, business: any): Promise<any | undefined> {
    // TODO: Implement when business schema is added to MongoDB
    return undefined;
  }

  async deleteBusiness(id: string): Promise<boolean> {
    // TODO: Implement when business schema is added to MongoDB
    return false;
  }

  // Residence operations (stub implementations - no MongoDB schema yet)
  async getResidence(id: string): Promise<any | undefined> {
    // TODO: Implement when residence schema is added to MongoDB
    return undefined;
  }

  async getResidencesBySettlement(settlementId: string): Promise<any[]> {
    // TODO: Implement when residence schema is added to MongoDB
    return [];
  }

  async createResidence(residence: any): Promise<any> {
    // TODO: Implement when residence schema is added to MongoDB
    return { ...residence, id: new Types.ObjectId().toString() };
  }

  async updateResidence(id: string, residence: any): Promise<any | undefined> {
    // TODO: Implement when residence schema is added to MongoDB
    return undefined;
  }

  async deleteResidence(id: string): Promise<boolean> {
    // TODO: Implement when residence schema is added to MongoDB
    return false;
  }

  // Rule operations
  async getRule(id: string): Promise<Rule | undefined> {
    await this.connect();
    const doc = await RuleModel.findById(id);
    return doc ? docToRule(doc) : undefined;
  }

  async getRulesByWorld(worldId: string): Promise<Rule[]> {
    await this.connect();
    const docs = await RuleModel.find({ worldId });
    return docs.map(docToRule);
  }

  async getBaseRules(): Promise<Rule[]> {
    await this.connect();
    const docs = await RuleModel.find({ isBase: true, worldId: null });
    return docs.map(docToRule);
  }

  async getBaseRulesByCategory(category: string): Promise<Rule[]> {
    await this.connect();
    const docs = await RuleModel.find({ isBase: true, worldId: null, category });
    return docs.map(docToRule);
  }

  async createRule(insertRule: InsertRule): Promise<Rule> {
    await this.connect();
    const doc = await RuleModel.create(insertRule);
    return docToRule(doc);
  }

  async updateRule(id: string, updateRule: Partial<InsertRule>): Promise<Rule | undefined> {
    await this.connect();
    const doc = await RuleModel.findByIdAndUpdate(
      id,
      { ...updateRule, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToRule(doc) : undefined;
  }

  async deleteRule(id: string): Promise<boolean> {
    await this.connect();
    const result = await RuleModel.findByIdAndDelete(id);
    return !!result;
  }

  // Grammar operations
  async getGrammar(id: string): Promise<Grammar | undefined> {
    await this.connect();
    const doc = await GrammarModel.findById(id);
    return doc ? docToGrammar(doc) : undefined;
  }

  async getGrammarByName(worldId: string, name: string): Promise<Grammar | undefined> {
    await this.connect();
    const doc = await GrammarModel.findOne({ worldId, name });
    return doc ? docToGrammar(doc) : undefined;
  }

  async getGrammarsByWorld(worldId: string): Promise<Grammar[]> {
    await this.connect();
    const docs = await GrammarModel.find({ worldId });
    return docs.map(docToGrammar);
  }

  async createGrammar(insertGrammar: InsertGrammar): Promise<Grammar> {
    await this.connect();
    const doc = await GrammarModel.create(insertGrammar);
    return docToGrammar(doc);
  }

  async updateGrammar(id: string, grammar: Partial<InsertGrammar>): Promise<Grammar | undefined> {
    await this.connect();
    const doc = await GrammarModel.findByIdAndUpdate(id, { ...grammar, updatedAt: new Date() }, { new: true });
    return doc ? docToGrammar(doc) : undefined;
  }

  async deleteGrammar(id: string): Promise<boolean> {
    await this.connect();
    const result = await GrammarModel.findByIdAndDelete(id);
    return !!result;
  }

  // Character operations
  async getCharacter(id: string): Promise<Character | undefined> {
    await this.connect();
    const doc = await CharacterModel.findById(id);
    return doc ? docToCharacter(doc) : undefined;
  }

  async getCharactersByWorld(worldId: string): Promise<Character[]> {
    await this.connect();
    const docs = await CharacterModel.find({ worldId });
    return docs.map(docToCharacter);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    await this.connect();
    const doc = await CharacterModel.create({
      ...insertCharacter,
      maidenName: null,
      birthYear: null,
      isAlive: true,
      generationConfig: null,
      status: null
    });
    return docToCharacter(doc);
  }

  async updateCharacter(id: string, updateCharacter: Partial<InsertCharacter>): Promise<Character | undefined> {
    await this.connect();
    const doc = await CharacterModel.findByIdAndUpdate(
      id,
      { ...updateCharacter, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToCharacter(doc) : undefined;
  }

  async deleteCharacter(id: string): Promise<boolean> {
    await this.connect();
    const result = await CharacterModel.findByIdAndDelete(id);
    return !!result;
  }

  // Simulation operations
  async getSimulation(id: string): Promise<Simulation | undefined> {
    await this.connect();
    const doc = await SimulationModel.findById(id);
    return doc ? docToSimulation(doc) : undefined;
  }

  async getSimulationsByWorld(worldId: string): Promise<Simulation[]> {
    await this.connect();
    const docs = await SimulationModel.find({ worldId });
    return docs.map(docToSimulation);
  }

  async createSimulation(insertSimulation: InsertSimulation): Promise<Simulation> {
    await this.connect();
    const doc = await SimulationModel.create({
      ...insertSimulation,
      currentTime: insertSimulation.startTime ?? 0,
      socialRecord: null,
      narrativeOutput: null,
      errorLog: null,
      executionTime: null,
      rulesExecuted: null,
      eventsGenerated: null
    });
    return docToSimulation(doc);
  }

  async updateSimulation(id: string, updateSimulation: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    await this.connect();
    const doc = await SimulationModel.findByIdAndUpdate(
      id,
      { ...updateSimulation, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToSimulation(doc) : undefined;
  }

  async deleteSimulation(id: string): Promise<boolean> {
    await this.connect();
    const result = await SimulationModel.findByIdAndDelete(id);
    return !!result;
  }

  // Action operations
  async getAction(id: string): Promise<Action | undefined> {
    await this.connect();
    const doc = await ActionModel.findById(id);
    return doc ? docToAction(doc) : undefined;
  }

  async getActionsByWorld(worldId: string): Promise<Action[]> {
    await this.connect();
    const docs = await ActionModel.find({ worldId });
    return docs.map(docToAction);
  }

  async getActionsByType(worldId: string, actionType: string): Promise<Action[]> {
    await this.connect();
    const docs = await ActionModel.find({ worldId, actionType });
    return docs.map(docToAction);
  }

  async getBaseActions(): Promise<Action[]> {
    await this.connect();
    const docs = await ActionModel.find({ isBase: true, worldId: null });
    return docs.map(docToAction);
  }

  async getBaseActionsByType(actionType: string): Promise<Action[]> {
    await this.connect();
    const docs = await ActionModel.find({ isBase: true, worldId: null, actionType });
    return docs.map(docToAction);
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    await this.connect();
    const doc = await ActionModel.create(insertAction);
    return docToAction(doc);
  }

  async updateAction(id: string, updateAction: Partial<InsertAction>): Promise<Action | undefined> {
    await this.connect();
    const doc = await ActionModel.findByIdAndUpdate(
      id,
      { ...updateAction, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToAction(doc) : undefined;
  }

  async deleteAction(id: string): Promise<boolean> {
    await this.connect();
    const result = await ActionModel.findByIdAndDelete(id);
    return !!result;
  }

  // Truths
  async getTruth(id: string): Promise<Truth | undefined> {
    await this.connect();
    const doc = await TruthModel.findById(id);
    return doc ? docToTruth(doc) : undefined;
  }

  async getTruthsByWorld(worldId: string): Promise<Truth[]> {
    await this.connect();
    const docs = await TruthModel.find({ worldId });
    return docs.map(docToTruth);
  }

  async getTruthsByCharacter(characterId: string): Promise<Truth[]> {
    await this.connect();
    const docs = await TruthModel.find({ characterId });
    return docs.map(docToTruth);
  }

  async createTruth(entry: InsertTruth): Promise<Truth> {
    await this.connect();
    const doc = await TruthModel.create(entry);
    return docToTruth(doc);
  }

  async updateTruth(id: string, entry: Partial<InsertTruth>): Promise<Truth | undefined> {
    await this.connect();
    const doc = await TruthModel.findByIdAndUpdate(
      id,
      { ...entry, updatedAt: new Date() },
      { new: true }
    );
    return doc ? docToTruth(doc) : undefined;
  }

  async deleteTruth(id: string): Promise<boolean> {
    await this.connect();
    const result = await TruthModel.findByIdAndDelete(id);
    return !!result;
  }

  // Quests
  async getQuest(id: string): Promise<Quest | undefined> {
    await this.connect();
    const doc = await QuestModel.findById(id);
    return doc ? docToQuest(doc) : undefined;
  }

  async getQuestsByWorld(worldId: string): Promise<Quest[]> {
    await this.connect();
    const docs = await QuestModel.find({ worldId });
    return docs.map(docToQuest);
  }

  async getQuestsByPlayer(playerName: string): Promise<Quest[]> {
    await this.connect();
    const docs = await QuestModel.find({ assignedTo: playerName });
    return docs.map(docToQuest);
  }

  async getQuestsByPlayerCharacterId(characterId: string): Promise<Quest[]> {
    await this.connect();
    const docs = await QuestModel.find({ assignedToCharacterId: characterId });
    return docs.map(docToQuest);
  }

  async createQuest(quest: InsertQuest): Promise<Quest> {
    await this.connect();
    const doc = await QuestModel.create(quest);
    return docToQuest(doc);
  }

  async updateQuest(id: string, quest: Partial<InsertQuest>): Promise<Quest | undefined> {
    await this.connect();
    const doc = await QuestModel.findByIdAndUpdate(id, { ...quest, updatedAt: new Date() }, { new: true });
    return doc ? docToQuest(doc) : undefined;
  }

  async deleteQuest(id: string): Promise<boolean> {
    await this.connect();
    const result = await QuestModel.findByIdAndDelete(id);
    return !!result;
  }

  // Initialize sample data with new geographical hierarchy
  private async initializeSampleData() {
    console.log("Starting sample data creation...");
    
    try {
      console.log("Creating sample world...");
      const world = await this.createWorld({
        name: "Medieval Kingdom",
        description: "A comprehensive medieval world combining all three simulation systems",
        sourceFormats: ["insimul", "ensemble", "kismet", "tott"],
        config: {
          enableTracery: true,
          enableGenealogy: true
        },
        generationConfig: {
          marriage_age_min: 16,
          marriage_age_max: 45,
          fertility_rate: 0.35,
          mortality_rate: 0.1,
          enable_prophecies: true
        }
      });
      
      console.log("Sample world created with ID:", world.id);
      
      // Create sample country
      console.log("Creating sample country...");
      const country = await this.createCountry({
        worldId: world.id,
        name: "Kingdom of Valoria",
        description: "A feudal kingdom with a rich history",
        governmentType: "monarchy",
        economicSystem: "feudal",
        foundedYear: 1150,
        culture: {
          nobility: ["Duke", "Earl", "Baron", "Knight"],
          clergy: ["Archbishop", "Bishop", "Priest"],
          commoners: ["Merchant", "Artisan", "Farmer", "Serf"]
        }
      });
      
      console.log("Sample country created with ID:", country.id);
      
      // Create sample settlements
      console.log("Creating sample settlements...");
      await this.createSettlement({
        worldId: world.id,
        countryId: country.id,
        name: "Ravenshollow",
        description: "A small village surrounded by forests",
        settlementType: "village",
        terrain: "forest",
        population: 1200,
        foundedYear: 1150,
        socialStructure: {
          classes: ["Nobility", "Clergy", "Commoners"]
        }
      });
      
      await this.createSettlement({
        worldId: world.id,
        countryId: country.id,
        name: "Goldspire",
        description: "A prosperous trading city",
        settlementType: "city",
        terrain: "plains",
        population: 25000,
        foundedYear: 1160,
        socialStructure: {
          classes: ["Nobility", "Merchants", "Artisans", "Commoners"]
        }
      });
      
      console.log("Sample data initialized in MongoDB");
    } catch (error) {
      console.error("Error during sample data creation:", error);
      throw error;
    }
  }
}
