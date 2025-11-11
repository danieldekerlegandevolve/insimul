# ✅ Server Directory Cleanup Complete

**Organized server files into logical directories for better maintainability**

---

## 🎯 What Was Done

Reorganized scattered files in the server root into appropriate directories based on their purpose and functionality.

---

## 📁 New Directory Structure

```
server/
├── config/              # Configuration (Gemini API, etc.)
├── engines/             # Rule execution engines
│   ├── prolog-engine.ts
│   └── unified-engine.ts
├── extensions/          # Simulation systems by origin
│   ├── tott/           # Talk of the Town systems
│   └── kismet/         # Kismet systems
├── generators/          # World/character generation
│   ├── genealogy-generator.ts
│   ├── geography-generator.ts
│   ├── name-generator.ts      ⬅️ MOVED from services/
│   └── world-generator.ts
├── seed/               # Seed data (.insimul presets)
├── services/           # Utility services
│   ├── character-interaction.ts  ⬅️ MOVED from root
│   ├── tracery-service.ts        ⬅️ MOVED from root
│   └── tts-stt.ts                ⬅️ MOVED from root
├── tests/              # Test files
└── utils/              # Utility functions
```

---

## 🔄 Files Moved

### **1. name-generator.ts**

**Before**: `server/services/name-generator.ts`  
**After**: `server/generators/name-generator.ts`

**Reason**: It's a generator that creates names for characters and settlements. Belongs with other generators (`world-generator.ts`, `genealogy-generator.ts`, `geography-generator.ts`).

**Imports Updated**:
- `generators/genealogy-generator.ts` - Updated to `./name-generator.js`
- `routes.ts` - Updated to `./generators/name-generator.js`

### **2. character-interaction.ts**

**Before**: `server/character-interaction.ts` (root)  
**After**: `server/services/character-interaction.ts`

**Reason**: Provides AI-powered character interaction service using Gemini. It's a service that wraps external APIs, not a core simulation component.

**Imports Updated**:
- `routes.ts` - All 5 imports updated to `./services/character-interaction.js`

**Functions**:
- `getCharacterResponse()` - Generate character dialogue
- `getCharacterActions()` - Get available character actions
- `getActionResponse()` - Get response to character action
- `listNarrativeSections()` - List narrative sections
- `listNarrativeTriggers()` - List narrative triggers

### **3. tracery-service.ts**

**Before**: `server/tracery-service.ts` (root)  
**After**: `server/services/tracery-service.ts`

**Reason**: Wraps the Tracery grammar library for procedural text generation. Clear service pattern - provides a specific utility function.

**Imports Updated**:
- `engines/unified-engine.ts` - Updated to `../services/tracery-service`
- `tests/test-tracery.ts` - Updated to `../services/tracery-service`

**Class**: `TraceryService`
- Static methods for grammar expansion
- Used by the unified engine for narrative generation

### **4. tts-stt.ts**

**Before**: `server/tts-stt.ts` (root)  
**After**: `server/services/tts-stt.ts`

**Reason**: Provides text-to-speech and speech-to-text services using Google Cloud APIs. These are external utility services, not core simulation features.

**Imports Updated**:
- `routes.ts` - All 3 imports updated to `./services/tts-stt.js`

**Functions**:
- `textToSpeech()` - Convert text to audio
- `speechToText()` - Convert audio to text
- `getAvailableVoices()` - List available TTS voices

---

## 📋 Directory Purposes

### **generators/**
Code that creates/generates simulation content:
- World generation
- Character/genealogy generation
- Name generation
- Geography generation

**Pattern**: Takes parameters, generates complex entities

### **services/**
Utility services that wrap external APIs or provide specific features:
- AI character interaction (Gemini)
- Text generation (Tracery)
- Speech synthesis/recognition (Google Cloud)

**Pattern**: Provides specific capability, often wraps external service

### **engines/**
Rule execution and simulation engines:
- Prolog engine
- Unified rule engine

**Pattern**: Executes rules, drives simulation logic

### **extensions/**
Simulation systems organized by origin:
- `tott/` - Talk of the Town derived
- `kismet/` - Kismet derived

**Pattern**: Core simulation features and mechanics

---

## 🎯 Benefits

### **1. Clearer Purpose**
Each directory now has a clear, specific purpose. No more ambiguity about where code belongs.

### **2. Easier Navigation**
Developers can find files faster:
- Need a generator? Look in `generators/`
- Need a service? Look in `services/`
- Need an engine? Look in `engines/`

### **3. Better Scalability**
Easy to add new files in the right place:
- New generator → `generators/`
- New service → `services/`
- New simulation system → `extensions/`

### **4. Cleaner Root**
The server root is no longer cluttered with miscellaneous files. Only essential infrastructure remains.

### **5. Self-Documenting**
Directory structure tells you what the code does without reading it.

---

## 📊 Before & After

### **Before (Cluttered Root)**

```
server/
├── character-interaction.ts  ❌ Loose in root
├── tracery-service.ts        ❌ Loose in root
├── tts-stt.ts                ❌ Loose in root
├── services/
│   └── name-generator.ts     ❌ Actually a generator
├── generators/
│   ├── genealogy-generator.ts
│   ├── geography-generator.ts
│   └── world-generator.ts
└── ...
```

