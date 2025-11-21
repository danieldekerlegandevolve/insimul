import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLanguageComponents, generateChatResponse } from "./languageGenerator";
import { insertLanguageSchema, insertChatMessageSchema } from "@shared/schema";
import type { GenerateLanguageRequest, ChatRequest } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all languages
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getAllLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  // Get a specific language
  app.get("/api/languages/:id", async (req, res) => {
    try {
      const language = await storage.getLanguage(req.params.id);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      console.error("Error fetching language:", error);
      res.status(500).json({ error: "Failed to fetch language" });
    }
  });

  // Get child languages
  app.get("/api/languages/:id/children", async (req, res) => {
    try {
      const children = await storage.getChildLanguages(req.params.id);
      res.json(children);
    } catch (error) {
      console.error("Error fetching child languages:", error);
      res.status(500).json({ error: "Failed to fetch child languages" });
    }
  });

  // Generate a new language
  app.post("/api/languages/generate", async (req, res) => {
    try {
      console.log(`[API] POST /api/languages/generate - Request received`);
      console.log(`[API] Request body:`, JSON.stringify(req.body, null, 2));
      
      const validatedData = insertLanguageSchema.parse(req.body);
      console.log(`[API] Validation successful for language: ${validatedData.name}`);
      
      let parentLanguage = undefined;
      if (validatedData.parentId) {
        parentLanguage = await storage.getLanguage(validatedData.parentId);
        if (!parentLanguage) {
          console.error(`[API] Parent language not found: ${validatedData.parentId}`);
          return res.status(404).json({ error: "Parent language not found" });
        }
      }

      const generateRequest: GenerateLanguageRequest = {
        name: validatedData.name,
        description: validatedData.description,
        influences: validatedData.influences,
        parentId: validatedData.parentId,
      };

      console.log(`[API] Starting language generation for: ${validatedData.name}...`);
      const components = await generateLanguageComponents(generateRequest, parentLanguage);
      console.log(`[API] Language components generated successfully`);
      
      const language = await storage.createLanguage({
        name: validatedData.name,
        description: validatedData.description,
        influences: validatedData.influences,
        parentId: validatedData.parentId || null,
        phonology: components.phonology,
        grammar: components.grammar,
        syntax: components.syntax,
        vocabulary: components.vocabulary,
      });

      console.log(`[API] Language created and stored: ${language.name} (${language.id})`);
      res.json(language);
    } catch (error) {
      console.error("[API] Error in /api/languages/generate:", error);
      if (error instanceof Error) {
        console.error("[API] Error details:", error.message);
        console.error("[API] Error stack:", error.stack);
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to generate language" });
      }
    }
  });

  // Get chat messages for a language
  app.get("/api/chat/:languageId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.languageId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Send a chat message
  app.post("/api/chat", async (req, res) => {
    try {
      const { languageId, message } = req.body as ChatRequest;
      
      const language = await storage.getLanguage(languageId);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }

      const userMessage = await storage.createChatMessage({
        languageId,
        role: "user",
        content: message,
        inConlang: null,
      });

      const existingMessages = await storage.getChatMessages(languageId);
      const conversationHistory = existingMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log(`Generating chat response for ${language.name}...`);
      const aiResponse = await generateChatResponse(
        language,
        message,
        conversationHistory
      );

      const assistantMessage = await storage.createChatMessage({
        languageId,
        role: "assistant",
        content: aiResponse.response,
        inConlang: aiResponse.inConlang,
      });

      console.log(`Chat response generated successfully`);
      res.json({ message: assistantMessage });
    } catch (error) {
      console.error("Error processing chat message:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
