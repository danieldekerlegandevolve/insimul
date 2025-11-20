# Insimul Codebase Analysis

## Executive Summary

Insimul is a full-stack web application for creating and simulating interactive worlds with AI-powered characters, rule systems, and narrative generation. The project features a **Babylon.js-based 3D game engine** (recent switch from Phaser), built with React frontend, Express backend, and MongoDB database. It's designed to support game development with multiple world simulation frameworks (Ensemble, Kismet, Talk of the Town).

---

## 1. PROJECT STRUCTURE & ORGANIZATION

```
/home/user/insimul/
├── client/                       # React frontend (Vite)
│   └── src/
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Router setup (wouter)
│       ├── pages/
│       │   ├── modern.tsx        # Main game editor & 3D game launcher
│       │   ├── editor.tsx        # Legacy editor page
│       │   └── not-found.tsx
│       ├── components/
│       │   ├── 3DGame/
│       │   │   └── BabylonWorld.tsx    # Main 3D game component (Babylon.js)
│       │   ├── 3D/src/
│       │   │   └── CharacterController.ts # Babylon.js character movement controller
│       │   ├── rpg/              # RPG game logic (actions, dialogue)
│       │   ├── characters/       # Character management UI
│       │   ├── locations/        # Location management UI
│       │   └── ui/               # Radix-UI components
│       ├── hooks/
│       ├── lib/                  # Utilities (queryClient, rule compiler, editor types)
│       └── index.html            # Entry HTML
├── server/
│   ├── index.ts                  # Express app initialization, MongoDB setup
│   ├── routes.ts                 # All API routes (5900+ lines)
│   ├── db/
│   │   ├── storage.ts            # Storage interface definition
│   │   ├── mongo-storage.ts      # MongoDB implementation
│   │   └── verify-db.ts
│   ├── config/                   # Gemini API configuration
│   ├── generators/               # Name generator, world generator
│   ├── extensions/tott/          # Talk of the Town subsystems
│   ├── extensions/kismet/        # Kismet rule system
│   ├── engines/                  # Rule execution engines
│   ├── seed/                     # Database seeding & initialization
│   └── services/                 # Grammar templates, utilities
├── shared/
│   └── schema.ts                 # Drizzle ORM schema (PostgreSQL)
├── package.json                  # Dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json
├── drizzle.config.ts
└── .env.example                  # Environment variables template
```

### Technology Stack

**Frontend:**
- **React 18** with TypeScript
- **Vite** (build tool)
- **Babylon.js 8.37** - 3D game engine
- **Phaser 3.90** - 2D RPG engine (available)
- **Three.js** - 3D library (optional)
- **Radix UI** - Accessible component library
- **TanStack React Query** - Data fetching/caching
- **Wouter** - Client-side routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

**Backend:**
- **Express.js** - REST API framework
- **TypeScript** - Type safety
- **MongoDB** - Primary database (with Mongoose)
- **Drizzle ORM** - Query builder (references PostgreSQL but uses MongoDB)
- **Passport.js** - Authentication (installed but not configured)
- **Google Gemini API** - AI for character chat & name generation

**Database:**
- **MongoDB** - Primary storage (see `.env.example` MONGO_URL)
- Configuration: Drizzle schema targets PostgreSQL but storage uses MongoDB

---

## 2. CURRENT 3D GAME IMPLEMENTATION (Babylon.js)

### Entry Point: BabylonWorld Component

**File:** `/home/user/insimul/client/src/components/3DGame/BabylonWorld.tsx` (58KB)

#### Component Props
```typescript
interface BabylonWorldProps {
  worldId: string;           // World to render
  worldName: string;
  worldType?: string;        // For theme styling (cyberpunk, medieval, etc.)
  onBack: () => void;        // Exit callback
}
```

#### Key Features

1. **Scene Management**
   - Canvas-based rendering with Babylon.js Engine
   - Dynamic scene creation with lighting (hemispherical + directional)
   - Theme-aware visual styling based on worldType

