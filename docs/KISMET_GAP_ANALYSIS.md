# Kismet Features Gap Analysis

**Analysis of missing and underdeveloped Kismet features in Insimul**

---

## 📊 Executive Summary

While Insimul has successfully integrated **core Kismet features** (impulses, volitions, directional relationships), several **content generation and procedural systems** remain underdeveloped or missing entirely. The most significant gap is in **Tracery grammar UI and procedural generation**, which limits user control over narrative content.

### Current Integration Status

| Feature Category | Status | Notes |
|-----------------|--------|-------|
| **Core Mechanics** | ✅ Complete | Impulses, volitions, relationships |
| **Grammar Backend** | ✅ Complete | Full CRUD API, database storage |
| **Grammar UI** | ❌ Missing | No way to create/edit grammars from UI |
| **Grammar Generation** | ❌ Missing | No procedural grammar creation |
| **Conversation System** | ❌ Missing | Not implemented despite being in docs |
| **Social Practices** | ⚠️ Underdeveloped | Infrastructure exists, not utilized |
| **Procedural Names** | ⚠️ Underdeveloped | Uses LLM instead of Tracery |

---

## 🔍 Detailed Gap Analysis

### 1. **Tracery Grammar UI** ❌ CRITICAL GAP

#### What Kismet Has
- JSON-based grammar files that can be manually edited
- `.tracery` files stored in project directories
- Direct file editing for grammar customization

#### What Insimul Has
- ✅ Full backend support (CRUD API)
- ✅ Database storage for grammars
- ✅ 6 pre-built seed grammars
- ❌ **NO UI for creating grammars**
- ❌ **NO UI for editing grammars**
- ❌ **NO UI for viewing grammar structures**
- ❌ **NO UI for testing grammar outputs**

#### Impact
**HIGH SEVERITY** - Users cannot:
- Create custom narrative templates
- Modify existing grammar rules
- Test grammar variations
- See available grammars visually
- Control procedural text generation

#### What's Needed

**A. Grammar Management UI**
```typescript
// Component: GrammarsTab.tsx (NEW)
interface GrammarEditor {
  // List grammars for a world
  grammarList: Grammar[];
  
  // Create new grammar
  createGrammar(name: string, description: string): void;
  
  // Edit grammar structure
  editGrammar(id: string, grammar: TraceryGrammar): void;
  
  // Test grammar expansion
  testGrammar(id: string, variables: Record<string, any>): string[];
  
  // Delete grammar
  deleteGrammar(id: string): void;
}
```

**B. Visual Grammar Editor**
```typescript
// Component: GrammarStructureEditor.tsx (NEW)
interface GrammarStructure {
  // Add/edit/remove grammar symbols
  symbols: Map<string, string[]>;
  
  // Visual tree view of symbol references
  symbolGraph: SymbolGraph;
  
  // Live preview of expansions
  livePreview: string[];
  
  // Syntax highlighting for Tracery symbols
  syntaxHighlighter: CodeEditor;
}
```

**C. Grammar Test Console**
```typescript
// Component: GrammarTestConsole.tsx (NEW)
interface GrammarTester {
  // Generate multiple variations
  generateSamples(count: number): string[];
  
  // Test with variables
  testWithVariables(vars: Record<string, any>): string;
  
  // Show symbol usage statistics
  symbolStats: SymbolUsageStats;
  
  // Validate grammar structure
  validate(): ValidationResult;
}
```

---

### 2. **Procedural Grammar Generation** ❌ CRITICAL GAP

#### What Kismet Has
- Hand-crafted grammar files
- Manual definition of all symbols and rules

#### What Insimul Has
- ❌ **NO procedural grammar generation**
- ❌ **NO AI-assisted grammar creation**
- ❌ **NO grammar templates**
- ❌ **NO grammar composition tools**

#### Impact
**HIGH SEVERITY** - Users cannot:
- Automatically generate grammars for their world theme
- Extend grammars with AI suggestions
- Compose complex grammars from simpler ones
- Generate culture-specific narrative templates

#### What's Needed

