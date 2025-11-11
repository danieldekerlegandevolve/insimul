# Phase 10: Town Events & Community Simulation - Prolog Specification

## Architecture Philosophy

**Prolog-first design**: Event predicates enable simulation rules to trigger community gatherings, festivals, disasters, and town-wide events. TypeScript manages event scheduling and attendance, while Prolog determines who participates and how events affect the community.

**This is the FINAL PHASE** that ties together all previous systems (relationships, knowledge, conversations, lifecycle, economics) into cohesive community-level simulation.

---

## Core Prolog Predicates

### 1. Events & Gatherings

```prolog
% Event types
event_occurring(EventId, Type, Location, Timestep).
event_type(EventId, Type).  % festival, market_day, funeral, wedding, disaster

% Event attendance
attending(Character, EventId).
invited_to(Character, EventId).
hosting(Character, EventId).

% Event status
event_scheduled(EventId, Timestep).
event_in_progress(EventId).
event_completed(EventId, Timestep).

% Examples:
event_occurring(harvest_festival_001, festival, town_square, 1000).
attending(alice, harvest_festival_001).
hosting(mayor, harvest_festival_001).
event_completed(harvest_festival_001, 1005).
```

### 2. Festivals & Celebrations

```prolog
% Festival types
festival(EventId, FestivalType).  % harvest, midsummer, new_year, founder_day

% Celebration events
celebration(EventId, Reason).  % wedding, birth, promotion

% Festival attendance
celebrated_at(Character, EventId).
enjoyed_festival(Character, EventId).

% Examples:
festival(harvest_001, harvest_festival).
celebration(wedding_001, marriage_of_alice_and_bob).
enjoyed_festival(charlie, harvest_001).
```

### 3. Markets & Trade Fairs

```prolog
% Market events
market_day(EventId, Location, Timestep).
market_open(Location).

% Market participation
selling_at_market(Merchant, EventId, Goods).
shopping_at_market(Customer, EventId).

% Market activity
market_transaction(Seller, Buyer, Item, EventId).

% Examples:
market_day(market_001, town_square, 1000).
selling_at_market(baker, market_001, bread).
shopping_at_market(alice, market_001).
```

### 4. Community Meetings

```prolog
% Meeting types
town_meeting(EventId, Purpose, Timestep).
council_meeting(EventId, Attendees).

% Meeting participation
speaker_at(Character, EventId).
voted_at(Character, EventId, Choice).

% Decisions
decision_made(EventId, Topic, Outcome).

% Examples:
town_meeting(meeting_001, discuss_town_defense, 1000).
speaker_at(mayor, meeting_001).
voted_at(alice, meeting_001, yes).
decision_made(meeting_001, build_wall, approved).
```

### 5. Disasters & Emergencies

```prolog
% Disaster types
disaster(EventId, Type, Severity).  % fire, flood, plague, famine, attack

% Impact
affected_by_disaster(Character, EventId).
property_damaged(PropertyId, EventId, Severity).
casualty(Character, EventId).

% Response
responding_to(Character, EventId).
helped_during(Helper, Victim, EventId).

% Examples:
disaster(fire_001, fire, severe).
affected_by_disaster(alice, fire_001).
property_damaged(tavern_001, fire_001, moderate).
helped_during(bob, alice, fire_001).
```

### 6. Weddings & Funerals

```prolog
% Weddings
wedding(EventId, Spouse1, Spouse2, Timestep).
wedding_guest(Character, EventId).
wedding_witness(Character, EventId).

% Funerals
funeral(EventId, Deceased, Timestep).
mourner(Character, EventId).
gave_eulogy(Character, EventId).

% Examples:
wedding(wedding_001, alice, bob, 1000).
wedding_guest(charlie, wedding_001).
funeral(funeral_001, old_farmer, 1100).
mourner(alice, funeral_001).
```

### 7. Social Impact

```prolog
% Community cohesion
community_morale(Location, Level).  % 0-100
community_event_boost(EventId, Amount).

% Relationship effects
bonded_at_event(Character1, Character2, EventId).
conflict_at_event(Character1, Character2, EventId).

% Examples:
community_morale(town_square, 75).
bonded_at_event(alice, charlie, harvest_001).
```

