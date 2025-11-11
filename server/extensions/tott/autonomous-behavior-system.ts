/**
 * Autonomous Behavior System (TotT Integration)
 * 
 * Based on Talk of the Town's person.py observe() and socialize() methods.
 * These are the core autonomous behaviors that run during simulation timesteps.
 * 
 * TotT References:
 * - person.py lines 2008-2023: observe() method
 * - person.py lines 2025-2056: socialize() method
 * - person.py lines 2057-2090: _exchange_information() method
 * 
 * This system makes characters:
 * 1. Observe their surroundings and form/update mental models
 * 2. Socialize with people at their location
 * 3. Progress relationships through interaction
 * 4. Exchange information and gossip
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { initializeMentalModel, addKnownFact, getMentalModel } from './knowledge-system.js';
import { updateRelationship } from './social-dynamics-system.js';
import { simulateConversation } from './conversation-system.js';
import { updateAllWhereabouts } from './routine-system.js';
import { 
  getPersonality, 
  getSocialDesire, 
  getStrangerApproachProbability,
  getGossipProbability,
  getConversationPreferences,
  type BigFivePersonality
} from './personality-behavior-system.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ObservationResult {
  characterId: string;
  timestep: number;
  location: string;
  observedEntities: string[]; // IDs of people/places observed
  mentalModelsFormed: number;
  mentalModelsUpdated: number;
}

export interface SocializationResult {
  characterId: string;
  timestep: number;
  location: string;
  interactedWith: string[]; // Character IDs
  relationshipsProgressed: number;
  conversationsHad: number;
  informationExchanged: number;
}

// ============================================================================
// CORE AUTONOMOUS BEHAVIOR
// ============================================================================

/**
 * Have a character observe their surroundings
 * Based on TotT's person.observe() (lines 2008-2023)
 * 
 * Characters observe:
 * - The location they're at
 * - Other people at that location
 * - Forms or updates mental models
 */
export async function observe(
  characterId: string,
  worldId: string,
  currentTimestep: number
): Promise<ObservationResult> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const customData = (character as any).customData || {};
  const location = customData.currentLocation || 'home';
  
  const result: ObservationResult = {
    characterId,
    timestep: currentTimestep,
    location,
    observedEntities: [],
    mentalModelsFormed: 0,
    mentalModelsUpdated: 0
  };

  // Get all people at this location
  const allCharacters = await storage.getCharactersByWorld(worldId);
  const peopleHere = allCharacters.filter(c => {
    const cData = (c as any).customData || {};
    return cData.currentLocation === location && c.id !== characterId;
  });

  // TotT pattern: chance_someone_observes_nearby_entity
  // Default probability: 0.3 (30% chance to observe each entity)
  const observationChance = 0.3;

  // Observe each person at the location
  for (const otherPerson of peopleHere) {
    if (Math.random() < observationChance) {
      await formOrBuildUpMentalModel(
        characterId,
        otherPerson.id,
        currentTimestep,
        'observation'
      );
      
      result.observedEntities.push(otherPerson.id);
      
      // Check if this is a new mental model
      const existingModel = await getMentalModel(characterId, otherPerson.id);
      if (existingModel) {
        result.mentalModelsUpdated++;
      } else {
        result.mentalModelsFormed++;
      }
    }
  }

  return result;
}

/**
 * Form or build up a mental model through observation
 * Based on TotT's _form_or_build_up_mental_model() (lines 2012-2023)
 */
async function formOrBuildUpMentalModel(
  observerId: string,
  subjectId: string,
  timestep: number,
  sourceType: 'observation' | 'statement' | 'reflection'
): Promise<void> {
  const existingModel = await getMentalModel(observerId, subjectId);
  
  if (!existingModel) {
    // Form new mental model
    await initializeMentalModel(observerId, subjectId, ['name', 'occupation']);
    
    // Add observable facts about the subject
    const subject = await storage.getCharacter(subjectId);
    if (subject) {
      // Observable facts: name, appearance, location
      await addKnownFact(
        observerId,
        subjectId,
        'name',
        timestep
      );
      
      // Add other observable facts
      const customData = (subject as any).customData || {};
      if (customData.currentOccupation) {
        await addKnownFact(
          observerId,
          subjectId,
          'occupation',
          timestep
        );
      }
    }
  } else {
    // Update existing mental model
    // In TotT, this calls mental_model.build_up()
    // For us, we'll update confidence in existing facts
    const subject = await storage.getCharacter(subjectId);
    if (subject) {
      await addKnownFact(
        observerId,
        subjectId,
        'name',
        timestep
      );
    }
  }
}

