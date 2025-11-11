import * as fs from 'fs/promises';
import * as path from 'path';
import { storage } from '../db/storage.js';

/**
 * World-specific predicate annotation
 */
export interface PredicateAnnotation {
  predicateName: string;
  arity: number;
  worldId: string;
  description?: string;
  category?: string;
  examples?: string[];
  addedBy?: string;
  addedAt: Date;
  updatedAt: Date;
}

/**
 * Discovered predicate from analyzing user rules
 */
export interface DiscoveredPredicate {
  name: string;
  arity: number;
  usageCount: number;
  discoveredFrom: string[]; // Rule IDs
  examples: string[];
  firstSeen: Date;
  lastSeen: Date;
  confidence: 'high' | 'medium' | 'low';
  category?: string;
}

/**
 * Core predicate from built-in schema
 */
export interface CorePredicate {
  name: string;
  category: string;
  arity: number;
  description: string;
  args: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  examples: string[];
  builtIn: boolean;
}

/**
 * Combined predicate info (core or discovered)
 */
export interface PredicateInfo {
  name: string;
  arity: number;
  description?: string;
  category?: string;
  examples: string[];
  source: 'core' | 'discovered';
  builtIn?: boolean;
  usageCount?: number;
  confidence?: 'high' | 'medium' | 'low';
  args?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

/**
 * Service for discovering predicates and managing predicate schema
 * 
 * Philosophy: Permissive, not restrictive
 * - Auto-discovers predicates from usage
 * - Provides helpful suggestions
 * - Never blocks rule creation
 */
export class PredicateDiscoveryService {
  private coreSchemaPath: string;
  private discoveredSchemaPath: string;
  private corePredicates: Map<string, CorePredicate> = new Map();
  private discoveredPredicates: Map<string, DiscoveredPredicate> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.coreSchemaPath = path.join(process.cwd(), 'server/schema/core-predicates.json');
    this.discoveredSchemaPath = path.join(process.cwd(), 'server/schema/discovered-predicates.json');
  }

  /**
   * Initialize the service by loading schemas
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.loadCoreSchema();
    await this.loadDiscoveredSchema();
    this.initialized = true;
    
    console.log(`✅ Predicate schema loaded: ${this.corePredicates.size} core, ${this.discoveredPredicates.size} discovered`);
  }

  /**
   * Load core predicates schema
   */
  private async loadCoreSchema(): Promise<void> {
    try {
      const content = await fs.readFile(this.coreSchemaPath, 'utf8');
      const schema = JSON.parse(content);
      
      if (schema.predicates) {
        for (const [name, pred] of Object.entries(schema.predicates)) {
          const corePred = pred as CorePredicate;
          const key = `${name}/${corePred.arity}`;
          this.corePredicates.set(key, {
            ...corePred,
            name
          });
        }
      }
      
      console.log(`📖 Loaded ${this.corePredicates.size} core predicates`);
    } catch (error) {
      console.warn('⚠️ Could not load core predicates schema:', error);
      // Not fatal - service still works without core schema
    }
  }

  /**
   * Load discovered predicates schema
   */
  private async loadDiscoveredSchema(): Promise<void> {
    try {
      const content = await fs.readFile(this.discoveredSchemaPath, 'utf8');
      const schema = JSON.parse(content);
      
      if (schema.predicates) {
        for (const [key, pred] of Object.entries(schema.predicates)) {
          const discoveredPred = pred as any;
          this.discoveredPredicates.set(key, {
            ...discoveredPred,
            firstSeen: new Date(discoveredPred.firstSeen),
            lastSeen: new Date(discoveredPred.lastSeen)
          });
        }
      }
      
      console.log(`🔍 Loaded ${this.discoveredPredicates.size} discovered predicates`);
    } catch (error) {
      console.warn('⚠️ Could not load discovered predicates schema:', error);
      // Not fatal - starts with empty discovered predicates
    }
  }