**A. AI-Powered Grammar Generation**
```typescript
// Service: grammar-generator.ts (NEW)
export class GrammarGenerator {
  /**
   * Generate a Tracery grammar for a specific narrative domain
   */
  async generateGrammar(
    domain: string,      // e.g., "medieval battle descriptions"
    worldContext: {
      theme: string;
      culturalValues: any;
      historicalPeriod?: string;
    }
  ): Promise<TraceryGrammar> {
    // Use Gemini AI to generate grammar structure
    // Returns complete Tracery grammar object
  }
  
  /**
   * Extend existing grammar with new variations
   */
  async extendGrammar(
    existingGrammar: TraceryGrammar,
    extensionTheme: string,
    addRules: number = 5
  ): Promise<TraceryGrammar> {
    // AI suggests additional rules/symbols
  }
  
  /**
   * Generate grammar from examples
   */
  async grammarFromExamples(
    examples: string[],     // e.g., ["The knight charges", "The warrior attacks"]
    symbolName: string = "origin"
  ): Promise<TraceryGrammar> {
    // Analyze examples, extract patterns, create grammar
  }
}
```

**B. Grammar Templates**
```typescript
// Data: grammar-templates.ts (NEW)
export const grammarTemplates = {
  character_actions: {
    description: "Template for character action descriptions",
    structure: {
      origin: ["#character# #action_verb# #object#"],
      action_verb: [], // User fills in
      object: []       // User fills in
    }
  },
  
  location_descriptions: {
    description: "Template for describing locations",
    structure: {
      origin: ["#article# #adjective# #location_type# #detail#"],
      location_type: [], // User fills in
      adjective: [],     // User fills in
      detail: []         // User fills in
    }
  },
  
  combat_narratives: {
    description: "Template for combat descriptions",
    structure: {
      origin: ["#attacker# #attack_action# #defender# with #weapon#"],
      attack_action: ["strikes", "attacks", "charges", "assaults"],
      weapon: []  // User fills in
    }
  }
};
```

**C. Grammar Composition**
```typescript
// Service: grammar-composer.ts (NEW)
export class GrammarComposer {
  /**
   * Merge multiple grammars into one
   */
  mergeGrammars(
    grammars: TraceryGrammar[],
    resolveConflicts: 'override' | 'merge' | 'prefix'
  ): TraceryGrammar {
    // Combine symbol tables, handle naming conflicts
  }
  
  /**
   * Extract subset of grammar
   */
  extractSubgrammar(
    grammar: TraceryGrammar,
    symbols: string[]
  ): TraceryGrammar {
    // Create new grammar with only specified symbols
  }
  
  /**
   * Create grammar from world data
   */
  grammarFromWorldData(
    worldId: string,
    includeCharacterNames: boolean = true,
    includeLocationNames: boolean = true
  ): Promise<TraceryGrammar> {
    // Generate grammar using actual world entities
  }
}
```

---

### 3. **Name Generation via Tracery** ⚠️ UNDERDEVELOPED

#### Current State
- Uses LLM-based `name-generator.ts`
- Requires API calls and is slower
- No user control over naming patterns
- Can be expensive with high usage

#### What Should Exist
- Tracery-based name generation
- User-defined naming patterns
- Culture-specific name templates
- Fast, offline name generation

#### What's Needed

**A. Tracery Name Generator**
```typescript
// Service: tracery-name-generator.ts (NEW)
export class TraceryNameGenerator {
  /**
   * Generate names using Tracery grammars
   */
  async generateName(
    worldId: string,
    grammarName: string,   // e.g., "fantasy_names", "medieval_names"
    gender?: 'male' | 'female',
    culture?: string
  ): Promise<{ firstName: string; lastName: string }> {
    // Use Tracery grammar instead of LLM
  }
  
  /**
   * Create custom name grammar for a culture
   */
  async createCultureNameGrammar(
    cultureName: string,
    namingConventions: {
      firstNamePatterns: string[];
      lastNamePatterns: string[];
      syllables: string[];
      suffixes?: string[];
      prefixes?: string[];
    }
  ): Promise<TraceryGrammar> {
    // Generate grammar from conventions
  }
  
  /**
   * Batch generate names efficiently
   */
  async generateBatch(
    worldId: string,
    grammarName: string,
    count: number
  ): Promise<Array<{ firstName: string; lastName: string }>> {
    // Fast batch generation without API calls
  }
}
```

**B. Name Pattern Editor UI**
```typescript
// Component: NamePatternEditor.tsx (NEW)
interface NamePatternEditor {
  // Define syllable pools
  syllables: string[];
  
  // Define name patterns
  patterns: {
    firstName: string[];   // e.g., ["#syllable##syllable#", "#syllable##syllable##syllable#"]
    lastName: string[];    // e.g., ["#surname_base#son", "of #place#"]
  };
  
  // Preview generated names
  preview: string[];
  
  // Save as Tracery grammar
  saveAsGrammar(): void;
}
```