/**
 * Have a character socialize with nearby people
 * Based on TotT's person.socialize() (lines 2025-2056)
 * 
 * This is the core social interaction method that:
 * - Finds people at same location
 * - Decides whether to interact
 * - Progresses relationships
 * - Exchanges information
 */
export async function socialize(
  characterId: string,
  worldId: string,
  currentTimestep: number,
  missingTimestepsToAccountFor: number = 1
): Promise<SocializationResult> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const customData = (character as any).customData || {};
  const location = customData.currentLocation;
  
  if (!location) {
    throw new Error(`${character.firstName} tried to socialize but has no location`);
  }

  const result: SocializationResult = {
    characterId,
    timestep: currentTimestep,
    location,
    interactedWith: [],
    relationshipsProgressed: 0,
    conversationsHad: 0,
    informationExchanged: 0
  };

  // Get all people at this location
  const allCharacters = await storage.getCharactersByWorld(worldId);
  const peopleHere = allCharacters.filter(c => {
    const cData = (c as any).customData || {};
    return cData.currentLocation === location && c.id !== characterId;
  });

  // Interact with people at location
  for (const otherPerson of peopleHere) {
    // Decide whether to instigate interaction
    if (await decideToInstigateSocialInteraction(character, otherPerson)) {
      // Ensure relationship exists (updateRelationship creates if needed)
      // let relationship = await getRelationship(characterId, otherPerson.id);
      
      // Progress the relationship
      await progressRelationship(
        characterId,
        otherPerson.id,
        missingTimestepsToAccountFor,
        currentTimestep
      );
      result.relationshipsProgressed++;
      result.interactedWith.push(otherPerson.id);
      
      // If full-fidelity simulation (missingTimestepsToAccountFor === 1),
      // have them exchange information
      if (missingTimestepsToAccountFor === 1) {
        await exchangeInformation(
          characterId,
          otherPerson.id,
          worldId,
          currentTimestep
        );
        result.conversationsHad++;
      }
    }
  }

  // TotT pattern: Also simulate socializing with household members
  // regardless of location (so kids know their parents even if they work different shifts)
  const household = await getHouseholdMembers(characterId, worldId);
  for (const householdMember of household) {
    if (householdMember.id === characterId) continue;
    
    await progressRelationship(
      characterId,
      householdMember.id,
      missingTimestepsToAccountFor,
      currentTimestep
    );
    result.relationshipsProgressed++;
    
    if (!result.interactedWith.includes(householdMember.id)) {
      result.interactedWith.push(householdMember.id);
    }
    
    if (missingTimestepsToAccountFor === 1) {
      await exchangeInformation(
        characterId,
        householdMember.id,
        worldId,
        currentTimestep
      );
      result.conversationsHad++;
    }
  }

  return result;
}

/**
 * Decide whether to instigate social interaction
 * Based on TotT's _decide_to_instigate_social_interaction()
 * NOW WITH DEEP PERSONALITY INTEGRATION!
 */
async function decideToInstigateSocialInteraction(
  character: Character,
  otherPerson: Character
): Promise<boolean> {
  const personality = getPersonality(character);
  
  // Use personality-driven social desire
  let interactionProbability = getSocialDesire(personality);
  
  // If they're strangers, use stranger approach probability
  const customData = (character as any).customData || {};
  const mentalModel = await getMentalModel(character.id, otherPerson.id);
  
  if (!mentalModel || !mentalModel.knownFacts || Object.keys(mentalModel.knownFacts).length === 0) {
    // Stranger - use personality-driven stranger approach
    interactionProbability = getStrangerApproachProbability(personality);
  }
  
  // Modify by existing relationship (if they know each other)
  // Agreeableness makes them more likely to interact with people they like
  // Neuroticism makes them avoid people they dislike
  if (mentalModel) {
    const relData = (mentalModel as any).customData || {};
    const charge = relData.charge || 0;
    
    if (charge > 50) {
      // They like each other - agreeableness increases interaction
      interactionProbability += personality.agreeableness * 0.2;
    } else if (charge < -50) {
      // They dislike each other - neuroticism increases avoidance
      interactionProbability -= personality.neuroticism * 0.3;
    }
  }
  
  // Clamp probability
  interactionProbability = Math.max(0.05, Math.min(0.95, interactionProbability));
  
  return Math.random() < interactionProbability;
}

