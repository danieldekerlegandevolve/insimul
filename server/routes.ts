import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import { nameGenerator } from './services/name-generator.js';
import { isGeminiConfigured, getModel, GEMINI_MODELS } from './config/gemini.js';
import {
  insertRuleSchema,
  insertGrammarSchema,
  insertCharacterSchema,
  insertWorldSchema,
  insertCountrySchema,
  insertStateSchema,
  insertSettlementSchema,
  insertSimulationSchema,
  insertActionSchema,
  insertTruthSchema,
  type InsertRule
} from "@shared/schema";
import { z } from "zod";
import { addImpulse, getImpulseStrength, decayImpulses } from "./extensions/impulse-system.js";
import { setRelationship, modifyRelationship, queryRelationships } from "./extensions/relationship-utils.js";
import { selectVolition } from "./extensions/volition-system.js";
import { WorldGenerator } from "./generators/world-generator.js";

// Helper function to generate narrative text from actual characters
function generateNarrative(characters: any[]): string {
  if (characters.length === 0) {
    return "The simulation runs its course, with various events unfolding across the realm.";
  }
  
  const character = characters[Math.floor(Math.random() * characters.length)];
  const name = `${character.firstName} ${character.lastName}`;
  const title = character.socialAttributes?.title || "a notable figure";
  
  const narrativeTemplates = [
    `${name}, ${title}, takes decisive action that will shape the future of the realm.`,
    `The actions of ${name} set in motion a chain of events affecting the social fabric of the world.`,
    `${name} navigates complex social dynamics, their choices rippling through the community.`,
    `As ${title}, ${name} faces challenges that test their resolve and influence.`,
    `The story of ${name} unfolds, intertwining with the fates of others in unexpected ways.`,
  ];
  
  return narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];
}

