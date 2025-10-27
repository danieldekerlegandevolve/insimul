# Schema Cleanup: Time Field Removal

## Overview
Removed hardcoded time tracking fields from entity schemas. Time should be managed through the simulation/timestep system, not baked into entity records. Entities should represent timeless structures with layers of history that users can scrub through.

## Changes Made

### Schema Updates (`shared/schema.ts`)

#### Removed from `countries` table:
- `currentYear` - Current year for the country
- `currentMonth` - Current month (1-12)  
- `currentDay` - Current day (1-31)

**Kept:**
- `foundedYear` - Historical fact, immutable
- `dissolvedYear` - Historical fact, immutable

#### Removed from `settlements` table:
- `currentYear` - Current year for the settlement
- `currentMonth` - Current month (1-12)
- `currentDay` - Current day (1-31)
- `timeOfDay` - Time of day indicator (day/night)
- `ordinalDate` - Numerical date representation

**Kept:**
- `foundedYear` - Historical fact, immutable

### Database Migration
Created `server/migrations/0003_remove_entity_time_fields.sql` to drop the columns from existing databases.

### Code Updates

#### Frontend:
- **WorldSelectionScreen.tsx** - Removed currentYear display from world cards
- **WorldDetailsDialog.tsx** - Removed currentYear editing and display
- **ProceduralGenerateTab.tsx** - Removed currentYear config input
- **GenerateTab.tsx** - Removed currentYear config input

#### Backend:
- **migrate-to-geographical-hierarchy.ts** - Removed currentYear from legacy world interface

## Rationale

### Why Remove These Fields?

1. **Time is Simulation State** - Time belongs to simulation runs, not entity definitions. A country doesn't "have" a current year - simulations run AT a certain time viewing the country's state.

2. **Historical Layers** - Users should be able to view entities at different points in history. Hardcoding `currentYear` makes this impossible. The correct model is:
   - Entity: "Kingdom of Eldoria" (timeless definition)
   - Historical snapshots: State of Eldoria in year 1200, 1300, 1400, etc.
   
3. **Truth System** - Time-specific facts belong in the Truth system, not entity schemas:
   - ✅ Truth: "In year 1250, Queen Helena ruled Eldoria"
   - ❌ Country field: `currentYear: 1250`

4. **Simulation Architecture** - Proper simulation architecture separates:
   - **Static entities**: Countries, settlements (timeless structures)
   - **Dynamic state**: Character positions, relationships, governance (tracked per timestep)
   - **Historical records**: Truth entries, events (timestamped facts)

### What Should Use Time Instead?

**Simulation Runs:**
```typescript
{
  startTime: 1200,
  endTime: 1300,
  currentTimestep: 145,
  results: [...]
}
```

**Truth Entries:**
```typescript
{
  timeYear: 1250,
  timeSeason: 'summer',
  content: 'Queen Helena ascended to the throne'
}
```

**Timestep-Based Snapshots:**
- Character positions at time T
- Settlement populations at time T
- Relationship states at time T

## Migration Guide

### For Genealogy Generation
The genealogy generator previously used `currentYear` to determine character ages. Now it should:
- Accept `foundedYear` and `generations` as parameters
- Calculate end year: `endYear = foundedYear + (generations * 25)`
- Generate characters born between foundedYear and endYear

### For Character Age Display
Instead of:
```typescript
const age = currentYear - character.birthYear;
```

Use:
```typescript
// Display age relative to a simulation year or "present"
const simulationYear = simulation?.currentYear || new Date().getFullYear();
const age = simulationYear - character.birthYear;
```

### For Historical Queries
Instead of storing time on entities, query the Truth system:
```typescript
// Get state of country at specific time
const truths = await getTruthsByEntity(countryId, { 
  timeYear: 1250 
});
```

## Future Work

1. **Timestep System** - Implement proper timestep/tick system for simulations
2. **Historical Snapshots** - Add snapshot functionality to capture entity states at specific times
3. **Time Travel UI** - Allow users to scrub through historical layers
4. **Temporal Queries** - Query system that can reconstruct entity state at any point in time

## Impact

### Breaking Changes
- API responses no longer include `currentYear`, `currentMonth`, `currentDay` for countries/settlements
- Frontend components no longer display or edit these fields
- Genealogy generation must be updated to calculate end year from parameters

### Benefits
- Cleaner separation of concerns
- Enables historical viewing and time travel features  
- Aligns with proper simulation architecture
- Reduces confusion about "current" state vs historical state
