# ✅ Seed Data & Test File Reorganization Complete

**All seed data and test files consolidated into organized directories**

---

## 📁 New Directory Structure

```
server/
├── seed/              # All seed data and example generators
│   ├── example-tracery-rule.ts
│   ├── mongo-init-simple.ts
│   ├── seed-grammars.ts
│   ├── world-generator-fantasy.ts
│   ├── world-generator-historical.ts
│   ├── world-generator-medieval.ts
│   ├── world-generator-modern.ts
│   └── world-generator-scifi.ts
│
├── tests/             # All test files
│   ├── comprehensive-prolog-tests.ts
│   ├── run-tests.ts
│   ├── test-character-snapshots.ts
│   └── test-tracery.ts
│
└── rules/             # Rule definitions
    └── insimul-example-rules.ts  (renamed from tott-example-rules.ts)
```

---

## 🎯 What Changed

### **Seed Directory** (8 files)
All seed data, example generators, and initialization code:

**From root**:
- `example-tracery-rule.ts` → `seed/`
- `seed-grammars.ts` → `seed/`

**From database/**:
- `database/mongo-init-simple.ts` → `seed/`

**From test-worlds/**:
- `world-generator-fantasy.ts` → `seed/`
- `world-generator-historical.ts` → `seed/`
- `world-generator-medieval.ts` → `seed/`
- `world-generator-modern.ts` → `seed/`
- `world-generator-scifi.ts` → `seed/`

### **Tests Directory** (4 files)
All test files and test runners:

**From root**:
- `test-character-snapshots.ts` → `tests/`
- `test-tracery.ts` → `tests/`

**From test-worlds/**:
- `comprehensive-prolog-tests.ts` → `tests/`
- `run-tests.ts` → `tests/`

### **Rules Directory** (renamed file)
**Renamed**:
- `tott-example-rules.ts` → `insimul-example-rules.ts`

**Updated**:
- Export name: `tottExampleRules` → `insimulExampleRules`
- Comments updated to reflect Insimul format (not TotT Python format)
- Source format: `"tott"` → `"insimul"` (14 occurrences)

### **Removed**:
- ❌ `test-worlds/` directory (consolidated into seed/ and tests/)

---

## 🔄 Updated References

### **Import Path Updates**:

**`seed/mongo-init-simple.ts`**:
```typescript
// Before
import { tottExampleRules } from '../rules/tott-example-rules';
const { seedGrammars } = await import('../seed-grammars');

// After
import { insimulExampleRules } from '../rules/insimul-example-rules';
const { seedGrammars } = await import('./seed-grammars');
```

---

## 📋 Rationale

### **Why Rename `tott-example-rules.ts`?**

The file was named `tott-example-rules.ts` but actually contained **Insimul format rules**, not Talk of the Town Python format rules. The rules:
- Use Insimul's rule DSL syntax
- Have `sourceFormat: "tott"` (misleading - now changed to `"insimul"`)
- Are written for Insimul's rule engine, not TotT's Python code

**Solution**: Renamed to `insimul-example-rules.ts` to accurately reflect their purpose.

### **Why Consolidate Seed Data?**

Previously scattered across:
- Root directory (`example-tracery-rule.ts`, `seed-grammars.ts`)
- `database/` directory (`mongo-init-simple.ts`)
- `test-worlds/` directory (5 world generators)

**Solution**: All seed data and example generators now in `seed/` directory for clarity.

### **Why Separate Tests?**

Test files were mixed with seed data in `test-worlds/`:
- `comprehensive-prolog-tests.ts` - Test suite
- `run-tests.ts` - Test runner
- `test-character-snapshots.ts`, `test-tracery.ts` - In root

**Solution**: All tests now in `tests/` directory for clear organization.

---

## 📊 File Inventory

### **Seed Files** (8 total):

| File | Purpose | Source |
|------|---------|--------|
| `example-tracery-rule.ts` | Example Tracery rule | Root → Seed |
| `mongo-init-simple.ts` | Simple DB seeding | Database → Seed |
| `seed-grammars.ts` | Grammar definitions | Root → Seed |
| `world-generator-fantasy.ts` | Fantasy world preset | Test-worlds → Seed |
| `world-generator-historical.ts` | Historical preset | Test-worlds → Seed |
| `world-generator-medieval.ts` | Medieval preset | Test-worlds → Seed |
| `world-generator-modern.ts` | Modern world preset | Test-worlds → Seed |
| `world-generator-scifi.ts` | Sci-fi world preset | Test-worlds → Seed |

### **Test Files** (4 total):

| File | Purpose | Source |
|------|---------|--------|
| `comprehensive-prolog-tests.ts` | Prolog test suite | Test-worlds → Tests |
| `run-tests.ts` | Test runner | Test-worlds → Tests |
| `test-character-snapshots.ts` | Character testing | Root → Tests |
| `test-tracery.ts` | Tracery testing | Root → Tests |

### **Rule Files** (1 renamed):

| File | Purpose | Change |
|------|---------|--------|
| `insimul-example-rules.ts` | Example Insimul rules | Renamed from `tott-example-rules.ts` |

---

## 🎯 Benefits

### **1. Clear Organization**
- All seed data in one place (`seed/`)
- All tests in one place (`tests/`)
- Rules clearly named and organized

### **2. Accurate Naming**
- `insimul-example-rules.ts` correctly identifies the rule format
- No confusion between TotT Python rules and Insimul rules
- `sourceFormat: "insimul"` accurately reflects the format

### **3. Easy Discovery**
- Developers know where to find seed data
- Testers know where to find test files
- No scattered files across multiple directories

### **4. Better Maintainability**
- Seed code is grouped together
- Test code is grouped together
- Easier to update and maintain

### **5. Scalability**
- Easy to add new seed generators to `seed/`
- Easy to add new tests to `tests/`
- Clear structure for future expansion

---

## 💡 Usage

### **Running Seed Data**:

```bash
# Simple initialization
npm run db:init

# Reset and re-seed
npm run db:reset
```

**Seed files are in**: `server/seed/`

### **Running Tests**:

```bash
# Run test suite
npm test  # or appropriate test command

# Run specific tests
node server/tests/run-tests.ts
node server/tests/test-tracery.ts
```

**Test files are in**: `server/tests/`

### **Using Example Rules**:

```typescript
// Import example rules
import { insimulExampleRules } from './rules/insimul-example-rules';

// Use in your code
for (const rule of insimulExampleRules) {
  await storage.createRule(rule);
}
```

**Rule files are in**: `server/rules/`

### **Using World Generators**:

```typescript
// Import fantasy world generator
import { generateFantasyWorld } from './seed/world-generator-fantasy';

// Generate a fantasy world
const world = await generateFantasyWorld({
  name: "Eldoria",
  settlementName: "Dragon's Keep"
});
```

**World generators are in**: `server/seed/`

---

## 📝 Import Path Changes

If you have code that imports these files, update paths:

### **Seed Files**:
```typescript
// Old paths
import { seedGrammars } from '../seed-grammars';
import { exampleRule } from '../example-tracery-rule';
import { MongoSimpleInitializer } from '../database/mongo-init-simple';

// New paths
import { seedGrammars } from '../seed/seed-grammars';
import { exampleRule } from '../seed/example-tracery-rule';
import { MongoSimpleInitializer } from '../seed/mongo-init-simple';
```

### **Test Files**:
```typescript
// Old paths
import { runTests } from '../test-worlds/run-tests';
import { testTracery } from '../test-tracery';

// New paths
import { runTests } from '../tests/run-tests';
import { testTracery } from '../tests/test-tracery';
```

### **Rule Files**:
```typescript
// Old import
import { tottExampleRules } from '../rules/tott-example-rules';

// New import
import { insimulExampleRules } from '../rules/insimul-example-rules';
```

---

## ✅ Verification Checklist

- ✅ All seed files moved to `seed/`
- ✅ All test files moved to `tests/`
- ✅ `tott-example-rules.ts` renamed to `insimul-example-rules.ts`
- ✅ Export renamed: `tottExampleRules` → `insimulExampleRules`
- ✅ Source format updated: `"tott"` → `"insimul"`
- ✅ Import in `mongo-init-simple.ts` updated
- ✅ Internal imports updated (seed-grammars)
- ✅ `test-worlds/` directory removed
- ✅ Documentation created

---

## 📚 Related Documentation

- `EXTENSION_REORGANIZATION.md` - Extension directory organization
- `FINAL_REORGANIZATION.md` - TotT/Kismet separation
- `TOTT_FEATURE_AUDIT.md` - TotT feature parity audit
- `DATABASE_INITIALIZATION.md` - Database seeding guide

---

## 🏆 Summary

**Files Moved**: 12
- Seed files: 8
- Test files: 4

**Files Renamed**: 1
- `tott-example-rules.ts` → `insimul-example-rules.ts`

**Directories Created**: 2
- `server/seed/`
- `server/tests/`

**Directories Removed**: 1
- `server/test-worlds/`

**Import Updates**: 2
- `mongo-init-simple.ts` - Updated rule import and grammar import

---

*Seed and test reorganization completed successfully*  
*All seed data in `seed/`, all tests in `tests/`, accurate naming throughout* ✅
