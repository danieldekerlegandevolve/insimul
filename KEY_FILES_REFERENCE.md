# Insimul - Key Files Reference (Absolute Paths)

## 3D Game Components (Client)

| File | Size | Purpose | Key Methods |
|------|------|---------|------------|
| `/home/user/insimul/client/src/components/3DGame/BabylonWorld.tsx` | 87KB | Main 3D world renderer | `initializeScene()`, `spawnSettlementMesh()` |
| `/home/user/insimul/client/src/components/3DGame/BabylonGUIManager.ts` | 20KB | HUD overlay system | `createHUD()`, `createPlayerStatsPanel()` |
| `/home/user/insimul/client/src/components/3DGame/BabylonChatPanel.ts` | 18KB | NPC dialogue UI | `showDialogue()`, `setOnQuestAssigned()` |
| `/home/user/insimul/client/src/components/3DGame/BabylonQuestTracker.ts` | 14KB | Quest tracking UI | `updateQuests()` |
| `/home/user/insimul/client/src/components/3DGame/TextureManager.ts` | 6.5KB | Texture loading | `fetchWorldTextures()` |
| `/home/user/insimul/client/src/components/3D/src/CharacterController.ts` | 82KB | Movement & animation | `setSound()`, `start()`, `stop()` |

## Rule System & Logic (Server)

| File | Purpose | Key Classes/Functions |
|------|---------|----------------------|
| `/home/user/insimul/server/engines/unified-engine.ts` | Rule execution orchestrator | `executeRule()`, `compileRule()` |
| `/home/user/insimul/server/engines/prolog/` | Prolog-based rule engine | Prolog rule interpreter |
| `/home/user/insimul/server/extensions/tott/` | Talk of the Town subsystems | 22 system files (business, economics, etc.) |
| `/home/user/insimul/server/extensions/kismet/` | Kismet rule format support | Kismet compiler |
| `/home/user/insimul/server/services/predicate-validator.ts` | Rule validation | `validateRule()`, `findUnknownPredicates()` |
| `/home/user/insimul/server/services/predicate-discovery.ts` | Predicate analysis | `discoverPredicates()` |

## Data Models & Schemas

| File | Size | Key Tables |
|------|------|-----------|
| `/home/user/insimul/shared/schema.ts` | 54KB | `rules`, `settlements`, `characters`, `actions`, `quests`, `whereabouts`, `businesses`, `residences`, `lots` |
| `/home/user/insimul/shared/style-presets.ts` | 10KB | Visual themes and color presets |

## API Routes & Backend

| File | Size | Key Routes |
|------|------|-----------|
| `/home/user/insimul/server/routes.ts` | 250KB | **5,900+ lines** - All API endpoints |
| `/home/user/insimul/server/routes/auth-routes.ts` | 8.6KB | Authentication endpoints |
| `/home/user/insimul/server/routes/playthrough-routes.ts` | 14KB | Game session routes |
| `/home/user/insimul/server/db/mongo-storage.ts` | 71KB | MongoDB data access layer |
| `/home/user/insimul/server/db/storage.ts` | 13KB | Storage interface definition |

## Audio Services

| File | Purpose |
|------|---------|
| `/home/user/insimul/server/services/tts-stt.ts` | Text-to-speech service (Google Cloud) |
| `/home/user/insimul/client/src/components/3D/tst/sounds/` | Sound assets directory |

## Settlement & Zone Management

| File | Purpose |
|------|---------|
| `/home/user/insimul/client/src/components/locations/SettlementDetailView.tsx` | Settlement detail UI |
| `/home/user/insimul/client/src/components/dialogs/SettlementDialog.tsx` | Settlement creation dialog |
| `/home/user/insimul/client/src/components/characters/SettlementsListView.tsx` | Settlements list view |

## Rule Editor Components

| File | Purpose |
|------|---------|
| `/home/user/insimul/client/src/components/EnhancedRuleEditor.tsx` | Rule editor with validation |
| `/home/user/insimul/client/src/components/HierarchicalRulesTab.tsx` | Rule hierarchy visualization |
| `/home/user/insimul/client/src/components/RuleExecutionSequenceView.tsx` | Rule execution flow viewer |
| `/home/user/insimul/client/src/components/RuleCreateDialog.tsx` | Rule creation dialog |

## Configuration & Setup

| File | Purpose |
|------|---------|
| `/home/user/insimul/.env.example` | Environment variables template |
| `/home/user/insimul/package.json` | Dependencies and scripts |
| `/home/user/insimul/vite.config.ts` | Frontend build configuration |
| `/home/user/insimul/tsconfig.json` | TypeScript configuration |
| `/home/user/insimul/drizzle.config.ts` | Drizzle ORM configuration |

## Documentation

