# Insimul Language Reference

## Overview

Insimul is a narrative rule language that combines predicate logic (from Prolog) with narrative generation capabilities (from Tracery). It compiles to Prolog for execution but provides a higher-level, game-friendly syntax.

## Basic Rule Structure

```insimul
rule rule_name {
  when (
    // Conditions - what must be true for rule to fire
  )
  then {
    // Effects - what happens when rule fires
  }
  priority: 5
  likelihood: 0.8
  tags: [category, theme]
}
```

## Components

### 1. Rule Declaration

```insimul
rule rule_name {
  // Rule body
}
```

- `rule` keyword starts the declaration
- `rule_name` must be unique identifier (lowercase, underscores)
- Curly braces `{}` contain the rule body

### 2. Conditions (when clause)

The `when` clause contains predicates that must match for the rule to fire.

#### Basic Predicates

```insimul
when (
  Character(?hero)                    // Entity type check
  age(?hero, 25)                      // Property with value
  occupation(?hero, "knight")         // String literal
  alive(?hero)                        // Boolean check
)
```

#### Variables

Variables start with `?` and bind to entities:

```insimul
Character(?person)     // ?person binds to any character
age(?person, Age)      // Age is unbound, will match any age
age(?person, ?years)   // ?years binds to the age value
```

#### Logical Operators

```insimul
when (
  Character(?a) and Character(?b)     // Both must be true
  married(?a, ?b) or engaged(?a, ?b)  // Either can be true
  not dead(?a)                         // Negation
)
```

#### Comparisons

```insimul
when (
  age(?person, Age) and Age > 30                    // Numeric comparison
  ?hero.status == "nobility"                        // Property equality
  wealth(?merchant, W) and W >= 1000                // Greater than or equal
  height(?giant, H) and H > ?human.height           // Variable comparison
)
```

Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `like`

#### Property Access

```insimul
when (
  Character(?lord) and
  ?lord.title == "Duke" and          // Dotted property access
  ?lord.age > 40 and
  ?lord.wealth >= 5000
)
```

#### Pattern Matching

```insimul
when (
  Character(?person) and
  ?person.name like "John*"          // Wildcard matching
)
```

#### Genealogical Predicates

```insimul
when (
  parent_of(?father, ?son)           // Direct parent
  ancestor_of(?elder, ?young)        // Any ancestor
  sibling_of(?brother, ?sister)      // Siblings
  married(?spouse1, ?spouse2)        // Marriage
  eldest_child(?heir)                // Birth order
)
```

### 3. Effects (then clause)

The `then` clause specifies what happens when the rule fires.

#### Set Property

```insimul
then {
  set_property(?person, "status", "nobility")
  set_property(?heir, "title", ?lord.title)
}
```

#### Modify Value

```insimul
then {
  modify(?person, "wealth", +1000)               // Increase
  modify(?character, "health", -20)              // Decrease
  modify(?merchant, "reputation", *1.5)          // Multiply
}
```

#### Create Relationship

```insimul
then {
  create_relationship(?hero, ?ally, "friendship", 80)
  modify_relationship(?noble, ?commoner, +10)
  remove_relationship(?enemy1, ?enemy2, "alliance")
}
```

#### Trigger Event

```insimul
then {
  trigger_event("succession_ceremony", ?heir)
  trigger_event("war_declaration", {attacker: ?king1, defender: ?king2})
}
```

#### Generate Text (Tracery)

```insimul
then {
  tracery_generate("coronation", {
    heir: ?heir.name,
    title: ?lord.title,
    kingdom: ?realm.name
  })
}
```

#### Create Entity

```insimul
then {
  create_child(?child, ?mother, ?father)
  create_business(?shop, "blacksmith", ?owner)
}
```

#### Inherit Properties

```insimul
then {
  inherit_title(?heir, ?lord.title)
  inherit_lands(?heir, ?lord.holdings)
  inherit_traits(?child, ?mother, ?father)
}
```

#### Call Function

```insimul
then {
  call_function("update_succession_line", [?realm, ?heir])
  call_function("generate_birth_name", [?child])
}
```

### 4. Metadata

#### Priority

```insimul
priority: 8
```

- Range: 1-10 (10 = highest priority)
- Higher priority rules execute first
- Default: 5

