# System Type Usage Audit

## Executive Summary

This document audits how the four supported systems (Insimul, Ensemble, Kismet, Talk of the Town) are used throughout the Insimul codebase via `systemType` and `systemTypes` fields.

**Key Finding:** Currently, systemType/systemTypes are used primarily for **authoring, validation, and display** purposes. There is **NO actual execution engine** that runs different logic based on these fields. All simulation execution happens in the unified engine regardless of the systemType designation.

## System Type Fields

### 1. `systemType` (singular) - String field

**Used in:**
- `rules` table - Indicates which format the rule is authored in
- `actions` table - Indicates which format the action is authored in
- Rule editor UI - Current editing format
- AI rule generation - Target format for generated rules
- Validation - Which syntax rules to apply

**Possible values:**
- `"insimul"` - Insimul native format
- `"ensemble"` - Ensemble JSON format
- `"kismet"` - Kismet Prolog-style format
- `"tott"` - Talk of the Town JSON format

### 2. `systemTypes` (plural) - Array of strings

**Used in:**
- `worlds` table - Which systems this world supports (multi-system worlds)
- `simulations` table - Which systems this simulation should use
- World creation UI - System selection
- Simulation configuration - System selection

**Purpose:** Allows a single world or simulation to declare support for multiple rule formats.

## Where SystemType is Used

### Schema Level (`shared/schema.ts`)

#### Rules Table
```typescript
systemType: text("system_type").notNull() // ensemble, kismet, tott, insimul
```
- **Purpose:** Store which format the rule is written in
- **Impact:** Display only - doesn't affect execution

#### Actions Table
```typescript
systemType: text("system_type") // ensemble, kismet, tott, insimul
```
- **Purpose:** Store which format the action is written in
- **Impact:** Display only - doesn't affect execution

#### Worlds Table
```typescript
systemTypes: jsonb("system_types").$type<string[]>().default(["insimul"])
```
- **Purpose:** Declare which systems this world supports
- **Impact:** UI filtering, not execution logic

#### Simulations Table
```typescript
systemTypes: jsonb("system_types").$type<string[]>().default(["insimul"])
```
- **Purpose:** Declare which systems should be used in simulation
- **Impact:** Stored but not used in execution

### Server-Side Usage

#### 1. **AI Rule Generation** (`server/gemini-ai.ts`)

**Function:** `generateRule(prompt: string, systemType: string)`

**Purpose:** Generate rules in the requested format
- Switches on `systemType` to provide different format examples to AI
- Returns rule text in the requested syntax
- Purely for authoring assistance

**Formats:**
- `insimul` → Insimul structured format
- `ensemble` → Ensemble JSON format
- `kismet` → Kismet Prolog-style format
- `tott` → Talk of the Town JSON format

#### 2. **Rule Validation** (`server/routes.ts`)

**Endpoint:** `POST /api/rules/validate`

**Purpose:** Syntax validation based on system type
- `insimul` - Check for `rule` keyword, `when`/`then` blocks
- `ensemble` - Check for JSON structure, predicates
- `kismet` - Check for `trait`, `:-`, relationship operators
- `tott` - Check for `rule`/`def` keywords, predicates

**Impact:** Helps users write syntactically correct rules, but doesn't affect execution

#### 3. **File/Rule CRUD** (`server/routes.ts`)

**Endpoints:**
- `POST /api/files` - Create rule with systemType
- `PUT /api/files/:id` - Update rule systemType
- `GET /api/files` - Retrieve rules with systemType for display

**Purpose:** Store and retrieve the system type designation
**Impact:** Display in UI, file organization, no execution impact

#### 4. **Rule Editing** (`server/routes.ts`)

**Endpoint:** `POST /api/edit-rule`

**Purpose:** AI-assisted rule editing in specific format
**Impact:** Authoring assistance only

### Client-Side Usage

#### 1. **Rule Editor** (`client/src/pages/editor.tsx`)

**State:** `const [systemType, setSystemType] = useState<string>('insimul')`

**Purpose:**
- Display current rule format
- Allow format switching
- Trigger format conversion when changed
- Provide syntax highlighting hints

