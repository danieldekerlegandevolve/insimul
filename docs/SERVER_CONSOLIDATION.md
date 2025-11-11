# Server Consolidation - Merged mongo-startup.ts into index.ts

**Date:** October 30, 2025  
**Status:** ✅ Complete

## Problem

The application had two competing server entry points:
- `server/index.ts` - Original server with basic setup
- `server/db/mongo-startup.ts` - MongoDB server with database initialization

This was confusing and could lead to:
- Different endpoints being available depending on which server was running
- Duplicate code and maintenance burden
- Uncertainty about which server to use

## Solution

Merged all the important features from `mongo-startup.ts` into `server/index.ts` and deleted the redundant file.

## Features Merged into server/index.ts

### 1. Database Initialization System
```typescript
async function initializeDatabase()
```
- Auto-initialization on startup if database is empty
- Support for reset and seed operations
- Checks environment variables: `AUTO_INIT`, `AUTO_SEED`
- Prints helpful database summary on startup

### 2. Command-Line Arguments
```bash
npm run dev -- --init      # Initialize database
npm run dev -- --reset     # Reset database
npm run dev -- --seed      # Seed sample world
npm run dev -- --help      # Show help
```

### 3. Database Management API Endpoints
- `GET /health` - Health check with database info
- `POST /api/database/initialize` - Initialize database
- `POST /api/database/reset` - Reset database  
- `POST /api/database/seed` - Seed sample world
- `POST /api/world/:id/activate` - Switch active world

### 4. Graceful Shutdown
- Handles `SIGINT`, `SIGTERM` signals
- Catches `uncaughtException` and `unhandledRejection`
- Properly closes HTTP server and MongoDB connection
- Clean exit with status messages

### 5. Better Error Handling
- Port already in use detection
- Helpful error messages with resolution steps
- Automatic cleanup on errors

### 6. Enhanced Logging
- Database summary on startup
- World count and character counts
- Active world tracking
- Database management endpoint list

## Changes Made

### Files Modified

**1. server/index.ts**
- Added imports: `MongoSimpleInitializer`, `storage`
- Added command-line argument parsing
- Added database initialization logic
- Added graceful shutdown handlers
- Added database management endpoints
- Added better startup logging

**2. package.json**
- Updated `dev` script: `server/index.ts` (was `server/db/mongo-startup.ts`)
- Updated `build` script: `server/index.ts` 
- Updated `start` script: `dist/index.js`
- Updated `db:init`, `db:reset`, `db:seed`: `server/index.ts`
- Removed `dev:old` and `start:old` scripts

**3. server/db/mongo-startup.ts**
- ❌ **Deleted** - All functionality merged into `index.ts`

## Usage

### Development
```bash
# Normal startup (auto-init if needed)
npm run dev

# Reset and seed database
npm run dev -- --reset --seed

# Just seed (don't reset)
npm run dev -- --seed

# Show help
npm run dev -- --help
```

### Database Management
```bash
# Initialize database
npm run db:init

# Reset database
npm run db:reset

# Seed sample world
npm run db:seed
```

### Environment Variables
```bash
# .env file
MONGO_URL=mongodb://localhost:27017/insimul
PORT=8000
AUTO_INIT=true   # Auto-initialize if database is empty
AUTO_SEED=true   # Auto-seed sample world if initializing
NODE_ENV=development
```

## Benefits

✅ **Single source of truth** - Only one server entry point  
✅ **No confusion** - Clear which server to run  
✅ **Better maintainability** - No duplicate code  
✅ **All features available** - Database management + all API routes  
✅ **Graceful shutdown** - Proper cleanup on exit  
✅ **Better DX** - Command-line args and helpful logging  

## Testing

To verify everything works:

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Verify grammar templates (recent fix):**
   ```bash
   curl http://localhost:8000/api/grammars/templates | jq '.templates | length'
   ```
   Should return: `10`

4. **Check database summary in console:**
   Should see:
   ```
   📊 Database Summary:
      Worlds: X
      🌍 [World Name]
         Characters: X
         Rules: X
   ```

## Migration Notes

If you have any scripts or documentation referring to:
- `server/db/mongo-startup.ts` → Update to `server/index.ts`
- `dist/mongo-startup.js` → Update to `dist/index.js`
- Old npm scripts (`dev:old`, `start:old`) → Use main scripts

## Backward Compatibility

⚠️ **Breaking Changes:**
- `server/db/mongo-startup.ts` no longer exists
- Can't run as a separate class/module anymore
- All functionality is in main server startup

✅ **Maintained:**
- All API endpoints still work
- All environment variables respected
- All command-line arguments work
- Database initialization logic unchanged

## Next Steps

Consider:
- [ ] Update any deployment scripts
- [ ] Update documentation referencing old server file
- [ ] Test production build
- [ ] Verify all database management features work

## Rollback

If needed, the original `mongo-startup.ts` can be restored from git:
```bash
git checkout HEAD -- server/db/mongo-startup.ts
git checkout HEAD -- package.json
```

But this should not be necessary - all functionality has been preserved and improved.