/**
 * Progress a relationship through interaction
 * Based on TotT's relationship.progress_relationship()
 */
async function progressRelationship(
  characterId: string,
  otherPersonId: string,
  missingTimesteps: number,
  currentTimestep: number
): Promise<void> {
  // Update relationship charge based on interaction
  // TotT progresses relationships through compatibility and personality
  // Assume average compatibility of 0.5 for now
  const compatibility = 0.5;
  
  // Positive interactions increase charge
  // Amount depends on compatibility and number of interactions
  const chargeIncrease = compatibility * 2 * missingTimesteps;
  
  await updateRelationship(
    characterId,
    otherPersonId,
    chargeIncrease,
    currentTimestep
  );
}

/**
 * Exchange information between two characters
 * Based on TotT's _exchange_information() (lines 2057-2090)
 * 
 * This is where gossip and knowledge propagation happens!
 * NOW WITH PERSONALITY-DRIVEN CONVERSATION!
 */
async function exchangeInformation(
  characterId: string,
  interlocutorId: string,
  worldId: string,
  currentTimestep: number
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  const interlocutor = await storage.getCharacter(interlocutorId);
  
  if (!character || !interlocutor) return;
  
  // Get personalities
  const personality1 = getPersonality(character);
  const personality2 = getPersonality(interlocutor);
  
  // Get conversation preferences
  const prefs1 = getConversationPreferences(personality1);
  const prefs2 = getConversationPreferences(personality2);
  
  // Determine how many people they'll talk about using personality
  // TotT uses: extroversion + friend bonus
  let howManyPeopleWeTalkAbout = Math.floor(
    (personality1.extroversion + personality2.extroversion) * 5 + 2 // Range: 2-7 people
  );
  
  // Apply conversation length modifier (introverts have shorter convos)
  const avgConversationLength = (prefs1.conversationLength + prefs2.conversationLength) / 2;
  howManyPeopleWeTalkAbout = Math.floor(howManyPeopleWeTalkAbout * avgConversationLength);
  howManyPeopleWeTalkAbout = Math.max(1, howManyPeopleWeTalkAbout); // At least 1 person
  
  // Friends talk more
  const mentalModel = await getMentalModel(characterId, interlocutorId);
  if (mentalModel) {
    const relData = (mentalModel as any).customData || {};
    if (relData.charge > 50) {
      howManyPeopleWeTalkAbout += 2; // Friends talk more
    }
  }
  
  // Get all people both characters know about
  const charData = (character as any).customData || {};
  const interData = (interlocutor as any).customData || {};
  const char1Knowledge = charData.knowledge || {};
  const char2Knowledge = interData.knowledge || {};
  
  const allPeopleWeKnowAbout = new Set([
    ...Object.keys(char1Knowledge),
    ...Object.keys(char2Knowledge)
  ]);
  
  // Select most salient people to talk about
  // TotT uses salience scores - we'll use a simplified version
  const peopleToTalkAbout = Array.from(allPeopleWeKnowAbout)
    .slice(0, howManyPeopleWeTalkAbout);
  
  // Exchange information about each person (with personality-driven gossip)
  for (const subjectId of peopleToTalkAbout) {
    await exchangeInformationAboutPerson(
      characterId,
      interlocutorId,
      subjectId,
      currentTimestep,
      personality1,
      personality2
    );
  }
}

/**
 * Exchange information about a specific person
 * Based on TotT's _exchange_information_about_a_person() (lines 2092-2140+)
 * NOW WITH PERSONALITY-DRIVEN GOSSIP!
 */
