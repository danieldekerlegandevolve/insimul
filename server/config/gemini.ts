/**
 * Centralized Gemini AI Configuration
 *
 * This module provides a single source of truth for Gemini AI setup,
 * ensuring consistency across the entire codebase.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

/**
 * Gemini model configurations
 */
export const GEMINI_MODELS = {
  /** Primary model for complex tasks (chat, rule generation, etc.) */
  PRO: 'gemini-2.5-pro',

  /** Fast model for simple tasks */
  FLASH: 'gemini-2.5-flash',

  /** Model for speech tasks (experimental) */
  SPEECH: 'gemini-2.0-flash-exp',
} as const;

/**
 * Get the Gemini API key from environment variables
 */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_FREE_API_KEY || process.env.GEMINI_API_KEY;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

/**
 * Shared GoogleGenerativeAI instance (@google/generative-ai)
 * Used by: name-generator
 */
let generativeAIInstance: GoogleGenerativeAI | null = null;

export function getGenerativeAI(): GoogleGenerativeAI {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY or GEMINI_FREE_API_KEY in .env');
  }

  if (!generativeAIInstance) {
    generativeAIInstance = new GoogleGenerativeAI(apiKey);
  }

  return generativeAIInstance;
}

/**
 * Shared GoogleGenAI instance (@google/genai)
 * Used by: gemini-ai, character-interaction, tts-stt, routes
 */
let genAIInstance: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY or GEMINI_FREE_API_KEY in .env');
  }

  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }

  return genAIInstance;
}

/**
 * Create a model instance with the specified model name
 * @param modelName - Model to use (defaults to PRO)
 */
export function getModel(modelName: string = GEMINI_MODELS.PRO) {
  return getGenerativeAI().getGenerativeModel({ model: modelName });
}

/**
 * Log Gemini configuration status on startup
 */
export function logGeminiStatus() {
  if (isGeminiConfigured()) {
    console.log('✅ Gemini AI configured');
    console.log(`   Model: ${GEMINI_MODELS.PRO}`);
  } else {
    console.warn('⚠️  Gemini API key not found');
    console.warn('   Set GEMINI_API_KEY or GEMINI_FREE_API_KEY in .env');
    console.warn('   Some features (AI chat, name generation) will use fallbacks');
  }
}
