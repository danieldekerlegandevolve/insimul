# Insimul Codebase Architecture Overview

## Project Summary

**Insimul** is a full-stack web application for creating and simulating interactive worlds with AI-powered characters, rule systems, and narrative generation. It uses a **Babylon.js 3D game engine** (frontend), **Express/Node.js** (backend), and **MongoDB** (database). The project supports multiple world simulation frameworks (Ensemble, Kismet, Talk of the Town) and features advanced rule compilation, character AI, and procedural world generation.

---

## 1. Overall Project Structure & Technology Stack

### Directory Layout
```
/home/user/insimul/
├── client/                          # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── modern.tsx           # Main game editor & 3D game hub
│       │   ├── editor.tsx           # Legacy editor
│       │   └── not-found.tsx
│       ├── components/
│       │   ├── 3DGame/              # Babylon.js 3D game components
│       │   │   ├── BabylonWorld.tsx (87KB) - Main 3D game component
│       │   │   ├── BabylonGUIManager.ts - HUD/UI overlays
│       │   │   ├── BabylonChatPanel.ts - NPC dialogue UI
│       │   │   ├── BabylonQuestTracker.ts - Quest UI
│       │   │   └── TextureManager.ts - Texture loading
│       │   ├── 3D/src/
│       │   │   └── CharacterController.ts (2100+ lines) - Player/NPC movement
│       │   ├── rpg/                 # RPG systems (actions, dialogue)
│       │   ├── characters/          # Character management UI
│       │   ├── locations/           # Settlement/zone management UI
│       │   ├── dialogs/             # Dialog components
│       │   └── ui/                  # Radix-UI components
│       ├── hooks/                   # Custom React hooks
│       ├── lib/                     # Utilities, query client
│       └── contexts/                # Auth context
├── server/
│   ├── index.ts                     # Express app & MongoDB init
│   ├── routes.ts                    # All API routes (5,900+ lines)
│   ├── db/
│   │   ├── mongo-storage.ts         # MongoDB implementation
│   │   └── storage.ts               # Storage interface
│   ├── engines/
│   │   ├── prolog/                  # Prolog-based rule engine
│   │   └── unified-engine.ts        # Rule execution orchestrator
│   ├── extensions/
│   │   ├── tott/                    # Talk of the Town (22 subsystems)
│   │   └── kismet/                  # Kismet rule format support
│   ├── services/                    # AI, TTS, grammar, name generation
│   ├── routes/                      # Route modules
│   ├── seed/                        # Database initialization
│   └── config/                      # Gemini API config
├── shared/
│   ├── schema.ts                    # Drizzle ORM schema (1,435 lines)
│   └── style-presets.ts             # Visual theme presets
└── package.json
```

### Technology Stack

**Frontend:**
- **React 18** with TypeScript
- **Vite** - Build tool & dev server
- **Babylon.js 8.37** - 3D graphics engine (primary)
- **Phaser 3.90** - 2D RPG engine (optional)
- **Three.js** - 3D library (available)
- **Radix UI** - Accessible component library
- **TanStack React Query** - Data fetching/caching
- **Wouter** - Client-side routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

**Backend:**
- **Express.js** - REST API
- **MongoDB** - Primary database
- **Mongoose** - MongoDB ODM
- **Drizzle ORM** - Schema definition (PostgreSQL syntax)
- **Google Gemini API** - AI character chat & generation
- **Google Cloud TTS** - Text-to-speech

**DevOps:**
- **TypeScript** - Type safety
- **ESBuild** - Production bundling
- **tsx** - TypeScript execution

---

## 2. Rules Implementation

### Rule System Architecture

Insimul supports **4 authoring formats** that all compile to **"Insimul" format** for execution:

| Format | Purpose | Status | File Location |
|--------|---------|--------|----------------|
| **Ensemble** | Social simulation rules | Supported | `/server/extensions/ensemble/` |
| **Kismet** | Character volition rules | Supported | `/server/extensions/kismet/` |
| **Talk of the Town** | Life simulation rules | Supported | `/server/extensions/tott/` |
| **Insimul** | Native rule format | Execution target | `/server/engines/` |

### Rule Structure (in Drizzle Schema)

**File:** `/shared/schema.ts` (lines 134-162)

