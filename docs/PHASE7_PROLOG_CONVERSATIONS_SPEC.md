# Phase 7: Conversations System - Prolog Specification

## Architecture Philosophy

**Prolog-first design**: Conversation predicates are designed for simulation rule triggering. TypeScript handles dialogue generation, topic selection, and recording conversation history, but Prolog determines when/what conversations occur.

---

## Core Prolog Predicates

### 1. Conversation State

```prolog
% Currently in conversation
in_conversation(Character1, Character2, ConversationId).

% Conversation location
conversation_at(ConversationId, Location).

% Conversation started at timestep
conversation_started(ConversationId, Timestep).

% Conversation topic
conversation_topic(ConversationId, Topic).

% Examples:
in_conversation(alice, bob, conv_001).
conversation_at(conv_001, tavern).
conversation_started(conv_001, 1000).
conversation_topic(conv_001, gossip_about_charlie).
```

### 2. Conversation History

```prolog
% Characters have had a conversation
had_conversation(Character1, Character2, Timestep).

% Total conversations between two characters
conversation_count(Character1, Character2, Count).

% Last conversation timestep
last_conversation(Character1, Character2, Timestep).

% Examples:
had_conversation(alice, bob, 1000).
conversation_count(alice, bob, 15).
last_conversation(alice, bob, 1500).
```

### 3. Topics & Utterances

```prolog
% Topic discussed in conversation
topic_discussed(ConversationId, Topic).

% Utterance in conversation
utterance(ConversationId, Speaker, Listener, Text, Timestep).

% Topic about a person
topic_about(Topic, Person).

% Examples:
topic_discussed(conv_001, gossip).
utterance(conv_001, alice, bob, 'Did you hear about Charlie?', 1000).
topic_about(gossip_charlie, charlie).
```

### 4. Lies & Deception

```prolog
% Statement was a lie
is_lie(ConversationId, Speaker, Statement).

% Character is currently lying
lying(Character, ConversationId).

% Character detected a lie
detected_lie(Listener, Speaker, ConversationId).

% Examples:
is_lie(conv_001, alice, 'Bob is trustworthy').
lying(alice, conv_001).
detected_lie(charlie, alice, conv_001).
```

### 5. Eavesdropping

```prolog
% Character is eavesdropping on conversation
eavesdropping(Eavesdropper, ConversationId).

% Character can overhear (same location, not participant)
can_overhear(Eavesdropper, ConversationId).

% Examples:
eavesdropping(eve, conv_001).
can_overhear(eve, conv_001) :-
    conversation_at(conv_001, Location),
    at_location(eve, Location),
    \+ in_conversation(eve, _, _).
```

### 6. Conversational Goals

```prolog
% Character wants to discuss topic
wants_to_discuss(Character, Topic).

% Character wants information
seeks_information(Character, Subject, Fact).

% Character wants to persuade
wants_to_persuade(Character, Target, Belief).

% Examples:
wants_to_discuss(alice, politics).
seeks_information(bob, charlie, occupation).
wants_to_persuade(eve, alice, believes(eve, frank, trustworthy, 0.8)).
```

---

## Prolog Rule Examples (For Simulation)

### Conversation Initiation

```prolog
% Rule: Initiate conversation with friend at same location
trigger_conversation(Initiator, Target) :-
    at_same_location(Initiator, Target),
    friends(Initiator, Target),
    \+ in_conversation(Initiator, _, _),
    \+ in_conversation(Target, _, _),
    salience(Initiator, Target, S),
    S > 0.4.

% Rule: Seek out someone for specific information
trigger_targeted_conversation(Seeker, Target) :-
    seeks_information(Seeker, Subject, Fact),
    knows(Target, Subject, Fact),
    \+ knows(Seeker, Subject, Fact),
    at_same_location(Seeker, Target).
```

### Topic Selection

```prolog
% Rule: Choose gossip topic about salient person
choose_gossip_topic(Speaker, Listener, Subject) :-
    salience(Speaker, Subject, S),
    S > 0.5,
    knows_well(Speaker, Subject),
    \+ knows_well(Listener, Subject),
    has_mental_model(Speaker, Listener).

% Rule: Discuss shared interests
choose_shared_topic(Person1, Person2, Topic) :-
    knows_value(Person1, Person1, interest, Topic),
    knows_value(Person2, Person2, interest, Topic).
```

### Lying Triggers

