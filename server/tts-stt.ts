import { getGenAI, isGeminiConfigured, getGeminiApiKey, GEMINI_MODELS } from "./config/gemini.js";

/**
 * Text-to-Speech using Google Cloud Text-to-Speech with gemini-2.5-pro-tts
 */
export async function textToSpeech(text: string, voiceName: string = "Kore", gender: string = "neutral"): Promise<Buffer> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    // Use Google Cloud Text-to-Speech API
    const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
    const ttsClient = new TextToSpeechClient({
      apiKey: getGeminiApiKey()
    });

    // Determine language based on text content (simple heuristic)
    const isFrench = /[àâäéèêëïîôùûüÿçœæ]/i.test(text) || text.includes('vous') || text.includes('est');
    const languageCode = isFrench ? "fr-FR" : "en-US";
    
    // Map gender to SSML gender format
    const ssmlGender = gender.toLowerCase() === 'female' ? 'FEMALE' : 
                       gender.toLowerCase() === 'male' ? 'MALE' : 'NEUTRAL';

    const [response] = await ttsClient.synthesizeSpeech({
      input: { 
        text: text
      },
      voice: {
        languageCode: languageCode,
        ssmlGender: ssmlGender as any
      },
      audioConfig: {
        audioEncoding: "MP3" as any
      }
    });

    if (!response.audioContent) {
      throw new Error("No audio content in response");
    }

    // Convert to Buffer
    return Buffer.from(response.audioContent as Uint8Array);
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Speech-to-Text using Gemini's audio understanding
 */
export async function speechToText(audioBuffer: Buffer, mimeType: string = 'audio/wav'): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const client = getGenAI();

    // For smaller files (< 20MB), use inline audio
    if (audioBuffer.length < 20 * 1024 * 1024) {
      const response = await client.models.generateContent({
        model: GEMINI_MODELS.PRO,
        contents: [
          'Generate a transcript of this audio.',
          {
            inlineData: {
              data: audioBuffer.toString('base64'),
              mimeType: mimeType,
            }
          }
        ]
      });

      return response.text || '';
    } else {
      // For larger files, use the Files API
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');

      const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}.audio`);

      try {
        await fs.writeFile(tempPath, audioBuffer);

        const uploadedFile = await client.files.upload({
          path: tempPath,
          mimeType: mimeType,
        });

        const response = await client.models.generateContent({
          model: GEMINI_MODELS.PRO,
          contents: [
            'Generate a transcript of this audio.',
            { fileData: { fileUri: uploadedFile.uri, mimeType: mimeType } }
          ]
        });

        return response.text || '';
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(tempPath);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }
    }
  } catch (error) {
    console.error("STT error:", error);
    throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available TTS voices
 */
export function getAvailableVoices() {
  return [
    { voice: "Kore", language: "en", gender: "female" },
    { voice: "Charon", language: "en", gender: "male" },
    { voice: "Aoede", language: "en", gender: "female" },
    { voice: "Puck", language: "en", gender: "male" },
  ];
}
