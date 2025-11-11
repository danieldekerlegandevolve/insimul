# Insimul Seed Data

**Declarative world data using .insimul format**

This directory contains seed data for generating worlds in Insimul. Instead of procedural TypeScript code, worlds are defined declaratively in `.insimul` JSON files that are loaded by the `insimul-loader.ts` system.

---

## 📁 Directory Structure

```
seed/
├── fantasy/
│   └── fantasy.insimul          # High fantasy world with multiple races
├── historical/
│   └── historical.insimul       # Victorian England, Industrial Revolution
├── medieval/
│   └── medieval.insimul         # Medieval Camelot with knights
├── modern/
│   └── modern.insimul           # Contemporary urban setting
├── scifi/
│   └── scifi.insimul            # Futuristic space colony
├── common/
│   └── (shared data, grammars, rules)
│
├── insimul-loader.ts            # Loads .insimul files into database
├── insimul-example-rules.ts     # Example behavioral rules
├── mongo-init-simple.ts         # Simple DB initialization
├── seed-grammars.ts             # Tracery grammar definitions
└── example-tracery-rule.ts      # Tracery rule example
```

---

## 📄 .insimul File Format

The `.insimul` format is a declarative JSON schema for defining complete worlds:

```json
{
  "world": {
    "name": "World Name",
    "description": "World description",
    "sourceFormats": ["insimul"],
    "config": { /* custom configuration */ }
  },
  "countries": [
    {
      "id": "country_ref",
      "name": "Country Name",
      "governmentType": "monarchy",
      "economicSystem": "feudal"
    }
  ],
  "settlements": [
    {
      "id": "settlement_ref",
      "countryRef": "country_ref",
      "name": "Settlement Name",
      "settlementType": "city",
      "population": 10000,
      "terrain": "plains"
    }
  ],
  "characters": [
    {
      "id": "character_ref",
      "firstName": "First",
      "lastName": "Last",
      "gender": "male",
      "birthYear": 1000,
      "occupation": "king",
      "locationRef": "settlement_ref",
      "spouseRef": "other_character_ref",
      "parentRefs": ["parent1_ref", "parent2_ref"]
    }
  ],
  "relationships": [
    {
      "characterRef": "character_ref",
      "friendRefs": ["friend1_ref", "friend2_ref"],
      "enemyRefs": ["enemy_ref"]
    }
  ],
  "businesses": [
    {
      "id": "business_ref",
      "name": "Business Name",
      "businessType": "shop",
      "locationRef": "settlement_ref",
      "ownerRef": "character_ref"
    }
  ]
}
```

### **Reference System**

The `.insimul` format uses a reference system with two passes:

1. **First Pass**: Create all entities and map their reference IDs to database IDs
2. **Second Pass**: Resolve references and create relationships

This allows you to reference entities before they're fully created, making the format declarative and order-independent.

---

## 🚀 Usage

### **Load a Preset World**

```typescript
import { loadWorldPreset } from './seed/insimul-loader';
import { storage } from './storage';

// Load fantasy world
const worldId = await loadWorldPreset(storage, 'fantasy');

// Available presets: 'fantasy', 'historical', 'medieval', 'modern', 'scifi'
```

### **Load Custom .insimul File**

```typescript
import { loadInsimulWorld } from './seed/insimul-loader';
import { storage } from './storage';
import path from 'path';

const worldId = await loadInsimulWorld(
  storage,
  path.join(__dirname, 'custom', 'my-world.insimul')
);
```

### **Create Your Own Preset**

1. Create a directory: `seed/my-preset/`
2. Create a file: `my-preset.insimul`
3. Define your world using the .insimul format
4. Load it:

```typescript
const worldId = await loadWorldPreset(storage, 'my-preset');
```

---

## 🎭 Preset Descriptions

### **Fantasy** (`fantasy/fantasy.insimul`)
- **Setting**: High fantasy realm with multiple races
- **Features**: Elves, dwarves, humans, orcs
- **Locations**: Kingdoms, forests, mountain holds
- **Characters**: Kings, queens, wizards, warriors
- **Theme**: Magic, prophecies, cross-racial conflicts

### **Historical** (`historical/historical.insimul`)
- **Setting**: Victorian England, 1880s
- **Features**: Industrial Revolution, social classes
- **Locations**: London, Manchester
- **Characters**: Aristocrats, inventors, factory owners
- **Theme**: Innovation, empire, class struggle

### **Medieval** (`medieval/medieval.insimul`)
- **Setting**: Kingdom of Camelot, 1200s
- **Features**: Knights, castles, feudalism
- **Locations**: Camelot Castle, Sherwood Village
- **Characters**: King Arthur, knights, wizards
- **Theme**: Chivalry, honor, feudal loyalty

### **Modern** (`modern/modern.insimul`)
- **Setting**: Contemporary urban metropolis, 2024
- **Features**: Diverse careers, technology, modern life
- **Locations**: Metro City
- **Characters**: Mayor, CEO, doctors, teachers, artists
- **Theme**: Urban life, diversity, modern society

### **Scifi** (`scifi/scifi.insimul`)
- **Setting**: Space colony, 2340
- **Features**: Advanced AI, space travel, multiple planets
- **Locations**: Nova City, Olympus Station
- **Characters**: Admirals, scientists, AI researchers, pilots
- **Theme**: Future tech, AI ethics, space exploration

---

## 🔧 Advanced Features