2. **Player System**
   - Default player ID: `"player"`
   - Model loaded from: `/assets/player/Vincent-frontFacing.babylon`
   - Initial energy: 100 points
   - Controllable via CharacterController

3. **CharacterController (NPC Movement)**
   - File: `/home/user/insimul/client/src/components/3D/src/CharacterController.ts` (82KB)
   - Handles avatar mesh, skeleton, and animations
   - Supports:
     - Walk, run, strafe, jump animations
     - Gravity and slope detection
     - Step offset for climbing
     - Speed customization for each action

4. **NPCs & World Population**
   - Max 8 NPCs rendered simultaneously (`MAX_NPCS = 8`)
   - Model source: `/assets/npc/starterAvatars.babylon`
   - NPCs positioned around settlements with seeded randomization
   - Display info: ID, name, occupation, disposition, quest giver status

5. **World Visualization**
   - **Settlements:** Up to 16 rendered (`MAX_SETTLEMENTS_3D = 16`)
   - **Roads:** Procedurally generated between settlements
   - **Ground/Sky:** Theme-based coloring
   - **Visual Themes:** 6+ theme variants (cyberpunk, medieval, solarpunk, etc.)

6. **Action System**
   - ActionManager class integrates with RPG action system
   - DialogueActions available for NPC interaction
   - Action feedback UI with results display

7. **Data Loading**
   - Fetches world data via REST:
     - Characters: `/api/worlds/:worldId/characters`
     - Actions: `/api/worlds/:worldId/actions` + base actions
     - Quests: `/api/worlds/:worldId/quests`
     - Settlements: Derived from location data

8. **Audio**
   - Footstep sounds: `/assets/footstep_carpet_000.ogg`
   - Positional audio support

#### Initialization Flow
```
BabylonWorld Mounted
  ↓
Initialize Engine & Scene
  ↓
Load World Data (Characters, Actions, Settlements)
  ↓
Load Player Model (Vincent avatar)
  ↓
Create CharacterController for player
  ↓
Load & Position NPCs (max 8)
  ↓
Render Settlements & Roads
  ↓
Setup Camera & Controls
  ↓
Start Animation Loop
```

---

## 3. DATABASE & DATA PERSISTENCE

### Storage Architecture

**Primary Database:** MongoDB
- **Connection:** Via `MONGO_URL` environment variable
- **Driver:** Mongoose (via MongoStorage class)
- **Initialization:** MongoSimpleInitializer auto-initializes on startup

**Schema Definition:** `/shared/schema.ts`
- Defined with **Drizzle ORM** (PostgreSQL schema syntax)
- Converted to MongoDB collections by MongoStorage
- 16 tables/collections:

### Database Tables/Collections

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **worlds** | Game worlds/realms | id, name, config, worldData, generationConfig |
| **characters** | NPCs & player characters | id, firstName, lastName, personality, skills, relationships |
| **rules** | Behavioral rules (trigger, volition, trait) | id, worldId, content, sourceFormat (ensemble/kismet/tott/insimul) |
| **actions** | Character actions (dialogue, movement, etc.) | id, worldId, actionType, energyCost |
| **quests** | Quest definitions & player progress | id, assignedTo, status, progress, experienceReward |
| **grammars** | Tracery templates for narrative generation | id, worldId, grammar (JSON), tags |
| **simulations** | Simulation runs | id, worldId, status, results |
| **truths** | Character secrets/backstories | id, characterId, content |
| **countries** | Nation-states | id, worldId, governmentType, economicSystem |
| **states** | Provinces/regions | id, countryId, terrain, governor |
| **settlements** | Cities/towns | id, worldId, population, terrain |
| **businesses** | Shops, offices, etc. | id, worldId, businessType, owner |
| **residences** | Houses, apartments | id, settlementId, occupants |
| **occupations** | Character job records | id, characterId, businessId, salary |
| **lots** | Land parcels | id, settlementId |
| **whereabouts** | Character location tracking | characterId, settlementId, timestamp |

