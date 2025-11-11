/**
 * Event System Extension for Insimul
 * Implements Talk of the Town life events and narrative generation
 */

import { storage } from '../../db/storage';
import type { Character, EventType } from '@shared/schema';
import { addImpulse, type ImpulseType } from '../kismet/impulse-system.js';
import { setRelationship } from './relationship-utils.js';

export interface EventData {
  id: string;
  type: EventType;
  timestep: number;
  year: number;
  season?: string;
  characterId: string;
  characterName: string;
  
  // Event-specific details
  targetCharacterId?: string;
  targetCharacterName?: string;
  businessId?: string;
  businessName?: string;
  residenceId?: string;
  location?: string;
  
  // Narrative
  title: string;
  description: string;
  narrativeText: string;
  
  // Effects
  impulseEffects?: Array<{ characterId: string; impulseType: ImpulseType; strength: number }>;
  relationshipEffects?: Array<{ fromId: string; toId: string; type: string; strength: number }>;
  
  // Metadata
  tags?: string[];
  consequences?: string[];
}

export interface EventGenerationOptions {
  worldId: string;
  currentYear: number;
  currentTimestep: number;
  season?: string;
  
  // Filters
  characterId?: string;
  eventType?: EventType;
  
  // Control
  autoGenerateNarrative?: boolean;
}

/**
 * Generate a life event for a character
 */
export async function generateEvent(
  options: EventGenerationOptions,
  customData?: Partial<EventData>
): Promise<EventData> {
  const { worldId, currentYear, currentTimestep, season = 'spring' } = options;
  
  // Get character if specified
  let character: Character | undefined;
  if (options.characterId) {
    character = await storage.getCharacter(options.characterId);
    if (!character) {
      throw new Error(`Character ${options.characterId} not found`);
    }
  }
  
  // Generate event ID
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  // Build base event
  const event: EventData = {
    id: eventId,
    type: customData?.type || options.eventType || 'birth',
    timestep: currentTimestep,
    year: currentYear,
    season,
    characterId: options.characterId || '',
    characterName: character ? `${character.firstName} ${character.lastName}` : '',
    title: customData?.title || '',
    description: customData?.description || '',
    narrativeText: customData?.narrativeText || '',
    ...customData
  };
  
  // Auto-generate narrative if requested
  if (options.autoGenerateNarrative && !event.narrativeText) {
    event.narrativeText = generateEventNarrative(event);
    if (!event.title) {
      event.title = generateEventTitle(event);
    }
    if (!event.description) {
      event.description = generateEventDescription(event);
    }
  }
  
  // Store event in character's history
  if (character) {
    const customData = (character as any).customData as Record<string, any> | undefined;
    const eventHistory = (customData?.events as EventData[]) || [];
    eventHistory.push(event);
    
    await storage.updateCharacter(character.id, {
      ...(customData && {
        customData: {
          ...customData,
          events: eventHistory
        }
      })
    } as any);
  }
  
  // Store in world timeline
  const world = await storage.getWorld(worldId);
  if (world) {
    const worldData = (world as any).customData as Record<string, any> | undefined;
    const timeline = (worldData?.timeline as EventData[]) || [];
    timeline.push(event);
    
    await storage.updateWorld(worldId, {
      ...(worldData && {
        customData: {
          ...worldData,
          timeline
        }
      })
    } as any);
  }
  
  // Apply impulse effects
  if (event.impulseEffects) {
    for (const effect of event.impulseEffects) {
      try {
        await addImpulse(effect.characterId, effect.impulseType, effect.strength);
      } catch (error) {
        console.error(`Failed to apply impulse effect:`, error);
      }
    }
  }
  
  // Apply relationship effects
  if (event.relationshipEffects) {
    for (const effect of event.relationshipEffects) {
      try {
        await setRelationship(effect.fromId, effect.toId, effect.type, effect.strength);
      } catch (error) {
        console.error(`Failed to apply relationship effect:`, error);
      }
    }
  }
  
  return event;
}

/**
 * Generate narrative text for an event
 */
