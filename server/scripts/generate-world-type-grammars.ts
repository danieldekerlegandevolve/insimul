/**
 * Generate Static Tracery Grammars for All World Types
 *
 * This script generates comprehensive Tracery grammars for each of the 20 standard world types.
 * The generated grammars will be used for fast, offline name generation without API calls.
 */

import 'dotenv/config';
import { grammarGenerator } from '../services/grammar-generator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const WORLD_TYPES = [
  { value: 'medieval-fantasy', label: 'Medieval Fantasy', description: 'Knights, castles, magic, and dragons' },
  { value: 'high-fantasy', label: 'High Fantasy', description: 'Epic quests, multiple races, powerful magic' },
  { value: 'low-fantasy', label: 'Low Fantasy', description: 'Realistic with subtle magical elements' },
  { value: 'dark-fantasy', label: 'Dark Fantasy', description: 'Gothic horror with supernatural elements' },
  { value: 'urban-fantasy', label: 'Urban Fantasy', description: 'Modern city with hidden magical world' },
  { value: 'sci-fi-space', label: 'Space Opera', description: 'Interstellar travel, alien civilizations, galactic empires' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'High tech, low life, corporate dystopia' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic', description: 'Survival in a devastated world' },
  { value: 'steampunk', label: 'Steampunk', description: 'Victorian era with advanced steam technology' },
  { value: 'dieselpunk', label: 'Dieselpunk', description: '1920s-1950s aesthetic with advanced diesel tech' },
  { value: 'historical-ancient', label: 'Ancient Civilizations', description: 'Rome, Greece, Egypt, or other ancient cultures' },
  { value: 'historical-medieval', label: 'Historical Medieval', description: 'Realistic medieval Europe or Asia' },
  { value: 'historical-renaissance', label: 'Renaissance', description: 'Art, science, and political intrigue' },
  { value: 'historical-victorian', label: 'Victorian Era', description: 'Industrial revolution, colonialism, social change' },
  { value: 'wild-west', label: 'Wild West', description: 'Cowboys, outlaws, frontier towns' },
  { value: 'modern-realistic', label: 'Modern Realistic', description: 'Contemporary world with real-world issues' },
  { value: 'superhero', label: 'Superhero', description: 'Powered individuals protecting society' },
  { value: 'horror', label: 'Horror', description: 'Supernatural terrors and psychological dread' },
  { value: 'mythological', label: 'Mythological', description: 'Gods, myths, and legendary creatures' },
  { value: 'solarpunk', label: 'Solarpunk', description: 'Optimistic future with sustainable technology' },
];

interface GeneratedGrammar {
  name: string;
  description: string;
  grammar: Record<string, string | string[]>;
  tags: string[];
  worldType: string;
  isActive: boolean;
}

async function generateGrammarsForWorldType(worldType: typeof WORLD_TYPES[0]): Promise<GeneratedGrammar[]> {
  console.log(`\n🎨 Generating grammars for: ${worldType.label} (${worldType.value})`);
  const grammars: GeneratedGrammar[] = [];

  // Helper function for retry with exponential backoff
  async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`    ⏳ Retry ${attempt + 1}/${maxRetries - 1} in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  // 1. Character Names Grammar
  console.log('  📝 Generating character names...');
  try {
    const characterGrammar = await retryWithBackoff(() =>
      grammarGenerator.generateGrammar({
        description: `Generate character names (first and last names) for a ${worldType.label} world. ${worldType.description}. Include diverse names that fit the setting's culture and time period. Create separate symbols for male first names, female first names, and last names.`,
        theme: worldType.value,
        complexity: 'medium',
        symbolCount: 6,
      })
    );

    grammars.push({
      name: `${worldType.value}_character_names`,
      description: `Character names for ${worldType.label} settings`,
      grammar: characterGrammar.grammar,
      tags: ['names', 'character', worldType.value],
      worldType: worldType.value,
      isActive: true,
    });
    console.log('    ✅ Character names generated');
  } catch (error) {
    console.error(`    ❌ Failed to generate character names after retries:`, (error as Error).message);
  }

  // Small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Settlement Names Grammar
  console.log('  🏘️  Generating settlement names...');
  try {
    const settlementGrammar = await retryWithBackoff(() =>
      grammarGenerator.generateGrammar({
        description: `Generate settlement names (cities, towns, and villages) for a ${worldType.label} world. ${worldType.description}. Names should fit the setting's culture and evoke the appropriate atmosphere.`,
        theme: worldType.value,
        complexity: 'medium',
        symbolCount: 5,
      })
    );

    grammars.push({
      name: `${worldType.value}_settlement_names`,
      description: `Settlement names for ${worldType.label} settings`,
      grammar: settlementGrammar.grammar,
      tags: ['names', 'settlement', 'places', worldType.value],
      worldType: worldType.value,
      isActive: true,
    });
    console.log('    ✅ Settlement names generated');
  } catch (error) {
    console.error(`    ❌ Failed to generate settlement names after retries:`, (error as Error).message);
  }

  // Small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Business Names Grammar
  console.log('  🏪 Generating business names...');
  try {
    const businessGrammar = await retryWithBackoff(() =>
      grammarGenerator.generateGrammar({
        description: `Generate business and shop names for a ${worldType.label} world. ${worldType.description}. Include names for taverns, inns, shops, guilds, and other establishments appropriate to the setting.`,
        theme: worldType.value,
        complexity: 'medium',
        symbolCount: 5,
      })
    );

    grammars.push({
      name: `${worldType.value}_business_names`,
      description: `Business and establishment names for ${worldType.label} settings`,
      grammar: businessGrammar.grammar,
      tags: ['names', 'business', worldType.value],
      worldType: worldType.value,
      isActive: true,
    });
    console.log('    ✅ Business names generated');
  } catch (error) {
    console.error(`    ❌ Failed to generate business names after retries:`, (error as Error).message);
  }

  return grammars;
}

