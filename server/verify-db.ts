/**
 * Database Verification Script
 * 
 * Verifies that MongoDB has all required collections and can handle
 * the geographical hierarchy schema (worlds, countries, states, settlements).
 * 
 * Usage: npx ts-node server/verify-db.ts
 */

import mongoose from 'mongoose';
import { storage } from './storage';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/insimul';
    console.log(`📡 Connecting to MongoDB: ${mongoUrl}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');
    
    // Check collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Existing collections:');
    collectionNames.forEach(name => console.log(`   - ${name}`));
    console.log();
    
    // Check for required collections
    const requiredCollections = [
      'worlds',
      'countries',
      'states', 
      'settlements',
      'characters',
      'rules',
      'grammars'
    ];
    
    console.log('🔎 Checking required collections:');
    for (const required of requiredCollections) {
      const exists = collectionNames.includes(required);
      console.log(`   ${exists ? '✅' : '⚠️ '} ${required} ${exists ? '' : '(will be created on first insert)'}`);
    }
    console.log();
    
    // Try to fetch worlds
    console.log('🌍 Testing world operations...');
    const worlds = await storage.getWorlds();
    console.log(`   Found ${worlds.length} world(s)`);
    
    if (worlds.length > 0) {
      const testWorld = worlds[0];
      console.log(`   Testing with world: ${testWorld.name} (${testWorld.id})`);
      
      // Try to fetch countries for this world
      console.log('\n🏛️  Testing country operations...');
      const countries = await storage.getCountriesByWorld(testWorld.id);
      console.log(`   Found ${countries.length} country/countries`);
      
      // Try to fetch settlements for this world
      console.log('\n🏘️  Testing settlement operations...');
      const settlements = await storage.getSettlementsByWorld(testWorld.id);
      console.log(`   Found ${settlements.length} settlement(s)`);
      
      if (countries.length > 0) {
        const testCountry = countries[0];
        console.log(`\n   Testing with country: ${testCountry.name} (${testCountry.id})`);
        
        // Try to fetch states for this country
        const states = await storage.getStatesByCountry(testCountry.id);
        console.log(`   Found ${states.length} state(s) in this country`);
        
        // Try to fetch settlements for this country
        const countrySettlements = await storage.getSettlementsByCountry(testCountry.id);
        console.log(`   Found ${countrySettlements.length} settlement(s) in this country`);
      }
    }
    
    // Test country creation
    console.log('\n🧪 Testing country creation...');
    if (worlds.length > 0) {
      const testWorld = worlds[0];
      
      try {
        const testCountry = await storage.createCountry({
          worldId: testWorld.id,
          name: 'Test Kingdom (Verification)',
          description: 'Auto-created by verification script',
          governmentType: 'monarchy',
          economicSystem: 'feudal',
          foundedYear: 1000
        });
        
        console.log(`   ✅ Successfully created test country: ${testCountry.name} (${testCountry.id})`);
        
        // Clean up - delete test country
        await storage.deleteCountry(testCountry.id);
        console.log(`   🧹 Cleaned up test country`);
      } catch (error) {
        console.error(`   ❌ Failed to create test country:`, error);
      }
    } else {
      console.log(`   ⚠️  No worlds found - create a world first to test country creation`);
    }
    
    console.log('\n✅ Database verification complete!');
    console.log('\n📝 Notes:');
    console.log('   - MongoDB creates collections automatically on first insert');
    console.log('   - If collections are missing, they will be created when you add data');
    console.log('   - Make sure your MONGO_URL is correct in .env');
    console.log('   - Default: mongodb://localhost:27017/insimul\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run verification
verifyDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
