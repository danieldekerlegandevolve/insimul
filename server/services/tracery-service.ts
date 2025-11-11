import tracery from 'tracery-grammar';

/**
 * TraceryService - Handles Tracery grammar expansion
 *
 * This service wraps the tracery-grammar library and provides
 * methods for expanding grammars with variable substitution.
 */
export class TraceryService {
  /**
   * Expand a Tracery grammar with optional variable substitution
   *
   * @param grammarRules - The Tracery grammar object (e.g., {"origin": ["#name# walks."], "name": ["John", "Mary"]})
   * @param variables - Variables to inject into the grammar (e.g., {name: "Alice"})
   * @param startSymbol - The starting rule to expand (default: "origin")
   * @returns The expanded narrative text
   */
  static expand(
    grammarRules: Record<string, string | string[]>,
    variables: Record<string, any> = {},
    startSymbol: string = 'origin'
  ): string {
    // Create a copy of the grammar rules
    const mergedRules = { ...grammarRules };

    // Inject variables as single-value rules
    // This allows templates like "#heir# is crowned" with variables {heir: "John"}
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        // Convert value to string if it's an object with toString
        const stringValue = typeof value === 'object' && value.toString
          ? value.toString()
          : String(value);
        mergedRules[key] = [stringValue];
      }
    }

    // Create Tracery grammar instance
    const grammar = tracery.createGrammar(mergedRules);

    // Add base English modifiers (capitalize, a, s, ed, etc.)
    grammar.addModifiers(tracery.baseEngModifiers);

    // Flatten/expand starting from the specified symbol
    const result = grammar.flatten(`#${startSymbol}#`);

    return result;
  }

  /**
   * Validate that a grammar has the required structure
   *
   * @param grammarRules - The grammar to validate
   * @param requiredSymbol - Symbol that must exist (default: "origin")
   * @returns true if valid, throws error otherwise
   */
  static validate(
    grammarRules: Record<string, string | string[]>,
    requiredSymbol: string = 'origin'
  ): boolean {
    if (!grammarRules || typeof grammarRules !== 'object') {
      throw new Error('Grammar must be an object');
    }

    if (!(requiredSymbol in grammarRules)) {
      throw new Error(`Grammar must contain "${requiredSymbol}" rule`);
    }

    // Check that the required symbol has at least one option
    const symbolValue = grammarRules[requiredSymbol];
    if (Array.isArray(symbolValue) && symbolValue.length === 0) {
      throw new Error(`Grammar "${requiredSymbol}" rule cannot be empty`);
    }

    return true;
  }

  /**
   * Test a grammar by expanding it multiple times
   * Useful for debugging and seeing variations
   *
   * @param grammarRules - The grammar to test
   * @param variables - Variables to use
   * @param iterations - Number of times to expand (default: 5)
   * @returns Array of expanded results
   */
  static test(
    grammarRules: Record<string, string | string[]>,
    variables: Record<string, any> = {},
    iterations: number = 5
  ): string[] {
    const results: string[] = [];
    for (let i = 0; i < iterations; i++) {
      results.push(this.expand(grammarRules, variables));
    }
    return results;
  }
}