**Issues**:
- Files scattered in root directory
- `name-generator.ts` misplaced in `services/`
- No clear organization pattern

### **After (Organized)**

```
server/
├── generators/               ✅ All generators together
│   ├── genealogy-generator.ts
│   ├── geography-generator.ts
│   ├── name-generator.ts     ✅ Moved here
│   └── world-generator.ts
├── services/                 ✅ All services together
│   ├── character-interaction.ts  ✅ Moved here
│   ├── tracery-service.ts        ✅ Moved here
│   └── tts-stt.ts                ✅ Moved here
└── ...
```

**Benefits**:
- Clear logical groupings
- Easy to find related code
- Consistent organization pattern

---

## 🔍 Import Path Changes

If you have custom code that imports these files, update paths:

### **name-generator.ts**

```typescript
// Old
import { nameGenerator } from '../services/name-generator.js';

// New
import { nameGenerator } from '../generators/name-generator.js';
```

### **character-interaction.ts**

```typescript
// Old
import { getCharacterResponse } from '../character-interaction.js';

// New
import { getCharacterResponse } from '../services/character-interaction.js';
```

### **tracery-service.ts**

```typescript
// Old
import { TraceryService } from '../tracery-service';

// New
import { TraceryService } from '../services/tracery-service';
```

### **tts-stt.ts**

```typescript
// Old
import { textToSpeech } from '../tts-stt.js';

// New
import { textToSpeech } from '../services/tts-stt.js';
```

---

## ✅ Files Updated

All imports were automatically updated in:

1. **generators/genealogy-generator.ts**
   - Updated `name-generator` import to relative path

2. **routes.ts** (9 imports updated)
   - Updated `name-generator` import
   - Updated 5 `character-interaction` imports
   - Updated 3 `tts-stt` imports

3. **engines/unified-engine.ts**
   - Updated `TraceryService` import

4. **tests/test-tracery.ts**
   - Updated `TraceryService` import
   - Updated `seedGrammars` import to `../seed/seed-grammars`

---

## 🚫 What Wasn't Moved

These files stay in their current locations:

### **Root Directory**
- `gemini-ai.ts` - Core AI functionality, used everywhere
- `routes.ts` - Main routing file
- `storage.ts` - Storage abstraction
- `mongo-storage.ts` - MongoDB implementation
- `mongo-startup.ts` - Server startup
- `prolog-manager.ts`, `prolog-sync.ts` - Prolog integration
- `progress-tracker.ts` - Progress tracking utility
- `verify-db.ts` - Database verification
- `vite.ts` - Vite configuration
- `index.ts` - Server entry point

**Reason**: These are infrastructure/core files that need to be at the root level.

---

## 📝 Recommended Next Steps

### **1. Consider Further Organization**

Some files in the root might benefit from organization:
- `prolog-manager.ts`, `prolog-sync.ts` → `engines/prolog/`?
- `progress-tracker.ts` → `utils/`?
- `verify-db.ts` → `utils/` or `tools/`?

### **2. Remove Empty Directories**

The `services/` directory previously only had `name-generator.ts`. Now it has purpose with 3 service files. ✅

### **3. Create README Files**

Add `README.md` files to key directories explaining their purpose:
- `generators/README.md`
- `services/README.md`
- `engines/README.md`

### **4. Barrel Exports**

Consider adding index files for cleaner imports:
- `generators/index.ts` - Export all generators
- `services/index.ts` - Export all services

---

## 🎓 Lessons Learned

### **Generator vs Service**

**Generator**: Creates/builds entities
- Takes configuration → Returns entities
- Examples: world-generator, name-generator

**Service**: Provides specific capability
- Wraps external API or library
- Examples: TTS/STT, AI interaction, text generation

### **Location Hints**

If a file:
- **Generates content** → `generators/`
- **Wraps external API** → `services/`
- **Executes rules** → `engines/`
- **Extends simulation** → `extensions/`
- **Tests functionality** → `tests/`
- **Defines seed data** → `seed/`

---

## 📚 Related Documentation

- `EXTENSION_REORGANIZATION.md` - Extension systems reorganization
- `SEED_AND_TEST_REORGANIZATION.md` - Seed and test cleanup
- `INSIMUL_SEED_REFACTORING.md` - .insimul format refactoring

---

## 🏆 Summary

### **Files Moved**: 4
- `name-generator.ts` → `generators/`
- `character-interaction.ts` → `services/`
- `tracery-service.ts` → `services/`
- `tts-stt.ts` → `services/`

### **Imports Updated**: 9 files
- `generators/genealogy-generator.ts`
- `routes.ts` (9 import statements)
- `engines/unified-engine.ts`
- `tests/test-tracery.ts`

### **Directories Organized**: 2
- `generators/` - Now has all generators
- `services/` - Now has all services

### **Root Cleaned**: ✅
- Removed 3 loose files from root
- Root now only contains infrastructure

---

*Server directory cleanup complete - Better organization, easier navigation, clearer purpose* ✅