function generateEventNarrative(event: EventData): string {
  const { type, characterName, targetCharacterName, year, season } = event;
  
  const seasonText = season ? ` in the ${season} of` : '';
  
  switch (type) {
    case 'birth':
      return `${characterName} was born${seasonText} ${year}.`;
    
    case 'death':
      return `${characterName} passed away${seasonText} ${year}.`;
    
    case 'marriage':
      return `${characterName} married ${targetCharacterName}${seasonText} ${year}.`;
    
    case 'divorce':
      return `${characterName} divorced ${targetCharacterName}${seasonText} ${year}.`;
    
    case 'move':
      return `${characterName} moved to a new residence${seasonText} ${year}.`;
    
    case 'departure':
      return `${characterName} departed from the settlement${seasonText} ${year}.`;
    
    case 'hiring':
      return `${characterName} was hired at ${event.businessName || 'a business'}${seasonText} ${year}.`;
    
    case 'retirement':
      return `${characterName} retired from work${seasonText} ${year}.`;
    
    case 'home_purchase':
      return `${characterName} purchased a new home${seasonText} ${year}.`;
    
    case 'business_founding':
      return `${characterName} founded ${event.businessName || 'a new business'}${seasonText} ${year}.`;
    
    case 'business_closure':
      return `${event.businessName || 'A business'} closed its doors${seasonText} ${year}.`;
    
    case 'promotion':
      return `${characterName} was promoted${seasonText} ${year}.`;
    
    case 'graduation':
      return `${characterName} graduated from school${seasonText} ${year}.`;
    
    case 'accident':
      return `${characterName} was involved in an accident${seasonText} ${year}.`;
    
    case 'crime':
      return `A crime involving ${characterName} occurred${seasonText} ${year}.`;
    
    case 'festival':
      return `A festival was held${seasonText} ${year}.`;
    
    case 'election':
      return `${characterName} ran in an election${seasonText} ${year}.`;
    
    default:
      return `An event occurred involving ${characterName}${seasonText} ${year}.`;
  }
}

/**
 * Generate a title for an event
 */
function generateEventTitle(event: EventData): string {
  const { type, characterName, targetCharacterName } = event;
  
  switch (type) {
    case 'birth':
      return `Birth of ${characterName}`;
    case 'death':
      return `Death of ${characterName}`;
    case 'marriage':
      return `${characterName} & ${targetCharacterName} Wed`;
    case 'divorce':
      return `${characterName} & ${targetCharacterName} Divorce`;
    case 'move':
      return `${characterName} Relocates`;
    case 'departure':
      return `${characterName} Departs`;
    case 'hiring':
      return `${characterName} Hired`;
    case 'retirement':
      return `${characterName} Retires`;
    case 'home_purchase':
      return `${characterName} Buys Home`;
    case 'business_founding':
      return `${event.businessName || 'New Business'} Founded`;
    case 'business_closure':
      return `${event.businessName || 'Business'} Closes`;
    case 'promotion':
      return `${characterName} Promoted`;
    case 'graduation':
      return `${characterName} Graduates`;
    case 'accident':
      return `Accident Involving ${characterName}`;
    case 'crime':
      return `Crime Report`;
    case 'festival':
      return `Community Festival`;
    case 'election':
      return `Election Results`;
    default:
      return `Event: ${characterName}`;
  }
}

/**
 * Generate a description for an event
 */
function generateEventDescription(event: EventData): string {
  return event.narrativeText || generateEventNarrative(event);
}

/**
 * Get all events for a character
 */
export async function getCharacterEvents(
  characterId: string,
  filters?: {
    eventType?: EventType;
    startYear?: number;
    endYear?: number;
    limit?: number;
  }
): Promise<EventData[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return [];
  }
  
  const customData = (character as any).customData as Record<string, any> | undefined;
  let events = (customData?.events as EventData[]) || [];
  
  // Apply filters
  if (filters?.eventType) {
    events = events.filter(e => e.type === filters.eventType);
  }
  
  if (filters?.startYear !== undefined) {
    events = events.filter(e => e.year >= filters.startYear!);
  }
  
  if (filters?.endYear !== undefined) {
    events = events.filter(e => e.year <= filters.endYear!);
  }
  
  // Sort by year (most recent first)
  events.sort((a, b) => b.year - a.year);
  
  // Apply limit
  if (filters?.limit) {
    events = events.slice(0, filters.limit);
  }
  
  return events;
}

/**
 * Get all events in a world (timeline)
 */
export async function getWorldEvents(
  worldId: string,
  filters?: {
    eventType?: EventType;
    characterId?: string;
    startYear?: number;
    endYear?: number;
    limit?: number;
  }
): Promise<EventData[]> {
  const world = await storage.getWorld(worldId);
  if (!world) {
    return [];
  }
  
  const worldData = (world as any).customData as Record<string, any> | undefined;
  let events = (worldData?.timeline as EventData[]) || [];
  
  // Apply filters
  if (filters?.eventType) {
    events = events.filter(e => e.type === filters.eventType);
  }
  
  if (filters?.characterId) {
    events = events.filter(e => 
      e.characterId === filters.characterId || 
      e.targetCharacterId === filters.characterId
    );
  }
  
  if (filters?.startYear !== undefined) {
    events = events.filter(e => e.year >= filters.startYear!);
  }
  
  if (filters?.endYear !== undefined) {
    events = events.filter(e => e.year <= filters.endYear!);
  }
  
  // Sort by year (most recent first)
  events.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.timestep - a.timestep;
  });
  
  // Apply limit
  if (filters?.limit) {
    events = events.slice(0, filters.limit);
  }
  
  return events;
}

/**
 * Trigger automatic events based on character/world state
 */
