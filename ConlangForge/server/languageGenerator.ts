import OpenAI from "openai";
import type { Language, GenerateLanguageRequest } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface GeneratedLanguageComponents {
  phonology: Language["phonology"];
  grammar: Language["grammar"];
  syntax: Language["syntax"];
  vocabulary: Language["vocabulary"];
}

export async function generateLanguageComponents(
  request: GenerateLanguageRequest,
  parentLanguage?: Language
): Promise<GeneratedLanguageComponents> {
  console.log(`[Language Generator] Starting generation for: ${request.name}`);
  console.log(`[Language Generator] Influences: ${request.influences.join(", ")}`);
  if (parentLanguage) {
    console.log(`[Language Generator] Parent language: ${parentLanguage.name}`);
  }

  const systemPrompt = `You are an expert linguist specializing in constructed languages (conlangs). 
Your task is to generate a complete, coherent, and internally consistent constructed language with phonology, grammar, syntax, and vocabulary.
Return ONLY valid JSON without any markdown formatting or code blocks.`;

  let userPrompt = `Create a constructed language with the following specifications:

Name: ${request.name}
Description: ${request.description}
Influences: ${request.influences.join(", ")}
`;

  if (parentLanguage) {
    userPrompt += `
This is a CHILD LANGUAGE descended from "${parentLanguage.name}". It should:
- Inherit and evolve features from the parent language
- Show linguistic drift and innovation
- Maintain some recognizable connections to the parent
- Have vocabulary that derives from parent language words

Parent Language Summary:
- Word Order: ${parentLanguage.grammar.wordOrder}
- Phonology: Consonants [${parentLanguage.phonology.consonants.join(", ")}], Vowels [${parentLanguage.phonology.vowels.join(", ")}]
- Sample Vocabulary: ${parentLanguage.vocabulary.slice(0, 10).map(v => `${v.word} = ${v.translation}`).join(", ")}
`;
  }

  userPrompt += `
Generate a complete language system with:

1. PHONOLOGY:
   - consonants: array of consonant sounds (IPA notation preferred, 15-25 sounds)
   - vowels: array of vowel sounds (IPA notation preferred, 5-10 sounds)
   - syllableStructure: description of valid syllable patterns (e.g., "(C)(C)V(C)")
   - stressPattern: description of stress rules (e.g., "Penultimate syllable")
   - phoneticNotes: any additional phonetic features`;

  if (parentLanguage) {
    userPrompt += `
   - evolutionRules: array of 4-6 sound change rules showing how sounds evolved from ${parentLanguage.name}, each with:
     - rule: the sound change in linguistic notation (e.g., "p → f / V_V" meaning p becomes f between vowels)
     - description: explanation of the sound change
     - examples: array of 3-5 examples showing parent word → child word transformation, each with:
       - parent: word from ${parentLanguage.name}
       - child: evolved word in ${request.name}
       - meaning: English translation`;
  }

  userPrompt += `

2. GRAMMAR:
   - wordOrder: basic word order (e.g., "SVO", "SOV", "VSO")
   - nounCases: array of grammatical cases (e.g., ["Nominative", "Accusative", "Genitive"])
   - verbTenses: array of tenses (e.g., ["Present", "Past", "Future"])
   - articles: description of article system (e.g., "Definite and indefinite articles")
   - pluralization: how plurals are formed (e.g., "Suffix -en")
   - pronouns: object with person/number pronouns (e.g., {"1sg": "mi", "2sg": "tu", "3sg": "il"})
   - rules: array of 5-8 important grammar rules, each with:
     - title: short title
     - description: detailed explanation
     - examples: array of 2-3 example sentences
   - conjugations: array of 2-3 common verbs with full conjugation tables, each with:
     - verb: infinitive form in the conlang (e.g., "estar")
     - translation: English translation (e.g., "to be")
     - forms: array of conjugated forms for each tense/person/number combination, each with:
       - tense: which tense (e.g., "Present", "Past", "Future")
       - person: which person (e.g., "1st", "2nd", "3rd")
       - number: which number (e.g., "Singular", "Plural")
       - form: the conjugated form
   - declensions: array of 2-3 common nouns with full declension tables, each with:
     - noun: base form in the conlang (e.g., "libro")
     - translation: English translation (e.g., "book")
     - gender: grammatical gender if applicable (e.g., "Masculine", "Feminine", "Neuter")
     - forms: array of declined forms for each case/number combination, each with:
       - case: which case (e.g., "Nominative", "Accusative", "Genitive")
       - number: which number (e.g., "Singular", "Plural")
       - form: the declined form

3. SYNTAX:
   - sentenceStructure: detailed explanation of sentence construction
   - questionFormation: how questions are formed
   - negation: how negation works
   - subordination: how subordinate clauses work
   - patterns: array of 3-5 common syntactic patterns, each with:
     - pattern: the pattern structure
     - description: explanation
     - example: example sentence

4. VOCABULARY:
   - Array of 120-150 words, each with:
     - word: the word in the conlang
     - translation: English translation
     - partOfSpeech: grammatical category (noun, verb, adjective, adverb, preposition, conjunction, pronoun, etc.)
     - etymology: (optional) derivation or origin
     - pronunciation: (optional) IPA pronunciation
   
   Include words for:
   - Common nouns (person, house, water, sun, moon, tree, etc.)
   - Basic verbs (be, have, go, come, see, speak, eat, drink, etc.)
   - Adjectives (good, bad, big, small, new, old, etc.)
   - Numbers (one through ten)
   - Pronouns (I, you, he, she, it, we, they)
   - Common prepositions and conjunctions
   - Greetings and common phrases

Return the result as a JSON object with this exact structure:
{
  "phonology": { ... },
  "grammar": { ... },
  "syntax": { ... },
  "vocabulary": [ ... ]
}`;

  try {
    console.log(`[Language Generator] Calling OpenAI API with model: gpt-4.1...`);
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 16000,
    });

    console.log(`[Language Generator] OpenAI API call successful`);
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error(`[Language Generator] No content in response`);
      throw new Error("No response from AI");
    }

    console.log(`[Language Generator] Received ${content.length} characters, parsing JSON...`);
    
    // Robust JSON parsing with better error handling
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(`[Language Generator] JSON parse error:`, parseError);
      console.error(`[Language Generator] Content preview (first 500 chars):`, content.substring(0, 500));
      console.error(`[Language Generator] Content preview (last 500 chars):`, content.substring(content.length - 500));
      
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        console.log(`[Language Generator] Found JSON in code blocks, trying to parse...`);
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    console.log(`[Language Generator] Successfully generated language with ${parsed.vocabulary?.length || 0} words`);
    return parsed as GeneratedLanguageComponents;
  } catch (error) {
    console.error("[Language Generator] Error generating language:", error);
    if (error instanceof Error) {
      console.error("[Language Generator] Error message:", error.message);
      console.error("[Language Generator] Error stack:", error.stack);
    }
    throw new Error(`Failed to generate language components: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateChatResponse(
  language: Language,
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<{ response: string; inConlang: string }> {
  const systemPrompt = `You are a helpful AI assistant that speaks and understands "${language.name}", a constructed language.

Language Details:
- Description: ${language.description}
- Influences: ${language.influences.join(", ")}
- Word Order: ${language.grammar.wordOrder}
- Grammar: ${JSON.stringify(language.grammar)}

Vocabulary (sample):
${language.vocabulary.slice(0, 30).map(v => `${v.word} = ${v.translation} (${v.partOfSpeech})`).join("\n")}

Your task:
1. Respond to the user's message naturally in English
2. Also provide your response translated into ${language.name}
3. Use the vocabulary and grammar rules provided
4. Be creative but consistent with the language's rules

Return ONLY valid JSON:
{
  "response": "your English response",
  "inConlang": "your response in ${language.name}"
}`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: "user", content: userMessage },
    ];

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: messages as any,
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      response: parsed.response || "I apologize, I couldn't generate a response.",
      inConlang: parsed.inConlang || "",
    };
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate chat response");
  }
}