| File | Purpose |
|------|---------|
| `/home/user/insimul/ARCHITECTURE_SUMMARY.md` | Architecture overview (high level) |
| `/home/user/insimul/CODEBASE_ANALYSIS.md` | Detailed codebase analysis |
| `/home/user/insimul/QUICK_START.md` | Quick start guide |
| `/home/user/insimul/PHASE1_IMPLEMENTATION_GUIDE.md` | Phase 1 implementation guide (JUST CREATED) |
| `/home/user/insimul/QUICK_REFERENCE.md` | Quick reference for Phase 1 (JUST CREATED) |

## Asset Directories

| Path | Contents |
|------|----------|
| `/home/user/insimul/client/assets/player/` | Player character models |
| `/home/user/insimul/client/assets/npc/` | NPC character models |
| `/home/user/insimul/client/assets/ground/` | Terrain textures & heightmaps |
| `/home/user/insimul/voices/` | Voice/audio assets |

## Server Initialization

| File | Purpose |
|------|---------|
| `/home/user/insimul/server/index.ts` | Express app setup, MongoDB init |
| `/home/user/insimul/server/seed/` | Database initialization & seeding |
| `/home/user/insimul/server/config/` | Gemini API configuration |

---

## Line Numbers for Key Code Sections

### In `BabylonWorld.tsx`

- **Theme definitions:** 138-219
- **Constants:** 236-242
- **BabylonWorldProps interface:** 45-50
- **Settlement rendering loop:** 811-825
- **Player model loading:** 665-720
- **NPC spawning:** 740-790
- **Settlement mesh creation:** 1770-1882
- **Road creation:** 1884-1932
- **Scene setup:** 1477-1514
- **Ground creation:** 1516-1550
- **Audio implementation:** 680-685, 2076-2084

### In `BabylonGUIManager.ts`

- **Class definition:** 54-85
- **HUD initialization:** 87-100
- **Player stats panel:** 102-150
- **World stats panel:** 152-200
- **NPC list panel:** 202-250
- **Action panel:** 252-300
- **Menu system:** 350-400

### In `schema.ts`

- **Rules table:** 134-162
- **Settlements table:** 336-389
- **Characters table:** 180-330
- **Whereabouts table:** 674-690
- **Businesses table:** 592-622
- **Lots table:** 625-650
- **Residences table:** 652-671

### In `routes.ts`

- **Settlement GET endpoints:** 1338-1361
- **Settlement POST/PUT endpoints:** 1365-1425
- **Lot endpoints:** 1458+
- **Business endpoints:** 1477+
- **Residence endpoints:** 1730+
- **Rule endpoints:** 380-430

---

## How to Navigate the Codebase

### Finding Rule-Related Code
1. Start: `/server/routes.ts` (search for "rule")
2. Data model: `/shared/schema.ts` (rules table)
3. Execution: `/server/engines/unified-engine.ts`
4. UI: `/client/src/components/EnhancedRuleEditor.tsx`

### Finding Settlement/Zone Code
1. Start: `/client/src/components/3DGame/BabylonWorld.tsx` (search for "settlement")
2. Data model: `/shared/schema.ts` (settlements table)
3. API: `/server/routes.ts` (settlement endpoints)
4. UI: `/client/src/components/locations/SettlementDetailView.tsx`

### Finding Audio Code
1. Implementation: `/client/src/components/3DGame/BabylonWorld.tsx` (search for "Sound")
2. Controller: `/client/src/components/3D/src/CharacterController.ts` (setSound method)
3. TTS service: `/server/services/tts-stt.ts`

### Finding HUD/UI Code
1. Main HUD: `/client/src/components/3DGame/BabylonGUIManager.ts`
2. Chat UI: `/client/src/components/3DGame/BabylonChatPanel.ts`
3. Quests UI: `/client/src/components/3DGame/BabylonQuestTracker.ts`
4. Main page: `/client/src/pages/modern.tsx`

---

## Quick Commands

```bash
# Navigate to project
cd /home/user/insimul

# Start development server
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Start production
npm start

# Check database
npm run db:verify

# View file count
find . -name "*.ts" -o -name "*.tsx" | wc -l
```

---

## Total Codebase Stats

- **Total TypeScript files:** 150+
- **Client components:** 100+
- **Server routes:** 5,900+ lines
- **Database schema:** 1,435 lines
- **Main 3D component:** 87KB
- **Character controller:** 82KB
- **Total dependencies:** 100+

---

## Remember

You're currently on branch: `claude/visual-zone-boundaries-01LAYiBQR164trkQFqHjNh9D`

Main files you'll modify for Phase 1:
1. `/home/user/insimul/client/src/components/3DGame/BabylonWorld.tsx` (zone boundaries)
2. `/home/user/insimul/client/src/components/3DGame/BabylonGUIManager.ts` (minimap)
3. `/home/user/insimul/client/src/components/3DGame/BabylonRulesAudioManager.ts` (NEW - audio)

