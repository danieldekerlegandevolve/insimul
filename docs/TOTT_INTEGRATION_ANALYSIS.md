# Talk of the Town Integration Analysis

## Current State

### ✅ What's Implemented

**Database Tables (in `shared/schema.ts`):**
- ✅ `occupations` - Character employment history and current jobs
- ✅ `businesses` - Companies and organizations that employ characters
- ✅ `lots` - Physical land parcels and buildings
- ✅ `whereabouts` - Character location tracking over time
- ✅ Character table has TotT fields: `currentOccupationId`, `currentResidenceId`, `collegeGraduate`, `retired`
- ✅ Character personality uses Big Five model (openness, conscientiousness, extroversion, agreeableness, neuroticism)

**Example Content:**
- ✅ `server/rules/tott-example-rules.ts` - 15 example TotT rules for employment, relationships, businesses
- ✅ `server/database/mongo-init-simple.ts` - Sample world seed with TotT data
- ✅ `server/test-worlds/world-generator-historical.ts` - Historical world generation with TotT

**Parser Integration:**
- ✅ `client/src/lib/unified-syntax.ts` - TotT syntax parsing (compileTott method)
- ✅ `server/routes.ts` - TotT validation rules
- ✅ `server/gemini-ai.ts` - AI generation for TotT format

### ❌ What's Missing/Broken

**Type Definitions:**
- ❌ `server/types/tott-types.ts` exists but is **NEVER IMPORTED** anywhere
- ❌ Schema uses generic `text()` instead of strongly-typed enums
- ❌ No type safety for vocations, business types, event types, etc.

**Runtime Implementation:**
- ❌ No hiring system implementation (types defined but no logic)
- ❌ No routine/schedule system implementation  
- ❌ No business management implementation
- ❌ No event generation system (births, deaths, marriages, etc.)
- ❌ Helper functions in tott-types.ts are orphaned

**API Endpoints:**
- ❌ No `/api/tott/*` routes (unlike Kismet which has `/api/kismet/*`)
- ❌ No occupation management endpoints
- ❌ No business management endpoints
- ❌ No hiring/firing endpoints

## Detailed Type Analysis

### Types Defined in `tott-types.ts` (ORPHANED)

#### Used in Schema (but not imported):
1. **OccupationVocation** (78 occupation types) → `occupations.vocation` uses `text()` 
2. **BusinessType** (29 business types) → `businesses.businessType` uses `text()`
3. **BigFivePersonality** → `characters.personality` uses jsonb with same structure
4. **ShiftType** ('day' | 'night') → `occupations.shift` uses `text()`
5. **TerminationReason** → `occupations.terminationReason` uses `text()`
6. **EventType** → Not used in schema at all
7. **TimeOfDay** → Not used in schema
8. **ActivityOccasion** → `whereabouts.occasion` uses `text()`
9. **LocationType** → `whereabouts.locationType` uses `text()`
10. **ResidenceType** → Not used in schema
11. **BuildingType** → `lots.buildingType` uses `text()`

#### Interfaces Not in Schema:
- `OccupationLevel` - Occupation hierarchy levels
- `BusinessVacancy` - Job opening structure (embedded in businesses.vacancies)
- `ApartmentUnit` - Apartment complex units (embedded in businesses.businessData)
- `BusinessData` - Business-specific data (embedded in businesses.businessData)
- `DerivedTraits` - Personality-derived traits (gregarious, cold, creative, etc.)
- `MentalModel` - Character beliefs about others
- `Thought` - Character thoughts
- `EventSideEffect` - Event consequences
- `RoutineDecision` - Daily routine planning
- `HiringCandidate` - Job applicant evaluation
- `HiringPreferences` - Hiring bias configuration
- `QualificationRequirement` - Job requirements
- `OccupationConfig` - Occupation configuration
- `TotTConfig` - World configuration for TotT

#### Helper Functions (ORPHANED):
- `getPersonalityStrength()` - Convert numeric to descriptive strength
- `calculateDerivedTraits()` - Derive personality traits
- `generatePersonExNihiloAge()` - Generate age for new character
- `calculateYearsExperience()` - Calculate work experience
- `isQualifiedForOccupation()` - Check if character meets requirements
- `formatDate()` - Format TotT dates

## Integration Gaps

### Critical Missing Features

1. **No Hiring System**
   - Types defined but no implementation
   - No candidate evaluation
   - No relationship-based hiring
   - No qualification checking

