/**
 * AI-Powered Grammar Generator
 * Uses Gemini to generate Tracery grammars from natural language descriptions
 */

import { getModel, isGeminiConfigured, GEMINI_MODELS } from '../config/gemini.js';
import type { GenerativeModel } from '@google/generative-ai';

interface GrammarGenerationRequest {
  description: string;
  theme?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  symbolCount?: number;
  worldContext?: {
    worldName?: string;
    worldDescription?: string;
    culturalValues?: any;
  };
}

interface GeneratedGrammar {
  name: string;
  description: string;
  grammar: Record<string, string | string[]>;
  tags: string[];
}

export class GrammarGenerator {
  private model: GenerativeModel | null = null;
  private enabled: boolean = false;

  constructor() {
    if (isGeminiConfigured()) {
      try {
        this.model = getModel(GEMINI_MODELS.PRO);
        this.enabled = true;
        console.log('✅ Grammar Generator initialized with Gemini');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Grammar Generator:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️ Gemini API not configured for Grammar Generator');
      this.enabled = false;
    }
  }

  /**
   * Generate a Tracery grammar from a natural language description
   */
  async generateGrammar(request: GrammarGenerationRequest): Promise<GeneratedGrammar> {
    if (!this.enabled || !this.model) {
      throw new Error('Grammar generator not available. Please configure Gemini API.');
    }

    const prompt = this.buildPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse the AI response
      const generated = this.parseResponse(response, request);
      
      // Validate the generated grammar
      this.validateGrammar(generated.grammar);
      
      return generated;
    } catch (error) {
      console.error('Error generating grammar:', error);
      throw new Error(`Failed to generate grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend an existing grammar with new variations
   */
  async extendGrammar(
    existingGrammar: Record<string, string | string[]>,
    extensionTheme: string,
    addRules: number = 5
  ): Promise<Record<string, string | string[]>> {
    if (!this.enabled || !this.model) {
      throw new Error('Grammar generator not available. Please configure Gemini API.');
    }

    const prompt = `You are extending an existing Tracery grammar with new variations.

Existing Grammar:
${JSON.stringify(existingGrammar, null, 2)}

Extension Theme: ${extensionTheme}
Add approximately ${addRules} new variations to relevant symbols.

Instructions:
1. Keep all existing symbols and values
2. Add ${addRules} new variations that fit the extension theme
3. Maintain consistency with the existing style
4. Return ONLY valid JSON in Tracery format
5. Do not explain, just return the JSON

Return the extended grammar as JSON:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const extended = this.extractJSON(response);
      
      this.validateGrammar(extended);
      return extended;
    } catch (error) {
      console.error('Error extending grammar:', error);
      throw new Error(`Failed to extend grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a grammar from example outputs
   */
  async grammarFromExamples(
    examples: string[],
    symbolName: string = 'origin'
  ): Promise<Record<string, string | string[]>> {
    if (!this.enabled || !this.model) {
      throw new Error('Grammar generator not available. Please configure Gemini API.');
    }

    const prompt = `You are creating a Tracery grammar by analyzing example outputs.

Examples:
${examples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

Instructions:
1. Analyze the examples to identify patterns and variations
2. Extract common structures and create reusable symbols
3. Create a Tracery grammar that can generate similar outputs
4. The main symbol should be "${symbolName}"
5. Create sub-symbols for repeated patterns
6. Return ONLY valid JSON in Tracery format
7. Do not explain, just return the JSON

Example Tracery format:
{
  "origin": ["#greeting# #name#!"],
  "greeting": ["Hello", "Hi", "Greetings"],
  "name": ["World", "Friend", "Traveler"]
}

Return the grammar as JSON:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const grammar = this.extractJSON(response);

      this.validateGrammar(grammar);
      return grammar;
    } catch (error) {
      console.error('Error creating grammar from examples:', error);
      throw new Error(`Failed to create grammar from examples: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate custom grammars for a custom world type
   * Creates 3 grammars: character names, settlement names, and business names
   */
  async generateCustomGrammars(
    customLabel: string,
    customPrompt: string
  ): Promise<GeneratedGrammar[]> {
    if (!this.enabled || !this.model) {
      throw new Error('Grammar generator not available. Please configure Gemini API.');
    }

    console.log(`🎨 Generating custom grammars for: ${customLabel}`);
    const grammars: GeneratedGrammar[] = [];

    // Helper function for retry with exponential backoff
    const retryWithBackoff = async <T>(
      fn: () => Promise<T>,
      grammarType: string,
      maxRetries: number = 3,
      initialDelay: number = 2000
    ): Promise<T> => {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`    ⏳ Retry ${attempt + 1}/${maxRetries - 1} for ${grammarType} in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastError;
    };

    // 1. Character Names Grammar
    try {
      console.log('  📝 Generating character names...');
      const characterGrammar = await retryWithBackoff(
        () => this.generateGrammar({
          description: `Character names for a ${customLabel} world. ${customPrompt}`,
          theme: customLabel,
          complexity: 'complex',
          symbolCount: 10,
        }),
        'character names'
      );

      grammars.push({
        ...characterGrammar,
        name: `${customLabel.toLowerCase().replace(/\s+/g, '_')}_character_names`,
        tags: [...characterGrammar.tags, customLabel, 'character', 'names'],
      });
      console.log('  ✅ Character names generated');
    } catch (error) {
      console.error(`  ❌ Failed to generate character names: ${error}`);
      throw error;
    }

    // 2. Settlement Names Grammar
    try {
      console.log('  📝 Generating settlement names...');
      const settlementGrammar = await retryWithBackoff(
        () => this.generateGrammar({
          description: `Settlement names (cities, towns, villages) for a ${customLabel} world. ${customPrompt}`,
          theme: customLabel,
          complexity: 'medium',
          symbolCount: 8,
        }),
        'settlement names'
      );

      grammars.push({
        ...settlementGrammar,
        name: `${customLabel.toLowerCase().replace(/\s+/g, '_')}_settlement_names`,
        tags: [...settlementGrammar.tags, customLabel, 'settlement', 'location', 'names'],
      });
      console.log('  ✅ Settlement names generated');
    } catch (error) {
      console.error(`  ❌ Failed to generate settlement names: ${error}`);
      throw error;
    }

    // 3. Business Names Grammar
    try {
      console.log('  📝 Generating business names...');
      const businessGrammar = await retryWithBackoff(
        () => this.generateGrammar({
          description: `Business and establishment names (taverns, shops, services) for a ${customLabel} world. ${customPrompt}`,
          theme: customLabel,
          complexity: 'medium',
          symbolCount: 8,
        }),
        'business names'
      );

      grammars.push({
        ...businessGrammar,
        name: `${customLabel.toLowerCase().replace(/\s+/g, '_')}_business_names`,
        tags: [...businessGrammar.tags, customLabel, 'business', 'establishment', 'names'],
      });
      console.log('  ✅ Business names generated');
    } catch (error) {
      console.error(`  ❌ Failed to generate business names: ${error}`);
      throw error;
    }

    console.log(`✅ All 3 grammars generated for ${customLabel}`);
    return grammars;
  }

  /**
   * Build the generation prompt
   */
  private buildPrompt(request: GrammarGenerationRequest): string {
    const { description, theme, complexity = 'medium', symbolCount = 5, worldContext } = request;

    let contextInfo = '';
    if (worldContext?.worldName) {
      contextInfo += `\nWorld: ${worldContext.worldName}`;
    }
    if (worldContext?.worldDescription) {
      contextInfo += `\nWorld Description: ${worldContext.worldDescription}`;
    }

    const complexityGuide = {
      simple: '3-5 symbols with 2-4 variations each',
      medium: '5-8 symbols with 3-6 variations each',
      complex: '8-12 symbols with 5-10 variations each',
    };

    return `You are a Tracery grammar expert. Create a procedural text generation grammar.

Description: ${description}
${theme ? `Theme: ${theme}` : ''}
Complexity: ${complexity} (${complexityGuide[complexity]})
Target Symbols: ~${symbolCount}${contextInfo}

Tracery Grammar Format:
- Use #symbol# syntax to reference other symbols
- The "origin" symbol is the entry point
- Each symbol maps to an array of possible values
- Values can reference other symbols

Example:
{
  "origin": ["#character# #action# #object#"],
  "character": ["The warrior", "The mage", "The rogue"],
  "action": ["strikes", "enchants", "steals"],
  "object": ["the sword", "the artifact", "the treasure"]
}

Instructions:
1. Create a Tracery grammar that matches the description
2. Include an "origin" symbol as the entry point
3. Create ${symbolCount} symbols with meaningful names
4. Each symbol should have multiple variations
5. Use nested symbol references for complexity
6. Make it thematic and creative
7. Return ONLY valid JSON, no explanations or markdown
8. Ensure all referenced symbols are defined

Return the grammar as JSON:`;
  }

  /**
   * Parse AI response into GeneratedGrammar
   */
  private parseResponse(response: string, request: GrammarGenerationRequest): GeneratedGrammar {
    const grammar = this.extractJSON(response);
    
    // Generate a name based on description
    const name = this.generateName(request.description, request.theme);
    
    // Generate appropriate tags
    const tags = this.generateTags(request);
    
    return {
      name,
      description: request.description,
      grammar,
      tags,
    };
  }

  /**
   * Extract JSON from AI response (handles markdown code blocks)
   */
  private extractJSON(response: string): Record<string, string | string[]> {
    // Remove markdown code blocks if present
    let jsonText = response.trim();
    
    // Remove ```json and ``` markers
    jsonText = jsonText.replace(/^```json\s*/i, '');
    jsonText = jsonText.replace(/^```\s*/, '');
    jsonText = jsonText.replace(/\s*```$/, '');
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Validate grammar structure
   */
  private validateGrammar(grammar: Record<string, string | string[]>): void {
    if (!grammar || typeof grammar !== 'object') {
      throw new Error('Grammar must be an object');
    }
    
    if (!grammar.origin) {
      throw new Error('Grammar must have an "origin" symbol');
    }
    
    // Check that origin is not empty
    const originValues = Array.isArray(grammar.origin) ? grammar.origin : [grammar.origin];
    if (originValues.length === 0 || originValues.every(v => !v)) {
      throw new Error('Grammar "origin" symbol cannot be empty');
    }
    
    // Check for symbols with no values
    for (const [key, value] of Object.entries(grammar)) {
      const values = Array.isArray(value) ? value : [value];
      if (values.length === 0 || values.every(v => !v)) {
        throw new Error(`Symbol "${key}" has no values`);
      }
    }
  }

  /**
   * Generate a name from description
   */
  private generateName(description: string, theme?: string): string {
    const words = description.toLowerCase().split(' ').slice(0, 3);
    const cleanWords = words
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 2);
    
    if (cleanWords.length === 0) {
      return theme ? `${theme}_grammar` : 'generated_grammar';
    }
    
    return cleanWords.join('_');
  }

  /**
   * Generate appropriate tags
   */
  private generateTags(request: GrammarGenerationRequest): string[] {
    const tags: string[] = ['generated'];
    
    if (request.theme) {
      tags.push(request.theme.toLowerCase().replace(/\s+/g, '_'));
    }
    
    // Extract key words from description
    const keywords = ['combat', 'dialogue', 'description', 'name', 'location', 'event', 'action', 'quest'];
    const desc = request.description.toLowerCase();
    
    keywords.forEach(keyword => {
      if (desc.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return Array.from(new Set(tags)); // Remove duplicates
  }
}

// Export singleton instance
export const grammarGenerator = new GrammarGenerator();
