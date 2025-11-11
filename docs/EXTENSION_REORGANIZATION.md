# Extension Directory Reorganization Plan

**Organizing extensions by origin: TotT vs Kismet vs Core**

---

## 📁 Proposed Directory Structure

```
server/extensions/
├── tott/              # Talk of the Town derived systems
│   ├── appearance-system.ts
│   ├── artifact-system.ts
│   ├── autonomous-behavior-system.ts
│   ├── building-commission-system.ts
│   ├── drama-recognition-system.ts
│   ├── education-system.ts
│   ├── grieving-system.ts
│   ├── knowledge-system.ts
│   ├── name-system.ts
│   ├── personality-behavior-system.ts
│   ├── relationship-utils.ts
│   ├── sexuality-system.ts
│   └── social-dynamics-system.ts
│
├── kismet/            # Kismet derived systems
│   ├── conversation-system.ts
│   ├── impulse-system.ts
│   └── volition-system.ts
│
└── core/              # Core/shared systems
    ├── business-system.ts
    ├── economics-system.ts
    ├── event-system.ts
    ├── hiring-system.ts
    ├── lifecycle-system.ts
    ├── routine-system.ts
    └── town-events-system.ts
```

---

## 🎯 System Categorization

### **TotT Systems** (13 files)

Systems derived from Talk of the Town's Python codebase:

| System | Origin | Description |
|--------|--------|-------------|
| `appearance-system.ts` | Phase 13 | Facial features, genetic inheritance, attractiveness |
| `artifact-system.ts` | Phase 19 | Photographs, gravestones, signals, provenance |
| `autonomous-behavior-system.ts` | Phases 11-12 | observe(), socialize(), autonomous actions |
| `building-commission-system.ts` | Phase 16 | Construction, architects, builders, timelines |
| `drama-recognition-system.ts` | Phase 18 | Love triangles, rivalries, story excavation |
| `education-system.ts` | Phase 15 | College, degrees, majors, GPA tracking |
| `grieving-system.ts` | Phase 14 | Grief stages, emotional response to death |
| `knowledge-system.ts` | Core TotT | Mental models, beliefs, knowledge propagation |
| `name-system.ts` | Phase 17 | Jr/Sr/II, maiden names, nicknames, history |
| `personality-behavior-system.ts` | Phase 12 | Big Five traits, behavioral functions |
| `relationship-utils.ts` | Core TotT | Charge, spark, salience calculations |
| `sexuality-system.ts` | Phase 20 | Orientation, fertility, adoption, coming out |
| `social-dynamics-system.ts` | Core TotT | Relationship progression, compatibility |

### **Kismet Systems** (3 files)

Systems derived from Kismet's goal-oriented architecture:

| System | Origin | Description |
|--------|--------|-------------|
| `conversation-system.ts` | Kismet | Dialogue generation, topic selection, context |
| `impulse-system.ts` | Kismet | Impulse-driven behavior, spontaneous actions |
| `volition-system.ts` | Kismet | Goal formation, intention, volition framework |

### **Core/Shared Systems** (7 files)

Systems used by both or foundational to Insimul:

| System | Type | Description |
|--------|------|-------------|
| `business-system.ts` | Core | Business operations, ownership |
| `economics-system.ts` | Core | Wealth, transactions, economy |
| `event-system.ts` | Core | Event scheduling, lifecycle events |
| `hiring-system.ts` | Core | Job hiring, employment |
| `lifecycle-system.ts` | Core | Birth, death, aging, marriage |
| `routine-system.ts` | Core | Daily schedules, whereabouts |
| `town-events-system.ts` | Core | Simulation-wide events |

---

## 🔄 Migration Steps

### **Step 1: Create Directory Structure**
```bash
mkdir -p server/extensions/tott
mkdir -p server/extensions/kismet
mkdir -p server/extensions/core
```

### **Step 2: Move TotT Systems**
```bash
mv server/extensions/appearance-system.ts server/extensions/tott/
mv server/extensions/artifact-system.ts server/extensions/tott/
mv server/extensions/autonomous-behavior-system.ts server/extensions/tott/
mv server/extensions/building-commission-system.ts server/extensions/tott/
mv server/extensions/drama-recognition-system.ts server/extensions/tott/
mv server/extensions/education-system.ts server/extensions/tott/
mv server/extensions/grieving-system.ts server/extensions/tott/
mv server/extensions/knowledge-system.ts server/extensions/tott/
mv server/extensions/name-system.ts server/extensions/tott/
mv server/extensions/personality-behavior-system.ts server/extensions/tott/
mv server/extensions/relationship-utils.ts server/extensions/tott/
mv server/extensions/sexuality-system.ts server/extensions/tott/
mv server/extensions/social-dynamics-system.ts server/extensions/tott/
```

