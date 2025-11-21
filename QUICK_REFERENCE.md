# Insimul Codebase - Quick Reference for Phase 1

## Core Files You'll Be Modifying

### 1. Main 3D Game Component
**File:** `/home/user/insimul/client/src/components/3DGame/BabylonWorld.tsx`
- **Size:** 87KB, 2,150+ lines
- **Purpose:** Main 3D world renderer
- **Key Functions:**
  - `initializeScene()` - Creates Babylon.js scene
  - `spawnSettlementMesh()` - Renders settlements (LINE 1770)
  - `createSettlementRoads()` - Creates roads between settlements (LINE 1884)
  - Settlement rendering loop - LINE 811
- **What to add:** Visual zone boundaries, zone collision detection

### 2. HUD & UI Manager
**File:** `/home/user/insimul/client/src/components/3DGame/BabylonGUIManager.ts`
- **Size:** 520+ lines
- **Purpose:** All HUD overlay elements
- **Key Class:** `BabylonGUIManager`
- **Key Methods:**
  - `createHUD()` - Initialize HUD panels
  - `setOnActionSelected()` - Register action callbacks
  - `setOnNPCSelected()` - Register NPC selection
- **What to add:** Minimap rendering, zone boundary indicators

### 3. Character Movement Controller
**File:** `/home/user/insimul/client/src/components/3D/src/CharacterController.ts`
- **Size:** 2,100+ lines
- **Purpose:** Player & NPC movement, animations, sounds
- **Key Methods:**
  - `setSound()` - Attach audio to controller
  - `start()` - Begin movement
  - `stop()` - Stop movement
- **Audio:** Lines 18-26 import Sound from Babylon.js

### 4. Data Models & Schema
**File:** `/home/user/insimul/shared/schema.ts`
- **Size:** 1,435 lines
- **Key Tables:**
  - `rules` (LINE 134) - Game rules system
  - `settlements` (LINE 336) - Zones/areas
  - `characters` (LINE 180) - NPCs & player
  - `whereabouts` (LINE 674) - Character locations
  - `businesses`, `residences`, `lots` - Location hierarchy

### 5. Backend API Routes
**File:** `/home/user/insimul/server/routes.ts`
- **Size:** 5,900+ lines
- **Key Routes for Zones:**
  - GET `/api/worlds/:worldId/settlements` (LINE 1338)
  - GET `/api/settlements/:id` (LINE 1389)
  - POST `/api/settlements/:id` (LINE 1401)
  - Lot, business, residence endpoints (LINE 1458+)

### 6. Rule Execution Engine
**File:** `/server/engines/unified-engine.ts`
- **Purpose:** Execute rules and manage their effects
- **Integration Point:** Where to hook audio feedback for rule violations

---

## Phase 1 Implementation Checklist

### Task 1: Visual Zone Boundaries (2-3 hours)
- [ ] Add `createZoneBoundary()` function to BabylonWorld.tsx
- [ ] Create torus/cylinder meshes around settlements
- [ ] Color-code by settlement type (city/town/village)
- [ ] Add to settlement rendering loop
- [ ] Test with different world themes

**Files to modify:**
- `/client/src/components/3DGame/BabylonWorld.tsx`

**Key code locations:**
- Settlement mesh creation: LINE 1770-1882 (`spawnSettlementMesh`)
- Theme colors: LINE 129-137 (`WorldVisualTheme`)
- Settlement rendering loop: LINE 811-825

### Task 2: Minimap Integration (3-4 hours)
- [ ] Create secondary camera for top-down view
- [ ] Setup RenderTargetTexture
- [ ] Create minimap GUI panel in BabylonGUIManager
- [ ] Draw settlement locations as colored rectangles
- [ ] Add player position indicator
- [ ] Update in real-time as player moves

**Files to modify:**
- `/client/src/components/3DGame/BabylonWorld.tsx` (camera setup)
- `/client/src/components/3DGame/BabylonGUIManager.ts` (UI panel)

**Key code locations:**
- HUD initialization: BabylonGUIManager LINE 87-100
- Player position tracking: BabylonWorld.tsx (search for playerMesh.position)

### Task 3: Zone Entry/Exit Detection (1-2 hours)
- [ ] Calculate distance from player to settlement boundaries
- [ ] Fire zone entry event
- [ ] Fire zone exit event
- [ ] Track current zone in state
- [ ] Update HUD zone indicator

**Files to modify:**
- `/client/src/components/3DGame/BabylonWorld.tsx`

**Integration point:**
- Animation loop or separate effect hook for boundary checking

### Task 4: Audio Feedback for Rules (2-3 hours)
- [ ] Create `BabylonRulesAudioManager.ts`
- [ ] Integrate with rule execution (unified-engine.ts hooks)
- [ ] Add zone entry/exit sounds
- [ ] Add rule violation alerts
- [ ] Create audio generation endpoint (optional, use static sounds first)

