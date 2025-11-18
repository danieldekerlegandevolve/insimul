# Insimul Codebase - Quick Start Reference

## Key Documents Generated

1. **CODEBASE_ANALYSIS.md** - Comprehensive analysis of all components, systems, and recommendations
2. **ARCHITECTURE_SUMMARY.md** - Visual diagrams and integration points for new features
3. **QUICK_START.md** - This file

## 30-Second Overview

**What is Insimul?**
A full-stack web app for creating and playing 3D worlds with AI characters. Built with React (frontend), Express (backend), MongoDB (database), and Babylon.js (3D engine).

**Tech Stack:**
- Frontend: React 18, Vite, Babylon.js 8.37, Radix-UI, TanStack React Query
- Backend: Express.js, TypeScript, MongoDB, Mongoose
- AI: Google Gemini API for character chat & generation

**Architecture:**
```
Browser (React/Babylon.js) 
  ↓ (REST API)
Express Server 
  ↓ (MongoDB queries)
MongoDB Database
```

---

## File Navigation Map

### Frontend Code

```
client/src/
├── main.tsx                           # React entry point
├── App.tsx                            # Router (Wouter)
│   └── Routes:
│       - /           → pages/modern.tsx
│       - /editor     → pages/editor.tsx
│
├── pages/
│   ├── modern.tsx                     # Main game hub & 3D launcher
│   │   └── Tabs: Rules, Actions, Quests, Grammars, 3D Game, etc.
│   │
│   └── editor.tsx                     # Legacy editor
│
└── components/
    ├── 3DGame/
    │   └── BabylonWorld.tsx           # 3D game main component (58KB)
    │       └── Imports CharacterController for NPC movement
    │
    ├── 3D/src/
    │   └── CharacterController.ts     # Babylon.js character movement (82KB)
    │       └── Handles animations, gravity, movement
    │
    ├── rpg/                           # Action system & dialogue
    │   ├── actions/
    │   │   └── ActionManager.ts
    │   │   └── DialogueActions.ts
    │   └── types/
    │       └── actions.ts
    │
    ├── ui/                            # Radix-UI components
    ├── characters/                    # Character management UI
    ├── locations/                     # Location management UI
    └── [other components]
```

### Backend Code

```
server/
├── index.ts                           # Server initialization (521 lines)
│   ├── Loads .env
│   ├── Creates Express app
│   ├── Initializes MongoDB
│   ├── Registers routes
│   └── Starts listening on PORT (default 3000)
│
├── routes.ts                          # All API endpoints (5,913 lines)
│   ├── /api/worlds/*
│   ├── /api/characters/*
│   ├── /api/quests/*
│   ├── /api/rules/*
│   ├── /api/actions/*
│   ├── /api/grammars/*
│   ├── /api/simulations/*
│   ├── /api/progress/*
│   └── [50+ routes total]
│
├── db/
│   ├── storage.ts                    # Storage interface (IStorage)
│   ├── mongo-storage.ts              # MongoDB implementation
│   └── verify-db.ts
│
├── config/
│   └── gemini.js                     # Google Gemini API config
│
├── generators/
│   ├── name-generator.ts
│   └── world-generator.ts
│
├── extensions/
│   ├── tott/                         # Talk of the Town subsystems
│   │   ├── relationship-utils.ts
│   │   ├── hiring-system.ts
│   │   ├── economics-system.ts
│   │   ├── conversation-system.ts
│   │   ├── event-system.ts
│   │   ├── routine-system.ts
│   │   └── [many more]
│   │
│   └── kismet/                       # Kismet rule system
│       └── volition-system.ts
│
├── engines/                          # Rule execution engines
├── seed/                             # Database initialization & seeding
└── services/                         # Grammar templates, utilities
```

### Database Schema

```
shared/schema.ts                       # Drizzle ORM schema (945 lines)
├── Tables:
│   ├── worlds              - Game worlds/realms
│   ├── characters          - NPCs & player characters
│   ├── rules               - Behavioral rules (trigger/volition/trait)
│   ├── actions             - Character actions
│   ├── quests              - Quest definitions & progress
│   ├── grammars            - Tracery narrative templates
│   ├── simulations         - Simulation runs
│   ├── truths              - Character secrets/backstories
│   ├── countries           - Nation-states
│   ├── states              - Provinces/regions
│   ├── settlements         - Cities/towns
│   ├── businesses          - Shops, offices
│   ├── residences          - Houses, apartments
│   ├── occupations         - Job records
│   ├── lots                - Land parcels
│   └── whereabouts         - Character location tracking
│
└── MISSING: users, playerProfiles, playerStats (needs to be added)
```

