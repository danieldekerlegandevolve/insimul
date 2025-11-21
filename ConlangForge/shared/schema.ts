import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Language table - represents a constructed language
export const languages = pgTable("languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  influences: text("influences").array().notNull(), // Natural language influences
  parentId: varchar("parent_id"), // For language genealogy
  
  // Generated linguistic components
  phonology: jsonb("phonology").$type<{
    consonants: string[];
    vowels: string[];
    syllableStructure: string;
    stressPattern: string;
    phoneticNotes: string;
    evolutionRules?: Array<{
      rule: string;
      description: string;
      examples: Array<{ parent: string; child: string; meaning: string }>;
    }>;
  }>().notNull(),
  
  grammar: jsonb("grammar").$type<{
    wordOrder: string;
    nounCases: string[];
    verbTenses: string[];
    articles: string;
    pluralization: string;
    pronouns: Record<string, string>;
    rules: Array<{ title: string; description: string; examples: string[] }>;
    conjugations?: Array<{
      verb: string;
      translation: string;
      forms: Array<{
        tense: string;
        person: string;
        number: string;
        form: string;
      }>;
    }>;
    declensions?: Array<{
      noun: string;
      translation: string;
      gender?: string;
      forms: Array<{
        case: string;
        number: string;
        form: string;
      }>;
    }>;
  }>().notNull(),
  
  syntax: jsonb("syntax").$type<{
    sentenceStructure: string;
    questionFormation: string;
    negation: string;
    subordination: string;
    patterns: Array<{ pattern: string; description: string; example: string }>;
  }>().notNull(),
  
  vocabulary: jsonb("vocabulary").$type<Array<{
    word: string;
    translation: string;
    partOfSpeech: string;
    etymology?: string;
    pronunciation?: string;
  }>>().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages for language-aware conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  languageId: varchar("language_id").notNull().references(() => languages.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  inConlang: text("in_conlang"), // Message translated to the conlang
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  createdAt: true,
  phonology: true,
  grammar: true,
  syntax: true,
  vocabulary: true,
}).extend({
  // For creation, we only need these fields
  name: z.string().min(1, "Language name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  influences: z.array(z.string()).min(1, "Select at least one influence"),
  parentId: z.string().optional(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  languageId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  inConlang: z.string().optional(),
});

// Types
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Additional types for API responses
export type LanguageWithChildren = Language & {
  children?: Language[];
  parent?: Language;
};

export type GenerateLanguageRequest = {
  name: string;
  description: string;
  influences: string[];
  parentId?: string;
};

export type ChatRequest = {
  languageId: string;
  message: string;
};

export type ChatResponse = {
  message: ChatMessage;
  translation?: string;
};