### Quest System (Existing Progress Tracking)

Quests table includes player progress fields:
```typescript
progress: jsonb              // Custom progress tracking per quest
objectives: jsonb            // Quest tasks
status: string              // active, completed, failed, abandoned
completionCriteria: jsonb   // Completion requirements
experienceReward: integer   // XP earned on completion
assignedToCharacterId: varchar  // Player character ID
```

### No User/Account System Currently

**Important Finding:** There is NO user authentication or account system in place:
- No `users` table in schema
- Passport.js is installed but NOT configured
- No session management configured
- No password hashing dependencies

---

## 4. MAIN ENTRY POINTS & INITIALIZATION

### Frontend Entry Point

**File:** `/client/src/main.tsx`
```typescript
createRoot(document.getElementById("root")!).render(<App />);
```

**App Router:** `/client/src/App.tsx`
- Routes library: **Wouter** (lightweight client-side routing)
- Routes:
  - `/` → `Modern` (main game editor + 3D game)
  - `/editor` → `Editor` (legacy editor)
  - `/...` → `NotFound`

### Main Game Page: `modern.tsx`

**File:** `/client/src/pages/modern.tsx` (16KB)

Flow:
1. Fetch available worlds via `/api/worlds`
2. User selects world → WorldSelectionScreen
3. Once world selected, shows tab-based interface:
   - **Home** - World management
   - **Rules** - Rule editor
   - **Actions** - Action editor
   - **Society** - World explorer
   - **Quests** - Quest management
   - **Grammars** - Narrative templates
   - **Simulations** - Run simulations
   - **RPG Game** - 2D Phaser game
   - **3D Game** - Babylon.js 3D world (renders `<BabylonWorld />`)

### Backend Entry Point

**File:** `/server/index.ts` (521 lines)

Initialization sequence:
```
1. Load Environment Variables (.env)
2. Parse command-line arguments (--init, --reset, --seed)
3. Create Express app
4. Setup middleware (JSON parsing, request logging)
5. Initialize MongoDB
   - Check if database initialized
   - Auto-init if configured (AUTO_INIT=true)
   - Auto-seed sample world if configured (AUTO_SEED=true)
6. Register API routes (from routes.ts)
7. Setup Vite middleware (dev) or serve static files (prod)
8. Listen on PORT (default: 3000)
```

**Database Initialization:**
- Class: `MongoSimpleInitializer`
- File: `/server/seed/mongo-init-simple.ts`
- Creates base rules, actions, grammars from seed data
- Can auto-initialize or be triggered manually via `--init` flag

### API Routes

**File:** `/server/routes.ts` (5,913 lines)

Major route groups:
- `/api/worlds` - CRUD operations on worlds
- `/api/worlds/:worldId/characters` - Character management
- `/api/worlds/:worldId/rules` - Rule management
- `/api/worlds/:worldId/actions` - Action management
- `/api/worlds/:worldId/quests` - Quest management
- `/api/worlds/:worldId/simulations` - Simulation execution
- `/api/simulations/:id/run` - Run simulation
- `/api/grammars` - Grammar management
- `/api/generate-rule` - AI rule generation
- `/api/worlds/:worldId/generate-complete` - Complete world generation
- `/api/progress/:taskId` - Progress tracking (for world generation)

---

## 5. EXISTING FEATURES & SYSTEMS

### Quest & Progress System

```typescript
// Quest structure with progress tracking
{
  id: string
  worldId: string
  assignedToCharacterId: string  // Player character
  assignedByCharacterId?: string // NPC giver
  title: string
  description: string
  questType: string              // conversation, translation, vocabulary, grammar
  difficulty: string             // beginner, intermediate, advanced
  targetLanguage: string         // For language learning
  objectives: any[]              // List of tasks
  progress: Record<string, any>  // Current progress
  status: string                 // active, completed, failed, abandoned
  experienceReward: integer      // XP on completion
  rewards: Record<string, any>   // Item/reward data
  assignedAt: timestamp
  completedAt?: timestamp
}
```