  /**
   * Get all predicates (core + discovered)
   * Core predicates take precedence over discovered
   */
  async getAllPredicates(): Promise<PredicateInfo[]> {
    await this.initialize();
    
    const combined = new Map<string, PredicateInfo>();
    
    // Add discovered predicates first
    for (const [key, pred] of Array.from(this.discoveredPredicates.entries())) {
      combined.set(key, {
        name: pred.name,
        arity: pred.arity,
        examples: pred.examples,
        source: 'discovered',
        usageCount: pred.usageCount,
        confidence: pred.confidence,
        category: pred.category
      });
    }
    
    // Add core predicates (overwrite discovered if exists)
    for (const [key, pred] of Array.from(this.corePredicates.entries())) {
      combined.set(key, {
        name: pred.name,
        arity: pred.arity,
        description: pred.description,
        category: pred.category,
        examples: pred.examples,
        source: 'core',
        builtIn: true,
        args: pred.args
      });
    }
    
    return Array.from(combined.values());
  }

  /**
   * Get predicate info by name (returns all arities)
   */
  async getPredicatesByName(name: string): Promise<PredicateInfo[]> {
    await this.initialize();
    
    const predicates = await this.getAllPredicates();
    return predicates.filter(p => p.name === name);
  }

  /**
   * Get predicate info by exact name/arity
   */
  async getPredicate(name: string, arity: number): Promise<PredicateInfo | null> {
    await this.initialize();
    
    const key = `${name}/${arity}`;
    
    // Check core first
    const corePred = this.corePredicates.get(key);
    if (corePred) {
      return {
        name: corePred.name,
        arity: corePred.arity,
        description: corePred.description,
        category: corePred.category,
        examples: corePred.examples,
        source: 'core',
        builtIn: true,
        args: corePred.args
      };
    }
    
    // Check discovered
    const discoveredPred = this.discoveredPredicates.get(key);
    if (discoveredPred) {
      return {
        name: discoveredPred.name,
        arity: discoveredPred.arity,
        examples: discoveredPred.examples,
        source: 'discovered',
        usageCount: discoveredPred.usageCount,
        confidence: discoveredPred.confidence,
        category: discoveredPred.category
      };
    }
    
    return null;
  }

  /**
   * Check if a predicate exists (either core or discovered)
   */
  async predicateExists(name: string, arity: number): Promise<boolean> {
    await this.initialize();
    
    const key = `${name}/${arity}`;
    return this.corePredicates.has(key) || this.discoveredPredicates.has(key);
  }

  /**
   * Get all predicate names (unique, regardless of arity)
   */
  async getAllPredicateNames(): Promise<string[]> {
    await this.initialize();
    
    const names = new Set<string>();
    
    for (const pred of Array.from(this.corePredicates.values())) {
      names.add(pred.name);
    }
    
    for (const pred of Array.from(this.discoveredPredicates.values())) {
      names.add(pred.name);
    }
    
    return Array.from(names).sort();
  }

  /**
   * Get predicates by category
   */
  async getPredicatesByCategory(category: string): Promise<PredicateInfo[]> {
    await this.initialize();
    
    const predicates = await this.getAllPredicates();
    return predicates.filter(p => p.category === category);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    await this.initialize();
    
    const categories = new Set<string>();
    
    for (const pred of Array.from(this.corePredicates.values())) {
      if (pred.category) {
        categories.add(pred.category);
      }
    }
    
    for (const pred of Array.from(this.discoveredPredicates.values())) {
      if (pred.category) {
        categories.add(pred.category);
      }
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Find similar predicate names (for spell checking)
   * Returns predicates within edit distance of 2
   */
  async findSimilar(name: string, maxDistance: number = 2): Promise<string[]> {
    await this.initialize();
    
    const allNames = await this.getAllPredicateNames();
    const similar: Array<{name: string, distance: number}> = [];
    
    for (const candidateName of allNames) {
      const distance = this.levenshteinDistance(name.toLowerCase(), candidateName.toLowerCase());
      if (distance <= maxDistance && distance > 0) {
        similar.push({ name: candidateName, distance });
      }
    }
    
    // Sort by distance, then alphabetically
    similar.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.name.localeCompare(b.name);
    });
    
    return similar.slice(0, 5).map(s => s.name);
  }

  /**
   * Levenshtein distance for spell checking
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * =============================================================================
   * PHASE 2: DISCOVERY ENGINE
   * =============================================================================
   */