---

## Running the App

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your values
#    - MONGO_URL (MongoDB connection)
#    - GEMINI_API_KEY (for AI features)
#    - PORT (default 3000)

# 4. Start development server
npm run dev
```

The app will:
1. Automatically initialize MongoDB (AUTO_INIT=true)
2. Automatically seed a sample world (AUTO_SEED=true)
3. Start on http://localhost:3000
4. Hot reload in dev mode

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build frontend + backend |
| `npm start` | Run production build |
| `npm run check` | TypeScript type check |
| `npm run db:init` | Initialize database with seed data |
| `npm run db:reset` | Reset database (destructive) |
| `npm run db:seed` | Seed sample data |
| `npm run db:verify` | Check database integrity |
| `npm test` | Run tests |

---

## How the 3D Game Works

### Entry Flow

```
1. User opens http://localhost:3000
2. Loads modern.tsx (main game hub)
3. User selects a world
4. User clicks "3D Game" tab
5. BabylonWorld component mounts
6. Component loads:
   - World data from /api/worlds/:worldId
   - Characters from /api/worlds/:worldId/characters
   - Quests from /api/worlds/:worldId/quests
   - Assets (3D models)
7. Creates Babylon.js scene
8. Renders player character, NPCs, settlements
9. Sets up controls and camera
10. Starts animation loop (60 FPS)
```

### What Happens in the Game

**Player Controls:**
- WASD: Move character
- Mouse: Control camera
- Space: Jump
- Left-click: Interact with NPCs/objects

**Renders:**
- **Player:** 1 controllable character (Vincent model)
- **NPCs:** Up to 8 characters positioned around settlements
- **Settlements:** Up to 16 towns/cities
- **Roads:** Procedurally generated between settlements
- **Ground:** Themed coloring (medieval, cyberpunk, etc.)
- **Sky:** Themed coloring

**Missing (Needs Implementation):**
- User authentication
- Player progress tracking
- Save/load functionality
- Quest objective tracking
- Energy/health persistence
- NPC interactions (dialogue/actions)

---

## Data Model for New Features

### Current Quest Structure
```javascript
{
  id: "quest_123",
  assignedToCharacterId: "player_456",      // Player character
  assignedByCharacterId: "npc_789",         // NPC quest giver
  title: "The Lost Amulet",
  questType: "conversation",                // or vocabulary, translation, etc.
  difficulty: "intermediate",
  status: "active",                         // active, completed, failed, abandoned
  objectives: [                             // Quest tasks
    { index: 0, description: "Find Smith", completed: false },
    { index: 1, description: "Get key", completed: false },
  ],
  progress: { ... },                        // Current progress (flexible)
  experienceReward: 100,                    // XP on completion
  completionCriteria: { ... }
}
```

### What Needs to Be Added

**Users Table:**
```javascript
{
  id: "user_123",
  email: "player@example.com",
  passwordHash: "bcrypt_hash",
  createdAt: "2024-01-01T00:00:00Z"
}
```

**Player Profiles Table:**
```javascript
{
  id: "profile_123",
  userId: "user_123",
  currentCharacterId: "player_456",
  totalPlayTime: 3600,                      // seconds
  totalQuestsCompleted: 5,
  currentLevel: 3
}
```

**Player Stats (Per World):**
```javascript
{
  id: "stats_123",
  playerProfileId: "profile_123",
  worldId: "world_456",
  level: 3,
  experience: 250,
  health: 80,
  energy: 50,
  questsCompleted: ["quest_123", "quest_124"],
  skills: { swordfighting: 50, magic: 25 },
  inventory: [...]
}
```

---

## Key Decision Points

### 1. Authentication: Session vs JWT?

**Session-Based (Traditional):**
- Store session ID in browser cookie
- Server stores session in DB/memory
- Simpler for beginners
- More CPU-intensive

**JWT (Modern):**
- Store token in localStorage
- Server validates token (stateless)
- Better for scaling
- Better for APIs
- **Recommended for Insimul** (React SPA)

### 2. Where to Add Auth?

**Option A - New page:**
```
/ → LoginPage (new)
  → SelectWorldPage
  → modern.tsx
```

**Option B - Modal in modern.tsx:**
```
/ → modern.tsx
  ├─ If not authenticated: show LoginModal
  └─ If authenticated: show game interface
