# API Endpoint Consolidation

## Overview
Consolidated base rules and base actions endpoints into the main `/api/rules` and `/api/actions` endpoints to simplify the API and reduce code duplication.

## Changes Made

### Rules Endpoints

#### Before
- `POST /api/rules` - Create world-specific rule
- `POST /api/base-rules` - Create base rule (didn't exist, causing 404 errors)
- `GET /api/base-rules` - Get all base rules
- `GET /api/base-rules/category/:category` - Get base rules by category

#### After
- `POST /api/rules` - Create rule (world-specific OR base)
  - Add `isBase: true` in request body for base rules
  - Omit `worldId` for base rules
- `GET /api/rules/base` - Get all base rules
- `GET /api/rules/category/:category` - Get rules by category
- `GET /api/worlds/:worldId/rules` - Get rules for a specific world (unchanged)

### Actions Endpoints

#### Before
- `POST /api/actions` - Create world-specific action
- `POST /api/base-actions` - Create base action (didn't exist, causing 404 errors)
- `GET /api/base-actions` - Get all base actions
- `GET /api/base-actions/type/:actionType` - Get base actions by type

#### After
- `POST /api/actions` - Create action (world-specific OR base)
  - Add `isBase: true` in request body for base actions
  - Omit `worldId` for base actions
- `GET /api/actions/base` - Get all base actions
- `GET /api/actions/type/:actionType` - Get actions by type

## Usage Examples

### Creating a World-Specific Rule
```typescript
POST /api/rules
{
  "worldId": "world123",
  "name": "Greeting Rule",
  "content": "...",
  "ruleType": "social"
}
```

### Creating a Base Rule (Global)
```typescript
POST /api/rules
{
  "isBase": true,
  "name": "Universal Greeting",
  "content": "...",
  "ruleType": "social"
}
```

### Creating a World-Specific Action
```typescript
POST /api/actions
{
  "worldId": "world123",
  "name": "Wave",
  "actionType": "social"
}
```

### Creating a Base Action (Global)
```typescript
POST /api/actions
{
  "isBase": true,
  "name": "Wave",
  "actionType": "social"
}
```

### Getting Base Rules
```typescript
GET /api/rules/base
```

### Getting Base Actions
```typescript
GET /api/actions/base
```

## Frontend Changes

### ImportDialog.tsx
Updated to use consolidated endpoints:
- Changed from `/api/base-rules` to `/api/rules` with `isBase: true`
- Changed from `/api/base-actions` to `/api/actions` with `isBase: true`

### RuleCreateDialog.tsx / ActionCreateDialog.tsx
These dialogs already send `isBase` flag in the request body, so they automatically work with the consolidated endpoints.

## Benefits

✅ **Simpler API**: One endpoint per resource type instead of two
✅ **Fixes 404 errors**: POST endpoints for base resources now exist
✅ **Consistent patterns**: Same approach for rules and actions
✅ **Less code duplication**: Single endpoint handles both cases
✅ **Better maintainability**: Fewer endpoints to maintain
✅ **Backward compatible**: Existing world-specific endpoints still work

## Migration Notes

### If you have existing code using old endpoints:

**Replace:**
```typescript
POST /api/base-rules
POST /api/base-actions
```

**With:**
```typescript
POST /api/rules (with isBase: true)
POST /api/actions (with isBase: true)
```

**Replace:**
```typescript
GET /api/base-rules
GET /api/base-actions
```

**With:**
```typescript
GET /api/rules/base
GET /api/actions/base
```

## Technical Implementation

### Server-side Logic
```typescript
app.post("/api/rules", async (req, res) => {
  // If isBase is true, remove worldId and set isBase flag
  const data = req.body.isBase 
    ? { ...req.body, worldId: undefined, isBase: true } 
    : req.body;
  const validatedData = insertRuleSchema.parse(data);
  const rule = await storage.createRule(validatedData);
  res.status(201).json(rule);
});
```

The endpoint checks for `isBase` flag in the request body:
- If `true`: Removes `worldId` and ensures `isBase: true`
- If `false` or absent: Creates world-specific resource

### Storage Layer
No changes needed - the storage layer already supports both:
- `createRule(data)` and `createAction(data)` handle both cases
- They check for `isBase` and `worldId` fields to determine resource type

## Status

✅ Server endpoints updated
✅ ImportDialog updated  
✅ Multi-file import works with new endpoints
✅ RuleCreateDialog and ActionCreateDialog already compatible
✅ Documentation updated

The API is now more consistent and the 404 errors when importing base resources are fixed!