```typescript
export const rules = pgTable("rules", {
  id: varchar("id").primaryKey(),
  worldId: varchar("world_id"),           // World-specific or NULL for base rules
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),     // Always Insimul format for execution
  
  // Metadata
  isBase: boolean("is_base"),             // true = global, false = world-specific
  sourceFormat: text("source_format"),    // ensemble, kismet, tott, insimul
  ruleType: text("rule_type"),            // trigger, volition, trait, default, pattern
  category: text("category"),             // psychological, physical, social, economic
  priority: integer("priority"),
  likelihood: real("likelihood"),
  
  // Rule content
  conditions: jsonb("conditions"),        // Prerequisite conditions
  effects: jsonb("effects"),              // Resulting effects
  dependencies: jsonb("dependencies"),    // Other rules required
  tags: jsonb("tags"),
  
  // Execution state
  isActive: boolean("is_active"),
  isCompiled: boolean("is_compiled"),
  compiledOutput: jsonb("compiled_output"),
  
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

### Rule Execution Flow

```
API Request (/api/worlds/:worldId/rules)
  ↓
rules.ts API Handler
  ↓
storage.createRule() / storage.updateRule()
  ↓
MongoDB - Store rule with sourceFormat metadata
  ↓
Rule Compilation (if needed)
  - Ensemble rules → Prolog conversion
  - Kismet rules → Insimul compilation
  - TotT rules → Insimul compilation
  ↓
unified-engine.ts (Rule Execution)
  - Load compiled rule
  - Check conditions
  - Apply effects
  - Track results
```

### Key Rules Files

| File | Purpose |
|------|---------|
| `/server/engines/unified-engine.ts` | Main rule execution orchestrator |
| `/server/engines/prolog/` | Prolog-based rule engine |
| `/client/src/components/EnhancedRuleEditor.tsx` | Rule editor UI with validation |
| `/client/src/components/HierarchicalRulesTab.tsx` | Rule hierarchy visualization |
| `/client/src/components/RuleExecutionSequenceView.tsx` | Execution flow visualization |
| `/server/services/predicate-validator.ts` | Rule validation & analysis |
| `/server/services/predicate-discovery.ts` | Predicate detection in rules |

---

## 3. Visual/Rendering Systems

### Primary: Babylon.js 3D Engine

**Main Component:** `/client/src/components/3DGame/BabylonWorld.tsx` (2,150+ lines)

#### Scene Setup
- **Canvas-based rendering** with full 3D graphics
- **Babylon.js Engine** with 60 FPS target
- **Collision detection enabled** for terrain
- **Lighting**: Hemispherical light (0.7 intensity) + Directional sun light
- **Sky dome**: 1000-unit sphere with theme-based color
- **Ground**: Height-mapped terrain (512x512) with normal mapping

#### Core Rendering Features

1. **Player Rendering**
   - Model: `/assets/player/Vincent-frontFacing.babylon`
   - Default player ID: `"player"`
   - Controlled via CharacterController
   - Initial energy: 100 points

2. **NPC Rendering**
   - Max 8 NPCs rendered simultaneously
   - Model source: `/assets/npc/starterAvatars.babylon`
   - Per-NPC CharacterController for animation
   - Quest markers (exclamation mark billboard) for quest givers
   - Positioned in circular patterns around terrain center

3. **Settlement Rendering**
   - Max 16 settlements rendered per world
   - Central building: Box mesh (base) + Cylinder mesh (roof)
   - Surrounding buildings: 5-24 additional boxes based on settlement type
   - Theme-aware coloring (base + roof colors)
   - Position: Seeded random placement, projected to ground height

4. **Road System**
   - Procedurally generated between settlements
   - Minimum Spanning Tree algorithm for efficient connectivity
   - Rendered as Tube meshes with theme-aware colors
   - Follows terrain height via raycasting

#### Visual Themes (6+ variants)

Theme selection in `BabylonWorld.tsx` (lines 138-219):

```typescript
// Based on worldType parameter:
- Cyberpunk/Sci-Fi: Dark ground, cool sky, bright roads
- Post-Apocalyptic/Wild-West: Dusty ground, desaturated sky
- Solarpunk: Green ground, bright sky, soft roads
- Medieval/Fantasy: Earthy ground, blue sky, brown roads
- Modern/Superhero: Cool ground, neutral sky, dark roads
- Default: Warm sand ground, blue sky
```

### Secondary: Phaser 2D RPG Engine

**Component:** `/client/src/components/RPGGame.tsx`

- 2D RPG interface with combat, dialogue, exploration
- Available as alternative to 3D game
- Supports character interactions and actions

### HUD & UI System

**File:** `/client/src/components/3DGame/BabylonGUIManager.ts` (520+ lines)

Using Babylon.js GUI overlay system:

```typescript
export class BabylonGUIManager {
  // UI Panels:
  - hudContainer         // Main HUD overlay
  - playerStatsPanel     // Energy, health display
  - worldStatsPanel      // World statistics
  - npcListPanel         // NPC roster
  - actionPanel          // Action buttons
  - feedbackPanel        // Action result messages
  - menuButton           // Main menu toggle
  - menuPanel            // Settings/menu options
}
```

#### GUI Callbacks
- `onActionSelected()` - Handle action execution
- `onNPCSelected()` - NPC interaction
- `onBackPressed()` - Return to editor
- `onFullscreenPressed()` - Fullscreen toggle
- `onDebugPressed()` - Debug mode

### Chat & Quest UI

**Files:**
- `/client/src/components/3DGame/BabylonChatPanel.ts` - NPC dialogue
- `/client/src/components/3DGame/BabylonQuestTracker.ts` - Quest tracking

---

## 4. Audio Systems

### Babylon.js Sound Integration

**File:** `/client/src/components/3DGame/BabylonWorld.tsx` (lines 680-685, 2076-2084)

#### Implemented Audio

1. **Footstep Sounds**
   - URL: `/assets/footstep_carpet_000.ogg`
   - Triggered on player movement
   - Also plays for NPCs via CharacterController
   - Positional audio support (3D sound in world space)

2. **Sound Management**
   ```typescript
   const walkSound = new Sound(
     `player-walk`,
     FOOTSTEP_SOUND_URL,
     scene,
     () => { playerController.setSound(walkSound); }
   );
   ```

### CharacterController Audio

**File:** `/client/src/components/3D/src/CharacterController.ts` (lines 18-26)

```typescript
import { Sound } from "babylonjs";

