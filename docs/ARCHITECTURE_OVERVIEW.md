# Insimul Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INSIMUL PLATFORM                            │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │   USER INTERFACE (React/TS)      │
                    │  - WorldCreateDialog              │
                    │  - RuleCreateDialog               │
                    │  - SimulationConfigDialog         │
                    └─────────────┬────────────────────┘
                                  │
                    ┌─────────────▼────────────────────┐
                    │      API LAYER (Express)         │
                    │  /api/worlds/:id/generate        │
                    │  /api/simulations/:id/run        │
                    │  /api/rules                      │
                    └─────────┬────────────┬───────────┘
                              │            │
          ┌───────────────────┴───┐        └──────────────────┐
          │                       │                           │
┌─────────▼─────────┐   ┌────────▼──────────┐   ┌───────────▼──────────┐
│  PROCEDURAL       │   │  RULE MANAGEMENT  │   │  SIMULATION ENGINE   │
│  GENERATION       │   │  & COMPILATION    │   │                      │
│  (Creation Time)  │   │                   │   │  (Execution Time)    │
└───────────────────┘   └───────────────────┘   └──────────────────────┘
│                       │                       │
│ ┌─────────────────┐   │ ┌─────────────────┐   │ ┌──────────────────┐
│ │  Generators     │   │ │ InsimulRule     │   │ │ Insimul Engine   │
│ │  - Genealogy    │   │ │ Compiler        │   │ │ (unified-engine) │
│ │  - Geography    │   │ │ - Parse Insimul │   │ │                  │
│ │  - Names        │   │ │ - Validate      │   │ │ ┌──────────────┐ │
│ │  - World        │   │ │ - Convert to    │   │ │ │ SWI-Prolog   │ │
│ └─────────────────┘   │ │   Prolog AST    │   │ │ │ Backend      │ │
│                       │ └─────────────────┘   │ │ └──────────────┘ │
│ ┌─────────────────┐   │                       │ │                  │
│ │  Extensions     │   │ ┌─────────────────┐   │ │ ┌──────────────┐ │
│ │  (TotT/Kismet)  │   │ │ Legacy Format   │   │ │ │ Prolog Sync  │ │
│ │  - Business     │   │ │ Parsers         │   │ │ │ Service      │ │
│ │  - Hiring       │   │ │ - Ensemble JSON │   │ │ └──────────────┘ │
│ │  - Routine      │   │ │ - Kismet syntax │   │ │                  │
│ │  - Events       │   │ │ - TotT JSON     │   │ │ ┌──────────────┐ │
│ │  - Relationships│   │ │ (Import/Export) │   │ │ │ Rule         │ │
│ │  - Knowledge    │   │ └─────────────────┘   │ │ │ Executor     │ │
│ │  - Economics    │   │                       │ │ └──────────────┘ │
│ └─────────────────┘   │                       │ └──────────────────┘
│                       │                       │
│   NO PROLOG RULES     │   STORES RULES IN     │   EXECUTES RULES
│   USED HERE           │   DATABASE            │   WITH PROLOG
└───────────────────────┴───────────────────────┴──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   MONGODB         │
                    │   - Worlds        │
                    │   - Characters    │
                    │   - Rules         │
                    │   - Simulations   │
                    └───────────────────┘
