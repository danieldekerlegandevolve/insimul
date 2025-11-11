# Phase 6: Knowledge & Beliefs - Prolog Specification

## Architecture Philosophy

**Prolog-first design**: Knowledge predicates are designed for Prolog rule querying during simulation. TypeScript utilities initialize and update these predicates but don't implement the reasoning logic.

---

## Core Prolog Predicates

### 1. Knowledge Facts

```prolog
% Basic knowledge: Observer knows Fact about Subject
knows(Observer, Subject, Fact).

% Examples:
knows(alice, bob, name).           % Alice knows Bob's name
knows(alice, bob, occupation).     % Alice knows Bob's job
knows(alice, bob, age).            % Alice knows Bob's age
knows(alice, bob, spouse).         % Alice knows Bob's spouse

% Knowledge with specific value
knows_value(Observer, Subject, Attribute, Value).

% Examples:
knows_value(alice, bob, occupation, farmer).
knows_value(alice, bob, age, 35).
knows_value(alice, charlie, location, tavern).
```

### 2. Belief Predicates

```prolog
% Observer believes Subject has Quality with Confidence (0.0-1.0)
believes(Observer, Subject, Quality, Confidence).

% Examples:
believes(alice, bob, friendly, 0.8).
believes(alice, bob, trustworthy, 0.6).
believes(alice, charlie, greedy, 0.9).

% Beliefs can be false!
believes(alice, bob, rich, 0.7).  % Bob is actually poor
```

### 3. Evidence Predicates

```prolog
% Evidence supporting a belief
evidence(Observer, Subject, Quality, EvidenceType, Strength, Timestamp).

% Examples:
evidence(alice, bob, friendly, observation, 0.5, 1000).
evidence(alice, bob, friendly, hearsay, 0.3, 1005).
evidence(alice, charlie, greedy, direct_experience, 0.9, 1010).

% Evidence types: observation, hearsay, direct_experience, rumor, testimony
```

### 4. Mental Model Predicates

```prolog
% Observer has a mental model of Subject (knows they exist)
has_mental_model(Observer, Subject).

% Mental model last updated
mental_model_updated(Observer, Subject, Timestamp).

% Mental model confidence (how well they know them)
mental_model_confidence(Observer, Subject, Confidence).

% Examples:
has_mental_model(alice, bob).
mental_model_updated(alice, bob, 1050).
mental_model_confidence(alice, bob, 0.75).
```

### 5. Memory & Salience Integration

```prolog
% Already have from Phase 5:
% salience(Observer, Subject, Value).

% Memory decay affects knowledge retention
knowledge_decay(Observer, Subject, Fact, DecayRate).

% Strong memories resist decay
memory_strength(Observer, Subject, Fact, Strength).
```

---

## Prolog Rule Examples (For Simulation)

### Knowledge Propagation

```prolog
% Rule: Share knowledge through conversation
can_share_knowledge(Speaker, Listener, Subject, Fact) :-
    knows(Speaker, Subject, Fact),
    \+ knows(Listener, Subject, Fact),
    has_mental_model(Speaker, Listener),
    has_mental_model(Speaker, Subject),
    salience(Speaker, Subject, S1),
    S1 > 0.3.  % Only share about salient people

% Effect trigger:
trigger_knowledge_share(Speaker, Listener) :-
    at_same_location(Speaker, Listener),
    friends(Speaker, Listener),
    can_share_knowledge(Speaker, Listener, Subject, Fact).
```

### Belief Formation

```prolog
% Rule: Form belief from evidence
should_form_belief(Observer, Subject, Quality) :-
    evidence(Observer, Subject, Quality, _, S1, _),
    evidence(Observer, Subject, Quality, _, S2, _),
    S1 + S2 > 1.0,  % Sufficient evidence
    \+ believes(Observer, Subject, Quality, _).

% Rule: Update belief strength
should_update_belief(Observer, Subject, Quality, NewConfidence) :-
    believes(Observer, Subject, Quality, OldConf),
    findall(S, evidence(Observer, Subject, Quality, _, S, _), Strengths),
    sumlist(Strengths, Total),
    length(Strengths, Count),
    Count > 0,
    NewConfidence is min(1.0, Total / Count).
```

### Trust-Based Knowledge

