/**
 * Insimul Server - MongoDB Edition
 * Handles database initialization, seeding, and API routes
 */

// CRITICAL: Load environment variables FIRST, before any other imports
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { MongoSimpleInitializer } from "./seed/mongo-init-simple";
import { storage } from "./db/storage";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (support both .env and prod.env)
const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'production' ? '../prod.env' : '../.env');
const envPath = path.resolve(__dirname, envFile);
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

// Debug: Verify MONGO_URL is loaded
console.log("Environment loaded. MONGO_URL:", process.env.MONGO_URL ? "✓ Set" : "✗ Not set");

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  initializeDb: args.includes('--init') || args.includes('--initialize'),
  resetDb: args.includes('--reset'),
  seedSampleWorld: args.includes('--seed'),
  showHelp: args.includes('--help')
};

// Show help if requested
if (options.showHelp) {
  console.log(`
Insimul Server - Talk of the Town Integration (MongoDB)

Usage: npm run dev [options]

Options:
  --init, --initialize    Initialize database
  --reset                 Reset database (delete all data)
  --seed                  Seed with sample Talk of the Town world
  --help                 Show this help message

Environment Variables:
  MONGO_URL              MongoDB connection string
  PORT                   Server port (default: 8000)
  AUTO_INIT              Auto-initialize if database is empty (default: true)
  AUTO_SEED              Auto-seed sample world if initializing (default: true)
  NODE_ENV               Environment (development/production)

Examples:
  npm run dev                    Start normally (auto-init if needed)
  npm run dev -- --reset --seed  Reset database and seed sample world
  `);
  process.exit(0);
}

const app = express();
const dbInitializer = new MongoSimpleInitializer();
let activeWorldId: string | null = null;
let httpServer: any = null;

// Increase payload size limit for importing large files and world data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Initialize database based on options and environment
 */
async function initializeDatabase(): Promise<void> {
  console.log('🚀 Starting Insimul Server with MongoDB...');
  
  const autoInit = process.env.AUTO_INIT !== 'false';
  const autoSeed = process.env.AUTO_SEED !== 'false';
  
  const shouldReset = options.resetDb;
  const shouldInit = options.initializeDb || autoInit;
  const shouldSeed = options.seedSampleWorld !== false && autoSeed;
  
  try {
    // Wait for MongoDB connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isInitialized = await dbInitializer.isInitialized();
    
    if (shouldReset) {
      console.log('⚠️  Resetting database as requested...');
      activeWorldId = await dbInitializer.initialize({
        reset: true,
        seed: shouldSeed
      });
    } else if (!isInitialized && shouldInit) {
      console.log('📦 Database not initialized. Setting up...');
      activeWorldId = await dbInitializer.initialize({
        reset: false,
        seed: shouldSeed
      });
    } else if (isInitialized) {
      console.log('✅ Database already initialized');
      
      const worlds = await storage.getWorlds();
      if (worlds.length > 0) {
        activeWorldId = worlds[0].id;
        console.log(`📍 Using existing world: ${worlds[0].name} (${activeWorldId})`);
      }
    }
    
    await printDatabaseSummary();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Print database summary
 */
async function printDatabaseSummary(): Promise<void> {
  try {
    const worlds = await storage.getWorlds();
    
    if (worlds.length === 0) {
      console.log('\\n📊 Database Summary:');
      console.log('   No worlds found. Use --seed to create a sample world.');
      return;
    }
    
    console.log('\\n📊 Database Summary:');
    console.log(`   Worlds: ${worlds.length}`);
    
    for (const world of worlds.slice(0, 3)) {
      console.log(`\\n   🌍 ${world.name}`);
      console.log(`      ID: ${world.id}`);
      
      const characters = await storage.getCharactersByWorld(world.id);
      const rules = await storage.getRulesByWorld(world.id);
      console.log(`      Characters: ${characters.length}`);
      console.log(`      Rules: ${rules.length}`);
    }
  } catch (error) {
    console.error('Could not retrieve database summary:', error);
  }
}

/**
 * Get all registered routes from Express app
 */
function getRegisteredRoutes(app: any): Array<{ method: string; path: string }> {
  const routes: Array<{ method: string; path: string }> = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      
      methods.forEach(method => {
        routes.push({ method, path: middleware.route.path });
      });
    } else if (middleware.name === 'router') {
      // Routes registered on a Router
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .map(method => method.toUpperCase());
          
          methods.forEach(method => {
            routes.push({ method, path: handler.route.path });
          });
        }
      });
    }
  });
  
  return routes;
}

