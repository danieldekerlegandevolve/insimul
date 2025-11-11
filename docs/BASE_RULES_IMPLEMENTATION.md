# Base Rules and Actions - Implementation Guide

**Status:** Foundation Complete ✅  
**Date:** October 28, 2025

## Overview

Base Rules and Actions are global, reusable rule and action templates that can be used across any world or simulation. They serve as underlying generic psychological, sociological, and behavioral rules that work universally but can be toggled on/off per world.

## What's Been Implemented ✅

### 1. Database Schema (Already Existed)
The schema already supports base rules/actions with:
- `isBase: boolean` field (default: false)
- `worldId: string | null` field (null for base resources)
- When `isBase = true` and `worldId = null`, the rule/action is global

### 2. Storage Layer ✅
**File:** `server/db/mongo-storage.ts`

**New Methods Added:**
```typescript
// Base Rules
async getBaseRules(): Promise<Rule[]>
async getBaseRulesByCategory(category: string): Promise<Rule[]>

// Base Actions
async getBaseActions(): Promise<Action[]>
async getBaseActionsByType(actionType: string): Promise<Action[]>
```

**Query Logic:**
- Filters for `isBase: true` AND `worldId: null`
- Returns only global resources

### 3. API Endpoints ✅
**File:** `server/routes.ts`

**Base Rules Endpoints:**
```bash
GET /api/base-rules                      # Get all base rules
GET /api/base-rules/category/:category   # Filter by category
```

**Base Actions Endpoints:**
```bash
GET /api/base-actions                    # Get all base actions
GET /api/base-actions/type/:actionType   # Filter by type
```

**Reusing Existing Endpoints:**
```bash
POST /api/rules                          # Create rule (set isBase: true, worldId: null)
PUT  /api/rules/:id                      # Update base rule
DELETE /api/rules/:id                    # Delete base rule

POST /api/worlds/:worldId/actions        # Create action (set isBase: true, worldId: null)
PUT  /api/actions/:id                    # Update base action
DELETE /api/actions/:id                  # Delete base action
```

### 4. Admin Panel View ✅
**File:** `client/src/components/AdminPanel.tsx`

**Features Added:**
- New **"Base Resources"** tab
- Shows all base rules and actions
- Counts displayed in summary cards
- Labeled as "Global" instead of world name
- Same viewing/details functionality as world-specific resources

**UI Structure:**
```
Admin Panel
├── Summary Cards (6 total)
│   ├── Worlds
│   ├── Countries
│   ├── Settlements
│   ├── Characters
│   ├── Base Rules ← NEW
│   └── Base Actions ← NEW
├── Tabs
│   ├── Worlds
│   ├── Geography
│   ├── Characters
│   ├── Rules & Actions (world-specific)
│   ├── Content
│   └── Base Resources ← NEW
│       ├── Base Rules sub-tab
│       └── Base Actions sub-tab
```

## How to Create Base Rules/Actions

### Creating via API

**Base Rule:**
```bash
curl -X POST http://localhost:5000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Greeting",
    "content": "Character(?speaker) => greet(?speaker)",
    "isBase": true,
    "worldId": null,
    "ruleType": "trigger",
    "category": "social",
    "sourceFormat": "insimul"
  }'
```

**Base Action:**
```bash
curl -X POST http://localhost:5000/api/worlds/any-id/actions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wave Hello",
    "description": "Character waves at another character",
    "isBase": true,
    "worldId": null,
    "actionType": "social",
    "sourceFormat": "insimul"
  }'
```

### Creating via UI (Next Steps)

The existing Rule/Action creation dialogs can be reused by:
1. Adding an "Is Base Resource" checkbox
2. When checked, set `isBase: true` and `worldId: null`
3. Modal should be accessible from Admin Panel Base Resources tab

## What's Still Needed 🔄

### 1. Creation UI in Admin Panel
**Goal:** Add buttons to create base rules/actions from Admin Panel

**Suggested Implementation:**
- Add "Create Base Rule" and "Create Base Action" buttons in Base Resources tab
- Reuse existing `RuleCreateDialog` and `ActionCreateDialog` components
- Pass prop: `isBase={true}` to auto-set the fields
- Show in Admin Panel's Base Resources tab

### 2. Per-World Toggle System
**Goal:** Allow worlds to enable/disable specific base rules/actions

**Suggested Schema:**
```typescript
// New table or field on worlds
interface WorldBaseResourceConfig {
  worldId: string;
  enabledBaseRules: string[];      // Array of base rule IDs
  enabledBaseActions: string[];    // Array of base action IDs
  disabledBaseRules: string[];     // Array of base rule IDs
  disabledBaseActions: string[];   // Array of base action IDs
}
```

**Alternative:** Add a junction table
```typescript
interface WorldBaseResource {
  worldId: string;
  resourceId: string;    // rule or action ID
  resourceType: 'rule' | 'action';
  isEnabled: boolean;
}
```

**API Endpoints Needed:**
```bash
# Get base resources status for a world
GET /api/worlds/:worldId/base-resources

# Enable a base rule/action for a world
POST /api/worlds/:worldId/base-resources/:resourceId/enable

# Disable a base rule/action for a world
POST /api/worlds/:worldId/base-resources/:resourceId/disable

# Bulk enable/disable
POST /api/worlds/:worldId/base-resources/bulk
```

### 3. Integration into Editor
**Goal:** Show base rules alongside world rules in the editor

**File:** `client/src/pages/editor.tsx`

**Suggested Changes:**
- Fetch base rules: `GET /api/base-rules`
- Display in rules list with a "🌐 Base" badge
- Allow toggling: checkbox to enable/disable for current world
- Visual distinction (different color, icon, or section)

