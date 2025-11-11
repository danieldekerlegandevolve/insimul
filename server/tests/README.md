# Insimul Test Suite

## Overview

This directory contains comprehensive tests for the Insimul server, including import format tests for all supported rule formats.

## Test Files

### Import Format Tests (`test-import-formats.ts`)

Tests the import functionality for all four supported rule formats:
- **Insimul** (.insimul) - Native Insimul format
- **Ensemble** (.json) - Ensemble JSON format
- **Kismet** (.kis) - Kismet Prolog format
- **Talk of the Town** (.py) - TotT Python class format

Also tests:
- Base rule imports (global rules available to all worlds)
- Error handling and validation
- Multi-file imports

### Test Data

Sample files for each format are located in `test-data/`:
- `insimul-rules.insimul` - Insimul format examples
- `ensemble-rules.json` - Ensemble format examples
- `kismet-rules.kis` - Kismet Prolog examples
- `tott-rules.py` - Talk of the Town Python examples

## Running Tests

### Prerequisites

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Ensure MongoDB is running** (default port 27017)

### Run Import Format Tests

```bash
# Using npm script
npm run test:import

# Or run directly with tsx
npx tsx server/tests/test-import-formats.ts
```

### Run All Tests

```bash
npm test
```

## Test Configuration

### Environment Variables

- `API_URL` - Base URL for API (default: `http://localhost:8000`)
- `TEST_WORLD_ID` - World ID to use for tests (default: `test-world-123`)

### Example

```bash
API_URL=http://localhost:3000 npx tsx server/tests/test-import-formats.ts
```

## Expected Output

```
🧪 Starting Import Format Tests
================================

API Base URL: http://localhost:8000
Test World ID: test-world-123

📄 Testing Insimul Format Import...
  ✓ Parsed 2 rules from Insimul file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

📄 Testing Ensemble Format Import...
  ✓ Parsed 2 rules from Ensemble file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

📄 Testing Kismet Format Import...
  ✓ Found 2 rule definitions in Kismet file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

📄 Testing Talk of the Town Format Import...
  ✓ Found 2 class definitions in TotT file
  ✓ Successfully imported: Friendly Greeting
  ✓ Successfully imported: Angry Confrontation

📄 Testing Base Rule Import (Global)...
  ✓ Successfully created base rule: Universal Greeting Rule

================================
📊 Test Summary
================================

✅ PASS - Insimul: 2 rules imported
✅ PASS - Ensemble: 2 rules imported
✅ PASS - Kismet: 2 rules imported
✅ PASS - Talk of the Town: 2 rules imported
✅ PASS - Base Rule: 1 rules imported

================================
Total Tests: 5
Passed: 5
Failed: 0
Total Rules Imported: 9
================================
```

## Troubleshooting

### "Failed to create rule" errors

If you see 500 errors when importing:

1. **Check server logs** - The improved error handling will show detailed error messages in the server console
2. **Verify schema** - Make sure the rule data matches the expected schema
3. **Check database connection** - Ensure MongoDB is running and accessible
4. **Review validation errors** - Zod validation errors will be included in the response

### Import fails with parse errors

1. **Check file format** - Ensure test data files are valid for their format
2. **Review compiler output** - InsimulRuleCompiler errors will be logged
3. **Verify file paths** - Ensure test-data directory exists and files are readable

### Connection refused errors

1. **Start the server** - Run `npm run dev` before running tests
2. **Check port** - Default is 8000, adjust `API_URL` if different
3. **Wait for startup** - Server needs time to initialize database

## Adding New Tests

### Adding a new format test

1. Create test data file in `test-data/`
2. Add test function following the pattern:
   ```typescript
   async function testMyFormatImport(): Promise<TestResult> {
     // Load file
     // Parse rules
     // Import via API
     // Return results
   }
   ```
3. Add to `runAllTests()` function
4. Update this README

### Adding test for new features

1. Create new test file: `test-[feature].ts`
2. Export test functions
3. Add to test runner script
4. Document in this README

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Import Tests
  run: |
    npm run dev &
    sleep 5
    npm run test:import
```

## Related Files

- `/server/routes.ts` - API endpoints being tested
- `/client/src/components/ImportDialog.tsx` - Frontend import UI
- `/client/src/lib/unified-syntax.ts` - Rule compiler
- `/docs/API_CONSOLIDATION.md` - API documentation
- `/docs/MULTI_FILE_IMPORT.md` - Multi-file import feature docs