**Conversion Logic:**
```typescript
// When systemType changes:
1. Parse current rule in old format
2. Convert to new format
3. Update display
4. Update database
```

**Impact:** Pure authoring/viewing experience

#### 2. **Rule Properties Panel** (`client/src/components/editor/rule-properties.tsx`)

**Purpose:** Display which system a rule belongs to
**Impact:** Information display only

#### 3. **Rule Create Dialog** (`client/src/components/RuleCreateDialog.tsx`)

**Purpose:** Select system type when creating new rule
**Impact:** Sets initial format for authoring

#### 4. **Rule Convert Dialog** (`client/src/components/RuleConvertDialog.tsx`)

**Purpose:** Convert rules between formats
**Impact:** Translation/viewing, not execution

#### 5. **Simulation Config** (`client/src/components/SimulationConfigDialog.tsx`)

**Purpose:** Set which systems simulation should use
**Impact:** Stored in simulation record, but NOT used in execution

#### 6. **World Details** (`client/src/components/WorldDetailsDialog.tsx`)

**Purpose:** Display/edit which systems world supports
**Impact:** Metadata only, no execution impact

### Unified Syntax System (`client/src/lib/unified-syntax.ts`)

**Classes:**
- `InsimulRuleCompiler` - Parses rules from all formats
- `InsimulRuleExporter` - Exports rules to all formats

**Purpose:** Bidirectional conversion between formats
**Methods:**
- `compileInsimul()` - Parse Insimul format
- `compileEnsemble()` - Parse Ensemble JSON
- `compileKismet()` - Parse Kismet Prolog
- `compileTalkOfTown()` - Parse TotT JSON
- `exportToFormat()` - Convert to any format

**Impact:** Translation layer for authoring/viewing, NOT execution

### Storage Layer (`server/mongo-storage.ts`)

**Purpose:** Store systemType/systemTypes fields in MongoDB
**Impact:** Persistence only, no logic based on these values

## Execution Layer

### Unified Engine (`server/engines/unified-engine.ts`)

**CRITICAL FINDING:** The execution engine does NOT check or use `systemType` or `systemTypes` at all.

**Actual execution:**
1. Load all rules for a world (regardless of systemType)
2. Parse all rules into unified internal format
3. Execute ALL rules using the same engine
4. No conditional logic based on systemType

**Implication:** systemType is PURELY METADATA for authoring/display

## Mixed System Scenarios

### Scenario 1: World with Multiple Rule Formats

**Example:**
- Rule A: systemType = "insimul"
- Rule B: systemType = "ensemble"  
- Rule C: systemType = "kismet"

**Current Behavior:**
1. All three rules are stored with their respective systemType
2. Editor displays them in their respective formats
3. During execution: ALL THREE are converted to unified format and executed identically
4. No special handling or prioritization based on systemType

**User Experience:**
- Can author in any format
- Can view/edit in original format
- All rules execute together seamlessly

### Scenario 2: World with systemTypes = ["insimul", "ensemble"]

**Current Behavior:**
- This is stored in the world record
- UI might filter or display based on this
- Does NOT affect which rules are executed
- Does NOT prevent adding rules of other types

**Implication:** This field is essentially documentation/UI hint, not enforcement

### Scenario 3: Simulation with systemTypes = ["kismet", "tott"]

**Current Behavior:**
- Stored in simulation record
- NOT checked during execution
- ALL rules from the world execute regardless

**Implication:** This setting has NO effect on simulation behavior

## Import/Export Usage

### Current Implementation

**Export:**
- Can export rules to any format (Insimul, Ensemble, Kismet, TotT)
- Uses `InsimulRuleExporter.exportToFormat()`
- Pure translation, no execution

**Import:**
- Can import rules from any format
- Parsed and stored with original systemType
- Converted to unified format for execution

**File Extensions:**
- `.insimul` - Insimul format
- `.ens` / `.json` - Ensemble format
- `.kis` - Kismet format
- `.tott` / `.json` - Talk of the Town format

