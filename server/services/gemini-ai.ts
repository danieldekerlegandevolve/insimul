import { getGenAI, isGeminiConfigured, GEMINI_MODELS } from "../config/gemini.js";

export async function generateRule(prompt: string, sourceFormat: string): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = getGenAI();

  let formatExample = '';
  
  if (sourceFormat === 'insimul') {
    formatExample = `For Insimul format, use this structure:
rule rule_name {
  when (
    condition1 and
    condition2
  )
  then {
    effect1
    effect2
  }
  priority: 5
  tags: [tag1, tag2]
}`;
  } else if (sourceFormat === 'ensemble') {
    formatExample = `For Ensemble format, use JSON structure:
{
  "triggerRules": {
    "fileName": "triggerRules",
    "type": "trigger",
    "rules": [
      {
        "name": "rule_name",
        "conditions": [
          {
            "category": "relationship",
            "type": "parent_of",
            "first": "?x",
            "second": "?y"
          }
        ],
        "effects": [
          {
            "category": "status",
            "type": "inherit_title",
            "first": "?y",
            "value": true
          }
        ]
      }
    ]
  }
}`;
  } else if (sourceFormat === 'kismet') {
    formatExample = `For Kismet format, use Prolog-style syntax:
default trait trait_name(>Self, <Other):
  +++condition1,
  +++condition2.
  likelihood: 0.8`;
  } else if (sourceFormat === 'tott') {
    formatExample = `For Talk of the Town format, use JSON structure:
{
  "trigger_rules": [
    {
      "name": "rule_name",
      "type": "trigger",
      "priority": 5,
      "conditions": [
        {
          "type": "predicate",
          "predicate": "is_married",
          "first": "?person"
        }
      ],
      "effects": [
        {
          "type": "set",
          "target": "?person",
          "action": "relationship_status",
          "value": "married"
        }
      ],
      "tags": ["marriage", "relationship"],
      "active": true
    }
  ]
}`;
  }

  const systemPrompt = `You are an expert in narrative AI systems and rule generation. Generate a single rule based on the user's prompt for the ${sourceFormat} system format.

${formatExample}

Generate a complete, syntactically correct rule that implements the user's request. Be creative but realistic. Return ONLY the rule code in the proper format for ${sourceFormat}, no explanations or markdown.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.PRO,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: `Generate a ${sourceFormat} rule for: ${prompt}`,
  });

  if (!response.text) {
    throw new Error("AI service returned empty response");
  }

  return response.text;
}

export async function generateBulkRules(prompt: string, sourceFormat: string): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = getGenAI();

  let formatExample = '';
  
  if (sourceFormat === 'insimul') {
    formatExample = `For Insimul format, generate multiple rules like:
rule rule_name_1 {
  when (condition1)
  then { effect1 }
  priority: 5
}

rule rule_name_2 {
  when (condition2)
  then { effect2 }
  priority: 5
}`;
  } else if (sourceFormat === 'ensemble') {
    formatExample = `For Ensemble format, generate multiple rules in JSON:
{
  "triggerRules": {
    "fileName": "triggerRules",
    "type": "trigger",
    "rules": [
      {
        "name": "rule1",
        "conditions": [...],
        "effects": [...]
      },
      {
        "name": "rule2",
        "conditions": [...],
        "effects": [...]
      }
    ]
  }
}`;
  } else if (sourceFormat === 'kismet') {
    formatExample = `For Kismet format, generate multiple traits:
default trait trait_name_1(>Self):
  +++condition1.
  likelihood: 0.8

default trait trait_name_2(>Self):
  +++condition2.
  likelihood: 0.7`;
  } else if (sourceFormat === 'tott') {
    formatExample = `For Talk of the Town format, generate multiple rules in JSON:
{
  "trigger_rules": [
    {
      "name": "rule1",
      "type": "trigger",
      "conditions": [...],
      "effects": [...]
    },
    {
      "name": "rule2",
      "type": "trigger",
      "conditions": [...],
      "effects": [...]
    }
  ]
}`;
  }

  const systemPrompt = `You are an expert in narrative AI systems and rule generation. Generate MULTIPLE related rules based on the user's prompt for the ${sourceFormat} system format.

${formatExample}

Generate multiple complete, syntactically correct rules that work together to implement the user's request. Create at least 3-5 related rules that complement each other. Be creative but realistic. Return ONLY the rule code in the proper format for ${sourceFormat}, no explanations or markdown.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.PRO,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: `Generate multiple ${sourceFormat} rules for: ${prompt}`,
  });

  if (!response.text) {
    throw new Error("AI service returned empty response");
  }

  return response.text;
}

export async function editRuleWithAI(currentContent: string, editInstructions: string, sourceFormat: string): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = getGenAI();

  const systemPrompt = `You are an expert in narrative AI systems and rule editing. You will receive existing rule code and instructions for how to modify it.

For Insimul format:
rule rule_name {
  when (
    conditions here
  )
  then {
    effects here
  }
  priority: number
  tags: [tag1, tag2]
}

For Ensemble format:
rule rule_name {
  when (Person(?x) and condition(?x))
  then {
    effect(?x)
  }
}

For Kismet format:
default trait trait_name(>Self):
  +++condition.
  likelihood: 0.8

Modify the existing rule according to the user's instructions. Maintain the ${sourceFormat} format and correct syntax. Return ONLY the modified rule code, no explanations.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.PRO,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: `Current rule:\n\n${currentContent}\n\nEdit instructions: ${editInstructions}\n\nReturn the complete modified rule in ${sourceFormat} format.`,
  });

  if (!response.text) {
    throw new Error("AI service returned empty response");
  }

  return response.text;
}