```

## 1. Procedural Generation vs. Simulation Execution

### Procedural Generation (Creation Time)

**Purpose:** Create initial world state, characters, geography, and social structures

**Location:** `server/generators/` and `server/extensions/`

**Key Components:**
- **Genealogy Generator** (`genealogy-generator.ts`)
  - Creates founding families
  - Simulates marriages and births over generations
  - Assigns names, genders, traits
  - Uses **programmatic algorithms**, NOT Prolog rules

- **Geography Generator** (`geography-generator.ts`)
  - Creates districts, lots, buildings
  - Assigns residences to characters
  - Uses procedural algorithms based on settlement type

- **World Generator** (`world-generator.ts`)
  - Orchestrates entire world creation
  - Creates businesses, assigns employment
  - Generates initial routines
  - Calls TotT extension systems

**Extensions (from Talk of the Town and Kismet):**
- `business-system.js` - Creates and manages businesses
- `hiring-system.js` - Assigns employment
- `routine-system.js` - Generates daily schedules
- `event-system.js` - Triggers historical events
- `social-dynamics-system.js` - Initializes relationships
- `knowledge-system.js` - Sets up character knowledge
- `economics-system.js` - Assigns starting wealth

**IMPORTANT:** Prolog rules have **ZERO effect** during procedural generation. All generation is done through:
- Algorithmic code (TypeScript functions)
- Random number generation
- Constraint satisfaction
- Programmatic graph building

**Rule Generation During Procedural Creation:**
When a world is procedurally generated, AI (Gemini) can create Insimul-formatted rules:
```javascript
// In routes.ts, line 3415-3465
const rulesPrompt = `Generate 10 social rules...`;
const generatedRules = await ai.generateContent(rulesPrompt);

