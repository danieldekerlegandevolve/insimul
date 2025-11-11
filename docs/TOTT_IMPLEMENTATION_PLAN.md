# Talk of the Town - Implementation Plan

## Overview

This plan completes the remaining 60% of TotT integration by implementing core systems as extensions following the existing Insimul pattern.

**Status:** Types integrated (40% complete) → Implement logic & API (60% remaining)

**Timeline:** 4 phases, can be implemented incrementally

---

## Phase 1: Hiring System (Priority: HIGH)

**Goal:** Enable businesses to hire/fire characters with relationship-based preferences

### Extension: `server/extensions/hiring-system.ts`

**Functions to implement:**

1. **`evaluateCandidate()`** - Score candidates for a position
   ```typescript
   export async function evaluateCandidate(
     businessId: string,
     candidateId: string,
     vocation: OccupationVocation,
     hiringManagerId: string
   ): Promise<{
     qualified: boolean;
     score: number;
     breakdown: {
       qualificationScore: number;
       relationshipBonus: number;
       experienceBonus: number;
     };
   }>
   ```

2. **`fillVacancy()`** - Hire a character
   ```typescript
   export async function fillVacancy(
     businessId: string,
     candidateId: string,
     vocation: OccupationVocation,
     shift: ShiftType,
     hiringManagerId: string
   ): Promise<void>
   ```

3. **`fireEmployee()`** - Terminate employment
   ```typescript
   export async function fireEmployee(
     occupationId: string,
     reason: TerminationReason
   ): Promise<void>
   ```

4. **`findCandidates()`** - Get qualified candidates for a vacancy
   ```typescript
   export async function findCandidates(
     businessId: string,
     vocation: OccupationVocation,
     shift: ShiftType,
     limit?: number
   ): Promise<Array<{ characterId: string; score: number }>>
   ```

5. **`getBusinessEmployees()`** - List all employees
   ```typescript
   export async function getBusinessEmployees(
     businessId: string
   ): Promise<Occupation[]>
   ```

**Key Logic:**
- Check character qualifications (age, education, experience)
- Calculate relationship bonuses (family, friends get preference)
- Query existing relationships from `relationship-utils.ts`
- Store in existing `occupations` table
- Update character's `currentOccupationId`

### Routes to add in `server/routes.ts`

```typescript
import { 
  evaluateCandidate, 
  fillVacancy, 
  fireEmployee, 
  findCandidates,
  getBusinessEmployees 
} from "./extensions/hiring-system.js";

// Get all employees at a business
app.get("/api/businesses/:id/employees", async (req, res) => { ... });

// Find candidates for a position
app.post("/api/businesses/:id/find-candidates", async (req, res) => { ... });

// Hire a character
app.post("/api/businesses/:id/hire", async (req, res) => { ... });

// Fire an employee
app.delete("/api/occupations/:id", async (req, res) => { ... });

// Evaluate a candidate (dry run)
app.post("/api/businesses/:id/evaluate", async (req, res) => { ... });
```

**Testing:**
- Create test with a business and multiple candidates
- Verify relationship bonuses work (family member scores higher)
- Test hiring workflow end-to-end
- Verify occupation record created correctly

---

## Phase 2: Event System (Priority: HIGH)

**Goal:** Generate and track life events (births, deaths, marriages, careers, etc.)

### Extension: `server/extensions/event-system.ts`

**Functions to implement:**

1. **`generateEvent()`** - Create a life event
   ```typescript
   export async function generateEvent(
     eventType: EventType,
     primaryCharacterId: string,
     secondaryCharacterId?: string,
     details?: Record<string, any>
   ): Promise<{
     id: string;
     timestamp: number;
     narrative: string;
   }>
   ```

2. **`getCharacterEvents()`** - Get event history
   ```typescript
   export async function getCharacterEvents(
     characterId: string,
     eventTypes?: EventType[],
     limit?: number
   ): Promise<any[]>
   ```