### Rule System (Multiple Formats)

Rules support multiple authoring formats that compile to "Insimul" format for execution:
- **Ensemble** - Social simulation rules
- **Kismet** - Character volition rules  
- **Talk of the Town (TotT)** - Life simulation
- **Insimul** - Native rule format (execution target)

### Talk of the Town Integration

Detailed subsystems implemented:
- **Hiring System** - Job allocation, career progression
- **Economic System** - Wealth, trades, loans, market prices
- **Social Dynamics** - Relationships, salience, conversation
- **Relationship System** - Detailed interpersonal connections
- **Knowledge System** - Mental models, beliefs, knowledge propagation
- **Conversation System** - Character dialogue generation
- **Event System** - Life events, town events, disasters
- **Routine System** - Daily schedules, whereabouts tracking
- **Business System** - Company ownership, management

### AI Integration

- **Google Gemini API** for:
  - Character chat generation
  - Contextual name generation
  - Rule/action AI generation
  - Quest storyline generation
- Configuration via `GEMINI_API_KEY` or `GEMINI_FREE_API_KEY`

---

## 6. FRAMEWORK & ARCHITECTURE PATTERNS

### Frontend Architecture

**State Management:**
- React Context + TanStack React Query (data fetching)
- Local component state for UI
- No Redux or centralized state management

**Component Structure:**
- Functional components with hooks
- Reusable UI primitives (Radix-UI)
- Tab-based navigation for different editor tabs

**Data Flow:**
```
React Components
  ↓
TanStack React Query (useQuery, useMutation)
  ↓
REST API calls (/api/*)
  ↓
Express Server
  ↓
MongoDB
```

### Backend Architecture

**Service Layer Pattern:**
- Storage interface (IStorage) with MongoDB implementation
- Specialized extension modules for each system (tott/, kismet/)
- Rule compilation & execution engines
- Generator services (world, name, grammar)

**Request-Response Pattern:**
- Express route handlers
- Direct database access via storage abstraction
- JSON responses with error handling

---

## 7. ENVIRONMENT & CONFIGURATION

**Required Environment Variables:**

```env
# Database
MONGO_URL=mongodb://localhost:27017/insimul

# AI
GEMINI_API_KEY=your_key
# or
GEMINI_FREE_API_KEY=your_key

# Server
PORT=3000

# Auto-initialization
AUTO_INIT=true              # Auto-init if database empty
AUTO_SEED=true              # Auto-seed sample world
NODE_ENV=development|production
```

**Configuration Files:**
- `.env` / `.env.example` - Environment variables
- `vite.config.ts` - Frontend build config
- `drizzle.config.ts` - ORM configuration (targets PostgreSQL schema)
- `tsconfig.json` - TypeScript configuration
- `components.json` - Radix-UI components registry

---

## RECOMMENDATIONS FOR AUTHENTICATION & PROGRESS TRACKING

### 1. USER AUTHENTICATION SYSTEM

**Current State:** No authentication system exists

**Recommended Implementation:**

