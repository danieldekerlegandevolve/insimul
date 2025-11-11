import { getGenAI, isGeminiConfigured, getGeminiApiKey, GEMINI_MODELS } from "../config/gemini.js";

/**
 * Text-to-Speech using Google Cloud Text-to-Speech with gemini-2.5-pro-tts
 */
export async function textToSpeech(
  text: string, 
  voiceName: string = "Kore", 
  gender: string = "neutral",
  encoding: "MP3" | "WAV" = "MP3"
): Promise<Buffer> {
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

    // Map encoding - WAV is LINEAR16 in Google Cloud TTS
    const audioEncoding = encoding === "WAV" ? "LINEAR16" : "MP3";

    const [response] = await ttsClient.synthesizeSpeech({
      input: { 
        text: text
      },
      voice: {
        languageCode: languageCode,
        ssmlGender: ssmlGender as any
      },
      audioConfig: {
        audioEncoding: audioEncoding as any,
        // For WAV, set sample rate
        ...(encoding === "WAV" && { sampleRateHertz: 24000 })
      }
    });

    if (!response.audioContent) {
      throw new Error("No audio content in response");
    }

    // Convert to Buffer
    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    // If WAV format, we need to add WAV header since LINEAR16 is raw PCM
    if (encoding === "WAV") {
      return addWavHeader(audioBuffer, 24000, 1); // 24kHz, mono
    }

    return audioBuffer;
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add WAV header to raw PCM data
 */
function addWavHeader(pcmData: Buffer, sampleRate: number, numChannels: number): Buffer {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return Buffer.concat([header, pcmData]);
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
