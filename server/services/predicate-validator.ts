import { PredicateDiscoveryService } from './predicate-discovery.js';

/**
 * Validation configuration
 */
export interface ValidationConfig {
  mode: 'permissive' | 'strict';
  showInfoMessages: boolean;
  showWarnings: boolean;
  spellCheck: boolean;
  arityCheck: boolean;
  autoDiscover: boolean;
}

/**
 * Default validation configuration (permissive)
 */
const DEFAULT_CONFIG: ValidationConfig = {
  mode: 'permissive',
  showInfoMessages: true,
  showWarnings: true,
  spellCheck: true,
  arityCheck: true,
  autoDiscover: true
};

/**
 * Validation warning levels
 */
export type ValidationSeverity = 'info' | 'warning' | 'suggestion' | 'error';

/**
 * A non-blocking validation warning
 */
export interface ValidationWarning {
  severity: ValidationSeverity;
  message: string;
  line?: number;
  column?: number;
  predicateName?: string;
  suggestion?: string;
  quickFixes?: QuickFix[];
}

/**
 * A quick-fix suggestion that can be applied automatically
 */
export interface QuickFix {
  title: string;
  description?: string;
  replacement?: string;
  predicateName?: string;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  valid: boolean;  // Always true - we never block
  warnings: ValidationWarning[];
  predicatesFound: number;
  unknownPredicates: number;
}

/**
 * Predicate Validator - Provides helpful warnings without blocking
 * 
 * Philosophy: Be helpful, not restrictive
 * - Warns about typos, doesn't prevent them
 * - Suggests corrections, doesn't enforce them
 * - Shows usage examples, doesn't mandate them
 */
export class PredicateValidator {
  private discoveryService: PredicateDiscoveryService;
  private config: ValidationConfig;

  constructor(discoveryService: PredicateDiscoveryService, config?: Partial<ValidationConfig>) {
    this.discoveryService = discoveryService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update validation configuration
   */
  setConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Validate rule content and return helpful warnings
   * In strict mode, blocks on unknown predicates (valid: false)
   * In permissive mode, NEVER blocks (always valid: true)
   */
  async validateRule(ruleContent: string): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];
    const predicates = this.extractPredicates(ruleContent);
    let unknownCount = 0;

    // Check each predicate
    for (const pred of predicates) {
      const exists = await this.discoveryService.predicateExists(pred.name, pred.arity);
      
      if (!exists) {
        unknownCount++;
        await this.checkUnknownPredicate(pred, ruleContent, warnings);
      } else {
        await this.checkKnownPredicate(pred, warnings);
      }
    }

    // In strict mode, validation fails if there are unknown predicates
    const isValid = this.config.mode === 'permissive' || unknownCount === 0;