**C. Integration with World Generator**
```typescript
// Update: generators/world-generator.ts
class WorldGenerator {
  // Add option to use Tracery names
  useTraceryNames: boolean = false;
  nameGrammar?: string;  // Grammar name to use
  
  async generateCharacters(
    settlement: Settlement,
    count: number
  ): Promise<Character[]> {
    if (this.useTraceryNames && this.nameGrammar) {
      // Use Tracery for fast name generation
      const names = await this.traceryNameGen.generateBatch(
        this.worldId,
        this.nameGrammar,
        count
      );
      // Create characters with Tracery names
    } else {
      // Use existing LLM approach
    }
  }
}
```

---

### 4. **Conversation System** ❌ MISSING

#### What Kismet Has
- Dynamic conversation generation
- Context-aware dialogue
- Relationship-influenced responses
- Conversation templates

#### What Insimul Has
- ❌ **NO conversation system implementation**
- ⚠️ Mentioned in documentation but not implemented
- ⚠️ `extensions/kismet/conversation-system.ts` does not exist
- ✅ Character interaction via AI (different approach)

#### Status
The Kismet conversation system was **documented but never implemented**. The current `extensions/kismet/` folder only contains:
- `impulse-system.ts`
- `volition-system.ts`
- `index.ts`

The `conversation-system.ts` referenced in documentation doesn't exist.

#### Impact
**MEDIUM SEVERITY** - Insimul has AI-based character interaction as an alternative, but:
- No template-based conversations
- No Tracery-powered dialogue
- No lightweight conversation generation
- All dialogue requires AI API calls

#### What's Needed

**A. Tracery Conversation System**
```typescript
// NEW: extensions/kismet/conversation-system.ts
export class ConversationSystem {
  /**
   * Generate conversation using Tracery templates
   */
  async generateDialogue(
    speaker: Character,
    listener: Character,
    context: {
      topic?: string;
      relationship?: string;
      location?: string;
      mood?: string;
    }
  ): Promise<string> {
    // Use Tracery grammar for dialogue
    const grammarName = this.selectDialogueGrammar(context);
    const variables = {
      speaker: speaker.firstName,
      listener: listener.firstName,
      relationship: context.relationship
    };
    
    return await this.expandGrammar(grammarName, variables);
  }
  
  /**
   * Multi-turn conversation
   */
  async generateConversation(
    participants: Character[],
    turns: number,
    topic: string
  ): Promise<ConversationTurn[]> {
    // Generate back-and-forth dialogue
  }
}

interface ConversationTurn {
  speaker: string;
  text: string;
  timestamp: number;
  mood?: string;
}
```

**B. Dialogue Grammars**
```typescript
// Data: dialogue-grammars.ts (NEW)
export const dialogueGrammars = {
  casual_greeting: {
    origin: [
      "#speaker# greets #listener# #warmth#.",
      "#speaker# says hello to #listener#."
    ],
    warmth: ["warmly", "casually", "cheerfully", "politely"]
  },
  
  romantic_confession: {
    origin: [
      "#speaker# confesses #feelings# to #listener#.",
      "#speaker# tells #listener# about #deep_feelings#."
    ],
    feelings: ["their love", "their affection", "their feelings"],
    deep_feelings: ["how much they care", "their true feelings"]
  },
  
  conflict_dialogue: {
    origin: [
      "#speaker# #conflict_verb# #listener# about #issue#.",
      "#speaker# and #listener# argue over #issue#."
    ],
    conflict_verb: ["confronts", "challenges", "questions"],
    issue: ["the matter", "the situation", "recent events"]
  }
};
```

---

### 5. **Social Practices & Patterns** ⚠️ UNDERDEVELOPED

#### Current State
- ✅ Infrastructure exists (`ruleType: 'pattern'`)
- ✅ Parser supports pattern rules
- ✅ `world.culturalValues` available
- ❌ **NO pre-built social practice templates**
- ❌ **NO UI for defining practices**
- ❌ **NOT utilized in world generation**

#### Impact
**MEDIUM SEVERITY** - System can support social practices but:
- No example practices provided
- Not integrated into simulation flow
- Users don't know how to use them

#### What's Needed

