# Permissive Predicate Schema System Design

## Philosophy

**Core Principle:** The schema system should be a **helpful assistant**, not a strict enforcer.

- ✅ Users can write any predicate freely (`male(john)`, `custom_trait(x, y)`)
- ✅ Schema auto-discovers predicates from usage
- ✅ Provides helpful suggestions and documentation
- ✅ Warns about potential typos, not errors
- ✅ Builds knowledge base from actual code
- ❌ Never blocks rule creation or execution

## Design Goals

### 1. Auto-Discovery
The system learns predicates by analyzing existing rules, not from manual definitions.

### 2. Progressive Enhancement
- **Level 0:** No schema - everything works, no help
- **Level 1:** Auto-discovered schema - suggestions, autocomplete
- **Level 2:** User-annotated schema - better docs, type hints
- **Level 3:** Strict mode (opt-in) - enforce schema if user wants

### 3. Non-Blocking Validation
Validation provides **warnings** and **suggestions**, never **errors**.

### 4. Contextual Help
IDE integration shows discovered predicates, usage examples, and suggestions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PREDICATE DISCOVERY                       │
│  Auto-scans rules, world data, and execution history        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  PREDICATE REGISTRY                          │
│  - Discovered predicates (from usage)                       │
│  - User-documented predicates (optional annotations)        │
│  - Core predicates (built-in to Insimul)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   VALIDATION ENGINE                          │
│  - Spell-check predicates (suggest corrections)             │
│  - Detect arity mismatches (warn if inconsistent)          │
│  - Provide usage examples                                   │
│  - Never block execution                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    IDE INTEGRATION                           │
│  - Autocomplete from discovered predicates                  │
│  - Hover docs showing usage examples                        │
│  - Warnings (yellow squiggles) not errors (red)            │
│  - Quick-fix suggestions                                    │
└─────────────────────────────────────────────────────────────┘
```

## Schema File Format

### Core Schema (Built-in Predicates)

**File:** `server/schema/core-predicates.json`

```json
{
  "version": "1.0",
  "mode": "permissive",
  "predicates": {
    "Character": {
      "category": "entity-type",
      "arity": 1,
      "description": "Identifies an entity as a character",
      "args": [
        {"name": "entity", "type": "entity", "description": "The character entity"}
      ],
      "examples": [
        "Character(?hero)",
        "Character(?villain)"
      ],
      "builtIn": true
    },
    "age": {
      "category": "property",
      "arity": 2,
      "description": "Age of a character in years",
      "args": [
        {"name": "entity", "type": "entity"},
        {"name": "years", "type": "number"}
      ],
      "examples": [
        "age(?person, 35)",
        "age(?elder, Age), Age > 60"
      ],
      "builtIn": true
    },
    "parent_of": {
      "category": "relationship",
      "arity": 2,
      "description": "Genealogical parent-child relationship",
      "args": [
        {"name": "parent", "type": "entity"},
        {"name": "child", "type": "entity"}
      ],
      "examples": [
        "parent_of(?mother, ?daughter)",
        "parent_of(?father, ?son)"
      ],
      "builtIn": true
    }
  }
}
```

### Discovered Schema (Auto-Generated)

**File:** `server/schema/discovered-predicates.json`

```json
{
  "version": "1.0",
  "generated": "2025-10-28T04:30:00Z",
  "source": "auto-discovery",
  "predicates": {
    "male": {
      "arity": 1,
      "discovered_from": [
        "rule_succession_123",
        "rule_inheritance_456"
      ],
      "usage_count": 12,
      "first_seen": "2025-10-20T10:15:00Z",
      "last_seen": "2025-10-28T03:45:00Z",
      "examples": [
        "male(?john)",
        "male(?king)"
      ],
      "inferred_type": "predicate",
      "confidence": "high"
    },
    "female": {
      "arity": 1,
      "discovered_from": [
        "rule_marriage_789"
      ],
      "usage_count": 8,
      "examples": [
        "female(?mary)",
        "female(?queen)"
      ],
      "inferred_type": "predicate"
    },
    "wealthy_merchant": {
      "arity": 1,
      "discovered_from": [
        "user_custom_rule_1"
      ],
      "usage_count": 3,
      "examples": [
        "wealthy_merchant(?trader)"
      ],
      "inferred_type": "predicate",
      "note": "User-defined custom predicate"
    }
  }
}
```

### User Annotations (Optional)

**File:** `worlds/{worldId}/predicates.json`

```json
{
  "version": "1.0",
  "worldId": "medieval_kingdom_123",
  "annotations": {
    "male": {
      "description": "Identifies a male character",
      "category": "gender",
      "notes": "Used for succession rules in this world"
    },
    "has_claim_to_throne": {
      "description": "Character has a legitimate claim to the throne",
      "arity": 2,
      "args": [
        {"name": "character", "type": "entity"},
        {"name": "realm", "type": "entity"}
      ],
      "custom": true,
      "world_specific": true
    }
  }
}
```

## Implementation

### 1. Predicate Discovery Service

**File:** `server/services/predicate-discovery.ts`

```typescript
import { storage } from '../db/storage';
import { InsimulRuleCompiler } from '../../client/src/lib/unified-syntax';
import * as fs from 'fs/promises';