---

## Prolog Rule Examples (For Simulation)

### Event Triggers

```prolog
% Rule: Schedule harvest festival in autumn
trigger_harvest_festival(World) :-
    current_season(World, autumn),
    \+ event_scheduled(_, harvest_festival),
    community_morale(World, Morale),
    Morale > 30.  % Need minimum morale
% Effect: scheduleEvent(world, harvest_festival, town_square, timestep)

% Rule: Hold market day weekly
trigger_market_day(Location) :-
    town_square(Location),
    current_day_of_week(market_day),
    \+ market_open(Location).
% Effect: openMarket(Location, timestep)
```

### Event Attendance

```prolog
% Rule: Attend festival with friends
trigger_attend_festival(Character, Event) :-
    event_occurring(Event, festival, Location, _),
    at_location(Character, Location),
    friends(Character, Friend),
    attending(Friend, Event),
    \+ attending(Character, Event).
% Effect: attendEvent(Character, Event)

% Rule: Attend wedding if close to couple
trigger_attend_wedding(Character, Event) :-
    wedding(Event, Spouse1, Spouse2, _),
    (family_of(Character, Spouse1); family_of(Character, Spouse2);
     friends(Character, Spouse1); friends(Character, Spouse2)),
    invited_to(Character, Event).
% Effect: attendEvent(Character, Event)

% Rule: Attend funeral of known person
trigger_attend_funeral(Character, Event) :-
    funeral(Event, Deceased, _),
    has_mental_model(Character, Deceased),
    relationship_charge(Character, Deceased, Charge),
    Charge > 0.  % Had positive relationship
% Effect: attendEvent(Character, Event)
```

### Social Effects

```prolog
% Rule: Bond with strangers at festival
trigger_festival_bonding(Character1, Character2, Event) :-
    attending(Character1, Event),
    attending(Character2, Event),
    festival(Event, _),
    at_same_location(Character1, Character2),
    \+ has_mental_model(Character1, Character2),
    random_chance(0.3).  % 30% chance
% Effect: initializeMentalModel, startConversation

% Rule: Help neighbor during disaster
trigger_disaster_help(Helper, Victim, Event) :-
    disaster(Event, _, _),
    affected_by_disaster(Victim, Event),
    at_same_location(Helper, Victim),
    \+ affected_by_disaster(Helper, Event),
    (friends(Helper, Victim); neighbors(Helper, Victim)),
    personality_trait(Helper, agreeableness, A),
    A > 0.6.
% Effect: helpDuringDisaster, boost relationship

% Rule: Community morale boost from successful event
trigger_morale_boost(Event) :-
    event_completed(Event, _),
    festival(Event, _),
    attending(_, Event),  % Someone attended
    count_attendees(Event, Count),
    Count > 10.  % Well-attended
% Effect: Increase community_morale by 10
```

### Market Events

```prolog
% Rule: Sell goods at market
trigger_market_selling(Merchant, Event) :-
    market_day(Event, Location, _),
    owns_business(Merchant, Business),
    business_location(Business, Location),
    has_goods(Business, _, Quantity),
    Quantity > 5.  % Has goods to sell
% Effect: startSellingAtMarket(Merchant, Event)

% Rule: Shop at market when poor
trigger_market_shopping(Customer, Event) :-
    market_day(Event, Location, _),
    at_location(Customer, Location),
    has_money(Customer, Money),
    Money < 50,  % Running low
    \+ shopping_at_market(Customer, Event).
% Effect: attendMarket(Customer, Event)
```

---

## Data Structures (TypeScript)

### Town Event

