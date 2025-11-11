# Base Resources Fix

## Issues Found

### 1. ✅ Frontend Using Old Endpoints
All frontend components were still trying to fetch from the old endpoints `/api/base-rules` and `/api/base-actions` which we consolidated into `/api/rules/base` and `/api/actions/base`.

### 2. ✅ Mongoose Schema Requiring worldId
The Mongoose schemas had `worldId` marked as `required: true`, preventing base rules and actions from being created without a worldId.

## Fixes Applied

### Server-Side (mongo-storage.ts)

**1. Updated RuleSchema**
```typescript
const RuleSchema = new Schema({
  worldId: { type: String, required: false, default: null }, // ✅ Now optional
  isBase: { type: Boolean, default: false }, // ✅ Added field
  // ... rest of schema
});
```

**2. Updated ActionSchema**
```typescript
const ActionSchema = new Schema({
  worldId: { type: String, required: false, default: null }, // ✅ Now optional
  isBase: { type: Boolean, default: false }, // ✅ Added field
  // ... rest of schema
});
```

### Frontend Components Updated

Updated all components to use consolidated endpoints:

**Files Modified:**
- ✅ `client/src/components/BaseResourcesConfig.tsx` - Base resources configuration view
- ✅ `client/src/components/HierarchicalRulesTab.tsx` - Rules management
- ✅ `client/src/components/HierarchicalActionsTab.tsx` - Actions management
- ✅ `client/src/components/AdminPanel.tsx` - Admin panel overview
- ✅ `client/src/components/RPGGame.tsx` - RPG game data loading
- ✅ `client/src/components/PhaserRPGGame.tsx` - Phaser game data loading

**Changes Made:**
```typescript
// Before
fetch('/api/base-rules')
fetch('/api/base-actions')

// After
fetch('/api/rules/base')
fetch('/api/actions/base')
```

## Verification Steps

### 1. Test Base Rule Creation
```bash
# Run the import tests
bun run test:import
```

Should successfully create base rules without worldId.

### 2. Check Base Resources in UI

**Admin Panel:**
1. Navigate to Admin Panel
2. Base Rules and Base Actions should now display
3. Shows count: "Base Rules (X)" and "Base Actions (Y)"

**Base Resources Config:**
1. Open any world
2. Go to Base Resources Configuration tab
3. Should show all base rules and actions with enable/disable toggles

### 3. Verify Database

Check MongoDB to confirm base resources have:
```javascript
{
  isBase: true,
  worldId: null,
  // ... other fields
}
```

## API Endpoints Reference

### Rules
- `GET /api/rules/base` - Get all base rules
- `GET /api/rules?worldId=xxx` - Get world-specific rules
- `POST /api/rules` - Create rule (base if `isBase: true`, else world-specific)
- `GET /api/rules/category/:category` - Get rules by category

### Actions
- `GET /api/actions/base` - Get all base actions
- `GET /api/worlds/:worldId/actions` - Get world-specific actions
- `POST /api/actions` - Create action (base if `isBase: true`, else world-specific)
- `GET /api/actions/type/:actionType` - Get actions by type

### Base Resource Configuration
- `GET /api/worlds/:worldId/base-resources/config` - Get world's base resource config
- `POST /api/worlds/:worldId/base-resources/toggle` - Enable/disable a base resource for a world

## Testing Import Formats

All four formats now correctly import as base rules:

```bash
bun run test:import
```

Expected output:
```
✅ PASS - Insimul: 2 rules imported
✅ PASS - Ensemble: 2 rules imported
✅ PASS - Kismet: 2 rules imported
✅ PASS - Talk of the Town: 2 rules imported
✅ PASS - Base Rule: 1 rules imported
```

## What Base Resources Are

**Base Rules** and **Base Actions** are global resources that:
- ✅ Don't belong to any specific world (`worldId: null`)
- ✅ Are available to all worlds by default
- ✅ Can be enabled/disabled per-world via Base Resources Config
- ✅ Provide a library of reusable content
- ✅ Reduce duplication across worlds

**Use Cases:**
- Universal social rules (greetings, farewells)
- Common actions (walk, talk, fight)
- Genre-specific templates (fantasy, sci-fi, historical)
- Starter content for new worlds

## Remaining Work

### Potential Enhancements
- [ ] Add UI to create base rules/actions from Admin Panel
- [ ] Add bulk enable/disable for base resources
- [ ] Add base resource templates/presets
- [ ] Add base resource categories and filtering
- [ ] Add base resource versioning
- [ ] Add base resource sharing/export

### Known Issues
- TypeScript errors in `mongo-storage.ts` about `IStorage` interface (pre-existing, doesn't affect functionality)
- No validation to prevent duplicate base resource names
- No UI to convert world-specific resources to base resources

## Related Documentation
- [API Consolidation](./API_CONSOLIDATION.md)
- [Import Error Handling](./IMPORT_ERROR_HANDLING.md)
- [Multi-File Import](./MULTI_FILE_IMPORT.md)