// Rules are STORED in database for LATER use during simulation
await storage.createRule({
  worldId,
  name: rule.name,
  content: rule.content,  // Insimul syntax
  sourceFormat: 'insimul',
  priority: 5,
  tags: ['generated', 'ai']
});
```

These rules are **created but not executed** during world generation. They're stored for simulation time.

---

### Simulation Execution (Execution Time)

**Purpose:** Run narrative simulations using predicate logic and rules

**Location:** `server/engines/unified-engine.ts` and `server/engines/prolog/`

**Execution Flow:**

1. **User Triggers Simulation**
   - POST `/api/simulations/:id/run`
   - Provides configuration (maxRules, timeRange, etc.)

2. **Load Rules from Database**
   ```typescript
   const rules = await storage.getRulesByWorld(worldId);
   ```

3. **Compile Rules to Prolog**
   ```typescript
   // InsimulRuleCompiler converts Insimul to Prolog AST
   const compiler = new InsimulRuleCompiler();
   const compiledRules = compiler.compile(rule.content, 'insimul');
   ```

4. **Sync World State to Prolog Knowledge Base**
   ```typescript
   // PrologSyncService converts MongoDB data to Prolog facts
   await prologSync.syncWorldToProlog(worldId);
   
   // Creates facts like:
   // person(john_smith_123).
   // age(john_smith_123, 35).
   // occupation(john_smith_123, blacksmith).
   // married(john_smith_123, mary_smith_456).
   ```

5. **Execute Prolog Queries**
   ```typescript
   // SWI-Prolog runs queries against knowledge base + rules
   const results = await prologManager.query(
     "person(X), age(X, Age), Age > 30"
   );
   ```

6. **Generate Narrative Output**
   - Rule matches trigger effects
   - Effects modify world state
   - Tracery templates generate text
   - Results stored in simulation

**CRITICAL DISTINCTION:**
- **Creation Time:** Programmatic algorithms, no Prolog
- **Execution Time:** Prolog rules query and modify world state

---

## 2. Rule Validation

### Creation Time Validation

**Location:** `client/src/lib/unified-syntax.ts` - `InsimulRuleCompiler`

**Validation Steps:**

1. **Syntax Parsing**
   ```typescript
   compileInsimul(source: string): InsimulRule[] {
     // Parse rule structure
     const ruleMatch = source.match(/rule\s+(\w+)\s*{/);
     if (!ruleMatch) {
       throw new Error("Invalid rule syntax");
     }
   }
   ```

2. **Structure Validation**
   - Must have `when` clause
   - Must have `then` clause
   - Must have priority
   - Tags must be array

3. **Condition Validation**
   ```typescript
   private parseConditions(conditionsText: string): Condition[] {
     // Validate predicate syntax
     // Check for proper variables (?var)
     // Ensure logical operators (and, or, not)
   }
   ```

4. **Effect Validation**
   ```typescript
   private parseEffects(effectsText: string): Effect[] {
     // Validate effect types (set, modify, trigger_event)
     // Check target existence
     // Validate parameters
   }
   ```

**Current State:** **Limited validation** - mostly syntax checking. No semantic validation of:
- Whether predicates exist in schema
- Whether variables are properly scoped
- Whether effects can actually execute

### Execution Time Validation

**Location:** `server/engines/prolog/prolog-manager.ts`

**Prolog Syntax Validation:**
```typescript
private validatePrologSyntax(statement: string): boolean {
  // Check for proper termination with '.'
  if (!statement.trim().endsWith('.')) {
    return false;
  }
  
  // Validate character set
  const validPattern = /^[a-zA-Z0-9_\s()\[\].,:\-'"+*\/=<>!]+\.$/;
  if (!validPattern.test(trimmed)) {
    return false;
  }
  
  // Check parentheses balance
  // Check predicate structure
}
```

**Runtime Validation:**
- SWI-Prolog itself validates syntax when loading rules
- Query execution fails gracefully if rules are malformed
- No schema validation against available predicates

**Improvement Needed:** Currently missing:
- Predicate schema definition (like Ensemble)
- Type checking for variables
- Effect validation before execution

---

## 3. Insimul Language vs. Prolog

### Insimul Language Specification

**Syntax Structure:**
```insimul
rule rule_name {
  when (
    Predicate1(?var1) and
    Predicate2(?var2, value) and
    ?var1.property == "value" and
    comparison(?var1, ?var2, >)
  )
  then {
    effect_action(?var1, ?var2)
    set_property(?var1, "property", new_value)
    trigger_event("event_type", ?var1)
    tracery_generate("template", {var: ?var1.name})
  }
  priority: 7
  likelihood: 0.8
  tags: [social, narrative]
}
```

**Key Features:**

1. **Object-Oriented Predicates**
   ```insimul
   Person(?character) and
   ?character.age > 30 and
   ?character.occupation == "blacksmith"
   ```

2. **Dotted Property Access**
   ```insimul
   ?lord.title
   ?heir.holdings
   ```

3. **Explicit Effect Types**
   ```insimul
   set_property(?char, "wealth", 1000)
   modify_relationship(?char1, ?char2, +10)
   trigger_event("succession", ?heir)
   ```

4. **Tracery Integration**
   ```insimul
   tracery_generate("succession_ceremony", {
     heir: ?heir.name,
     title: ?lord.title
   })
   ```

5. **Metadata Fields**
   ```insimul
   priority: 7          // Execution priority
   likelihood: 0.8      // Probability of firing
   tags: [type, theme]  // Categorization
   ```

### Prolog Comparison

**Standard Prolog:**
```prolog
% Pure logic programming
noble_succession(Heir, Lord) :-
    person(Heir),
    noble(Lord),
    parent_of(Lord, Heir),
    eldest_child(Heir),
    dies(Lord).

% Horn clauses only
% No built-in effects
% No narrative generation
```

**Insimul as "Prolog++":**

| Feature | Prolog | Insimul |
|---------|--------|---------|
| **Logic** | Horn clauses | ✓ Horn clauses + comparisons |
| **Objects** | Terms only | ✓ Dotted property access |
| **Effects** | ❌ None | ✓ Explicit effect system |
| **Narrative** | ❌ None | ✓ Tracery templates |
| **Metadata** | ❌ None | ✓ Priority, likelihood, tags |
| **Syntax** | Prolog syntax | C-style with `when`/`then` |
| **Types** | Untyped | Untyped (needs improvement) |

**Relationship:**
- Insimul is **NOT a subset** of Prolog
- Insimul is **compiled TO** Prolog for execution
- Insimul adds narrative and game semantics on top of logic

**Compilation Example:**
```insimul
// Insimul
rule respect_nobility {
  when (
    Character(?commoner) and
    Character(?noble) and
    has_status(?commoner, "commoner") and
    has_status(?noble, "nobility")
  )
  then {
    bow_to(?commoner, ?noble)
    increase_relationship(?noble, ?commoner, 5)
  }
}
```

Compiles to:
```prolog
% Prolog
respect_nobility(Commoner, Noble) :-
    character(Commoner),
    character(Noble),
    has_status(Commoner, commoner),
    has_status(Noble, nobility).

% Effects handled by execution engine, not pure Prolog
```

---

## 4. Insimul vs. Ensemble Schema System

### Ensemble's Approach

**Abstract Schema Definition:**
```javascript
// schema.json
{
  "predicates": [
    {
      "name": "person",
      "types": ["entity"],
      "description": "A person in the world"
    },
    {
      "name": "age",
      "types": ["entity", "number"],
      "description": "Age of an entity"
    },
    {
      "name": "relationship",
      "types": ["entity", "entity", "string", "number"],
      "description": "Relationship between two entities"
    }
  ],
  "actions": [
    {
      "name": "greet",
      "initiator": "entity",
      "responder": "entity",
      "preconditions": ["visible", "not_enemy"],
      "effects": ["increase_relationship"]
    }
  ]
}
```

**Benefits of Ensemble Schema:**
1. **Type Safety** - Predicates have defined argument types
2. **Autocomplete** - IDEs can suggest valid predicates
3. **Validation** - Rules checked against schema at compile time
4. **Documentation** - Schema documents available predicates
5. **Introspection** - System knows what predicates exist

### Current Insimul Approach

**Current State:** **No formal schema system**

**What Exists:**
```typescript
// In unified-syntax.ts
export interface Condition {
  type: 'predicate' | 'pattern' | 'comparison' | ...;
  predicate?: string;  // Any string, no validation
  operator?: 'equals' | 'greater' | ...;
}

export interface Effect {
  type: 'set' | 'modify' | 'trigger_event' | ...;
  target: string;  // Any string, no validation
  action: string;  // Any string, no validation
}
```

**Problems:**
- No predicate registry
- No type checking
- No documentation of available predicates
- Users must guess what predicates exist
- Typos not caught until runtime (or never)

### Proposed Schema System for Insimul

**File:** `server/schema/predicates.json`
```json
{
  "version": "1.0",
  "predicates": {
    "character": {
      "arity": 1,
      "args": [{"name": "entity", "type": "entity"}],
      "description": "Identifies an entity as a character",
      "examples": ["Character(?hero)", "Character(?villain)"]
    },
    "age": {
      "arity": 2,
      "args": [
        {"name": "entity", "type": "entity"},
        {"name": "years", "type": "number"}
      ],
      "description": "Age of a character in years",
      "examples": ["age(?char, 35)", "age(?elder, Age), Age > 60"]
    },
    "has_status": {
      "arity": 2,
      "args": [
        {"name": "entity", "type": "entity"},
        {"name": "status", "type": "enum", "values": ["commoner", "nobility", "royalty"]}
      ],
      "description": "Social status of a character"
    },
    "married": {
      "arity": 2,
      "args": [
        {"name": "entity1", "type": "entity"},
        {"name": "entity2", "type": "entity"}
      ],
      "description": "Marriage relationship between two characters"
    }
  },
  "effects": {
    "bow_to": {
      "arity": 2,
      "args": [
        {"name": "bower", "type": "entity"},
        {"name": "recipient", "type": "entity"}
      ],
      "description": "Character bows to another, showing respect",
      "modifies": ["relationship", "status_perception"]
    },
    "increase_relationship": {
      "arity": 3,
      "args": [
        {"name": "entity1", "type": "entity"},
        {"name": "entity2", "type": "entity"},
        {"name": "amount", "type": "number"}
      ],
      "description": "Increases relationship value between two entities"
    }
  }
}
```

**Implementation:**
```typescript
export class PredicateRegistry {
  private schema: PredicateSchema;
  
  constructor(schemaPath: string) {
    this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }
  
  validatePredicate(name: string, args: any[]): boolean {
    const def = this.schema.predicates[name];
    if (!def) {
      throw new Error(`Unknown predicate: ${name}`);
    }
    if (args.length !== def.arity) {
      throw new Error(`${name} expects ${def.arity} arguments, got ${args.length}`);
    }
    // Type check each argument
    for (let i = 0; i < args.length; i++) {
      this.validateType(args[i], def.args[i].type);
    }
    return true;
  }
  
  getPredicates(): string[] {
    return Object.keys(this.schema.predicates);
  }
  
  getAutocompleteInfo(predicateName: string): PredicateInfo {
    return {
      signature: this.buildSignature(predicateName),
      description: this.schema.predicates[predicateName].description,
      examples: this.schema.predicates[predicateName].examples
    };
  }
}
```

**Benefits:**
1. **Validation at Creation Time**
   - Catch typos immediately
   - Verify predicate exists
   - Check argument count and types

2. **IDE Support**
   - Autocomplete predicate names
   - Show parameter hints
   - Display documentation on hover

3. **Documentation Generation**
   - Auto-generate predicate reference
   - Show all available predicates
   - Include examples

4. **Extensibility**
   - Users can add custom predicates to schema
   - Extensions can register their own predicates
   - Modular schema files per domain

---

## 5. Current System Gaps and Recommendations

### Gaps

1. **No Predicate Schema**
   - Users must guess valid predicates
   - No validation until runtime (Prolog execution)
   - No documentation of available predicates

2. **Limited Rule Validation**
   - Syntax checking only
   - No semantic validation
   - No type checking

3. **No Effect Validation**
   - Effects can reference non-existent actions
   - No validation that effects can execute
   - No preview of what an effect will do

4. **Unclear Rule Lifecycle**
   - When are rules compiled?
   - When are rules validated?
   - How do rules get synced to Prolog?

5. **Missing Debugging Tools**
   - No rule execution trace
   - No way to see why a rule fired
   - No way to test rules in isolation

### Recommendations

1. **Create Predicate Schema System** (HIGH PRIORITY)
   - Define `predicates.json` schema
   - Implement `PredicateRegistry` class
   - Add validation to rule compiler
   - Generate documentation from schema

2. **Add Rule Validation Pipeline**
   ```
   Rule Creation → Syntax Parse → Schema Validation → Type Check → Store in DB
   ```

3. **Implement Rule Debugger**
   - Test rules with sample data
   - Show matched predicates
   - Trace variable bindings
   - Preview effects before execution

4. **Add Rule Editor Features**
   - Autocomplete for predicates
   - Parameter hints
   - Inline errors
   - Example snippets

5. **Document Rule Lifecycle**
   - Clear docs on creation vs execution
   - Explain compilation process
   - Show Prolog conversion
   - Provide debugging guide

---

## 6. Summary

### Key Architectural Points

1. **Two Distinct Phases:**
   - **Creation Time:** Programmatic generation, no Prolog
   - **Execution Time:** Prolog-based rule execution

2. **Insimul Language:**
   - Higher-level than Prolog
   - Adds narrative semantics
   - Compiles to Prolog for execution
   - NOT a Prolog subset

3. **Current Validation:**
   - Basic syntax checking
   - No schema system
   - No semantic validation

4. **Compared to Ensemble:**
   - Missing predicate schema
   - Missing type system
   - Needs introspection capabilities

5. **Extensions (TotT/Kismet):**
   - Used for procedural generation only
   - Provide algorithms, not rules
   - Not involved in simulation execution

### Action Items

- [ ] Create predicate schema definition (`predicates.json`)
- [ ] Implement `PredicateRegistry` class
- [ ] Add schema validation to rule compiler
- [ ] Build rule debugger/tester
- [ ] Document rule lifecycle clearly
- [ ] Generate predicate reference docs
- [ ] Add IDE support for rule editing