  /**
   * Discover predicates in a specific world by scanning all its rules
   */
  async discoverPredicatesInWorld(worldId: string): Promise<{
    newPredicates: number;
    updatedPredicates: number;
    totalPredicates: number;
  }> {
    console.log(`🔍 Starting predicate discovery for world ${worldId}...`);
    
    await this.initialize();
    
    const rules = await storage.getRulesByWorld(worldId);
    console.log(`  📝 Scanning ${rules.length} rules...`);
    
    const beforeCount = this.discoveredPredicates.size;
    
    for (const rule of rules) {
      this.analyzeRule(rule);
    }
    
    const afterCount = this.discoveredPredicates.size;
    const newCount = afterCount - beforeCount;
    
    // Save discovered predicates to file
    await this.saveDiscoveredSchema();
    
    console.log(`✅ Discovery complete: ${newCount} new predicates, ${afterCount} total discovered`);
    
    return {
      newPredicates: newCount,
      updatedPredicates: rules.length,
      totalPredicates: afterCount
    };
  }

  /**
   * Discover predicates across all worlds
   */
  async discoverPredicatesGlobally(): Promise<{
    worldsScanned: number;
    totalPredicates: number;
  }> {
    console.log(`🌍 Starting global predicate discovery...`);
    
    await this.initialize();
    
    const worlds = await storage.getWorlds();
    console.log(`  Found ${worlds.length} worlds to scan`);
    
    for (const world of worlds) {
      await this.discoverPredicatesInWorld(world.id);
    }
    
    console.log(`✅ Global discovery complete`);
    
    return {
      worldsScanned: worlds.length,
      totalPredicates: this.discoveredPredicates.size
    };
  }

  /**
   * Analyze a single rule to extract predicates
   */
  private analyzeRule(rule: any): void {
    if (!rule.content || typeof rule.content !== 'string') {
      return;
    }
    
    try {
      // Extract predicates from rule content using regex patterns
      const predicates = this.extractPredicatesFromRule(rule.content);
      
      for (const pred of predicates) {
        this.recordDiscoveredPredicate(
          pred.name,
          pred.arity,
          rule.id,
          pred.example
        );
      }
    } catch (error) {
      // Silently skip malformed rules - discovery is permissive
      console.debug(`Could not analyze rule ${rule.id}:`, error);
    }
  }

