/**
 * Tracery-based Name Generation Service
 * Fast, offline name generation using Tracery grammars
 */

import { TraceryService } from './tracery-service.js';
import type { IStorage } from '../db/storage.js';

export interface NameGenerationOptions {
  gender?: 'male' | 'female' | 'neutral' | 'any';
  culture?: string;
  grammarId?: string;
  grammarName?: string;
  count?: number;
}

export interface GeneratedName {
  first: string;
  last: string;
  full: string;
  culture?: string;
  grammar?: string;
}

export class NameGenerator {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Generate a single name using Tracery grammar
   */
  async generateName(
    worldId: string,
    options: NameGenerationOptions = {}
  ): Promise<GeneratedName> {
    const names = await this.generateNames(worldId, { ...options, count: 1 });
    return names[0];
  }

  /**
   * Generate multiple names using Tracery grammar
   */
  async generateNames(
    worldId: string,
    options: NameGenerationOptions = {}
  ): Promise<GeneratedName[]> {
    const { count = 1, grammarId, grammarName, culture } = options;

    // Get appropriate grammar
    let grammar;
    if (grammarId) {
      grammar = await this.storage.getGrammar(grammarId);
    } else if (grammarName) {
      grammar = await this.storage.getGrammarByName(worldId, grammarName);
    } else if (culture) {
      // Try to find a grammar tagged with the culture
      const grammars = await this.storage.getGrammarsByWorld(worldId);
      grammar = grammars.find(
        (g) => g.isActive && g.tags?.some((t) => t.toLowerCase() === culture.toLowerCase())
      );
    }

    // Fallback to a default name grammar
    if (!grammar) {
      const grammars = await this.storage.getGrammarsByWorld(worldId);
      grammar = grammars.find(
        (g) => g.isActive && g.tags?.includes('names')
      );
    }

    // If still no grammar, use fantasy names as ultimate fallback
    if (!grammar) {
      grammar = await this.storage.getGrammarByName(worldId, 'fantasy_names');
    }

    if (!grammar) {
      throw new Error('No name grammar available. Please create a name grammar first.');
    }

    // Generate names
    const results: GeneratedName[] = [];
    for (let i = 0; i < count; i++) {
      const fullName = TraceryService.expand(grammar.grammar);
      const parts = fullName.trim().split(/\s+/);
      
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';

      results.push({
        first,
        last,
        full: fullName.trim(),
        culture: culture || grammar.tags?.find((t) => t !== 'names'),
        grammar: grammar.name,
      });
    }

    return results;
  }

  /**
   * Generate a first name only
   */
  async generateFirstName(
    worldId: string,
    options: NameGenerationOptions = {}
  ): Promise<string> {
    const { grammarId, grammarName } = options;

    // Look for first name specific grammars
    let grammar;
    if (grammarId) {
      grammar = await this.storage.getGrammar(grammarId);
    } else if (grammarName) {
      grammar = await this.storage.getGrammarByName(worldId, grammarName);
    } else {
      const grammars = await this.storage.getGrammarsByWorld(worldId);
      grammar = grammars.find(
        (g) => g.isActive && g.tags?.includes('first') && g.tags?.includes('names')
      );
    }

    if (!grammar) {
      // Fallback to full name grammar and extract first name
      const fullName = await this.generateName(worldId, options);
      return fullName.first;
    }

    return TraceryService.expand(grammar.grammar);
  }

  /**
   * Generate a last name only
   */
  async generateLastName(
    worldId: string,
    options: NameGenerationOptions = {}
  ): Promise<string> {
    const { grammarId, grammarName } = options;

    // Look for last name specific grammars
    let grammar;
    if (grammarId) {
      grammar = await this.storage.getGrammar(grammarId);
    } else if (grammarName) {
      grammar = await this.storage.getGrammarByName(worldId, grammarName);
    } else {
      const grammars = await this.storage.getGrammarsByWorld(worldId);
      grammar = grammars.find(
        (g) => g.isActive && g.tags?.includes('last') && g.tags?.includes('names')
      );
    }

    if (!grammar) {
      // Fallback to full name grammar and extract last name
      const fullName = await this.generateName(worldId, options);
      return fullName.last;
    }

    return TraceryService.expand(grammar.grammar);
  }

  /**
   * Get available name grammars for a world
   */
  async getNameGrammars(worldId: string): Promise<any[]> {
    const grammars = await this.storage.getGrammarsByWorld(worldId);
    return grammars.filter((g) => g.isActive && g.tags?.includes('names'));
  }

  /**
   * Get available cultures (from name grammar tags)
   */
  async getCultures(worldId: string): Promise<string[]> {
    const nameGrammars = await this.getNameGrammars(worldId);
    const cultures = new Set<string>();

    nameGrammars.forEach((grammar) => {
      grammar.tags?.forEach((tag: string) => {
        if (tag !== 'names' && tag !== 'first' && tag !== 'last' && tag !== 'generated') {
          cultures.add(tag);
        }
      });
    });

    return Array.from(cultures);
  }
}