## System-Specific Features

### Kismet-Specific

**Kismet Impulse System:**
- Lives in `server/kismet/` directory
- Impulse management, volition selection
- Uses MongoDB character.socialAttributes
- NOT tied to rule systemType
- **Works independently of systemType**

**Kismet Relationships:**
- Directional relationships (>Self, <Other)
- Also in `server/kismet/` directory
- Stored in MongoDB
- **Independent of rule systemType**

### Ensemble-Specific

**Social Record:**
- `simulations.socialRecord` field stores Ensemble-style history
- Tracked during execution
- NOT conditional on systemType

### Talk of the Town-Specific

**Occupations System:**
- Separate `occupations` table
- Character employment tracking
- **Independent of systemType**

## Code Patterns

### Where systemType IS Checked

1. **AI Generation** - Format examples
2. **Validation** - Syntax rules
3. **Parsing** - Which parser to use
4. **Export** - Which format to generate
5. **UI** - Display format, syntax highlighting

### Where systemType is NOT Checked

1. **Simulation execution** - No conditional logic
2. **Rule triggering** - All rules processed equally
3. **Effect application** - Same execution path
4. **State management** - Uniform state regardless of systemType
5. **Character behavior** - No system-specific AI

## Recommendations for Simplification

Based on this audit, to achieve "Insimul-only execution with multi-format authoring support":

### Phase 1: Clarify Purpose
1. Rename fields to indicate authoring purpose:
   - `systemType` → `authoringFormat` or `sourceFormat`
   - `systemTypes` → `supportedFormats` (documentation only)

### Phase 2: Remove Unused Fields
1. Remove `systemTypes` from:
   - `worlds` table (unused in execution)
   - `simulations` table (unused in execution)

2. Keep `systemType`/`sourceFormat` in:
   - `rules` table (for authoring/display)
   - `actions` table (for authoring/display)

### Phase 3: Restrict Persistence
1. When saving rules to database:
   - Always convert to Insimul format
   - Store original format in `sourceFormat` field
   - Store Insimul version in `content` field

2. When displaying/editing:
   - Convert from Insimul to requested format on-the-fly
   - Don't save until user explicitly saves
   - Save back as Insimul

### Phase 4: Update UI/UX
1. Make clear that other formats are "views" not "storage"
2. Add "View as..." dropdown instead of "System Type"
3. Show conversion preview before saving
4. Indicate "Stored as Insimul" in UI

### Phase 5: Maintain Import/Export
1. Keep all format parsers for import
2. Keep all format exporters for export
3. Add "Download as..." for other formats
4. Never save imported content in original format

## Summary Table

| Feature | systemType Used? | Execution Impact? | Purpose |
|---------|------------------|-------------------|---------|
| AI Rule Generation | ✅ Yes | ❌ No | Format examples for AI |
| Rule Validation | ✅ Yes | ❌ No | Syntax checking |
| Rule Editor Display | ✅ Yes | ❌ No | Formatting and highlighting |
| Rule Storage | ✅ Yes | ❌ No | Metadata only |
| Simulation Execution | ❌ No | ❌ No | Not checked at all |
| Rule Execution | ❌ No | ❌ No | Unified engine for all |
| Import | ✅ Yes | ❌ No | Parsing different formats |
| Export | ✅ Yes | ❌ No | Generating different formats |
| World Config | ✅ Yes | ❌ No | Metadata only |
| Simulation Config | ✅ Yes | ❌ No | Stored but unused |

## Conclusion

**Current State:**
- systemType/systemTypes are pure metadata
- All execution happens in unified engine
- No conditional logic based on system type
- Multiple formats coexist peacefully

**Opportunity:**
- Can simplify to "Insimul storage, multi-format viewing"
- Remove confusing/unused systemTypes arrays
- Clarify that other formats are authoring tools, not execution engines
- Maintain full compatibility with Ensemble, Kismet, TotT for import/export

**Path Forward:**
Rename systemType → sourceFormat/authoringFormat to clarify it's about authoring, not execution. Keep for import/export/viewing, but always store as Insimul internally.
