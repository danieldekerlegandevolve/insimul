/**
 * Example rule that demonstrates Tracery integration
 *
 * This rule shows how to use tracery_generate() in a rule to create narrative text.
 */

export const exampleTraceryRule = {
  name: "succession_event",
  description: "Example rule that generates narrative using Tracery",
  content: `
rule succession_event {
  when {
    Character(?heir) and
    Character(?lord) and
    dies(?lord) and
    parent_of(?lord, ?heir)
  }
  then {
    inherit_title(?heir)
    tracery_generate("succession_ceremony", {heir: ?heir.name})
  }
}
  `.trim(),
  sourceFormat: "insimul",
  ruleType: "trigger",
  priority: 8,
  likelihood: 1.0,
  enabled: true,
  tags: ["narrative", "succession", "tracery"],
  parsedContent: {
    conditions: [
      { type: "predicate", name: "Character", args: ["?heir"] },
      { type: "predicate", name: "Character", args: ["?lord"] },
      { type: "predicate", name: "dies", args: ["?lord"] },
      { type: "predicate", name: "parent_of", args: ["?lord", "?heir"] }
    ],
    effects: [
      {
        type: "modify_attribute",
        target: "?heir",
        action: "inherit_title"
      },
      {
        type: "generate_text",
        target: "narrative",
        action: "generate",
        traceryTemplate: "succession_ceremony",
        variables: {
          heir: "?heir.name"
        }
      }
    ]
  }
};

export const exampleCharacterGreetingRule = {
  name: "character_greeting",
  description: "Generate personalized character greetings",
  content: `
rule character_greeting {
  when {
    Character(?person) and
    enters_location(?person, ?location)
  }
  then {
    tracery_generate("barbarian_names", {})
  }
}
  `.trim(),
  sourceFormat: "insimul",
  ruleType: "trigger",
  priority: 3,
  likelihood: 0.7,
  enabled: true,
  tags: ["narrative", "greeting", "tracery"],
  parsedContent: {
    conditions: [
      { type: "predicate", name: "Character", args: ["?person"] },
      { type: "predicate", name: "enters_location", args: ["?person", "?location"] }
    ],
    effects: [
      {
        type: "generate_text",
        target: "narrative",
        action: "generate",
        traceryTemplate: "barbarian_names",
        variables: {}
      }
    ]
  }
};