interface DiscoveredPredicate {
  name: string;
  arity: number;
  usageCount: number;
  discoveredFrom: string[]; // Rule IDs
  examples: string[];
  firstSeen: Date;
  lastSeen: Date;
  confidence: 'high' | 'medium' | 'low';
}

export class PredicateDiscoveryService {
  private discoveredPredicates: Map<string, DiscoveredPredicate> = new Map();
  private compiler = new InsimulRuleCompiler();

  /**
   * Scan all rules in a world to discover predicates
   */
  async discoverPredicatesInWorld(worldId: string): Promise<void> {
    const rules = await storage.getRulesByWorld(worldId);
    
    for (const rule of rules) {
      this.analyzeRule(rule);
    }
    
    await this.saveDiscoveredSchema();
  }

  /**
   * Analyze a single rule to extract predicates
   */
  private analyzeRule(rule: any): void {
    try {
      const compiled = this.compiler.compile(rule.content, 'insimul');
      
      for (const compiledRule of compiled) {
        // Extract predicates from conditions
        for (const condition of compiledRule.conditions) {
          if (condition.predicate) {
            this.recordPredicate(
              condition.predicate,
              this.extractArity(condition),
              rule.id,
              this.buildExample(condition)
            );
          }
        }
      }
    } catch (error) {
      // Silently skip malformed rules - discovery is permissive
      console.debug(`Could not analyze rule ${rule.id}:`, error);
    }
  }

  /**
   * Record a discovered predicate
   */
  private recordPredicate(
    name: string,
    arity: number,
    ruleId: string,
    example: string
  ): void {
    const key = `${name}/${arity}`;
    const existing = this.discoveredPredicates.get(key);
    
    if (existing) {
      existing.usageCount++;
      existing.lastSeen = new Date();
      if (!existing.examples.includes(example)) {
        existing.examples.push(example);
      }
      if (!existing.discoveredFrom.includes(ruleId)) {
        existing.discoveredFrom.push(ruleId);
      }
    } else {
      this.discoveredPredicates.set(key, {
        name,
        arity,
        usageCount: 1,
        discoveredFrom: [ruleId],
        examples: [example],
        firstSeen: new Date(),
        lastSeen: new Date(),
        confidence: 'medium'
      });
    }
  }