```

**Option C - Middleware:**
```
All routes require auth middleware
Redirect unauthenticated to /login
```

**Recommended:** Option C (most secure)

### 3. Progress Tracking Granularity?

**Option A - Minimal:** Only save on quest complete/fail
**Option B - Moderate:** Save every minute
**Option C - Aggressive:** Save on every action (performance hit)

**Recommended:** Option B (every 60 seconds)

---

## Integration Checklist

### Phase 1: Authentication
- [ ] Add users table to schema.ts
- [ ] Create JWT utility functions
- [ ] Add /api/auth/register endpoint
- [ ] Add /api/auth/login endpoint
- [ ] Add /api/auth/logout endpoint
- [ ] Create useAuth hook
- [ ] Add auth check to modern.tsx
- [ ] Create LoginPage component
- [ ] Add password hashing (bcrypt)

### Phase 2: Player Profiles
- [ ] Add playerProfiles table
- [ ] Add GET /api/players/:userId endpoint
- [ ] Add POST /api/players/:userId endpoint
- [ ] Link user to profile on first login
- [ ] Display profile info in UI

### Phase 3: Player Stats
- [ ] Add playerStats table
- [ ] Add GET /api/players/:userId/worlds/:worldId/stats
- [ ] Add PUT /api/players/:userId/worlds/:worldId/stats
- [ ] Initialize stats on game launch
- [ ] Pass stats to BabylonWorld component
- [ ] Display HUD with health/energy/level

### Phase 4: 3D Game Integration
- [ ] Modify BabylonWorld props (add userId, playerProfileId)
- [ ] Add energy/health state management
- [ ] Add auto-save effect (every 60s)
- [ ] Track NPC interactions
- [ ] Update quest progress on actions
- [ ] Add save/load UI

### Phase 5: Polish
- [ ] Add achievements system
- [ ] Add leaderboards
- [ ] Add save/load slots
- [ ] Add progress visualization
- [ ] Write tests
- [ ] Document API

---

## Common Issues & Solutions

### Issue: 3D models not loading
**Solution:** Check that assets exist at:
- `/assets/player/Vincent-frontFacing.babylon`
- `/assets/npc/starterAvatars.babylon`
- Add test assets or mock loading

### Issue: MongoDB connection fails
**Solution:**
1. Verify MONGO_URL in .env
2. Ensure MongoDB is running
3. Check MongoDB connection string format
4. Run `npm run db:verify`

### Issue: Gemini API errors
**Solution:**
1. Verify GEMINI_API_KEY in .env
2. Check API key is valid
3. Check API quota/usage
4. Feature is optional - not required for basic gameplay

### Issue: Type errors in TypeScript
**Solution:**
1. Run `npm run check`
2. Read error messages carefully
3. Check that schema matches storage implementation
4. Run `npm run build` for full build errors

---

## Next Steps

1. **Read the full analysis:**
   ```bash
   cat CODEBASE_ANALYSIS.md
   cat ARCHITECTURE_SUMMARY.md
   ```

2. **Understand current state:**
   - Review the 3D game: `client/src/components/3DGame/BabylonWorld.tsx`
   - Check existing routes: Search for `/api/quests` in `server/routes.ts`
   - Check schema: Review `shared/schema.ts`

3. **Plan your implementation:**
   - Decide: Session or JWT auth?
   - Decide: Where to add auth check?
   - Create implementation timeline

4. **Start coding:**
   - Begin with Phase 1 (Authentication)
   - Test each phase before moving to next
   - Keep commits small and focused

5. **Test thoroughly:**
   - Manual testing in browser
   - Check console for errors
   - Verify database state after actions
   - Test edge cases (logout/login, reloads, etc.)

---

## Useful Patterns in Codebase

### React Query Pattern (Data Fetching)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/worlds', selectedWorld, 'characters'],
  enabled: !!selectedWorld,
});
```

### Mutation Pattern (POST/PUT/DELETE)
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});
```

### Component Pattern (with Refs)
```typescript
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const stateRef = useRef<State | null>(null);

useEffect(() => {
  if (!canvasRef.current) return;
  // Initialize
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

---

## Resources

- **Babylon.js Docs:** https://doc.babylonjs.com/
- **React Docs:** https://react.dev/
- **Express Docs:** https://expressjs.com/
- **MongoDB Docs:** https://docs.mongodb.com/
- **TanStack Query:** https://tanstack.com/query/

---

## Questions?

Refer to these files in order:
1. **QUICK_START.md** (this file) - For orientation
2. **ARCHITECTURE_SUMMARY.md** - For visual diagrams
3. **CODEBASE_ANALYSIS.md** - For detailed analysis

Then check the actual source files for specific implementations.
