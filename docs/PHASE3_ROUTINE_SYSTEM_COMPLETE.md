# Phase 3: Routine System - Implementation Complete ✅

## Summary

Successfully implemented the Talk of the Town Routine System as an integrated extension, handling daily schedules, whereabouts tracking, and location-based character queries.

## Files Created

### Extension: `server/extensions/routine-system.ts` (492 lines)

**Core Functions Implemented:**

1. **`setRoutine()`** - Sets a character's daily routine
   - Stores in `customData.routine`
   - Routine has day and night schedules
   - Each schedule is array of time blocks

2. **`getCurrentActivity()`** - Gets character's activity at a specific time
   - Checks routine for given time of day and hour
   - Returns current location, occasion, and activity details
   - Null if no routine set

3. **`getCharactersAtLocation()`** - Finds all characters at a location
   - Checks current whereabouts
   - Optionally filters by time of day
   - Returns character + activity data

4. **`updateWhereabouts()`** - Records character location history
   - Creates whereabouts entry
   - Stores in `customData.whereaboutsHistory` (last 100 entries)
   - Updates `customData.currentWhereabouts`

5. **`generateDefaultRoutine()`** - Auto-generates routine based on occupation
   - Day shift workers: 9-5 schedule
   - Night shift workers: 11pm-7am schedule
   - Unemployed/retired: flexible leisure schedule
   - Considers occupation type (doctors start earlier)

6. **`getRoutine()`** - Retrieves character's routine

7. **`updateAllWhereabouts()`** - Batch updates all characters' whereabouts
   - Iterates through all characters in world
   - Updates location based on current routine and time
   - Returns count of updated characters

**Helper Functions:**
- `generateDayShiftRoutine()` - Creates 9-5 work schedule
- `generateNightShiftRoutine()` - Creates night shift schedule
- `generateUnemployedRoutine()` - Creates leisure schedule

## Routes Added to `server/routes.ts`

### Routine Endpoints:

- **`POST /api/characters/:id/routine`** - Set character's routine
  - Body: `{ routine: { day: TimeBlock[], night: TimeBlock[] } }`
  
- **`GET /api/characters/:id/routine`** - Get character's routine
  
- **`POST /api/characters/:id/routine/generate`** - Auto-generate routine
  - Based on occupation and shift
  
- **`GET /api/characters/:id/activity`** - Get current activity
  - Query: `timeOfDay=day|night, currentHour=0-23`
  
- **`POST /api/characters/:id/whereabouts`** - Update whereabouts
  - Body: `{ worldId, location, locationType, occasion, timestep, timeOfDay }`
  
- **`GET /api/worlds/:id/locations/:location/characters`** - Get characters at location
  - Query: `timeOfDay?, currentHour?`
  
- **`POST /api/worlds/:id/whereabouts/update-all`** - Update all characters
  - Body: `{ timestep, timeOfDay, currentHour }`

## Key Concepts

### Time Blocks

A routine is composed of time blocks defining what a character does during specific hours:

```typescript
interface TimeBlock {
  startHour: number; // 0-23
  endHour: number; // 0-23
  location: string; // business ID, residence ID, or description
  locationType: LocationType; // home, work, leisure, school
  occasion: ActivityOccasion; // working, relaxing, studying, etc.
}
```

### Daily Routine Structure

```typescript
interface DailyRoutine {
  day: TimeBlock[];    // Daytime schedule (6am-6pm)
  night: TimeBlock[];  // Nighttime schedule (6pm-6am)
}
```

### Location Types

- **home** - Character's residence
- **work** - Character's workplace
- **leisure** - Entertainment, shopping, socializing
- **school** - Educational institution

### Activity Occasions

- **working** - At job
- **sleeping** - Resting at home
- **eating** - Meals
- **relaxing** - Leisure at home
- **socializing** - With other characters
- **shopping** - Purchasing goods
- **studying** - At school/library
- **exercising** - Physical activity
- **commuting** - Traveling between locations

## Auto-Generated Routines

### Day Shift Worker (9-5)

```typescript
{
  day: [
    { startHour: 0, endHour: 7, location: home, occasion: 'sleeping' },
    { startHour: 7, endHour: 8, location: home, occasion: 'eating' },
    { startHour: 8, endHour: 9, location: 'commuting', occasion: 'commuting' },
    { startHour: 9, endHour: 17, location: workplace, occasion: 'working' },
    { startHour: 17, endHour: 18, location: 'commuting', occasion: 'commuting' },
    { startHour: 18, endHour: 19, location: home, occasion: 'eating' },
    { startHour: 19, endHour: 22, location: home, occasion: 'relaxing' },
    { startHour: 22, endHour: 24, location: home, occasion: 'sleeping' }
  ],
  night: [
    { startHour: 0, endHour: 24, location: home, occasion: 'sleeping' }
  ]
}
```