async function exchangeInformationAboutPerson(
  talkerId: string,
  listenerId: string,
  subjectId: string,
  currentTimestep: number,
  talkerPersonality?: BigFivePersonality,
  listenerPersonality?: BigFivePersonality
): Promise<void> {
  // Ensure both have mental models of the subject (auto-create if needed)
  const talkerModel = await getMentalModel(talkerId, subjectId, true, currentTimestep);
  const listenerModel = await getMentalModel(listenerId, subjectId, true, currentTimestep);
  
  if (!talkerModel || !listenerModel) {
    // Failed to create models, skip knowledge sharing
    return;
  }
  
  // Get personalities if not provided
  if (!talkerPersonality) {
    const talker = await storage.getCharacter(talkerId);
    if (talker) talkerPersonality = getPersonality(talker);
  }
  if (!listenerPersonality) {
    const listener = await storage.getCharacter(listenerId);
    if (listener) listenerPersonality = getPersonality(listener);
  }
  
  // Personality-driven gossip probability
  // Extroverts gossip more, conscientious people are more discrete
  let shareChance = 0.3; // Base 30% chance
  
  if (talkerPersonality) {
    const gossipProb = getGossipProbability(talkerPersonality);
    shareChance = gossipProb;
  }
  
  // Share known facts with listener
  if (talkerModel.knownFacts.name && !listenerModel.knownFacts.name) {
    if (Math.random() < shareChance) {
      await addKnownFact(listenerId, subjectId, 'name', currentTimestep);
    }
  }
  if (talkerModel.knownFacts.occupation && !listenerModel.knownFacts.occupation) {
    if (Math.random() < shareChance) {
      await addKnownFact(listenerId, subjectId, 'occupation', currentTimestep);
    }
  }
  if (talkerModel.knownFacts.location && !listenerModel.knownFacts.location) {
    if (Math.random() < shareChance) {
      await addKnownFact(listenerId, subjectId, 'location', currentTimestep);
    }
  }
  if (talkerModel.knownFacts.family && !listenerModel.knownFacts.family) {
    if (Math.random() < shareChance) {
      await addKnownFact(listenerId, subjectId, 'family', currentTimestep);
    }
  }
  if (talkerModel.knownFacts.personality && !listenerModel.knownFacts.personality) {
    // Only open people share personality insights
    if (talkerPersonality && talkerPersonality.openness > 0.6) {
      if (Math.random() < shareChance) {
        await addKnownFact(listenerId, subjectId, 'personality', currentTimestep);
      }
    }
  }
}

/**
 * Get household members for a character
 */
async function getHouseholdMembers(
  characterId: string,
  worldId: string
): Promise<Character[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) return [];
  
  const customData = (character as any).customData || {};
  const residence = customData.residence;
  
  if (!residence) return [];
  
  // Get all characters in same residence
  const allCharacters = await storage.getCharactersByWorld(worldId);
  return allCharacters.filter(c => {
    const cData = (c as any).customData || {};
    return cData.residence === residence;
  });
}

// ============================================================================
// SIMULATION TIMESTEP EXECUTION
// ============================================================================

/**
 * Execute a full simulation timestep for all characters in a world
 * This is the main simulation loop that TotT uses
 * 
 * Based on TotT's game.enact_hi_fi_simulation() (game.py lines 426-467)
 */