```prolog
% Rule: Lie to protect reputation
trigger_lie(Speaker, Listener, Statement) :-
    believes(Listener, Speaker, Quality, C),
    C < 0.4,  % Listener has poor opinion
    wants_to_persuade(Speaker, Listener, NewBelief),
    relationship_trust(Listener, Speaker, T),
    T < 0.5,  % Low trust = more willing to lie
    personality_trait(Speaker, agreeableness, A),
    A < 0.3.  % Low agreeableness = less honest

% Rule: Lie detected based on knowledge mismatch
trigger_lie_detection(Listener, Speaker, Statement) :-
    utterance(Conv, Speaker, Listener, Statement, _),
    knows_value(Listener, Subject, Fact, TrueValue),
    statement_claims(Statement, Subject, Fact, ClaimedValue),
    TrueValue \= ClaimedValue,
    personality_trait(Listener, openness, O),
    O > 0.6.  % High openness = more perceptive
```

### Eavesdropping

```prolog
% Rule: Overhear conversation
trigger_overhear(Eavesdropper, Conv) :-
    can_overhear(Eavesdropper, Conv),
    conversation_topic(Conv, Topic),
    topic_about(Topic, Subject),
    salience(Eavesdropper, Subject, S),
    S > 0.3,  % Interested in subject
    personality_trait(Eavesdropper, extroversion, E),
    E < 0.4.  % Introverts more likely to eavesdrop
```

### Knowledge Propagation Through Talk

```prolog
% Rule: Share knowledge during conversation
trigger_knowledge_share(Speaker, Listener, Conv) :-
    in_conversation(Speaker, Listener, Conv),
    can_share_knowledge(Speaker, Listener, Subject, Fact),
    \+ lying(Speaker, Conv).

% Rule: Form belief from hearsay
trigger_belief_formation(Listener, Speaker, Subject, Quality) :-
    in_conversation(Speaker, Listener, Conv),
    believes(Speaker, Subject, Quality, C),
    C > 0.7,  % Strong belief
    relationship_trust(Listener, Speaker, T),
    T > 0.6,  % Trust speaker
    \+ detected_lie(Listener, Speaker, Conv).
```

---

## Data Structures (TypeScript)

### Conversation Record

```typescript
interface Conversation {
  id: string;
  participants: [string, string];  // [char1Id, char2Id]
  location: string;
  startTimestep: number;
  endTimestep?: number;
  topic: ConversationTopic;
  utterances: Utterance[];
  knowledgeShared: KnowledgeTransfer[];
  beliefsFormed: BeliefTransfer[];
  liesDetected: string[];  // Utterance IDs
  eavesdroppers: string[];  // Character IDs
}

interface ConversationTopic {
  type: 'gossip' | 'small_talk' | 'business' | 'news' | 'personal' | 'argument';
  subject?: string;  // If about a person
  description: string;
}

interface Utterance {
  id: string;
  speaker: string;
  listener: string;
  text: string;
  timestamp: number;
  isLie: boolean;
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

interface KnowledgeTransfer {
  from: string;
  to: string;
  subjectId: string;
  factsShared: string[];
  valuesShared: string[];
  timestamp: number;
}

interface BeliefTransfer {
  from: string;
  to: string;
  subjectId: string;
  quality: string;
  confidence: number;
  accepted: boolean;  // Did listener accept it?
  timestamp: number;
}
```

### Character Conversation State

```typescript
interface CharacterConversationState {
  // Current conversation (if any)
  currentConversation?: string;
  
  // Conversation goals
  wantsToDiscuss: string[];  // Topic IDs
  seeksInformation: Array<{
    subjectId: string;
    fact: string;
  }>;
  
  // Conversation history
  conversationHistory: {
    [otherCharacterId: string]: {
      totalConversations: number;
      lastConversation: number;
      topics: string[];
    };
  };
  
  // Detected lies
  knownLiars: {
    [liarId: string]: {
      liesDetected: number;
      lastLie: number;
    };
  };
}
```

---

## Dialogue Generation Strategy

### Template-Based Generation

