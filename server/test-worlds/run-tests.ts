/**
 * Test Runner
 * 
 * Execute comprehensive Prolog tests from command line
 */

import { ComprehensivePrologTests } from './comprehensive-prolog-tests';

// Import storage based on configuration
async function getStorage() {
  // Use MongoDB storage by default
  const { createMongoStorage } = await import('../mongo-storage.js');
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/insimul_test';
  return await createMongoStorage(mongoUrl);
}

async function main() {
  console.log('Initializing test environment...\n');
  
  const storage = await getStorage();
  const tests = new ComprehensivePrologTests(storage);
  
  await tests.runAllTests();
  
  const results = tests.getResults();
  const allPassed = results.every(r => r.passed);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