**Files to create:**
- `/client/src/components/3DGame/BabylonRulesAudioManager.ts`

**Files to modify:**
- `/client/src/components/3DGame/BabylonWorld.tsx` (initialize audio manager)
- `/server/routes.ts` (optional: audio endpoint)

**Audio references:**
- Existing audio: LINE 680-685, LINE 2076-2084 in BabylonWorld.tsx
- Sound files location: `/assets/` (currently has footstep sounds)

---

## Code Snippets for Quick Integration

### Adding a Zone Boundary (in BabylonWorld.tsx)
```typescript
function createZoneBoundary(settlement, scene, theme) {
  const radius = settlement.settlementType === "city" ? 30 : 
                 settlement.settlementType === "town" ? 20 : 15;
  
  const boundary = MeshBuilder.CreateTorus("zone-boundary-" + settlement.id, {
    diameter: radius * 2,
    thickness: 0.5,
    tessellation: 64
  }, scene);
  
  boundary.position = settlementPosition;
  boundary.material = new StandardMaterial(...);
  boundary.material.emissiveColor = Color3.Red(); // Zone color
  boundary.isPickable = false;
  boundary.checkCollisions = false;
  
  return boundary;
}
```

### Checking Zone Proximity (in animation loop)
```typescript
function checkZoneProximity(playerPos, settlements, maxDistance = 25) {
  settlements.forEach(settlement => {
    const dx = playerPos.x - settlement.position.x;
    const dz = playerPos.z - settlement.position.z;
    const distance = Math.sqrt(dx*dx + dz*dz);
    
    if (distance < maxDistance) {
      onZoneEnter(settlement.id);
    }
  });
}
```

### Playing Zone Sound (in BabylonRulesAudioManager.ts)
```typescript
playZoneSound(zoneType: 'enter' | 'exit' | 'violation') {
  const soundUrl = {
    enter: '/assets/audio/zone-enter.ogg',
    exit: '/assets/audio/zone-exit.ogg',
    violation: '/assets/audio/rule-violation.ogg'
  }[zoneType];
  
  const sound = new Sound(`zone-${zoneType}`, soundUrl, this.scene);
  sound.play();
}
```

---

## API Endpoints Already Available

You don't need to create new backend endpoints - these already exist:

```typescript
// Settlement data
GET  /api/worlds/:worldId/settlements
GET  /api/settlements/:id
PUT  /api/settlements/:id
POST /api/settlements/:settlementId/...

// Character data (for zone assignment)
GET  /api/worlds/:worldId/characters
GET  /api/characters/:id

// Rule execution
POST /api/worlds/:worldId/simulations/:simulationId/run
```

---

## Testing Your Changes

### Running in Development
```bash
npm run dev
# Then navigate to http://localhost:3000
# Click "3D Game" tab to test your changes
```

### Testing Zone Boundaries
1. Load a world with settlements
2. Visually verify boundary rings appear around settlements
3. Check that boundaries follow settlement terrain height

### Testing Minimap
1. Player position should update as you move
2. Settlements should appear as colored rectangles
3. Check alignment with actual 3D world

### Testing Zone Sounds
1. Move player toward settlement boundary
2. Hear sound when entering zone
3. Hear sound when exiting zone

---

## Important Constants

In `BabylonWorld.tsx`:
```typescript
const MAX_NPCS = 8;                    // Line 239
const MAX_SETTLEMENTS_3D = 16;         // Line 240
const INITIAL_ENERGY = 100;            // Line 242
const FOOTSTEP_SOUND_URL = "/assets/footstep_carpet_000.ogg"; // Line 238
```

---

## Browser DevTools Tips

1. **Babylon.js Inspector:** Press CTRL+SHIFT+I while game is running
2. **React DevTools:** Install React Developer Tools extension
3. **Network tab:** Monitor API calls under Network tab
4. **Console:** Check for TypeScript errors and warnings

---

## Git Workflow

You're on branch: `claude/visual-zone-boundaries-01LAYiBQR164trkQFqHjNh9D`

```bash
# Check current status
git status

# Create commits as you complete features
git add .
git commit -m "Add visual zone boundaries for settlements"

# Push when ready for review
git push origin claude/visual-zone-boundaries-01LAYiBQR164trkQFqHjNh9D
```

---

## Resources & Documentation

1. **Babylon.js Official:** https://www.babylonjs-playground.com/
2. **Babylon.js GUI:** https://doc.babylonjs.com/features/featuresDeepDive/Babylon.js_and_WebGL
3. **Project README:** `/home/user/insimul/QUICK_START.md`
4. **Architecture docs:** `/home/user/insimul/ARCHITECTURE_SUMMARY.md`
5. **Full implementation guide:** `/home/user/insimul/PHASE1_IMPLEMENTATION_GUIDE.md` (JUST CREATED!)

