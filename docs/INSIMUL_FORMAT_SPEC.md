# .insimul Format Specification

**Declarative World Definition Format for Insimul**

---

## 📋 Overview

The `.insimul` format is a JSON-based declarative language for defining complete simulation worlds in Insimul. Instead of writing procedural TypeScript code to generate worlds, you define the world structure in a human-readable JSON file that the `insimul-loader` parses and instantiates.

---

## 🎯 Design Goals

1. **Declarative**: Define what you want, not how to create it
2. **Human-Readable**: Easy to read and edit by non-programmers
3. **Version Control Friendly**: Clean diffs in git
4. **Modular**: Easy to copy/paste between worlds
5. **Type-Safe**: Validated against schema (future)
6. **Reference-Based**: Entity relationships via ID references

---

## 📁 File Structure

A `.insimul` file is a JSON object with these top-level keys:

```json
{
  "world": { /* World metadata */ },
  "countries": [ /* Country definitions */ ],
  "settlements": [ /* Settlement definitions */ ],
  "characters": [ /* Character definitions */ ],
  "relationships": [ /* Explicit relationships */ ],
  "businesses": [ /* Business definitions */ ]
}
```

All keys except `world` are optional arrays.

---

## 🌍 World Definition

**Required**: Yes  
**Type**: Object

Defines the top-level world metadata.

```json
{
  "world": {
    "name": "string",              // Required: World name
    "description": "string",       // Optional: World description
    "sourceFormats": ["string"],   // Optional: Source formats
    "config": {}                   // Optional: Custom configuration
  }
}
```

**Example**:
```json
{
  "world": {
    "name": "Realm of Aethermoor",
    "description": "A high fantasy realm of magic and prophecy",
    "sourceFormats": ["insimul", "kismet"],
    "config": {
      "era": "fantasy",
      "magic": "high",
      "year": 1000
    }
  }
}
```

---

## 🏛️ Country Definition

**Type**: Array of objects

Defines countries/nations in the world.

```json
{
  "countries": [
    {
      "id": "string",              // Required: Reference ID
      "name": "string",            // Required: Country name
      "governmentType": "string",  // Required: Government type
      "economicSystem": "string"   // Required: Economic system
    }
  ]
}
```

**Example**:
```json
{
  "countries": [
    {
      "id": "human_kingdom",
      "name": "Kingdom of Aethoria",
      "governmentType": "monarchy",
      "economicSystem": "feudal"
    }
  ]
}
```

**Government Types**: `monarchy`, `democracy`, `theocracy`, `technocracy`, `constitutional_monarchy`, `federal_republic`, etc.

**Economic Systems**: `feudal`, `capitalist`, `socialist`, `trade-based`, `agricultural`, `post_scarcity`, etc.

---

## 🏘️ Settlement Definition

**Type**: Array of objects

Defines settlements (cities, towns, villages) within countries.

```json
{
  "settlements": [
    {
      "id": "string",               // Required: Reference ID
      "countryRef": "string",       // Required: Country ID reference
      "name": "string",             // Required: Settlement name
      "settlementType": "string",   // Required: Type of settlement
      "population": number,         // Required: Population count
      "terrain": "string"           // Required: Terrain type
    }
  ]
}
```

**Example**:
```json
{
  "settlements": [
    {
      "id": "human_capital",
      "countryRef": "human_kingdom",
      "name": "Aethoria City",
      "settlementType": "city",
      "population": 50000,
      "terrain": "plains"
    }
  ]
}
```

**Settlement Types**: `city`, `town`, `village`

**Terrain Types**: `plains`, `hills`, `mountains`, `coast`, `river`, `forest`, `desert`

---

## 👤 Character Definition

**Type**: Array of objects

Defines characters/NPCs in the world.