**UI Mockup:**
```
Rules List
├── World Rules
│   ├── Custom Rule 1
│   └── Custom Rule 2
└── Base Rules (toggle all: ☑)
    ├── ☑ Basic Greeting 🌐
    ├── ☑ Politeness Protocol 🌐
    └── ☐ Aggressive Behavior 🌐 (disabled for this world)
```

### 4. Integration into Simulation
**Goal:** Show base actions in simulation action selection

**File:** `client/src/components/SimulationCard.tsx` or simulation views

**Suggested Changes:**
- Fetch base actions: `GET /api/base-actions`
- Display alongside world actions
- Badge as "🌐 Base Action"
- Respect per-world enabled/disabled state

**During Simulation Execution:**
- When loading rules for simulation, include enabled base rules
- When presenting action choices, include enabled base actions
- Filter by `enabledBaseRules` and `enabledBaseActions` for the world

### 5. Import Functionality
**Goal:** Bulk import base rules/actions from files

**Suggested Features:**
- Import from `.insimul` files
- Import from Ensemble, Kismet, Talk of the Town formats
- Batch creation UI
- Preview before import

**API Endpoint:**
```bash
POST /api/base-rules/import
POST /api/base-actions/import
```

### 6. Procedural Generation
**Goal:** Generate base rules/actions programmatically

**Suggested Features:**
- Templates for common patterns (greeting, conflict, cooperation)
- Parameter-driven generation
- Category-based templates

**Example Generator:**
```typescript
generateBaseSocialRules() {
  // Generate common social interaction rules
  // - Greetings based on relationship
  // - Conflict escalation
  // - Cooperation mechanics
}
```

## Usage Examples

### Example Base Rules

**Politeness Protocol:**
```prolog
% Base rule for polite behavior
Character(?speaker), Character(?listener), 
positive_relationship(?speaker, ?listener)
=> 
use_polite_language(?speaker, ?listener)
```

**Conflict Avoidance:**
```prolog
% Characters avoid conflict when stressed
Character(?char), stress_level(?char, ?stress), 
?stress > 7
=>
avoid_confrontation(?char)
```

**Resource Sharing:**
```prolog
% Share resources with friends
Character(?giver), Character(?receiver),
friendship(?giver, ?receiver),
has_resource(?giver, ?resource),
needs_resource(?receiver, ?resource)
=>
share_resource(?giver, ?receiver, ?resource)
```

### Example Base Actions

**Greeting:**
```json
{
  "name": "Wave Hello",
  "actionType": "social",
  "description": "Character waves at another character",
  "isBase": true
}
```

**Express Emotion:**
```json
{
  "name": "Show Happiness",
  "actionType": "emotional",
  "description": "Character expresses joy through body language",
  "isBase": true
}
```

## Testing

### Test Base Rules Endpoint
```bash
# Create a base rule
curl -X POST http://localhost:5000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Base Rule",
    "content": "test() => result()",
    "isBase": true,
    "worldId": null,
    "ruleType": "trigger",
    "sourceFormat": "insimul"
  }'

# Fetch all base rules
curl http://localhost:5000/api/base-rules
```

### Test Admin Panel
1. Start server: `npm run dev`
2. Open Admin Panel
3. Click "Base Resources" tab
4. Should see base rules and actions listed
5. Click on a resource to view details

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Base Resources                        │
│         (Global Rules & Actions Library)                 │
└─────────────────┬──────────────┬────────────────────────┘
                  │              │
        ┌─────────┴──────┐  ┌───┴────────┐
        │ Base Rules     │  │ Base Actions│
        │ - Social       │  │ - Social    │
        │ - Economic     │  │ - Physical  │
        │ - Emotional    │  │ - Verbal    │
        └────────┬───────┘  └───┬─────────┘
                 │              │
                 │   Applied    │
                 ↓   to World   ↓
        ┌────────────────────────────┐
        │    World Configuration     │
        │  - Enable/Disable Toggle   │
        │  - Per-world Overrides     │
        └────────┬───────────────────┘
                 │
                 ↓
        ┌────────────────────────────┐
        │    Simulation Execution    │
        │  - World Rules + Enabled   │
        │    Base Rules              │
        │  - World Actions + Enabled │
        │    Base Actions            │
        └────────────────────────────┘
```

## Benefits

### For World Creators
- **Reusability:** Don't recreate common rules for every world
- **Consistency:** Same social behaviors across similar worlds
- **Quick Start:** New worlds come with sensible defaults
- **Customization:** Can disable what doesn't fit

### For Researchers
- **Standard Library:** Common psychological/sociological patterns
- **Reproducibility:** Same base rules across experiments
- **Modularity:** Test with/without specific rule sets
- **Documentation:** Well-documented canonical behaviors

### For Users
- **Quality:** Tested, balanced base rules
- **Flexibility:** Turn off what you don't want
- **Discovery:** Browse available behaviors
- **Learning:** Examples of well-formed rules

## Next Steps Priority

1. **High Priority:**
   - Add "Create Base Rule/Action" buttons in Admin Panel ✨
   - Implement per-world toggle system (storage + API)
   - Show base rules in Editor with toggle UI

2. **Medium Priority:**
   - Show base actions in Simulation views
   - Bulk enable/disable UI
   - Category-based filtering

3. **Low Priority:**
   - Import functionality
   - Procedural generation
   - Advanced search and discovery

## Related Documentation

- `docs/BASE_RULES_AND_ACTIONS.md` - Original specification
- `shared/schema.ts` - Database schema with `isBase` field
- `server/db/storage.ts` - IStorage interface definition

---

**Implementation Status:**  
✅ Foundation Complete (Storage + API + Viewing)  
🔄 Next: Creation UI + Toggle System + Integration