#### Option A: Session-based (Traditional)
```typescript
// New schema tables needed:
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  username: varchar("username").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Setup Steps:**
1. Configure Passport.js with `passport-local`
2. Install bcrypt for password hashing
3. Add Express session middleware
4. Create `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` routes
5. Add auth middleware to protect game endpoints
6. Link user sessions to game progress

#### Option B: JWT-based (Modern SPA)
```typescript
// Simpler schema:
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Frontend stores JWT in localStorage/sessionStorage
// Each API request includes: Authorization: Bearer <token>
```

**Advantages:**
- Works well with SPAs (Insimul is React-based)
- Stateless server
- Better scalability
- CORS-friendly

### 2. PLAYER PROGRESS TRACKING SYSTEM

**Current State:** Quests have progress field but no comprehensive player progression

**Recommended Data Model:**

```typescript
export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").unique().notNull(), // FK to users
  currentCharacterId: varchar("current_character_id"), // Active player character
  totalPlayTime: integer("total_play_time").default(0), // seconds
  totalQuestsCompleted: integer("total_quests_completed").default(0),
  totalExperience: integer("total_experience").default(0),
  currentLevel: integer("current_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playerStats = pgTable("player_stats", {
  id: varchar("id").primaryKey(),
  playerProfileId: varchar("player_profile_id").notNull(),
  worldId: varchar("world_id").notNull(), // Per-world stats
  
  // Current world progress
  experience: integer("experience").default(0),
  level: integer("level").default(1),
  health: integer("health").default(100),
  energy: integer("energy").default(100), // Already used in 3D game
  
  // Progression tracking
  questsCompleted: jsonb("quests_completed").$type<string[]>().default([]),
  questsInProgress: jsonb("quests_in_progress").$type<string[]>().default([]),
  
  // Skill progression
  skills: jsonb("skills").$type<Record<string, number>>().default({}),
  
  // Inventory/collectibles
  inventory: jsonb("inventory").$type<any[]>().default([]),
  achievements: jsonb("achievements").$type<string[]>().default([]),
  
  // Relationship tracking (with characters)
  relationships: jsonb("relationships").$type<Record<string, number>>().default({}),
  
  // Time tracking
  playTime: integer("play_time").default(0), // seconds in this world
  lastPlayedAt: timestamp("last_played_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const progressSnapshots = pgTable("progress_snapshots", {
  id: varchar("id").primaryKey(),
  playerStatsId: varchar("player_stats_id").notNull(),
  
  // Save game snapshots
  characterState: jsonb("character_state").notNull(), // Full character data
  worldState: jsonb("world_state").notNull(), // Relevant world data
  timestamp: timestamp("timestamp").defaultNow(),
  description: text("description"), // "After defeating boss", etc.
  autoSave: boolean("auto_save").default(false),
});

export const questProgress = pgTable("quest_progress", {
  id: varchar("id").primaryKey(),
  questId: varchar("quest_id").notNull(), // FK
  playerProfileId: varchar("player_profile_id").notNull(), // FK
  
  // Current progress
  currentObjectiveIndex: integer("current_objective_index").default(0),
  objectiveProgress: jsonb("objective_progress").$type<Record<string, any>>().default({}),
  
  // Tracking
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  abandonedAt: timestamp("abandoned_at"),
  status: text("status").default("active"),
  
  // Performance metrics
  attemptsCount: integer("attempts_count").default(1),
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
});
```

### 3. INTEGRATION POINTS IN 3D GAME

**BabylonWorld Component Modifications:**

```typescript
// Add to BabylonWorldProps
interface BabylonWorldProps {
  // ... existing props
  userId: string;           // NEW: Current user
  playerProfileId: string;  // NEW: Player progression ID
  onProgressUpdate: (stats: PlayerStats) => void;  // NEW: Callback
}

// Within component:
// 1. Track energy/health changes
const updatePlayerHealth = (delta: number) => {
  setPlayerHealth(prev => Math.max(0, prev + delta));
  // Save to backend
  updatePlayerStats({ health: playerHealth });
};

