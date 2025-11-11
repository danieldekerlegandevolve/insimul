# TotT Integration - Corrected Approach

## Summary of Changes

### ✅ What Was Done

1. **Analyzed TotT Usage** - Found `server/types/tott-types.ts` was never imported
2. **Integrated Types** - Moved all TotT types to `shared/schema.ts` (130+ lines)
3. **Cleaned Up** - Deleted orphaned `server/types/tott-types.ts` and empty directory
4. **Corrected Documentation** - Fixed integration approach to match actual codebase pattern

### ❌ What Was Incorrect in Initial Analysis

I initially referenced a non-existent `server/kismet/` directory structure based on outdated memories. **This was wrong.**

**Incorrect suggestion:**
```
server/tott/              # ❌ Wrong pattern
  hiring-manager.ts
  tott-routes.ts
/api/tott/*              # ❌ Wrong pattern
```

**Correct pattern (based on actual codebase):**
```
server/extensions/        # ✅ Correct
  impulse-system.ts      # Already exists
  relationship-utils.ts  # Already exists  
  volition-system.ts     # Already exists
  hiring-system.ts       # To be added
  event-system.ts        # To be added
  routine-system.ts      # To be added
  business-system.ts     # To be added

server/routes.ts          # ✅ Integrated endpoints
  /api/characters/:id/impulse       # Existing
  /api/characters/:id/relationship  # Existing
  /api/businesses/:id/hire          # To be added
  /api/characters/:id/events        # To be added
```

## The Correct Integration Pattern

### How Extensions Work

**Example from `impulse-system.ts`:**

1. **Extension file exports functions:**
```typescript
// server/extensions/impulse-system.ts
export async function addImpulse(
  characterId: string,
  type: ImpulseType,
  strength: number
): Promise<void> {
  // Uses existing storage and schema fields
  const character = await storage.getCharacter(characterId);
  // ... logic ...
  await storage.updateCharacter(characterId, updates);
}
```

2. **Routes file imports and uses them:**
```typescript
// server/routes.ts
import { addImpulse, getImpulseStrength } from "./extensions/impulse-system.js";

app.post("/api/characters/:id/impulse", async (req, res) => {
  await addImpulse(req.params.id, req.body.type, req.body.strength);
  res.json({ success: true });
});
```

### Key Principles

1. **No Separate Directories** - Extensions live in `server/extensions/`
2. **No Separate Route Files** - All routes in `server/routes.ts`
3. **Integrated Endpoints** - Use RESTful patterns like `/api/characters/:id/...`
4. **Use Existing Schema** - Extensions work with existing tables and fields
5. **Export Functions** - Extensions export reusable functions, not classes

## Next Steps for TotT Implementation

### 1. Create Extension Files

**`server/extensions/hiring-system.ts`:**
```typescript
import { storage } from '../storage';
import type { OccupationVocation, ShiftType } from '../../shared/schema';

export async function evaluateCandidate(
  businessId: string,
  candidateId: string,
  vocation: OccupationVocation
): Promise<{ qualified: boolean; score: number }> {
  // Evaluation logic
}

export async function fillVacancy(
  businessId: string,
  candidateId: string,
  vocation: OccupationVocation,
  shift: ShiftType
): Promise<void> {
  // Create occupation record
  await storage.createOccupation({
    businessId,
    characterId: candidateId,
    vocation,
    shift,
    // ... other fields
  });
}
```

**`server/extensions/event-system.ts`:**
```typescript
import { storage } from '../storage';
import type { EventType } from '../../shared/schema';

export async function generateLifeEvent(
  characterId: string,
  eventType: EventType,
  details: Record<string, any>
): Promise<void> {
  // Store in character history or world events
}

export async function getEventHistory(
  characterId: string,
  limit?: number
): Promise<any[]> {
  // Query events from history
}
```

### 2. Add Routes to `server/routes.ts`

```typescript
// Add imports at top
import { evaluateCandidate, fillVacancy } from "./extensions/hiring-system.js";
import { generateLifeEvent, getEventHistory } from "./extensions/event-system.js";

// Add endpoints in appropriate sections
app.post("/api/businesses/:id/hire", async (req, res) => {
  try {
    const { candidateId, vocation, shift } = req.body;
    await fillVacancy(req.params.id, candidateId, vocation, shift);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to hire candidate" });
  }
});

app.get("/api/characters/:id/events", async (req, res) => {
  try {
    const events = await getEventHistory(req.params.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to get events" });
  }
});
```

## Benefits of This Approach

1. **Consistent Architecture** - Matches existing impulse/relationship/volition pattern
2. **Fully Integrated** - TotT is part of Insimul, not a separate system
3. **Discoverable** - All routes in one file, easy to find
4. **Maintainable** - Clear separation between logic (extensions) and API (routes)
5. **Type Safe** - All TotT types now in `shared/schema.ts`

## Current Status

- ✅ **Phase 1 Complete** - TotT types integrated into `shared/schema.ts`
- ⏳ **Phase 2 Pending** - Create extension files following the pattern above
- ⏳ **Phase 3 Pending** - Add integrated routes to `routes.ts`

The foundation is solid and the correct integration pattern is now documented!