#### Likelihood

```insimul
likelihood: 0.7
```

- Range: 0.0-1.0 (probability of firing)
- 0.0 = never fires, 1.0 = always fires (if conditions match)
- Used for non-deterministic events
- Optional (default: 1.0)

#### Tags

```insimul
tags: [nobility, succession, inheritance]
```

- Array of strings
- Used for categorization and filtering
- Optional but recommended

## Rule Types

### Trigger Rules

Standard conditional rules that fire when conditions match:

```insimul
rule noble_death_succession {
  when (
    Noble(?lord) and
    dies(?lord) and
    eldest_child(?heir) and
    parent_of(?lord, ?heir)
  )
  then {
    inherit_title(?heir, ?lord.title)
    trigger_event("succession", ?heir)
  }
  priority: 9
  tags: [nobility, death, inheritance]
}
```

### Pattern Rules

Rules that match complex narrative patterns:

```insimul
pattern star_crossed_lovers {
  when (
    Character(?romeo) and
    Character(?juliet) and
    in_love(?romeo, ?juliet) and
    in_love(?juliet, ?romeo) and
    rival_families(?romeo.family, ?juliet.family)
  )
  then {
    create_bond(?romeo, ?juliet, "forbidden_love")
    tracery_generate("tragic_romance", {
      lover1: ?romeo.name,
      lover2: ?juliet.name
    })
  }
  priority: 8
  likelihood: 0.9
  tags: [romance, tragedy, narrative]
}
```

### Genealogy Rules

Rules for procedural genealogy generation:

```insimul
genealogy marriage_formation {
  when (
    Character(?man) and
    Character(?woman) and
    age(?man, AgeM) and AgeM >= 18 and
    age(?woman, AgeW) and AgeW >= 18 and
    not married(?man, _) and
    not married(?woman, _) and
    compatible(?man, ?woman)
  )
  then {
    create_marriage(?man, ?woman)
    set_property(?man, "married", true)
    set_property(?woman, "married", true)
  }
  priority: 5
  likelihood: 0.7
  tags: [genealogy, marriage, family]
}
```

## Tracery Templates

Tracery generates narrative text from templates:

```insimul
tracery succession_ceremony {
  "origin": [
    "In a grand ceremony, #heir# was crowned #title# of #kingdom#.",
    "Amid much celebration, #heir# ascended to become the new #title#.",
    "With solemn vows, #heir# inherited the throne as #title# of #kingdom#."
  ],
  "location": ["the throne room", "the great hall", "the cathedral"]
}
```

Variables passed from rules are available as `#variable#`.

## Complete Example

```insimul
rule merchant_becomes_noble {
  when (
    Character(?merchant) and
    occupation(?merchant, "merchant") and
    wealth(?merchant, W) and W >= 10000 and
    reputation(?merchant, R) and R >= 80 and
    Character(?noble) and
    has_status(?noble, "nobility") and
    friendship(?noble, ?merchant, F) and F >= 70
  )
  then {
    set_property(?merchant, "status", "lesser_nobility")
    set_property(?merchant, "title", "Baron")
    trigger_event("ennoblement", ?merchant)
    tracery_generate("ennoblement_ceremony", {
      merchant: ?merchant.name,
      sponsor: ?noble.name,
      title: "Baron"
    })
    modify_relationship(?noble, ?merchant, +20)
  }
  priority: 7
  likelihood: 0.6
  tags: [social_mobility, nobility, merchant, ennoblement]
}

tracery ennoblement_ceremony {
  "origin": [
    "Thanks to the sponsorship of #sponsor#, #merchant# has been granted the title of #title#!",
    "#sponsor# petitioned the crown, and #merchant# was elevated to #title#.",
    "In recognition of great service and wealth, #merchant# became #title# with #sponsor#'s backing."
  ]
}
```

## Variable Binding Rules

### Uppercase vs Lowercase

