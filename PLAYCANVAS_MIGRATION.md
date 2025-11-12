# PlayCanvas Migration Guide

## Overview

Insimul has been migrated from React Three Fiber to **PlayCanvas React** to provide better game development features, improved performance, and sophisticated 1st/3rd person camera controls.

## What Changed

### Before (React Three Fiber)
- Basic 3D rendering with Three.js
- Simple camera follow system with conflicts
- Limited character controller
- No proper physics system
- Basic NPC interactions

### After (PlayCanvas React)
- Full game engine with ECS architecture
- Smooth 1st/3rd person camera system
- Advanced player controller with mouse look
- Built-in physics support (ready for expansion)
- Sophisticated NPC management
- Editor integration for custom scenes

## New Features

### 1. Camera Modes

Players can now toggle between two camera perspectives:

**First Person Mode**
- Camera at player eye level (1.6m)
- Direct mouse look control
- Immersive view for exploration
- Press **V** to switch modes

**Third Person Mode**
- Camera positioned behind and above player
- Full view of character and surroundings
- Better spatial awareness
- Smooth camera following

### 2. Improved Controls

**Movement**
- WASD or Arrow Keys for movement
- Camera-relative movement (forward is where you're looking)
- Smooth acceleration and deceleration

**Look Controls**
- Click canvas to enable pointer lock
- Mouse movement controls camera
- Pitch clamped to prevent over-rotation
- Press ESC to release pointer lock

**Quick Actions**
- V - Toggle camera mode (1st/3rd person)
- M - Open fast travel map
- ESC - Release mouse control
- Click NPCs - Interact/Chat

### 3. PlayCanvas Editor Integration

You can now use the PlayCanvas Editor to create custom scenes for your worlds!

**Starting the Editor**
```bash
npm run editor
```

The editor will be available at `http://localhost:51000`

**Workflow**
1. Create world data in Insimul (countries, settlements, characters)
2. Design 3D scene in PlayCanvas Editor
3. Export scene from editor
4. Import scene into Insimul via API
5. Launch game to see your custom scene

See `editor-repo/INSIMUL_INTEGRATION.md` for detailed integration instructions.

## Component Structure

### New Components

```
client/src/components/playcanvas/
├── PlayCanvasGame.tsx       # Main game component
├── PlayerController.tsx     # 1st/3rd person controller
├── NPCManager.tsx           # NPC spawning and management
└── SettlementRenderer.tsx   # Settlement and building rendering
```

### Old Components (Deprecated)

```
client/src/components/
├── Insimul3DGame.tsx        # Replaced by PlayCanvasGame
├── 3d/World3D.tsx           # Replaced by PlayCanvas ECS
├── 3d/Character3D.tsx       # Replaced by NPCManager
└── 3d/Settlement3D.tsx      # Replaced by SettlementRenderer
```

## Technical Details

### PlayCanvas React

The migration uses `@playcanvas/react` which provides:
- **Entity Component System (ECS)**: More performant than scene graphs
- **Declarative API**: Works naturally with React
- **Built-in Physics**: Ready for Ammo.js integration
- **Asset Management**: Efficient loading and caching
- **Event System**: React-style pointer events

### Camera System Implementation

The camera system uses PlayCanvas's entity-based approach:

```typescript
// First Person
camera.setPosition(playerPos.x, playerPos.y + 1.6, playerPos.z);
camera.setEulerAngles(pitch, yaw, 0);

// Third Person
const distance = 5;
const height = 2;
camera.setPosition(
  playerPos.x + distance * Math.sin(yaw),
  playerPos.y + height + distance * Math.sin(pitch),
  playerPos.z + distance * Math.cos(yaw)
);
camera.lookAt(playerPos);
```

### Player Controller

The player controller uses a frame-based update loop:

```typescript
app.on('update', (dt) => {
  // Calculate movement
  const movement = calculateMovement(keys, yaw, pitch);

  // Update position
  player.position.add(movement.scale(moveSpeed * dt));

  // Update camera based on mode
  updateCamera(cameraMode);
});
```

## Performance Improvements

PlayCanvas provides several performance benefits:

1. **Optimized Rendering**: More efficient WebGL calls
2. **Frustum Culling**: Only render visible objects
3. **LOD System**: Ready for level-of-detail implementation
4. **Entity Pooling**: Reuse objects instead of creating/destroying
5. **Efficient Updates**: Only update changed entities

## Migration Checklist

For developers continuing the migration:

- [x] Install PlayCanvas React dependencies
- [x] Create PlayCanvas game component
- [x] Implement player controller with camera modes
- [x] Migrate character rendering (NPCs)
- [x] Migrate settlement rendering
- [x] Set up PlayCanvas Editor
- [x] Update main app to use new component
- [ ] Add physics system (Ammo.js)
- [ ] Implement advanced NPC AI
- [ ] Add scene save/load API endpoints
- [ ] Create custom 3D assets
- [ ] Optimize rendering for large worlds
- [ ] Add multiplayer support (future)

## API Endpoints (To Be Implemented)

The following API endpoints should be created for editor integration:

```typescript
// Save scene to world
POST /api/worlds/:worldId/scenes
Body: { name, sceneData, assets }

// Load scene from world
GET /api/worlds/:worldId/scenes/:sceneId

// List all scenes for world
GET /api/worlds/:worldId/scenes

// Delete scene
DELETE /api/worlds/:worldId/scenes/:sceneId

// Update scene
PUT /api/worlds/:worldId/scenes/:sceneId
Body: { sceneData, assets }
```

## Troubleshooting

### Camera not following player
- Ensure pointer lock is enabled (click canvas)
- Check that player controller ref is set
- Verify camera mode is correct

### Movement not working
- Check keyboard event listeners are attached
- Verify keys are being pressed (check keysPressed ref)
- Ensure PlayCanvas app is running (check console)

### NPCs not appearing
- Verify characters have valid currentLocation
- Check settlement positions are calculated correctly
- Ensure NPCManager is receiving character data

### Editor won't start
- Check Node.js version (18+ required)
- Run `npm install` in editor-repo directory
- Ensure port 51000 is available

## Resources

- [PlayCanvas React Docs](https://developer.playcanvas.com/user-manual/playcanvas-react/)
- [PlayCanvas Engine API](https://api.playcanvas.com/)
- [PlayCanvas Editor GitHub](https://github.com/playcanvas/editor)
- [PlayCanvas Examples](https://playcanvas.github.io/)

## Next Steps

1. **Test the migration**: Run `npm run dev` and navigate to a world's 3D game
2. **Try camera switching**: Press V to toggle between modes
3. **Explore the editor**: Run `npm run editor` to launch PlayCanvas Editor
4. **Customize scenes**: Create custom 3D environments for your worlds
5. **Add physics**: Integrate Ammo.js for realistic interactions
6. **Build assets**: Create custom 3D models for characters and buildings

## Support

If you encounter issues with the migration:

1. Check this document for troubleshooting tips
2. Review the PlayCanvas documentation
3. Check the editor integration guide at `editor-repo/INSIMUL_INTEGRATION.md`
4. Look at the component implementations in `client/src/components/playcanvas/`

---

**Migration completed on**: 2025-11-12
**PlayCanvas React version**: 0.11.0
**PlayCanvas Engine version**: 2.11.8