```prolog
% Rule: Trust affects knowledge acceptance
accepts_information(Listener, Speaker, Fact) :-
    relationship_trust(Listener, Speaker, Trust),
    Trust > 0.5,
    knows(Speaker, _, Fact).

% Rule: Distrust leads to rejection
rejects_information(Listener, Speaker, Fact) :-
    relationship_trust(Listener, Speaker, Trust),
    Trust < 0.3,
    knows(Speaker, _, Fact).
```

### Memory Decay

```prolog
% Rule: Forgotten knowledge
should_forget(Observer, Subject, Fact) :-
    knows(Observer, Subject, Fact),
    mental_model_updated(Observer, Subject, LastUpdate),
    current_timestep(Now),
    TimePassed is Now - LastUpdate,
    memory_strength(Observer, Subject, Fact, Strength),
    TimePassed > (1000 / Strength).  % Weak memories fade faster
```

---

## Data Structures (TypeScript)

### Character Mental State

```typescript
interface CharacterKnowledge {
  mentalModels: {
    [subjectId: string]: MentalModel;
  };
}

interface MentalModel {
  subjectId: string;
  confidence: number;  // 0-1, how well they know them
  lastUpdated: number;  // Timestep
  
  // What they know about the subject
  knownFacts: {
    name?: boolean;
    age?: boolean;
    occupation?: boolean;
    location?: boolean;
    spouse?: boolean;
    family?: boolean;
    [key: string]: boolean | undefined;
  };
  
  // Specific known values
  knownValues: {
    [attribute: string]: any;
  };
  
  // Beliefs about the subject
  beliefs: {
    [quality: string]: BeliefFacet;
  };
}

interface BeliefFacet {
  quality: string;  // 'friendly', 'trustworthy', 'greedy', etc.
  confidence: number;  // 0-1
  evidence: Evidence[];
  lastUpdated: number;
}

interface Evidence {
  type: 'observation' | 'hearsay' | 'direct_experience' | 'rumor' | 'testimony';
  strength: number;  // 0-1
  timestamp: number;
  sourceId?: string;  // Who told them (for hearsay/rumor)
  description?: string;
}
```

---

## Prolog Sync Strategy

### Sync Functions

```typescript
// Sync all knowledge facts for a world
async function syncKnowledgeToProlog(worldId: string): Promise<void> {
  const characters = await storage.getCharactersByWorld(worldId);
  const prologManager = new PrologManager(`knowledge_base_${worldId}.pl`, worldId);
  
  for (const observer of characters) {
    const knowledge = observer.mentalModels as CharacterKnowledge;
    
    for (const [subjectId, model] of Object.entries(knowledge.mentalModels)) {
      // Sync mental model existence
      await prologManager.assertFact(`has_mental_model(${observer.id}, ${subjectId})`);
      await prologManager.assertFact(`mental_model_confidence(${observer.id}, ${subjectId}, ${model.confidence})`);
      await prologManager.assertFact(`mental_model_updated(${observer.id}, ${subjectId}, ${model.lastUpdated})`);
      
      // Sync known facts
      for (const [fact, known] of Object.entries(model.knownFacts)) {
        if (known) {
          await prologManager.assertFact(`knows(${observer.id}, ${subjectId}, ${fact})`);
        }
      }
      
      // Sync known values
      for (const [attr, value] of Object.entries(model.knownValues)) {
        await prologManager.assertFact(`knows_value(${observer.id}, ${subjectId}, ${attr}, ${value})`);
      }
      
      // Sync beliefs
      for (const [quality, belief] of Object.entries(model.beliefs)) {
        await prologManager.assertFact(`believes(${observer.id}, ${subjectId}, ${quality}, ${belief.confidence})`);
        
        // Sync evidence
        for (const evidence of belief.evidence) {
          await prologManager.assertFact(
            `evidence(${observer.id}, ${subjectId}, ${quality}, ${evidence.type}, ${evidence.strength}, ${evidence.timestamp})`
          );
        }
      }
    }
  }
}
```

---

## Knowledge Initialization (Generation)

### During World Generation