```typescript
interface TownEvent {
  id: string;
  worldId: string;
  type: EventType;
  name: string;
  description: string;
  
  // Timing
  scheduledTimestep: number;
  startTimestep?: number;
  endTimestep?: number;
  duration: number;  // in timesteps
  
  // Location
  location: string;
  
  // Participation
  organizers: string[];  // Character IDs
  attendees: string[];
  invited: string[];
  
  // Effects
  moraleImpact: number;
  economicImpact?: number;
  casualties?: string[];  // Character IDs
  
  // Outcomes
  outcomes: string[];
  decisionsRest: Record<string, any>;
}

type EventType = 
  | 'festival'
  | 'market'
  | 'wedding'
  | 'funeral'
  | 'town_meeting'
  | 'disaster'
  | 'celebration'
  | 'emergency';
```

### Festival

```typescript
interface Festival extends TownEvent {
  festivalType: 'harvest' | 'midsummer' | 'new_year' | 'founders_day' | 'seasonal';
  activities: FestivalActivity[];
  foodServed: string[];
  entertainment: string[];
}

interface FestivalActivity {
  name: string;
  participants: string[];
  startTime: number;
  duration: number;
}
```

### Market Event

```typescript
interface MarketEvent extends TownEvent {
  vendors: Array<{
    merchantId: string;
    businessId: string;
    goodsOffered: string[];
  }>;
  trades: Trade[];  // From economics system
  totalRevenue: number;
}
```

### Disaster

```typescript
interface Disaster extends TownEvent {
  disasterType: 'fire' | 'flood' | 'plague' | 'famine' | 'attack' | 'storm';
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  
  // Impact
  buildingsDamaged: Array<{
    buildingId: string;
    damageLevel: number;  // 0-1
  }>;
  casualties: string[];
  injured: string[];
  economicLoss: number;
  
  // Response
  responders: string[];
  helpProvided: Array<{
    helperId: string;
    victimId: string;
    aid: string;
  }>;
  recoveryTime: number;
}
```

### Community Meeting

```typescript
interface CommunityMeeting extends TownEvent {
  purpose: string;
  agenda: string[];
  
  // Participation
  speakers: string[];
  attendees: string[];
  
  // Voting
  votingTopics: Array<{
    topic: string;
    options: string[];
    votes: Record<string, string>;  // characterId -> choice
    outcome: string;
  }>;
  
  // Decisions
  decisions: Array<{
    topic: string;
    decision: string;
    supporters: string[];
    opposers: string[];
  }>;
}
```

---

## Event Scheduling & Triggers

### Regular Events

```typescript
// Annual festivals
const ANNUAL_EVENTS = {
  harvest_festival: { season: 'autumn', day: 15 },
  midsummer_festival: { season: 'summer', day: 21 },
  new_year_celebration: { month: 1, day: 1 },
  founders_day: { month: 6, day: 10 }
};

// Weekly events
const WEEKLY_EVENTS = {
  market_day: { dayOfWeek: 'saturday' },
  town_meeting: { dayOfWeek: 'sunday', frequency: 'monthly' }
};
```

### Random Events

```typescript
function checkRandomEvents(worldId: string, timestep: number): EventType[] {
  const events: EventType[] = [];
  
  // Fire (0.5% chance per timestep)
  if (Math.random() < 0.005) {
    events.push('fire');
  }
  
  // Storm (1% chance)
  if (Math.random() < 0.01) {
    events.push('storm');
  }
  
  // Community celebration (when something good happens)
  const recentWeddings = getRecentEvents(worldId, 'wedding', 10);
  if (recentWeddings.length > 0) {
    events.push('celebration');
  }
  
  return events;
}
```

---

## API Endpoints (Setup Utilities)

### Event Management

```typescript
// Schedule event
POST /api/events/schedule
{ worldId, type, name, location, scheduledTimestep, duration }

// Start event
POST /api/events/:id/start
{ currentTimestep }

// End event
POST /api/events/:id/end
{ currentTimestep }

// Get event details
GET /api/events/:id

// Get all events for world
GET /api/events/world/:worldId
```

### Event Participation

```typescript
// Add attendee
POST /api/events/:id/attend
{ characterId }

// Remove attendee
POST /api/events/:id/leave
{ characterId }

// Get event attendees
GET /api/events/:id/attendees
```

### Specific Event Types

