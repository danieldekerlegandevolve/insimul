# Phase 8: Life Cycle & Advanced Social Dynamics - Prolog Specification

## Architecture Philosophy

**Prolog-first design**: Life cycle predicates enable simulation rules to trigger major life events (marriage, birth, death, education). TypeScript manages state changes and inheritance, while Prolog determines when/how events occur based on social context.

---

## Core Prolog Predicates

### 1. Romantic Relationships & Marriage

```prolog
% Romantic interest
attracted_to(Character1, Character2).
romantically_interested(Character1, Character2).

% Dating/courtship
dating(Character1, Character2, StartTimestep).
courting(Character1, Character2).

% Marriage
married_to(Character1, Character2).  % Already exists, but enhanced
marriage_date(Character1, Character2, Timestep).
divorced_from(Character1, Character2, Timestep).

% Compatibility for romance
romantic_compatibility(Character1, Character2, Score).

% Examples:
attracted_to(alice, bob).
dating(alice, bob, 1000).
married_to(alice, bob).
marriage_date(alice, bob, 1200).
```

### 2. Reproduction & Children

```prolog
% Pregnancy
pregnant(Character, FatherId, DueTimestep).

% Birth
gave_birth(Mother, Child, Timestep).
birth_parent(Parent, Child).  % Biological parent

% Parenting
primary_caregiver(Caregiver, Child).
stepparent(Stepparent, Child).

% Examples:
pregnant(alice, bob, 1300).
gave_birth(alice, charlie, 1300).
birth_parent(alice, charlie).
birth_parent(bob, charlie).
primary_caregiver(alice, charlie).
```

### 3. Education & Mentorship

```prolog
% Education status
student(Character).
student_of(Student, Teacher, Subject).
graduated(Character, Subject, Timestep).

% Mentorship
mentor(Mentor, Mentee, Field).
apprentice(Apprentice, Master, Trade).

% Skills & knowledge
has_skill(Character, Skill, Level).
learning(Character, Skill, Teacher).

% Examples:
student(charlie).
student_of(charlie, alice, reading).
mentor(bob, charlie, farming).
has_skill(charlie, reading, 3).
```

### 4. Coming of Age & Life Stages

```prolog
% Life stages
child(Character).        % Age < 18
adolescent(Character).   % Age 13-17
adult(Character).        % Age >= 18
elderly(Character).      % Age >= 65

% Coming of age events
came_of_age(Character, Timestep).
eligible_for_marriage(Character).
eligible_for_work(Character).

% Examples:
child(charlie).
came_of_age(charlie, 1500).
eligible_for_marriage(charlie).
```

### 5. Death & Inheritance

```prolog
% Death
deceased(Character, Timestep, Cause).
cause_of_death(Character, Cause).

% Inheritance
inherits_from(Heir, Deceased, Asset).
estate_of(Deceased, TotalValue).
will_beneficiary(Deceased, Beneficiary, Share).

% Examples:
deceased(alice, 2000, old_age).
cause_of_death(alice, old_age).
inherits_from(charlie, alice, residence_001).
estate_of(alice, 5000).
```

### 6. Extended Family

```prolog
% Grandparents (already have grandparent_of)
grandmother_of(Grandmother, Grandchild).
grandfather_of(Grandfather, Grandchild).

% Aunts/Uncles
aunt_of(Aunt, NieceNephew).
uncle_of(Uncle, NieceNephew).

% Cousins
cousin_of(Cousin1, Cousin2).

% In-laws
parent_in_law(ParentInLaw, ChildInLaw).
sibling_in_law(SiblingInLaw1, SiblingInLaw2).

% Examples (derived rules):
grandmother_of(GM, GC) :- 
    female(GM), 
    grandparent_of(GM, GC).

aunt_of(Aunt, NieceNephew) :- 
    female(Aunt),
    sibling_of(Aunt, Parent),
    parent_of(Parent, NieceNephew).

cousin_of(C1, C2) :-
    parent_of(P1, C1),
    parent_of(P2, C2),
    sibling_of(P1, P2),
    C1 \= C2.
```

---

## Prolog Rule Examples (For Simulation)

### Romantic Interest & Courtship

