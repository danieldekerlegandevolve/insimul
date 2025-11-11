# Base Resources Deletion Feature

## Overview
Added comprehensive deletion functionality for base rules and base actions in the Admin Panel, including both single and bulk deletion capabilities.

## New Component: BaseResourcesManager

Created `/client/src/components/BaseResourcesManager.tsx` - A reusable component for managing base resources with deletion capabilities.

### Features

**1. Selection System**
- ✅ Individual checkboxes for each resource
- ✅ "Select All" / "Deselect All" button
- ✅ Visual indicator showing X of Y selected
- ✅ Maintains selection state across operations

**2. Single Deletion**
- ✅ Delete button on each resource card
- ✅ Confirmation dialog before deletion
- ✅ Shows resource name in confirmation
- ✅ Warns that deletion affects all worlds

**3. Bulk Deletion**
- ✅ "Delete Selected" button (only shows when items selected)
- ✅ Shows count of selected items
- ✅ Confirmation dialog for bulk operations
- ✅ Progress feedback during deletion
- ✅ Summary toast with success/failure counts

**4. UI/UX**
- ✅ Displays resource metadata (name, type, category, tags, source format)
- ✅ Global badge to indicate base resource
- ✅ Empty state message with instructions
- ✅ Disabled state during operations
- ✅ Error handling with user-friendly messages
- ✅ Auto-refresh after deletion

### Component API

```typescript
interface BaseResourcesManagerProps {
  resources: BaseResource[];      // Array of base rules or actions
  resourceType: 'rule' | 'action'; // Type for proper labeling
  icon: React.ReactNode;           // Icon to display with each resource
  onRefresh: () => void;           // Callback to refresh data after deletion
}
```

## Integration with AdminPanel

Updated `/client/src/components/AdminPanel.tsx`:

**Before:**
- Basic list view with no deletion
- Just showed resource information
- Read-only interface

**After:**
```tsx
<BaseResourcesManager
  resources={baseRules}
  resourceType="rule"
  icon={<BookOpen className="w-5 h-5 text-purple-500" />}
  onRefresh={fetchAllData}
/>
```

- Full CRUD support (Create via Import, Delete via Manager)
- Interactive selection system
- Bulk operations support

## API Endpoints Used

The component uses existing DELETE endpoints:

**Delete Base Rule:**
```
DELETE /api/rules/:id
```

**Delete Base Action:**
```
DELETE /api/actions/:id
```

Both endpoints automatically handle base resources (where `isBase: true`).

## User Flow

### Single Deletion
1. Navigate to **Admin Panel** → **Base Resources** tab
2. Choose **Base Rules** or **Base Actions** subtab
3. Click trash icon on any resource
4. Confirm deletion in dialog
5. Resource is deleted and list refreshes

### Bulk Deletion
1. Navigate to **Admin Panel** → **Base Resources** tab
2. Choose **Base Rules** or **Base Actions** subtab
3. Check boxes next to resources to delete
4. Or click "Select All" to select everything
5. Click "Delete Selected (X)" button
6. Confirm bulk deletion in dialog
7. All selected resources are deleted
8. Toast shows summary (e.g., "Deleted 5 rules, 1 failed")
9. List refreshes automatically

## Visual Design

### Resource Card Layout
```
┌─────────────────────────────────────────────────────┐
│ [✓] [📘] Rule Name    [🌐 Global] [ensemble] [social]│
│                                              [🗑️]    │
│     Description text here...                         │
│     [tag1] [tag2] [tag3]                            │
└─────────────────────────────────────────────────────┘
```

### Bulk Actions Bar
```
┌─────────────────────────────────────────────────────┐
│ [Select All]  5 of 10 selected    [Delete Selected] │
└─────────────────────────────────────────────────────┘
```

## Safety Features

**Confirmation Dialogs:**
- All deletions require explicit confirmation
- Dialogs clearly state the action and consequences
- Warning that deletion affects all worlds using the resource

**User Feedback:**
- Loading states during operations
- Success/error toast notifications
- Detailed error messages
- Progress indication for bulk operations

**Error Handling:**
- Network errors caught and displayed
- Partial success in bulk operations reported
- Failed deletions don't interrupt bulk operations
- Automatic refresh even on partial failure

## Empty State

When no base resources exist:
```
     ⚠️
No base rules found

Create base rules through the Import Data
modal or Create New Rule dialog
```

## Testing Checklist

- [ ] Single deletion works for base rules
- [ ] Single deletion works for base actions
- [ ] Bulk deletion works for multiple rules
- [ ] Bulk deletion works for multiple actions
- [ ] Select All / Deselect All functions correctly
- [ ] Confirmation dialogs show correct information
- [ ] Error handling displays user-friendly messages
- [ ] List refreshes after successful deletion
- [ ] Partial bulk deletion reports correct counts
- [ ] Empty state displays when no resources exist
- [ ] UI is responsive during operations
- [ ] Can't spam delete button (disabled during operation)

## Future Enhancements

### Potential Additions
- [ ] Search/filter base resources
- [ ] Sort by name, date, type, etc.
- [ ] Export selected resources
- [ ] Duplicate base resources
- [ ] Edit base resource metadata
- [ ] Preview base resource details
- [ ] Undo deletion (restore from trash)
- [ ] Archive instead of delete
- [ ] View which worlds use each base resource
- [ ] Batch import from file
- [ ] Template/preset library

### Performance Optimizations
- [ ] Virtualized scrolling for large lists
- [ ] Pagination for 100+ resources
- [ ] Optimistic UI updates
- [ ] Batch API calls for bulk operations
- [ ] Cache resource list

## Related Files

**Created:**
- `client/src/components/BaseResourcesManager.tsx` - New deletion component

**Modified:**
- `client/src/components/AdminPanel.tsx` - Integrated manager component

**API Endpoints:**
- `DELETE /api/rules/:id` - Delete a rule (base or world-specific)
- `DELETE /api/actions/:id` - Delete an action (base or world-specific)

## Related Documentation
- [Base Resources Fix](./BASE_RESOURCES_FIX.md) - Initial base resources implementation
- [API Consolidation](./API_CONSOLIDATION.md) - Unified API endpoints
- [Import Error Handling](./IMPORT_ERROR_HANDLING.md) - Import system improvements