export async function executeSimulationTimestep(
  worldId: string,
  currentTimestep: number,
  timeOfDay: 'day' | 'night',
  hour: number
): Promise<{
  observations: ObservationResult[];
  socializations: SocializationResult[];
  totalInteractions: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  
  const observations: ObservationResult[] = [];
  const socializations: SocializationResult[] = [];
  let totalInteractions = 0;
  
  // Step 1: Update whereabouts (characters go to their routine locations)
  await updateAllWhereabouts(worldId, currentTimestep, timeOfDay, hour);
  
  // Step 2: Characters observe their surroundings
  for (const character of allCharacters) {
    // TotT: Only characters age > 3 observe
    const age = getAge(character);
    if (age <= 3) continue;
    
    try {
      const result = await observe(character.id, worldId, currentTimestep);
      observations.push(result);
    } catch (error) {
      console.error(`Error during observe for ${character.id}:`, error);
    }
  }
  
  // Step 3: Characters socialize with people at their location
  for (const character of allCharacters) {
    const age = getAge(character);
    if (age <= 3) continue;
    
    try {
      const result = await socialize(character.id, worldId, currentTimestep, 1);
      socializations.push(result);
      totalInteractions += result.interactedWith.length;
    } catch (error) {
      console.error(`Error during socialize for ${character.id}:`, error);
    }
  }
  
  // Step 4: Check for life events (marriages, reproduction, divorces)
  const marriages = await checkForMarriageProposals(worldId, currentTimestep);
  const reproduction = await checkForReproduction(worldId, currentTimestep);
  const births = await checkForBirths(worldId, currentTimestep);
  const divorces = await checkForDivorces(worldId, currentTimestep);
  
  // Step 5: Update dynamic tracking (neighbors/coworkers)
  const tracking = await updateDynamicTracking(worldId);
  
  return {
    observations,
    socializations,
    totalInteractions,
    lifeEvents: {
      marriages: marriages.marriages,
      proposals: marriages.proposals,
      conceptions: reproduction.conceptions,
      births: births.births,
      divorces: divorces.divorces
    },
    tracking: {
      neighborsUpdated: tracking.neighborsUpdated,
      coworkersUpdated: tracking.coworkersUpdated
    }
  };
}

/**
 * Execute low-fidelity simulation timestep (faster, accounts for multiple timesteps)
 * Based on TotT's game.enact_lo_fi_simulation()
 */
export async function executeLowFidelityTimestep(
  worldId: string,
  currentTimestep: number,
  missingTimesteps: number
): Promise<{
  socializations: SocializationResult[];
  totalInteractions: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  const socializations: SocializationResult[] = [];
  let totalInteractions = 0;
  
  // In lo-fi simulation, we skip observation and just do social interactions
  for (const character of allCharacters) {
    const age = getAge(character);
    if (age <= 3) continue;
    
    try {
      const result = await socialize(
        character.id,
        worldId,
        currentTimestep,
        missingTimesteps
      );
      socializations.push(result);
      totalInteractions += result.interactedWith.length;
    } catch (error) {
      console.error(`Error during lo-fi socialize for ${character.id}:`, error);
    }
  }
  
  return { socializations, totalInteractions };
}

/**
 * Calculate character age
 */
function getAge(character: Character): number {
  const customData = (character as any).customData || {};
  return customData.age || 0;
}

// ============================================================================
// AUTONOMOUS LIFE EVENTS (Week 2 Implementation)
// ============================================================================

/**
 * Check for autonomous marriage proposals during simulation
 * Based on TotT's marriage mechanics in game.enact_lo_fi_simulation()
 */
export async function checkForMarriageProposals(
  worldId: string,
  currentTimestep: number
): Promise<{
  proposals: number;
  marriages: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let proposals = 0;
  let marriages = 0;
  
  for (const character of allCharacters) {
    const age = getAge(character);
    const customData = (character as any).customData || {};
    
    // Must be adult (18+), alive, and not already married
    if (age < 18 || !character.alive || character.spouseId) continue;
    
    // Check all relationships for romantic potential
    const relationships = await storage.getRelationshipsByCharacter(character.id);
    
    for (const rel of relationships) {
      const relData = (rel as any).customData || {};
      const otherPersonId = rel.character1Id === character.id ? rel.character2Id : rel.character1Id;
      const otherPerson = await storage.getCharacter(otherPersonId);
      
      if (!otherPerson || !otherPerson.alive || otherPerson.spouseId) continue;
      
      const otherAge = getAge(otherPerson);
      if (otherAge < 18) continue;
      
      // Check if relationship has high spark (romantic attraction)
      const spark = relData.spark || 0;
      const charge = relData.charge || 0;
      
      // TotT pattern: Need high spark (>75) and positive charge (>50) to propose
      if (spark > 75 && charge > 50) {
        // Probabilistic: 5% chance per timestep if conditions met
        if (Math.random() < 0.05) {
          proposals++;
          
          // Proposal succeeds if other person also has high feelings
          const reverseRel = relationships.find(r => 
            (r.character1Id === otherPersonId && r.character2Id === character.id) ||
            (r.character2Id === otherPersonId && r.character1Id === character.id)
          );
          
          if (reverseRel) {
            const reverseData = (reverseRel as any).customData || {};
            const reverseSpark = reverseData.spark || 0;
            const reverseCharge = reverseData.charge || 0;
            
            if (reverseSpark > 60 && reverseCharge > 40) {
              // Marriage accepted!
              await storage.updateCharacter(character.id, {
                spouseId: otherPersonId
              });
              await storage.updateCharacter(otherPersonId, {
                spouseId: character.id
              });
              marriages++;
              
              console.log(`💑 Marriage: ${character.firstName} & ${otherPerson.firstName}`);
            }
          }
        }
      }
    }
  }
  
  return { proposals, marriages };
}