```json
{
  "characters": [
    {
      "id": "string",              // Required: Reference ID
      "firstName": "string",       // Required: First name
      "lastName": "string",        // Required: Last name
      "gender": "string",          // Required: Gender
      "birthYear": number,         // Required: Birth year
      "occupation": "string",      // Optional: Occupation
      "locationRef": "string",     // Required: Settlement ID reference
      "race": "string",            // Optional: Race/species
      "spouseRef": "string",       // Optional: Spouse character ID
      "parentRefs": ["string"]     // Optional: Parent character IDs
    }
  ]
}
```

**Example**:
```json
{
  "characters": [
    {
      "id": "human_king",
      "firstName": "Aldric",
      "lastName": "Stormborne",
      "gender": "male",
      "birthYear": 970,
      "occupation": "king",
      "locationRef": "human_capital",
      "race": "human",
      "spouseRef": "human_queen"
    }
  ]
}
```

**Gender**: `male`, `female`, or custom

**Common Occupations**: `king`, `queen`, `prince`, `princess`, `knight`, `wizard`, `merchant`, `farmer`, `blacksmith`, `doctor`, `teacher`, etc.

---

## 🤝 Relationship Definition

**Type**: Array of objects

Defines explicit relationships beyond family (friendships, rivalries, etc.).

```json
{
  "relationships": [
    {
      "characterRef": "string",    // Required: Character ID
      "friendRefs": ["string"],    // Optional: Friend character IDs
      "enemyRefs": ["string"]      // Optional: Enemy character IDs
    }
  ]
}
```

**Example**:
```json
{
  "relationships": [
    {
      "characterRef": "wizard_gandalf",
      "friendRefs": ["warrior_boromir", "elf_legolas"],
      "enemyRefs": ["dark_lord"]
    }
  ]
}
```

---

## 🏢 Business Definition

**Type**: Array of objects

Defines businesses/shops in settlements.

```json
{
  "businesses": [
    {
      "id": "string",              // Optional: Reference ID
      "name": "string",            // Required: Business name
      "businessType": "string",    // Required: Type of business
      "locationRef": "string",     // Required: Settlement ID reference
      "ownerRef": "string"         // Optional: Owner character ID
    }
  ]
}
```

**Example**:
```json
{
  "businesses": [
    {
      "id": "blacksmith_shop",
      "name": "Ironforge Smithy",
      "businessType": "blacksmith",
      "locationRef": "human_capital",
      "ownerRef": "dwarf_blacksmith"
    }
  ]
}
```

---

## 🔗 Reference System

The `.insimul` format uses **two-pass loading**:

### **Pass 1: Entity Creation**
1. Create world
2. Create all countries (map IDs)
3. Create all settlements (map IDs)
4. Create all characters (map IDs)
5. Create all businesses (map IDs)

### **Pass 2: Reference Resolution**
1. Update character relationships (spouseRef, parentRefs)
2. Create explicit relationships (friendRefs, enemyRefs)
3. Link businesses to owners

This allows you to reference entities that haven't been created yet:

```json
{
  "characters": [
    {
      "id": "character1",
      "spouseRef": "character2"  // character2 defined later
    },
    {
      "id": "character2",
      "spouseRef": "character1"  // character1 defined above
    }
  ]
}
```

---

## ✅ Validation Rules

The loader performs these validations:

1. **World Required**: Must have a `world` object
2. **ID Uniqueness**: All IDs must be unique within their type
3. **Reference Validity**: All `*Ref` fields must point to valid IDs
4. **Required Fields**: All required fields must be present
5. **Type Checking**: Values must match expected types

**On Error**:
- Invalid references → Warning logged, entity skipped
- Missing world → Fatal error
- Invalid JSON → Fatal error

---

## 🎨 Best Practices

### **1. Use Descriptive IDs**

❌ **Bad**:
```json
{"id": "c1", "firstName": "John"}
{"id": "c2", "firstName": "Jane"}
```

✅ **Good**:
```json
{"id": "human_king", "firstName": "John"}
{"id": "human_queen", "firstName": "Jane"}
```

### **2. Group by Entity Type**

✅ **Good**:
```json
{
  "countries": [/* all countries */],
  "settlements": [/* all settlements */],
  "characters": [/* all characters */]
}
```

### **3. Logical Ordering**

