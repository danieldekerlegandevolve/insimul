import type { Express } from "express";
import { storage } from '../db/storage';
import { AuthService } from "../services/auth-service";

export function registerAuthRoutes(app: Express) {
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        passwordHash,
        displayName: displayName || username,
        isActive: true,
        isVerified: false,
      });

      // Generate token
      const token = AuthService.generateToken(user);

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await AuthService.comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Generate token
      const token = AuthService.generateToken(user);

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Verify token
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const token = AuthService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Get fresh user data
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Verify error:", error);
      res.status(500).json({ message: "Failed to verify token" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = AuthService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // ===== PLAYER PROGRESS ROUTES =====

  // Get player progress for a world
  app.get("/api/worlds/:worldId/progress", async (req, res) => {
    try {
      const token = AuthService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const progress = await storage.getPlayerProgressByUser(payload.userId, req.params.worldId);
      res.json(progress || null);
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ message: "Failed to get player progress" });
    }
  });

  // Create or update player progress
  app.post("/api/worlds/:worldId/progress", async (req, res) => {
    try {
      const token = AuthService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if progress already exists
      const existing = await storage.getPlayerProgressByUser(payload.userId, req.params.worldId);

      if (existing) {
        // Update existing progress
        const updated = await storage.updatePlayerProgress(existing.id, req.body);
        res.json(updated);
      } else {
        // Create new progress
        const progress = await storage.createPlayerProgress({
          userId: payload.userId,
          worldId: req.params.worldId,
          ...req.body,
        });
        res.status(201).json(progress);
      }
    } catch (error) {
      console.error("Save progress error:", error);
      res.status(500).json({ message: "Failed to save player progress" });
    }
  });

  // Start a new play session
  app.post("/api/worlds/:worldId/sessions/start", async (req, res) => {
    try {
      const token = AuthService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Get or create progress
      let progress = await storage.getPlayerProgressByUser(payload.userId, req.params.worldId);
      if (!progress) {
        progress = await storage.createPlayerProgress({
          userId: payload.userId,
          worldId: req.params.worldId,
        });
      }

      // Create session
      const session = await storage.createPlayerSession({
        userId: payload.userId,
        worldId: req.params.worldId,
        progressId: progress.id,
      });

      // Update progress session count
      await storage.updatePlayerProgress(progress.id, {
        sessionsCount: (progress.sessionsCount || 0) + 1,
        lastPlayedAt: new Date(),
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Start session error:", error);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  // End a play session
  app.post("/api/sessions/:sessionId/end", async (req, res) => {
    try {
      const { duration } = req.body;
      const session = await storage.endPlayerSession(req.params.sessionId, duration || 0);
      res.json(session);
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // Get achievements for a world
  app.get("/api/worlds/:worldId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByWorld(req.params.worldId);
      const globalAchievements = await storage.getGlobalAchievements();
      res.json([...achievements, ...globalAchievements]);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });
}