```typescript
const DIALOGUE_TEMPLATES = {
  greeting: {
    friendly: ["Hello {name}!", "Good to see you, {name}!", "Hey {name}, how are you?"],
    neutral: ["Hello.", "Good day.", "{name}."],
    unfriendly: ["What do you want?", "{name}.", "Oh, it's you."]
  },
  
  gossip: {
    positive: [
      "Did you hear? {subject} is doing well.",
      "I heard {subject} is quite {quality}.",
      "{subject} has been so {quality} lately."
    ],
    negative: [
      "Between you and me, {subject} is rather {quality}.",
      "I don't mean to gossip, but {subject} is {quality}.",
      "Have you noticed {subject} acting {quality}?"
    ]
  },
  
  inquiry: [
    "Do you know {subject}?",
    "What can you tell me about {subject}?",
    "I've been wondering about {subject}'s {fact}.",
    "Do you happen to know {subject}'s {fact}?"
  ],
  
  response: {
    affirmative: [
      "Yes, {subject} is a {occupation}.",
      "I believe {subject} {fact_value}.",
      "As far as I know, {fact_statement}."
    ],
    negative: [
      "I'm not sure about that.",
      "I don't know much about {subject}.",
      "I haven't heard anything about that."
    ],
    lie: [
      "Oh yes, {false_statement}.",
      "Actually, {false_statement}.",
      "I'm certain that {false_statement}."
    ]
  }
};
```

### Context-Aware Selection

```typescript
function selectDialogue(
  speaker: Character,
  listener: Character,
  context: ConversationContext
): string {
  // Consider:
  // - Relationship charge (friendly/unfriendly)
  // - Personality (extroverted = more words, agreeable = more polite)
  // - Topic (gossip/inquiry/news)
  // - Lying intention
  
  const relationship = getRelationship(speaker.id, listener.id);
  const charge = relationship.charge;
  
  let tone: 'friendly' | 'neutral' | 'unfriendly';
  if (charge > 5) tone = 'friendly';
  else if (charge < -5) tone = 'unfriendly';
  else tone = 'neutral';
  
  const template = selectTemplate(context.topic, tone);
  return fillTemplate(template, context);
}
```

---

## Topic Selection Logic

### Priority System

```typescript
enum TopicPriority {
  URGENT = 1,       // Seeks specific information
  HIGH = 2,         // Wants to persuade
  MEDIUM = 3,       // Gossip about salient person
  LOW = 4           // Small talk
}

function selectConversationTopic(
  speaker: Character,
  listener: Character,
  timestep: number
): ConversationTopic {
  const goals = speaker.conversationState.wantsToDiscuss;
  const seeking = speaker.conversationState.seeksInformation;
  
  // Priority 1: Urgent information seeking
  for (const query of seeking) {
    if (knowsAbout(listener.id, query.subjectId, query.fact)) {
      return {
        type: 'personal',
        subject: query.subjectId,
        description: `Asking about ${query.fact}`
      };
    }
  }
  
  // Priority 2: Persuasion goals
  // ...
  
  // Priority 3: Gossip about salient person
  const salientPeople = getMostSalientPeople(speaker.id, 5);
  for (const person of salientPeople) {
    if (!knowsWell(listener.id, person.characterId)) {
      return {
        type: 'gossip',
        subject: person.characterId,
        description: `Gossip about ${person.name}`
      };
    }
  }
  
  // Priority 4: Small talk
  return {
    type: 'small_talk',
    description: 'Weather, general pleasantries'
  };
}
```

---

## Lying Mechanics

### When to Lie

```typescript
function shouldLie(
  speaker: Character,
  listener: Character,
  topic: ConversationTopic,
  truthValue: any
): boolean {
  const speakerTraits = speaker.personality;
  const relationship = getRelationship(speaker.id, listener.id);
  
  // Factors that increase lying:
  // - Low agreeableness
  // - Low trust in relationship
  // - Poor reputation with listener
  // - Truth is harmful to speaker
  
  let lyingProbability = 0.1; // Base 10%
  
  if (speakerTraits.agreeableness < 0.3) {
    lyingProbability += 0.3;
  }
  
  if (relationship.trust < 0.4) {
    lyingProbability += 0.2;
  }
  
  const listenerBelief = getBelief(listener.id, speaker.id, 'trustworthy');
  if (listenerBelief && listenerBelief.confidence < 0.4) {
    lyingProbability += 0.2;
  }
  
  // If truth is harmful (e.g., admitting to wrongdoing)
  if (isHarmful(truthValue, speaker.id)) {
    lyingProbability += 0.3;
  }
  
  return Math.random() < lyingProbability;
}
```

### Lie Detection

```typescript
function detectLie(
  listener: Character,
  speaker: Character,
  statement: Utterance
): boolean {
  const listenerTraits = listener.personality;
  
  // Factors that increase detection:
  // - High openness (perceptive)
  // - Listener knows the truth
  // - Low trust in speaker
  
  let detectionProbability = 0.2; // Base 20%
  
  if (listenerTraits.openness > 0.7) {
    detectionProbability += 0.3;
  }
  
  // Check if listener knows contradictory information
  if (statement.knowledgeShared) {
    const subject = statement.knowledgeShared.subjectId;
    for (const [attr, value] of Object.entries(statement.knowledgeShared.values)) {
      const knownValue = getKnownValue(listener.id, subject, attr);
      if (knownValue && knownValue !== value) {
        detectionProbability += 0.4; // Clear contradiction
      }
    }
  }
  
  const relationship = getRelationship(listener.id, speaker.id);
  if (relationship.trust < 0.4) {
    detectionProbability += 0.2; // Suspicious of speaker
  }
  
  return Math.random() < detectionProbability;
}
```