  /**
   * Calculate confidence based on usage patterns
   */
  private calculateConfidence(pred: DiscoveredPredicate): 'high' | 'medium' | 'low' {
    if (pred.usageCount >= 5 && pred.discoveredFrom.length >= 3) {
      return 'high';
    } else if (pred.usageCount >= 2) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Save discovered schema to file
   */
  private async saveDiscoveredSchema(): Promise<void> {
    const schema = {
      version: '1.0',
      generated: new Date().toISOString(),
      source: 'auto-discovery',
      predicates: Object.fromEntries(
        Array.from(this.discoveredPredicates.entries()).map(([key, pred]) => [
          key,
          {
            ...pred,
            confidence: this.calculateConfidence(pred)
          }
        ])
      )
    };
    
    await fs.writeFile(
      'server/schema/discovered-predicates.json',
      JSON.stringify(schema, null, 2)
    );
  }

  /**
   * Get all known predicates (core + discovered)
   */
  async getAllPredicates(): Promise<Map<string, any>> {
    const coreSchema = await this.loadCoreSchema();
    const discoveredSchema = await this.loadDiscoveredSchema();
    
    // Merge schemas, with core taking precedence
    const combined = new Map();
    
    for (const [key, pred] of Object.entries(discoveredSchema.predicates || {})) {
      combined.set(key, { ...pred, source: 'discovered' });
    }
    
    for (const [key, pred] of Object.entries(coreSchema.predicates || {})) {
      combined.set(key, { ...pred, source: 'core' });
    }
    
    return combined;
  }

  private async loadCoreSchema(): Promise<any> {
    try {
      const content = await fs.readFile('server/schema/core-predicates.json', 'utf8');
      return JSON.parse(content);
    } catch {
      return { predicates: {} };
    }
  }

  private async loadDiscoveredSchema(): Promise<any> {
    try {
      const content = await fs.readFile('server/schema/discovered-predicates.json', 'utf8');
      return JSON.parse(content);
    } catch {
      return { predicates: {} };
    }
  }

  private extractArity(condition: any): number {
    // Extract arity from condition structure
    // This is simplified - actual implementation would parse more carefully
    return 1; // Placeholder
  }

  private buildExample(condition: any): string {
    // Build example from condition
    return condition.predicate + '(...)'; // Placeholder
  }
}
```

### 2. Validation Service (Non-Blocking)

**File:** `server/services/predicate-validator.ts`

```typescript
export interface ValidationWarning {
  severity: 'info' | 'warning' | 'suggestion';
  message: string;
  line?: number;
  suggestion?: string;
  quickFixes?: QuickFix[];
}

export interface QuickFix {
  title: string;
  replacement: string;
}

export class PredicateValidator {
  private discoveryService: PredicateDiscoveryService;

  constructor(discoveryService: PredicateDiscoveryService) {
    this.discoveryService = discoveryService;
  }

  /**
   * Validate rule and return warnings (never errors)
   */
  async validateRule(ruleContent: string): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];
    const knownPredicates = await this.discoveryService.getAllPredicates();
    
    // Extract predicates from rule
    const usedPredicates = this.extractPredicates(ruleContent);
    
    for (const pred of usedPredicates) {
      const key = `${pred.name}/${pred.arity}`;
      
      if (!knownPredicates.has(key)) {
        // Predicate not known - check for typos
        const suggestions = this.findSimilarPredicates(pred.name, knownPredicates);
        
        if (suggestions.length > 0) {
          warnings.push({
            severity: 'warning',
            message: `Unknown predicate '${pred.name}/${pred.arity}'. Did you mean one of these?`,
            suggestion: suggestions.join(', '),
            quickFixes: suggestions.map(s => ({
              title: `Change to '${s}'`,
              replacement: s
            }))
          });
        } else {
          // New custom predicate - just informational
          warnings.push({
            severity: 'info',
            message: `New custom predicate '${pred.name}/${pred.arity}' detected. It will be added to the schema automatically.`
          });
        }
      } else {
        // Known predicate - check arity consistency
        const known = knownPredicates.get(key);
        if (known && known.arity && pred.arity !== known.arity) {
          warnings.push({
            severity: 'warning',
            message: `Predicate '${pred.name}' typically used with ${known.arity} arguments, but you're using ${pred.arity}. This might be intentional or a typo.`,
            suggestion: `Most common usage: ${known.examples?.[0] || ''}`
          });
        }
      }
    }
    
