# Phase 1: Core Schema Loading - COMPLETE ✅

**Date:** October 28, 2025  
**Status:** Implementation Complete  
**Next:** Phase 2 - Discovery (auto-scanning rules)

## What Was Built

### 1. PredicateDiscoveryService ✅

**File:** `server/services/predicate-discovery.ts`

A comprehensive service for managing predicate schemas with these capabilities:

#### Core Features:
- **Schema Loading:** Loads core and discovered predicates from JSON files
- **Lazy Initialization:** Initializes on first use for performance
- **Combined View:** Merges core + discovered predicates (core takes precedence)
- **Spell Checking:** Levenshtein distance algorithm finds similar predicates
- **Category Management:** Organizes predicates by type (entity-type, property, relationship, etc.)

#### Key Methods:
```typescript
await predicateDiscovery.getAllPredicates()           // All predicates
await predicateDiscovery.getPredicate(name, arity)    // Exact match
await predicateDiscovery.getPredicatesByName(name)    // All arities
await predicateDiscovery.findSimilar(name)            // Spell check
await predicateDiscovery.getCategories()              // All categories
await predicateDiscovery.reload()                     // Refresh from disk
```

### 2. Core Predicates Schema ✅

**File:** `server/schema/core-predicates.json`

Defined 30+ built-in predicates across categories:

- **Entity Types:** Character, Person, Noble
- **Properties:** age, gender, occupation, wealth, has_status
- **Relationships:** parent_of, married, friendship, rivalry, in_love
- **Genealogy:** eldest_child, fertile, sibling_of, ancestor_of
- **States:** alive, dead, dies
- **Events:** meets, dies
- **Utility:** random_chance, at_location, owns

Each predicate includes:
- Description
- Arity (argument count)
- Argument types and names
- Usage examples
- Category classification

### 3. Discovered Predicates Schema ✅

**File:** `server/schema/discovered-predicates.json`

Placeholder file ready for Phase 2 auto-population. Will contain:
- User-defined custom predicates
- Usage statistics
- Discovery metadata
- Confidence scores

### 4. REST API Endpoints ✅

**Added to:** `server/routes.ts` (lines 5218-5369)

#### Endpoints:

**GET `/api/predicates`**
- Returns all predicates (core + discovered)
- Perfect for autocomplete
- Response includes: name, arity, description, examples, source, etc.

**GET `/api/predicates/name/:name`**
- Get all variants of a predicate (different arities)
- Example: `/api/predicates/name/age` returns age/1, age/2, etc.

**GET `/api/predicates/:name/:arity`**
- Get exact predicate
- Returns 404 with suggestions if not found
- Example: `/api/predicates/Character/1`

**GET `/api/predicates/names`**
- List all unique predicate names
- Useful for simple autocomplete

**GET `/api/predicates/categories`**
- List all categories
- Returns: ["entity-type", "property", "relationship", etc.]

**GET `/api/predicates/category/:category`**
- Filter predicates by category
- Example: `/api/predicates/category/relationship`

**GET `/api/predicates/similar/:name`**
- Spell check / typo detection
- Example: `/api/predicates/similar/charcter` → suggests "Character"
- Query param: `maxDistance` (default: 2)

**POST `/api/predicates/reload`**
- Reload schemas from disk
- Useful during development

## Testing the Implementation

### Test 1: Get All Predicates

```bash
curl http://localhost:5000/api/predicates
```

Expected: JSON with 30+ core predicates

### Test 2: Get Specific Predicate

```bash
curl http://localhost:5000/api/predicates/Character/1
```

Expected:
```json
{
  "name": "Character",
  "arity": 1,
  "description": "Identifies an entity as a character",
  "category": "entity-type",
  "examples": ["Character(?hero)", "Character(?villain)"],
  "source": "core",
  "builtIn": true,
  "args": [
    {
      "name": "entity",
      "type": "entity",
      "description": "The character entity"
    }
  ]
}
```

### Test 3: Spell Check

```bash
curl http://localhost:5000/api/predicates/similar/charcter
```

Expected:
```json
{
  "query": "charcter",
  "suggestions": ["Character"]
}
```

### Test 4: Get Categories

```bash
curl http://localhost:5000/api/predicates/categories
```

Expected:
```json
{
  "categories": [
    "entity-type",
    "event",
    "genealogy",
    "property",
    "relationship",
    "state",
    "utility"
  ]
}
```

### Test 5: Filter by Category

```bash
curl http://localhost:5000/api/predicates/category/relationship
```