```prolog
% Rule: Develop attraction based on compatibility
trigger_attraction(Character1, Character2) :-
    adult(Character1),
    adult(Character2),
    unmarried(Character1),
    unmarried(Character2),
    at_same_location(Character1, Character2),
    personality_compatible(Character1, Character2, Score),
    Score > 0.7,
    \+ attracted_to(Character1, Character2).
% Effect: attracted_to(Character1, Character2) added

% Rule: Start dating after multiple positive interactions
trigger_start_dating(Character1, Character2) :-
    attracted_to(Character1, Character2),
    attracted_to(Character2, Character1),
    friends(Character1, Character2),
    relationship_charge(Character1, Character2, Charge),
    Charge > 10,
    conversation_count(Character1, Character2, Count),
    Count > 5,
    \+ dating(Character1, _, _),
    \+ dating(Character2, _, _).
% Effect: startDating(Character1, Character2, Timestep)

% Rule: Propose marriage after successful courtship
trigger_marriage_proposal(Character1, Character2) :-
    dating(Character1, Character2, StartDate),
    current_timestep(Now),
    Duration is Now - StartDate,
    Duration > 200,  % Dated for a while
    relationship_charge(Character1, Character2, Charge),
    Charge > 15,
    relationship_trust(Character1, Character2, Trust),
    Trust > 0.8,
    adult(Character1),
    adult(Character2).
% Effect: proposeMarriage(Character1, Character2, Timestep)
```

### Reproduction

```prolog
% Rule: Pregnancy occurs for married couples
trigger_pregnancy(Wife, Husband) :-
    married_to(Wife, Husband),
    female(Wife),
    age(Wife, WifeAge),
    WifeAge >= 18,
    WifeAge =< 45,
    \+ pregnant(Wife, _, _),
    \+ has_child_under(Wife, 2),  % Not if already has toddler
    random_chance(0.15).  % 15% per timestep if conditions met
% Effect: Wife becomes pregnant

% Rule: Birth occurs at due date
trigger_birth(Mother, Father) :-
    pregnant(Mother, Father, DueDate),
    current_timestep(DueDate).
% Effect: createChild(Mother, Father, Timestep)
```

### Education

```prolog
% Rule: Children start education at age 6
trigger_start_education(Child) :-
    age(Child, ChildAge),
    ChildAge >= 6,
    ChildAge < 18,
    \+ student(Child),
    parent_of(Parent, Child),
    has_skill(Parent, reading, Level),
    Level > 2.
% Effect: enrollStudent(Child, Parent, reading)

% Rule: Apprentice to family trade
trigger_apprenticeship(Child, Master) :-
    age(Child, ChildAge),
    ChildAge >= 14,
    adolescent(Child),
    parent_of(Master, Child),
    has_skill(Master, Trade, Level),
    Level > 5,
    \+ apprentice(Child, _, _).
% Effect: beginApprenticeship(Child, Master, Trade)
```

### Coming of Age

```prolog
% Rule: Come of age at 18
trigger_coming_of_age(Character) :-
    age(Character, 18),
    child(Character).
% Effect: comingOfAge(Character, Timestep)

% Rule: First job after coming of age
trigger_first_employment(Character) :-
    came_of_age(Character, AgeTimestep),
    current_timestep(Now),
    Now - AgeTimestep < 10,  % Shortly after coming of age
    \+ employed(Character),
    has_skill(Character, Skill, Level),
    Level > 3,
    business_needs_worker(Business, Skill).
% Effect: hire(Character, Business, Occupation)
```

### Death

```prolog
% Rule: Natural death from old age
trigger_natural_death(Character) :-
    age(Character, CharAge),
    CharAge >= 65,
    elderly(Character),
    random_death_chance(CharAge, Probability),
    random_chance(Probability).
% Effect: die(Character, Timestep, old_age)

% Rule: Inheritance upon death
trigger_inheritance(Deceased, Heir) :-
    deceased(Deceased, _, _),
    child_of(Heir, Deceased),
    eldest_child(Heir),
    owns(Deceased, Asset),
    \+ inherits_from(Heir, Deceased, Asset).
% Effect: transferOwnership(Asset, Deceased, Heir)
```

---

## Data Structures (TypeScript)

### Romantic Relationship

```typescript
interface RomanticRelationship {
  character1Id: string;
  character2Id: string;
  status: 'attracted' | 'dating' | 'engaged' | 'married' | 'divorced';
  startedDating?: number;
  engagementDate?: number;
  marriageDate?: number;
  divorceDate?: number;
  compatibility: number;  // 0-1
  
  // Dating history
  dates: Array<{
    location: string;
    timestamp: number;
    quality: number;  // How well it went
  }>;
  
  // Marriage details
  marriageLocation?: string;
  witnesses?: string[];
  
  // Divorce details
  divorceReason?: string;
}
```