- `?variable` - Binds to a value (can be reused)
- `Variable` - Unbound variable (matches any value, can't be reused)
- `?Variable` - Prolog-style unbound variable

```insimul
// Bind age to specific value
age(?person, 30)            // Matches only age 30

// Bind age to variable
age(?person, ?years)        // Binds ?years, can check ?years later

// Unbound variable
age(?person, Age)           // Age matches any value, use in comparison
```

### Anonymous Variables

Use `_` for values you don't care about:

```insimul
married(?person, _)         // Checks if married to anyone
parent_of(?parent, _)       // Checks if parent of anyone
```

## Common Patterns

### Check Multiple Properties

```insimul
when (
  Character(?hero) and
  age(?hero, Age) and Age >= 18 and Age <= 30 and
  occupation(?hero, Occupation) and 
  (Occupation == "knight" or Occupation == "warrior") and
  alive(?hero) and
  not married(?hero, _)
)
```

### Family Relationships

```insimul
when (
  Character(?parent) and
  Character(?child) and
  parent_of(?parent, ?child) and
  age(?parent, ParentAge) and
  age(?child, ChildAge) and
  ParentAge - ChildAge >= 18
)
```

### Faction/Group Membership

```insimul
when (
  Character(?member) and
  member_of(?member, ?faction) and
  faction_leader(?faction, ?leader) and
  loyalty(?member, ?faction, Loyalty) and
  Loyalty >= 80
)
```

### Economic Transactions

```insimul
when (
  Character(?buyer) and
  Character(?seller) and
  wealth(?buyer, BuyerWealth) and
  owns(?seller, ?item) and
  price(?item, Price) and
  BuyerWealth >= Price
)
then {
  transfer_item(?item, ?seller, ?buyer)
  modify(?buyer, "wealth", -Price)
  modify(?seller, "wealth", +Price)
  create_relationship(?buyer, ?seller, "customer", 50)
}
```

## Best Practices

### 1. Specific Conditions

Be specific in conditions to avoid unintended matches:

```insimul
// Bad - too broad
when (Character(?person))

// Good - specific criteria
when (
  Character(?person) and
  age(?person, Age) and Age >= 18 and
  occupation(?person, "knight") and
  alive(?person)
)
```

### 2. Use Priority Wisely

- 9-10: Critical structural rules (death, inheritance)
- 7-8: Important events (marriages, wars)
- 5-6: Regular interactions (conversations, trade)
- 3-4: Minor flavor events
- 1-2: Background atmosphere

### 3. Tag Consistently

Use tags to organize and filter rules:

```insimul
tags: [domain, event_type, theme]
// e.g., [nobility, succession, tragic]
//       [merchant, trade, economic]
//       [romance, marriage, family]
```

### 4. Balance Likelihood

- 1.0: Deterministic outcomes (deaths trigger succession)
- 0.8-0.9: Very likely events
- 0.5-0.7: Occasional events
- 0.2-0.4: Rare events
- 0.1: Very rare special events

### 5. Test Rules Independently

Create test scenarios for each rule before deployment:

```insimul
// Test data
Character(john_smith)
age(john_smith, 35)
occupation(john_smith, "merchant")
wealth(john_smith, 15000)

// Should trigger merchant_becomes_noble if other conditions met
```

## Differences from Pure Prolog

| Feature | Prolog | Insimul |
|---------|--------|---------|
| Syntax | `predicate(X, Y) :- ...` | `rule name { when (...) then {...} }` |
| Effects | None (pure logic) | Explicit effect system |
| Text Generation | External | Built-in Tracery |
| Property Access | `property(Entity, Value)` | `?entity.property` |
| Metadata | Comments only | priority, likelihood, tags |
| Execution Model | Query-driven | Event-driven + query |

## Compilation to Prolog

Insimul rules are compiled to Prolog for execution:

**Insimul:**
```insimul
rule greet_noble {
  when (
    Character(?commoner) and
    Character(?noble) and
    has_status(?noble, "nobility")
  )
  then {
    bow_to(?commoner, ?noble)
  }
}
```

**Compiles to Prolog:**
```prolog
greet_noble(Commoner, Noble) :-
    character(Commoner),
    character(Noble),
    has_status(Noble, nobility).

% Effects handled by execution engine
```

The execution engine then applies the effects when the rule fires.

## Further Reading

- `ARCHITECTURE_OVERVIEW.md` - System architecture and execution flow
- `unified-syntax.ts` - Insimul compiler implementation
- `/server/engines/prolog/` - Prolog integration details
- `SYNTAX_EXAMPLES` in `unified-syntax.ts` - More examples
