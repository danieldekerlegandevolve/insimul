import {
  type Language,
  type InsertLanguage,
  type ChatMessage,
  type InsertChatMessage,
  languages,
  chatMessages,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Language operations
  getAllLanguages(): Promise<Language[]>;
  getLanguage(id: string): Promise<Language | undefined>;
  createLanguage(language: Omit<Language, "id" | "createdAt">): Promise<Language>;
  getChildLanguages(parentId: string): Promise<Language[]>;

  // Chat operations
  getChatMessages(languageId: string): Promise<ChatMessage[]>;
  createChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Language operations
  async getAllLanguages(): Promise<Language[]> {
    return await db.select().from(languages).orderBy(desc(languages.createdAt));
  }

  async getLanguage(id: string): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.id, id));
    return language || undefined;
  }

  async createLanguage(language: Omit<Language, "id" | "createdAt">): Promise<Language> {
    const [newLanguage] = await db
      .insert(languages)
      .values(language)
      .returning();
    return newLanguage;
  }

  async getChildLanguages(parentId: string): Promise<Language[]> {
    return await db
      .select()
      .from(languages)
      .where(eq(languages.parentId, parentId))
      .orderBy(desc(languages.createdAt));
  }

  // Chat operations
  async getChatMessages(languageId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.languageId, languageId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