### Pregnancy & Birth

```typescript
interface Pregnancy {
  motherId: string;
  fatherId: string;
  conceptionDate: number;
  dueDate: number;
  complications?: string[];
}

interface Birth {
  id: string;
  motherId: string;
  fatherId: string;
  childId: string;
  birthDate: number;
  location: string;
  witnesses: string[];
  complications?: string[];
}
```

### Education

```typescript
interface Education {
  studentId: string;
  teacherId: string;
  subject: string;
  startDate: number;
  endDate?: number;
  
  // Progress tracking
  lessons: Array<{
    topic: string;
    timestamp: number;
    skillGain: number;
  }>;
  
  skillLevel: number;  // 0-10
  graduated: boolean;
}

interface Mentorship {
  mentorId: string;
  menteeId: string;
  field: string;
  startDate: number;
  endDate?: number;
  
  skillTransferred: number;
}
```

### Coming of Age Event

```typescript
interface ComingOfAgeEvent {
  characterId: string;
  timestamp: number;
  age: number;  // Usually 18
  
  // Celebration
  location: string;
  attendees: string[];
  
  // Changes
  becameEligibleForMarriage: boolean;
  becameEligibleForWork: boolean;
  receivedInheritance?: {
    fromId: string;
    assets: string[];
  };
}
```

### Death & Inheritance

```typescript
interface Death {
  characterId: string;
  timestamp: number;
  age: number;
  cause: 'old_age' | 'illness' | 'accident' | 'other';
  location: string;
  
  // Estate
  estate: {
    totalValue: number;
    assets: Array<{
      type: 'business' | 'residence' | 'money' | 'item';
      id: string;
      value: number;
    }>;
  };
  
  // Will & inheritance
  will?: {
    beneficiaries: Array<{
      heirId: string;
      assets: string[];
      share: number;  // Percentage
    }>;
  };
  
  // Funeral
  funeral?: {
    location: string;
    attendees: string[];
    timestamp: number;
  };
}
```

---

## API Endpoints (Setup Utilities)

### Romantic Relationships

```typescript
// Check romantic compatibility
GET /api/relationships/:char1Id/:char2Id/romantic-compatibility

// Start attraction
POST /api/relationships/attract
{ character1Id, character2Id, currentTimestep }

// Start dating
POST /api/relationships/start-dating
{ character1Id, character2Id, location, currentTimestep }

// Go on date
POST /api/relationships/date
{ character1Id, character2Id, location, currentTimestep }

// Propose marriage
POST /api/relationships/propose
{ proposerId, proposedToId, location, currentTimestep }

// Marry characters
POST /api/relationships/marry
{ character1Id, character2Id, location, witnesses, currentTimestep }

// Divorce
POST /api/relationships/divorce
{ character1Id, character2Id, reason, currentTimestep }
```

### Reproduction

```typescript
// Check pregnancy eligibility
GET /api/reproduction/:characterId/eligibility

// Become pregnant
POST /api/reproduction/conceive
{ motherId, fatherId, currentTimestep }

// Give birth
POST /api/reproduction/birth
{ motherId, location, currentTimestep }
```

### Education

```typescript
// Enroll student
POST /api/education/enroll
{ studentId, teacherId, subject, currentTimestep }

// Conduct lesson
POST /api/education/lesson
{ studentId, teacherId, topic, currentTimestep }

// Graduate
POST /api/education/graduate
{ studentId, subject, currentTimestep }

// Start mentorship
POST /api/education/mentor
{ mentorId, menteeId, field, currentTimestep }
```

### Life Events

```typescript
// Coming of age
POST /api/life-events/coming-of-age
{ characterId, location, attendees, currentTimestep }

// Die
POST /api/life-events/die
{ characterId, cause, location, currentTimestep }

// Process inheritance
POST /api/life-events/inherit
{ deceasedId, heirId, assets, currentTimestep }

// Get character life history
GET /api/characters/:id/life-history
```

---

## Compatibility Calculation

### Romantic Compatibility