Expected: All relationship predicates (married, parent_of, friendship, etc.)

## Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (Rule Editor, Autocomplete)  │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP GET /api/predicates
                 ▼
┌─────────────────────────────────────────┐
│         Express Routes (routes.ts)       │
│      /api/predicates/* endpoints         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    PredicateDiscoveryService             │
│  - Load core schema                      │
│  - Load discovered schema                │
│  - Merge and query                       │
│  - Spell checking                        │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
┌────────────────┐ ┌─────────────────────┐
│ core-          │ │ discovered-         │
│ predicates.    │ │ predicates.json     │
│ json           │ │ (Phase 2)           │
│ (30+ built-in) │ │ (auto-generated)    │
└────────────────┘ └─────────────────────┘
```

## Design Principles Achieved ✅

### 1. Permissive, Not Restrictive
- ✅ Users can write any predicate freely
- ✅ Unknown predicates don't cause errors
- ✅ System suggests corrections instead of blocking

### 2. Auto-Discovery
- ✅ Infrastructure ready for Phase 2
- ✅ Schema files prepared for auto-population
- ✅ Service architecture supports discovery

### 3. Progressive Enhancement
- ✅ Level 1 complete: Core predicates loaded
- ⏳ Level 2 next: Auto-discovered from usage
- ⏳ Level 3 future: User annotations
- ⏳ Level 4 future: Optional strict mode

### 4. Helpful Assistant
- ✅ Spell checking with Levenshtein distance
- ✅ Category organization
- ✅ Rich documentation in responses
- ✅ Helpful error messages with suggestions

## TypeScript Interface

```typescript
interface PredicateInfo {
  name: string;
  arity: number;
  description?: string;
  category?: string;
  examples: string[];
  source: 'core' | 'discovered';
  builtIn?: boolean;
  usageCount?: number;
  confidence?: 'high' | 'medium' | 'low';
  args?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}
```

## What's Next: Phase 2

### Discovery Engine

**Goal:** Automatically scan rules and discover custom predicates

**Tasks:**
1. Implement rule parsing to extract predicates
2. Track usage statistics (count, first/last seen)
3. Auto-update `discovered-predicates.json`
4. Background task to scan all worlds
5. Confidence scoring based on usage

**Timeline:** Week 2 of implementation plan

### Example Discovery Flow:

```typescript
// User writes rule with custom predicate:
rule custom_merchant_rule {
  when (
    wealthy_merchant(?trader) and    // Custom predicate!
    age(?trader, Age) and Age > 40
  )
  then {
    grant_nobility(?trader)
  }
}

// System discovers it:
{
  "wealthy_merchant/1": {
    "arity": 1,
    "discoveredFrom": ["custom_merchant_rule"],
    "usageCount": 1,
    "examples": ["wealthy_merchant(?trader)"],
    "confidence": "low"
  }
}

// Next time user types "weal..." autocomplete suggests:
// - wealth (core predicate)
// - wealthy_merchant (discovered predicate)
```

## Notes

### Pre-existing TypeScript Errors

The TypeScript errors in `routes.ts` about `MongoStorage` are pre-existing interface issues, not related to this implementation. They exist throughout the codebase and should be addressed separately.

### Markdown Linting

The markdown documentation files have minor cosmetic linting warnings (missing blank lines). These don't affect functionality and can be fixed in a cleanup pass.

### Service Initialization

The `PredicateDiscoveryService` uses lazy initialization - it only loads schemas when first accessed. This keeps startup time fast. The schemas are cached in memory after loading.

## Success Metrics

✅ **30+ core predicates defined** with full documentation  
✅ **7 API endpoints** working and tested  
✅ **Spell checking algorithm** implemented (Levenshtein distance)  
✅ **Category system** for organizing predicates  
✅ **Zero breaking changes** - purely additive functionality  
✅ **Permissive design** - no blocking validation yet  

## Phase 1 Checklist

- [x] Create `core-predicates.json` with built-in predicates
- [x] Implement `PredicateDiscoveryService`
- [x] Add `/api/predicates` endpoint
- [x] Add `/api/predicates/:name/:arity` endpoint
- [x] Add spell-checking with Levenshtein distance
- [x] Add category filtering
- [x] Add similar predicate suggestions
- [x] Create `discovered-predicates.json` placeholder
- [x] Document all interfaces and methods
- [x] Test with curl commands

## Ready for Phase 2! 🚀

The foundation is solid. Next step: Build the discovery engine that scans rules and auto-populates the discovered predicates schema.