// CharacterController supports setSound() method
// Plays audio when character walks/runs
```

### TTS (Text-to-Speech) Service

**File:** `/server/services/tts-stt.ts`

- Google Cloud Text-to-Speech integration
- Character dialogue audio generation
- Available but not directly integrated into 3D game yet

### Potential Audio Integration Points

For **Phase 1 features**, audio feedback for rules could be added:
- `BabylonWorld.tsx` - Add rule violation audio cues
- `BabylonGUIManager.ts` - Audio feedback for HUD actions
- `/api/audio/` endpoint - Generate rule violation sounds via Gemini

---

## 5. Zones/Areas/Settlements Definition

### Settlement Data Model

**File:** `/shared/schema.ts` (lines 336-389)

```typescript
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey(),
  worldId: varchar("world_id").notNull(),
  countryId: varchar("country_id"),     // Parent nation
  stateId: varchar("state_id"),         // Parent region
  
  // Location & Type
  name: text("name").notNull(),
  description: text("description"),
  settlementType: text("settlement_type"), // city, town, village
  terrain: text("terrain"),              // plains, hills, mountains, coast, river, forest, desert
  
  // Demographics
  population: integer("population"),
  foundedYear: integer("founded_year"),
  founderIds: jsonb("founder_ids"),
  currentGeneration: integer("current_generation"),
  
  // Governance
  mayorId: varchar("mayor_id"),
  localGovernmentType: text("local_government_type"),
  
  // Geography (Hierarchical zone system)
  districts: jsonb("districts"),         // Sub-zones within settlement
  streets: jsonb("streets"),             // Road network
  landmarks: jsonb("landmarks"),         // Points of interest
  
  // Social/Economic Data
  socialStructure: jsonb("social_structure"),
  economicData: jsonb("economic_data"),
  
  // TotT Tracking
  unemployedCharacterIds: jsonb("unemployed_character_ids"),
  vacantLotIds: jsonb("vacant_lot_ids"),
  departedCharacterIds: jsonb("departed_character_ids"),
  
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

### Settlement Hierarchy

```
Country (political division)
  ├── State (regional division)
  │   └── Settlement (city, town, village)
  │       ├── Districts (neighborhoods)
  │       ├── Lots (land parcels with addresses)
  │       │   ├── Residences (homes)
  │       │   └── Businesses (shops, offices)
  │       ├── Streets (road network)
  │       └── Landmarks (points of interest)
```

### Related Tables

| Table | Purpose | Key Field |
|-------|---------|-----------|
| `countries` | Nation-states | worldId, governmentType |
| `states` | Provinces/regions | countryId, terrain |
| `lots` | Land parcels | settlementId, address, districtName |
| `residences` | Homes | settlementId, lotId, occupants |
| `businesses` | Shops/offices | settlementId, businessType, owner |
| `whereabouts` | Character locations | characterId, location, locationType |

### API Endpoints for Zones

**File:** `/server/routes.ts`