```typescript
function calculateRomanticCompatibility(
  char1: Character,
  char2: Character
): number {
  const p1 = char1.personality;
  const p2 = char2.personality;
  
  // Personality compatibility (Big Five)
  const opennessMatch = 1 - Math.abs(p1.openness - p2.openness);
  const conscientiousnessMatch = 1 - Math.abs(p1.conscientiousness - p2.conscientiousness);
  const extroversionComplement = Math.abs(p1.extroversion - p2.extroversion);  // Opposites can attract
  const agreeablenessMatch = 1 - Math.abs(p1.agreeableness - p2.agreeableness);
  const neuroticismComplement = 1 - Math.abs(p1.neuroticism - p2.neuroticism);  // Low neuroticism is universally attractive
  
  // Weighted average
  const personalityScore = (
    opennessMatch * 0.2 +
    conscientiousnessMatch * 0.15 +
    extroversionComplement * 0.1 +  // Some variance is good
    agreeablenessMatch * 0.25 +
    neuroticismComplement * 0.3
  );
  
  // Age difference (prefer similar ages)
  const ageDiff = Math.abs((char1.age || 0) - (char2.age || 0));
  const ageScore = Math.max(0, 1 - (ageDiff / 20));  // Penalty increases with age gap
  
  // Social class similarity (if implemented)
  // const classScore = calculateClassCompatibility(char1, char2);
  
  // Final compatibility
  return (
    personalityScore * 0.6 +
    ageScore * 0.4
  );
}
```

---

## Pregnancy & Birth Mechanics

### Pregnancy Chance

```typescript
function calculatePregnancyChance(
  wife: Character,
  husband: Character,
  timestep: number
): number {
  const age = wife.age || 20;
  
  // Base rate by age
  let baseRate = 0.15;  // 15% per period
  
  if (age < 20) baseRate = 0.10;  // Lower for young
  else if (age > 35) baseRate = 0.08;  // Lower for older
  else if (age > 40) baseRate = 0.03;  // Much lower after 40
  else if (age > 45) baseRate = 0.0;   // No pregnancy after 45
  
  // Relationship quality modifier
  const relationship = getRelationship(wife.id, husband.id);
  const qualityMod = 0.5 + (relationship.charge / 40);  // 0.5 to 1.0
  
  return baseRate * qualityMod;
}
```

### Child Genetics

```typescript
function generateChild(
  mother: Character,
  father: Character,
  birthTimestep: number
): Character {
  return {
    firstName: generateName(Math.random() < 0.5 ? 'male' : 'female'),
    lastName: father.lastName,  // Patrilineal
    birthYear: timestepToYear(birthTimestep),
    age: 0,
    
    // Inherit personality (average of parents + random variation)
    personality: {
      openness: inheritTrait(mother.personality.openness, father.personality.openness),
      conscientiousness: inheritTrait(mother.personality.conscientiousness, father.personality.conscientiousness),
      extroversion: inheritTrait(mother.personality.extroversion, father.personality.extroversion),
      agreeableness: inheritTrait(mother.personality.agreeableness, father.personality.agreeableness),
      neuroticism: inheritTrait(mother.personality.neuroticism, father.personality.neuroticism)
    },
    
    // Family relationships
    parents: [mother.id, father.id],
    // ... other fields
  };
}

function inheritTrait(trait1: number, trait2: number): number {
  const average = (trait1 + trait2) / 2;
  const variation = (Math.random() - 0.5) * 0.3;  // ±15%
  return Math.max(0, Math.min(1, average + variation));
}
```

---

## Death Probability

```typescript
function calculateDeathProbability(age: number): number {
  if (age < 50) return 0.001;      // 0.1% per year
  if (age < 60) return 0.005;      // 0.5% per year
  if (age < 70) return 0.02;       // 2% per year
  if (age < 80) return 0.05;       // 5% per year
  if (age < 90) return 0.15;       // 15% per year
  return 0.30;                      // 30% per year after 90
}
```

---

## Success Criteria

✅ **Prolog predicates** for life cycle events
✅ **Romantic compatibility** calculation
✅ **Dating & marriage** mechanics
✅ **Pregnancy & birth** system
✅ **Child genetics** (personality inheritance)
✅ **Education & mentorship** tracking
✅ **Coming of age** transitions
✅ **Death & inheritance** mechanics
✅ **Extended family** relationships
✅ **Integration** with Phases 5, 6, 7

---

## Next Steps

1. Implement TypeScript lifecycle system
2. Add romantic relationship mechanics
3. Implement reproduction & birth
4. Add education & skill transfer
5. Implement coming of age events
6. Add death & inheritance
7. Create API endpoints
8. Update Prolog sync for lifecycle facts
9. Test lifecycle flows

---

**Phase 8 will enable**: Characters to be born, grow up, learn, fall in love, marry, have children, age, and die - completing the full life cycle simulation! 👶💍🎓💀
