# Base Rules and Actions System

## Overview

The base rules and actions system provides a layer of **global, reusable behavioral rules and character actions** that apply across all worlds and simulations. These serve as foundational psychological, physical, and social laws that game creators can build upon with world-specific customizations.

## Architecture

### Single Table Approach

Instead of creating separate tables, we use the existing `rules` and `actions` tables with:
- **`isBase` boolean field** - Distinguishes base (global) from world-specific entities
- **Nullable `worldId`** - NULL for base entities, specific ID for world-specific entities

### Benefits

1. **Simplicity** - No additional tables or complex joins
2. **Flexibility** - Easy to query both base and world-specific together
3. **Inheritance** - Worlds can inherit base rules/actions and add their own
4. **Consistency** - Same structure and fields for both types

## Schema

### Rules Table

```typescript
export const rules = pgTable("rules", {
  id: varchar("id").primaryKey(),
  worldId: varchar("world_id"), // NULL for base rules
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  
  isBase: boolean("is_base").default(false), // TRUE for base rules
  
  systemType: text("system_type"), // ensemble, kismet, tott, insimul
  ruleType: text("rule_type"), // trigger, volition, trait, default, pattern
  category: text("category"), // psychological, physical, social, economic
  // ... other fields
});
```

### Actions Table

```typescript
export const actions = pgTable("actions", {
  id: varchar("id").primaryKey(),
  worldId: varchar("world_id"), // NULL for base actions
  name: text("name").notNull(),
  description: text("description"),
  
  isBase: boolean("is_base").default(false), // TRUE for base actions
  
  actionType: text("action_type"), // social, physical, mental, economic
  category: text("category"), // conversation, combat, trade, movement
  // ... other fields
});
```

## Base Rule Categories

### Psychological Rules
Fundamental human behavior patterns:
- **Fear Response** - Characters avoid dangerous situations
- **Social Bonding** - People form relationships based on proximity and interaction
- **Loss Aversion** - Characters value what they have more than potential gains
- **Reciprocity** - Favors tend to be returned
- **Authority Respect** - People tend to obey authority figures

### Physical Rules
Universal physical laws:
- **Gravity** - Objects fall down
- **Fatigue** - Physical exertion depletes energy
- **Hunger** - Characters need food regularly
- **Injury** - Damage reduces capabilities
- **Aging** - Characters change over time

### Social Rules
Universal social dynamics:
- **Reputation** - Actions affect how others perceive you
- **Group Identity** - People align with groups they belong to
- **Social Hierarchy** - Status affects interactions
- **Communication** - Information spreads through networks
- **Cooperation** - People work together for mutual benefit

### Economic Rules
Basic economic principles:
- **Supply and Demand** - Scarcity affects value
- **Trade** - Exchange of goods/services
- **Specialization** - Skills improve with practice
- **Resource Depletion** - Resources are consumed when used
- **Accumulation** - Wealth can be saved and grow

## Base Actions

### Universal Character Actions

**Movement:**
- Walk, Run, Sprint
- Climb, Jump, Swim
- Enter, Exit

**Social:**
- Greet, Goodbye
- Talk, Listen
- Introduce, Ask, Answer
- Befriend, Insult
- Help, Hinder

**Physical:**
- Pick Up, Put Down
- Open, Close
- Push, Pull
- Give, Take
- Eat, Drink, Sleep

**Mental:**
- Think, Plan
- Remember, Forget
- Learn, Teach
- Observe, Search

**Economic:**
- Buy, Sell
- Trade, Barter
- Work, Rest

## Usage in Admin Panel

### Creating Base Rules

1. Navigate to Admin Panel → Base Rules
2. Click "Create Base Rule"
3. Fill in:
   - **Name**: Short descriptive name (e.g., "Fear of Heights")
   - **Description**: Detailed explanation
   - **Content**: Insimul rule syntax
   - **Category**: psychological, physical, social, economic
   - **System Type**: insimul (for execution)
   - **Rule Type**: trigger, volition, trait, etc.
   - **isBase**: TRUE
   - **worldId**: NULL

### Creating World-Specific Rules

Same process but:
- **isBase**: FALSE
- **worldId**: Specific world ID

### Importing From Other Formats

Future support for:
- **Ensemble** - Import .ens files, convert to Insimul
- **Kismet** - Import .kis files, convert to Insimul
- **Talk of the Town** - Import TotT rules, convert to Insimul

**Note**: All formats are converted to Insimul for execution. Other formats are for authoring/viewing only.

## Querying

### Get All Base Rules

```typescript
const baseRules = await storage.getBaseRules();
// Returns all rules where isBase=true and worldId=null
```

### Get Base Rules by Category

```typescript
const psychRules = await storage.getBaseRulesByCategory('psychological');
```

### Get World-Specific Rules

```typescript
const worldRules = await storage.getRulesByWorld(worldId);
// Returns rules where worldId=specific ID
```

### Get Combined Rules (Base + World)

```typescript
const baseRules = await storage.getBaseRules();
const worldRules = await storage.getRulesByWorld(worldId);
const allRules = [...baseRules, ...worldRules];
```

## Execution Model

### Simulation Execution

When running a simulation:

1. **Load Base Rules** - All base rules are loaded first
2. **Load World Rules** - World-specific rules are added
3. **Execute Combined Set** - All rules execute together in Insimul
4. **Priority** - World-specific rules can override base rules via priority

### Example

```javascript
// Base psychological rule (isBase=true, worldId=null)
{
  name: "Fear Response",
  content: "when character.location.danger > 5: character.flee()",
  priority: 5,
  isBase: true,
  category: "psychological"
}

// World-specific override (isBase=false, worldId="world-123")
{
  name: "Brave Warriors Never Flee",
  content: "when character.class == 'warrior': prevent(flee)",
  priority: 10, // Higher priority overrides base
  isBase: false,
  worldId: "world-123"
}
```

## Best Practices

### Base Rules Should Be:
- **Universal** - Apply to most/all scenarios
- **Fundamental** - Represent core mechanics
- **Well-Documented** - Clear descriptions
- **Tested** - Verified across multiple worlds
- **Minimal** - Only truly universal rules

### World Rules Should Be:
- **Specific** - Tailored to world theme
- **Additive** - Build on base rules
- **Thematic** - Match world's genre/setting
- **Balanced** - Don't break core mechanics
- **Documented** - Explain deviations from base

## Migration Path

Run the migration to add support:

```bash
psql -d insimul -f server/migrations/0003_add_base_rules_and_actions_support.sql
```

This adds:
- `description` column to rules
- `isBase` column to rules and actions
- `category` column to rules
- Makes `worldId` nullable in both tables
- Creates indexes for performance

## Future Enhancements

1. **Rule Templates** - Pre-built rule sets for common scenarios
2. **Rule Packages** - Bundled collections (e.g., "Medieval Package")
3. **Version Control** - Track changes to base rules over time
4. **Testing Framework** - Automated testing of rule interactions
5. **Rule Dependencies** - Explicit dependency graphs
6. **Import/Export** - Share base rule sets between installations
7. **Multi-Format Support** - Full Ensemble/Kismet/TotT authoring tools