### **Step 3: Move Kismet Systems**
```bash
mv server/extensions/conversation-system.ts server/extensions/kismet/
mv server/extensions/impulse-system.ts server/extensions/kismet/
mv server/extensions/volition-system.ts server/extensions/kismet/
```

### **Step 4: Move Core Systems**
```bash
mv server/extensions/business-system.ts server/extensions/core/
mv server/extensions/economics-system.ts server/extensions/core/
mv server/extensions/event-system.ts server/extensions/core/
mv server/extensions/hiring-system.ts server/extensions/core/
mv server/extensions/lifecycle-system.ts server/extensions/core/
mv server/extensions/routine-system.ts server/extensions/core/
mv server/extensions/town-events-system.ts server/extensions/core/
```

### **Step 5: Update Import Paths**

All files that import from extensions will need updated paths:

**Before**:
```typescript
import { getPersonality } from '../extensions/personality-behavior-system';
import { observeArtifact } from '../extensions/artifact-system';
import { makeVolition } from '../extensions/volition-system';
```

**After**:
```typescript
import { getPersonality } from '../extensions/tott/personality-behavior-system';
import { observeArtifact } from '../extensions/tott/artifact-system';
import { makeVolition } from '../extensions/kismet/volition-system';
```

### **Step 6: Create Index Files**

Create barrel exports for easier imports:

**`server/extensions/tott/index.ts`**:
```typescript
// TotT Systems - Talk of the Town Features
export * from './appearance-system';
export * from './artifact-system';
export * from './autonomous-behavior-system';
export * from './building-commission-system';
export * from './drama-recognition-system';
export * from './education-system';
export * from './grieving-system';
export * from './knowledge-system';
export * from './name-system';
export * from './personality-behavior-system';
export * from './relationship-utils';
export * from './sexuality-system';
export * from './social-dynamics-system';
```

**`server/extensions/kismet/index.ts`**:
```typescript
// Kismet Systems - Goal-Oriented Architecture
export * from './conversation-system';
export * from './impulse-system';
export * from './volition-system';
```

**`server/extensions/core/index.ts`**:
```typescript
// Core Systems - Foundational Insimul Features
export * from './business-system';
export * from './economics-system';
export * from './event-system';
export * from './hiring-system';
export * from './lifecycle-system';
export * from './routine-system';
export * from './town-events-system';
```

This allows cleaner imports:
```typescript
import { getPersonality, excavateDrama, createGravestone } from '../extensions/tott';
import { makeVolition, generateImpulse } from '../extensions/kismet';
import { processLifecycleEvent } from '../extensions/core';
```

---

## 📝 Files to Update

After moving files, these locations will need import path updates:

### **Server Files**:
- `server/routes.ts` - API endpoints using extensions
- `server/simulate.ts` - Simulation loop
- `server/generators/*.ts` - World/character generation
- `server/managers/*.ts` - TotT manager classes
- `server/events/*.ts` - TotT event handlers

### **Test Files**:
- Any test files importing from extensions

### **Documentation**:
- Update all docs to reference new paths
- Update README with new structure

---

## ✅ Benefits

1. **Clarity**: Clear separation of system origins
2. **Maintainability**: Easier to understand dependencies
3. **Attribution**: Proper credit to TotT and Kismet
4. **Modularity**: Systems grouped by purpose
5. **Scalability**: Easy to add new systems to appropriate folder
6. **Documentation**: Clearer architecture for new developers

---

## 🔍 Import Pattern Search

To find all files that need updating, search for:

```bash
# Find all imports from extensions
grep -r "from.*extensions/" server/ --include="*.ts"

# Find specific system imports
grep -r "personality-behavior-system" server/ --include="*.ts"
grep -r "volition-system" server/ --include="*.ts"
grep -r "artifact-system" server/ --include="*.ts"
```

---

## 📊 Statistics

**Total Files to Move**: 23
- TotT: 13 files (~260KB)
- Kismet: 3 files (~23KB)
- Core: 7 files (~132KB)

**Estimated Import Updates**: 50-100 files

**Time Estimate**: 1-2 hours for complete refactoring

---

## 🎯 Execution Order

1. ✅ Create directory structure
2. ⏳ Move files to new locations
3. ⏳ Create index.ts barrel exports
4. ⏳ Search and update all import paths
5. ⏳ Test compilation
6. ⏳ Update documentation
7. ⏳ Commit with descriptive message

---

## 📚 Documentation Updates Needed

- `README.md` - Update architecture section
- `ARCHITECTURE.md` - Document new structure
- `TOTT_FEATURE_AUDIT.md` - Update file paths
- `OPTION_C_COMPLETE.md` - Update file references
- All phase documentation

---

*Reorganization plan - Ready for execution*