**A. Social Practice Templates**
```typescript
// Data: social-practices.ts (NEW)
export const socialPractices = {
  coming_of_age_ceremony: {
    ruleType: 'pattern',
    triggers: {
      characterAge: 18,
      culturalValue: 'tradition'
    },
    effects: [
      { type: 'add', field: 'socialAttributes.adulthood', value: true },
      { type: 'generate_text', traceryTemplate: 'coming_of_age_narrative' }
    ],
    narrative: {
      origin: ["#character# undergoes the #ceremony_type# ceremony."],
      ceremony_type: ["coming of age", "initiation", "adulthood"]
    }
  },
  
  seasonal_festival: {
    ruleType: 'pattern',
    triggers: {
      season: 'summer',
      settlementSize: 'town'
    },
    effects: [
      { type: 'modify', field: 'character.socialAttributes.happiness', value: +10 },
      { type: 'generate_text', traceryTemplate: 'festival_narrative' }
    ]
  },
  
  wedding_ceremony: {
    ruleType: 'pattern',
    triggers: {
      relationship: 'romantic',
      relationshipStrength: 0.8
    },
    effects: [
      { type: 'create_relationship', relationshipType: 'married' },
      { type: 'generate_text', traceryTemplate: 'wedding_narrative' }
    ]
  }
};
```

**B. Cultural Pattern Generator**
```typescript
// Service: cultural-pattern-generator.ts (NEW)
export class CulturalPatternGenerator {
  /**
   * Generate social practices for a culture
   */
  async generatePractices(
    cultureName: string,
    cultureDescription: string,
    practiceCount: number = 5
  ): Promise<SocialPractice[]> {
    // Use AI to generate culturally appropriate practices
  }
  
  /**
   * Create practice from user description
   */
  async practiceFromDescription(
    description: string,     // e.g., "A ceremony when someone turns 21"
    worldContext: WorldContext
  ): Promise<SocialPractice> {
    // Generate complete practice rule with Tracery narrative
  }
}
```

---

## 📋 Prioritized Implementation Roadmap

### Phase 1: Grammar UI (CRITICAL) 🔴
**Priority: HIGH** | **Effort: Medium** | **Impact: HIGH**

1. **GrammarsTab Component**
   - List grammars for current world
   - Create/edit/delete operations
   - Basic text editor for grammar JSON

2. **Grammar Test Console**
   - Generate sample outputs
   - Test with variables
   - Live preview

3. **API Integration**
   - Connect to existing `/api/grammars` endpoints
   - Real-time grammar validation
   - Error handling

**Deliverables:**
- ✅ Users can view all grammars
- ✅ Users can create new grammars
- ✅ Users can test grammar outputs
- ✅ Users can edit grammar structures

---

### Phase 2: Procedural Grammar Generation (CRITICAL) 🔴
**Priority: HIGH** | **Effort: High** | **Impact: HIGH**

1. **AI Grammar Generator Service**
   - Implement `GrammarGenerator` class
   - Gemini API integration
   - Grammar validation and sanitization

2. **Grammar Templates Library**
   - Pre-built templates for common patterns
   - Template customization UI
   - Template import/export

3. **Grammar Composition Tools**
   - Merge multiple grammars
   - Extract subgrammars
   - Grammar from world data

**Deliverables:**
- ✅ AI can generate grammars from descriptions
- ✅ Users can start from templates
- ✅ Users can compose complex grammars
- ✅ Grammars auto-adapt to world context

---

### Phase 3: Tracery Name Generation (MEDIUM) 🟡
**Priority: MEDIUM** | **Effort: Medium** | **Impact: MEDIUM**

1. **Tracery Name Generator Service**
   - Fast, offline name generation
   - Culture-specific patterns
   - Batch generation support

2. **Name Pattern Editor UI**
   - Visual syllable editor
   - Pattern preview
   - Save as grammar

3. **Integration**
   - Add to world generator
   - Add to character creation
   - Fallback to LLM if needed

**Deliverables:**
- ✅ Fast name generation without API calls
- ✅ User-controlled naming patterns
- ✅ Culture-specific name styles
- ✅ Reduced LLM API costs

---

### Phase 4: Conversation System (LOW) 🟢
**Priority: LOW** | **Effort: High** | **Impact: LOW**

**Rationale:** Insimul already has AI-powered character interaction. Tracery conversations are nice-to-have but not critical.

1. **Conversation System Implementation**
   - Create `conversation-system.ts`
   - Dialogue grammar support
   - Multi-turn conversations

2. **Dialogue Grammars**
   - Pre-built dialogue templates
   - Context-aware responses
   - Relationship-influenced dialogue

**Deliverables:**
- ✅ Template-based conversations
- ✅ Lightweight dialogue generation
- ✅ Alternative to AI dialogue