async function generateAllGrammars() {
  console.log('🚀 Starting grammar generation for all world types...\n');
  console.log('📊 This will generate approximately 60 grammars (3 per world type × 20 world types)');
  console.log('⏱️  Expected time: ~5-10 minutes with retries\n');
  console.log('💾 Progress will be saved incrementally after each world type\n');

  const outputPath = path.join(process.cwd(), 'server/seed/world-type-grammars.json');
  const tsOutputPath = path.join(process.cwd(), 'server/seed/world-type-grammars.ts');

  // Try to load existing progress
  let allGrammars: GeneratedGrammar[] = [];
  const completedWorldTypes = new Set<string>();

  try {
    const existingData = await fs.readFile(outputPath, 'utf-8');
    allGrammars = JSON.parse(existingData);
    allGrammars.forEach(g => completedWorldTypes.add(g.worldType));
    console.log(`📂 Resuming from saved progress: ${completedWorldTypes.size} world types already completed\n`);
  } catch (error) {
    console.log(`📂 Starting fresh (no previous progress found)\n`);
  }

  // Helper function to save progress
  async function saveProgress(grammars: GeneratedGrammar[]) {
    // Save JSON
    await fs.writeFile(outputPath, JSON.stringify(grammars, null, 2));

    // Save TypeScript
    const tsContent = `/**
 * Auto-generated World Type Grammars
 * Last updated: ${new Date().toISOString()}
 *
 * These are static Tracery grammars for each of the 20 standard world types.
 * They are used for fast, offline name generation without API calls.
 */

export const worldTypeGrammars = ${JSON.stringify(grammars, null, 2)};
`;
    await fs.writeFile(tsOutputPath, tsContent);
  }

  for (const worldType of WORLD_TYPES) {
    // Skip if already completed
    if (completedWorldTypes.has(worldType.value)) {
      console.log(`⏭️  Skipping ${worldType.label} (already completed)`);
      continue;
    }

    try {
      const grammars = await generateGrammarsForWorldType(worldType);
      allGrammars.push(...grammars);
      console.log(`  ✅ Completed ${worldType.label}: ${grammars.length} grammars generated`);

      // Save progress incrementally
      await saveProgress(allGrammars);
      console.log(`  💾 Progress saved (${allGrammars.length} total grammars)`);
    } catch (error) {
      console.error(`  ❌ Failed to generate grammars for ${worldType.label}:`, error);
      // Continue to next world type even if this one failed
    }

    // Delay between world types to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Generation complete! Total grammars: ${allGrammars.length}`);
  console.log(`\n💾 Final output saved to:`);
  console.log(`   JSON: ${outputPath}`);
  console.log(`   TypeScript: ${tsOutputPath}`);
  console.log('\n🎉 All done! You can now add these grammars to seed-grammars.ts');
}

// Run the generator
generateAllGrammars().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