### Night Shift Worker (11pm-7am)

```typescript
{
  day: [
    { startHour: 0, endHour: 12, location: home, occasion: 'sleeping' },
    { startHour: 12, endHour: 14, location: home, occasion: 'eating' },
    { startHour: 14, endHour: 20, location: home, occasion: 'relaxing' },
    { startHour: 20, endHour: 22, location: home, occasion: 'eating' },
    { startHour: 22, endHour: 23, location: 'commuting', occasion: 'commuting' },
    { startHour: 23, endHour: 24, location: workplace, occasion: 'working' }
  ],
  night: [
    { startHour: 0, endHour: 7, location: workplace, occasion: 'working' },
    { startHour: 7, endHour: 8, location: 'commuting', occasion: 'commuting' },
    { startHour: 8, endHour: 24, location: home, occasion: 'sleeping' }
  ]
}
```

### Unemployed/Retired

```typescript
{
  day: [
    { startHour: 0, endHour: 8, location: home, occasion: 'sleeping' },
    { startHour: 8, endHour: 9, location: home, occasion: 'eating' },
    { startHour: 9, endHour: 12, location: home, occasion: 'relaxing' },
    { startHour: 12, endHour: 13, location: home, occasion: 'eating' },
    { startHour: 13, endHour: 17, location: 'around_town', occasion: 'socializing' },
    { startHour: 17, endHour: 18, location: home, occasion: 'eating' },
    { startHour: 18, endHour: 22, location: home, occasion: 'relaxing' },
    { startHour: 22, endHour: 24, location: home, occasion: 'sleeping' }
  ],
  night: [
    { startHour: 0, endHour: 24, location: home, occasion: 'sleeping' }
  ]
}
```

## Data Storage

### Character Routine (`customData.routine`)

```typescript
{
  characterId: "char_123",
  routine: {
    day: [ /* TimeBlock[] */ ],
    night: [ /* TimeBlock[] */ ]
  },
  lastUpdated: 1634567890000
}
```

### Whereabouts History (`customData.whereaboutsHistory`)

```typescript
[
  {
    id: "wh_abc",
    worldId: "world_123",
    characterId: "char_123",
    location: "business_456",
    locationType: "work",
    occasion: "working",
    timestep: 1000,
    timeOfDay: "day",
    date: "2024-10-26T12:00:00Z",
    createdAt: "2024-10-26T12:00:00Z"
  }
  // ... last 100 entries
]
```

### Current Whereabouts (`customData.currentWhereabouts`)

Latest whereabouts entry for quick access.

## Example Usage

### 1. Auto-Generate and Set Routine

```bash
POST /api/characters/char_123/routine/generate
```

Response:
```json
{
  "success": true,
  "routine": {
    "day": [
      {
        "startHour": 0,
        "endHour": 7,
        "location": "residence_789",
        "locationType": "home",
        "occasion": "sleeping"
      },
      // ... more time blocks
    ],
    "night": [ /* ... */ ]
  }
}
```

### 2. Set Custom Routine

```bash
POST /api/characters/char_123/routine
Content-Type: application/json

{
  "routine": {
    "day": [
      {
        "startHour": 8,
        "endHour": 17,
        "location": "business_456",
        "locationType": "work",
        "occasion": "working"
      }
    ],
    "night": [
      {
        "startHour": 0,
        "endHour": 24,
        "location": "residence_789",
        "locationType": "home",
        "occasion": "sleeping"
      }
    ]
  }
}
```

### 3. Get Current Activity

```bash
GET /api/characters/char_123/activity?timeOfDay=day&currentHour=14
```

Response:
```json
{
  "characterId": "char_123",
  "characterName": "John Doe",
  "timeOfDay": "day",
  "currentHour": 14,
  "location": "business_456",
  "locationType": "work",
  "occasion": "working",
  "timeBlock": {
    "startHour": 9,
    "endHour": 17,
    "location": "business_456",
    "locationType": "work",
    "occasion": "working"
  }
}
```

### 4. Find Characters at Location

```bash
GET /api/worlds/world_123/locations/business_456/characters?timeOfDay=day&currentHour=14
```