### **Reference Types**

The loader supports these reference types:

- `countryRef` → References a country by its `id`
- `locationRef` → References a settlement by its `id`
- `spouseRef` → References a character by its `id`
- `parentRefs` → Array of parent character IDs
- `friendRefs` → Array of friend character IDs
- `enemyRefs` → Array of enemy character IDs
- `ownerRef` → References a business owner by character `id`

### **Custom Configuration**

Each world can have custom configuration in the `config` field:

```json
{
  "world": {
    "config": {
      "era": "fantasy",
      "magic": "high",
      "technology": "medieval",
      "customSetting": "value"
    }
  }
}
```

### **Validation**

The loader performs validation:
- ✅ Warns about missing references
- ✅ Skips entities with invalid references
- ✅ Logs all creation steps
- ✅ Provides clear error messages

---

## 📝 Creating Seed Data

### **Best Practices**

1. **Use Descriptive IDs**: `human_king`, `elf_princess`, not `char1`, `char2`
2. **Group by Type**: All countries, then settlements, then characters
3. **Logical Ordering**: Create parent entities before children
4. **Add Comments**: JSON doesn't support comments, but descriptive names help
5. **Start Small**: Begin with 5-10 characters, expand as needed

### **Example: Adding a New Character**

```json
{
  "id": "my_character",
  "firstName": "John",
  "lastName": "Smith",
  "gender": "male",
  "birthYear": 1000,
  "occupation": "blacksmith",
  "locationRef": "my_village",
  "spouseRef": "my_spouse",
  "parentRefs": ["father_ref", "mother_ref"]
}
```

Then add relationships:

```json
{
  "characterRef": "my_character",
  "friendRefs": ["friend1", "friend2"]
}
```

---

## 🗂️ Other Seed Files

### **insimul-example-rules.ts**
Example behavioral rules showing how characters make decisions based on personality, relationships, and context.

**Usage**:
```typescript
import { insimulExampleRules } from './seed/insimul-example-rules';
```

### **seed-grammars.ts**
Tracery grammar definitions for procedural text generation.

**Usage**:
```typescript
import { seedGrammars } from './seed/seed-grammars';
```

### **mongo-init-simple.ts**
Simple MongoDB initialization class that can seed a basic world.

**Usage**:
```typescript
import { MongoSimpleInitializer } from './seed/mongo-init-simple';
const initializer = new MongoSimpleInitializer();
await initializer.initialize();
```

---

## 🎯 Benefits of .insimul Format

1. **Declarative**: Define what you want, not how to create it
2. **Easy to Edit**: No programming required
3. **Version Control Friendly**: Simple JSON diffs
4. **Shareable**: Copy/paste worlds easily
5. **Modular**: Mix and match data from different sources
6. **Validated**: Loader checks for errors
7. **Documented**: Self-documenting structure

---

## 📚 Examples

### **Minimal World**

```json
{
  "world": {
    "name": "Tiny Village",
    "description": "A small village"
  },
  "countries": [
    {
      "id": "kingdom",
      "name": "The Kingdom",
      "governmentType": "monarchy",
      "economicSystem": "feudal"
    }
  ],
  "settlements": [
    {
      "id": "village",
      "countryRef": "kingdom",
      "name": "The Village",
      "settlementType": "village",
      "population": 100,
      "terrain": "plains"
    }
  ],
  "characters": [
    {
      "id": "mayor",
      "firstName": "John",
      "lastName": "Smith",
      "gender": "male",
      "birthYear": 1980,
      "occupation": "mayor",
      "locationRef": "village"
    }
  ]
}
```

### **Complex Relationships**

```json
{
  "characters": [
    {
      "id": "king",
      "firstName": "Arthur",
      "lastName": "Pendragon",
      "gender": "male",
      "birthYear": 1170,
      "occupation": "king",
      "locationRef": "castle",
      "spouseRef": "queen"
    },
    {
      "id": "queen",
      "firstName": "Guinevere",
      "lastName": "Pendragon",
      "gender": "female",
      "birthYear": 1175,
      "occupation": "queen",
      "locationRef": "castle",
      "spouseRef": "king"
    },
    {
      "id": "prince",
      "firstName": "Mordred",
      "lastName": "Pendragon",
      "gender": "male",
      "birthYear": 1195,
      "occupation": "prince",
      "locationRef": "castle",
      "parentRefs": ["king", "queen"]
    }
  ],
  "relationships": [
    {
      "characterRef": "king",
      "friendRefs": ["knight1", "knight2"],
      "enemyRefs": ["villain"]
    }
  ]
}
```

---

## 🚧 Known Limitations

- **TypeScript Errors**: The loader has some schema compatibility issues that need to be resolved
- **No Validation**: The .insimul format doesn't have a JSON schema validator yet
- **Limited Types**: Not all entity types are supported (e.g., quests, events)
- **No Inheritance**: Can't extend or compose .insimul files

---

## 🔮 Future Enhancements

- [ ] JSON Schema validation for .insimul files
- [ ] .insimul file composition (import/extend)
- [ ] GUI editor for .insimul files
- [ ] More entity types (quests, events, items)
- [ ] Procedural generation within .insimul
- [ ] Import from other formats (CSV, YAML, etc.)

---

## 📖 Documentation

- **Format Spec**: This README
- **Examples**: All preset directories
- **Loader API**: `insimul-loader.ts` source code

---

*Happy world building! 🌍*