Create parent entities before referencing them in relationships (though not strictly required due to two-pass loading).

### **4. Add Comments via Descriptions**

Since JSON doesn't support comments, use verbose descriptions:

```json
{
  "id": "wizard_mentor",
  "firstName": "Merlin",
  "description": "Wise old mentor character"
}
```

### **5. Start Small, Expand**

Begin with 5-10 characters, test loading, then expand.

---

## 🚀 Usage Examples

### **Minimal World**

```json
{
  "world": {
    "name": "Test World",
    "description": "A minimal test world"
  },
  "countries": [
    {
      "id": "test_country",
      "name": "Test Country",
      "governmentType": "democracy",
      "economicSystem": "capitalist"
    }
  ],
  "settlements": [
    {
      "id": "test_city",
      "countryRef": "test_country",
      "name": "Test City",
      "settlementType": "city",
      "population": 10000,
      "terrain": "plains"
    }
  ],
  "characters": [
    {
      "id": "test_person",
      "firstName": "Test",
      "lastName": "Person",
      "gender": "male",
      "birthYear": 2000,
      "locationRef": "test_city"
    }
  ]
}
```

### **Family Tree**

```json
{
  "characters": [
    {
      "id": "grandfather",
      "firstName": "Old",
      "lastName": "Smith",
      "gender": "male",
      "birthYear": 1920,
      "locationRef": "hometown"
    },
    {
      "id": "father",
      "firstName": "Middle",
      "lastName": "Smith",
      "gender": "male",
      "birthYear": 1950,
      "parentRefs": ["grandfather"],
      "locationRef": "hometown",
      "spouseRef": "mother"
    },
    {
      "id": "mother",
      "firstName": "Mary",
      "lastName": "Smith",
      "gender": "female",
      "birthYear": 1952,
      "locationRef": "hometown",
      "spouseRef": "father"
    },
    {
      "id": "son",
      "firstName": "Young",
      "lastName": "Smith",
      "gender": "male",
      "birthYear": 1980,
      "parentRefs": ["father", "mother"],
      "locationRef": "hometown"
    }
  ]
}
```

### **Complex Relationships**

```json
{
  "characters": [
    {"id": "hero", "firstName": "Hero", ...},
    {"id": "mentor", "firstName": "Mentor", ...},
    {"id": "sidekick", "firstName": "Sidekick", ...},
    {"id": "villain", "firstName": "Villain", ...}
  ],
  "relationships": [
    {
      "characterRef": "hero",
      "friendRefs": ["mentor", "sidekick"],
      "enemyRefs": ["villain"]
    },
    {
      "characterRef": "villain",
      "enemyRefs": ["hero", "mentor", "sidekick"]
    }
  ]
}
```

---

## 🔮 Future Extensions

Planned features for future versions:

- [ ] **JSON Schema**: Formal schema validation
- [ ] **Composition**: Import/extend other .insimul files
- [ ] **Templates**: Reusable entity templates
- [ ] **Procedural**: Inline generation rules
- [ ] **Events**: Timeline/historical events
- [ ] **Quests**: Quest definitions
- [ ] **Items**: Artifact/item definitions
- [ ] **AI**: LLM-generated descriptions
- [ ] **Validation**: Pre-load validation tool

---

## 📚 Related Documentation

- `server/seed/README.md` - Seed directory guide
- `server/seed/insimul-loader.ts` - Loader implementation
- `server/seed/*/` - Preset examples
- `docs/SEED_AND_TEST_REORGANIZATION.md` - Reorganization history

---

## 🐛 Known Issues

1. **Schema Compatibility**: Some TypeScript type mismatches with current schema
2. **No Validation**: No pre-load validation, errors only at runtime
3. **Limited Types**: Not all entity types supported yet
4. **No Composition**: Can't import/extend other files

---

## 📖 Version History

- **v1.0** (2024): Initial .insimul format spec
  - Basic world, country, settlement, character support
  - Two-pass reference resolution
  - Relationship and business support

---

*Specification v1.0 - Subject to change*