/**
 * Log all endpoints organized by category
 */
function logEndpoints(app: any, port: number): void {
  const routes = getRegisteredRoutes(app);
  
  // Define categories in display order
  const categories: Record<string, Array<{ method: string; path: string }>> = {
    '🗄️  Database Management': [],
    '🌍 Worlds & Geography': [],
    '👥 Characters': [],
    '📜 Rules & Actions': [],
    '🎯 Quests': [],
    '📖 Truth & History': [],
    '🎨 Grammars': [],
    '🤖 AI Generation': [],
    '🗣️  Speech (TTS/STT)': [],
    '💼 Businesses': [],
    '🏘️  Community': [],
    '💬 Conversations': [],
    '💰 Economy': [],
    '📅 Events': [],
    '📁 Files': [],
    '🧠 Knowledge': [],
    '🔍 Predicates': [],
    '⚙️  Prolog': [],
    '🤝 Relationships': [],
    '🏠 Residences': [],
    '⭐ Salience': [],
    '👫 Social': [],
    '✅ Validation': [],
    '🎓 Experience (XP)': [],
    '🔧 Utilities': [],
    '🎮 Simulation': [],
    '📝 Other': []
  };
  
  // Categorize routes based on path patterns
  routes.forEach(route => {
    const path = route.path;
    
    if (path.includes('/database')) {
      categories['🗄️  Database Management'].push(route);
    } else if (path.includes('/speech') || path.includes('/tts') || path.includes('/stt')) {
      categories['🗣️  Speech (TTS/STT)'].push(route);
    } else if (path.includes('/business')) {
      categories['💼 Businesses'].push(route);
    } else if (path.includes('/community')) {
      categories['🏘️  Community'].push(route);
    } else if (path.includes('/conversation')) {
      categories['💬 Conversations'].push(route);
    } else if (path.includes('/econom')) {
      categories['💰 Economy'].push(route);
    } else if (path.includes('/event')) {
      categories['📅 Events'].push(route);
    } else if (path.includes('/file')) {
      categories['📁 Files'].push(route);
    } else if (path.includes('/knowledge')) {
      categories['🧠 Knowledge'].push(route);
    } else if (path.includes('/predicate')) {
      categories['🔍 Predicates'].push(route);
    } else if (path.includes('/prolog')) {
      categories['⚙️  Prolog'].push(route);
    } else if (path.includes('/relationship')) {
      categories['🤝 Relationships'].push(route);
    } else if (path.includes('/residence')) {
      categories['🏠 Residences'].push(route);
    } else if (path.includes('/salience')) {
      categories['⭐ Salience'].push(route);
    } else if (path.includes('/social')) {
      categories['👫 Social'].push(route);
    } else if (path.includes('/validat')) {
      categories['✅ Validation'].push(route);
    } else if (path.includes('/xp')) {
      categories['🎓 Experience (XP)'].push(route);
    } else if (path.includes('/world') || path.includes('/countries') || 
               path.includes('/states') || path.includes('/settlements')) {
      categories['🌍 Worlds & Geography'].push(route);
    } else if (path.includes('/character')) {
      categories['👥 Characters'].push(route);
    } else if (path.includes('/rule') || path.includes('/action') || path.includes('/base-')) {
      categories['📜 Rules & Actions'].push(route);
    } else if (path.includes('/quest')) {
      categories['🎯 Quests'].push(route);
    } else if (path.includes('/truth')) {
      categories['📖 Truth & History'].push(route);
    } else if (path.includes('/grammar')) {
      categories['🎨 Grammars'].push(route);
    } else if (path.includes('/generate') || path.includes('/edit-rule')) {
      categories['🤖 AI Generation'].push(route);
    } else if (path.includes('/simulation') || path.includes('/execute')) {
      categories['🎮 Simulation'].push(route);
    } else if (path.includes('/health') || path.includes('/progress')) {
      categories['🔧 Utilities'].push(route);
    } else if (path !== '*') {
      categories['📝 Other'].push(route);
    }
  });
  
  console.log('\n📡 API Endpoints:');
  
  // Only show categories that have routes
  Object.entries(categories).forEach(([category, routes]) => {
    if (routes.length > 0) {
      console.log(`\n   ${category} (${routes.length}):`);
      routes
        .sort((a, b) => a.path.localeCompare(b.path))
        .forEach(route => {
          console.log(`      ${route.method.padEnd(6)} ${route.path}`);
        });
    }
  });
  
  console.log(`\n   📊 Total: ${routes.filter(r => r.path !== '*').length} endpoints`);
  console.log(`   🌐 Base URL: http://localhost:${port}`);
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\\n🛑 Received ${signal}, shutting down gracefully...`);

  // Stop job queue manager
  try {
    const { jobQueueManager } = await import('./services/job-queue-manager.js');
    jobQueueManager.stop();
    console.log('✅ Job queue manager stopped');
  } catch (error) {
    console.error('Error stopping job queue manager:', error);
  }

  if (httpServer && httpServer.listening) {
    try {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ HTTP server closed');
    } catch (error) {
      console.error('Error closing HTTP server:', error);
    }
  }

  try {
    await storage.disconnect();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }

  console.log('👋 Shutdown complete');
  process.exit(0);
}

// Handle process signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await shutdown('uncaughtException');
});
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await shutdown('unhandledRejection');
});

/**
 * Main server startup
 */
(async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start job queue manager
    console.log('🔄 Starting job queue manager...');
    const { jobQueueManager } = await import('./services/job-queue-manager.js');
    jobQueueManager.start();
    console.log('✅ Job queue manager started');

    // Register API routes
    const server = await registerRoutes(app);
    httpServer = server;
    
    // Additional database management endpoints
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        database: 'mongodb',
        worldId: activeWorldId,
        timestamp: new Date()
      });
    });
    
    app.post('/api/database/initialize', async (req, res) => {
      try {
        const { reset, seed } = req.body;
        const worldId = await dbInitializer.initialize({
          reset: reset || false,
          seed: seed !== false
        });
        
        if (worldId) activeWorldId = worldId;
        
        res.json({ 
          success: true,
          worldId,
          message: 'Database initialized successfully'
        });
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: (error as Error).message 
        });
      }
    });
    
    app.post('/api/database/reset', async (req, res) => {
      try {
        await dbInitializer.resetDatabase();
        activeWorldId = null;
        
        res.json({ 
          success: true,
          message: 'Database reset successfully'
        });
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: (error as Error).message 
        });
      }
    });
    
    app.post('/api/database/seed', async (req, res) => {
      try {
        const worldId = await dbInitializer.seedSampleWorld();
        activeWorldId = worldId;
        
        res.json({ 
          success: true,
          worldId,
          message: 'Sample world seeded successfully'
        });
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: (error as Error).message 
        });
      }
    });
    
    app.post('/api/world/:id/activate', async (req, res) => {
      try {
        const world = await storage.getWorld(req.params.id);
        if (!world) {
          return res.status(404).json({ error: 'World not found' });
        }
        
        activeWorldId = world.id;
        res.json({ 
          success: true,
          worldId: activeWorldId,
          message: `Activated world: ${world.name}`
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || '8000', 10);
    server.listen(port, "0.0.0.0", () => {
      console.log(`\n🎮 Insimul Server running on port ${port}`);
      console.log(`   Health check: http://localhost:${port}/health`);
      
      if (activeWorldId) {
        console.log(`\n🌍 Active World ID: ${activeWorldId}`);
      }
      
      logEndpoints(app, port);
    });
    
    // Handle port already in use
    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${port} is already in use.`);
        console.error(`   Try: lsof -ti:${port} | xargs kill -9`);
      } else {
        console.error('❌ Server error:', error);
      }
      await storage.disconnect();
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    await storage.disconnect();
    process.exit(1);
  }
})();