---

### Phase 5: Social Practices (LOW) 🟢
**Priority: LOW** | **Effort: Medium** | **Impact: LOW**

1. **Social Practice Templates**
   - Pre-built practice patterns
   - Cultural ceremony templates
   - Seasonal event patterns

2. **Practice Generator**
   - AI-powered practice creation
   - Practice from user description
   - Cultural adaptation

**Deliverables:**
- ✅ Rich cultural practices
- ✅ Automatic practice triggers
- ✅ Narrative generation for practices

---

## 🎯 Quick Wins (Immediate Actions)

### 1. Basic Grammar UI (1-2 days)
```typescript
// Component: client/src/components/GrammarsTab.tsx
// - List grammars
// - Create new grammar (JSON editor)
// - Delete grammar
// - Test grammar expansion
```

### 2. Grammar Generator API (2-3 days)
```typescript
// Endpoint: POST /api/grammars/generate
// Input: { domain: string, worldContext: any }
// Output: { grammar: TraceryGrammar }
// Uses Gemini to generate grammar structure
```

### 3. Name Pattern Editor (2 days)
```typescript
// Component: client/src/components/NamePatternEditor.tsx
// - Define syllable pools
// - Define name patterns  
// - Preview names
// - Export as Tracery grammar
```

---

## 📊 Feature Comparison Matrix

| Feature | Kismet | Insimul Current | Insimul Needed | Priority |
|---------|--------|-----------------|----------------|----------|
| **Grammar Storage** | JSON files | ✅ Database | - | ✅ Complete |
| **Grammar API** | Manual files | ✅ Full CRUD | - | ✅ Complete |
| **Grammar UI** | File editor | ❌ None | **Editor + Tester** | 🔴 Critical |
| **Grammar Generation** | Manual | ❌ None | **AI Generator** | 🔴 Critical |
| **Tracery Names** | ✅ Yes | ❌ Uses LLM | **Tracery Integration** | 🟡 Medium |
| **Conversation** | ✅ Yes | ⚠️ AI only | **Tracery Dialogue** | 🟢 Low |
| **Social Practices** | ✅ Yes | ⚠️ Unused | **Templates + Generator** | 🟢 Low |

---

## 💡 Key Insights

### 1. Backend is Ready, Frontend is Missing
The Tracery infrastructure is **complete** on the backend:
- ✅ Database schema
- ✅ CRUD operations
- ✅ Service layer
- ✅ Seed data

What's missing is the **user-facing tools** to leverage it.

### 2. LLM is Powerful but Expensive
Current name generation uses Gemini:
- ✅ Contextual and intelligent
- ❌ Requires API calls
- ❌ Slower
- ❌ Costs money at scale

Tracery provides:
- ✅ Instant generation
- ✅ No API costs
- ✅ User control
- ⚠️ Less contextual (but faster)

**Best Approach:** Offer both options, default to Tracery with LLM as enhancement.

### 3. User Empowerment is Missing
Users currently have **no control** over:
- How names are generated
- What narrative templates exist
- How text is procedurally created
- Grammar structures and patterns

This limits creativity and customization.

---

## 🚀 Recommended Next Steps

### Immediate (This Week)
1. **Create `GrammarsTab.tsx`** - Basic CRUD UI for grammars
2. **Add grammar testing console** - See outputs without simulation
3. **Create grammar templates** - Start with 5 common patterns

### Short Term (This Month)
1. **Implement AI grammar generator** - Generate from text descriptions
2. **Build name pattern editor** - Visual tool for name patterns
3. **Add Tracery name generation** - Fast, offline names

### Long Term (This Quarter)
1. **Conversation system** - Template-based dialogue
2. **Social practice generator** - Cultural pattern creation
3. **Grammar composition tools** - Merge, extend, adapt grammars

---

## 📝 Conclusion

**Kismet's Tracery integration is technically complete but practically inaccessible.** The backend infrastructure is solid, but users have no way to leverage it without:

1. **Grammar Management UI** - To create and edit grammars
2. **Procedural Generation** - To auto-create grammars
3. **Name Integration** - To use Tracery for character names

**Priority should be on Phase 1 (Grammar UI) and Phase 2 (Grammar Generation)** as these are the most impactful and will immediately unlock creative possibilities for users.

The conversation system and social practices are lower priority since alternative systems exist (AI chat, manual rules), but would add value for specific use cases.

---

*Analysis complete - Focus on empowering users to create and control their procedural content* ✅
