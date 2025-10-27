/**
 * MongoDB Server Startup with Database Initialization
 * Handles database setup and seeding on server start
 */

import express, { type Express } from 'express';
import { MongoSimpleInitializer } from './database/mongo-init-simple';
import { storage } from './storage';
import { config } from 'dotenv';
import { setupVite, serveStatic, log } from './vite';
import { registerRoutes } from './routes';

// Load environment variables (defaults to .env, or specify custom path)
config({ path: process.env.ENV_FILE || '.env' });

interface StartupOptions {
  initializeDb?: boolean;
  resetDb?: boolean;
  seedSampleWorld?: boolean;
  port?: number;
}

export class InsimulMongoServer {
  private app: Express;
  private port: number;
  private worldId: string | null = null;
  private httpServer: any = null;
  private dbInitializer: MongoSimpleInitializer;
  
  constructor(options: StartupOptions = {}) {
    this.app = express();
    this.port = options.port || parseInt(process.env.PORT || '3000');
    this.dbInitializer = new MongoSimpleInitializer();
    
    // Parse command line arguments
    this.parseCommandLineArgs(options);
  }
  
  /**
   * Parse command line arguments for startup options
   */
  private parseCommandLineArgs(options: StartupOptions): void {
    const args = process.argv.slice(2);
    
    args.forEach(arg => {
      switch(arg) {
        case '--init':
        case '--initialize':
          options.initializeDb = true;
          break;
        case '--reset':
          options.resetDb = true;
          break;
        case '--seed':
          options.seedSampleWorld = true;
          break;
        case '--help':
          this.printHelp();
          process.exit(0);
      }
    });
  }
  
  /**
   * Print help message
   */
  private printHelp(): void {
    console.log(`
Insimul Server - Talk of the Town Integration (MongoDB)

Usage: npm start [options]

Options:
  --init, --initialize    Initialize database
  --reset                 Reset database (delete all data)
  --seed                  Seed with sample Talk of the Town world
  --help                 Show this help message

Environment Variables:
  MONGO_URL              MongoDB connection string
  PORT                   Server port (default: 3000)
  AUTO_INIT             Auto-initialize if database is empty (default: true)
  AUTO_SEED             Auto-seed sample world if initializing (default: true)

Examples:
  npm start              Start normally (auto-init if needed)
  npm start --reset --seed    Reset database and seed sample world
    `);
  }
  
