# Base Resources Tab Separation

## Overview
Separated base rules and base actions into their own tabs to avoid cluttering the main World Rules and World Actions views when there are many base resources.

## Changes Made

### HierarchicalRulesTab.tsx

**Added Tab Interface:**
- **World Rules Tab** - Shows only world-specific rules
- **Base Rules Tab** - Shows only base (global) rules enabled for this world

**Visual Distinction:**
- World rules: Standard primary color
- Base rules: Purple color with 🌐 badge and left border

**Tab Counts:**
- Shows count of rules in each tab: "World Rules (5)" / "Base Rules (12)"

**Empty States:**
- World tab: "No World-Specific Rules" - prompts to create first rule
- Base tab: "No Base Rules Enabled" - directs to Base Resources Configuration

**Benefits:**
- Cleaner UI - base rules don't clutter world-specific view
- Easier navigation when there are many base rules
- Clear visual separation between world and global content
- Still shows all content, just organized better

## ✅ Applied to Actions

The same pattern has been applied to `HierarchicalActionsTab.tsx`:

```typescript
<Tabs defaultValue="world">
  <TabsList className="grid w-full grid-cols-2 mb-4">
    <TabsTrigger value="world">
      <Sword className="w-4 h-4 mr-2" />
      World Actions ({actions.length})
    </TabsTrigger>
    <TabsTrigger value="base">
      <Globe className="w-4 h-4 mr-2" />
      Base Actions ({baseActions.filter(a => enabledBaseActionIds.includes(a.id)).length})
    </TabsTrigger>
  </TabsList>

  <TabsContent value="world">
    {/* World-specific actions */}
  </TabsContent>

  <TabsContent value="base">
    {/* Base actions */}
  </TabsContent>
</Tabs>
```

## Implementation Details

### State Added
```typescript
const [baseRules, setBaseRules] = useState<any[]>([]);
const [enabledBaseRuleIds, setEnabledBaseRuleIds] = useState<string[]>([]);
```

### Fetching Logic
```typescript
// Fetch base rules
const baseRulesRes = await fetch('/api/rules/base');
// Fetch world config to determine which are enabled
const configRes = await fetch(`/api/worlds/${worldId}/base-resources/config`);
```

### Tab Structure
- Uses shadcn/ui `Tabs` component
- Default to "world" tab (most common use case)
- Tabs are responsive and mobile-friendly
- Counts update dynamically

## User Experience

**Before:**
- All rules mixed together in one long list
- Hard to distinguish base from world-specific
- Overwhelming when many base rules exist

**After:**
- Clean separation into two tabs
- World tab shows only THIS world's rules
- Base tab shows global rules available to this world
- Counts help users understand scope
- Empty states guide next actions

## Related Files
- `client/src/components/HierarchicalRulesTab.tsx` - ✅ Updated with tabs
- `client/src/components/HierarchicalActionsTab.tsx` - ✅ Updated with tabs
- `client/src/components/BaseResourcesConfig.tsx` - Where users enable/disable base resources

## Summary

Both Rules and Actions now have clean tab separation:
- **World tab** shows only resources specific to the current world
- **Base tab** shows global resources available to all worlds
- Pink theme for base actions, purple theme for base rules
- Tab counts update dynamically
- Empty states guide users to next steps
- Better UX when dealing with many base resources

## Related Documentation
- [Base Resources Fix](./BASE_RESOURCES_FIX.md)
- [Base Resources Deletion](./BASE_RESOURCES_DELETION.md)