3. **`getWorldEvents()`** - Get world timeline
   ```typescript
   export async function getWorldEvents(
     worldId: string,
     startTime?: number,
     endTime?: number
   ): Promise<any[]>
   ```

4. **`triggerAutomaticEvents()`** - Generate time-based events
   ```typescript
   export async function triggerAutomaticEvents(
     worldId: string,
     currentTime: number
   ): Promise<EventType[]>
   ```

**Event Types to Support:**

**Life Events:**
- `birth` - Generate child for married couple
- `death` - Character passes away (age, accident, etc.)
- `marriage` - Two characters marry
- `divorce` - Marriage ends

**Career Events:**
- `hiring` - Character gets job (integrated with hiring system)
- `retirement` - Character retires from occupation
- `promotion` - Character gets promoted
- `graduation` - Character completes education

**Economic Events:**
- `home_purchase` - Character buys residence
- `business_founding` - Character starts business
- `business_closure` - Business shuts down

**Social Events:**
- `move` - Character relocates
- `departure` - Character leaves world
- `festival` - Community event
- `election` - Political event
- `crime` - Criminal incident
- `accident` - Mishap occurs

**Key Logic:**
- Store events in character's `characterHistory` JSONB field
- Store world events in world's `historicalEvents` array
- Generate narrative text for each event
- Apply side effects (update relationships, status, etc.)
- Trigger cascading events (death → inheritance, marriage → move)

### Routes to add in `server/routes.ts`

```typescript
import { 
  generateEvent, 
  getCharacterEvents, 
  getWorldEvents,
  triggerAutomaticEvents 
} from "./extensions/event-system.js";

// Generate a specific event
app.post("/api/events/generate", async (req, res) => { ... });

// Get character's event history
app.get("/api/characters/:id/events", async (req, res) => { ... });

// Get world timeline
app.get("/api/worlds/:id/events", async (req, res) => { ... });

// Trigger automatic time-based events
app.post("/api/worlds/:id/advance-time", async (req, res) => { ... });
```

**Testing:**
- Generate marriage event, verify both characters updated
- Test death event with inheritance
- Verify events appear in character history
- Test world timeline query

---

## Phase 3: Routine System (Priority: MEDIUM)

**Goal:** Characters have daily schedules and track whereabouts

### Extension: `server/extensions/routine-system.ts`

**Functions to implement:**

1. **`setRoutine()`** - Define character's schedule
   ```typescript
   export async function setRoutine(
     characterId: string,
     timeOfDay: TimeOfDay,
     location: string,
     activity: ActivityOccasion,
     duration: number
   ): Promise<void>
   ```

2. **`getCurrentActivity()`** - What is character doing now
   ```typescript
   export async function getCurrentActivity(
     characterId: string,
     currentTime: number
   ): Promise<{
     location: string;
     activity: ActivityOccasion;
     locationType: LocationType;
   }>
   ```

3. **`getCharactersAtLocation()`** - Who is at a location
   ```typescript
   export async function getCharactersAtLocation(
     locationId: string,
     currentTime: number
   ): Promise<Character[]>
   ```

4. **`updateWhereabouts()`** - Log character movement
   ```typescript
   export async function updateWhereabouts(
     characterId: string,
     location: string,
     locationType: LocationType,
     occasion: ActivityOccasion
   ): Promise<void>
   ```

5. **`generateDefaultRoutine()`** - Create routine based on occupation
   ```typescript
   export async function generateDefaultRoutine(
     characterId: string
   ): Promise<void>
   ```

**Key Logic:**
- Use existing `whereabouts` table for location tracking
- Store routines in character's `customData` field
- Default routines based on occupation:
  - Day shift workers: work during day, home at night
  - Night shift workers: sleep during day, work at night
  - Unemployed: varied activities
- Consider personality (extroverts socialize more, etc.)

### Routes to add in `server/routes.ts`