    return warnings;
  }

  /**
   * Find similar predicate names (spell check)
   */
  private findSimilarPredicates(
    name: string,
    knownPredicates: Map<string, any>
  ): string[] {
    const similar: string[] = [];
    
    for (const [key, pred] of knownPredicates.entries()) {
      const predName = pred.name;
      const distance = this.levenshteinDistance(name, predName);
      
      // If names are close (within 2 edits), suggest
      if (distance <= 2 && distance > 0) {
        similar.push(predName);
      }
    }
    
    return similar.slice(0, 3); // Top 3 suggestions
  }

  /**
   * Levenshtein distance for spell checking
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  private extractPredicates(ruleContent: string): Array<{name: string, arity: number}> {
    // Parse rule and extract predicates
    // Simplified placeholder
    return [];
  }
}
```

### 3. API Endpoints

**In `server/routes.ts`:**

```typescript
import { PredicateDiscoveryService } from './services/predicate-discovery';
import { PredicateValidator } from './services/predicate-validator';

const discoveryService = new PredicateDiscoveryService();
const validator = new PredicateValidator(discoveryService);

// Get all known predicates (for autocomplete)
app.get("/api/predicates", async (req, res) => {
  try {
    const predicates = await discoveryService.getAllPredicates();
    res.json({
      predicates: Array.from(predicates.entries()).map(([key, pred]) => ({
        name: pred.name,
        arity: pred.arity,
        description: pred.description,
        examples: pred.examples,
        source: pred.source,
        builtIn: pred.builtIn || false
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch predicates" });
  }
});

// Validate rule (non-blocking)
app.post("/api/rules/validate", async (req, res) => {
  try {
    const { content } = req.body;
    const warnings = await validator.validateRule(content);
    
    res.json({
      valid: true, // Always valid, just warnings
      warnings
    });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

// Trigger predicate discovery for a world
app.post("/api/worlds/:id/discover-predicates", async (req, res) => {
  try {
    await discoveryService.discoverPredicatesInWorld(req.params.id);
    res.json({ message: "Predicate discovery complete" });
  } catch (error) {
    res.status(500).json({ error: "Discovery failed" });
  }
});

// Get predicate documentation
app.get("/api/predicates/:name", async (req, res) => {
  try {
    const predicates = await discoveryService.getAllPredicates();
    const matches = Array.from(predicates.entries())
      .filter(([_, pred]) => pred.name === req.params.name);
    
    if (matches.length === 0) {
      return res.status(404).json({ error: "Predicate not found" });
    }
    
    res.json({
      name: req.params.name,
      variants: matches.map(([key, pred]) => ({
        arity: pred.arity,
        description: pred.description,
        examples: pred.examples,
        usageCount: pred.usageCount
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch predicate info" });
  }
});
```

## User Experience

### Rule Editor with Autocomplete

```typescript
// In RuleCreateDialog or rule editor component
const [warnings, setWarnings] = useState<ValidationWarning[]>([]);

// As user types
const handleContentChange = async (content: string) => {
  setRuleContent(content);
  
  // Validate in background (debounced)
  const result = await fetch('/api/rules/validate', {
    method: 'POST',
    body: JSON.stringify({ content })
  }).then(r => r.json());
  
  setWarnings(result.warnings);
};

// Show warnings (not errors)
{warnings.map(warning => (
  <div className={`warning warning-${warning.severity}`}>
    {warning.severity === 'info' && <Info className="w-4 h-4" />}
    {warning.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
    {warning.message}
    {warning.quickFixes && (
      <div className="quick-fixes">
        {warning.quickFixes.map(fix => (
          <Button onClick={() => applyQuickFix(fix)}>
            {fix.title}
          </Button>
        ))}
      </div>
    )}
  </div>
))}
```

### Autocomplete Integration

```typescript
// Fetch predicates for autocomplete
const { data: predicates } = useQuery({
  queryKey: ['predicates'],
  queryFn: async () => {
    const res = await fetch('/api/predicates');
    return res.json();
  }
});

// Use in code editor
<CodeEditor
  value={ruleContent}
  onChange={handleContentChange}
  autocomplete={predicates?.predicates || []}
  onAutocomplete={(pred) => ({
    label: `${pred.name}/${pred.arity}`,
    detail: pred.description,
    documentation: pred.examples.join('\n')
  })}
/>
```

## Benefits of This Approach

### 1. Zero Friction for Users
- Write `male(john)` just like in Prolog
- No schema definition required
- No manual updates needed
- Works immediately

### 2. Progressive Learning
- System learns from usage
- Builds knowledge base automatically
- Improves over time

### 3. Helpful Without Being Restrictive
- Suggests corrections for typos
- Shows usage examples
- Provides autocomplete
- Never blocks execution

### 4. Optional Strictness
- Users can opt into strict mode if desired
- World-specific schemas for stricter validation
- Core predicates can be enforced if needed

### 5. Great for Collaboration
- New team members see what predicates exist
- Documentation auto-generates
- Consistent usage encouraged but not enforced

## Comparison with Ensemble

| Feature | Ensemble | Insimul |
|---------|----------|---------|
| **Schema Required** | ✅ Yes, must define schema first | ❌ No, auto-discovers |
| **Custom Predicates** | ❌ Must update schema | ✅ Write freely |
| **Validation** | ❌ Blocks execution on error | ✅ Warnings only |
| **Learning Curve** | High (schema concepts) | Low (just write code) |
| **IDE Support** | ✅ Yes | ✅ Yes |
| **Documentation** | Manual | Auto-generated |
| **Flexibility** | Low | High |

## Implementation Plan

1. **Phase 1: Core Schema** (Week 1)
   - [ ] Create `core-predicates.json` with built-in predicates
   - [ ] Implement `PredicateDiscoveryService`
   - [ ] Add `/api/predicates` endpoint

2. **Phase 2: Discovery** (Week 2)
   - [ ] Implement rule scanning for predicate extraction
   - [ ] Auto-generate `discovered-predicates.json`
   - [ ] Add background discovery task

3. **Phase 3: Validation** (Week 3)
   - [ ] Implement `PredicateValidator`
   - [ ] Add spell-checking with Levenshtein distance
   - [ ] Add `/api/rules/validate` endpoint

4. **Phase 4: UI Integration** (Week 4)
   - [ ] Add autocomplete to rule editor
   - [ ] Show warnings in UI
   - [ ] Add quick-fix buttons
   - [ ] Add predicate browser/documentation view

5. **Phase 5: Enhancement** (Week 5)
   - [ ] Add world-specific annotations
   - [ ] Generate documentation from schema
   - [ ] Add optional strict mode
   - [ ] Performance optimization

## Configuration

Users can control validation strictness:

```json
// In world config or user preferences
{
  "validation": {
    "mode": "permissive",  // or "strict"
    "showInfoMessages": true,
    "showWarnings": true,
    "spellCheck": true,
    "arityCheck": true,
    "autoDiscover": true
  }
}
```

## Summary

This design gives you:
- ✅ **Ease of use** - Write predicates freely like Prolog
- ✅ **Helpful suggestions** - Autocomplete, spell-check, examples
- ✅ **No manual maintenance** - Auto-discovers from usage
- ✅ **Non-blocking** - Warnings, never errors
- ✅ **Progressive enhancement** - Better over time
- ✅ **Better than Ensemble** - Same benefits, none of the friction

The schema system becomes an **intelligent assistant** that learns from your code and helps you write better rules, without ever getting in your way.