// Helper function to generate detailed simulation results from actual data
async function generateDetailedResults(
  worldId: string,
  rulesCount: number, 
  eventsCount: number, 
  charactersCount: number
) {
  // Fetch actual rules and characters from the database
  const rules = await storage.getRulesByWorld(worldId);
  const characters = await storage.getCharactersByWorld(worldId);
  
  // Generate rule execution descriptions from actual rules
  const selectedRules = [];
  const shuffledRules = [...rules].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(rulesCount, shuffledRules.length); i++) {
    const rule = shuffledRules[i];
    selectedRules.push(`${rule.name} (${rule.systemType})`);
  }
  
  // If we don't have enough rules, add generic ones
  while (selectedRules.length < rulesCount) {
    selectedRules.push(`Generic rule ${selectedRules.length + 1} executed`);
  }

  // Generate events based on characters and rules
  const selectedEvents = [];
  for (let i = 0; i < eventsCount; i++) {
    if (characters.length > 0) {
      const char = characters[Math.floor(Math.random() * characters.length)];
      const eventTemplates = [
        `${char.firstName} ${char.lastName} engaged in social interaction`,
        `${char.firstName} ${char.lastName} made a significant decision`,
        `Events unfolded involving ${char.firstName} ${char.lastName}`,
        `${char.firstName} ${char.lastName}'s actions influenced the world state`,
      ];
      selectedEvents.push(eventTemplates[Math.floor(Math.random() * eventTemplates.length)]);
    } else {
      selectedEvents.push(`Simulation event ${i + 1} occurred`);
    }
  }

  // Generate affected characters with their actual data
  const affectedCharacters = [];
  const shuffledCharacters = [...characters].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(charactersCount, shuffledCharacters.length); i++) {
    const char = shuffledCharacters[i];
    const actions = [
      "participated in simulation",
      "state was updated",
      "interacted with others",
      "was affected by rules",
      "experienced changes"
    ];
    affectedCharacters.push({
      name: `${char.firstName} ${char.lastName}`,
      action: actions[Math.floor(Math.random() * actions.length)]
    });
  }

  return {
    rulesExecuted: selectedRules,
    eventsGenerated: selectedEvents,
    charactersAffected: affectedCharacters
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Worlds (now the primary containers, replacing projects)
  app.get("/api/worlds", async (req, res) => {
    try {
      const worlds = await storage.getWorlds();
      res.json(worlds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch worlds" });
    }
  });

  // Generate rule using AI (single or bulk)
  app.post("/api/generate-rule", async (req, res) => {
    try {
      console.log('AI Generation Request:', { ...req.body, prompt: req.body.prompt?.substring(0, 50) });

      // Check for API key early
      if (!isGeminiConfigured()) {
        console.error('Gemini API not configured');
        return res.status(500).json({
          error: "AI service not configured. Please set GEMINI_API_KEY in your .env file"
        });
      }
      
      const { generateRule, generateBulkRules } = await import("./gemini-ai.js");
      const { prompt, systemType, bulkCreate = false } = req.body;
      
      if (!prompt || !systemType) {
        return res.status(400).json({ error: "Missing prompt or systemType" });
      }

      console.log(`Generating ${bulkCreate ? 'bulk' : 'single'} rule for system: ${systemType}`);
      
      const generatedRule = bulkCreate 
        ? await generateBulkRules(prompt, systemType)
        : await generateRule(prompt, systemType);
      
      console.log('Rule generated successfully');
      res.json({ rule: generatedRule, isBulk: bulkCreate });
    } catch (error) {
      console.error("Error generating rule:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate rule";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Edit rule using AI
  app.post("/api/edit-rule", async (req, res) => {
    try {
      const { editRuleWithAI } = await import("./gemini-ai.js");
      const { currentContent, editInstructions, systemType } = req.body;
      
      if (!currentContent || !editInstructions || !systemType) {
        return res.status(400).json({ error: "Missing required fields: currentContent, editInstructions, or systemType" });
      }

      const editedRule = await editRuleWithAI(currentContent, editInstructions, systemType);
        
      res.json({ rule: editedRule });
    } catch (error) {
      console.error("Error editing rule:", error);
      res.status(500).json({ error: "Failed to edit rule with AI" });
    }
  });

  // Social Rules
  app.get("/api/worlds/:worldId/rules", async (req, res) => {
    try {
      const rules = await storage.getRulesByWorld(req.params.worldId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social rules" });
    }
  });

  // Legacy route for backward compatibility
  app.get("/api/projects/:projectId/rules", async (req, res) => {
    try {
      const rules = await storage.getRulesByWorld(req.params.projectId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social rules" });
    }
  });

  app.post("/api/rules", async (req, res) => {
    try {
      const validatedData = insertRuleSchema.parse(req.body);
      const rule = await storage.createRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rule data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create rule" });
    }
  });

  app.put("/api/rules/:id", async (req, res) => {
    try {
      const validatedData = insertRuleSchema.partial().parse(req.body);
      const rule = await storage.updateRule(req.params.id, validatedData);
      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rule data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update rule" });
    }
  });

  app.delete("/api/rules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  // ============================================================
  // Grammar operations - Tracery templates for narrative generation
  // ============================================================

  app.get("/api/worlds/:worldId/grammars", async (req, res) => {
    try {
      const grammars = await storage.getGrammarsByWorld(req.params.worldId);
      res.json(grammars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grammars" });
    }
  });

  app.get("/api/grammars/:id", async (req, res) => {
    try {
      const grammar = await storage.getGrammar(req.params.id);
      if (!grammar) {
        return res.status(404).json({ error: "Grammar not found" });
      }
      res.json(grammar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grammar" });
    }
  });

  app.get("/api/worlds/:worldId/grammars/:name", async (req, res) => {
    try {
      const grammar = await storage.getGrammarByName(req.params.worldId, req.params.name);
      if (!grammar) {
        return res.status(404).json({ error: "Grammar not found" });
      }
      res.json(grammar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grammar" });
    }
  });

  app.post("/api/grammars", async (req, res) => {
    try {
      const validatedData = insertGrammarSchema.parse(req.body);
      const grammar = await storage.createGrammar(validatedData);
      res.json(grammar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid grammar data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create grammar" });
    }
  });

  app.put("/api/grammars/:id", async (req, res) => {
    try {
      const validatedData = insertGrammarSchema.partial().parse(req.body);
      const grammar = await storage.updateGrammar(req.params.id, validatedData);
      if (!grammar) {
        return res.status(404).json({ error: "Grammar not found" });
      }
      res.json(grammar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid grammar data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update grammar" });
    }
  });

  app.delete("/api/grammars/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGrammar(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Grammar not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete grammar" });
    }
  });

  // ============================================================
  // Legacy /api/files endpoints - maps to individual rules
  // These provide backward compatibility for the frontend
  // ============================================================

  // Get all "files" (rules grouped by world)
  app.get("/api/worlds/:worldId/files", async (req, res) => {
    try {
      const rules = await storage.getRulesByWorld(req.params.worldId);
      
      // Transform rules to look like "files" for backward compatibility
      const files = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        path: `Rules/${rule.name}`,
        content: rule.content,
        systemType: rule.systemType,
        worldId: rule.worldId,
      }));
      
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Create a new "file" (actually creates individual rules)
  app.post("/api/files", async (req, res) => {
    try {
      const { name, path, content, systemType, worldId } = req.body;
      
      if (!name || !content || !systemType || !worldId) {
        return res.status(400).json({ error: "Missing required fields: name, content, systemType, worldId" });
      }

      // Create a single rule with the content
      // The content may contain multiple rules, but we store it as one entity
      const rule = await storage.createRule({
        worldId,
        name: name,
        content: content,
        systemType: systemType,
        ruleType: 'trigger',
        priority: 5,
        likelihood: 1.0,
        conditions: [],
        effects: [],
        tags: [],
        dependencies: [],
        isActive: true,
        isCompiled: false,
        compiledOutput: {},
      });

      res.status(201).json({
        id: rule.id,
        name: rule.name,
        path: `Rules/${rule.name}`,
        content: rule.content,
        systemType: rule.systemType,
        worldId: rule.worldId,
      });
    } catch (error) {
      console.error("Failed to create file:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid file data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create file" });
    }
  });

  // Update a "file" (updates a rule)
  app.put("/api/files/:id", async (req, res) => {
    try {
      const { content, name, systemType } = req.body;
      
      const updateData: Partial<InsertRule> = {};
      if (content !== undefined) updateData.content = content;
      if (name !== undefined) updateData.name = name;
      if (systemType !== undefined) updateData.systemType = systemType;

      const rule = await storage.updateRule(req.params.id, updateData);
      if (!rule) {
        return res.status(404).json({ error: "File not found" });
      }

      // Return in "file" format
      res.json({
        id: rule.id,
        name: rule.name,
        path: `Rules/${rule.name}`,
        content: rule.content,
        systemType: rule.systemType,
        worldId: rule.worldId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid file data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  // Delete a "file" (deletes a rule)
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Characters
  app.get("/api/worlds/:worldId/characters", async (req, res) => {
    try {
      const characters = await storage.getCharactersByWorld(req.params.worldId);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  app.post("/api/worlds/:worldId/characters", async (req, res) => {
    try {
      console.log("=== CREATE CHARACTER REQUEST ===");
      console.log("worldId from params:", req.params.worldId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Ensure worldId is included in the data
      const characterData = { ...req.body, worldId: req.params.worldId };
      console.log("Character data with worldId:", JSON.stringify(characterData, null, 2));
      
      const validatedData = insertCharacterSchema.parse(characterData);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const character = await storage.createCharacter(validatedData);
      console.log("Character created successfully:", character);
      console.log("=== END CREATE CHARACTER ===");
      
      res.status(201).json(character);
    } catch (error) {
      console.error("Failed to create character:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create character" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(validatedData);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create character" });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.partial().parse(req.body);
      const character = await storage.updateCharacter(req.params.id, validatedData);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCharacter(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete character:", error);
      res.status(500).json({ error: "Failed to delete character" });
    }
  });
  
  // Character impulse endpoint (integrated extension)
  app.post("/api/characters/:id/impulse", async (req, res) => {
    try {
      const { type, strength, target } = req.body;
      
      if (!type || strength === undefined) {
        return res.status(400).json({ error: "Missing required fields: type, strength" });
      }
      
      await addImpulse(req.params.id, type, strength, target);
      const currentStrength = await getImpulseStrength(req.params.id, type, target);
      
      res.json({ 
        success: true,
        characterId: req.params.id,
        type,
        target,
        currentStrength 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to add impulse" });
    }
  });
  
  // Character relationship endpoint (integrated extension)
  app.post("/api/characters/:id/relationship", async (req, res) => {
    try {
      const { targetCharacterId, type, strength, reciprocal } = req.body;
      
      if (!targetCharacterId || !type || strength === undefined) {
        return res.status(400).json({ 
          error: "Missing required fields: targetCharacterId, type, strength" 
        });
      }
      
      await setRelationship(
        req.params.id,
        targetCharacterId,
        type,
        strength,
        reciprocal
      );
      
      res.json({ 
        success: true,
        fromCharacterId: req.params.id,
        toCharacterId: targetCharacterId,
        type,
        strength,
        reciprocal
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to set relationship" });
    }
  });
  
  // Character volition selection endpoint (integrated extension)
  app.get("/api/characters/:id/select-action", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      
      const selectedRule = await selectVolition(req.params.id, character.worldId);
      
      if (!selectedRule) {
        return res.json({ 
          characterId: req.params.id,
          action: null,
          message: "No suitable action found based on current state"
        });
      }
      
      res.json({
        characterId: req.params.id,
        action: selectedRule.name,
        ruleId: selectedRule.id,
        effects: selectedRule.effects
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to select action" });
    }
  });

  app.post("/api/worlds", async (req, res) => {
    try {
      const validatedData = insertWorldSchema.parse(req.body);
      const world = await storage.createWorld(validatedData);
      res.status(201).json(world);
    } catch (error) {
      console.error("POST /api/worlds error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid world data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create world" });
    }
  });

  app.delete("/api/worlds/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️  API: Delete world request for ${id}`);
      
      const success = await storage.deleteWorld(id);
      
      if (success) {
        console.log(`✅ API: World ${id} deleted successfully`);
        res.status(200).json({ success: true, message: "World deleted successfully" });
      } else {
        console.log(`❌ API: World ${id} not found`);
        res.status(404).json({ error: "World not found" });
      }
    } catch (error) {
      console.error("DELETE /api/worlds/:id error:", error);
      res.status(500).json({ 
        error: "Failed to delete world",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Country routes
  app.get("/api/worlds/:worldId/countries", async (req, res) => {
    try {
      const countries = await storage.getCountriesByWorld(req.params.worldId);
      res.json(countries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  app.post("/api/worlds/:worldId/countries", async (req, res) => {
    try {
      const countryData = { ...req.body, worldId: req.params.worldId };
      const validatedData = insertCountrySchema.parse(countryData);
      const country = await storage.createCountry(validatedData);
      res.status(201).json(country);
    } catch (error) {
      console.error("Country creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid country data", details: error.errors });
      }
      res.status(500).json({ 
        error: "Failed to create country", 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get("/api/countries/:id", async (req, res) => {
    try {
      const country = await storage.getCountry(req.params.id);
      if (!country) {
        return res.status(404).json({ error: "Country not found" });
      }
      res.json(country);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch country" });
    }
  });

  app.put("/api/countries/:id", async (req, res) => {
    try {
      const country = await storage.updateCountry(req.params.id, req.body);
      if (!country) {
        return res.status(404).json({ error: "Country not found" });
      }
      res.json(country);
    } catch (error) {
      res.status(500).json({ error: "Failed to update country" });
    }
  });

  app.delete("/api/countries/:id", async (req, res) => {
    try {
      const success = await storage.deleteCountry(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Country not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete country" });
    }
  });

  // State routes
  app.get("/api/countries/:countryId/states", async (req, res) => {
    try {
      const states = await storage.getStatesByCountry(req.params.countryId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });

  app.post("/api/countries/:countryId/states", async (req, res) => {
    try {
      const stateData = { ...req.body, countryId: req.params.countryId };
      const validatedData = insertStateSchema.parse(stateData);
      const state = await storage.createState(validatedData);
      res.status(201).json(state);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid state data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create state" });
    }
  });

  app.delete("/api/states/:id", async (req, res) => {
    try {
      const success = await storage.deleteState(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "State not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete state" });
    }
  });

  // Settlement routes
  app.get("/api/worlds/:worldId/settlements", async (req, res) => {
    try {
      const settlements = await storage.getSettlementsByWorld(req.params.worldId);
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });

  app.get("/api/countries/:countryId/settlements", async (req, res) => {
    try {
      const settlements = await storage.getSettlementsByCountry(req.params.countryId);
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });

  app.get("/api/states/:stateId/settlements", async (req, res) => {
    try {
      const settlements = await storage.getSettlementsByState(req.params.stateId);
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });

  app.post("/api/worlds/:worldId/settlements", async (req, res) => {
    try {
      const settlementData = { ...req.body, worldId: req.params.worldId };
      const validatedData = insertSettlementSchema.parse(settlementData);
      const settlement = await storage.createSettlement(validatedData);
      res.status(201).json(settlement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settlement data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create settlement" });
    }
  });

  app.get("/api/settlements/:id", async (req, res) => {
    try {
      const settlement = await storage.getSettlement(req.params.id);
      if (!settlement) {
        return res.status(404).json({ error: "Settlement not found" });
      }
      res.json(settlement);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlement" });
    }
  });

  app.put("/api/settlements/:id", async (req, res) => {
    try {
      const settlement = await storage.updateSettlement(req.params.id, req.body);
      if (!settlement) {
        return res.status(404).json({ error: "Settlement not found" });
      }
      res.json(settlement);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settlement" });
    }
  });

  app.delete("/api/settlements/:id", async (req, res) => {
    try {
      const success = await storage.deleteSettlement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Settlement not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete settlement" });
    }
  });

  // Lots routes
  app.get("/api/settlements/:settlementId/lots", async (req, res) => {
    try {
      const lots = await storage.getLotsBySettlement(req.params.settlementId);
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lots" });
    }
  });

  app.post("/api/lots", async (req, res) => {
    try {
      const lot = await storage.createLot(req.body);
      res.status(201).json(lot);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lot" });
    }
  });

  // Businesses routes
  app.get("/api/settlements/:settlementId/businesses", async (req, res) => {
    try {
      const businesses = await storage.getBusinessesBySettlement(req.params.settlementId);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      const business = await storage.createBusiness(req.body);
      res.status(201).json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to create business" });
    }
  });

  // Residences routes
  app.get("/api/settlements/:settlementId/residences", async (req, res) => {
    try {
      const residences = await storage.getResidencesBySettlement(req.params.settlementId);
      res.json(residences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch residences" });
    }
  });

  app.post("/api/residences", async (req, res) => {
    try {
      const residence = await storage.createResidence(req.body);
      res.status(201).json(residence);
    } catch (error) {
      res.status(500).json({ error: "Failed to create residence" });
    }
  });

  // World generation endpoints
  app.post("/api/generate/world", async (req, res) => {
    try {
      const generator = new WorldGenerator();
      const config = req.body;
      
      const result = await generator.generateWorld(config);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error("World generation error:", error);
      res.status(500).json({ error: "Failed to generate world", details: (error as Error).message });
    }
  });
  
  app.post("/api/generate/genealogy/:worldId", async (req, res) => {
    try {
      const generator = new WorldGenerator();
      const result = await generator.generateGenealogy(req.params.worldId, req.body);
      
      res.json({
        success: true,
        families: result.families.length,
        totalCharacters: result.totalCharacters,
        generations: result.generations
      });
    } catch (error) {
      console.error("Genealogy generation error:", error);
      res.status(500).json({ error: "Failed to generate genealogy", details: (error as Error).message });
    }
  });
  
  app.post("/api/generate/geography/:worldId", async (req, res) => {
    try {
      const generator = new WorldGenerator();
      const result = await generator.generateGeography(req.params.worldId, req.body);
      
      res.json({
        success: true,
        districts: result.districts.length,
        streets: result.streets.length,
        buildings: result.buildings.length,
        landmarks: result.landmarks.length
      });
    } catch (error) {
      console.error("Geography generation error:", error);
      res.status(500).json({ error: "Failed to generate geography", details: (error as Error).message });
    }
  });
  
  app.get("/api/generate/presets", async (req, res) => {
    try {
      const presets = WorldGenerator.getPresets();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: "Failed to get presets" });
    }
  });

  // Hierarchical generation endpoint
  app.post("/api/generate/hierarchical", async (req, res) => {
    try {
      const config = req.body;
      let totalPopulation = 0;
      let numCountries = 0;
      let numStates = 0;
      let numSettlements = 0;

      // Single-shot mode: Generate ALL names in one API call (experimental, much faster)
      const useSingleShot = config.useSingleShot !== false; // Enabled by default
      
      if (useSingleShot && nameGenerator.isEnabled() && config.generateGenealogy) {
        console.log('🚀 Using SINGLE-SHOT generation mode for maximum efficiency...');
        
        const world = await storage.getWorld(config.worldId);
        
        // Build settlement plan
        const settlementPlan = [];
        const numStatesForCountry = config.generateStates ? (config.numStatesPerCountry || 3) : 1;
        const numCities = config.numCitiesPerState || 0;
        const numTowns = config.numTownsPerState || 0;
        const numVillages = config.numVillagesPerState || 0;
        
        for (let j = 0; j < numStatesForCountry; j++) {
          for (let k = 0; k < numCities; k++) {
            settlementPlan.push({ type: 'city' as const, numFamilies: config.numFoundingFamilies || 10, childrenPerFamily: 2 });
          }
          for (let k = 0; k < numTowns; k++) {
            settlementPlan.push({ type: 'town' as const, numFamilies: config.numFoundingFamilies || 10, childrenPerFamily: 2 });
          }
          for (let k = 0; k < numVillages; k++) {
            settlementPlan.push({ type: 'village' as const, numFamilies: config.numFoundingFamilies || 10, childrenPerFamily: 2 });
          }
        }
        
        if (settlementPlan.length === 0) {
          console.log('⚠️ No settlements to generate, skipping single-shot mode');
          // Fall through to traditional generation
        } else {
          // Generate ALL names in ONE API call
          const allNames = await nameGenerator.generateCompleteWorldNames({
            worldName: world?.name || 'Unknown World',
            worldDescription: world?.description || undefined,
            numCountries: 1,
            numStatesPerCountry: config.generateStates ? numStatesForCountry : 0,
            governmentType: config.governmentType || 'monarchy',
            settlements: settlementPlan
          });
          
          console.log(`✅ Generated names complete!`);
          
          // Now create everything using the pre-generated names
          const countryData = allNames.countries[0] || { 
            name: config.countryName || 'Kingdom', 
            description: `A ${config.governmentType || 'monarchial'} realm` 
          };
          
          const country = await storage.createCountry({
            worldId: config.worldId,
            name: countryData.name,
            description: countryData.description,
            governmentType: config.governmentType || 'monarchy',
            economicSystem: config.economicSystem || 'agricultural',
            foundedYear: config.foundedYear
          });
          numCountries++;
          
          let settlementIdx = 0;
          let familyIdx = 0;
          
          for (let j = 0; j < numStatesForCountry; j++) {
            let stateId = null;
            
            if (config.generateStates) {
              const stateName = allNames.states[j]?.name || `${config.stateType || 'Province'} ${j + 1}`;
              const state = await storage.createState({
                worldId: config.worldId,
                countryId: country.id,
                name: stateName,
                stateType: config.stateType || 'province',
                terrain: config.terrain || 'plains'
              });
              stateId = state.id;
              numStates++;
            }
            
            // Create all settlements for this state
            for (const settlementType of ['city', 'town', 'village'] as const) {
              const count = settlementType === 'city' ? numCities : 
                           settlementType === 'town' ? numTowns : numVillages;
              
              for (let k = 0; k < count; k++) {
                const settlementName = allNames.settlements[settlementIdx]?.name || `${settlementType} ${settlementIdx}`;
                
                const settlement = await storage.createSettlement({
                  worldId: config.worldId,
                  countryId: country.id,
                  stateId: stateId,
                  name: settlementName,
                  settlementType: settlementType,
                  terrain: config.terrain || 'plains',
                  population: 0,
                  foundedYear: config.foundedYear
                });
                numSettlements++;
                
                // Create families for this settlement using pre-generated names
                const familiesForSettlement = allNames.families.filter((f: any) => f.settlementIndex === settlementIdx);
                
                for (const familyData of familiesForSettlement) {
                  // Create father
                  const father = await storage.createCharacter({
                    worldId: config.worldId,
                    firstName: familyData.fatherFirstName,
                    lastName: familyData.surname,
                    gender: 'male',
                    birthYear: config.foundedYear - 25,
                    isAlive: true,
                    currentLocation: settlement.id,
                    socialAttributes: { generation: 0, founderFamily: true }
                  });
                  
                  // Create mother
                  const mother = await storage.createCharacter({
                    worldId: config.worldId,
                    firstName: familyData.motherFirstName,
                    lastName: familyData.surname,
                    maidenName: familyData.motherMaidenName,
                    gender: 'female',
                    birthYear: config.foundedYear - 23,
                    isAlive: true,
                    spouseId: father.id,
                    currentLocation: settlement.id,
                    socialAttributes: { generation: 0, founderFamily: true }
                  });
                  
                  await storage.updateCharacter(father.id, { spouseId: mother.id });
                  
                  // Create children
                  const childIds = [];
                  for (const childData of familyData.children || []) {
                    const child = await storage.createCharacter({
                      worldId: config.worldId,
                      firstName: childData.firstName,
                      lastName: familyData.surname,
                      gender: childData.gender,
                      birthYear: config.foundedYear + 1,
                      isAlive: true,
                      parentIds: [father.id, mother.id],
                      currentLocation: settlement.id,
                      socialAttributes: { generation: 1 }
                    });
                    childIds.push(child.id);
                    totalPopulation++;
                  }
                  
                  await storage.updateCharacter(father.id, { childIds });
                  await storage.updateCharacter(mother.id, { childIds });
                  
                  totalPopulation += 2; // Father + mother
                  familyIdx++;
                }
                
                settlementIdx++;
              }
            }
          }
          
          console.log(`🎉 Single-shot generation complete: ${numSettlements} settlements, ${totalPopulation} characters`);
          
          return res.json({
            success: true,
            numCountries,
            numStates,
            numSettlements,
            totalPopulation,
            singleShot: true
          });
        }
      }

      // Generate countries
      for (let i = 0; i < (config.numCountries || 1); i++) {
        // Try to generate a contextual country name using LLM
        let countryName = config.numCountries > 1
          ? `${config.countryPrefix || 'Kingdom'} ${i + 1}`
          : (config.countryName || 'Kingdom');

        // Generate country description based on world context
        const world = await storage.getWorld(config.worldId);
        let countryDescription = `A ${config.governmentType || 'monarchial'} realm`;

        if (nameGenerator.isEnabled() && world) {
          try {
            // Use settlement name generator as a proxy for country names
            // (we can enhance this later with a dedicated country name generator)
            const generatedName = await nameGenerator.generateSettlementName({
              worldName: world.name || 'Unknown World',
              worldDescription: world.description || undefined,
              settlementType: 'city', // Use city as proxy for country-level naming
              terrain: config.terrain || 'plains'
            });
            if (generatedName && generatedName.length > 0) {
              countryName = generatedName;
            }

            // Enhance description with world context
            if (world.description) {
              countryDescription = `A ${config.governmentType || 'monarchial'} realm in ${world.description}`;
            }
          } catch (error) {
            console.warn(`Failed to generate country name, using fallback: ${error}`);
          }
        }

        const countryData = {
          worldId: config.worldId,
          name: countryName,
          description: countryDescription,
          governmentType: config.governmentType || 'monarchy',
          economicSystem: config.economicSystem || 'agricultural',
          foundedYear: config.foundedYear
        };
        
        const country = await storage.createCountry(countryData);
        numCountries++;
        
        // Generate states if enabled
        const numStatesForCountry = config.generateStates ? (config.numStatesPerCountry || 3) : 1;
        
        for (let j = 0; j < numStatesForCountry; j++) {
          let stateId = null;
          
          if (config.generateStates) {
            const stateName = `${config.stateType || 'Province'} ${j + 1}`;
            const stateData = {
              worldId: config.worldId,
              countryId: country.id,
              name: stateName,
              stateType: config.stateType || 'province',
              terrain: config.terrain || 'plains'
            };
            
            const state = await storage.createState(stateData);
            stateId = state.id;
            numStates++;
          }
          
          // Generate settlements for this state/country
          const numCities = config.numCitiesPerState || 0;
          const numTowns = config.numTownsPerState || 0;
          const numVillages = config.numVillagesPerState || 0;
          
          // Helper function to create settlements with batch name generation
          const createSettlements = async (type: 'city' | 'town' | 'village', count: number) => {
            if (count === 0) return;
            
            // Batch generate all settlement names at once
            let settlementNames: string[];
            if (nameGenerator.isEnabled()) {
              try {
                const world = await storage.getWorld(config.worldId);
                const contexts = Array(count).fill(null).map(() => ({
                  worldName: world?.name || 'Unknown World',
                  worldDescription: world?.description || undefined,
                  countryName: country.name,
                  countryDescription: country.description || undefined,
                  countryGovernment: country.governmentType || undefined,
                  countryEconomy: country.economicSystem || undefined,
                  settlementType: type,
                  terrain: config.terrain || 'plains'
                }));
                settlementNames = await nameGenerator.generateSettlementNamesBatch(contexts);
                console.log(`   🏙️  Generated ${settlementNames.length} ${type} names in batch`);
              } catch (error) {
                console.warn(`Failed to batch generate settlement names, using fallbacks: ${error}`);
                settlementNames = Array(count).fill(null).map((_, k) => 
                  `${type.charAt(0).toUpperCase() + type.slice(1)} ${k + 1}`
                );
              }
            } else {
              settlementNames = Array(count).fill(null).map((_, k) => 
                `${type.charAt(0).toUpperCase() + type.slice(1)} ${k + 1}`
              );
            }

            // Create all settlements with generated names
            for (let k = 0; k < count; k++) {
              const settlementData = {
                worldId: config.worldId,
                countryId: country.id,
                stateId: stateId,
                name: settlementNames[k],
                settlementType: type,
                terrain: config.terrain || 'plains',
                population: 0,
                foundedYear: config.foundedYear,
                generationConfig: {
                  numFoundingFamilies: config.numFoundingFamilies || 10,
                  generations: config.generations || 4,
                  marriageRate: config.marriageRate || 0.7,
                  fertilityRate: config.fertilityRate || 0.6,
                  deathRate: config.deathRate || 0.3
                }
              };
              
              const settlement = await storage.createSettlement(settlementData);
              numSettlements++;
              
              // Generate genealogy if enabled
              if (config.generateGenealogy) {
                const generator = new WorldGenerator();
                const genealogyResult = await generator.generateGenealogy(config.worldId, {
                  settlementId: settlement.id,
                  numFoundingFamilies: config.numFoundingFamilies || 10,
                  generations: config.generations || 4,
                  marriageRate: config.marriageRate || 0.7,
                  fertilityRate: config.fertilityRate || 0.6,
                  deathRate: config.deathRate || 0.3,
                  startYear: config.foundedYear || config.currentYear || 1900
                });
                totalPopulation += genealogyResult.totalCharacters;
              }
              
              // Generate geography if enabled
              if (config.generateGeography) {
                const generator = new WorldGenerator();
                await generator.generateGeography(settlement.id, {
                  foundedYear: config.foundedYear
                });
              }
            }
          };
          
          await createSettlements('city', numCities);
          await createSettlements('town', numTowns);
          await createSettlements('village', numVillages);
        }
      }
      
      res.json({
        success: true,
        numCountries,
        numStates,
        numSettlements,
        totalPopulation
      });
    } catch (error) {
      console.error("Hierarchical generation error:", error);
      res.status(500).json({ error: "Failed to generate hierarchy", details: (error as Error).message });
    }
  });

  // Extend existing locations
  app.post("/api/generate/extend", async (req, res) => {
    try {
      const config = req.body;
      let newSettlements = 0;
      let newCharacters = 0;

      // Determine the target for extension
      const targetCountryId = config.countryId;
      const targetStateId = config.stateId;
      const targetSettlementId = config.settlementId;

      // If extending a specific settlement with more generations
      if (targetSettlementId && config.addGenerations > 0) {
        const generator = new WorldGenerator();
        const genealogyResult = await generator.generateGenealogy(config.worldId, {
          settlementId: targetSettlementId,
          numFoundingFamilies: config.numFoundingFamilies || 5,
          generations: config.addGenerations,
          marriageRate: config.marriageRate || 0.7,
          fertilityRate: config.fertilityRate || 0.6,
          deathRate: config.deathRate || 0.3,
          startYear: config.foundedYear || config.currentYear || 1900
        });
        newCharacters += genealogyResult.totalCharacters;
      }

      // Add new settlements to a country or state
      const parentCountryId = targetStateId ? (await storage.getState(targetStateId))?.countryId : targetCountryId;
      
      if (parentCountryId) {
        // Fetch context for name generation
        const world = await storage.getWorld(config.worldId);
        const country = await storage.getCountry(parentCountryId);
        const state = targetStateId ? await storage.getState(targetStateId) : null;
        
        const createSettlements = async (type: 'city' | 'town' | 'village', count: number) => {
          if (count === 0) return;
          
          // Batch generate all settlement names at once
          let settlementNames: string[];
          if (nameGenerator.isEnabled()) {
            try {
              const contexts = Array(count).fill(null).map(() => ({
                worldName: world?.name || 'Unknown World',
                worldDescription: world?.description || undefined,
                countryName: country?.name || undefined,
                countryDescription: country?.description || undefined,
                countryGovernment: country?.governmentType || undefined,
                countryEconomy: country?.economicSystem || undefined,
                stateName: state?.name || undefined,
                settlementType: type,
                terrain: config.terrain || 'plains'
              }));
              settlementNames = await nameGenerator.generateSettlementNamesBatch(contexts);
              console.log(`   🏙️  Batch generated ${settlementNames.length} ${type} names`);
            } catch (error) {
              console.warn(`Failed to batch generate settlement names: ${error}`);
              settlementNames = Array(count).fill(null).map((_, i) => 
                `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`
              );
            }
          } else {
            settlementNames = Array(count).fill(null).map((_, i) => 
              `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`
            );
          }

          for (let i = 0; i < count; i++) {
            const settlementName = settlementNames[i];
            
            const settlementData = {
              worldId: config.worldId,
              countryId: parentCountryId,
              stateId: targetStateId,
              name: settlementName,
              settlementType: type,
              terrain: config.terrain || 'plains',
              population: 0,
              foundedYear: config.foundedYear || 1850,
              generationConfig: {
                numFoundingFamilies: config.numFoundingFamilies || 10,
                generations: config.generations || 4,
                marriageRate: config.marriageRate || 0.7,
                fertilityRate: config.fertilityRate || 0.6,
                deathRate: config.deathRate || 0.3
              }
            };
            
            const settlement = await storage.createSettlement(settlementData);
            newSettlements++;
            
            // Generate genealogy for new settlement
            if (config.generateGenealogy) {
              const generator = new WorldGenerator();
              const genealogyResult = await generator.generateGenealogy(config.worldId, {
                settlementId: settlement.id,
                numFoundingFamilies: config.numFoundingFamilies || 10,
                generations: config.generations || 4,
                marriageRate: config.marriageRate || 0.7,
                fertilityRate: config.fertilityRate || 0.6,
                deathRate: config.deathRate || 0.3,
                startYear: config.foundedYear || config.currentYear || 1850
              });
              newCharacters += genealogyResult.totalCharacters;
            }
            
            // Generate geography for new settlement
            if (config.generateGeography) {
              const generator = new WorldGenerator();
              await generator.generateGeography(settlement.id, {
                foundedYear: config.foundedYear || 1850
              });
            }
          }
        };
        
        await createSettlements('city', config.addCities || 0);
        await createSettlements('town', config.addTowns || 0);
        await createSettlements('village', config.addVillages || 0);
      }

      res.json({
        success: true,
        newSettlements,
        newCharacters
      });
    } catch (error) {
      console.error("Extension error:", error);
      res.status(500).json({ error: "Failed to extend location", details: (error as Error).message });
    }
  });

  // Progress tracking endpoints
  app.get("/api/progress/:taskId", async (req, res) => {
    try {
      const { progressTracker } = await import("./progress-tracker.js");
      const progress = progressTracker.getLatestProgress(req.params.taskId);
      
      if (!progress) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Complete world generation (societies + rules + actions + quests)
  app.post("/api/generate/complete-world", async (req, res) => {
    try {
      const { worldId, worldType, customPrompt, worldName, worldDescription } = req.body;
      const { progressTracker } = await import("./progress-tracker.js");
      const taskId = `world-gen-${worldId}-${Date.now()}`;
      
      // Start tracking progress
      progressTracker.startTask(taskId);
      
      // Return taskId immediately so frontend can start polling
      res.json({ taskId, message: "Generation started" });
      
      // Run generation in background
      (async () => {
        try {
          progressTracker.updateProgress(taskId, 'initializing', 'Preparing world generation...', 5);
          
          console.log(`🌍 Generating complete world: ${worldName}...`);
          console.log(`   World Type: ${worldType || 'default'}`);
          console.log(`   Custom Prompt: ${customPrompt ? 'Yes' : 'No'}`);

          // Enrich the world description with the world type
      const worldTypeDescriptions: Record<string, string> = {
        'medieval-fantasy': 'A medieval fantasy realm with knights, castles, magic, and dragons',
        'high-fantasy': 'An epic high fantasy world with multiple races, powerful magic, and legendary quests',
        'low-fantasy': 'A realistic low fantasy world with subtle magical elements woven into everyday life',
        'dark-fantasy': 'A dark fantasy world of gothic horror and supernatural dread',
        'urban-fantasy': 'A modern urban fantasy setting where magic lurks beneath the surface of city life',
        'sci-fi-space': 'A space opera universe with interstellar travel, alien civilizations, and galactic empires',
        'cyberpunk': 'A cyberpunk dystopia of high tech and low life, dominated by mega-corporations',
        'post-apocalyptic': 'A post-apocalyptic wasteland where survivors struggle in a devastated world',
        'steampunk': 'A steampunk world where Victorian aesthetics meet advanced steam-powered technology',
        'dieselpunk': 'A dieselpunk setting combining 1920s-1950s aesthetics with advanced diesel technology',
        'historical-ancient': 'An ancient civilization inspired by Rome, Greece, Egypt, and other classical cultures',
        'historical-medieval': 'A historically accurate medieval setting drawn from European or Asian history',
        'historical-renaissance': 'A Renaissance world of art, science, political intrigue, and cultural rebirth',
        'historical-victorian': 'A Victorian era world marked by industrial revolution, colonialism, and social change',
        'wild-west': 'A Wild West frontier of cowboys, outlaws, and dusty frontier towns',
        'modern-realistic': 'A contemporary modern world with real-world issues and challenges',
        'superhero': 'A superhero world where powered individuals protect society from threats',
        'horror': 'A horror world of supernatural terrors and psychological dread',
        'mythological': 'A mythological world where gods, myths, and legendary creatures shape reality',
        'solarpunk': 'An optimistic solarpunk future built on sustainable technology and harmony with nature',
      };

      const enrichedDescription = customPrompt ||
        (worldType && worldTypeDescriptions[worldType]) ||
        worldDescription ||
        'A procedurally generated world';

      // Update the world with the enriched description
      await storage.updateWorld(worldId, {
        description: enrichedDescription,
      });

      let totalPopulation = 0;
      let numRules = 0;
      let numActions = 0;
      let numQuests = 0;
      let numCountries = 0;
      let numSettlements = 0;
      
      // Step 1: Generate hierarchical geography (countries, states, settlements, characters)
      console.log('📍 Step 1: Generating geography and societies...');
          progressTracker.updateProgress(taskId, 'geography', 'Generating countries, settlements, and societies...', 10);
      const hierarchicalResponse = await fetch(`${req.protocol}://${req.get('host')}/api/generate/hierarchical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          numCountries: 1,
          generateStates: true,
          numStatesPerCountry: 2,
          numCitiesPerState: 1,
          numTownsPerState: 1,
          numVillagesPerState: 2,
          generateGenealogy: true,
          generateGeography: true,
          numFoundingFamilies: 8,
          generations: 3,
          governmentType: 'monarchy',
          economicSystem: 'feudal',
          terrain: 'plains',
        })
      });
      
      if (hierarchicalResponse.ok) {
        const result = await hierarchicalResponse.json();
        totalPopulation = result.totalPopulation || 0;
        numCountries = result.numCountries || 0;
        numSettlements = result.numSettlements || 0;
        console.log(`✅ Created ${numCountries} countries, ${numSettlements} settlements, ${totalPopulation} characters`);
            progressTracker.updateProgress(taskId, 'geography-complete', `Created ${numSettlements} settlements with ${totalPopulation} characters`, 40);
      }

      // Step 2: Generate character truths (backstories, traits, secrets)
      if (isGeminiConfigured() && totalPopulation > 0) {
        console.log('📖 Step 2: Generating character truths...');
        progressTracker.updateProgress(taskId, 'truths', 'Creating character backstories and secrets...', 45);
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const { getGeminiApiKey, GEMINI_MODELS } = await import("./config/gemini.js");
          
          // Fetch all characters from the world
          const characters = await storage.getCharactersByWorld(worldId);
          
          if (characters.length > 0) {
            const worldContext = customPrompt || 
              `A ${worldType || 'medieval-fantasy'} world named "${worldName}". ${worldDescription || ''}`;
            
            // Limit to first 50 characters to avoid overwhelming the context window
            const charactersToProcess = characters.slice(0, 50);
            
            const truthsPrompt = `Generate interesting character truths (backstories, personality traits, secrets, relationships) for ${charactersToProcess.length} characters in ${worldContext}.

For each character, create 2-3 truths that include:
- A defining personality trait or quirk
- A secret or hidden aspect of their past
- A relationship truth or social connection

Return as a JSON array with this structure:
[
  {
    "characterIndex": 0,
    "truths": [
      {
        "title": "Brief truth title",
        "content": "1-2 sentence description",
        "entryType": "trait|secret|relationship|backstory",
        "importance": 1-10
      }
    ]
  }
]

Character list:
${charactersToProcess.map((c, i) => `${i}. ${c.firstName} ${c.lastName} (${c.gender}, age ${c.birthYear ? ((worldDescription?.match(/year (\d+)/)?.[1] || 1900) - c.birthYear) : 'unknown'})`).join('\n')}

Make truths fitting for the world's theme and each character's context.`;
            
            const genAI = new GoogleGenerativeAI(getGeminiApiKey()!);
            const model = genAI.getGenerativeModel({ 
              model: GEMINI_MODELS.PRO,
              generationConfig: {
                temperature: 0.95,
                responseMimeType: 'application/json',
              }
            });
            
            const result = await model.generateContent(truthsPrompt);
            const text = result.response.text().trim();
            const generatedTruths = JSON.parse(text);
            
            let numTruths = 0;
            
            // Parse and save truths
            if (Array.isArray(generatedTruths)) {
              for (const charTruths of generatedTruths) {
                const character = charactersToProcess[charTruths.characterIndex];
                if (character && Array.isArray(charTruths.truths)) {
                  for (const truth of charTruths.truths) {
                    if (truth.title && truth.content) {
                      await storage.createTruth({
                        worldId,
                        characterId: character.id,
                        title: truth.title,
                        content: truth.content,
                        entryType: truth.entryType || 'backstory',
                        importance: truth.importance || 5,
                        isPublic: false,
                        source: 'ai_generated',
                        tags: ['generated', 'ai'],
                      });
                      numTruths++;
                    }
                  }
                }
              }
            }
            
            console.log(`✅ Generated ${numTruths} character truths`);
            progressTracker.updateProgress(taskId, 'truths-complete', `Created ${numTruths} character truths`, 48);
          }
        } catch (error) {
          console.warn('⚠️ Character truth generation skipped:', (error as Error).message);
        }
      }

      // Step 3: Generate AI-powered rules if API key is available
      if (isGeminiConfigured()) {
        console.log('📜 Step 3: Generating social rules...');
            progressTracker.updateProgress(taskId, 'rules', 'Generating social rules and norms...', 55);
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const { getGeminiApiKey, GEMINI_MODELS } = await import("./config/gemini.js");
          
          const worldContext = customPrompt || 
            `A ${worldType || 'medieval-fantasy'} world named "${worldName}". ${worldDescription || ''}`;
          
          const rulesPrompt = `Generate 10 social rules and norms for ${worldContext}.

Include rules about:
- Social hierarchy and status
- Cultural customs and etiquette
- Taboos and forbidden actions
- Traditions and rituals
- Daily life expectations

Return as a JSON array with this structure:
[
  {
    "name": "Short descriptive rule name",
    "content": "The actual rule text in Insimul format",
    "ruleType": "social|cultural|legal|moral"
  }
]

Make the rule names creative and fitting for the world's theme. Example for cyberpunk: "Corporate Respect Protocol" or "Neural Privacy Laws"`;
          
          const genAI = new GoogleGenerativeAI(getGeminiApiKey()!);
          const model = genAI.getGenerativeModel({ 
            model: GEMINI_MODELS.PRO,
            generationConfig: {
              temperature: 0.9,
              responseMimeType: 'application/json',
            }
          });
          
          const result = await model.generateContent(rulesPrompt);
          const text = result.response.text().trim();
          const generatedRules = JSON.parse(text);
          
          // Parse and save rules
          if (Array.isArray(generatedRules)) {
            for (const rule of generatedRules.slice(0, 10)) {
              if (rule.name && rule.content) {
                await storage.createRule({
                  worldId,
                  name: rule.name,
                  content: rule.content,
                  systemType: 'insimul',
                  ruleType: rule.ruleType || 'default',
                  priority: 5,
                  conditions: [],
                  effects: [],
                  tags: ['generated', 'ai'],
                  isActive: true,
                });
                numRules++;
              }
            }
          }
          console.log(`✅ Generated ${numRules} rules`);
          progressTracker.updateProgress(taskId, 'rules-complete', `Generated ${numRules} social rules`, 65);
        } catch (error) {
          console.warn('⚠️ Rule generation skipped:', (error as Error).message);
        }
      }

      // Step 4: Generate AI-powered actions
      if (isGeminiConfigured()) {
        console.log('⚔️ Step 4: Generating actions...');
        progressTracker.updateProgress(taskId, 'actions', 'Generating character actions...', 75);
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const { getGeminiApiKey, GEMINI_MODELS } = await import("./config/gemini.js");
          
          const worldContext = customPrompt || 
            `A ${worldType || 'medieval-fantasy'} world named "${worldName}". ${worldDescription || ''}`;
          
          const actionsPrompt = `Generate 10 character actions for ${worldContext}.

Include diverse action types:
- Social interactions (talking, persuading, befriending)
- Physical actions (moving, working, fighting)
- Mental actions (thinking, planning, studying)
- Cultural actions specific to this world's theme

Return as a JSON array with this structure:
[
  {
    "name": "Creative action name fitting the world",
    "description": "What this action does and when it's used",
    "actionType": "social|combat|movement|mental|economic"
  }
]

Make the action names thematic and immersive. Example for cyberpunk: "Jack Into Matrix", "Corporate Negotiation", "Street Chase"`;
          
          const genAI = new GoogleGenerativeAI(getGeminiApiKey()!);
          const model = genAI.getGenerativeModel({ 
            model: GEMINI_MODELS.PRO,
            generationConfig: {
              temperature: 0.9,
              responseMimeType: 'application/json',
            }
          });
          
          const result = await model.generateContent(actionsPrompt);
          const text = result.response.text().trim();
          const generatedActions = JSON.parse(text);
          
          // Parse and save actions
          if (Array.isArray(generatedActions)) {
            for (const action of generatedActions.slice(0, 10)) {
              if (action.name && action.description) {
                await storage.createAction({
                  worldId,
                  name: action.name,
                  description: action.description,
                  actionType: action.actionType || 'social',
                  systemType: 'insimul',
                  prerequisites: [],
                  effects: [],
                  tags: ['generated', 'ai'],
                  isActive: true,
                });
                numActions++;
              }
            }
          }
          console.log(`✅ Generated ${numActions} actions`);
          progressTracker.updateProgress(taskId, 'actions-complete', `Generated ${numActions} actions`, 85);
        } catch (error) {
          console.warn('⚠️ Action generation skipped:', (error as Error).message);
        }
      }
      
      // Step 5: Generate AI-powered quests
      if (isGeminiConfigured()) {
        console.log('🎯 Step 5: Generating quests...');
        progressTracker.updateProgress(taskId, 'quests', 'Generating quest storylines...', 92);
        try {
          const { generateBulkRules } = await import("./gemini-ai.js");
          
          const worldContext = customPrompt || 
            `A ${worldType || 'medieval-fantasy'} world named "${worldName}". ${worldDescription || ''}`;
          
          const questsPrompt = `Generate quest ideas for ${worldContext}. Include main quests, side quests, and character-driven storylines. Format each as: "questName: description"`;
          
          const generatedQuests = await generateBulkRules(questsPrompt, 'insimul');
          
          // Parse and save quests
          if (typeof generatedQuests === 'string') {
            const questLines = generatedQuests.split('\n').filter(line => line.trim());
            for (const questLine of questLines.slice(0, 8)) {
              const match = questLine.match(/^([^:]+):\s*(.+)$/);
              if (match) {
                const [, title, description] = match;
                await storage.createQuest({
                  worldId,
                  title: title.trim(),
                  description: description.trim(),
                  questType: 'main',
                  difficulty: 'intermediate',
                  targetLanguage: 'English',
                  assignedTo: 'Player',
                  status: 'active',
                  objectives: [],
                  rewards: {},
                  tags: ['generated', 'ai'],
                });
                numQuests++;
              }
            }
          }
          console.log(`✅ Generated ${numQuests} quests`);
          progressTracker.updateProgress(taskId, 'quests-complete', `Generated ${numQuests} quests`, 95);
        } catch (error) {
          console.warn('⚠️ Quest generation skipped:', (error as Error).message);
        }
      }
      
      console.log(`🎉 Complete world generation finished!`);
          
          progressTracker.completeTask(taskId, `World generated! ${totalPopulation} characters, ${numRules} rules, ${numActions} actions, ${numQuests} quests`);
        } catch (error) {
          console.error("Complete world generation error:", error);
          progressTracker.failTask(taskId, error instanceof Error ? error.message : 'Unknown error');
        }
      })();
    } catch (error) {
      console.error("Failed to start world generation:", error);
      res.status(500).json({ error: "Failed to start world generation" });
    }
  });

  // World-centric Simulations routes
  app.get("/api/worlds/:worldId/simulations", async (req, res) => {
    try {
      const simulations = await storage.getSimulationsByWorld(req.params.worldId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch simulations" });
    }
  });

  app.post("/api/worlds/:worldId/simulations", async (req, res) => {
    try {
      // Ensure worldId is included in the data
      const simulationData = { ...req.body, worldId: req.params.worldId };
      const validatedData = insertSimulationSchema.parse(simulationData);
      const simulation = await storage.createSimulation(validatedData);
      res.status(201).json(simulation);
    } catch (error) {
      console.error("Failed to create simulation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid simulation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create simulation" });
    }
  });

  app.post("/api/simulations", async (req, res) => {
    try {
      const validatedData = insertSimulationSchema.parse(req.body);
      const simulation = await storage.createSimulation(validatedData);
      res.status(201).json(simulation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid simulation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create simulation" });
    }
  });

  // Insimul Engine API
  app.post("/api/simulations/:id/run", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }
      
      // Parse simulation parameters from request body
      const config = req.body || {};
      const {
        systemTypes = ["insimul"],
        maxRules = 12,
        maxEvents = 8,
        maxCharacters = 6,
        timeRange = { start: 0, end: 100, step: 1 },
        contentFocus = "all", // all, politics, romance, conflict, trade, magic
        executionSpeed = "normal", // fast, normal, detailed
        executionEngine = "default", // default, prolog
        worldId
      } = config;
      
      // Use worldId from config or fallback to simulation's worldId
      const targetWorldId = worldId || simulation.worldId;
      if (!targetWorldId) {
        return res.status(400).json({ error: "World ID is required" });
      }
      
      // Update simulation with new configuration
      await storage.updateSimulation(req.params.id, { 
        status: "running",
        systemTypes,
        config: {
          maxRules,
          maxEvents, 
          maxCharacters,
          timeRange,
          contentFocus,
          executionSpeed,
          executionEngine
        },
        worldId: targetWorldId
      });
      
      // Choose execution method based on engine type
      let results;
      let executionTimeMs = 0;
      const startTime = Date.now();
      
      if (executionEngine === "prolog") {
        // Use SWI Prolog engine - wrap in comprehensive try/catch
        try {
          const { InsimulSimulationEngine } = await import("./engines/unified-engine.js");
          const engine = new InsimulSimulationEngine(storage);

          // Get world and characters for simulation
          const world = await storage.getWorld(targetWorldId);
          const characters = await storage.getCharactersByWorld(targetWorldId);
          const rules = await storage.getRulesByWorld(targetWorldId);

          console.log(`Prolog simulation data check:`, {
            worldExists: !!world,
            targetWorldId,
            charactersCount: characters.length,
            rulesCount: rules.length,
            worldName: world?.name
          });

          if (world && characters.length > 0 && rules.length > 0) {
            // Load rules and grammars
            await engine.loadRules(targetWorldId);
            await engine.loadGrammars(targetWorldId);
            await engine.initializeContext(targetWorldId, simulation.id);

            // Execute simulation with Prolog engine
            const stepResults = await engine.executeStep(targetWorldId, simulation.id);
            executionTimeMs = Date.now() - startTime;
            
            results = {
              executionTime: executionTimeMs,
              rulesExecuted: rules.length,
              eventsGenerated: stepResults.events.length,
              charactersAffected: Math.min(characters.length, maxCharacters),
              narrative: stepResults.narratives.length > 0 ? stepResults.narratives.join('\n') : 'Prolog simulation completed.',
              // Add detailed results
              rulesExecutedList: rules.map((r: any) => r.name),
              eventsGeneratedList: stepResults.events.map((e: any) => e.type || 'Unknown event'),
              charactersAffectedList: characters.slice(0, maxCharacters).map((c: any) => c.firstName)
            };
          } else {
            // Provide meaningful fallback when data is insufficient
            executionTimeMs = Date.now() - startTime;
            results = {
              executionTime: executionTimeMs,
              rulesExecuted: rules?.length || 0,
              eventsGenerated: 0,
              charactersAffected: characters?.length || 0,
              narrative: `Insufficient data for Prolog simulation - World: ${world ? 'exists' : 'missing'}, Characters: ${characters.length}, Rules: ${rules.length}. Using default execution instead.`,
              rulesExecutedList: rules?.map((r: any) => r.name) || ['No rules available'],
              eventsGeneratedList: ['Fallback execution completed'],
              charactersAffectedList: (characters || []).map((c: any) => c.firstName || 'Unknown')
            };
          }
        } catch (error) {
          console.error('Prolog execution error:', error);
          // Fallback to default execution with guaranteed numeric values
          const characters = await storage.getCharactersByWorld(targetWorldId);
          const rules = await storage.getRulesByWorld(targetWorldId);
          executionTimeMs = Math.max(1, Date.now() - startTime); // Ensure positive number
          results = {
            executionTime: executionTimeMs,
            rulesExecuted: rules?.length || 0,
            eventsGenerated: 0,
            charactersAffected: Math.min(characters?.length || 0, maxCharacters),
            narrative: `Prolog execution failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using default execution instead.`,
            rulesExecutedList: rules?.map((r: any) => r.name) || ['No rules available'],
            eventsGeneratedList: ['Prolog fallback executed'],
            charactersAffectedList: (characters || []).slice(0, maxCharacters).map((c: any) => c.firstName || 'Unknown')
          };
        }
      } else {
        // Default execution using unified engine
        try {
          const { InsimulSimulationEngine } = await import("./engines/unified-engine.js");
          const engine = new InsimulSimulationEngine(storage);

          // Get world and characters for simulation
          const world = await storage.getWorld(targetWorldId);
          const characters = await storage.getCharactersByWorld(targetWorldId);
          const rules = await storage.getRulesByWorld(targetWorldId);

          if (world && rules.length > 0) {
            // Load rules and grammars
            await engine.loadRules(targetWorldId);
            await engine.loadGrammars(targetWorldId);
            await engine.initializeContext(targetWorldId, simulation.id);

            // Execute simulation with default engine
            const stepResults = await engine.executeStep(targetWorldId, simulation.id);
            executionTimeMs = Date.now() - startTime;

            // Convert Map to plain object for JSON serialization
            const characterSnapshotsObj: any = {};
            if (stepResults.characterSnapshots) {
              stepResults.characterSnapshots.forEach((timestepMap, timestep) => {
                characterSnapshotsObj[timestep] = {};
                timestepMap.forEach((snapshot, charId) => {
                  characterSnapshotsObj[timestep][charId] = snapshot;
                });
              });
            }

            results = {
              executionTime: executionTimeMs,
              rulesExecuted: stepResults.rulesExecuted.length,
              eventsGenerated: stepResults.events.length,
              charactersAffected: Math.min(characters.length, maxCharacters),
              narrative: stepResults.narratives.length > 0 ? stepResults.narratives.join('\n\n') : 'Simulation completed with no narrative output.',
              truthsCreated: stepResults.truthsCreated || [],
              ruleExecutionSequence: stepResults.ruleExecutionSequence || [],
              characterSnapshots: characterSnapshotsObj,
              rulesExecutedList: stepResults.rulesExecuted,
              eventsGeneratedList: stepResults.events.map((e: any) => e.description || e.type || 'Unknown event'),
              charactersAffectedList: characters.slice(0, maxCharacters).map((c: any) => c.firstName)
            };
          } else {
            // Fallback to mock execution if no rules
            const processingTime = executionSpeed === "fast" ? 500 :
              executionSpeed === "detailed" ? 2000 : 1000;
            await new Promise(resolve => setTimeout(resolve, processingTime));

            executionTimeMs = Date.now() - startTime;

            const rulesExecutedCount = 0;
            const eventsGeneratedCount = 1;
            const charactersAffectedCount = Math.min(characters?.length || 0, maxCharacters);
            const narrative = characters && characters.length > 0 ? generateNarrative(characters) : 'No characters available for simulation.';

            // Generate detailed results using actual data from the world
            const detailedResults = await generateDetailedResults(
              targetWorldId,
              rulesExecutedCount,
              eventsGeneratedCount,
              charactersAffectedCount
            );

            results = {
              executionTime: executionTimeMs,
              rulesExecuted: rulesExecutedCount,
              eventsGenerated: eventsGeneratedCount,
              charactersAffected: charactersAffectedCount,
              narrative: narrative,
              rulesExecutedList: detailedResults.rulesExecuted,
              eventsGeneratedList: detailedResults.eventsGenerated,
              charactersAffectedList: detailedResults.charactersAffected
            };
          }
        } catch (error) {
          console.error('Default execution error:', error);
          // Fallback to simple mock execution
          const processingTime = executionSpeed === "fast" ? 500 :
            executionSpeed === "detailed" ? 2000 : 1000;
          await new Promise(resolve => setTimeout(resolve, processingTime));

          executionTimeMs = Date.now() - startTime;
          const characters = await storage.getCharactersByWorld(targetWorldId);

          results = {
            executionTime: executionTimeMs,
            rulesExecuted: 0,
            eventsGenerated: 1,
            charactersAffected: Math.min(characters?.length || 0, maxCharacters),
            narrative: `Default execution failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback completed.`,
            rulesExecutedList: ['Execution error fallback'],
            eventsGeneratedList: ['Error during execution'],
            charactersAffectedList: (characters || []).slice(0, maxCharacters).map((c: any) => c.firstName || 'Unknown')
          };
        }
      }
      
      // Update simulation with results and completed status
      const updatedSimulation = await storage.updateSimulation(req.params.id, {
        status: "completed",
        results: results,
        executionTime: executionTimeMs,
        rulesExecuted: results.rulesExecuted || 0,
        eventsGenerated: results.eventsGenerated || 0,
        narrativeOutput: [results.narrative || 'Simulation completed.']
      });
      
      res.json({ 
        message: "Simulation completed successfully", 
        status: "completed",
        simulationId: simulation.id,
        results: results
      });
    } catch (error) {
      // Update status to failed if there's an error
      await storage.updateSimulation(req.params.id, { status: "failed" });
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  app.put("/api/simulations/:id", async (req, res) => {
    try {
      const validatedData = insertSimulationSchema.partial().parse(req.body);
      const simulation = await storage.updateSimulation(req.params.id, validatedData);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid simulation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update simulation" });
    }
  });

  // Rule validation and testing
  app.post("/api/rules/validate", async (req, res) => {
    try {
      const { content, systemType } = req.body;
      
      // Basic syntax validation based on system type
      const validation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
      } = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      if (!content || content.trim() === '') {
        validation.isValid = false;
        validation.errors.push("Rule content cannot be empty");
        return res.json(validation);
      }

      if (systemType === "insimul") {
        // Insimul syntax validation
        if (!content.includes("rule ")) {
          validation.isValid = false;
          validation.errors.push("Insimul rules must start with 'rule' keyword");
        }
        if (!content.includes("when (")) {
          validation.isValid = false;
          validation.errors.push("Insimul rules must have a 'when' clause");
        }
        if (!content.includes("then {")) {
          validation.isValid = false;
          validation.errors.push("Insimul rules must have a 'then' clause");
        }
        // Check for balanced braces
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          validation.isValid = false;
          validation.errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
        }
        // Check for balanced parentheses
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          validation.isValid = false;
          validation.errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
        }
        if (!content.includes("priority:") && !content.includes("priority :")) {
          validation.warnings.push("Consider adding a priority value for rule ordering");
        }
      } else if (systemType === "ensemble") {
        // Ensemble syntax validation
        if (!content.includes("rule ")) {
          validation.isValid = false;
          validation.errors.push("Ensemble rules must contain 'rule' keyword");
        }
        if (!content.includes("when (")) {
          validation.isValid = false;
          validation.errors.push("Ensemble rules must have a 'when' clause with conditions");
        }
        if (!content.includes("then {")) {
          validation.isValid = false;
          validation.errors.push("Ensemble rules must have a 'then' clause with effects");
        }
        // Check for Person predicate pattern
        if (!content.match(/Person\(\?[\w]+\)/)) {
          validation.warnings.push("Ensemble rules typically use Person(?variable) pattern");
        }
      } else if (systemType === "kismet") {
        // Kismet syntax validation (Prolog-based)
        if (!content.includes("trait ") && !content.includes(":-")) {
          validation.warnings.push("Kismet rules typically define traits or use Prolog syntax (:-) for predicates");
        }
        if (!content.includes(".")) {
          validation.isValid = false;
          validation.errors.push("Kismet rules must end with a period");
        }
        if (content.includes("trait ") && !content.includes("likelihood:")) {
          validation.warnings.push("Kismet traits should specify a likelihood value");
        }
        // Check for common Kismet patterns
        if (content.includes("+++") || content.includes("---")) {
          validation.suggestions.push("Good use of Kismet relationship modifiers (+++ or ---)");
        }
      } else if (systemType === "tott") {
        // Talk of the Town syntax validation
        if (!content.includes("rule ") && !content.includes("def ")) {
          validation.warnings.push("TotT rules typically use 'rule' or 'def' keywords");
        }
        if (content.includes("genealogy") || content.includes("family")) {
          validation.suggestions.push("Good use of TotT genealogy features");
        }
      }

      res.json(validation);
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ error: "Failed to validate rule" });
    }
  });

  app.post("/api/simulations/:id/run", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      // Update simulation status to running
      await storage.updateSimulation(req.params.id, { status: "running" });

      // Simulate processing time
      setTimeout(async () => {
        const results = {
          executionTime: Math.random() * 1000 + 500,
          rulesExecuted: Math.floor(Math.random() * 50) + 10,
          eventsGenerated: Math.floor(Math.random() * 20) + 5,
          charactersAffected: Math.floor(Math.random() * 15) + 3,
          narrative: "Lord Edmund Blackwater has passed away at the age of 67. His eldest son, Sir Richard Blackwater, will be crowned as the new Duke of Riverlands in a ceremony next month."
        };

        await storage.updateSimulation(req.params.id, { 
          status: "completed",
          results 
        });
      }, 2000);

      res.json({ message: "Simulation started", status: "running" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  // ============================================================
  // TTS/STT Endpoints (migrated from Python server.py)
  // ============================================================

  app.post("/api/tts", async (req, res) => {
    try {
      const { textToSpeech } = await import("./tts-stt.js");
      const { transcript, text, voice = "Kore", gender = "neutral" } = req.body;
      const textToConvert = transcript || text;

      console.log("TTS request received:", { text: textToConvert?.substring(0, 50), voice, gender, bodyKeys: Object.keys(req.body) });

      if (!textToConvert || textToConvert.trim() === '') {
        console.error("TTS error: No text provided. Body:", req.body);
        return res.status(400).json({ error: "No text provided" });
      }

      const audioBuffer = await textToSpeech(textToConvert, voice, gender);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate speech" });
    }
  });

  // Setup multer for file uploads
  const multer = (await import("multer")).default;
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/stt", upload.single('audio'), async (req, res) => {
    try {
      const { speechToText } = await import("./tts-stt.js");

      let audioBuffer: Buffer;
      let mimeType = 'audio/wav';

      // Handle file upload
      if (req.file) {
        audioBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
      }
      // Handle JSON with base64 audio
      else if (req.body.audio) {
        const { audio, mimeType: bodyMimeType = 'audio/wav' } = req.body;
        audioBuffer = Buffer.from(audio, 'base64');
        mimeType = bodyMimeType;
      } else {
        return res.status(400).json({ error: "No audio data provided" });
      }

      const transcript = await speechToText(audioBuffer, mimeType);

      res.json({ transcript });
    } catch (error) {
      console.error("STT error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to transcribe audio" });
    }
  });

  // Gemini Chat Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { systemPrompt, messages, temperature = 0.7, maxTokens = 1000 } = req.body;

      if (!isGeminiConfigured()) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const { getGeminiApiKey } = await import('./config/gemini.js');

      const genAI = new GoogleGenerativeAI(getGeminiApiKey()!);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODELS.PRO,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });

      // Build the conversation with system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will roleplay as this character.' }]
          },
          ...messages.slice(0, -1) // All messages except the last one
        ]
      });

      // Send the last message
      const lastMessage = messages[messages.length - 1];
      console.log("Sending to Gemini:", lastMessage.parts[0].text.substring(0, 100));
      
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      
      // Log the full response for debugging
      console.log("Gemini response object:", JSON.stringify(result.response, null, 2));
      
      const response = result.response.text();
      
      if (!response || response.trim() === '') {
        console.error("Gemini returned empty response. Candidates:", result.response.candidates);
        console.error("Prompt feedback:", result.response.promptFeedback);
        return res.status(500).json({ 
          error: "Gemini returned empty response. This may be due to safety filters.",
          details: {
            promptFeedback: result.response.promptFeedback,
            candidates: result.response.candidates
          }
        });
      }

      console.log("Gemini response:", response.substring(0, 100));
      res.json({ response });
    } catch (error) {
      console.error("Gemini chat error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get chat response" });
    }
  });

  app.get("/api/tts/get_available_voices", async (req, res) => {
    try {
      const { getAvailableVoices } = await import("./tts-stt.js");
      const voices = getAvailableVoices();
      res.json(voices);
    } catch (error) {
      res.status(500).json({ error: "Failed to get available voices" });
    }
  });

  // ============================================================
  // Character Interaction Endpoints (migrated from Python server.py)
  // ============================================================

  app.post("/api/character/getResponse", async (req, res) => {
    try {
      const { getCharacterResponse } = await import("./character-interaction.js");
      const { userQuery, charID } = req.body;

      if (!userQuery || !charID) {
        return res.status(400).json({ error: "Missing userQuery or charID" });
      }

      const result = await getCharacterResponse(userQuery, charID);
      res.json(result);
    } catch (error) {
      console.error("Character response error:", error);
      res.status(500).json({ error: "Failed to get character response" });
    }
  });

  app.post("/api/character/create", async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(validatedData);
      res.json({ charID: character.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create character" });
    }
  });

  app.post("/api/character/update", async (req, res) => {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing character ID" });
      }

      const validatedData = insertCharacterSchema.partial().parse(updateData);
      await storage.updateCharacter(id, validatedData);
      res.json({ STATUS: "SUCCESS" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  app.post("/api/character/get", async (req, res) => {
    try {
      const { charID } = req.body;
      if (!charID) {
        return res.status(400).json({ error: "Missing charID" });
      }

      const character = await storage.getCharacter(charID);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      res.json({
        charID: character.id,
        name: `${character.firstName} ${character.lastName || ''}`.trim(),
        ...character
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get character" });
    }
  });

  app.post("/api/character/list", async (req, res) => {
    try {
      const { worldId } = req.body;

      if (worldId) {
        const characters = await storage.getCharactersByWorld(worldId);
        res.json(characters.map(c => ({
          charID: c.id,
          name: `${c.firstName} ${c.lastName || ''}`.trim()
        })));
      } else {
        // Return all characters across all worlds
        const worlds = await storage.getWorlds();
        const allCharacters = [];
        for (const world of worlds) {
          const chars = await storage.getCharactersByWorld(world.id);
          allCharacters.push(...chars);
        }
        res.json(allCharacters.map(c => ({
          charID: c.id,
          name: `${c.firstName} ${c.lastName || ''}`.trim()
        })));
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to list characters" });
    }
  });

  app.post("/api/character/getActions", async (req, res) => {
    try {
      const { getCharacterActions } = await import("./character-interaction.js");
      const { charID } = req.body;

      if (!charID) {
        return res.status(400).json({ error: "Missing charID" });
      }

      const actions = await getCharacterActions(charID);
      res.json({ actions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get character actions" });
    }
  });

  app.post("/api/character/getActionResponse", async (req, res) => {
    try {
      const { getActionResponse } = await import("./character-interaction.js");
      const { charID, action, context } = req.body;

      if (!charID || !action) {
        return res.status(400).json({ error: "Missing charID or action" });
      }

      const actionResponse = await getActionResponse(charID, action, context);
      res.json({ actionResponse });
    } catch (error) {
      res.status(500).json({ error: "Failed to get action response" });
    }
  });

  app.post("/api/character/narrative/list-sections", async (req, res) => {
    try {
      const { listNarrativeSections } = await import("./character-interaction.js");
      const sections = listNarrativeSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "Failed to list narrative sections" });
    }
  });

  app.post("/api/character/narrative/list-triggers", async (req, res) => {
    try {
      const { listNarrativeTriggers } = await import("./character-interaction.js");
      const triggers = listNarrativeTriggers();
      res.json(triggers);
    } catch (error) {
      res.status(500).json({ error: "Failed to list narrative triggers" });
    }
  });

  // ============================================================
  // Experience Endpoints (migrated from Python server.py)
  // ============================================================

  app.post("/api/xp/experiences/update", async (req, res) => {
    try {
      // This would integrate with your experience/session tracking system
      // For now, return a success status
      res.json({ status: "updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update experience" });
    }
  });

  app.post("/api/xp/sessions/detail", async (req, res) => {
    try {
      // This would retrieve session details from your storage
      // For now, return mock data
      res.json({ session: "mock_session_detail" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session detail" });
    }
  });

  // ============================================================
  // Prolog Knowledge Base Management Endpoints
  // ============================================================

  app.get("/api/prolog/facts", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const worldId = req.query.worldId as string | undefined;

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      const facts = manager.getAllFacts();
      res.json({
        status: 'success',
        facts
      });
    } catch (error) {
      console.error("Error getting facts:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/facts", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { fact, worldId } = req.body;

      if (!fact) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing fact in request body'
        });
      }

      const trimmedFact = fact.trim();
      if (!trimmedFact) {
        return res.status(400).json({
          status: 'error',
          message: 'Fact cannot be empty'
        });
      }

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      // Add fact to knowledge base
      const result = await manager.addFact(trimmedFact);
      if (result) {
        return res.json({
          status: 'success',
          message: 'Fact added successfully',
          fact: trimmedFact
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to add fact - possibly malformed syntax'
        });
      }

    } catch (error) {
      console.error("Error adding fact:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/rules", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { rule, worldId } = req.body;

      if (!rule) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing rule in request body'
        });
      }

      const trimmedRule = rule.trim();
      if (!trimmedRule) {
        return res.status(400).json({
          status: 'error',
          message: 'Rule cannot be empty'
        });
      }

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      // Add rule to knowledge base
      const result = await manager.addRule(trimmedRule);
      if (result) {
        return res.json({
          status: 'success',
          message: 'Rule added successfully',
          rule: trimmedRule
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to add rule - possibly malformed syntax'
        });
      }

    } catch (error) {
      console.error("Error adding rule:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/query", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { query, worldId } = req.body;

      if (!query) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing query in request body'
        });
      }

      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return res.status(400).json({
          status: 'error',
          message: 'Query cannot be empty'
        });
      }

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      // Execute query
      const results = await manager.query(trimmedQuery);

      return res.json({
        status: 'success',
        query: trimmedQuery,
        results,
        count: results.length
      });

    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/clear", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { worldId } = req.body;

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      await manager.clearKnowledgeBase();
      res.json({
        status: 'success',
        message: 'Knowledge base cleared successfully'
      });
    } catch (error) {
      console.error("Error clearing knowledge base:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/save", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { worldId } = req.body;

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      await manager.saveToFile();
      res.json({
        status: 'success',
        message: 'Knowledge base saved successfully'
      });
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/load", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { worldId } = req.body;

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      await manager.loadFromFile();
      res.json({
        status: 'success',
        message: 'Knowledge base loaded successfully'
      });
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/prolog/export", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const worldId = req.query.worldId as string | undefined;

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      const content = manager.exportKnowledgeBase();
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${kbFile}"`);
      res.send(content);
    } catch (error) {
      console.error("Error exporting knowledge base:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/prolog/sync", async (req, res) => {
    try {
      const { createPrologSyncService } = await import("./prolog-sync.js");
      const { PrologManager } = await import("./prolog-manager.js");
      const { worldId } = req.body;

      if (!worldId) {
        return res.status(400).json({
          status: "error",
          message: "World ID is required"
        });
      }

      const kbFile = worldId ? `knowledge_base_${worldId}.pl` : 'knowledge_base.pl';
      const prologManager = new PrologManager(kbFile, worldId);
      await prologManager.initialize();

      const syncService = createPrologSyncService(storage, prologManager);
      
      // Clear existing facts before syncing
      await syncService.clearWorldFromProlog(worldId);
      
      // Sync all world data
      await syncService.syncWorldToProlog(worldId);

      res.json({
        status: "success",
        message: `World ${worldId} synced to Prolog knowledge base`,
        factsCount: prologManager.getAllFacts().length
      });
    } catch (error: any) {
      console.error('❌ Error syncing to Prolog:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to sync to Prolog",
        details: error.stack
      });
    }
  });

  app.post("/api/prolog/import", async (req, res) => {
    try {
      const { PrologManager } = await import("./prolog-manager.js");
      const { content, worldId } = req.body;

      if (!content) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing content in request body'
        });
      }

      // Create manager instance for this world (or use default)
      const kbFile = worldId
        ? `knowledge_base_${worldId}.pl`
        : 'knowledge_base.pl';
      const manager = new PrologManager(kbFile, worldId);
      await manager.initialize();

      await manager.importKnowledgeBase(content);
      res.json({
        status: 'success',
        message: 'Knowledge base imported successfully'
      });
    } catch (error) {
      console.error("Error importing knowledge base:", error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Actions
  app.get("/api/worlds/:worldId/actions", async (req, res) => {
    try {
      const actions = await storage.getActionsByWorld(req.params.worldId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.get("/api/worlds/:worldId/actions/type/:actionType", async (req, res) => {
    try {
      const actions = await storage.getActionsByType(req.params.worldId, req.params.actionType);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions by type" });
    }
  });

  app.get("/api/actions/:id", async (req, res) => {
    try {
      const action = await storage.getAction(req.params.id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch action" });
    }
  });

  app.post("/api/actions", async (req, res) => {
    try {
      const validatedData = insertActionSchema.parse(req.body);
      const action = await storage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      console.error("Failed to create action:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid action data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create action" });
    }
  });

  app.post("/api/worlds/:worldId/actions", async (req, res) => {
    try {
      const actionData = { ...req.body, worldId: req.params.worldId };
      const validatedData = insertActionSchema.parse(actionData);
      const action = await storage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      console.error("Failed to create action:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid action data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create action" });
    }
  });

  app.put("/api/actions/:id", async (req, res) => {
    try {
      const validatedData = insertActionSchema.partial().parse(req.body);
      const action = await storage.updateAction(req.params.id, validatedData);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid action data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update action" });
    }
  });

  app.delete("/api/actions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete action" });
    }
  });

  // Truths
  app.get("/api/worlds/:worldId/truth", async (req, res) => {
    try {
      const entries = await storage.getTruthsByWorld(req.params.worldId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Truths" });
    }
  });

  app.get("/api/characters/:characterId/truth", async (req, res) => {
    try {
      const entries = await storage.getTruthsByCharacter(req.params.characterId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch character truth" });
    }
  });

  app.get("/api/truth/:id", async (req, res) => {
    try {
      const entry = await storage.getTruth(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Truth entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch truth entry" });
    }
  });

  app.post("/api/worlds/:worldId/truth", async (req, res) => {
    try {
      const entryData = { ...req.body, worldId: req.params.worldId };
      const validatedData = insertTruthSchema.parse(entryData);
      const entry = await storage.createTruth(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to create truth entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid truth entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create truth entry" });
    }
  });

  app.post("/api/truth", async (req, res) => {
    try {
      const validatedData = insertTruthSchema.parse(req.body);
      const entry = await storage.createTruth(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid truth entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create truth entry" });
    }
  });

  app.put("/api/truth/:id", async (req, res) => {
    try {
      const validatedData = insertTruthSchema.partial().parse(req.body);
      const entry = await storage.updateTruth(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Truth entry not found" });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid truth entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update truth entry" });
    }
  });

  app.delete("/api/truth/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTruth(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Truth entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete truth entry" });
    }
  });

  // ============================================================
  // Quest Endpoints
  // ============================================================

  app.get("/api/worlds/:worldId/quests", async (req, res) => {
    try {
      const quests = await storage.getQuestsByWorld(req.params.worldId);
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quests" });
    }
  });

  app.get("/api/quests/player/:playerName", async (req, res) => {
    try {
      const quests = await storage.getQuestsByPlayer(req.params.playerName);
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch player quests" });
    }
  });

  app.get("/api/quests/character/:characterId", async (req, res) => {
    try {
      const quests = await storage.getQuestsByPlayerCharacterId(req.params.characterId);
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch character quests" });
    }
  });

  app.post("/api/worlds/:worldId/quests", async (req, res) => {
    try {
      const quest = await storage.createQuest({
        ...req.body,
        worldId: req.params.worldId,
      });
      res.status(201).json(quest);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quest" });
    }
  });

  app.put("/api/quests/:id", async (req, res) => {
    try {
      const quest = await storage.updateQuest(req.params.id, req.body);
      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }
      res.json(quest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quest" });
    }
  });

  app.delete("/api/quests/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteQuest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Quest not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quest" });
    }
  });

  // Ensemble truth file import
  app.post("/api/worlds/:worldId/truth/import-ensemble", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Missing truth file content" });
      }

      // Parse Ensemble truth format
      let truthData;
      try {
        truthData = JSON.parse(content);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON format" });
      }

      const importedEntries = [];

      // Handle Ensemble history format: { history: [{ pos: 0, data: [...] }] }
      if (truthData.history && Array.isArray(truthData.history)) {
        console.log(`Importing Ensemble history with ${truthData.history.length} timesteps`);
        
        // Fetch all characters in this world to match names
        const worldCharacters = await storage.getCharactersByWorld(req.params.worldId);
        console.log(`Found ${worldCharacters.length} characters in world for name matching`);
        
        // Create a map of character names to IDs (case-insensitive)
        const characterNameMap = new Map<string, string>();
        worldCharacters.forEach(char => {
          const fullName = `${char.firstName} ${char.lastName}`.toLowerCase();
          const firstName = char.firstName.toLowerCase();
          characterNameMap.set(fullName, char.id);
          characterNameMap.set(firstName, char.id);
        });
        
        for (const historyEntry of truthData.history) {
          const timestep = historyEntry.pos || 0;
          const dataItems = historyEntry.data || [];
          
          console.log(`Processing timestep ${timestep} with ${dataItems.length} items`);
          
          for (const item of dataItems) {
            // Try to find matching character IDs for both first and second
            let firstCharacterId: string | null = null;
            let secondCharacterId: string | null = null;
            
            if (item.first) {
              const firstNameLower = item.first.toLowerCase();
              firstCharacterId = characterNameMap.get(firstNameLower) || null;
              if (firstCharacterId) {
                console.log(`Matched character "${item.first}" to ID ${firstCharacterId}`);
              }
            }
            
            if (item.second) {
              const secondNameLower = item.second.toLowerCase();
              secondCharacterId = characterNameMap.get(secondNameLower) || null;
              if (secondCharacterId) {
                console.log(`Matched character "${item.second}" to ID ${secondCharacterId}`);
              }
            }
            
            // Build a descriptive title and content
            let title = "";
            let content = "";
            
            if (item.category === "trait") {
              title = `${item.type} trait`;
              content = `${item.first || 'Character'} has the ${item.type} trait (value: ${item.value})`;
            } else if (item.category === "relationship") {
              title = `${item.type} relationship`;
              content = `${item.first || 'Character 1'} and ${item.second || 'Character 2'} have a ${item.type} relationship (value: ${item.value})`;
            } else if (item.category === "status") {
              title = `Status: ${item.type}`;
              content = `${item.first || 'Character'} status: ${item.type} = ${item.value}`;
            } else if (item.category === "language") {
              title = `${item.type} fluency`;
              content = `${item.first || 'Character'} has ${item.value}/100 fluency in ${item.type}`;
            } else {
              title = `${item.category || 'Event'}: ${item.type || 'Unknown'}`;
              content = JSON.stringify(item, null, 2);
            }
            
            // Collect all related character IDs
            const relatedCharacterIds = [firstCharacterId, secondCharacterId].filter(Boolean) as string[];
            
            // For traits, status, and language: create entry for the subject (first) character
            if (item.category === "trait" || item.category === "status" || item.category === "language") {
              if (firstCharacterId) {
                const entry = await storage.createTruth({
                  worldId: req.params.worldId,
                  characterId: firstCharacterId,
                  title: title,
                  content: content,
                  entryType: item.category || "event",
                  timestep: timestep,
                  timestepDuration: 1,
                  timeYear: null,
                  timeSeason: null,
                  timeDescription: `Timestep ${timestep}`,
                  relatedCharacterIds: relatedCharacterIds.length > 0 ? relatedCharacterIds : null,
                  relatedLocationIds: null,
                  tags: [item.category, item.type].filter(Boolean),
                  importance: 5,
                  isPublic: true,
                  source: "imported_ensemble_history",
                  sourceData: item,
                });
                importedEntries.push(entry);
              }
            } 
            // For relationships: create entries for BOTH characters
            else if (item.category === "relationship") {
              // Create entry for first character
              if (firstCharacterId) {
                const entry1 = await storage.createTruth({
                  worldId: req.params.worldId,
                  characterId: firstCharacterId,
                  title: title,
                  content: content,
                  entryType: item.category || "event",
                  timestep: timestep,
                  timestepDuration: 1,
                  timeYear: null,
                  timeSeason: null,
                  timeDescription: `Timestep ${timestep}`,
                  relatedCharacterIds: relatedCharacterIds.length > 0 ? relatedCharacterIds : null,
                  relatedLocationIds: null,
                  tags: [item.category, item.type].filter(Boolean),
                  importance: 5,
                  isPublic: true,
                  source: "imported_ensemble_history",
                  sourceData: item,
                });
                importedEntries.push(entry1);
              }
              
              // Create entry for second character
              if (secondCharacterId) {
                const entry2 = await storage.createTruth({
                  worldId: req.params.worldId,
                  characterId: secondCharacterId,
                  title: title,
                  content: content,
                  entryType: item.category || "event",
                  timestep: timestep,
                  timestepDuration: 1,
                  timeYear: null,
                  timeSeason: null,
                  timeDescription: `Timestep ${timestep}`,
                  relatedCharacterIds: relatedCharacterIds.length > 0 ? relatedCharacterIds : null,
                  relatedLocationIds: null,
                  tags: [item.category, item.type].filter(Boolean),
                  importance: 5,
                  isPublic: true,
                  source: "imported_ensemble_history",
                  sourceData: item,
                });
                importedEntries.push(entry2);
              }
            }
            // For other categories: create a single world-level entry
            else {
              const entry = await storage.createTruth({
                worldId: req.params.worldId,
                characterId: firstCharacterId, // Use first character if available
                title: title,
                content: content,
                entryType: item.category || "event",
                timestep: timestep,
                timestepDuration: 1,
                timeYear: null,
                timeSeason: null,
                timeDescription: `Timestep ${timestep}`,
                relatedCharacterIds: relatedCharacterIds.length > 0 ? relatedCharacterIds : null,
                relatedLocationIds: null,
                tags: [item.category, item.type].filter(Boolean),
                importance: 5,
                isPublic: true,
                source: "imported_ensemble_history",
                sourceData: item,
              });
              importedEntries.push(entry);
            }
          }
        }
      } 
      // Handle direct array format (legacy or custom)
      else if (Array.isArray(truthData)) {
        console.log(`Importing direct array with ${truthData.length} items`);
        
        for (const item of truthData) {
          const entry = await storage.createTruth({
            worldId: req.params.worldId,
            characterId: item.characterId || null,
            title: item.title || item.name || "Untitled Event",
            content: item.content || item.description || "",
            entryType: item.type || "event",
            timestep: item.timestep || 0,
            timestepDuration: item.timestepDuration || null,
            timeYear: item.year || null,
            timeSeason: item.season || null,
            timeDescription: item.timeDescription || null,
            relatedCharacterIds: item.relatedCharacters || [],
            relatedLocationIds: item.relatedLocations || [],
            tags: item.tags || [],
            importance: item.importance || 5,
            isPublic: item.isPublic !== false,
            source: "imported_ensemble",
            sourceData: item,
          });
          importedEntries.push(entry);
        }
      } else {
        return res.status(400).json({ error: "Unrecognized truth data format" });
      }

      console.log(`Successfully imported ${importedEntries.length} Truths`);

      res.json({
        message: "Truth imported successfully",
        count: importedEntries.length,
        entries: importedEntries,
      });
    } catch (error) {
      console.error("Failed to import Ensemble truth:", error);
      res.status(500).json({ error: "Failed to import truth" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