export async function triggerAutomaticEvents(
  worldId: string,
  currentYear: number,
  currentTimestep: number
): Promise<EventData[]> {
  const generatedEvents: EventData[] = [];
  
  // Get all characters in the world
  const characters = await storage.getCharactersByWorld(worldId);
  
  for (const character of characters) {
    const age = currentYear - (character.birthYear || 1880);
    const customData = (character as any).customData as Record<string, any> | undefined;
    const currentOccupation = customData?.currentOccupation;
    
    // Check for retirement (age 65+)
    if (age >= 65 && !character.retired && currentOccupation) {
      const event = await generateEvent({
        worldId,
        currentYear,
        currentTimestep,
        characterId: character.id,
        eventType: 'retirement',
        autoGenerateNarrative: true
      }, {
        businessId: currentOccupation.businessId,
        impulseEffects: [
          { characterId: character.id, impulseType: 'social', strength: -0.3 }
        ]
      });
      generatedEvents.push(event);
      
      // Mark character as retired
      await storage.updateCharacter(character.id, { retired: true });
    }
    
    // Check for graduation (college age, not graduated)
    if (age === 22 && !character.collegeGraduate) {
      const event = await generateEvent({
        worldId,
        currentYear,
        currentTimestep,
        characterId: character.id,
        eventType: 'graduation',
        autoGenerateNarrative: true
      }, {
        impulseEffects: [
          { characterId: character.id, impulseType: 'creative', strength: 0.4 }
        ]
      });
      generatedEvents.push(event);
      
      // Mark as college graduate
      await storage.updateCharacter(character.id, { collegeGraduate: true });
    }
    
    // Check for natural death (age 80+, with probability)
    if (age >= 80 && character.status === 'active') {
      const deathProbability = (age - 80) * 0.05; // 5% per year after 80
      if (Math.random() < deathProbability) {
        const event = await generateEvent({
          worldId,
          currentYear,
          currentTimestep,
          characterId: character.id,
          eventType: 'death',
          autoGenerateNarrative: true
        });
        generatedEvents.push(event);
        
        // Mark character as deceased
        await storage.updateCharacter(character.id, { 
          status: 'deceased',
          isAlive: false
        });
      }
    }
  }
  
  return generatedEvents;
}

/**
 * Create a birth event and character
 */
export async function createBirthEvent(
  worldId: string,
  parentIds: string[],
  currentYear: number,
  currentTimestep: number,
  childData?: Partial<Character>
): Promise<{ event: EventData; character: Character }> {
  // Get parents
  const parents = await Promise.all(
    parentIds.map(id => storage.getCharacter(id))
  );
  const validParents = parents.filter(p => p !== undefined) as Character[];
  
  if (validParents.length === 0) {
    throw new Error('At least one valid parent required for birth event');
  }
  
  // Determine child's last name (from first parent)
  const lastName = validParents[0].lastName;
  const location = validParents[0].currentLocation;
  
  // Create child character
  const child = await storage.createCharacter({
    worldId,
    firstName: childData?.firstName || 'Baby',
    lastName,
    gender: childData?.gender || (Math.random() < 0.5 ? 'male' : 'female'),
    birthYear: currentYear,
    currentLocation: location,
    isAlive: true,
    status: 'active',
    ...childData
  });
  
  // Create birth event
  const event = await generateEvent({
    worldId,
    currentYear,
    currentTimestep,
    characterId: child.id,
    eventType: 'birth',
    autoGenerateNarrative: true
  }, {
    location,
    targetCharacterId: validParents[0].id,
    targetCharacterName: `${validParents[0].firstName} ${validParents[0].lastName}`,
    impulseEffects: validParents.map(p => ({
      characterId: p.id,
      impulseType: 'social' as ImpulseType,
      strength: 0.6
    }))
  });
  
  return { event, character: child };
}

/**
 * Create a marriage event between two characters
 */
export async function createMarriageEvent(
  worldId: string,
  characterId1: string,
  characterId2: string,
  currentYear: number,
  currentTimestep: number
): Promise<EventData> {
  const char1 = await storage.getCharacter(characterId1);
  const char2 = await storage.getCharacter(characterId2);
  
  if (!char1 || !char2) {
    throw new Error('Both characters must exist for marriage event');
  }
  
  // Create marriage event
  const event = await generateEvent({
    worldId,
    currentYear,
    currentTimestep,
    characterId: characterId1,
    eventType: 'marriage',
    autoGenerateNarrative: true
  }, {
    targetCharacterId: characterId2,
    targetCharacterName: `${char2.firstName} ${char2.lastName}`,
    location: char1.currentLocation,
    relationshipEffects: [
      { fromId: characterId1, toId: characterId2, type: 'romantic', strength: 0.9 },
      { fromId: characterId2, toId: characterId1, type: 'romantic', strength: 0.9 }
    ],
    impulseEffects: [
      { characterId: characterId1, impulseType: 'romantic', strength: 0.8 },
      { characterId: characterId2, impulseType: 'romantic', strength: 0.8 }
    ]
  });
  
  return event;
}