```typescript
import { 
  setRoutine, 
  getCurrentActivity, 
  getCharactersAtLocation,
  updateWhereabouts,
  generateDefaultRoutine 
} from "./extensions/routine-system.js";

// Set character routine
app.post("/api/characters/:id/routine", async (req, res) => { ... });

// Get current activity
app.get("/api/characters/:id/current-activity", async (req, res) => { ... });

// Get characters at location
app.get("/api/locations/:id/characters", async (req, res) => { ... });

// Update whereabouts manually
app.post("/api/characters/:id/whereabouts", async (req, res) => { ... });

// Generate default routine
app.post("/api/characters/:id/generate-routine", async (req, res) => { ... });
```

**Testing:**
- Create character with job, generate routine
- Verify character at work during work hours
- Test location queries
- Verify whereabouts history tracked

---

## Phase 4: Business Management (Priority: MEDIUM)

**Goal:** Manage business lifecycle, vacancies, and operations

### Extension: `server/extensions/business-system.ts`

**Functions to implement:**

1. **`createBusiness()`** - Found a new business
   ```typescript
   export async function createBusiness(
     worldId: string,
     settlementId: string,
     founderId: string,
     businessType: BusinessType,
     name: string
   ): Promise<string>
   ```

2. **`closeBusiness()`** - Shut down business
   ```typescript
   export async function closeBusiness(
     businessId: string,
     reason: string
   ): Promise<void>
   ```

3. **`addVacancy()`** - Post job opening
   ```typescript
   export async function addVacancy(
     businessId: string,
     vocation: OccupationVocation,
     shift: ShiftType,
     isSupplemental: boolean
   ): Promise<void>
   ```

4. **`removeVacancy()`** - Remove job posting
   ```typescript
   export async function removeVacancy(
     businessId: string,
     vocation: OccupationVocation,
     shift: ShiftType
   ): Promise<void>
   ```

5. **`getBusinessVacancies()`** - List open positions
   ```typescript
   export async function getBusinessVacancies(
     businessId: string
   ): Promise<BusinessVacancy[]>
   ```

6. **`transferOwnership()`** - Change business owner
   ```typescript
   export async function transferOwnership(
     businessId: string,
     newOwnerId: string
   ): Promise<void>
   ```

**Key Logic:**
- Use existing `businesses` table
- Store vacancies in `vacancies` JSONB field
- On business founding, create owner occupation
- On business closure, fire all employees
- Generate business founding/closure events

### Routes to add in `server/routes.ts`

```typescript
import { 
  createBusiness, 
  closeBusiness, 
  addVacancy,
  removeVacancy,
  getBusinessVacancies,
  transferOwnership 
} from "./extensions/business-system.js";

// Create new business
app.post("/api/businesses", async (req, res) => { ... });

// Close business
app.delete("/api/businesses/:id", async (req, res) => { ... });

// Manage vacancies
app.post("/api/businesses/:id/vacancies", async (req, res) => { ... });
app.delete("/api/businesses/:id/vacancies", async (req, res) => { ... });
app.get("/api/businesses/:id/vacancies", async (req, res) => { ... });

// Transfer ownership
app.post("/api/businesses/:id/transfer", async (req, res) => { ... });
```

**Testing:**
- Found a business, verify owner occupation created
- Add vacancies, verify stored correctly
- Close business, verify employees terminated
- Test ownership transfer

---

## Implementation Strategy

### Order of Implementation

**Week 1: Hiring System** (Foundation)
- Most critical for world simulation
- Required by other systems (events, business)
- Clear scope, well-defined

**Week 2: Event System** (Core Functionality)
- Adds narrative depth
- Integrates with hiring system
- Enables world progression

**Week 3: Routine System** (Immersion)
- Depends on hiring (work schedules)
- Adds realism
- Enables location-based interactions

**Week 4: Business Management** (Polish)
- Completes the loop
- Enables player-created content
- Advanced features

### Shared Patterns Across All Extensions

