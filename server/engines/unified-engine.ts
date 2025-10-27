import { type Rule, type Grammar, type Character, type World, type InsertTruth } from "@shared/schema";
import { type IStorage } from "../storage";
import { TraceryService } from "../tracery-service";

/**
 * Effect types that can be generated from rule execution
 */
export interface Effect {
  type: 'generate_text' | 'modify_attribute' | 'create_entity' | 'trigger_event';
  target?: string;
  action?: string;
  traceryTemplate?: string;
  variables?: Record<string, any>;
  [key: string]: any;
}

/**
 * Character state snapshot at a specific timestep
 */
export interface CharacterSnapshot {
  timestep: number;
  characterId: string;
  attributes: {
    firstName: string;
    lastName: string;
    birthYear: number;
    gender: string;
    isAlive: boolean;
    occupation: string | null;
    currentLocation: string | null;
    status: string;
  };
  relationships: {
    spouseId: string | null;
    parentIds: string[];
    childIds: string[];
    friendIds: string[];
  };
  customAttributes: Record<string, any>;
}

/**
 * Rule execution record with context
 */
export interface RuleExecutionRecord {
  timestep: number;
  ruleId: string;
  ruleName: string;
  ruleType: string;
  conditions: any[];
  effectsExecuted: Array<{
    type: string;
    description: string;
    success: boolean;
  }>;
  charactersAffected: string[];
  narrativeGenerated: string | null;
  timestamp: Date;
}

/**
 * Result of a single simulation step
 */
export interface SimulationStepResult {
  narratives: string[];
  events: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  rulesExecuted: string[];
  truthsCreated: string[]; // IDs of Truth entries created
  characterSnapshots: Map<number, Map<string, CharacterSnapshot>>; // timestep -> characterId -> snapshot
  ruleExecutionSequence: RuleExecutionRecord[];
  success: boolean;
  error?: string;
}

/**
 * Simulation context that tracks state during execution
 */
export interface SimulationContext {
  worldId: string;
  simulationId: string;
  characters: Character[];
  world: World;
  narrativeOutput: string[];
  events: Array<{ type: string; description: string; timestamp: Date }>;
  rulesExecuted: string[];
  truthsCreated: string[]; // Track created Truth IDs
  currentTimestep: number; // Track current timestep for Truth entries
  characterSnapshots: Map<number, Map<string, CharacterSnapshot>>; // timestep -> characterId -> snapshot
  ruleExecutionSequence: RuleExecutionRecord[];
  currentRuleExecution: RuleExecutionRecord | null; // Track current rule being executed
  variables: Record<string, any>;
}

/**
 * InsimulSimulationEngine
 *
 * Unified simulation engine that handles both Prolog and JavaScript-based
 * rule execution with integrated Tracery narrative generation.
 */
export class InsimulSimulationEngine {
  private storage: IStorage;
  private rules: Map<string, Rule> = new Map();
  private grammars: Map<string, Grammar> = new Map();
  private context: SimulationContext | null = null;
  private prologSynced: Set<string> = new Set(); // Track which worlds have been synced

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Sync world data to Prolog knowledge base
   */
  private async syncWorldToProlog(worldId: string): Promise<void> {
    // Only sync once per world per engine instance
    if (this.prologSynced.has(worldId)) {
      console.log(`✅ World ${worldId} already synced to Prolog`);
      return;
    }

    try {
      console.log(`🔄 Syncing world ${worldId} to Prolog...`);
      const { createPrologSyncService } = await import('../prolog-sync.js');
      const { PrologManager } = await import('../prolog-manager.js');
      
      const kbFile = `knowledge_base_${worldId}.pl`;
      const prologManager = new PrologManager(kbFile, worldId);
      await prologManager.initialize();
      
      const syncService = createPrologSyncService(this.storage, prologManager);
      await syncService.syncWorldToProlog(worldId);
      
      this.prologSynced.add(worldId);
      console.log(`✅ World ${worldId} synced to Prolog`);
    } catch (error) {
      console.warn(`⚠️  Failed to sync world ${worldId} to Prolog:`, error);
      // Don't throw - allow simulation to continue without Prolog
    }
  }