/**
 * Check for autonomous reproduction (trying to conceive)
 * Based on TotT's reproduction mechanics in game.enact_lo_fi_simulation()
 */
export async function checkForReproduction(
  worldId: string,
  currentTimestep: number
): Promise<{
  conceptions: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let conceptions = 0;
  
  for (const character of allCharacters) {
    const age = getAge(character);
    const customData = (character as any).customData || {};
    
    // Must be female, married, fertile age (18-45), and not already pregnant
    if (!character.female || !character.spouseId || age < 18 || age > 45) continue;
    if (customData.pregnant) continue;
    
    const spouse = await storage.getCharacter(character.spouseId);
    if (!spouse || !spouse.alive) continue;
    
    // TotT pattern: Married couples have a chance to try to conceive
    // Probability decreases with age and number of existing children
    const numChildren = customData.childIds?.length || 0;
    
    // Base probability: 10% per timestep
    let conceptionChance = 0.10;
    
    // Decrease with age (linearly from 18-45)
    const ageFactor = 1.0 - ((age - 18) / 27) * 0.5; // 1.0 at 18, 0.5 at 45
    conceptionChance *= ageFactor;
    
    // Decrease with existing children
    conceptionChance *= Math.pow(0.7, numChildren); // 70% for each child
    
    if (Math.random() < conceptionChance) {
      // Conception occurs!
      await storage.updateCharacter(character.id, {
        customData: {
          ...customData,
          pregnant: true,
          conceptionTimestep: currentTimestep,
          dueTimestep: currentTimestep + 270 // ~9 months (270 days)
        }
      });
      conceptions++;
      
      console.log(`🤰 Conception: ${character.firstName} is pregnant!`);
    }
  }
  
  return { conceptions };
}

/**
 * Check for births (due date reached)
 */
export async function checkForBirths(
  worldId: string,
  currentTimestep: number
): Promise<{
  births: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let births = 0;
  
  for (const character of allCharacters) {
    const customData = (character as any).customData || {};
    
    if (customData.pregnant && customData.dueTimestep <= currentTimestep) {
      // Birth occurs!
      const father = character.spouseId ? await storage.getCharacter(character.spouseId) : null;
      
      // Create new character (baby)
      const baby = await storage.createCharacter({
        worldId,
        firstName: 'Baby', // Would normally generate from name system
        lastName: character.lastName,
        male: Math.random() < 0.5,
        female: Math.random() >= 0.5,
        alive: true,
        birthYear: Math.floor(currentTimestep / 365),
        motherId: character.id,
        fatherId: father?.id || null,
        customData: {
          age: 0,
          birthTimestep: currentTimestep
        }
      });
      
      // Update mother
      const motherChildIds = customData.childIds || [];
      await storage.updateCharacter(character.id, {
        customData: {
          ...customData,
          pregnant: false,
          conceptionTimestep: undefined,
          dueTimestep: undefined,
          childIds: [...motherChildIds, baby.id]
        }
      });
      
      // Update father
      if (father) {
        const fatherData = (father as any).customData || {};
        const fatherChildIds = fatherData.childIds || [];
        await storage.updateCharacter(father.id, {
          customData: {
            ...fatherData,
            childIds: [...fatherChildIds, baby.id]
          }
        });
      }
      
      births++;
      console.log(`👶 Birth: ${character.firstName} gave birth!`);
    }
  }
  
  return { births };
}