```typescript
// Initialize mental models when characters meet
async function initializeMentalModel(
  observerId: string,
  subjectId: string,
  initialFacts: string[] = ['name']
): Promise<void> {
  const observer = await storage.getCharacter(observerId);
  const knowledge = observer.mentalModels as CharacterKnowledge || { mentalModels: {} };
  
  knowledge.mentalModels[subjectId] = {
    subjectId,
    confidence: 0.1,  // Just met
    lastUpdated: 0,   // Current timestep
    knownFacts: {
      name: initialFacts.includes('name'),
      age: initialFacts.includes('age'),
      occupation: initialFacts.includes('occupation'),
    },
    knownValues: {},
    beliefs: {}
  };
  
  await storage.updateCharacter(observerId, {
    mentalModels: knowledge as any
  });
}

// Initialize knowledge for coworkers
async function initializeCoworkerKnowledge(businessId: string): Promise<void> {
  const employees = await getBusinessEmployees(businessId);
  
  for (const employee1 of employees) {
    for (const employee2 of employees) {
      if (employee1.id !== employee2.id) {
        await initializeMentalModel(employee1.id, employee2.id, ['name', 'occupation']);
        
        // Coworkers get basic positive belief
        await addBelief(employee1.id, employee2.id, 'professional', 0.5, {
          type: 'observation',
          strength: 0.5,
          timestamp: 0,
          description: 'Works together'
        });
      }
    }
  }
}
```

---

## Integration with Phase 5 (Social Dynamics)

### Knowledge Affects Relationships

```prolog
% Prolog rule: Beliefs affect relationship charge
belief_affects_charge(Observer, Subject, ChargeModifier) :-
    believes(Observer, Subject, friendly, C1),
    believes(Observer, Subject, trustworthy, C2),
    ChargeModifier is (C1 + C2) * 0.5.

% Rule: Knowledge of shared interests strengthens bonds
shared_interest_bonus(Person1, Person2) :-
    knows_value(Person1, Person2, hobby, Hobby),
    knows_value(Person1, Person1, hobby, Hobby),
    % Same hobby!
    % Effect: increase_charge(Person1, Person2, 2.0)
```

### Relationships Enable Knowledge Sharing

```prolog
% Rule: Friends share information more freely
conversation_depth(Speaker, Listener, deep) :-
    friends(Speaker, Listener),
    relationship_trust(Speaker, Listener, T),
    T > 0.7.

conversation_depth(Speaker, Listener, superficial) :-
    \+ friends(Speaker, Listener).

% Deep conversations share more facts
can_share_fact(Speaker, Listener, Fact) :-
    conversation_depth(Speaker, Listener, deep),
    knows(Speaker, _, Fact).
```

---

## API Endpoints (Setup Utilities)

```typescript
// Initialize mental model
POST /api/knowledge/init
{ observerId, subjectId, initialFacts: ['name', 'age'] }

// Add knowledge fact
POST /api/knowledge/add-fact
{ observerId, subjectId, fact: 'occupation' }

// Add knowledge value
POST /api/knowledge/add-value
{ observerId, subjectId, attribute: 'occupation', value: 'farmer' }

// Add belief
POST /api/knowledge/add-belief
{ observerId, subjectId, quality: 'friendly', confidence: 0.7, evidence: {...} }

// Propagate knowledge (manual trigger for testing)
POST /api/knowledge/propagate
{ speakerId, listenerId, subjectId, fact: 'age' }

// Get mental model
GET /api/knowledge/:observerId/:subjectId

// Get all known by observer
GET /api/knowledge/:observerId

// Sync knowledge to Prolog
POST /api/knowledge/sync/:worldId
```

---

## Success Criteria

✅ **Prolog predicates** defined and documented
✅ **Data structures** designed for Prolog sync
✅ **TypeScript utilities** initialize/update predicates
✅ **Sync functions** keep Prolog facts current
✅ **Integration** with Phase 5 relationships
✅ **API endpoints** for setup and testing
✅ **Documentation** for Prolog-first usage

---

## Next Steps

1. Implement TypeScript utilities (`knowledge-system.ts`)
2. Add schema fields for mental models
3. Implement Prolog sync extension
4. Create API endpoints
5. Update `prolog-sync.ts` to include knowledge facts
6. Test with Prolog rules during simulation

---

**Phase 6 will enable**: Characters to learn, remember, share information, form beliefs, and reason about what others know! 🧠
