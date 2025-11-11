/**
 * Conversation System (Phase 7)
 * 
 * Prolog-First Design:
 * - TypeScript generates dialogue and manages conversation state
 * - Prolog determines when conversations occur via rules
 * - Enables knowledge propagation through natural dialogue
 * 
 * Based on Talk of the Town's conversation.py
 */

import { storage } from '../../db/storage';
import type { Character } from '@shared/schema';
import { 
  propagateKnowledge, 
  addBelief, 
  getMentalModel 
} from './knowledge-system.js';
import { 
  getRelationshipDetails, 
  getSalience 
} from './social-dynamics-system.js';
import { getCharactersAtLocation } from './routine-system.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ConversationTopicType = 
  | 'gossip' | 'small_talk' | 'business' | 'news' | 'personal' | 'argument';

export type DialogueTone = 'friendly' | 'neutral' | 'unfriendly';

export interface ConversationTopic {
  type: ConversationTopicType;
  subject?: string;
  description: string;
  priority: number;
}

export interface Utterance {
  id: string;
  speaker: string;
  listener: string;
  text: string;
  timestamp: number;
  isLie: boolean;
  tone: DialogueTone;
  knowledgeShared?: {
    subjectId: string;
    facts: string[];
    values: Record<string, any>;
  };
  beliefShared?: {
    subjectId: string;
    quality: string;
    confidence: number;
  };
}

export interface Conversation {
  id: string;
  participants: [string, string];
  location: string;
  startTimestep: number;
  endTimestep?: number;
  topic: ConversationTopic;
  utterances: Utterance[];
  knowledgeTransfers: Array<{
    from: string;
    to: string;
    subjectId: string;
    factsShared: string[];
    timestamp: number;
  }>;
  liesDetected: string[];
  eavesdroppers: string[];
}

// Store active conversations in memory
const activeConversations = new Map<string, Conversation>();

// ============================================================================
// DIALOGUE TEMPLATES
// ============================================================================

const TEMPLATES = {
  greeting: {
    friendly: ["Hello {name}! Good to see you!", "Hey {name}, how are you?"],
    neutral: ["Hello, {name}.", "Good day."],
    unfriendly: ["What do you want?", "{name}."]
  },
  gossip: {
    positive: ["I heard {subject} is quite {quality}.", "{subject} has been very {quality} lately."],
    negative: ["Between you and me, {subject} is rather {quality}.", "Have you noticed {subject} acting {quality}?"]
  },
  small_talk: ["Nice weather we're having.", "How has your day been?", "Busy lately?"],
  farewell: {
    friendly: ["It was great talking to you!", "See you soon!"],
    neutral: ["Goodbye.", "Farewell."],
    unfriendly: ["Right. Goodbye.", "I have to go."]
  }
};