```typescript
// Schedule festival
POST /api/events/festival
{ worldId, festivalType, location, scheduledTimestep }

// Schedule market
POST /api/events/market
{ worldId, location, scheduledTimestep }

// Schedule wedding
POST /api/events/wedding
{ worldId, spouse1Id, spouse2Id, location, scheduledTimestep }

// Schedule funeral
POST /api/events/funeral
{ worldId, deceasedId, location, scheduledTimestep }

// Trigger disaster
POST /api/events/disaster
{ worldId, disasterType, severity, location, currentTimestep }
```

### Community Statistics

```typescript
// Get community morale
GET /api/community/:worldId/morale

// Get event history
GET /api/events/world/:worldId/history

// Get upcoming events
GET /api/events/world/:worldId/upcoming
```

---

## Event Effects

### Festival Effects

```typescript
function processFestivalEffects(festival: Festival): void {
  // Morale boost
  increaseCommunityMorale(festival.worldId, 10);
  
  // Relationship bonding
  for (const char1 of festival.attendees) {
    for (const char2 of festival.attendees) {
      if (char1 !== char2) {
        // Small relationship boost for all attendees
        updateRelationship(char1, char2, +1);
        
        // Chance to form new friendships
        if (Math.random() < 0.1) {
          initializeMentalModel(char1, char2, ['name'], 'stranger');
        }
      }
    }
  }
  
  // Economic activity (food, entertainment costs)
  for (const attendee of festival.attendees) {
    subtractMoney(attendee, 5, 'Festival participation');
  }
}
```

### Disaster Effects

```typescript
function processDisasterEffects(disaster: Disaster): void {
  // Morale decrease
  decreaseCommunityMorale(disaster.worldId, disaster.severity === 'severe' ? 30 : 15);
  
  // Character casualties
  for (const casualtyId of disaster.casualties) {
    die(casualtyId, 'disaster', disaster.location, disaster.startTimestep);
  }
  
  // Economic damage
  for (const damaged of disaster.buildingsDamaged) {
    // Damage business/residence
    const loss = damaged.damageLevel * 1000;
    // Subtract from owner wealth
  }
  
  // Relationship boost for helpers
  for (const help of disaster.helpProvided) {
    updateRelationship(help.helperId, help.victimId, +5);
    
    // Trust boost
    const rel = getRelationship(help.victimId, help.helperId);
    rel.trust += 0.2;
  }
}
```

---

## Integration with Previous Phases

### Phase 5 (Relationships)
```typescript
// Events boost relationships
bonded_at_event(alice, bob, festival_001);
// → Increase relationship_charge(alice, bob, +2)
```

### Phase 6 (Knowledge)
```typescript
// Events spread information
attending(alice, wedding_001);
attending(bob, wedding_001);
// → Both learn about the newlyweds
```

### Phase 7 (Conversations)
```typescript
// Events trigger conversations
at_event(alice, festival_001);
at_event(bob, festival_001);
// → trigger_conversation(alice, bob)
```

### Phase 8 (Lifecycle)
```typescript
// Weddings and funerals are events
wedding(alice, bob) → schedule wedding event
death(charlie) → schedule funeral event
```

### Phase 9 (Economics)
```typescript
// Markets are economic events
market_day(town_square) → trading opportunities
// Disasters affect economy
disaster(fire) → economic losses
```

---

## Success Criteria

✅ **Event scheduling** system  
✅ **Festival mechanics** with attendance  
✅ **Market events** with trading  
✅ **Disaster simulation** with casualties  
✅ **Community morale** tracking  
✅ **Wedding/funeral** events  
✅ **Town meetings** with voting  
✅ **Integration** with all 5 previous phases  

---

## Next Steps

1. Implement TypeScript events system
2. Add event scheduling logic
3. Implement festival mechanics
4. Add disaster simulation
5. Create community morale system
6. Add API endpoints
7. Test event flows
8. **COMPLETE ENTIRE TotT INTEGRATION!**

---

**Phase 10 completes the simulation** by adding community-level dynamics that tie together all individual character behaviors into cohesive town-wide events! 🎪🏘️
