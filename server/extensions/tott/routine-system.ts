/**
 * Routine System Extension for Insimul
 * Implements Talk of the Town daily routines and whereabouts tracking
 */

import { storage } from '../../db/storage';
import type { Character, TimeOfDay, ActivityOccasion, LocationType, OccupationVocation } from '@shared/schema';

export interface TimeBlock {
  startHour: number; // 0-23
  endHour: number; // 0-23
  location: string; // business ID, residence ID, or description
  locationType: LocationType;
  occasion: ActivityOccasion;
}

export interface DailyRoutine {
  day: TimeBlock[];
  night: TimeBlock[];
}

export interface RoutineData {
  characterId: string;
  routine: DailyRoutine;
  lastUpdated: number;
}

export interface CurrentActivity {
  characterId: string;
  characterName: string;
  timeOfDay: TimeOfDay;
  currentHour: number;
  location: string;
  locationType: LocationType;
  occasion: ActivityOccasion;
  timeBlock: TimeBlock;
}

/**
 * Set a character's daily routine
 */
export async function setRoutine(
  characterId: string,
  routine: DailyRoutine
): Promise<void> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const routineData: RoutineData = {
    characterId,
    routine,
    lastUpdated: Date.now()
  };

  // Store in character's customData
  const customData = (character as any).customData as Record<string, any> | undefined;
  
  await storage.updateCharacter(characterId, {
    ...((customData || true) && {
      customData: {
        ...(customData || {}),
        routine: routineData
      }
    })
  } as any);

  console.log(`✓ Set routine for ${character.firstName} ${character.lastName}`);
}

/**
 * Get a character's current activity based on time of day
 */
export async function getCurrentActivity(
  characterId: string,
  timeOfDay: TimeOfDay,
  currentHour: number = 12
): Promise<CurrentActivity | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return null;
  }

  const customData = (character as any).customData as Record<string, any> | undefined;
  const routineData = customData?.routine as RoutineData | undefined;

  if (!routineData) {
    return null;
  }

  // Get the appropriate schedule (day or night)
  const schedule = timeOfDay === 'day' ? routineData.routine.day : routineData.routine.night;

  // Find the time block that matches current hour
  const currentBlock = schedule.find(block => 
    currentHour >= block.startHour && currentHour < block.endHour
  );

  if (!currentBlock) {
    return null;
  }

  return {
    characterId,
    characterName: `${character.firstName} ${character.lastName}`,
    timeOfDay,
    currentHour,
    location: currentBlock.location,
    locationType: currentBlock.locationType,
    occasion: currentBlock.occasion,
    timeBlock: currentBlock
  };
}

/**
 * Update a character's whereabouts (creates location history entry)
 */
export async function updateWhereabouts(
  worldId: string,
  characterId: string,
  location: string,
  locationType: LocationType,
  occasion: ActivityOccasion,
  timestep: number,
  timeOfDay: TimeOfDay
): Promise<void> {
  // Create whereabouts entry - note: storage layer doesn't have whereabouts methods yet
  // For now, store in character's customData as recent whereabouts
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const whereaboutsEntry = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    worldId,
    characterId,
    location,
    locationType,
    occasion,
    timestep,
    timeOfDay,
    date: new Date(),
    createdAt: new Date()
  };

  const customData = (character as any).customData as Record<string, any> | undefined;
  const whereaboutsHistory = (customData?.whereaboutsHistory as any[]) || [];
  
  // Keep last 100 entries
  whereaboutsHistory.push(whereaboutsEntry);
  if (whereaboutsHistory.length > 100) {
    whereaboutsHistory.shift();
  }

  await storage.updateCharacter(characterId, {
    ...((customData || true) && {
      customData: {
        ...(customData || {}),
        whereaboutsHistory,
        currentWhereabouts: whereaboutsEntry
      }
    })
  } as any);

  console.log(`✓ Updated whereabouts for ${character.firstName} ${character.lastName}: ${location}`);
}

/**
 * Get all characters currently at a specific location
 */
export async function getCharactersAtLocation(
  worldId: string,
  location: string,
  timeOfDay?: TimeOfDay,
  currentHour?: number
): Promise<Array<{ character: Character; activity: CurrentActivity }>> {
  const allCharacters = await storage.getCharactersByWorld(worldId);
  const charactersAtLocation: Array<{ character: Character; activity: CurrentActivity }> = [];

  for (const character of allCharacters) {
    // Check current whereabouts first
    const customData = (character as any).customData as Record<string, any> | undefined;
    const currentWhereabouts = customData?.currentWhereabouts as any;

    if (currentWhereabouts && currentWhereabouts.location === location) {
      // Get their activity if we have time info
      let activity: CurrentActivity | null = null;
      if (timeOfDay && currentHour !== undefined) {
        activity = await getCurrentActivity(character.id, timeOfDay, currentHour);
      }

      if (activity || !timeOfDay) {
        charactersAtLocation.push({
          character,
          activity: activity || {
            characterId: character.id,
            characterName: `${character.firstName} ${character.lastName}`,
            timeOfDay: currentWhereabouts.timeOfDay,
            currentHour: 0,
            location: currentWhereabouts.location,
            locationType: currentWhereabouts.locationType,
            occasion: currentWhereabouts.occasion,
            timeBlock: {
              startHour: 0,
              endHour: 24,
              location: currentWhereabouts.location,
              locationType: currentWhereabouts.locationType,
              occasion: currentWhereabouts.occasion
            }
          }
        });
      }
    }
  }

  return charactersAtLocation;
}

