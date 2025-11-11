import { storage } from "../db/storage";
import { getGenAI, isGeminiConfigured, GEMINI_MODELS } from "../config/gemini.js";

/**
 * Generate a character response using Gemini
 */
export async function getCharacterResponse(
  userQuery: string,
  charID: string
): Promise<{ response: string; audio: string | null }> {
  if (!isGeminiConfigured()) {
    return {
      response: "[Gemini API key not set]",
      audio: null
    };
  }

  try {
    const ai = getGenAI();

    // Get character from storage
    const character = await storage.getCharacter(charID);

    let characterContext = `Character ID: ${charID}`;

    if (character) {
      characterContext = `
Character Name: ${character.firstName} ${character.lastName || ''}
Character Description: ${character.description || 'No description available'}
Personality Traits: ${character.personalityTraits?.join(', ') || 'Not specified'}
Background: ${character.backstory || 'Not specified'}
`;
    }

    const prompt = `${characterContext}\n\nUser Query: ${userQuery}\n\nRespond in character, maintaining consistency with the character's personality and background.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.PRO,
      contents: prompt,
    });

    return {
      response: response.text || "I don't have a response at this time.",
      audio: null
    };
  } catch (error) {
    console.error("Character response error:", error);
    return {
      response: `[Gemini error: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      audio: null
    };
  }
}

/**
 * Get character actions based on current context
 */
export async function getCharacterActions(charID: string): Promise<string[]> {
  try {
    const character = await storage.getCharacter(charID);

    if (!character) {
      return ["introduce_self", "observe", "wait"];
    }

    // Generate contextual actions based on character
    const actions = [
      "speak",
      "move",
      "interact",
      "observe",
      "think"
    ];

    // Add personality-specific actions
    if (character.personalityTraits?.includes("aggressive")) {
      actions.push("confront", "challenge");
    }
    if (character.personalityTraits?.includes("friendly")) {
      actions.push("greet", "help");
    }
    if (character.personalityTraits?.includes("cunning")) {
      actions.push("scheme", "deceive");
    }

    return actions;
  } catch (error) {
    console.error("Get actions error:", error);
    return ["wait"];
  }
}

/**
 * Get action response for a specific action
 */
export async function getActionResponse(
  charID: string,
  action: string,
  context?: string
): Promise<string> {
  if (!isGeminiConfigured()) {
    return "The character performs the action.";
  }

  try {
    const ai = getGenAI();
    const character = await storage.getCharacter(charID);

    const characterContext = character ? `
Character: ${character.firstName} ${character.lastName || ''}
Personality: ${character.personalityTraits?.join(', ') || 'Not specified'}
` : `Character ID: ${charID}`;

    const prompt = `${characterContext}
Action: ${action}
Context: ${context || 'No additional context'}

Generate a brief narrative description of how this character performs this action, staying true to their personality.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.PRO,
      contents: prompt,
    });

    return response.text || "The character acts.";
  } catch (error) {
    console.error("Action response error:", error);
    return "The character performs the action.";
  }
}

/**
 * List narrative sections for a character
 */
export function listNarrativeSections(): Array<{ section: string }> {
  return [
    { section: "Introduction" },
    { section: "Rising Action" },
    { section: "Conflict" },
    { section: "Climax" },
    { section: "Resolution" },
    { section: "Epilogue" }
  ];
}

/**
 * List narrative triggers for a character
 */
export function listNarrativeTriggers(): Array<{ trigger: string }> {
  return [
    { trigger: "Scene Start" },
    { trigger: "Character Entry" },
    { trigger: "Dialogue Begin" },
    { trigger: "Action Initiated" },
    { trigger: "Conflict Escalation" },
    { trigger: "Resolution Reached" },
    { trigger: "Scene End" }
  ];
}