2. **No Event Generation**
   - EventType enum defined but unused
   - No births, deaths, marriages, divorces
   - No business founding/closure
   - No promotions, retirements

3. **No Routine System**
   - ActivityOccasion and RoutineDecision defined but unused
   - Characters don't have daily schedules
   - No time-of-day behavior

4. **No Mental Models**
   - MentalModel interface defined but unused
   - Characters don't track beliefs about others
   - No theory of mind

5. **No Business Management**
   - Tables exist but no logic
   - No vacancy filling
   - No revenue/expenses
   - No business lifecycle

## Comparison with Existing Extensions Pattern

**Current Extensions (COMPLETE):**
- ✅ `server/extensions/impulse-system.ts` - Impulse management
- ✅ `server/extensions/relationship-utils.ts` - Relationship management
- ✅ `server/extensions/volition-system.ts` - Action selection
- ✅ Imported directly into `server/routes.ts`
- ✅ Integrated endpoints: `/api/characters/:id/impulse`, `/api/characters/:id/relationship`, etc.
- ✅ Uses existing schema fields (mentalModels, socialAttributes)

**TotT (INCOMPLETE):**
- ⚠️ Types were in `server/types/tott-types.ts` (now moved to `shared/schema.ts`)
- ❌ No extension files in `server/extensions/`
- ❌ No integrated routes in `server/routes.ts`
- ✅ Database schema exists (occupations, businesses, lots tables)
- ✅ Example rules exist
- ❌ Core features not implemented

## Recommended Actions

### Phase 1: Type Integration (Immediate)
1. **Move types to schema.ts** - Integrate TotT types where they're actually needed
2. **Add type safety** - Use enums instead of generic text fields
3. **Delete orphaned file** - Remove unused `server/types/tott-types.ts`

### Phase 2: Extension Implementation (Following Existing Pattern)
Create extension files in `server/extensions/` following the pattern of `impulse-system.ts`:

1. **Hiring System** (`server/extensions/hiring-system.ts`)
   - Export functions: `evaluateCandidate()`, `fillVacancy()`, `fireEmployee()`
   - Store in existing `occupations` table
   - Integrate into `routes.ts` as `/api/businesses/:id/hire`

2. **Event System** (`server/extensions/event-system.ts`)
   - Export functions: `generateLifeEvent()`, `processEvent()`, `getEventHistory()`
   - Store events in character/world history fields
   - Integrate into `routes.ts` as `/api/characters/:id/events`

3. **Routine System** (`server/extensions/routine-system.ts`)
   - Export functions: `setRoutine()`, `getCurrentActivity()`, `updateSchedule()`
   - Use existing `whereabouts` table
   - Integrate into `routes.ts` as `/api/characters/:id/routine`

4. **Business Management** (`server/extensions/business-system.ts`)
   - Export functions: `createBusiness()`, `manageBusiness()`, `closeB usiness()`
   - Use existing `businesses` table
   - Integrate into `routes.ts` as `/api/businesses/:id/manage`

### Phase 3: Routes Integration
Add endpoints directly to `server/routes.ts` following the existing pattern:

```typescript
// In routes.ts, import extensions:
import { evaluateCandidate, fillVacancy } from "./extensions/hiring-system.js";
import { generateLifeEvent } from "./extensions/event-system.js";
import { setRoutine, getCurrentActivity } from "./extensions/routine-system.js";

// Add integrated endpoints:
app.post("/api/businesses/:id/hire", async (req, res) => { ... });
app.get("/api/characters/:id/events", async (req, res) => { ... });
app.post("/api/characters/:id/routine", async (req, res) => { ... });
```

## File Structure (Correct Pattern)

```
server/
  extensions/
    impulse-system.ts         # ✅ Existing
    relationship-utils.ts     # ✅ Existing
    volition-system.ts        # ✅ Existing
    hiring-system.ts          # 🆕 To implement
    event-system.ts           # 🆕 To implement
    routine-system.ts         # 🆕 To implement
    business-system.ts        # 🆕 To implement
  routes.ts                   # Add integrated endpoints
```

## Conclusion

**TotT integration is ~30% complete:**
- ✅ Database schema (100%)
- ✅ Example rules (100%)
- ✅ Parser integration (100%)
- ❌ Type safety (0%)
- ❌ Core systems (0%)
- ❌ API endpoints (0%)

The foundation is solid but **no actual TotT logic is running**. The system can store TotT data but doesn't generate or manage it automatically.