  /**
   * Load rules from the database for a specific world
   */
  async loadRules(worldId: string): Promise<void> {
    const rules = await this.storage.getRulesByWorld(worldId);
    this.rules.clear();
    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Load grammars from the database for a specific world
   */
  async loadGrammars(worldId: string): Promise<void> {
    const grammars = await this.storage.getGrammarsByWorld(worldId);
    this.grammars.clear();
    grammars.forEach(grammar => {
      this.grammars.set(grammar.name, grammar);
    });
  }

  /**
   * Initialize simulation context with world and character data
   */
  async initializeContext(worldId: string, simulationId: string): Promise<void> {
    const world = await this.storage.getWorld(worldId);
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    const characters = await this.storage.getCharactersByWorld(worldId);

    // Sync world data to Prolog knowledge base
    await this.syncWorldToProlog(worldId);

    this.context = {
      worldId,
      simulationId,
      world,
      characters,
      narrativeOutput: [],
      events: [],
      rulesExecuted: [],
      truthsCreated: [],
      currentTimestep: 0,
      characterSnapshots: new Map(),
      ruleExecutionSequence: [],
      currentRuleExecution: null,
      variables: {}
    };

    // Capture initial character states at timestep 0
    await this.captureCharacterSnapshots(0);
  }

  /**
   * Execute a single simulation step using Prolog engine
   *
   * @param worldId - The world ID
   * @param simulationId - The simulation ID
   * @returns SimulationStepResult with narratives, events, and executed rules
   */
  async executeStep(
    worldId: string,
    simulationId: string
  ): Promise<SimulationStepResult> {
    try {
      // Initialize if not already done
      if (!this.context || this.context.worldId !== worldId) {
        await this.loadRules(worldId);
        await this.loadGrammars(worldId);
        await this.initializeContext(worldId, simulationId);
      }

      // Increment timestep
      if (this.context) {
        this.context.currentTimestep++;
      }

      // Execute with Prolog engine (only mode)
      return await this.executePrologStep();
    } catch (error) {
      return {
        narratives: [],
        events: [],
        rulesExecuted: [],
        truthsCreated: [],
        characterSnapshots: new Map(),
        ruleExecutionSequence: [],
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a step using Prolog engine
   */
  private async executePrologStep(): Promise<SimulationStepResult> {
    if (!this.context) {
      throw new Error('Context not initialized');
    }

    try {
      const { PrologManager } = await import('../prolog-manager.js');
      const { InsimulRuleCompiler } = await import('../../client/src/lib/unified-syntax.js');
      
      const kbFile = `knowledge_base_${this.context.worldId}.pl`;
      const prologManager = new PrologManager(kbFile, this.context.worldId);
      await prologManager.initialize();

      // Convert Insimul rules to Prolog format and add to knowledge base
      const compiler = new InsimulRuleCompiler();
      for (const [ruleId, rule] of this.rules) {
        try {
          // Compile rule to Insimul format first
          const insimulRules = compiler.compile(rule.content, 'insimul');
          
          // Convert to Prolog
          const prologRule = compiler.generateSwiProlog(insimulRules);
          
          // Add rule to Prolog
          await prologManager.addRule(prologRule);
          
          console.log(`✅ Added rule ${rule.name} to Prolog`);
        } catch (error) {
          console.warn(`⚠️  Failed to convert rule ${rule.name} to Prolog:`, error);
        }
      }

      // Query Prolog for triggered rules
      // For now, we execute all rules that have conditions satisfied
      for (const [ruleId, rule] of this.rules) {
        await this.startRuleExecution(ruleId, rule);
        
        // Try to execute rule effects
        const parsedContent = (rule as any).parsedContent;
        if (parsedContent && parsedContent.effects && Array.isArray(parsedContent.effects)) {
          for (const effect of parsedContent.effects) {
            await this.executeEffect(effect, rule.name);
          }
        }
        
        await this.finishRuleExecution();
        this.context.rulesExecuted.push(rule.name);
        await this.captureCharacterSnapshots(this.context.currentTimestep);
      }

      return {
        narratives: this.context.narrativeOutput,
        events: this.context.events,
        rulesExecuted: this.context.rulesExecuted,
        truthsCreated: this.context.truthsCreated,
        characterSnapshots: this.context.characterSnapshots,
        ruleExecutionSequence: this.context.ruleExecutionSequence,
        success: true
      };
    } catch (error) {
      console.error('❌ Prolog execution error:', error);
      
      // Return error result instead of falling back
      return {
        narratives: this.context?.narrativeOutput || [],
        events: this.context?.events || [],
        rulesExecuted: this.context?.rulesExecuted || [],
        truthsCreated: this.context?.truthsCreated || [],
        characterSnapshots: this.context?.characterSnapshots || new Map(),
        ruleExecutionSequence: this.context?.ruleExecutionSequence || [],
        success: false,
        error: `Prolog execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute a single effect from a rule
   */
  private async executeEffect(effect: Effect, ruleName: string): Promise<void> {
    if (!this.context) {
      throw new Error('Context not initialized');
    }

    switch (effect.type) {
      case 'generate_text':
        await this.executeGenerateTextEffect(effect);
        break;

      case 'modify_attribute':
        await this.executeModifyAttributeEffect(effect);
        break;

      case 'create_entity':
        await this.executeCreateEntityEffect(effect);
        break;

      case 'trigger_event':
        await this.executeTriggerEventEffect(effect, ruleName);
        break;

      default:
        console.warn(`Unknown effect type: ${effect.type}`);
    }
  }

  /**
   * Execute a generate_text effect using Tracery
   */
  private async executeGenerateTextEffect(effect: Effect): Promise<void> {
    if (!this.context) return;

    const templateName = effect.traceryTemplate;
    if (!templateName) {
      console.warn('generate_text effect missing traceryTemplate');
      return;
    }

    // Look up the grammar
    const grammar = this.grammars.get(templateName);
    if (!grammar) {
      console.warn(`Grammar "${templateName}" not found`);
      this.context.narrativeOutput.push(`[Missing grammar: ${templateName}]`);
      return;
    }

    try {
      // Merge effect variables with context variables
      const variables = {
        ...this.context.variables,
        ...(effect.variables || {})
      };

      // Expand the grammar using TraceryService
      const narrative = TraceryService.expand(
        grammar.grammar as Record<string, string | string[]>,
        variables
      );

      // Add to narrative output
      this.context.narrativeOutput.push(narrative);

      // Also create an event for the narrative
      this.context.events.push({
        type: 'narrative',
        description: narrative,
        timestamp: new Date()
      });

      // Track narrative generation in current rule execution
      this.trackNarrativeGenerated(narrative);
      this.trackEffectExecution(effect, true, `Generated narrative from ${templateName}`);

      // Track characters from variables
      for (const [key, value] of Object.entries(variables)) {
        const char = this.context.characters.find(
          c => `${c.firstName} ${c.lastName}` === value || c.firstName === value
        );
        if (char) {
          this.trackCharacterAffected(char.id);
        }
      }

      // Create Truth entry for this narrative event
      await this.createTruthFromNarrative(narrative, templateName, variables);
    } catch (error) {
      console.error(`Error expanding grammar "${templateName}":`, error);
      this.context.narrativeOutput.push(`[Error: Failed to expand grammar ${templateName}]`);
      this.trackEffectExecution(effect, false, `Failed to expand grammar ${templateName}: ${error}`);
    }
  }

  /**
   * Execute a modify_attribute effect
   */
  private async executeModifyAttributeEffect(effect: Effect): Promise<void> {
    if (!this.context) return;

    // TODO: Implement attribute modification
    // This would update character/entity attributes based on the effect
    this.context.events.push({
      type: 'attribute_modified',
      description: `Modified ${effect.target}: ${effect.action}`,
      timestamp: new Date()
    });

    this.trackEffectExecution(effect, true, `Modified ${effect.target}: ${effect.action}`);
    if (effect.target) {
      // Try to find character by name or ID
      const char = this.context.characters.find(c => c.id === effect.target || c.firstName === effect.target);
      if (char) {
        this.trackCharacterAffected(char.id);
      }
    }
  }

  /**
   * Execute a create_entity effect
   */
  private async executeCreateEntityEffect(effect: Effect): Promise<void> {
    if (!this.context) return;

    // TODO: Implement entity creation
    // This would create new characters, locations, items, etc.
    this.context.events.push({
      type: 'entity_created',
      description: `Created ${effect.target}`,
      timestamp: new Date()
    });

    this.trackEffectExecution(effect, true, `Created entity: ${effect.target}`);
  }

  /**
   * Execute a trigger_event effect
   */
  private async executeTriggerEventEffect(effect: Effect, ruleName: string): Promise<void> {
    if (!this.context) return;

    this.context.events.push({
      type: effect.action || 'custom_event',
      description: `Rule "${ruleName}" triggered event: ${effect.target || 'unknown'}`,
      timestamp: new Date()
    });

    this.trackEffectExecution(
      effect,
      true,
      `Triggered event: ${effect.target || 'unknown'}`
    );
  }

  /**
   * Get the current simulation context
   */
  getContext(): SimulationContext | null {
    return this.context;
  }

  /**
   * Set the current timestep for Truth generation
   */
  setTimestep(timestep: number): void {
    if (this.context) {
      this.context.currentTimestep = timestep;
    }
  }

  /**
   * Create a Truth entry from a narrative event
   */
  private async createTruthFromNarrative(
    narrative: string,
    grammarName: string,
    variables: Record<string, any>
  ): Promise<void> {
    if (!this.context) return;

    try {
      // Extract character names from variables to link related characters
      const relatedCharacterIds: string[] = [];
      for (const [key, value] of Object.entries(variables)) {
        // Try to find character by name
        const char = this.context.characters.find(
          c => `${c.firstName} ${c.lastName}` === value || c.firstName === value
        );
        if (char) {
          relatedCharacterIds.push(char.id);
        }
      }

      const truthEntry: InsertTruth = {
        worldId: this.context.worldId,
        timestep: this.context.currentTimestep,
        timestepDuration: 1,
        entryType: 'event',
        title: `Simulation Event (${grammarName})`,
        content: narrative,
        relatedCharacterIds,
        tags: ['simulation', 'narrative', grammarName],
        importance: 5,
        isPublic: true,
        source: 'simulation_generated',
        sourceData: {
          simulationId: this.context.simulationId,
          grammarName,
          timestep: this.context.currentTimestep,
          variables
        }
      };

      const truth = await this.storage.createTruth(truthEntry);
      this.context.truthsCreated.push(truth.id);
    } catch (error) {
      console.error('Error creating Truth from narrative:', error);
    }
  }

  /**
   * Create a Truth entry from a generic event
   */
  private async createTruthFromEvent(
    event: { type: string; description: string; timestamp: Date },
    ruleName: string
  ): Promise<void> {
    if (!this.context) return;

    try {
      // Map event type to Truth entry type
      const entryTypeMap: Record<string, string> = {
        'attribute_modified': 'milestone',
        'entity_created': 'event',
        'custom_event': 'event',
        'narrative': 'event'
      };

      const truthEntry: InsertTruth = {
        worldId: this.context.worldId,
        timestep: this.context.currentTimestep,
        timestepDuration: 1,
        entryType: (entryTypeMap[event.type] || 'event') as any,
        title: `${ruleName}: ${event.type}`,
        content: event.description,
        relatedCharacterIds: [],
        tags: ['simulation', event.type, ruleName],
        importance: 3,
        isPublic: true,
        source: 'simulation_generated',
        sourceData: {
          simulationId: this.context.simulationId,
          ruleName,
          eventType: event.type,
          timestep: this.context.currentTimestep
        }
      };

      const truth = await this.storage.createTruth(truthEntry);
      this.context.truthsCreated.push(truth.id);
    } catch (error) {
      console.error('Error creating Truth from event:', error);
    }
  }

  /**
   * Create Truth entries for all accumulated events
   */
  async createTruthsForEvents(ruleName: string): Promise<void> {
    if (!this.context) return;

    // Create Truth entries for non-narrative events
    for (const event of this.context.events) {
      if (event.type !== 'narrative') {
        await this.createTruthFromEvent(event, ruleName);
      }
    }
  }

  /**
   * Capture character state snapshots at a specific timestep
   */
  private async captureCharacterSnapshots(timestep: number): Promise<void> {
    if (!this.context) return;

    const timestepSnapshots = new Map<string, CharacterSnapshot>();

    for (const character of this.context.characters) {
      const snapshot: CharacterSnapshot = {
        timestep,
        characterId: character.id,
        attributes: {
          firstName: character.firstName,
          lastName: character.lastName,
          birthYear: character.birthYear,
          gender: character.gender,
          isAlive: character.isAlive,
          occupation: character.occupation || null,
          currentLocation: character.currentLocation || null,
          status: character.status || 'active'
        },
        relationships: {
          spouseId: character.spouseId || null,
          parentIds: character.parentIds || [],
          childIds: character.childIds || [],
          friendIds: character.friendIds || []
        },
        customAttributes: {
          personality: character.personality,
          socialAttributes: character.socialAttributes,
          thoughts: character.thoughts
        }
      };

      timestepSnapshots.set(character.id, snapshot);
    }

    this.context.characterSnapshots.set(timestep, timestepSnapshots);
  }

  /**
   * Start tracking a rule execution
   */
  private async startRuleExecution(ruleId: string, rule: Rule): Promise<void> {
    if (!this.context) return;

    const parsedContent = rule.parsedContent as any;

    this.context.currentRuleExecution = {
      timestep: this.context.currentTimestep,
      ruleId,
      ruleName: rule.name,
      ruleType: rule.ruleType || 'unknown',
      conditions: parsedContent?.conditions || [],
      effectsExecuted: [],
      charactersAffected: [],
      narrativeGenerated: null,
      timestamp: new Date()
    };
  }

  /**
   * Finish tracking a rule execution
   */
  private async finishRuleExecution(): Promise<void> {
    if (!this.context || !this.context.currentRuleExecution) return;

    // Add completed rule execution to sequence
    this.context.ruleExecutionSequence.push(this.context.currentRuleExecution);
    this.context.currentRuleExecution = null;
  }

  /**
   * Track an effect execution
   */
  private trackEffectExecution(effect: Effect, success: boolean, description: string): void {
    if (!this.context?.currentRuleExecution) return;

    this.context.currentRuleExecution.effectsExecuted.push({
      type: effect.type,
      description,
      success
    });
  }

  /**
   * Track character affected by current rule
   */
  private trackCharacterAffected(characterId: string): void {
    if (!this.context?.currentRuleExecution) return;

    if (!this.context.currentRuleExecution.charactersAffected.includes(characterId)) {
      this.context.currentRuleExecution.charactersAffected.push(characterId);
    }
  }

  /**
   * Track narrative generated by current rule
   */
  private trackNarrativeGenerated(narrative: string): void {
    if (!this.context?.currentRuleExecution) return;

    this.context.currentRuleExecution.narrativeGenerated = narrative;
  }

  /**
   * Get character state diff between two timesteps
   */
  getCharacterDiff(
    characterId: string,
    fromTimestep: number,
    toTimestep: number
  ): { changed: boolean; changes: Array<{ field: string; from: any; to: any }> } | null {
    if (!this.context) return null;

    const fromSnapshot = this.context.characterSnapshots.get(fromTimestep)?.get(characterId);
    const toSnapshot = this.context.characterSnapshots.get(toTimestep)?.get(characterId);

    if (!fromSnapshot || !toSnapshot) return null;

    const changes: Array<{ field: string; from: any; to: any }> = [];

    // Check attributes
    for (const [key, value] of Object.entries(toSnapshot.attributes)) {
      if (fromSnapshot.attributes[key as keyof typeof fromSnapshot.attributes] !== value) {
        changes.push({
          field: `attributes.${key}`,
          from: fromSnapshot.attributes[key as keyof typeof fromSnapshot.attributes],
          to: value
        });
      }
    }

    // Check relationships
    if (fromSnapshot.relationships.spouseId !== toSnapshot.relationships.spouseId) {
      changes.push({
        field: 'relationships.spouseId',
        from: fromSnapshot.relationships.spouseId,
        to: toSnapshot.relationships.spouseId
      });
    }

    // Check array relationships
    const checkArrayDiff = (field: string, from: string[], to: string[]) => {
      const added = to.filter(id => !from.includes(id));
      const removed = from.filter(id => !to.includes(id));
      if (added.length > 0 || removed.length > 0) {
        changes.push({
          field: `relationships.${field}`,
          from: { ids: from, removed },
          to: { ids: to, added }
        });
      }
    };

    checkArrayDiff('parentIds', fromSnapshot.relationships.parentIds, toSnapshot.relationships.parentIds);
    checkArrayDiff('childIds', fromSnapshot.relationships.childIds, toSnapshot.relationships.childIds);
    checkArrayDiff('friendIds', fromSnapshot.relationships.friendIds, toSnapshot.relationships.friendIds);

    return {
      changed: changes.length > 0,
      changes
    };
  }

  /**
   * Reset the engine state
   */
  reset(): void {
    this.context = null;
    this.rules.clear();
    this.grammars.clear();
  }
}