    return {
      valid: isValid,  // In permissive mode: always true. In strict mode: false if unknown predicates
      warnings,
      predicatesFound: predicates.length,
      unknownPredicates: unknownCount
    };
  }

  /**
   * Check an unknown predicate and provide helpful suggestions
   */
  private async checkUnknownPredicate(
    pred: { name: string; arity: number; example: string },
    ruleContent: string,
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Find similar predicates (spell check)
    const similar = this.config.spellCheck 
      ? await this.discoveryService.findSimilar(pred.name, 2)
      : [];
    
    if (similar.length > 0) {
      // Likely a typo
      warnings.push({
        severity: this.config.mode === 'strict' ? 'error' : 'warning',
        message: `Unknown predicate '${pred.name}/${pred.arity}'. Did you mean one of these?`,
        predicateName: pred.name,
        suggestion: similar.join(', '),
        quickFixes: similar.slice(0, 3).map(s => ({
          title: `Change to '${s}'`,
          description: `Replace '${pred.name}' with '${s}'`,
          replacement: s,
          predicateName: pred.name
        }))
      });
    } else {
      // Genuinely new custom predicate
      if (this.config.mode === 'strict') {
        warnings.push({
          severity: 'error',
          message: `Unknown predicate '${pred.name}/${pred.arity}'. In strict mode, all predicates must be defined in the schema.`,
          predicateName: pred.name,
          suggestion: `Add this predicate to the schema or switch to permissive mode.`
        });
      } else if (this.config.showInfoMessages) {
        warnings.push({
          severity: 'info',
          message: `New custom predicate '${pred.name}/${pred.arity}' detected. It will be discovered automatically on next scan.`,
          predicateName: pred.name,
          suggestion: `This looks like a custom predicate. Make sure it's defined somewhere!`
        });
      }
    }
  }

  /**
   * Check a known predicate for potential issues
   */
  private async checkKnownPredicate(
    pred: { name: string; arity: number; example: string },
    warnings: ValidationWarning[]
  ): Promise<void> {
    if (!this.config.arityCheck) {
      return; // Arity checking disabled
    }

    // Get all variants of this predicate
    const variants = await this.discoveryService.getPredicatesByName(pred.name);
    
    if (variants.length === 0) {
      return; // Should not happen, but be safe
    }

    // Check if arity is unusual
    const arities = variants.map(v => v.arity);
    if (!arities.includes(pred.arity)) {
      // Used with unusual arity
      const mostCommon = variants.reduce((prev, curr) => 
        (curr.usageCount || 0) > (prev.usageCount || 0) ? curr : prev
      );
      
      warnings.push({
        severity: 'suggestion',
        message: `Predicate '${pred.name}' is typically used with ${mostCommon.arity} argument(s), but you're using ${pred.arity}.`,
        predicateName: pred.name,
        suggestion: `Most common usage: ${mostCommon.examples?.[0] || `${pred.name}/${mostCommon.arity}`}`
      });
    }
  }

  /**
   * Extract predicates from rule content
   * Same pattern as discovery engine
   */
  private extractPredicates(content: string): Array<{
    name: string;
    arity: number;
    example: string;
  }> {
    const predicates: Array<{name: string; arity: number; example: string}> = [];
    const seen = new Set<string>();
    
    // Pattern to match predicate calls
    const predicatePattern = /([a-z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;
    
    let match;
    while ((match = predicatePattern.exec(content)) !== null) {
      const name = match[1];
      const argsStr = match[2];
      
      // Skip if looks like function call in effects
      if (content.substring(Math.max(0, match.index - 20), match.index).includes('=')) {
        continue;
      }
      
      const arity = argsStr.trim() === '' ? 0 : this.countArguments(argsStr);
      const key = `${name}/${arity}`;
      
      if (seen.has(key)) {
        continue;
      }
      
      seen.add(key);
      predicates.push({
        name,
        arity,
        example: match[0]
      });
    }
    
    return predicates;
  }

  /**
   * Count arguments, handling nested structures
   */
  private countArguments(argsStr: string): number {
    if (!argsStr || argsStr.trim() === '') {
      return 0;
    }
    
    let depth = 0;
    let argCount = 1;
    
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
   * Validate multiple rules at once
   */
  async validateRules(rules: Array<{ id: string; content: string }>): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    for (const rule of rules) {
      const result = await this.validateRule(rule.content);
      results.set(rule.id, result);
    }
    
    return results;
  }

  /**
   * Get suggestions for a partial predicate name (autocomplete helper)
   */
  async getAutocompleteSuggestions(partial: string, maxResults: number = 10): Promise<Array<{
    name: string;
    arity: number;
    description?: string;
    examples: string[];
    source: 'core' | 'discovered';
    confidence?: 'high' | 'medium' | 'low';
  }>> {
    const allPredicates = await this.discoveryService.getAllPredicates();
    
    // Filter by partial match
    const matches = allPredicates
      .filter(p => p.name.toLowerCase().startsWith(partial.toLowerCase()))
      .slice(0, maxResults);
    
    return matches.map(p => ({
      name: p.name,
      arity: p.arity,
      description: p.description,
      examples: p.examples,
      source: p.source,
      confidence: p.confidence
    }));
  }

  /**
   * Get detailed help for a specific predicate
   */
  async getPredicateHelp(name: string): Promise<{
    name: string;
    variants: Array<{
      arity: number;
      description?: string;
      examples: string[];
      args?: Array<{ name: string; type: string; description?: string }>;
      usageCount?: number;
      source: 'core' | 'discovered';
    }>;
  } | null> {
    const variants = await this.discoveryService.getPredicatesByName(name);
    
    if (variants.length === 0) {
      return null;
    }
    
    return {
      name,
      variants: variants.map(v => ({
        arity: v.arity,
        description: v.description,
        examples: v.examples,
        args: v.args,
        usageCount: v.usageCount,
        source: v.source
      }))
    };
  }
}
