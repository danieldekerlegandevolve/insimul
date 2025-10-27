/**
 * LLM-based Contextual Name Generator
 * Generates names that fit the world, country, and settlement context
 */

import { getModel, isGeminiConfigured, GEMINI_MODELS } from '../config/gemini.js';
import type { GenerativeModel } from '@google/generative-ai';

interface SettlementNameContext {
  worldName: string;
  worldDescription?: string;
  countryName?: string;
  countryDescription?: string;
  countryGovernment?: string;
  countryEconomy?: string;
  stateName?: string;
  settlementType: 'city' | 'town' | 'village';
  terrain?: string;
}

interface CharacterNameContext {
  worldName: string;
  worldDescription?: string;
  countryName?: string;
  countryDescription?: string;
  settlementName?: string;
  settlementType?: string;
  gender: 'male' | 'female';
  generation: number;
  isFounder?: boolean;
}

export class NameGenerator {
  private model: GenerativeModel | null = null;
  private enabled: boolean = false;

  constructor() {
    if (isGeminiConfigured()) {
      try {
        console.log(`🔧 Initializing Name Generator with model: ${GEMINI_MODELS.PRO}`);
        this.model = getModel(GEMINI_MODELS.PRO);
        this.enabled = true;
        console.log(`✅ LLM Name Generator initialized with ${GEMINI_MODELS.PRO}`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize Gemini API, falling back to random names:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️ Gemini API not configured, using fallback name generation');
      this.enabled = false;
    }
  }

  /**
   * Generate a contextually appropriate settlement name
   */
  async generateSettlementName(context: SettlementNameContext): Promise<string> {
    if (!this.enabled || !this.model) {
      return this.fallbackSettlementName(context);
    }

    try {
      const prompt = this.buildSettlementPrompt(context);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const name = response.text().trim();
      
      // Clean up the response (remove quotes, extra text, etc.)
      const cleanName = this.cleanName(name);
      
      // Validate the name is reasonable
      if (cleanName.length > 0 && cleanName.length < 50 && /^[a-zA-Z\s'-]+$/.test(cleanName)) {
        console.log(`   🏙️  Generated settlement name: ${cleanName}`);
        return cleanName;
      } else {
        console.warn(`   ⚠️ Invalid LLM settlement name "${cleanName}", using fallback`);
        return this.fallbackSettlementName(context);
      }
    } catch (error) {
      console.error('Error generating settlement name:', error);
      return this.fallbackSettlementName(context);
    }
  }

  /**
   * Generate contextually appropriate character names (first and last)
   */
  async generateCharacterNames(context: CharacterNameContext, count: number = 1): Promise<Array<{firstName: string, lastName: string}>> {
    if (!this.enabled || !this.model) {
      return this.fallbackCharacterNames(context, count);
    }

    try {
      const prompt = this.buildCharacterPrompt(context, count);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();
      
      // Parse the response
      const names = this.parseCharacterNames(text, count);
      
      if (names.length > 0) {
        return names;
      } else {
        console.warn('   ⚠️ Failed to parse LLM character names, using fallback');
        return this.fallbackCharacterNames(context, count);
      }
    } catch (error) {
      console.error('Error generating character names:', error);
      return this.fallbackCharacterNames(context, count);
    }
  }

  /**
   * Build prompt for settlement name generation
   */
  private buildSettlementPrompt(context: SettlementNameContext): string {
    let prompt = `Generate a single ${context.settlementType} name that fits this context:\n\n`;
    
    prompt += `World: ${context.worldName}`;
    if (context.worldDescription) {
      prompt += ` - ${context.worldDescription}`;
    }
    prompt += '\n';
    
    if (context.countryName) {
      prompt += `Country: ${context.countryName}`;
      if (context.countryDescription) {
        prompt += ` - ${context.countryDescription}`;
      }
      if (context.countryGovernment) {
        prompt += ` (${context.countryGovernment})`;
      }
      prompt += '\n';
    }
    
    if (context.stateName) {
      prompt += `State/Province: ${context.stateName}\n`;
    }
    
    prompt += `Settlement Type: ${context.settlementType}\n`;
    
    if (context.terrain) {
      prompt += `Terrain: ${context.terrain}\n`;
    }
    
    prompt += `\nGenerate ONE creative, thematic ${context.settlementType} name that fits this world's style and culture. `;
    prompt += `The name should sound authentic to the setting. `;
    prompt += `Return ONLY the name, nothing else. No explanations, no quotes, just the name.`;
    
    return prompt;
  }

  /**
   * Build prompt for character name generation
   */
  private buildCharacterPrompt(context: CharacterNameContext, count: number): string {
    let prompt = `Generate ${count} ${context.gender} character name${count > 1 ? 's' : ''} (first and last) that fit this context:\n\n`;
    
    prompt += `World: ${context.worldName}`;
    if (context.worldDescription) {
      prompt += ` - ${context.worldDescription}`;
    }
    prompt += '\n';
    
    if (context.countryName) {
      prompt += `Country: ${context.countryName}`;
      if (context.countryDescription) {
        prompt += ` - ${context.countryDescription}`;
      }
      prompt += '\n';
    }
    
    if (context.settlementName) {
      prompt += `Settlement: ${context.settlementName}`;
      if (context.settlementType) {
        prompt += ` (${context.settlementType})`;
      }
      prompt += '\n';
    }
    
    prompt += `Gender: ${context.gender}\n`;
    prompt += `Generation: ${context.generation}`;
    if (context.isFounder) {
      prompt += ' (founding family)';
    }
    prompt += '\n';
    
    prompt += `\nGenerate ${count} full name${count > 1 ? 's' : ''} (first and last name) that fit this world's culture and naming conventions. `;
    prompt += `The names should feel authentic to the setting. `;
    prompt += `Return one name per line in the format: FirstName LastName\n`;
    prompt += `Return ONLY the names, no numbers, no explanations, no extra text.`;
    
    return prompt;
  }

  /**
   * Clean and validate LLM-generated name
   */
  private cleanName(name: string): string {
    // Remove quotes, parentheses, and extra whitespace
    let cleaned = name
      .replace(/["'()[\]]/g, '')
      .replace(/^[^a-zA-Z]+/, '')
      .replace(/[^a-zA-Z\s'-]+$/, '')
      .trim();
    
    // Handle multi-line responses (take first line)
    if (cleaned.includes('\n')) {
      cleaned = cleaned.split('\n')[0].trim();
    }
    
    // Capitalize properly
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return cleaned;
  }

  /**
   * Parse character names from LLM response
   */
  private parseCharacterNames(text: string, expectedCount: number): Array<{firstName: string, lastName: string}> {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const names: Array<{firstName: string, lastName: string}> = [];
    
    for (const line of lines) {
      if (names.length >= expectedCount) break;
      
      // Remove numbering and clean up
      const cleaned = line
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/["'()[\]]/g, '')
        .trim();
      
      // Split into first and last name
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 2) {
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        
        // Validate names
        if (/^[a-zA-Z'-]+$/.test(firstName) && /^[a-zA-Z\s'-]+$/.test(lastName)) {
          names.push({ firstName, lastName });
        }
      }
    }
    
    return names;
  }

  /**
   * Fallback settlement name generation
   */
  private fallbackSettlementName(context: SettlementNameContext): string {
    const prefixes = ['New', 'Old', 'Upper', 'Lower', 'East', 'West', 'North', 'South'];
    const bases = ['haven', 'bridge', 'ford', 'ton', 'ville', 'burg', 'dale', 'field', 'wood', 'shore'];
    
    const prefix = Math.random() > 0.5 ? prefixes[Math.floor(Math.random() * prefixes.length)] : '';
    const base = bases[Math.floor(Math.random() * bases.length)];
    const suffix = context.settlementType.charAt(0).toUpperCase() + context.settlementType.slice(1);
    
    return prefix ? `${prefix}${base}` : `${suffix}${base}`;
  }

  /**
   * Fallback character name generation
   */
  private fallbackCharacterNames(context: CharacterNameContext, count: number): Array<{firstName: string, lastName: string}> {
    const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard'];
    const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan'];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
    
    const firstNames = context.gender === 'male' ? maleNames : femaleNames;
    const names: Array<{firstName: string, lastName: string}> = [];
    
    for (let i = 0; i < count; i++) {
      names.push({
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: surnames[Math.floor(Math.random() * surnames.length)]
      });
    }
    
    return names;
  }

  /**
   * Generate multiple settlement names in a single batch API call
   */
  async generateSettlementNamesBatch(contexts: SettlementNameContext[]): Promise<string[]> {
    if (!this.enabled || !this.model || contexts.length === 0) {
      return contexts.map(ctx => this.fallbackSettlementName(ctx));
    }

    try {
      const prompt = this.buildBatchSettlementPrompt(contexts);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();
      
      const names = this.parseBatchSettlementNames(text, contexts.length);
      
      // Fill in any missing names with fallbacks
      while (names.length < contexts.length) {
        names.push(this.fallbackSettlementName(contexts[names.length]));
      }
      
      return names.slice(0, contexts.length);
    } catch (error) {
      console.error('Error generating batch settlement names:', error);
      return contexts.map(ctx => this.fallbackSettlementName(ctx));
    }
  }

  /**
   * Generate multiple character names in a single batch API call
   */
  async generateCharacterNamesBatch(
    context: CharacterNameContext,
    count: number
  ): Promise<Array<{firstName: string, lastName: string}>> {
    if (!this.enabled || !this.model || count === 0) {
      return this.fallbackCharacterNames(context, count);
    }

    try {
      // Use the existing buildCharacterPrompt which already supports batch generation
      const prompt = this.buildCharacterPrompt(context, count);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();
      
      const names = this.parseCharacterNames(text, count);
      
      // Fill in any missing names with fallbacks
      while (names.length < count) {
        const fallbackNames = this.fallbackCharacterNames(context, 1);
        names.push(fallbackNames[0]);
      }
      
      return names.slice(0, count);
    } catch (error) {
      console.error('Error generating batch character names:', error);
      return this.fallbackCharacterNames(context, count);
    }
  }

  /**
   * Build prompt for batch settlement name generation
   */
  private buildBatchSettlementPrompt(contexts: SettlementNameContext[]): string {
    let prompt = `Generate ${contexts.length} settlement names that fit these contexts:\n\n`;
    
    const firstContext = contexts[0];
    prompt += `World: ${firstContext.worldName}`;
    if (firstContext.worldDescription) {
      prompt += ` - ${firstContext.worldDescription}`;
    }
    prompt += '\n';
    
    if (firstContext.countryName) {
      prompt += `Country: ${firstContext.countryName}`;
      if (firstContext.countryDescription) {
        prompt += ` - ${firstContext.countryDescription}`;
      }
      prompt += '\n';
    }
    
    prompt += `\nSettlement types needed:\n`;
    const typeCounts: Record<string, number> = {};
    contexts.forEach(ctx => {
      typeCounts[ctx.settlementType] = (typeCounts[ctx.settlementType] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      prompt += `- ${count} ${type}${count > 1 ? 's' : ''}\n`;
    });
    
    prompt += `\nGenerate ${contexts.length} creative, thematic settlement names that fit this world's style and culture. `;
    prompt += `Each name should sound authentic to the setting. `;
    prompt += `Return one name per line, no numbers, no explanations, just the names.`;
    
    return prompt;
  }

  /**
   * Parse batch settlement names from LLM response
   */
  private parseBatchSettlementNames(text: string, expectedCount: number): string[] {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const names: string[] = [];
    
    for (const line of lines) {
      if (names.length >= expectedCount) break;
      
      const cleaned = this.cleanName(line);
      
      if (cleaned.length > 0 && cleaned.length < 50 && /^[a-zA-Z\s'-]+$/.test(cleaned)) {
        names.push(cleaned);
      }
    }
    
    return names;
  }

  /**
   * Generate ALL names for an entire world generation in a single API call
   * This dramatically reduces API usage by bundling everything into one structured request
   */
  async generateCompleteWorldNames(request: {
    worldName: string;
    worldDescription?: string;
    numCountries?: number;
    numStatesPerCountry?: number;
    governmentType?: string;
    settlements: Array<{
      type: 'city' | 'town' | 'village';
      numFamilies: number;
      childrenPerFamily: number; // approximate
    }>;
  }): Promise<{
    countries: Array<{ name: string; description: string }>;
    states: Array<{ name: string }>;
    settlements: Array<{ name: string }>;
    families: Array<{
      settlementIndex: number;
      surname: string;
      fatherFirstName: string;
      motherFirstName: string;
      motherMaidenName: string;
      children: Array<{ firstName: string; gender: 'male' | 'female' }>;
    }>;
  }> {
    if (!this.enabled || !this.model) {
      return this.fallbackCompleteWorldNames(request);
    }

    try {
      const prompt = this.buildCompleteWorldPrompt(request);
      
      // Use JSON mode for structured output
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9, // Higher creativity for diverse names
          responseMimeType: 'application/json',
        }
      });
      
      const response = result.response;
      const text = response.text().trim();
      const data = JSON.parse(text);
      
      // Validate and return
      if (data.countries && data.settlements && data.families) {
        console.log(`   🎯 Generated ${data.countries.length} countries, ${data.states?.length || 0} states, ${data.settlements.length} settlements, and ${data.families.length} families in ONE API call`);
        // Ensure states array exists even if empty
        if (!data.states) {
          data.states = [];
        }
        return data;
      } else {
        throw new Error('Invalid JSON structure from LLM');
      }
    } catch (error) {
      console.error('Complete world name generation failed, using fallbacks:', error);
      return this.fallbackCompleteWorldNames(request);
    }
  }

  /**
   * Build prompt for complete world name generation
   */
  private buildCompleteWorldPrompt(request: any): string {
    const totalFamilies = request.settlements.reduce((sum: number, s: any) => sum + s.numFamilies, 0);
    const totalSettlements = request.settlements.length;
    const numCountries = request.numCountries || 1;
    const numStates = (request.numStatesPerCountry || 0) * numCountries;
    
    let prompt = `Generate ALL names for a complete world in JSON format.\n\n`;
    prompt += `**World Context:**\n`;
    prompt += `- World: ${request.worldName}\n`;
    if (request.worldDescription) {
      prompt += `- Description: ${request.worldDescription}\n`;
    }
    if (request.governmentType) {
      prompt += `- Government Type: ${request.governmentType}\n`;
    }
    prompt += `\n`;
    
    prompt += `**Generate the following:**\n`;
    prompt += `1. ${numCountries} country name(s) with descriptions\n`;
    if (numStates > 0) {
      prompt += `2. ${numStates} state/province/region names\n`;
    }
    prompt += `${numStates > 0 ? '3' : '2'}. ${totalSettlements} settlement names (cities, towns, villages)\n`;
    prompt += `${numStates > 0 ? '4' : '3'}. ${totalFamilies} founding families with full names\n`;
    prompt += `${numStates > 0 ? '5' : '4'}. Children for each family (approximately ${request.settlements[0]?.childrenPerFamily || 2} per family)\n\n`;
    
    prompt += `**Settlement Types Needed:**\n`;
    request.settlements.forEach((s: any, i: number) => {
      prompt += `- Settlement ${i}: ${s.type} with ${s.numFamilies} founding families\n`;
    });
    prompt += `\n`;
    
    prompt += `**IMPORTANT:** All names must fit the world's culture and setting. Create diverse, authentic names that match the theme.\n\n`;
    
    prompt += `**Return JSON in this exact format:**\n`;
    prompt += `{\n`;
    prompt += `  "countries": [\n`;
    prompt += `    {"name": "CountryName", "description": "A brief description of this nation"}\n`;
    prompt += `  ],\n`;
    if (numStates > 0) {
      prompt += `  "states": [\n`;
      prompt += `    {"name": "StateName1"},\n`;
      prompt += `    {"name": "StateName2"}\n`;
      prompt += `  ],\n`;
    }
    prompt += `  "settlements": [\n`;
    prompt += `    {"name": "SettlementName1"},\n`;
    prompt += `    {"name": "SettlementName2"}\n`;
    prompt += `  ],\n`;
    prompt += `  "families": [\n`;
    prompt += `    {\n`;
    prompt += `      "settlementIndex": 0,\n`;
    prompt += `      "surname": "FamilySurname",\n`;
    prompt += `      "fatherFirstName": "FatherName",\n`;
    prompt += `      "motherFirstName": "MotherName",\n`;
    prompt += `      "motherMaidenName": "MaidenSurname",\n`;
    prompt += `      "children": [\n`;
    prompt += `        {"firstName": "ChildName1", "gender": "male"},\n`;
    prompt += `        {"firstName": "ChildName2", "gender": "female"}\n`;
    prompt += `      ]\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n\n`;
    
    prompt += `Generate complete, valid JSON with no additional text or explanation. Include all ${numCountries} countries, ${numStates > 0 ? `all ${numStates} states, ` : ''}all ${totalSettlements} settlements, and all ${totalFamilies} families.`;
    
    return prompt;
  }

  /**
   * Fallback for complete world name generation
   */
  private fallbackCompleteWorldNames(request: any): any {
    const numCountries = request.numCountries || 1;
    const numStates = (request.numStatesPerCountry || 0) * numCountries;
    
    const countries = Array(numCountries).fill(null).map((_, i) => ({
      name: `Kingdom ${i + 1}`,
      description: `A ${request.governmentType || 'monarchial'} realm`
    }));
    
    const states = Array(numStates).fill(null).map((_, i) => ({
      name: `Province ${i + 1}`
    }));
    
    const settlements = request.settlements.map((s: any, i: number) => ({
      name: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${i + 1}`
    }));
    
    const families = [];
    let familyIndex = 0;
    
    for (let settlementIdx = 0; settlementIdx < request.settlements.length; settlementIdx++) {
      const settlement = request.settlements[settlementIdx];
      
      for (let f = 0; f < settlement.numFamilies; f++) {
        const children = [];
        for (let c = 0; c < settlement.childrenPerFamily; c++) {
          const gender = Math.random() > 0.5 ? 'male' : 'female';
          children.push({
            firstName: this.getFallbackName(gender),
            gender
          });
        }
        
        families.push({
          settlementIndex: settlementIdx,
          surname: this.getFallbackName('male') + 'son',
          fatherFirstName: this.getFallbackName('male'),
          motherFirstName: this.getFallbackName('female'),
          motherMaidenName: this.getFallbackName('male') + 'son',
          children
        });
        
        familyIndex++;
      }
    }
    
    return { countries, states, settlements, families };
  }

  /**
   * Get fallback name from pool
   */
  private getFallbackName(gender: 'male' | 'female'): string {
    const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard'];
    const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan'];
    const names = gender === 'male' ? maleNames : femaleNames;
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Check if LLM generation is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const nameGenerator = new NameGenerator();