  /**
   * Extract predicates from rule content using pattern matching
   */
  private extractPredicatesFromRule(content: string): Array<{
    name: string;
    arity: number;
    example: string;
  }> {
    const predicates: Array<{name: string; arity: number; example: string}> = [];
    const seen = new Set<string>();
    
    // Pattern to match predicate calls: name(arg1, arg2, ...)
    // Handles: Character(?hero), age(?person, 35), married(?a, ?b)
    const predicatePattern = /([a-z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;
    
    let match;
    while ((match = predicatePattern.exec(content)) !== null) {
      const name = match[1];
      const argsStr = match[2];
      
      // Skip if this looks like a function call in effects (has assignment)
      if (content.substring(Math.max(0, match.index - 20), match.index).includes('=')) {
        continue;
      }
      
      // Count arguments (split by comma, ignoring nested structures)
      const arity = argsStr.trim() === '' ? 0 : this.countArguments(argsStr);
      
      const key = `${name}/${arity}`;
      
      // Skip if already seen in this rule
      if (seen.has(key)) {
        continue;
      }
      
      // Skip if this is a core predicate (we already have it)
      if (this.corePredicates.has(key)) {
        continue;
      }
      
      seen.add(key);
      predicates.push({
        name,
        arity,
        example: match[0] // Full match: name(args)
      });
    }
    
    return predicates;
  }

  /**
   * Count arguments in a predicate call, handling nested structures
   */
  private countArguments(argsStr: string): number {
    if (!argsStr || argsStr.trim() === '') {
      return 0;
    }
    
    let depth = 0;
    let argCount = 1; // At least one argument if string is non-empty
    
    for (const char of argsStr) {
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      } else if (char === ',' && depth === 0) {
        argCount++;
      }
    }
    
    return argCount;
  }

  /**
   * Record or update a discovered predicate
   */
  private recordDiscoveredPredicate(
    name: string,
    arity: number,
    ruleId: string,
    example: string
  ): void {
    const key = `${name}/${arity}`;
    const existing = this.discoveredPredicates.get(key);
    
    if (existing) {
      // Update existing
      existing.usageCount++;
      existing.lastSeen = new Date();
      
      if (!existing.examples.includes(example)) {
        existing.examples.push(example);
        // Keep only top 3 examples
        if (existing.examples.length > 3) {
          existing.examples = existing.examples.slice(0, 3);
        }
      }
      
      if (!existing.discoveredFrom.includes(ruleId)) {
        existing.discoveredFrom.push(ruleId);
      }
      
      // Update confidence based on usage
      existing.confidence = this.calculateConfidence(existing);
    } else {
      // Create new
      this.discoveredPredicates.set(key, {
        name,
        arity,
        usageCount: 1,
        discoveredFrom: [ruleId],
        examples: [example],
        firstSeen: new Date(),
        lastSeen: new Date(),
        confidence: 'low'
      });
    }
  }

  /**
   * Calculate confidence score based on usage patterns
   */
  private calculateConfidence(pred: DiscoveredPredicate): 'high' | 'medium' | 'low' {
    // High confidence: used in multiple rules (3+) and frequently (5+)
    if (pred.usageCount >= 5 && pred.discoveredFrom.length >= 3) {
      return 'high';
    }
    
    // Medium confidence: used more than once
    if (pred.usageCount >= 2 || pred.discoveredFrom.length >= 2) {
      return 'medium';
    }
    
    // Low confidence: single usage
    return 'low';
  }

  /**
   * Save discovered predicates to JSON file
   */
  private async saveDiscoveredSchema(): Promise<void> {
    const schema = {
      version: '1.0',
      generated: new Date().toISOString(),
      source: 'auto-discovery',
      description: 'Auto-discovered predicates from analyzing user rules. Updates automatically.',
      predicates: Object.fromEntries(
        Array.from(this.discoveredPredicates.entries()).map(([key, pred]) => [
          key,
          {
            name: pred.name,
            arity: pred.arity,
            usageCount: pred.usageCount,
            discoveredFrom: pred.discoveredFrom,
            examples: pred.examples,
            firstSeen: pred.firstSeen.toISOString(),
            lastSeen: pred.lastSeen.toISOString(),
            confidence: pred.confidence,
            category: pred.category
          }
        ])
      )
    };
    
    try {
      await fs.writeFile(
        this.discoveredSchemaPath,
        JSON.stringify(schema, null, 2),
        'utf8'
      );
      console.log(`💾 Saved ${this.discoveredPredicates.size} discovered predicates to schema`);
    } catch (error) {
      console.error('Failed to save discovered schema:', error);
    }
  }

  /**
   * World-specific annotations storage (in-memory for now)
   * In production, this would be stored in the database
   */
  private annotations: Map<string, PredicateAnnotation> = new Map();

  /**
   * Add or update a world-specific annotation for a predicate
   */
  async annotate(annotation: Omit<PredicateAnnotation, 'addedAt' | 'updatedAt'>): Promise<void> {
    const key = `${annotation.worldId}:${annotation.predicateName}/${annotation.arity}`;
    const existing = this.annotations.get(key);
    
    const fullAnnotation: PredicateAnnotation = {
      ...annotation,
      addedAt: existing?.addedAt || new Date(),
      updatedAt: new Date()
    };
    
    this.annotations.set(key, fullAnnotation);
    console.log(`📝 Annotated ${annotation.predicateName}/${annotation.arity} for world ${annotation.worldId}`);
  }

  /**
   * Get annotation for a specific predicate in a world
   */
  getAnnotation(worldId: string, name: string, arity: number): PredicateAnnotation | null {
    const key = `${worldId}:${name}/${arity}`;
    return this.annotations.get(key) || null;
  }

  /**
   * Get all annotations for a world
   */
  getWorldAnnotations(worldId: string): PredicateAnnotation[] {
    return Array.from(this.annotations.values())
      .filter(ann => ann.worldId === worldId);
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(worldId: string, name: string, arity: number): boolean {
    const key = `${worldId}:${name}/${arity}`;
    return this.annotations.delete(key);
  }

  /**
   * Reload schemas from disk (useful after updates)
   */
  async reload(): Promise<void> {
    this.corePredicates.clear();
    this.discoveredPredicates.clear();
    this.initialized = false;
    await this.initialize();
  }
}

// Export singleton instance
export const predicateDiscovery = new PredicateDiscoveryService();