/**
 * Generate a default routine based on occupation and personality
 */
export async function generateDefaultRoutine(
  characterId: string
): Promise<DailyRoutine> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const customData = (character as any).customData as Record<string, any> | undefined;
  const currentOccupation = customData?.currentOccupation as any;
  const vocation: OccupationVocation | undefined = currentOccupation?.vocation;
  const shift = currentOccupation?.shift || 'day';

  // Default locations
  const homeLocation = character.currentOccupationId || character.currentLocation;
  const workLocation = currentOccupation?.businessId || 'work';

  // Generate routine based on whether they have a job
  if (vocation && workLocation) {
    if (shift === 'day') {
      return generateDayShiftRoutine(homeLocation, workLocation, vocation);
    } else {
      return generateNightShiftRoutine(homeLocation, workLocation, vocation);
    }
  } else {
    // Unemployed or retired routine
    return generateUnemployedRoutine(homeLocation);
  }
}

/**
 * Generate a day shift work routine
 */
function generateDayShiftRoutine(
  homeLocation: string,
  workLocation: string,
  vocation: OccupationVocation
): DailyRoutine {
  // Typical 9-5 job with variations
  const workStart = vocation === 'Doctor' || vocation === 'Nurse' ? 7 : 9;
  const workEnd = vocation === 'Doctor' || vocation === 'Nurse' ? 19 : 17;

  return {
    day: [
      {
        startHour: 0,
        endHour: 7,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      },
      {
        startHour: 7,
        endHour: 8,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 8,
        endHour: workStart,
        location: 'commuting',
        locationType: 'leisure',
        occasion: 'commuting'
      },
      {
        startHour: workStart,
        endHour: workEnd,
        location: workLocation,
        locationType: 'work',
        occasion: 'working'
      },
      {
        startHour: workEnd,
        endHour: workEnd + 1,
        location: 'commuting',
        locationType: 'leisure',
        occasion: 'commuting'
      },
      {
        startHour: workEnd + 1,
        endHour: 19,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 19,
        endHour: 22,
        location: homeLocation,
        locationType: 'home',
        occasion: 'relaxing'
      },
      {
        startHour: 22,
        endHour: 24,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      }
    ],
    night: [
      {
        startHour: 0,
        endHour: 24,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      }
    ]
  };
}

/**
 * Generate a night shift work routine
 */
function generateNightShiftRoutine(
  homeLocation: string,
  workLocation: string,
  vocation: OccupationVocation
): DailyRoutine {
  return {
    day: [
      {
        startHour: 0,
        endHour: 12,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      },
      {
        startHour: 12,
        endHour: 14,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 14,
        endHour: 20,
        location: homeLocation,
        locationType: 'home',
        occasion: 'relaxing'
      },
      {
        startHour: 20,
        endHour: 22,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 22,
        endHour: 23,
        location: 'commuting',
        locationType: 'leisure',
        occasion: 'commuting'
      },
      {
        startHour: 23,
        endHour: 24,
        location: workLocation,
        locationType: 'work',
        occasion: 'working'
      }
    ],
    night: [
      {
        startHour: 0,
        endHour: 7,
        location: workLocation,
        locationType: 'work',
        occasion: 'working'
      },
      {
        startHour: 7,
        endHour: 8,
        location: 'commuting',
        locationType: 'leisure',
        occasion: 'commuting'
      },
      {
        startHour: 8,
        endHour: 24,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      }
    ]
  };
}

/**
 * Generate an unemployed/retired routine
 */
function generateUnemployedRoutine(homeLocation: string): DailyRoutine {
  return {
    day: [
      {
        startHour: 0,
        endHour: 8,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      },
      {
        startHour: 8,
        endHour: 9,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 9,
        endHour: 12,
        location: homeLocation,
        locationType: 'home',
        occasion: 'relaxing'
      },
      {
        startHour: 12,
        endHour: 13,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 13,
        endHour: 17,
        location: 'around_town',
        locationType: 'leisure',
        occasion: 'socializing'
      },
      {
        startHour: 17,
        endHour: 18,
        location: homeLocation,
        locationType: 'home',
        occasion: 'eating'
      },
      {
        startHour: 18,
        endHour: 22,
        location: homeLocation,
        locationType: 'home',
        occasion: 'relaxing'
      },
      {
        startHour: 22,
        endHour: 24,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      }
    ],
    night: [
      {
        startHour: 0,
        endHour: 24,
        location: homeLocation,
        locationType: 'home',
        occasion: 'sleeping'
      }
    ]
  };
}

/**
 * Get a character's routine
 */
export async function getRoutine(characterId: string): Promise<RoutineData | null> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return null;
  }

  const customData = (character as any).customData as Record<string, any> | undefined;
  return (customData?.routine as RoutineData) || null;
}

/**
 * Update all characters' whereabouts for a given timestep
 */
export async function updateAllWhereabouts(
  worldId: string,
  timestep: number,
  timeOfDay: TimeOfDay,
  currentHour: number
): Promise<number> {
  const characters = await storage.getCharactersByWorld(worldId);
  let updatedCount = 0;

  for (const character of characters) {
    const activity = await getCurrentActivity(character.id, timeOfDay, currentHour);
    
    if (activity) {
      await updateWhereabouts(
        worldId,
        character.id,
        activity.location,
        activity.locationType,
        activity.occasion,
        timestep,
        timeOfDay
      );
      updatedCount++;
    }
  }

  return updatedCount;
}