---

## Eavesdropping Mechanics

### Who Can Overhear

```typescript
function getPotentialEavesdroppers(
  conversation: Conversation
): Character[] {
  const location = conversation.location;
  const participants = conversation.participants;
  
  // Get all characters at location who aren't in the conversation
  const charactersAtLocation = await getCharactersAtLocation(
    worldId,
    location,
    'current'
  );
  
  return charactersAtLocation.filter(char => 
    !participants.includes(char.id) &&
    !char.conversationState?.currentConversation
  );
}
```

### Eavesdropping Probability

```typescript
function shouldEavesdrop(
  character: Character,
  conversation: Conversation
): boolean {
  const traits = character.personality;
  
  // Factors:
  // - Low extroversion (introverts more likely)
  // - High interest in topic/subject
  // - Suspicious of participants
  
  let probability = 0.2; // Base 20%
  
  if (traits.extroversion < 0.4) {
    probability += 0.3; // Introverts
  }
  
  // High salience for conversation subject
  if (conversation.topic.subject) {
    const salience = getSalience(character.id, conversation.topic.subject);
    probability += salience * 0.4;
  }
  
  // Suspicious of participants
  for (const participantId of conversation.participants) {
    const relationship = getRelationship(character.id, participantId);
    if (relationship.charge < -5) {  // Enemy
      probability += 0.2;
    }
  }
  
  return Math.random() < probability;
}
```

### Overheard Information

```typescript
function processEavesdrop(
  eavesdropper: Character,
  conversation: Conversation,
  utterance: Utterance
): void {
  // Eavesdroppers get knowledge as "rumor" (weak evidence)
  if (utterance.knowledgeShared) {
    const { subjectId, facts, values } = utterance.knowledgeShared;
    
    // Add as rumor evidence (strength 0.2)
    for (const fact of facts) {
      await addKnownFact(eavesdropper.id, subjectId, fact, timestep);
    }
    
    for (const [attr, value] of Object.entries(values)) {
      await addKnownValue(eavesdropper.id, subjectId, attr, value, timestep);
    }
  }
  
  if (utterance.beliefShared) {
    const { subjectId, quality, confidence } = utterance.beliefShared;
    
    // Add as rumor evidence
    await addBelief(eavesdropper.id, subjectId, quality, confidence * 0.3, {
      type: 'rumor',
      strength: 0.2,
      timestamp: timestep,
      sourceId: utterance.speaker,
      description: 'Overheard conversation'
    }, timestep);
  }
}
```

---

## API Endpoints (Setup Utilities)

```typescript
// Start conversation
POST /api/conversations/start
{ initiatorId, targetId, location, currentTimestep }

// End conversation
POST /api/conversations/:id/end
{ currentTimestep }

// Add utterance
POST /api/conversations/:id/utterance
{ speakerId, text, isLie, knowledgeShared, beliefShared, currentTimestep }

// Get conversation
GET /api/conversations/:id

// Get character's conversation history
GET /api/conversations/character/:id

// Simulate conversation
POST /api/conversations/simulate
{ char1Id, char2Id, location, duration, currentTimestep }

// Add conversation goal
POST /api/conversations/goals/add
{ characterId, goalType, details }

// Detect eavesdroppers
POST /api/conversations/:id/check-eavesdroppers
{ currentTimestep }
```

---

## Success Criteria

✅ **Prolog predicates** for conversation state and history
✅ **Dialogue generation** with personality-based templates
✅ **Topic selection** with priority system
✅ **Lying mechanics** with detection
✅ **Eavesdropping** system
✅ **Knowledge propagation** through conversation
✅ **Belief formation** from hearsay
✅ **Integration** with Phase 5 & 6

---

## Next Steps

1. Implement TypeScript conversation system
2. Add dialogue generation with templates
3. Implement topic selection logic
4. Add lying and detection mechanics
5. Implement eavesdropping
6. Create API endpoints
7. Update Prolog sync for conversation facts
8. Test conversation flows

---

**Phase 7 will enable**: Characters to have natural conversations, share information, gossip, lie, and overhear secrets! 💬🎭
