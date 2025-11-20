# Insimul Architecture Quick Reference

## Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / React App                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │   modern.tsx     │  │   editor.tsx     │  │  not-found    │ │
│  │   (Game Hub)     │  │  (Legacy Editor) │  │   (404 page)  │ │
│  └────────┬─────────┘  └──────────────────┘  └───────────────┘ │
│           │                                                       │
│  ┌────────┴────────────────────────────────────────────────────┐ │
│  │                    Component Tabs                            │ │
│  │  Home | Rules | Actions | Society | Quests | Grammars |  │ │
│  │  Simulations | RPG Game | 3D Game                          │ │
│  └────┬───────────────────────┬──────────────────────┬────────┘ │
│       │                       │                      │           │
│  ┌────▼──────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐ │
│  │   Various     │  │  PhaserRPGGame  │  │  BabylonWorld     │ │
│  │   Editors     │  │  (2D Game)      │  │  (3D Game)        │ │
│  │               │  │                 │  │                   │ │
│  │ RulesTab,    │  │ - Player        │  │ - Scene Init      │ │
│  │ ActionTab,   │  │ - NPCs          │  │ - Player Model    │ │
│  │ etc.         │  │ - Quests        │  │ - NPCs (max 8)    │ │
│  │               │  │ - Combat        │  │ - Settlements     │ │
│  │               │  │                 │  │ - Roads           │ │
│  └───────────────┘  └─────────────────┘  │ - Camera/Control  │ │
│                                           │ - Actions/UI      │ │
│                                           └───────────────────┘ │
│                                                 │                │
│                                           ┌─────▼──────────┐    │
│                                           │ Character      │    │
│                                           │ Controller     │    │
│                                           │ (Movement)     │    │
│                                           └────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API Calls
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌─────▼──────────┐  ┌──▼──────────┐
│ Express Server │  │  API Routes    │  │  Gemini AI  │
│                │  │  (routes.ts)   │  │  Integration│
│ - Middleware   │  │                │  └─────────────┘
│ - Auth (empty) │  │ /api/worlds    │
│ - Logging      │  │ /api/quests    │
│ - Error Handler│  │ /api/characters│
└────────┬───────┘  │ /api/actions   │
         │          │ /api/rules     │
         │          │ /api/progress  │
         │          └────────────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │         MongoDB Database                     │
    │                                              │
    │  Collections:                                │
    │  • worlds          • rules                   │
    │  • characters      • actions                 │
    │  • quests          • grammars                │
    │  • simulations     • truths                  │
    │  • countries       • states                  │
    │  • settlements     • businesses              │
    │  • residences      • occupations             │
    │  • lots            • whereabouts             │
    └───────────────────────────────────────────────┘
```

---

## Data Flow: 3D Game Session

```
User Clicks "3D Game" Tab
           │
           ▼
   BabylonWorld Component Mounts
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┐
    │             │          │          │          │
    ▼             ▼          ▼          ▼          ▼
  Load     Load World    Load Player  Load NPC    Setup
 Assets   Data (REST)   Model Assets  Models      Camera
    │             │          │          │          │
    └──────┬──────┴──────────┴──────────┴──────────┘
           │
           ▼
    Create Babylon Scene
    & Initialize Engine
           │
           ▼
    Render Scene Elements
    • Ground (themed)
    • Sky (themed)
    • Player character
    • NPCs (up to 8)
    • Settlements (up to 16)
    • Roads between settlements
           │
           ▼
    Setup Controls
    • Player movement (WASD)
    • Camera (mouse)
    • Action system
           │
           ▼
    Animation Loop Starts
    (60 FPS)
           │
    ┌──────┼──────┬──────────────┐
    │      │      │              │
    ▼      ▼      ▼              ▼
  Input  Update  Render    Update State
 Handler Position Scene    (no persistence)
    │      │      │              │
    └──────┴──────┴──────────────┘
           │
    [Awaiting Implementation]
    - Progress tracking
    - Energy/health changes
    - Quest updates
    - Saves/snapshots