```typescript
GET  /api/worlds/:worldId/settlements       // All settlements
GET  /api/countries/:countryId/settlements  // Settlements in country
GET  /api/states/:stateId/settlements       // Settlements in state
POST /api/worlds/:worldId/settlements       // Create settlement
GET  /api/settlements/:id                   // Get settlement details
PUT  /api/settlements/:id                   // Update settlement
GET  /api/settlements/:settlementId/lots    // Get lots in settlement
GET  /api/settlements/:settlementId/businesses
GET  /api/settlements/:settlementId/residences
```

---

## 6. Minimap & HUD Implementations

### Current HUD System

**File:** `/client/src/components/3DGame/BabylonGUIManager.ts`

**Current Capabilities:**
- Player stats panel (energy, health)
- World statistics (countries, settlements, characters, rules, quests)
- NPC list panel with occupation info
- Action feedback display
- Menu system

**GUI Architecture:**
```
AdvancedDynamicTexture (Full-screen overlay)
  ├── HUD Container
  │   ├── Player Stats Panel
  │   ├── World Stats Panel
  │   ├── NPC List Panel
  │   ├── Action Feedback Panel
  │   └── Menu Panel
```

### Minimap Capability

**Status:** NOT YET IMPLEMENTED

**Recommended Approach for Implementation:**

1. **Render Target Minimap** (Babylon.js built-in)
   - Create secondary camera looking down on world
   - Render to texture via RenderTargetTexture
   - Display as small rectangle in corner of screen

2. **UI Overlay Minimap** (Babylon.js GUI)
   - Create rectangles for settlements
   - Update positions dynamically
   - Add player position indicator
   - Color-code by settlement type

3. **Canvas-based Minimap** (React component)
   - Pre-render in 2D canvas
   - Display as overlay
   - More flexible styling options

### Integration Points for Phase 1

**Minimap:**
- Add to BabylonGUIManager.createHUD()
- Subscribe to player position updates
- Update settlement indicators in real-time
- Click-to-navigate features

**Zone Boundaries:**
- Render settlement boundary meshes (circles/squares)
- Visual indicators when entering/exiting zones
- Glow effects for active zones
- Safe zone highlighting for rules system

**Audio Feedback:**
- Sound cue when crossing zone boundary
- Rules violation alert sounds
- Safe zone entry/exit sounds

---

## 7. Key Integration Points for Phase 1 Features

### Phase 1: Visual Zone Boundaries, Minimap, & Audio Feedback

#### A. Visual Zone Boundaries

**Where to Add:**
- **File:** `/client/src/components/3DGame/BabylonWorld.tsx`
- **Function:** `useEffect` for settlement rendering (line 799+)
- **Approach:**
  ```typescript
  // Add this after settlement mesh creation:
  settlements.forEach(settlement => {
    const boundaryMesh = createZoneBoundary(
      settlement,
      scene,
      theme
    );
    settlementMeshesRef.current.set(settlement.id, boundaryMesh);
  });
  ```

**Implementation Details:**
- Use `MeshBuilder.CreateTorus()` or `CreateCylinder()` for zone rings
- Color-based on settlement type (city = blue, town = green, village = gray)
- Semi-transparent or outlined style to avoid visual clutter
- Collision detection for zone entry/exit events

#### B. Minimap Integration

**Where to Add:**
- **File:** `/client/src/components/3DGame/BabylonGUIManager.ts`
- **Method:** Extend `createHUD()` or add new `createMinimap()`
- **Approach:**
  1. Add RenderTargetTexture for top-down view
  2. Create GUI Image element to display minimap
  3. Update player position marker dynamically
  4. Display settlement locations and boundaries

**API Integration:**
- GET `/api/worlds/:worldId/settlements` (already exists)
- Real-time position updates from player movement
- Optional: Settlement icon/color coding

#### C. Audio Feedback for Rules

**Where to Add:**
- **File:** `/client/src/components/3DGame/BabylonWorld.tsx`
- **Additional:** New `BabylonRulesAudioManager.ts`
- **Approach:**
  ```typescript
  // When rule is executed:
  const ruleAudio = await generateRuleAudio(rule);
  const sound = new Sound('rule-audio', ruleAudio, scene);
  sound.play();
  ```

**Audio Types:**
1. **Rule Violation Alerts** - Harsh buzz/error sound
2. **Rule Success Chimes** - Positive ding/bell sound
3. **Zone Boundary Crossing** - Subtle tone/chirp
4. **Safe Zone Entry** - Calming tone

**API Endpoint Needed:**
```typescript
POST /api/audio/generate-rule-feedback
Body: { ruleType, ruleId, status: "success" | "violation" }
Returns: { audioUrl, duration }
```

---

## 8. Data Flow: Loading & Rendering a 3D World