const CONFIG = {
  baseConversationLength: 5,
  baseLyingProbability: 0.1,
  baseLieDetectionRate: 0.2,
  baseEavesdropRate: 0.2
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

export async function startConversation(
  initiatorId: string,
  targetId: string,
  location: string,
  currentTimestep: number
): Promise<Conversation> {
  const initiator = await storage.getCharacter(initiatorId);
  const target = await storage.getCharacter(targetId);
  
  if (!initiator || !target) {
    throw new Error('Character not found');
  }
  
  const topic = await selectTopic(initiator, target, currentTimestep);
  
  const conversation: Conversation = {
    id: `conv_${Date.now()}`,
    participants: [initiatorId, targetId],
    location,
    startTimestep: currentTimestep,
    topic,
    utterances: [],
    knowledgeTransfers: [],
    liesDetected: [],
    eavesdroppers: []
  };
  
  activeConversations.set(conversation.id, conversation);
  
  const relationship = await getRelationshipDetails(initiatorId, targetId, 1900);
  const greeting = generateGreeting(initiator, target, relationship.charge, currentTimestep);
  conversation.utterances.push(greeting);
  
  return conversation;
}

export async function continueConversation(
  conversationId: string,
  currentTimestep: number
): Promise<Utterance | null> {
  const conversation = activeConversations.get(conversationId);
  if (!conversation) return null;
  
  const lastUtterance = conversation.utterances[conversation.utterances.length - 1];
  const speakerId = lastUtterance.listener;
  const listenerId = lastUtterance.speaker;
  
  const speaker = await storage.getCharacter(speakerId);
  const listener = await storage.getCharacter(listenerId);
  
  if (!speaker || !listener) return null;
  
  const relationship = await getRelationshipDetails(speakerId, listenerId, 1900);
  const utterance = await generateTopicUtterance(
    speaker,
    listener,
    conversation.topic,
    relationship.charge,
    currentTimestep
  );
  
  conversation.utterances.push(utterance);
  
  if (utterance.knowledgeShared || utterance.beliefShared) {
    await processUtteranceEffects(utterance, currentTimestep);
  }
  
  if (utterance.isLie) {
    const detected = await detectLie(listener, speaker, utterance);
    if (detected) {
      conversation.liesDetected.push(utterance.id);
    }
  }
  
  return utterance;
}

export async function endConversation(
  conversationId: string,
  currentTimestep: number
): Promise<Conversation | null> {
  const conversation = activeConversations.get(conversationId);
  if (!conversation) return null;
  
  conversation.endTimestep = currentTimestep;
  
  const [char1Id, char2Id] = conversation.participants;
  const char1 = await storage.getCharacter(char1Id);
  const char2 = await storage.getCharacter(char2Id);
  
  if (char1 && char2) {
    const relationship = await getRelationshipDetails(char1Id, char2Id, 1900);
    const farewell = generateFarewell(char1, char2, relationship.charge, currentTimestep);
    conversation.utterances.push(farewell);
  }
  
  activeConversations.delete(conversationId);
  return conversation;
}

export async function simulateConversation(
  char1Id: string,
  char2Id: string,
  location: string,
  duration: number = 5,
  currentTimestep: number
): Promise<Conversation> {
  const conversation = await startConversation(char1Id, char2Id, location, currentTimestep);
  
  for (let i = 0; i < duration; i++) {
    await continueConversation(conversation.id, currentTimestep + i);
  }
  
  await checkForEavesdroppers(conversation, location, currentTimestep);
  await endConversation(conversation.id, currentTimestep + duration);
  
  return conversation;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  return activeConversations.get(conversationId) || null;
}

export async function getCharacterConversationHistory(characterId: string): Promise<any> {
  const character = await storage.getCharacter(characterId);
  if (!character) return null;
  
  return (character as any).conversationState || {
    conversationHistory: {},
    knownLiars: {}
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function selectTopic(
  speaker: Character,
  listener: Character,
  currentTimestep: number
): Promise<ConversationTopic> {
  const salience = ((speaker as any).socialAttributes?.salience) || {};
  const salientPeople = Object.entries(salience)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);
  
  for (const [personId, salienceValue] of salientPeople) {
    if ((salienceValue as number) > 0.5) {
      const speakerKnows = await getMentalModel(speaker.id, personId, false);
      if (speakerKnows) {
        const person = await storage.getCharacter(personId);
        return {
          type: 'gossip',
          subject: personId,
          description: `Gossip about ${person?.firstName || 'someone'}`,
          priority: 3
        };
      }
    }
  }
  
  return {
    type: 'small_talk',
    description: 'General pleasantries',
    priority: 4
  };
}

function generateGreeting(
  speaker: Character,
  listener: Character,
  charge: number,
  timestamp: number
): Utterance {
  const tone: DialogueTone = charge > 5 ? 'friendly' : charge < -5 ? 'unfriendly' : 'neutral';
  const templates = TEMPLATES.greeting[tone];
  const text = selectRandom(templates).replace('{name}', listener.firstName);
  
  return {
    id: `utt_${Date.now()}`,
    speaker: speaker.id,
    listener: listener.id,
    text,
    timestamp,
    isLie: false,
    tone
  };
}

function generateFarewell(
  speaker: Character,
  listener: Character,
  charge: number,
  timestamp: number
): Utterance {
  const tone: DialogueTone = charge > 5 ? 'friendly' : charge < -5 ? 'unfriendly' : 'neutral';
  const templates = TEMPLATES.farewell[tone];
  const text = selectRandom(templates);
  
  return {
    id: `utt_${Date.now()}`,
    speaker: speaker.id,
    listener: listener.id,
    text,
    timestamp,
    isLie: false,
    tone
  };
}

async function generateTopicUtterance(
  speaker: Character,
  listener: Character,
  topic: ConversationTopic,
  charge: number,
  timestamp: number
): Promise<Utterance> {
  const tone: DialogueTone = charge > 5 ? 'friendly' : charge < -5 ? 'unfriendly' : 'neutral';
  
  let text = '';
  let isLie = false;
  let knowledgeShared: any;
  let beliefShared: any;
  
  if (topic.type === 'gossip' && topic.subject) {
    const speakerKnowledge = await getMentalModel(speaker.id, topic.subject, false);
    const subject = await storage.getCharacter(topic.subject);
    
    if (speakerKnowledge && subject) {
      const beliefs = speakerKnowledge.beliefs;
      if (beliefs && Object.keys(beliefs).length > 0) {
        const quality = Object.keys(beliefs)[0];
        const belief = beliefs[quality];
        
        isLie = Math.random() < CONFIG.baseLyingProbability;
        
        const templates = belief.confidence > 0.6 
          ? TEMPLATES.gossip.positive 
          : TEMPLATES.gossip.negative;
        
        text = selectRandom(templates)
          .replace('{subject}', subject.firstName)
          .replace('{quality}', quality);
        
        beliefShared = {
          subjectId: topic.subject,
          quality,
          confidence: isLie ? 1.0 - belief.confidence : belief.confidence
        };
      }
    }
  } else {
    text = selectRandom(TEMPLATES.small_talk);
  }
  
  return {
    id: `utt_${Date.now()}`,
    speaker: speaker.id,
    listener: listener.id,
    text,
    timestamp,
    isLie,
    tone,
    knowledgeShared,
    beliefShared
  };
}

async function processUtteranceEffects(
  utterance: Utterance,
  timestamp: number
): Promise<void> {
  if (utterance.knowledgeShared) {
    await propagateKnowledge(
      utterance.speaker,
      utterance.listener,
      utterance.knowledgeShared.subjectId,
      timestamp
    );
  }
  
  if (utterance.beliefShared) {
    const { subjectId, quality, confidence } = utterance.beliefShared;
    await addBelief(utterance.listener, subjectId, quality, confidence, {
      type: 'hearsay',
      strength: 0.4,
      timestamp,
      sourceId: utterance.speaker
    }, timestamp);
  }
}

async function detectLie(
  listener: Character,
  speaker: Character,
  utterance: Utterance
): Promise<boolean> {
  const listenerTraits = (listener.personality as any) || {};
  let probability = CONFIG.baseLieDetectionRate;
  
  if (listenerTraits.openness > 0.7) {
    probability += 0.3;
  }
  
  return Math.random() < probability;
}

async function checkForEavesdroppers(
  conversation: Conversation,
  location: string,
  timestamp: number
): Promise<void> {
  const worldId = 'default';
  const charsAtLocation = await getCharactersAtLocation(worldId, location, 'day', 12);
  
  const potentialEavesdroppers = charsAtLocation.filter(
    c => !conversation.participants.includes(c.character.id)
  );
  
  for (const entry of potentialEavesdroppers) {
    if (Math.random() < CONFIG.baseEavesdropRate) {
      conversation.eavesdroppers.push(entry.character.id);
      
      for (const utterance of conversation.utterances) {
        if (utterance.beliefShared) {
          const { subjectId, quality, confidence } = utterance.beliefShared;
          await addBelief(entry.character.id, subjectId, quality, confidence * 0.2, {
            type: 'rumor',
            strength: 0.2,
            timestamp,
            sourceId: utterance.speaker
          }, timestamp);
        }
      }
    }
  }
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
