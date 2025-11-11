# System Type Refactoring Progress

## Completed Changes

### ✅ Phase 1: Schema Updates (DONE)

**`shared/schema.ts`:**
- ✅ `rules` table: `systemType` → `sourceFormat` 
- ✅ `actions` table: `systemType` → `sourceFormat`
- ✅ `worlds` table: Removed `systemTypes` field
- ✅ `simulations` table: Removed `systemTypes` field  
- ✅ Updated `insertRuleSchema` to use `sourceFormat`
- ✅ Updated `insertActionSchema` to use `sourceFormat`
- ✅ Updated `insertSimulationSchema` to remove `systemTypes`

**TypeScript Types:**
- ✅ `SystemType` → `SourceFormat` in `unified-syntax.ts`
- ✅ `InsimulRule.systemType` → `InsimulRule.sourceFormat`

### 🔄 Phase 2: Code Updates (IN PROGRESS)

**Files That Need Updates:**

#### High Priority (Breaks TypeScript compilation):

1. **`client/src/lib/unified-syntax.ts`** - ~20 occurrences
   - Replace all `systemType:` with `sourceFormat:` in rule objects
   - Already updated type definition

2. **`client/src/pages/editor.tsx`** - ~36 matches
   - State variable: `systemType` → `sourceFormat`
   - API calls using `systemType` parameter
   - File structure references

3. **`server/routes.ts`** - ~29 matches
   - API endpoints using `systemType` parameter
   - File creation/updates
   - Rule validation

4. **`server/gemini-ai.ts`** - ~19 matches
   - AI generation functions
   - Format examples based on `systemType`

#### Medium Priority (API/Server):

5. **`server/mongo-storage.ts`** - 5 matches
   - Storage layer references

6. **`client/src/components/HierarchicalRulesTab.tsx`** - 12 matches

7. **`client/src/components/SimulationConfigDialog.tsx`** - 12 matches  
   - Remove `systemTypes` configuration

8. **`client/src/components/SimulationCreateDialog.tsx`** - 6 matches
   - Remove `systemTypes` configuration

9. **`client/src/components/RuleCreateDialog.tsx`** - 8 matches

10. **`client/src/components/RuleConvertDialog.tsx`** - 7 matches

11. **`client/src/components/editor/code-editor.tsx`** - 5 matches

12. **`client/src/components/WorldDetailsDialog.tsx`** - 2 matches
    - Remove `systemTypes` display

13. **`client/src/components/WorldCreateDialog.tsx`** - 1 match
    - Remove `systemTypes` configuration

#### Low Priority (Documentation/Tests):

14. Test files and world generators - Update as needed
15. Documentation files - Update for accuracy

## Naming Convention

**OLD (Confusing):**
- `systemType` - Implied different execution engines
- `systemTypes` - Implied multi-engine support

**NEW (Clear):**
- `sourceFormat` - Format used for authoring/display
- No array field needed - all execute as Insimul

## Implementation Strategy

### Recommended Approach:

Since there are 200+ references to update, use a systematic approach:

1. **Global Find/Replace in each file:**
   ```
   Find: systemType
   Replace: sourceFormat
   ```

2. **Verify after each file:**
   - Check TypeScript errors
   - Test compilation
   - Review logic carefully

3. **Special Cases to Watch For:**
   - Function parameter names can stay as `systemType` for backward compat
   - API endpoints might need deprecation period
   - Comments and strings don't need updating

### API Backward Compatibility:

Consider accepting both `systemType` and `sourceFormat` in API endpoints during transition:

```typescript
// Server route example
const sourceFormat = req.body.sourceFormat || req.body.systemType || 'insimul';
```

This allows gradual frontend migration without breaking existing code.

## Testing Checklist

After updates, verify:

- [ ] TypeScript compiles without errors
- [ ] Rule creation works
- [ ] Rule editing/conversion works  
- [ ] AI rule generation works
- [ ] Import/export works
- [ ] Simulations run correctly
- [ ] World creation works
- [ ] Admin panel displays correctly

## Migration Notes

**Database:**
- MongoDB is schema-less, so no migration needed
- Existing `systemType` fields will remain until overwritten
- New records will use `sourceFormat`
- Both fields can coexist during transition

**UI/UX Changes:**
- "System Type" selector → "View Format" or "Edit as..."
- Remove "Supported Systems" from world config
- Add tooltip: "Rules are stored and executed in Insimul format"

## Next Steps

1. Continue updating files from the list above
2. Test after each major component update
3. Update documentation
4. Consider adding migration utility if needed
5. Deploy and monitor for issues

## Benefits After Completion

✅ Clearer mental model - one execution engine  
✅ Less confusing UI/UX  
✅ Simpler codebase
✅ Easier to maintain
✅ Better performance (no unnecessary abstraction)
✅ Maintains full import/export compatibility