```

---

## Key Integration Points for Authentication & Progress

### 1. Where to Add User Check

**File:** `/client/src/pages/modern.tsx` (lines 42-49)
```typescript
// BEFORE: No user/auth check
export default function ModernEditor() {
  const [selectedWorld, setSelectedWorld] = useState<string>('');

// AFTER: Add auth requirement
import { useAuth } from '@/hooks/use-auth'; // NEW

export default function ModernEditor() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoginPrompt />;  // NEW
  
  const [selectedWorld, setSelectedWorld] = useState<string>('');
```

### 2. Where to Add Player Profile Linking

**File:** `/client/src/components/3DGame/BabylonWorld.tsx` (lines 231-250)
```typescript
// BEFORE:
export function BabylonWorld({ worldId, worldName, worldType, onBack }: BabylonWorldProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

// AFTER: Add user/player ID props
interface BabylonWorldProps {
  worldId: string;
  worldName: string;
  worldType?: string;
  onBack: () => void;
  userId: string;              // NEW
  playerProfileId: string;     // NEW
  onProgressUpdate?: (stats: any) => void;  // NEW
}

export function BabylonWorld({ 
  worldId, worldName, worldType, onBack,
  userId, playerProfileId, onProgressUpdate  // NEW
}: BabylonWorldProps) {
```

### 3. Where to Add Progress Tracking

**File:** `/client/src/components/3DGame/BabylonWorld.tsx` (lines 300-350)
```typescript
// Add near state initialization:
const [playerHealth, setPlayerHealth] = useState(100);
const [playerEnergy, setPlayerEnergy] = useState(INITIAL_ENERGY);

// Add periodic save effect:
useEffect(() => {
  const saveInterval = setInterval(async () => {
    if (!playerProfileId) return;
    
    const response = await fetch(
      `/api/players/${userId}/worlds/${worldId}/stats`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health: playerHealth,
          energy: playerEnergy,
          // Add other stats
        }),
      }
    );
    
    if (response.ok && onProgressUpdate) {
      onProgressUpdate(await response.json());
    }
  }, 60000); // Every minute
  
  return () => clearInterval(saveInterval);
}, [playerHealth, playerEnergy, userId, playerProfileId, worldId]);
```

### 4. Where to Add Backend Endpoints

**File:** `/server/routes.ts` (add to bottom, before closing)

```typescript
// NEW: Player stats endpoints
app.post('/api/players/:userId/worlds/:worldId/stats', async (req, res) => {
  try {
    const { userId, worldId } = req.params;
    const { health, energy, questsCompleted, currentLevel } = req.body;
    
    // TODO: Authenticate user
    // TODO: Update playerStats record
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

app.put('/api/players/:userId/worlds/:worldId/stats', async (req, res) => {
  try {
    const { userId, worldId } = req.params;
    // Similar to POST
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// NEW: Quest progress endpoints
app.post('/api/quests/:questId/progress', async (req, res) => {
  try {
    const { questId } = req.params;
    const { playerProfileId, action, objectiveIndex } = req.body;
    
    // TODO: Update quest progress
    
    res.json({ success: true, progress: 0.5 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quest progress' });
  }
});
```

### 5. Where to Add Database Schema

**File:** `/shared/schema.ts` (after existing tables)

```typescript
// NEW TABLES:
export const users = pgTable("users", {
  // ... (see full schema in CODEBASE_ANALYSIS.md)
});

export const playerProfiles = pgTable("player_profiles", {
  // ... 
});

export const playerStats = pgTable("player_stats", {
  // ...
});

export const progressSnapshots = pgTable("progress_snapshots", {
  // ...
});

export const questProgress = pgTable("quest_progress", {
  // ...
});
```

---

## Quick Setup Instructions

### Running the Project

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URL and Gemini API key

# Development server
npm run dev

# Build for production
npm build
npm start
```

### Database Initialization

```bash
# Auto-initializes on first run with AUTO_INIT=true

# Manual init with seed data:
npm run db:init

# Reset database (destructive):
npm run db:reset -- --seed
```

### Key Commands

```bash
npm run check          # TypeScript type check
npm run build          # Build frontend + backend
npm run dev            # Start dev server
npm run db:verify      # Check database integrity
npm test               # Run tests
```

---

## Implementation Checklist for Auth & Progress

- [ ] Create users table in schema
- [ ] Create playerProfiles table
- [ ] Create playerStats table
- [ ] Create progressSnapshots table  
- [ ] Create questProgress table
- [ ] Implement JWT auth middleware
- [ ] Create /api/auth/register endpoint
- [ ] Create /api/auth/login endpoint
- [ ] Create /api/auth/logout endpoint
- [ ] Add auth check to modern.tsx
- [ ] Pass userId/playerProfileId to BabylonWorld
- [ ] Add progress tracking hooks to BabylonWorld
- [ ] Create /api/players/:userId endpoints
- [ ] Create /api/quests/:questId/progress endpoint
- [ ] Add auto-save mechanism to BabylonWorld
- [ ] Add load/restore functionality
- [ ] Create UI for save/load screens
- [ ] Test full flow: register → play → save → logout → login → load

---

## Current Limitations & Caveats

1. **No Asset Pipeline** - 3D models must exist at `/assets/player/` and `/assets/npc/`
2. **MongoDB Only** - Schema says PostgreSQL but uses MongoDB
3. **No User System** - All worlds/progress currently public/shared
4. **Limited NPC Rendering** - Only 8 NPCs max for performance
5. **No Persistence in 3D** - Game state not saved unless explicitly implemented
6. **Single Player** - No multiplayer/networking support
7. **Gemini API Required** - Character chat requires valid Google API key