// 2. Track quest progress
const handleQuestInteraction = async (questId: string, action: string) => {
  const response = await fetch(`/api/quests/${questId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerProfileId,
      action,
      worldState: getCurrentWorldState(),
    }),
  });
};

// 3. Auto-save game state
const autoSaveGameState = useCallback(() => {
  const snapshot: ProgressSnapshot = {
    characterState: playerController?.getState(),
    worldState: {
      settlementsVisited: visitedSettlements,
      npcInteractions: interactionLog,
      inventory: playerInventory,
    },
    autoSave: true,
  };
  saveProgressSnapshot(snapshot);
}, [playerController]);

useEffect(() => {
  const saveInterval = setInterval(autoSaveGameState, 60000); // Every minute
  return () => clearInterval(saveInterval);
}, [autoSaveGameState]);
```

### 4. API ENDPOINTS TO CREATE

```typescript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me               // Current user

// Player Profiles
GET    /api/players/:userId       // Get profile
POST   /api/players/:userId       // Create profile
PUT    /api/players/:userId       // Update profile

// Player Stats (per world)
GET    /api/players/:userId/worlds/:worldId/stats
POST   /api/players/:userId/worlds/:worldId/stats
PUT    /api/players/:userId/worlds/:worldId/stats

// Quest Progress
GET    /api/players/:userId/quests
GET    /api/quests/:questId/progress?playerId=...
POST   /api/quests/:questId/progress  // Update progress
POST   /api/quests/:questId/complete  // Mark complete

// Save Games / Snapshots
GET    /api/players/:userId/worlds/:worldId/snapshots
POST   /api/players/:userId/worlds/:worldId/snapshots
GET    /api/snapshots/:snapshotId
PUT    /api/snapshots/:snapshotId/load

// Achievements
GET    /api/players/:userId/achievements
POST   /api/achievements/check-new
```

### 5. FRONTEND INTEGRATION POINTS

**Modify modern.tsx:**
```typescript
// Add auth context/provider
const { user, login, logout } = useAuth();

// Add player profile fetching
const { data: playerProfile } = useQuery({
  queryKey: ['/api/players', user?.id, 'profile'],
  enabled: !!user?.id,
});

// Add to BabylonWorld props
<BabylonWorld
  // ... existing props
  userId={user?.id}
  playerProfileId={playerProfile?.id}
  onProgressUpdate={(stats) => {
    queryClient.invalidateQueries({
      queryKey: ['/api/players', user?.id, 'worlds', worldId, 'stats']
    });
  }}
/>
```

### 6. MIGRATION PATH

1. **Phase 1:** Add user authentication
   - Create users table
   - Implement Passport.js with JWT or sessions
   - Add login/register UI

2. **Phase 2:** Create player profile system
   - Link users to player profiles
   - Initialize on first game access
   - Basic stat tracking

3. **Phase 3:** Enhance quest progress tracking
   - Extend existing quest progress fields
   - Add objective tracking
   - Link to player profiles

4. **Phase 4:** 3D game integration
   - Modify BabylonWorld to send progress updates
   - Add save/load functionality
   - Auto-save implementation

5. **Phase 5:** Advanced features
   - Achievements/badges system
   - Leaderboards
   - Multi-save slots
   - Cross-world progression

---

## FILE LOCATIONS SUMMARY

### Key Files for Adding Features

| Feature | Files |
|---------|-------|
| **3D Game** | `/client/src/components/3DGame/BabylonWorld.tsx` |
| **Character Movement** | `/client/src/components/3D/src/CharacterController.ts` |
| **Game Entry** | `/client/src/pages/modern.tsx` |
| **API Routes** | `/server/routes.ts` |
| **Database Schema** | `/shared/schema.ts` |
| **Server Initialization** | `/server/index.ts` |
| **Storage Layer** | `/server/db/storage.ts`, `/server/db/mongo-storage.ts` |
| **Quest Logic** | `/server/extensions/tott/*` (social systems) |
| **AI Integration** | `/server/config/gemini.js` |

---

## CRITICAL FINDINGS

1. **No Authentication System** - Implement before deploying multiplayer features
2. **MongoDB/Drizzle Mismatch** - Schema uses PostgreSQL syntax for MongoDB; works via MongoStorage abstraction
3. **3D Game Assets Required** - Babylon files expected in `/assets/player/` and `/assets/npc/`
4. **Progress Tracking Exists** - Quest progress partially implemented; needs player-level tracking
5. **Modular Rule System** - Multiple rule engines (ensemble, kismet, tott) provide flexibility but complexity
6. **AI-Powered** - Heavy reliance on Gemini API for generation; requires valid API key
7. **Vite Frontend** - Modern React setup with hot reload in dev; static build in production

