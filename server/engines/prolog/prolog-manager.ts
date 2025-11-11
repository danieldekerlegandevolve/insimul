import * as fs from 'fs/promises';
import * as path from 'path';
import { prologEngine } from './prolog-engine.js';
import { execSync } from 'child_process';

export interface PrologStatement {
  content: string;
  type: 'fact' | 'rule';
}

export interface QueryResult {
  [key: string]: any;
}

/**
 * Manages Prolog knowledge base and query execution
 * TypeScript port of the Python PrologManager class
 */
export class PrologManager {
  private kbFile: string;
  private knowledgeBase: string[] = [];
  private worldId?: string;

  constructor(kbFile: string = 'knowledge_base.pl', worldId?: string) {
    this.kbFile = kbFile;
    this.worldId = worldId;
  }

  /**
   * Initialize the manager and load existing knowledge base
   */
  async initialize(): Promise<void> {
    await this.loadFromFile();
  }

  /**
   * Basic validation for Prolog statements
   */
  private validatePrologSyntax(statement: string): boolean {
    if (!statement || !statement.trim()) {
      return false;
    }

    const trimmed = statement.trim();

    // Must end with a period
    if (!trimmed.endsWith('.')) {
      return false;
    }

    // Check for balanced parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return false;
    }

    // Check for balanced brackets
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return false;
    }

    // Basic character validation - allow standard Prolog characters
    const validPattern = /^[a-zA-Z0-9_\s()\[\].,:\-'"+*\/=<>!]+\.$/;
    if (!validPattern.test(trimmed)) {
      return false;
    }

    return true;
  }

  /**
   * Add a fact to the knowledge base
   */
  async addFact(fact: string): Promise<boolean> {
    try {
      // Ensure fact ends with period
      let normalizedFact = fact.trim();
      if (!normalizedFact.endsWith('.')) {
        normalizedFact += '.';
      }

      if (!this.validatePrologSyntax(normalizedFact)) {
        console.error(`Invalid Prolog syntax: ${normalizedFact}`);
        return false;
      }

      // Add to our knowledge base tracking
      if (!this.knowledgeBase.includes(normalizedFact)) {
        this.knowledgeBase.push(normalizedFact);
      }

      // Save to file
      await this.saveToFile();

      console.log(`Added fact: ${normalizedFact}`);
      return true;

    } catch (error) {
      console.error(`Error adding fact ${fact}:`, error);
      return false;
    }
  }

  /**
   * Add a rule to the knowledge base
   */
  async addRule(rule: string): Promise<boolean> {
    try {
      // Ensure rule ends with period
      let normalizedRule = rule.trim();
      if (!normalizedRule.endsWith('.')) {
        normalizedRule += '.';
      }

      if (!this.validatePrologSyntax(normalizedRule)) {
        console.error(`Invalid Prolog syntax: ${normalizedRule}`);
        return false;
      }

      // Add to our knowledge base tracking
      if (!this.knowledgeBase.includes(normalizedRule)) {
        this.knowledgeBase.push(normalizedRule);
      }

      // Save to file
      await this.saveToFile();

      console.log(`Added rule: ${normalizedRule}`);
      return true;

    } catch (error) {
      console.error(`Error adding rule ${rule}:`, error);
      return false;
    }
  }

  /**
   * Execute a Prolog query and return results
   */
  async query(queryString: string): Promise<QueryResult[]> {
    try {
      // Remove trailing period if present for query
      const queryClean = queryString.trim().replace(/\.$/, '');

      console.log(`Executing query: ${queryClean}`);

      // Check if SWI Prolog is available
      if (!prologEngine.isAvailable()) {
        console.warn('SWI Prolog not available, cannot execute query');
        throw new Error('SWI Prolog is not installed or not available');
      }

      // Create a temporary file with the knowledge base and query
      const tempDir = '/tmp/insimul_prolog';
      await fs.mkdir(tempDir, { recursive: true });

      const tempFile = path.join(tempDir, `query_${Date.now()}.pl`);

      // Write knowledge base + query
      let prologProgram = '% Knowledge Base\n';
      prologProgram += this.knowledgeBase.join('\n');
      prologProgram += '\n\n% Query\n';
      prologProgram += `:- ${queryClean}, write('RESULT: '), write(${queryClean}), nl, fail.\n`;
      prologProgram += ':- halt.\n';

      await fs.writeFile(tempFile, prologProgram);

      // Execute with SWI Prolog
      try {
        const output = execSync(`swipl -q -f "${tempFile}"`, {
          encoding: 'utf8',
          timeout: 5000
        });

        // Parse output to extract results
        const results: QueryResult[] = [];
        const lines = output.split('\n');

        for (const line of lines) {
          if (line.startsWith('RESULT:')) {
            const resultStr = line.substring('RESULT:'.length).trim();
            // Simple parsing - in a real implementation you'd want more sophisticated parsing
            results.push({ result: resultStr });
          }
        }

        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});

        console.log(`Query results:`, results);
        return results;

      } catch (execError) {
        // Query may have failed or returned no results
        console.info(`Query completed with no results:`, execError);
        await fs.unlink(tempFile).catch(() => {});
        return [];
      }

    } catch (error) {
      console.error(`Error executing query ${queryString}:`, error);
      throw error;
    }
  }

  /**
   * Get all facts and rules from the knowledge base
   */
  getAllFacts(): string[] {
    return [...this.knowledgeBase];
  }

  /**
   * Clear all facts and rules from the knowledge base
   */
  async clearKnowledgeBase(): Promise<void> {
    try {
      this.knowledgeBase = [];

      // Clear the file
      await fs.writeFile(
        this.kbFile,
        '% Prolog Knowledge Base\n% This file stores persistent facts and rules\n\n'
      );

      console.log('Knowledge base cleared');

    } catch (error) {
      console.error('Error clearing knowledge base:', error);
      throw error;
    }
  }

  /**
   * Save the current knowledge base to file
   */
  async saveToFile(): Promise<void> {
    try {
      let content = '% Prolog Knowledge Base\n';
      content += '% This file stores persistent facts and rules\n\n';
      content += this.knowledgeBase.join('\n') + '\n';

      await fs.writeFile(this.kbFile, content);

      console.log(`Knowledge base saved to ${this.kbFile}`);

    } catch (error) {
      console.error('Error saving knowledge base to file:', error);
      throw error;
    }
  }

  /**
   * Load knowledge base from file
   */
  async loadFromFile(): Promise<void> {
    try {
      // Check if file exists
      try {
        await fs.access(this.kbFile);
      } catch {
        console.log(`Knowledge base file ${this.kbFile} does not exist, creating new one`);
        await this.saveToFile();
        return;
      }

      // Clear current knowledge base
      this.knowledgeBase = [];

      // Read file and load statements
      const content = await fs.readFile(this.kbFile, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (trimmed && !trimmed.startsWith('%')) {
          try {
            // Add to tracking
            this.knowledgeBase.push(trimmed);
          } catch (error) {
            console.warn(`Error loading statement '${trimmed}':`, error);
          }
        }
      }

      console.log(`Loaded ${this.knowledgeBase.length} statements from ${this.kbFile}`);

    } catch (error) {
      console.error('Error loading knowledge base from file:', error);
      // Create empty file if there was an error
      await this.saveToFile();
    }
  }

  /**
   * Get the file path of the knowledge base
   */
  getKbFile(): string {
    return this.kbFile;
  }

  /**
   * Set a new knowledge base file path
   */
  setKbFile(kbFile: string): void {
    this.kbFile = kbFile;
  }

  /**
   * Export knowledge base as a string
   */
  exportKnowledgeBase(): string {
    return this.knowledgeBase.join('\n');
  }

  /**
   * Import knowledge base from a string
   */
  async importKnowledgeBase(content: string): Promise<void> {
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('%')) {
        if (trimmed.includes(':-')) {
          await this.addRule(trimmed);
        } else {
          await this.addFact(trimmed);
        }
      }
    }
  }
}

// Export a singleton instance for the default knowledge base
export const defaultPrologManager = new PrologManager();