/**
 * Check for autonomous divorces during simulation
 * Based on TotT's divorce mechanics
 */
export async function checkForDivorces(
  worldId: string,
  currentTimestep: number
): Promise<{
  divorces: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let divorces = 0;
  
  // Track processed pairs to avoid double-processing
  const processedPairs = new Set<string>();
  
  for (const character of allCharacters) {
    if (!character.spouseId) continue;
    
    // Create a unique pair ID (sorted to avoid duplicates)
    const pairId = [character.id, character.spouseId].sort().join('-');
    if (processedPairs.has(pairId)) continue;
    processedPairs.add(pairId);
    
    const spouse = await storage.getCharacter(character.spouseId);
    if (!spouse) continue;
    
    // Get relationship between spouses
    const relationships = await storage.getRelationshipsByCharacter(character.id);
    const spouseRel = relationships.find(r => 
      (r.character1Id === character.spouseId || r.character2Id === character.spouseId)
    );
    
    if (spouseRel) {
      const relData = (spouseRel as any).customData || {};
      const charge = relData.charge || 0;
      const spark = relData.spark || 0;
      
      // TotT pattern: Low charge (<-50) or very low spark (<10) can cause divorce
      if (charge < -50 || spark < 10) {
        // Probabilistic: 2% chance per timestep if conditions met
        if (Math.random() < 0.02) {
          // Divorce occurs
          await storage.updateCharacter(character.id, {
            spouseId: null
          });
          await storage.updateCharacter(spouse.id, {
            spouseId: null
          });
          
          divorces++;
          console.log(`💔 Divorce: ${character.firstName} & ${spouse.firstName}`);
        }
      }
    }
  }
  
  return { divorces };
}

/**
 * Update dynamic neighbor and coworker tracking
 * Called when characters move homes or change jobs
 */
export async function updateDynamicTracking(
  worldId: string
): Promise<{
  neighborsUpdated: number;
  coworkersUpdated: number;
}> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  let neighborsUpdated = 0;
  let coworkersUpdated = 0;
  
  for (const character of allCharacters) {
    const customData = (character as any).customData || {};
    const currentNeighbors = new Set<string>();
    const currentCoworkers = new Set<string>();
    
    // Find neighbors (same residence or nearby lots)
    const residence = customData.residence;
    if (residence) {
      for (const other of allCharacters) {
        if (other.id === character.id) continue;
        const otherData = (other as any).customData || {};
        if (otherData.residence === residence) {
          currentNeighbors.add(other.id);
        }
      }
    }
    
    // Find coworkers (same company)
    const company = customData.currentOccupation?.company;
    if (company) {
      for (const other of allCharacters) {
        if (other.id === character.id) continue;
        const otherData = (other as any).customData || {};
        if (otherData.currentOccupation?.company === company) {
          currentCoworkers.add(other.id);
        }
      }
    }
    
    // Update character's neighbor and coworker lists
    const oldNeighbors = new Set(customData.neighbors || []);
    const oldCoworkers = new Set(customData.coworkers || []);
    
    // Track former neighbors/coworkers
    const formerNeighbors = [...(customData.formerNeighbors || [])];
    const formerCoworkers = [...(customData.formerCoworkers || [])];
    
    for (const oldNeighbor of oldNeighbors) {
      if (!currentNeighbors.has(oldNeighbor) && !formerNeighbors.includes(oldNeighbor)) {
        formerNeighbors.push(oldNeighbor);
      }
    }
    
    for (const oldCoworker of oldCoworkers) {
      if (!currentCoworkers.has(oldCoworker) && !formerCoworkers.includes(oldCoworker)) {
        formerCoworkers.push(oldCoworker);
      }
    }
    
    // Update character data
    await storage.updateCharacter(character.id, {
      customData: {
        ...customData,
        neighbors: Array.from(currentNeighbors),
        coworkers: Array.from(currentCoworkers),
        formerNeighbors,
        formerCoworkers
      }
    });
    
    if (currentNeighbors.size > 0) neighborsUpdated++;
    if (currentCoworkers.size > 0) coworkersUpdated++;
  }
  
  return { neighborsUpdated, coworkersUpdated };
}

// All functions are already exported above with 'export async function'
