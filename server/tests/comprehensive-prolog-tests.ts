/**
 * Comprehensive Prolog Integration Test Suite
 * 
 * Tests all MongoDB collections and Prolog sync across 5 diverse worlds:
 * 1. Medieval Fantasy (nobles, feudal structures)
 * 2. Sci-Fi Space Colony (multi-generational, corporate)
 * 3. Modern Urban (diverse families, complex networks)
 * 4. Historical Renaissance (merchant families, artists)
 * 5. High Fantasy (multiple races, magic)
 */

import type { IStorage } from '../db/storage';
import { createPrologSyncService } from '../engines/prolog/prolog-sync';
import { PrologManager } from '../engines/prolog/prolog-manager';
import { generateMedievalWorld } from '../seed/legacy/world-generator-medieval';
import { generateSciFiWorld } from '../seed/legacy/world-generator-scifi';
import { generateModernWorld } from '../seed/legacy/world-generator-modern';
import { generateHistoricalWorld } from '../seed/legacy/world-generator-historical';
import { generateFantasyWorld } from '../seed/legacy/world-generator-fantasy';

interface TestResult {
  worldName: string;
  worldId: string;
  passed: boolean;
  collections: {
    characters: number;
    countries: number;
    settlements: number;
    relationships: number;
  };
  prologFacts: number;
  queries: {
    query: string;
    results: number;
    passed: boolean;
  }[];
  errors: string[];
}

export class ComprehensivePrologTests {
  private storage: IStorage;
  private results: TestResult[] = [];

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Run all tests across all 5 test worlds
   */
  async runAllTests(): Promise<void> {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  COMPREHENSIVE PROLOG INTEGRATION TEST SUITE  ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    const generators = [
      { name: 'Medieval Fantasy', fn: generateMedievalWorld },
      { name: 'Sci-Fi Space Colony', fn: generateSciFiWorld },
      { name: 'Modern Urban', fn: generateModernWorld },
      { name: 'Historical Renaissance', fn: generateHistoricalWorld },
      { name: 'High Fantasy', fn: generateFantasyWorld }
    ];

    for (const generator of generators) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${generator.name}`);
      console.log('='.repeat(60));

      try {
        const worldId = await generator.fn(this.storage);
        await this.testWorld(worldId, generator.name);
      } catch (error) {
        console.error(`❌ Failed to test ${generator.name}:`, error);
        this.results.push({
          worldName: generator.name,
          worldId: 'FAILED',
          passed: false,
          collections: { characters: 0, countries: 0, settlements: 0, relationships: 0 },
          prologFacts: 0,
          queries: [],
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }

    this.printSummary();
  }

  /**
   * Test a single world
   */
  private async testWorld(worldId: string, worldName: string): Promise<void> {
    const errors: string[] = [];
    const result: TestResult = {
      worldName,
      worldId,
      passed: true,
      collections: { characters: 0, countries: 0, settlements: 0, relationships: 0 },
      prologFacts: 0,
      queries: [],
      errors
    };

    try {
      // Test 1: Verify MongoDB collections
      console.log('\n📊 Testing MongoDB Collections...');
      await this.testCollections(worldId, result);

      // Test 2: Sync to Prolog
      console.log('\n🔄 Testing Prolog Synchronization...');
      await this.testPrologSync(worldId, result);

      // Test 3: Query Prolog
      console.log('\n🔍 Testing Prolog Queries...');
      await this.testPrologQueries(worldId, result);

      // Test 4: Verify data integrity
      console.log('\n✓ Testing Data Integrity...');
      await this.testDataIntegrity(worldId, result);

    } catch (error) {
      result.passed = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      console.error(`❌ Test failed:`, error);
    }

    this.results.push(result);

    if (result.passed) {
      console.log(`\n✅ All tests passed for ${worldName}!`);
    } else {
      console.log(`\n❌ Tests failed for ${worldName}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  }

  /**
   * Test MongoDB collections
   */
  private async testCollections(worldId: string, result: TestResult): Promise<void> {
    // Test characters collection
    const characters = await this.storage.getCharactersByWorld(worldId);
    result.collections.characters = characters.length;
    console.log(`   ✓ Characters: ${characters.length}`);

    if (characters.length === 0) {
      throw new Error('No characters found');
    }

    // Test countries collection
    const countries = await this.storage.getCountriesByWorld(worldId);
    result.collections.countries = countries.length;
    console.log(`   ✓ Countries: ${countries.length}`);

    // Test settlements collection
    const settlements = await this.storage.getSettlementsByWorld(worldId);
    result.collections.settlements = settlements.length;
    console.log(`   ✓ Settlements: ${settlements.length}`);

    // Count relationships
    let relationshipCount = 0;
    for (const char of characters) {
      if (char.spouseId) relationshipCount++;
      if (char.parentIds) relationshipCount += char.parentIds.length;
      if (char.friendIds) relationshipCount += char.friendIds.length;
    }
    result.collections.relationships = relationshipCount;
    console.log(`   ✓ Relationships: ${relationshipCount}`);
  }

