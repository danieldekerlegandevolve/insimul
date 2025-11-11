# Import Error Handling & Testing

## Overview
Improved error handling for rule and action imports, plus comprehensive testing for all four supported formats.

## Changes Made

### 1. Enhanced Error Handling in API Endpoints

#### Rules Endpoint (`/api/rules`)
Added detailed error logging and informative error messages:

**Before:**
```typescript
} catch (error) {
  res.status(500).json({ error: "Failed to create rule" });
}
```

**After:**
```typescript
} catch (error) {
  console.error("Failed to create rule:", error);
  console.error("Request body:", JSON.stringify(req.body, null, 2));
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: "Invalid rule data", 
      details: error.errors,
      receivedData: {
        name: req.body.name,
        sourceFormat: req.body.sourceFormat,
        isBase: req.body.isBase
      }
    });
  }
  
  res.status(500).json({ 
    error: "Failed to create rule",
    message: error instanceof Error ? error.message : String(error),
    details: error instanceof Error ? error.stack : undefined
  });
}
```

**Benefits:**
- ✅ **Server logs show full error details** - Stack traces, request bodies
- ✅ **Client receives actionable error info** - Field-level validation errors
- ✅ **Easier debugging** - See exactly what data was sent and why it failed
- ✅ **Better UX** - Users see specific validation issues, not generic errors

#### Actions Endpoint (`/api/actions`)
Applied the same improvements to the actions endpoint for consistency.

### 2. Debug Logging
Added debug logging before database operations:

```typescript
console.log('Creating rule:', {
  name: data.name,
  isBase: data.isBase,
  worldId: data.worldId,
  sourceFormat: data.sourceFormat,
  hasContent: !!data.content,
  hasConditions: !!data.conditions,
  hasEffects: !!data.effects
});
```

This helps track:
- What data is being processed
- Whether transformations (like `isBase` flag) are working
- Which fields are present/missing

### 3. Comprehensive Import Format Tests

Created full test suite for all four supported formats:

#### Test Files Created

**Test Data (`server/tests/test-data/`)**
- `insimul-rules.insimul` - Native Insimul format examples
- `ensemble-rules.json` - Ensemble JSON format examples  
- `kismet-rules.kis` - Kismet Prolog format examples
- `tott-rules.py` - Talk of the Town Python examples

**Test Suite (`server/tests/test-import-formats.ts`)**
- Tests all four format imports
- Tests base rule imports (global)
- Validates API responses
- Reports detailed pass/fail results
- Tracks total rules imported

#### Running Tests

```bash
# Run import format tests
npm run test:import

# Run all tests
npm test
```

#### Test Output Example

```
🧪 Starting Import Format Tests
================================

📄 Testing Insimul Format Import...
  ✓ Parsed 2 rules from Insimul file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

📄 Testing Ensemble Format Import...
  ✓ Parsed 2 rules from Ensemble file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

================================
📊 Test Summary
================================

✅ PASS - Insimul: 2 rules imported
✅ PASS - Ensemble: 2 rules imported
✅ PASS - Kismet: 2 rules imported
✅ PASS - Talk of the Town: 2 rules imported
✅ PASS - Base Rule: 1 rules imported

Total Tests: 5
Passed: 5
Failed: 0
Total Rules Imported: 9
```

## Error Response Format

### Validation Errors (400)
```json
{
  "error": "Invalid rule data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    }
  ],
  "receivedData": {
    "name": undefined,
    "sourceFormat": "ensemble",
    "isBase": false
  }
}
```

### Server Errors (500)
```json
{
  "error": "Failed to create rule",
  "message": "Duplicate key error: rule name already exists",
  "details": "Error: E11000 duplicate key error collection..."
}
```

## Debugging Workflow

When you get an import error:

### 1. Check Client Console
Look for the HTTP status and error response:
```
POST /api/rules 400 (Bad Request)
{
  "error": "Invalid rule data",
  "details": [...]
}
```

### 2. Check Server Console
Look for detailed logging:
```
Creating rule: {
  name: 'Friendly Greeting',
  isBase: false,
  worldId: 'world-123',
  sourceFormat: 'ensemble',
  hasContent: true,
  hasConditions: true,
  hasEffects: true
}
Failed to create rule: ZodError: ...
Request body: {
  "name": "Friendly Greeting",
  ...
}
```

### 3. Common Issues & Fixes

#### Missing `worldId` for non-base rules
**Error:** `worldId is required`
**Fix:** Include `worldId` in request OR set `isBase: true`

#### Invalid `sourceFormat`
**Error:** `Invalid enum value. Expected 'insimul' | 'ensemble' | 'kismet' | 'tott'`
**Fix:** Use one of the four supported formats

#### Schema validation errors
**Error:** `Required field missing`
**Fix:** Check Zod schema and ensure all required fields are present

#### Database errors
**Error:** `Duplicate key error`
**Fix:** Rule name already exists, use a different name or update existing

## Testing Best Practices

### Before Committing Code

1. **Run import tests:**
   ```bash
   npm run test:import
   ```

2. **Test each format manually** via ImportDialog UI

3. **Check server logs** for any warnings or errors

4. **Verify database state** after imports

### When Adding New Formats

1. Create test data file in `server/tests/test-data/`
2. Add test function in `test-import-formats.ts`
3. Update documentation
4. Run full test suite

### Continuous Integration

Tests can run in CI/CD:
```yaml
- name: Run Import Tests
  run: |
    npm run dev &
    sleep 5  # Wait for server startup
    npm run test:import
```

## Files Modified

### Server
- ✏️ `server/routes.ts` - Enhanced error handling for `/api/rules` and `/api/actions`
- ✅ `server/tests/test-import-formats.ts` - New comprehensive test suite
- ✅ `server/tests/test-data/` - New test data directory with sample files
- ✅ `server/tests/README.md` - Test documentation
- ✏️ `package.json` - Added `test:import` script

### Documentation
- ✅ `docs/IMPORT_ERROR_HANDLING.md` - This file
- ✏️ `docs/API_CONSOLIDATION.md` - API endpoint consolidation docs

## Future Improvements

### Potential Enhancements
- [ ] Add validation for rule content by format
- [ ] Add import preview with detailed parsing results
- [ ] Add rollback capability for failed batch imports
- [ ] Add import history/audit log
- [ ] Add format-specific validation hints
- [ ] Add auto-correction suggestions for common errors

### Test Coverage
- [ ] Add tests for malformed input files
- [ ] Add tests for large file imports
- [ ] Add tests for concurrent imports
- [ ] Add tests for network failures
- [ ] Add performance benchmarks

## Related Documentation
- [API Consolidation](./API_CONSOLIDATION.md) - Unified `/api/rules` and `/api/actions` endpoints
- [Multi-File Import](./MULTI_FILE_IMPORT.md) - Batch import functionality
- [Test README](../server/tests/README.md) - Testing guide

## Support

If you're still experiencing import errors after checking the logs:

1. **Verify schema compatibility** - Check `shared/schema.ts` for required fields
2. **Check format parsers** - Review `client/src/lib/unified-syntax.ts`
3. **Test with minimal data** - Try importing a single simple rule first
4. **Review test examples** - Use test data files as reference
5. **Check database connection** - Ensure MongoDB is accessible

The improved error messages should guide you to the root cause!