**1. Error Handling:**
```typescript
export async function someFunction(...): Promise<Result> {
  try {
    // Validate inputs
    if (!param) {
      throw new Error("Missing required parameter");
    }
    
    // Check prerequisites
    const entity = await storage.getEntity(id);
    if (!entity) {
      throw new Error("Entity not found");
    }
    
    // Execute logic
    const result = await doWork();
    
    return result;
  } catch (error) {
    console.error(`Error in someFunction:`, error);
    throw error; // Re-throw for route handlers
  }
}
```

**2. Use Existing Storage Methods:**
```typescript
import { storage } from '../storage';

// Always use storage layer, never direct DB access
await storage.getCharacter(id);
await storage.updateCharacter(id, updates);
await storage.createOccupation(data);
```

**3. Type Safety:**
```typescript
import type { 
  OccupationVocation, 
  BusinessType, 
  EventType,
  ShiftType 
} from '../../shared/schema';

// Use imported types for all parameters
```

**4. Integration with Other Extensions:**
```typescript
import { queryRelationships } from './relationship-utils.js';
import { addImpulse } from './impulse-system.js';

// Use other extensions when appropriate
// e.g., hiring considers relationships, events add impulses
```

### Testing Strategy

**Unit Tests** (Optional but recommended):
- Create `server/extensions/__tests__/` directory
- Test each function in isolation
- Mock storage layer

**Integration Tests:**
- Use existing world from `mongo-init-simple.ts`
- Test workflows end-to-end
- Verify database state changes

**Manual Testing:**
- Create test scripts in `server/test-worlds/`
- Follow pattern of `world-generator-historical.ts`
- Test through API endpoints

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Can hire character to fill business vacancy
- ✅ Relationship bonuses affect hiring decisions
- ✅ Occupation records created correctly
- ✅ Can fire employee with termination reason

### Phase 2 Complete When:
- ✅ Can generate all 17 event types
- ✅ Events stored in character and world history
- ✅ Events trigger side effects (marriage → relationship update)
- ✅ Automatic time-based events work

### Phase 3 Complete When:
- ✅ Characters have daily routines
- ✅ Whereabouts tracked over time
- ✅ Can query who is at a location
- ✅ Routines based on occupation and personality

### Phase 4 Complete When:
- ✅ Can found and close businesses
- ✅ Vacancies managed properly
- ✅ Business closure terminates employees
- ✅ Ownership transfer works

### TotT 100% Complete When:
- ✅ All 4 phases done
- ✅ All routes added to `routes.ts`
- ✅ Integration tests passing
- ✅ Documentation updated
- ✅ Example world demonstrates all features

---

## Future Enhancements (Beyond 100%)

**Not required for completion, but nice to have:**

1. **Mental Models** - Characters track beliefs about others
2. **Inheritance System** - Assets passed on death
3. **Education System** - Characters attend school, graduate
4. **Romance System** - Dating, proposals, marriages
5. **Crime & Justice** - Crimes committed, trials held
6. **Political System** - Elections, mayors, governance
7. **Economic Simulation** - Salaries, expenses, wealth tracking

---

## File Checklist

### New Files to Create:
- [ ] `server/extensions/hiring-system.ts`
- [ ] `server/extensions/event-system.ts`
- [ ] `server/extensions/routine-system.ts`
- [ ] `server/extensions/business-system.ts`

### Files to Modify:
- [ ] `server/routes.ts` - Add ~20-30 new endpoints
- [ ] `server/storage.ts` - Add helper methods if needed

### Documentation to Update:
- [ ] `docs/TOTT_INTEGRATION_ANALYSIS.md` - Mark phases complete
- [ ] `docs/API.md` - Document new endpoints (if exists)
- [ ] `README.md` - Update feature list

---

## Estimated Effort

**Per Phase:**
- Extension file: 4-6 hours
- Route integration: 2-3 hours
- Testing: 2-3 hours
- **Total per phase: 8-12 hours**

**All 4 Phases: 32-48 hours** (1-2 weeks full-time, or 4-6 weeks part-time)

**Note:** Phases can be implemented incrementally and merged separately. Each phase adds value independently.