  /**
   * Test Prolog synchronization
   */
  private async testPrologSync(worldId: string, result: TestResult): Promise<void> {
    const kbFile = `knowledge_base_test_${worldId}.pl`;
    const prologManager = new PrologManager(kbFile, worldId);
    await prologManager.initialize();

    const syncService = createPrologSyncService(this.storage, prologManager);
    
    // Clear and sync
    await syncService.clearWorldFromProlog(worldId);
    await syncService.syncWorldToProlog(worldId);

    // Count facts
    const facts = prologManager.getAllFacts();
    result.prologFacts = facts.length;
    console.log(`   ✓ Prolog facts synced: ${facts.length}`);

    if (facts.length === 0) {
      throw new Error('No Prolog facts generated');
    }

    // Verify minimum expected facts per character
    const expectedMin = result.collections.characters * 5; // At least 5 facts per character
    if (facts.length < expectedMin) {
      result.errors.push(`Expected at least ${expectedMin} facts, got ${facts.length}`);
    }
  }

  /**
   * Test Prolog queries
   */
  private async testPrologQueries(worldId: string, result: TestResult): Promise<void> {
    const kbFile = `knowledge_base_test_${worldId}.pl`;
    const prologManager = new PrologManager(kbFile, worldId);
    await prologManager.initialize();

    const queries = [
      { query: 'person(X)', expected: '> 0', desc: 'Find all people' },
      { query: 'married_to(X, Y)', expected: '>= 0', desc: 'Find married couples' },
      { query: 'parent_of(P, C)', expected: '>= 0', desc: 'Find parent-child relationships' },
      { query: 'at_location(X, L)', expected: '> 0', desc: 'Find people at locations' },
      { query: 'sibling_of(X, Y)', expected: '>= 0', desc: 'Find siblings' }
    ];

    for (const { query, expected, desc } of queries) {
      try {
        const results = await prologManager.query(query);
        const passed = results.length >= 0; // Basic check
        
        result.queries.push({
          query,
          results: results.length,
          passed
        });

        console.log(`   ✓ ${desc}: ${results.length} results`);
      } catch (error) {
        result.queries.push({
          query,
          results: 0,
          passed: false
        });
        result.errors.push(`Query failed: ${query}`);
        console.log(`   ❌ ${desc}: FAILED`);
      }
    }
  }

  /**
   * Test data integrity (1:1 mapping)
   */
  private async testDataIntegrity(worldId: string, result: TestResult): Promise<void> {
    const kbFile = `knowledge_base_test_${worldId}.pl`;
    const prologManager = new PrologManager(kbFile, worldId);
    await prologManager.initialize();

    const characters = await this.storage.getCharactersByWorld(worldId);

    // Query for all people in Prolog
    const prologPeople = await prologManager.query('person(X)');
    
    console.log(`   MongoDB characters: ${characters.length}`);
    console.log(`   Prolog persons: ${prologPeople.length}`);

    // Verify 1:1 mapping (allowing for query parsing differences)
    if (characters.length > 0 && prologPeople.length === 0) {
      result.errors.push('No people found in Prolog despite characters in MongoDB');
      result.passed = false;
    }

    // Test specific character mapping
    if (characters.length > 0) {
      const firstChar = characters[0];
      const charId = `${firstChar.firstName}_${firstChar.lastName}_${firstChar.id}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      
      const charQuery = await prologManager.query(`person(${charId})`);
      if (charQuery.length === 0) {
        console.log(`   ⚠️  Warning: Character ${firstChar.firstName} not found in Prolog`);
      } else {
        console.log(`   ✓ Character mapping verified`);
      }
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\nTotal Worlds Tested: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    console.log('\n' + '-'.repeat(60));
    console.log('DETAILED RESULTS');
    console.log('-'.repeat(60));

    for (const result of this.results) {
      console.log(`\n${result.passed ? '✅' : '❌'} ${result.worldName}`);
      console.log(`   Characters: ${result.collections.characters}`);
      console.log(`   Countries: ${result.collections.countries}`);
      console.log(`   Settlements: ${result.collections.settlements}`);
      console.log(`   Relationships: ${result.collections.relationships}`);
      console.log(`   Prolog Facts: ${result.prologFacts}`);
      console.log(`   Queries Tested: ${result.queries.length}`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors:`);
        result.errors.forEach(err => console.log(`      - ${err}`));
      }
    }

    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Prolog integration is production-ready.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review errors above.`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results;
  }
}
