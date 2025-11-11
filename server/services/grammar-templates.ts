/**
 * Pre-built Grammar Templates
 * Ready-to-use Tracery grammar templates for common patterns
 */

export interface GrammarTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  grammar: Record<string, string | string[]>;
  variables?: string[]; // Symbols that users should customize
}

export const grammarTemplates: GrammarTemplate[] = [
  {
    id: 'character_actions',
    name: 'Character Actions',
    description: 'Template for describing character actions and activities',
    category: 'narrative',
    tags: ['action', 'character', 'narrative'],
    grammar: {
      origin: ['#character# #action_verb# #object#'],
      character: ['The warrior', 'The mage', 'The merchant', 'The noble'],
      action_verb: ['strikes', 'observes', 'commands', 'discovers'],
      object: ['the enemy', 'the horizon', 'the troops', 'a secret'],
    },
    variables: ['character', 'action_verb', 'object'],
  },

  {
    id: 'location_descriptions',
    name: 'Location Descriptions',
    description: 'Template for describing places and environments',
    category: 'description',
    tags: ['location', 'description', 'environment'],
    grammar: {
      origin: ['#article# #adjective# #location_type# #detail#'],
      article: ['A', 'An', 'The'],
      adjective: ['ancient', 'bustling', 'quiet', 'mysterious', 'grand'],
      location_type: ['castle', 'village', 'forest', 'mountain', 'tavern'],
      detail: ['stands before you', 'lies ahead', 'beckons', 'looms in the distance'],
    },
    variables: ['adjective', 'location_type'],
  },

  {
    id: 'combat_narratives',
    name: 'Combat Narratives',
    description: 'Template for combat and battle descriptions',
    category: 'narrative',
    tags: ['combat', 'action', 'battle'],
    grammar: {
      origin: ['#attacker# #attack_action# #defender# with #weapon#!'],
      attacker: ['The knight', 'The warrior', 'The champion', 'The hero'],
      attack_action: ['strikes', 'attacks', 'charges', 'assaults', 'confronts'],
      defender: ['the enemy', 'the foe', 'the villain', 'the challenger'],
      weapon: ['a sword', 'an axe', 'a spear', 'a magical staff', 'their fists'],
    },
    variables: ['attacker', 'defender', 'weapon'],
  },

  {
    id: 'dialogue_templates',
    name: 'Dialogue Templates',
    description: 'Template for character dialogue and conversations',
    category: 'dialogue',
    tags: ['dialogue', 'conversation', 'speech'],
    grammar: {
      origin: ['"#greeting#," says #speaker#. "#statement#"'],
      greeting: ['Hello', 'Greetings', 'Well met', 'Good day', 'Welcome'],
      speaker: ['the merchant', 'the guard', 'the elder', 'the stranger'],
      statement: [
        "I have news",
        "Listen carefully",
        "There's trouble ahead",
        "Let me tell you something",
      ],
    },
    variables: ['speaker', 'statement'],
  },

  {
    id: 'quest_descriptions',
    name: 'Quest Descriptions',
    description: 'Template for quest and mission descriptions',
    category: 'quest',
    tags: ['quest', 'mission', 'objective'],
    grammar: {
      origin: ['#quest_giver# needs you to #objective# #target#'],
      quest_giver: ['The king', 'The elder', 'The merchant', 'A stranger'],
      objective: ['find', 'retrieve', 'defeat', 'protect', 'deliver'],
      target: [
        'a lost artifact',
        'the stolen goods',
        'the bandits',
        'the village',
        'an important message',
      ],
    },
    variables: ['quest_giver', 'objective', 'target'],
  },

  {
    id: 'weather_descriptions',
    name: 'Weather Descriptions',
    description: 'Template for describing weather and atmospheric conditions',
    category: 'description',
    tags: ['weather', 'atmosphere', 'environment'],
    grammar: {
      origin: ['The weather is #condition# and #temperature#. #detail#'],
      condition: ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'misty'],
      temperature: ['warm', 'cool', 'cold', 'hot', 'mild', 'freezing'],
      detail: [
        'Perfect for travel.',
        'Better stay indoors.',
        'A good day for adventure.',
        'The roads will be treacherous.',
      ],
    },
    variables: ['condition', 'temperature'],
  },

  {
    id: 'event_announcements',
    name: 'Event Announcements',
    description: 'Template for announcing events and happenings',
    category: 'narrative',
    tags: ['event', 'announcement', 'news'],
    grammar: {
      origin: ['#timeframe#, #event_type# will take place #location#'],
      timeframe: ['Tomorrow', 'Next week', 'Soon', 'At dawn', 'At dusk'],
      event_type: [
        'a festival',
        'a tournament',
        'a council meeting',
        'a celebration',
        'a market',
      ],
      location: [
        'in the town square',
        'at the castle',
        'in the village',
        'at the arena',
      ],
    },
    variables: ['event_type', 'location'],
  },

  {
    id: 'character_emotions',
    name: 'Character Emotions',
    description: 'Template for expressing character emotions and feelings',
    category: 'character',
    tags: ['emotion', 'feeling', 'character'],
    grammar: {
      origin: ['#character# feels #emotion#. #expression#'],
      character: ['The hero', 'The merchant', 'The knight', 'The elder'],
      emotion: ['joyful', 'anxious', 'determined', 'fearful', 'hopeful', 'weary'],
      expression: [
        'It shows in their eyes.',
        'Their voice betrays them.',
        'They cannot hide it.',
        'Everyone can see it.',
      ],
    },
    variables: ['character', 'emotion'],
  },

  {
    id: 'treasure_descriptions',
    name: 'Treasure Descriptions',
    description: 'Template for describing treasures and valuable items',
    category: 'description',
    tags: ['treasure', 'item', 'loot'],
    grammar: {
      origin: ['You find #article# #adjective# #item# worth #value#'],
      article: ['a', 'an'],
      adjective: ['ancient', 'valuable', 'rare', 'mysterious', 'ornate', 'magical'],
      item: ['sword', 'amulet', 'gem', 'scroll', 'artifact', 'ring'],
      value: [
        'a fortune',
        'a kings ransom',
        'considerable gold',
        'untold riches',
      ],
    },
    variables: ['adjective', 'item', 'value'],
  },

  {
    id: 'relationship_changes',
    name: 'Relationship Changes',
    description: 'Template for describing changes in character relationships',
    category: 'social',
    tags: ['relationship', 'social', 'character'],
    grammar: {
      origin: ['#character1# and #character2# #relationship_change#'],
      character1: ['Alice', 'Bob', 'Charlie', 'Diana'],
      character2: ['Eve', 'Frank', 'Grace', 'Henry'],
      relationship_change: [
        'become friends',
        'form an alliance',
        'fall in love',
        'become rivals',
        'reconcile their differences',
      ],
    },
    variables: ['character1', 'character2', 'relationship_change'],
  },

  {
    id: 'time_of_day',
    name: 'Time of Day',
    description: 'Template for describing different times of day',
    category: 'description',
    tags: ['time', 'atmosphere', 'description'],
    grammar: {
      origin: ['#time_period# #sky_description#. #activity#'],
      time_period: ['At dawn', 'In the morning', 'At noon', 'In the evening', 'At night'],
      sky_description: [
        'the sky is painted with colors',
        'the sun shines brightly',
        'shadows grow long',
        'stars fill the sky',
      ],
      activity: [
        'The town awakens.',
        'People go about their business.',
        'The streets grow quiet.',
        'Peace settles over the land.',
      ],
    },
    variables: ['time_period', 'sky_description'],
  },

  {
    id: 'faction_relations',
    name: 'Faction Relations',
    description: 'Template for describing relationships between factions',
    category: 'political',
    tags: ['faction', 'politics', 'relations'],
    grammar: {
      origin: ['The #faction1# and #faction2# are #relation_status#'],
      faction1: ['Kingdom', 'Guild', 'Order', 'Alliance', 'Empire'],
      faction2: ['Merchants', 'Warriors', 'Scholars', 'Rebels', 'Council'],
      relation_status: [
        'at war',
        'in alliance',
        'negotiating peace',
        'trading partners',
        'sworn enemies',
      ],
    },
    variables: ['faction1', 'faction2', 'relation_status'],
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): GrammarTemplate | undefined {
  return grammarTemplates.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): GrammarTemplate[] {
  return grammarTemplates.filter((t) => t.category === category);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): GrammarTemplate[] {
  return grammarTemplates.filter((t) => t.tags.includes(tag));
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = grammarTemplates.map((t) => t.category);
  return Array.from(new Set(categories));
}

/**
 * Get all tags
 */
export function getAllTags(): string[] {
  const tags = grammarTemplates.flatMap((t) => t.tags);
  return Array.from(new Set(tags));
}