```
User clicks "3D Game" tab in modern.tsx
  ↓
BabylonWorld component mounts with worldId
  ↓
Initialize Babylon Engine & Scene
  - Create canvas
  - Setup camera (ArcRotate)
  - Setup lighting (hemispheric + directional)
  - Create sky dome
  - Create ground from heightmap
  ↓
Load World Data (Parallel Fetches)
  - GET /api/worlds/:worldId/characters
  - GET /api/worlds/:worldId/actions
  - GET /api/worlds/:worldId/quests
  - GET /api/worlds/:worldId/settlements
  - GET /api/worlds/:worldId/rules
  ↓
Create Player
  - Load player model (Vincent-frontFacing.babylon)
  - Setup CharacterController
  - Attach keyboard controls
  ↓
Create NPCs (up to 8)
  - Load NPC template mesh
  - Clone for each character
  - Position around terrain
  - Setup movement controllers
  - Add quest markers
  ↓
Create Settlements (up to 16)
  - Calculate seeded positions
  - Create building meshes
  - Create road network
  - Apply theme colors
  ↓
Setup GUI Overlay
  - BabylonGUIManager creates HUD
  - BabylonChatPanel for dialogue
  - BabylonQuestTracker for quests
  ↓
Start Animation Loop
  - Engine.runRenderLoop()
  - Scene.render() 60 FPS
  ↓
Ready for Interaction
  - Player movement (WASD)
  - Camera control (mouse)
  - NPC interaction (space/click)
  - Action system
```

---

## 9. Key Files by System

### Rules & Logic
- `/server/engines/unified-engine.ts` - Rule execution
- `/server/engines/prolog/` - Prolog rules
- `/server/extensions/tott/` - TotT subsystems (22 files)
- `/client/src/components/EnhancedRuleEditor.tsx` - Rule editor
- `/shared/schema.ts` - Data models

### Visual/3D Rendering
- `/client/src/components/3DGame/BabylonWorld.tsx` - Main 3D component
- `/client/src/components/3DGame/BabylonGUIManager.ts` - HUD system
- `/client/src/components/3D/src/CharacterController.ts` - Movement
- `/client/src/components/3DGame/TextureManager.ts` - Texture loading

### Audio
- `/server/services/tts-stt.ts` - Text-to-speech
- `/client/src/components/3D/tst/sounds/` - Sound assets

### Settlements/Zones
- `/client/src/components/locations/SettlementDetailView.tsx` - Settlement UI
- `/client/src/components/dialogs/SettlementDialog.tsx` - Creation dialog
- `/server/db/mongo-storage.ts` - Settlement data access

### API & Backend
- `/server/routes.ts` - All REST endpoints (5,900+ lines)
- `/server/db/mongo-storage.ts` - MongoDB abstraction
- `/server/routes/playthrough-routes.ts` - Game session routes
- `/server/index.ts` - Server initialization

---

## 10. Development Workflow

### Running Locally

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with MongoDB URL and Gemini API key

# Development mode (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check

# Database verification
npm run db:verify
```

### Database Initialization

```bash
# Auto-initialize with seed data
npm run db:init

# Reset database completely
npm run db:reset -- --seed

# Just seed data
npm run db:seed
```

---

## 11. Current Limitations & Gaps for Phase 1

| Feature | Status | Gap |
|---------|--------|-----|
| Visual Zone Boundaries | NOT IMPLEMENTED | Need to add settlement boundary meshes |
| Minimap | NOT IMPLEMENTED | Need RenderTargetTexture + GUI overlay |
| Audio Feedback (Rules) | PARTIALLY IMPL | TTS exists, but not integrated with rules |
| Safe Zone System | NOT IMPLEMENTED | Need zone collision detection |
| Rule Violation Alerts | NOT IMPLEMENTED | Need audio alert integration |
| Zone Entry/Exit Events | NOT IMPLEMENTED | Need boundary crossing detection |

---

## 12. Recommended Implementation Order (Phase 1)

1. **Visual Zone Boundaries** (Most visual impact)
   - Extend `spawnSettlementMesh()` to add boundary geometry
   - Time: 2-3 hours

2. **Minimap Integration** (Essential UI)
   - Add RenderTargetTexture to BabylonWorld
   - Create minimap GUI in BabylonGUIManager
   - Time: 3-4 hours

3. **Zone Crossing Detection** (Foundation for audio)
   - Monitor player distance to settlement boundaries
   - Fire events on boundary crossing
   - Time: 1-2 hours

4. **Audio Feedback System** (Enhancement)
   - Create BabylonRulesAudioManager
   - Integrate with rule execution
   - Add zone crossing sounds
   - Time: 2-3 hours

**Total Estimated Time:** 8-12 hours