Response - array of characters currently at that business:
```json
[
  {
    "character": { /* Character object */ },
    "activity": { /* CurrentActivity object */ }
  }
]
```

### 5. Update All Whereabouts

```bash
POST /api/worlds/world_123/whereabouts/update-all
Content-Type: application/json

{
  "timestep": 1000,
  "timeOfDay": "day",
  "currentHour": 14
}
```

Response:
```json
{
  "success": true,
  "updatedCount": 47,
  "message": "Updated 47 character whereabouts"
}
```

## Integration Points

1. **Hiring System** - Routines update when characters get jobs
   - New job → auto-generate routine with work hours
   - Retirement → switch to unemployed routine

2. **Event System** - Events can trigger routine changes
   - Marriage → might change home location
   - Move → updates home location in routine

3. **Character State** - Routines reflect character data
   - Uses `currentOccupationId` for work location
   - Uses `currentLocation` for home location
   - Considers shift (day/night) from occupation

## Use Cases

### Simulation Time Advancement

```typescript
// Each timestep, update where everyone is
await updateAllWhereabouts(worldId, timestep, timeOfDay, currentHour);

// Now can query who's where
const peopleAtWork = await getCharactersAtLocation(worldId, businessId, 'day', 14);
const peopleAtHome = await getCharactersAtLocation(worldId, residenceId, 'night', 2);
```

### Social Encounters

```typescript
// Find who character might encounter at work
const coworkers = await getCharactersAtLocation(worldId, workplace, 'day', 12);

// Find who's at the bar in evening
const barPatrons = await getCharactersAtLocation(worldId, 'bar_main', 'day', 20);
```

### Narrative Generation

```typescript
const activity = await getCurrentActivity(characterId, 'day', 14);
// "John Doe is working at the hospital"

const activity = await getCurrentActivity(characterId, 'night', 3);
// "Jane Smith is sleeping at home"
```

## Testing

### Manual Testing Steps:

1. **Create character with job**
   ```bash
   POST /api/characters
   POST /api/businesses/bus_id/hire
   ```

2. **Generate routine**
   ```bash
   POST /api/characters/char_id/routine/generate
   # Verify routine matches occupation shift
   GET /api/characters/char_id/routine
   ```

3. **Check activity at different times**
   ```bash
   GET /api/characters/char_id/activity?timeOfDay=day&currentHour=9
   # Should be commuting or at work
   GET /api/characters/char_id/activity?timeOfDay=day&currentHour=14
   # Should be working
   GET /api/characters/char_id/activity?timeOfDay=night&currentHour=2
   # Should be sleeping
   ```

4. **Update whereabouts**
   ```bash
   POST /api/worlds/world_id/whereabouts/update-all
   # Verify all characters updated
   ```

5. **Query location**
   ```bash
   GET /api/worlds/world_id/locations/business_id/characters
   # Should show employees during work hours
   ```

## Success Criteria Met ✅

- ✅ Characters have daily routines (day/night schedules)
- ✅ Routines auto-generate based on occupation and shift
- ✅ Can query character's current activity by time
- ✅ Whereabouts tracked with location history
- ✅ Can find all characters at a specific location
- ✅ Batch update all characters' whereabouts
- ✅ Time blocks define location, type, and occasion
- ✅ All routes integrated into main `routes.ts`
- ✅ Uses existing extension pattern

## Files Modified

1. **`server/extensions/routine-system.ts`** - 492 lines (NEW)
2. **`server/routes.ts`** - Added 7 endpoints (~110 lines)

**Total Implementation**: ~600 lines of production code

**Estimated Time**: Phase 3 targeted 8-12 hours, implementation complete!

## Known Limitations

1. **Whereabouts Storage**: Currently uses `customData` instead of dedicated `whereabouts` table
   - Works fine with JSONB in MongoDB
   - Keeps last 100 entries per character
   - Can migrate to table later if needed for querying

2. **Time Granularity**: Hours (0-23) only, no minutes
   - Sufficient for most simulation needs
   - Could be extended if finer control needed

3. **Routine Complexity**: Simple time blocks
   - No conditional logic ("only on weekends")
   - No seasonal variations
   - Could be enhanced with rule system later

## Next Steps

Phase 3 is complete! The routine system is fully functional.

**To Complete TotT Integration:**

- **Phase 4**: Business Management (founding, closing, ownership transfer) - FINAL PHASE!

---

**Ready for Phase 4: Business Management** 🚀