  /**
   * Initialize database based on options
   */
  async initializeDatabase(options: StartupOptions): Promise<void> {
    console.log('🚀 Starting Insimul Server with MongoDB...');
    
    // Check environment variables
    const autoInit = process.env.AUTO_INIT !== 'false';
    const autoSeed = process.env.AUTO_SEED !== 'false';
    
    // Determine what to do
    const shouldReset = options.resetDb || false;
    const shouldInit = options.initializeDb || autoInit;
    const shouldSeed = options.seedSampleWorld !== false && autoSeed;
    
    try {
      // Wait for MongoDB connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if database is initialized
      const isInitialized = await this.dbInitializer.isInitialized();
      
      if (shouldReset) {
        console.log('⚠️  Resetting database as requested...');
        this.worldId = await this.dbInitializer.initialize({
          reset: true,
          seed: shouldSeed
        });
      } else if (!isInitialized && shouldInit) {
        console.log('📦 Database not initialized. Setting up...');
        this.worldId = await this.dbInitializer.initialize({
          reset: false,
          seed: shouldSeed
        });
      } else if (isInitialized) {
        console.log('✅ Database already initialized');
        
        // Get existing world
        const worlds = await storage.getWorlds();
        if (worlds.length > 0) {
          this.worldId = worlds[0].id;
          console.log(`📍 Using existing world: ${worlds[0].name} (${this.worldId})`);
        }
      }
      
      // Print summary
      await this.printDatabaseSummary();
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Print database summary
   */
  private async printDatabaseSummary(): Promise<void> {
    try {
      const worlds = await storage.getWorlds();
      
      if (worlds.length === 0) {
        console.log('\n📊 Database Summary:');
        console.log('   No worlds found. Use --seed to create a sample world.');
        return;
      }
      
      console.log('\n📊 Database Summary:');
      console.log(`   Worlds: ${worlds.length}`);
      
      for (const world of worlds) {
        const config = world.config || {};
        console.log(`\n   🌍 ${world.name}`);
        console.log(`      ID: ${world.id}`);
        console.log(`      Description: ${world.description || 'No description'}`);
        
        // Get actual character count instead of static population field
        const characters = await storage.getCharactersByWorld(world.id);
        const rules = await storage.getRulesByWorld(world.id);
        console.log(`      Characters: ${characters.length}`);
        
        console.log(`      Rules: ${rules.length}`);
        
        if (world.currentYear) {
          console.log(`      Current Date: ${config.currentMonth || 1}/${config.currentDay || 1}/${world.currentYear}`);
          console.log(`      Time of Day: ${config.timeOfDay || 'day'}`);
        }
        
        if (config.businesses) {
          console.log(`      Businesses: ${config.businesses.length}`);
        }
        
        if (config.residences) {
          console.log(`      Residences: ${config.residences.length}`);
        }
      }
    } catch (error) {
      console.error('Could not retrieve database summary:', error);
    }
  }
  
  /**
   * Setup Express routes
   */
  private async setupRoutes(): Promise<any> {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    
    // Register API routes
    const server = await registerRoutes(this.app);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        database: 'mongodb',
        worldId: this.worldId,
        timestamp: new Date()
      });
    });
    
    // Get world info
    this.app.get('/api/world', async (req, res) => {
      if (!this.worldId) {
        return res.status(404).json({ error: 'No world loaded' });
      }
      
      try {
        const world = await storage.getWorld(this.worldId);
        const characters = await storage.getCharactersByWorld(this.worldId);
        const rules = await storage.getRulesByWorld(this.worldId);
        
        res.json({
          world,
          statistics: {
            characters: characters.length,
            rules: rules.length,
            businesses: world?.config?.businesses?.length || 0,
            residences: world?.config?.residences?.length || 0
          }
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    // List all worlds with actual character counts
    this.app.get('/api/worlds', async (req, res) => {
      try {
        const worlds = await storage.getWorlds();
        
        // Add actual character count for each world
        const worldsWithCounts = await Promise.all(
          worlds.map(async (world) => {
            const characters = await storage.getCharactersByWorld(world.id);
            const characterCount = characters.filter(c => c.isAlive !== false).length;
            
            // Replace static population with actual character count
            return {
              ...world,
              population: characterCount
            };
          })
        );
        
        res.json(worldsWithCounts);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    // Initialize database endpoint
    this.app.post('/api/database/initialize', async (req, res) => {
      try {
        const { reset, seed } = req.body;
        
        const worldId = await this.dbInitializer.initialize({
          reset: reset || false,
          seed: seed !== false
        });
        
        if (worldId) {
          this.worldId = worldId;
        }
        
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
    
    // Reset database endpoint
    this.app.post('/api/database/reset', async (req, res) => {
      try {
        await this.dbInitializer.resetDatabase();
        this.worldId = null;
        
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
    
    // Seed sample world endpoint
    this.app.post('/api/database/seed', async (req, res) => {
      try {
        const worldId = await this.dbInitializer.seedSampleWorld();
        this.worldId = worldId;
        
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
    
    // Get characters for current world
    this.app.get('/api/characters', async (req, res) => {
      if (!this.worldId) {
        return res.status(404).json({ error: 'No world loaded' });
      }
      
      try {
        const characters = await storage.getCharactersByWorld(this.worldId);
        res.json(characters);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    // Get rules for current world
    this.app.get('/api/rules', async (req, res) => {
      if (!this.worldId) {
        return res.status(404).json({ error: 'No world loaded' });
      }
      
      try {
        const rules = await storage.getRulesByWorld(this.worldId);
        res.json(rules);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    // Switch to a different world
    this.app.post('/api/world/:id/activate', async (req, res) => {
      try {
        const world = await storage.getWorld(req.params.id);
        if (!world) {
          return res.status(404).json({ error: 'World not found' });
        }
        
        this.worldId = world.id;
        res.json({ 
          success: true,
          worldId: this.worldId,
          message: `Activated world: ${world.name}`
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    return server;
  }
  
  /**
   * Start the server
   */
  async start(options: StartupOptions = {}): Promise<void> {
    try {
      // Initialize database
      await this.initializeDatabase(options);
      
      // Setup routes
      const server = await this.setupRoutes();
      
      // Setup Vite for development or serve static files for production
      if (this.app.get('env') === 'development') {
        await setupVite(this.app, server);
      } else {
        serveStatic(this.app);
      }
      
      // Start Express server and store reference
      this.httpServer = server.listen(this.port, '0.0.0.0', () => {
        console.log(`\n🎮 Insimul Server (MongoDB) running on port ${this.port}`);
        console.log(`   Health check: http://localhost:${this.port}/health`);
        console.log(`   World info: http://localhost:${this.port}/api/world`);
        
        if (this.worldId) {
          console.log(`\n🌍 Active World ID: ${this.worldId}`);
        } else {
          console.log(`\n⚠️  No active world. Use the API to seed a world.`);
        }
        
        console.log('\n📝 API Endpoints:');
        console.log('   POST /api/database/initialize - Initialize database');
        console.log('   POST /api/database/reset - Reset database');
        console.log('   POST /api/database/seed - Seed sample world');
        console.log('   GET  /api/worlds - List all worlds');
        console.log('   GET  /api/world - Get current world info');
        console.log('   POST /api/world/:id/activate - Switch to a different world');
        console.log('   GET  /api/characters - Get characters in current world');
        console.log('   GET  /api/rules - Get rules in current world');
      });
      
      // Handle server errors (like port already in use)
      this.httpServer.on('error', async (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`\n❌ Port ${this.port} is already in use.`);
          console.error(`   Try: lsof -ti:${this.port} | xargs kill -9`);
          console.error('   Or set a different PORT in your .env file\n');
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
  }
  
  /**
   * Shutdown the server gracefully
   */
  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down server gracefully...');
    
    // Close HTTP server (only if it's actually running)
    if (this.httpServer && this.httpServer.listening) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.httpServer.close((err: any) => {
            if (err) {
              console.error('Error closing HTTP server:', err);
              reject(err);
            } else {
              console.log('✅ HTTP server closed');
              resolve();
            }
          });
        });
      } catch (error) {
        console.error('Error during HTTP server shutdown:', error);
      }
    }
    
    // Close MongoDB connection
    try {
      await storage.disconnect();
      console.log('✅ MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
    
    console.log('👋 Shutdown complete');
    process.exit(0);
  }
}

// Handle process signals
let server: InsimulMongoServer | null = null;

process.on('SIGINT', async () => {
  if (server) {
    await server.shutdown();
  }
});

process.on('SIGTERM', async () => {
  if (server) {
    await server.shutdown();
  }
});

process.on('uncaughtException', async (error) => {
  console.error(' Uncaught Exception:', error);
  if (server) {
    await server.shutdown();
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    await server.shutdown();
  } else {
    process.exit(1);
  }
});

// Create and start server
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  server = new InsimulMongoServer();
  server.start();
}

export default InsimulMongoServer;
