/**
 * Town Events & Community System (Phase 10)
 * 
 * Prolog-First Design:
 * - TypeScript manages event scheduling and community state
 * - Prolog determines event triggers and participation
 * - Integrates all previous phases into community-level simulation
 * 
 * THE FINAL PHASE - Community dynamics and town-wide events
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { updateRelationship } from './social-dynamics-system.js';
import { initializeMentalModel } from './knowledge-system.js';
import { simulateConversation } from './conversation-system.js';
import { die } from './lifecycle-system.js';
import { addMoney, subtractMoney } from './economics-system.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EventType = 
  | 'festival'
  | 'market'
  | 'wedding'
  | 'funeral'
  | 'town_meeting'
  | 'disaster'
  | 'celebration'
  | 'emergency';

export type FestivalType = 'harvest' | 'midsummer' | 'new_year' | 'founders_day' | 'seasonal';
export type DisasterType = 'fire' | 'flood' | 'plague' | 'famine' | 'attack' | 'storm';
export type DisasterSeverity = 'minor' | 'moderate' | 'severe' | 'catastrophic';

export interface TownEvent {
  id: string;
  worldId: string;
  type: EventType;
  name: string;
  description: string;
  scheduledTimestep: number;
  startTimestep?: number;
  endTimestep?: number;
  duration: number;
  location: string;
  organizers: string[];
  attendees: string[];
  invited: string[];
  moraleImpact: number;
  economicImpact?: number;
  casualties?: string[];
  outcomes: string[];
  decisions?: Record<string, any>;
}

export interface Festival extends TownEvent {
  festivalType: FestivalType;
  activities: Array<{
    name: string;
    participants: string[];
    startTime: number;
    duration: number;
  }>;
  foodServed: string[];
  entertainment: string[];
}

export interface Disaster extends TownEvent {
  disasterType: DisasterType;
  severity: DisasterSeverity;
  buildingsDamaged: Array<{
    buildingId: string;
    damageLevel: number;
  }>;
  casualties: string[];
  injured: string[];
  economicLoss: number;
  responders: string[];
  helpProvided: Array<{
    helperId: string;
    victimId: string;
    aid: string;
  }>;
  recoveryTime: number;
}

export interface CommunityMeeting extends TownEvent {
  purpose: string;
  agenda: string[];
  speakers: string[];
  votingTopics: Array<{
    topic: string;
    options: string[];
    votes: Record<string, string>;
    outcome: string;
  }>;
  decisions: Array<{
    topic: string;
    decision: string;
    supporters: string[];
    opposers: string[];
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Festival parameters
  festivalBaseDuration: 10,  // timesteps
  festivalAttendanceRate: 0.6,  // 60% of population
  festivalMoraleBoost: 10,
  festivalCostPerPerson: 5,
  
  // Market parameters
  marketDuration: 8,
  marketVendorRate: 0.3,  // 30% of businesses
  
  // Disaster parameters
  disasterMinorCasualties: 0,
  disasterModerateCasualties: 2,
  disasterSevereCasualties: 5,
  disasterCatastrophicCasualties: 15,
  
  disasterMoraleImpact: {
    minor: -5,
    moderate: -15,
    severe: -30,
    catastrophic: -50
  },
  
  // Event probabilities
  randomFireChance: 0.005,  // 0.5% per timestep
  randomStormChance: 0.01,  // 1% per timestep
  
  // Community morale
  baseMorale: 50,
  maxMorale: 100,
  minMorale: 0,
  moraleDecayRate: 0.1  // per timestep
};

// In-memory storage
const events = new Map<string, TownEvent>();
const communityMorale = new Map<string, number>();

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

export async function scheduleEvent(
  worldId: string,
  type: EventType,
  name: string,
  location: string,
  scheduledTimestep: number,
  duration: number,
  organizers: string[] = []
): Promise<TownEvent> {
  const event: TownEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    worldId,
    type,
    name,
    description: `${type} event at ${location}`,
    scheduledTimestep,
    duration,
    location,
    organizers,
    attendees: [],
    invited: [],
    moraleImpact: 0,
    outcomes: []
  };
  
  events.set(event.id, event);
  return event;
}

export async function startEvent(
  eventId: string,
  currentTimestep: number
): Promise<TownEvent> {
  const event = events.get(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  event.startTimestep = currentTimestep;
  events.set(eventId, event);
  
  return event;
}

export async function endEvent(
  eventId: string,
  currentTimestep: number
): Promise<TownEvent> {
  const event = events.get(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  event.endTimestep = currentTimestep;
  
  // Process event effects based on type
  await processEventEffects(event);
  
  events.set(eventId, event);
  return event;
}

export async function addAttendee(eventId: string, characterId: string): Promise<void> {
  const event = events.get(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  if (!event.attendees.includes(characterId)) {
    event.attendees.push(characterId);
    events.set(eventId, event);
  }
}

export async function removeAttendee(eventId: string, characterId: string): Promise<void> {
  const event = events.get(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  event.attendees = event.attendees.filter(id => id !== characterId);
  events.set(eventId, event);
}

export function getEvent(eventId: string): TownEvent | undefined {
  return events.get(eventId);
}

export async function getWorldEvents(worldId: string): Promise<TownEvent[]> {
  return Array.from(events.values()).filter(e => e.worldId === worldId);
}

export async function getUpcomingEvents(worldId: string, currentTimestep: number): Promise<TownEvent[]> {
  return Array.from(events.values()).filter(
    e => e.worldId === worldId && 
         e.scheduledTimestep > currentTimestep && 
         !e.startTimestep
  );
}

// ============================================================================
// FESTIVALS
// ============================================================================

export async function scheduleFestival(
  worldId: string,
  festivalType: FestivalType,
  location: string,
  scheduledTimestep: number
): Promise<Festival> {
  const baseEvent = await scheduleEvent(
    worldId,
    'festival',
    `${festivalType} Festival`,
    location,
    scheduledTimestep,
    CONFIG.festivalBaseDuration
  );
  
  const festival: Festival = {
    ...baseEvent,
    festivalType,
    activities: [],
    foodServed: ['bread', 'ale', 'roasted_meat'],
    entertainment: ['music', 'dancing', 'games']
  };
  
  events.set(festival.id, festival as TownEvent);
  return festival;
}

async function processFestivalEffects(festival: Festival): Promise<void> {
  // Morale boost
  await adjustCommunityMorale(festival.worldId, CONFIG.festivalMoraleBoost);
  
  // Relationship bonding for all attendees
  for (let i = 0; i < festival.attendees.length; i++) {
    for (let j = i + 1; j < festival.attendees.length; j++) {
      const char1 = festival.attendees[i];
      const char2 = festival.attendees[j];
      
      // Small relationship boost
      await updateRelationship(char1, char2, 1, 1900);
      
      // 10% chance to form new connection
      if (Math.random() < 0.1) {
        try {
          await initializeMentalModel(char1, char2, ['name'], 'stranger', festival.startTimestep || 0);
        } catch (e) {
          // Already know each other
        }
      }
    }
  }
  
  // Economic cost
  for (const attendee of festival.attendees) {
    try {
      await subtractMoney(attendee, CONFIG.festivalCostPerPerson, 'Festival participation', festival.endTimestep || 0);
    } catch (e) {
      // Not enough money
    }
  }
  
  festival.moraleImpact = CONFIG.festivalMoraleBoost;
  festival.outcomes.push(`${festival.attendees.length} people attended`);
  festival.outcomes.push(`Community morale increased by ${CONFIG.festivalMoraleBoost}`);
}

// ============================================================================
// MARKETS
// ============================================================================

export async function scheduleMarket(
  worldId: string,
  location: string,
  scheduledTimestep: number
): Promise<TownEvent> {
  return await scheduleEvent(
    worldId,
    'market',
    'Market Day',
    location,
    scheduledTimestep,
    CONFIG.marketDuration
  );
}

// ============================================================================
// WEDDINGS & FUNERALS
// ============================================================================

export async function scheduleWedding(
  worldId: string,
  spouse1Id: string,
  spouse2Id: string,
  location: string,
  scheduledTimestep: number
): Promise<TownEvent> {
  const spouse1 = await storage.getCharacter(spouse1Id);
  const spouse2 = await storage.getCharacter(spouse2Id);
  
  const event = await scheduleEvent(
    worldId,
    'wedding',
    `Wedding of ${spouse1?.firstName} and ${spouse2?.firstName}`,
    location,
    scheduledTimestep,
    5,
    [spouse1Id, spouse2Id]
  );
  
  event.moraleImpact = 5;  // Weddings boost morale
  return event;
}

export async function scheduleFuneral(
  worldId: string,
  deceasedId: string,
  location: string,
  scheduledTimestep: number
): Promise<TownEvent> {
  const deceased = await storage.getCharacter(deceasedId);
  
  const event = await scheduleEvent(
    worldId,
    'funeral',
    `Funeral of ${deceased?.firstName} ${deceased?.lastName}`,
    location,
    scheduledTimestep,
    3
  );
  
  event.moraleImpact = -5;  // Funerals reduce morale
  return event;
}

// ============================================================================
// DISASTERS
// ============================================================================

export async function triggerDisaster(
  worldId: string,
  disasterType: DisasterType,
  severity: DisasterSeverity,
  location: string,
  currentTimestep: number
): Promise<Disaster> {
  const baseEvent = await scheduleEvent(
    worldId,
    'disaster',
    `${disasterType} (${severity})`,
    location,
    currentTimestep,
    1
  );
  
  await startEvent(baseEvent.id, currentTimestep);
  
  const disaster: Disaster = {
    ...baseEvent,
    disasterType,
    severity,
    buildingsDamaged: [],
    casualties: [],
    injured: [],
    economicLoss: 0,
    responders: [],
    helpProvided: [],
    recoveryTime: severity === 'catastrophic' ? 100 : severity === 'severe' ? 50 : 20
  };
  
  // Calculate casualties based on severity
  const casualtyCount = CONFIG[`disaster${severity.charAt(0).toUpperCase() + severity.slice(1)}Casualties` as keyof typeof CONFIG] as number;
  
  // Select random characters as casualties
  const characters = await storage.getCharactersByWorld(worldId);
  const shuffled = characters.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(casualtyCount, shuffled.length); i++) {
    disaster.casualties.push(shuffled[i].id);
    // Actually kill the character
    await die(shuffled[i].id, 'disaster', location, currentTimestep);
  }
  
  // Morale impact
  disaster.moraleImpact = CONFIG.disasterMoraleImpact[severity];
  await adjustCommunityMorale(worldId, disaster.moraleImpact);
  
  // Economic loss
  disaster.economicLoss = severity === 'catastrophic' ? 5000 : 
                          severity === 'severe' ? 2000 : 
                          severity === 'moderate' ? 500 : 100;
  
  events.set(disaster.id, disaster as TownEvent);
  
  await endEvent(disaster.id, currentTimestep + 1);
  
  return disaster;
}

async function processDisasterEffects(disaster: Disaster): Promise<void> {
  disaster.outcomes.push(`${disaster.casualties.length} casualties`);
  disaster.outcomes.push(`Economic loss: ${disaster.economicLoss}`);
  disaster.outcomes.push(`Community morale decreased by ${Math.abs(disaster.moraleImpact)}`);
  
  // Relationship boost for helpers
  for (const help of disaster.helpProvided) {
    await updateRelationship(help.helperId, help.victimId, 5, 1900);
  }
}

// ============================================================================
// COMMUNITY MEETINGS
// ============================================================================

export async function scheduleCommunityMeeting(
  worldId: string,
  purpose: string,
  location: string,
  scheduledTimestep: number
): Promise<CommunityMeeting> {
  const baseEvent = await scheduleEvent(
    worldId,
    'town_meeting',
    'Community Meeting',
    location,
    scheduledTimestep,
    5
  );
  
  const meeting: CommunityMeeting = {
    ...baseEvent,
    purpose,
    agenda: [],
    speakers: [],
    votingTopics: [],
    decisions: []
  };
  
  events.set(meeting.id, meeting as TownEvent);
  return meeting;
}

// ============================================================================
// COMMUNITY MORALE
// ============================================================================

export function getCommunityMorale(worldId: string): number {
  return communityMorale.get(worldId) || CONFIG.baseMorale;
}

export async function adjustCommunityMorale(worldId: string, amount: number): Promise<number> {
  const current = getCommunityMorale(worldId);
  const newMorale = Math.max(CONFIG.minMorale, Math.min(CONFIG.maxMorale, current + amount));
  
  communityMorale.set(worldId, newMorale);
  return newMorale;
}

export async function decayMorale(worldId: string): Promise<number> {
  return await adjustCommunityMorale(worldId, -CONFIG.moraleDecayRate);
}

// ============================================================================
// EVENT EFFECTS PROCESSING
// ============================================================================

async function processEventEffects(event: TownEvent): Promise<void> {
  switch (event.type) {
    case 'festival':
      await processFestivalEffects(event as Festival);
      break;
    case 'disaster':
      await processDisasterEffects(event as Disaster);
      break;
    case 'wedding':
      await adjustCommunityMorale(event.worldId, event.moraleImpact);
      event.outcomes.push('Community celebrated the union');
      break;
    case 'funeral':
      await adjustCommunityMorale(event.worldId, event.moraleImpact);
      event.outcomes.push('Community mourned together');
      break;
    case 'market':
      event.outcomes.push(`${event.attendees.length} people visited the market`);
      break;
    case 'town_meeting':
      event.outcomes.push('Community decisions were made');
      break;
  }
}

// ============================================================================
// RANDOM EVENT GENERATION
// ============================================================================

export async function checkRandomEvents(worldId: string, currentTimestep: number): Promise<TownEvent[]> {
  const triggeredEvents: TownEvent[] = [];
  
  // Fire
  if (Math.random() < CONFIG.randomFireChance) {
    const disaster = await triggerDisaster(worldId, 'fire', 'moderate', 'town_center', currentTimestep);
    triggeredEvents.push(disaster as TownEvent);
  }
  
  // Storm
  if (Math.random() < CONFIG.randomStormChance) {
    const disaster = await triggerDisaster(worldId, 'storm', 'minor', 'town_center', currentTimestep);
    triggeredEvents.push(disaster as TownEvent);
  }
  
  return triggeredEvents;
}

// ============================================================================
// EVENT HISTORY
// ============================================================================

export async function getEventHistory(
  worldId: string,
  limit: number = 50
): Promise<TownEvent[]> {
  const worldEvents = await getWorldEvents(worldId);
  
  return worldEvents
    .filter(e => e.endTimestep !== undefined)
    .sort((a, b) => (b.endTimestep || 0) - (a.endTimestep || 0))
    .slice(0, limit);
}

// ============================================================================
// AUTO-ATTENDANCE
// ============================================================================

export async function populateEventAttendance(
  event: TownEvent,
  attendanceRate: number = 0.6
): Promise<void> {
  const characters = await storage.getCharactersByWorld(event.worldId);
  
  for (const character of characters) {
    if (Math.random() < attendanceRate) {
      await addAttendee(event.id, character.id);
    }
  }
}
