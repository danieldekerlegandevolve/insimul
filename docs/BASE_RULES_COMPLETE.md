# Base Rules & Actions System - COMPLETE ✅

**Date:** October 28, 2025  
**Status:** Fully Implemented  
**Integration:** Editor, Simulation, Admin Panel, World Management

## 🎉 System Overview

The Base Rules & Actions system allows you to create **global, reusable rules and actions** that can be used across all worlds in Insimul. These resources act as a foundational library of psychological, sociological, and behavioral patterns that can be enabled or disabled per-world.

## ✅ Completed Features

### 1. Storage Layer Implementation

**Files Modified:**
- `server/db/mongo-storage.ts`

**New Methods Added:**
```typescript
async getBaseRules(): Promise<Rule[]>
async getBaseRulesByCategory(category: string): Promise<Rule[]>
async getBaseActions(): Promise<Action[]>
async getBaseActionsByType(actionType: string): Promise<Action[]>
```

**Query Logic:**
- Filters for `isBase: true` AND `worldId: null`
- Returns only global resources

### 2. API Endpoints (6 Total)

**Base Rules:**
```bash
GET  /api/base-rules                      # Get all base rules
GET  /api/base-rules/category/:category   # Filter by category
```

**Base Actions:**
```bash
GET  /api/base-actions                    # Get all base actions
GET  /api/base-actions/type/:actionType   # Filter by type
```

**Per-World Configuration:**
```bash
GET  /api/worlds/:worldId/base-resources/config     # Get toggle settings
POST /api/worlds/:worldId/base-resources/toggle     # Toggle individual resources
```

### 3. Creation UI in Admin Panel

**Component:** `BaseResourceCreateDialog.tsx`

**Features:**
- Create base rules with:
  - Name, description
  - Rule type (trigger, volition, genealogy, trait, constraint)
  - Category (social, economic, emotional, physical, cognitive, cultural)
  - Insimul content
- Create base actions with:
  - Name, description
  - Action type (social, physical, verbal, emotional, economic, cognitive)
  - Category (interaction, movement, communication, emotion, transaction, decision)
- Form validation
- Success feedback
- Auto-refresh after creation

**Access:** Admin Panel → Base Resources tab → "Create Base Rule/Action" buttons

### 4. Per-World Toggle System

**Component:** `BaseResourcesConfig.tsx`

**Features:**
- View all available base rules and actions
- Toggle switches for each resource
- Visual indication (enabled/disabled)
- Real-time updates
- Category and type badges
- Default: All base resources enabled

**Configuration Storage:**
- Stored in `world.config` field
- Tracks `enabledBaseRules`, `disabledBaseRules`, `enabledBaseActions`, `disabledBaseActions`
- Empty config means all enabled (permissive by default)

**Access:** World Management → Base Resources tab

### 5. Editor Integration

**Component:** `HierarchicalRulesTab.tsx`

**Features:**
- Displays base rules in separate section
- **Visual Styling:**
  - Purple left border
  - Purple icon background
  - 🌐 "Base" badge
  - Different card styling
- **Sections:**
  - "Base Rules (Global)" - Shows enabled base rules
  - "World-Specific Rules" - Shows custom rules
- Respects per-world toggle settings
- Click to view details (shows "🌐 Base Rule" badge)

### 6. Simulation Integration

**Component:** `HierarchicalActionsTab.tsx`

**Features:**
- Displays base actions in separate section
- **Visual Styling:**
  - Pink left border
  - Pink icon background
  - 🌐 "Base" badge
  - Different card styling
- **Sections:**
  - "Base Actions (Global)" - Shows enabled base actions
  - "World-Specific Actions" - Shows custom actions
- Respects per-world toggle settings
- Available for character actions in simulations

## 📖 Usage Guide

### Creating a Base Rule

1. Navigate to **Admin Panel**
2. Click **"Base Resources"** tab
3. Click **"Create Base Rule"**
4. Fill in the form:
   - **Name:** "Politeness Protocol"
   - **Description:** "Characters use polite language with friends"
   - **Rule Type:** trigger
   - **Category:** social
   - **Content:**
     ```prolog
     Character(?speaker), Character(?listener),
     positive_relationship(?speaker, ?listener)
     => use_polite_language(?speaker, ?listener)
     ```
5. Click **"Create Base Rule"**

### Creating a Base Action

1. Navigate to **Admin Panel**
2. Click **"Base Resources"** tab
3. Click **"Create Base Action"**
4. Fill in the form:
   - **Name:** "Wave Hello"
   - **Description:** "Character waves at another character"
   - **Action Type:** social
   - **Category:** interaction
5. Click **"Create Base Action"**

### Configuring Base Resources for a World

1. Navigate to **World Management** for your world
2. Click **"Base Resources"** tab
3. Use switches to enable/disable specific resources:
   - **Enabled (Green):** Resource active in this world
   - **Disabled (Gray):** Resource inactive in this world

### Using Base Rules in Editor

1. Navigate to **Rules** tab in editor
2. See two sections:
   - **Base Rules (Global):** Purple-bordered cards with 🌐 badge
   - **World-Specific Rules:** Regular cards
3. Base rules show automatically based on world settings
4. Click any rule to view details

### Using Base Actions in Simulation

1. Navigate to **Actions** tab
2. See two sections:
   - **Base Actions (Global):** Pink-bordered cards with 🌐 badge
   - **World-Specific Actions:** Regular cards
3. Base actions available for character actions
4. Respects world's enabled/disabled settings

## 🎨 Visual Design

### Color Coding

| Resource Type | Color | Icon | Badge |
|--------------|-------|------|-------|
| Base Rules | Purple (#a855f7) | 📖 BookOpen | 🌐 Base |
| Base Actions | Pink (#ec4899) | ⚡ Zap | 🌐 Base |
| World-Specific | Blue (Primary) | Regular | None |

### UI Elements

**Base Rule Card:**
```
┌─────────────────────────────────────────┐
│ Purple border on left                   │
│ ┌─┐  Politeness Protocol                │
│ │📖│  🌐 Base  [trigger]  [social]      │
│ └─┘                                     │
│     Characters use polite language...   │
└─────────────────────────────────────────┘
```

**Base Action Card:**
```
┌─────────────────────────────────────────┐
│ Pink border on left                     │
│ ┌─┐  Wave Hello                         │
│ │⚡│  🌐 Base  [social]  [interaction]   │
│ └─┘                                     │
│     Character waves at another...       │
└─────────────────────────────────────────┘
```

## 🔧 Technical Architecture

### Data Flow

```
┌──────────────────┐
│   Admin Panel    │
│  Create Base     │  POST /api/rules (isBase: true, worldId: null)
│  Resources       ├──────────────────────────────────────────┐
└──────────────────┘                                          │
                                                              ▼
┌──────────────────┐                              ┌─────────────────┐
│  World Settings  │                              │   MongoDB       │
│  Toggle On/Off   │ POST /toggle                 │   Storage       │
│  Per World       ├─────────────────────────────►│  Base Resources │
└──────────────────┘                              └────────┬────────┘
                                                           │
┌──────────────────┐                                      │
│     Editor       │  GET /base-rules                     │
│  Display Rules   │  GET /worlds/:id/config              │
│  with Badges     │◄─────────────────────────────────────┘
└──────────────────┘                                      │
                                                          │
┌──────────────────┐                                     │
│   Simulation     │  GET /base-actions                  │
│  Use Actions     │  GET /worlds/:id/config             │
│  in Gameplay     │◄────────────────────────────────────┘
└──────────────────┘
```

### Configuration Schema

**World Config Object:**
```typescript
{
  config: {
    enabledBaseRules: ["rule_id_1", "rule_id_2"],
    disabledBaseRules: ["rule_id_3"],
    enabledBaseActions: ["action_id_1"],
    disabledBaseActions: ["action_id_2", "action_id_3"]
  }
}
```

**Logic:**
- If `disabledBaseRules` is empty: all base rules enabled
- If `disabledBaseRules` contains IDs: those rules disabled, rest enabled
- Same logic for actions

## 📊 Statistics

### Code Added
- **Backend:** ~160 lines (storage + API)
- **Frontend:** ~800 lines (3 components)
- **Total:** ~960 lines

### Components Created
1. `BaseResourceCreateDialog.tsx` - Creation UI (270 lines)
2. `BaseResourcesConfig.tsx` - Toggle UI (235 lines)
3. Updated `HierarchicalRulesTab.tsx` - Rules integration (~100 lines added)
4. Updated `HierarchicalActionsTab.tsx` - Actions integration (~100 lines added)

### Files Modified
- `server/db/mongo-storage.ts` - Storage methods
- `server/routes.ts` - API endpoints
- `client/src/components/AdminPanel.tsx` - Creation buttons
- `client/src/components/WorldManagementTab.tsx` - Toggle tab
- `client/src/components/HierarchicalRulesTab.tsx` - Rules display
- `client/src/components/HierarchicalActionsTab.tsx` - Actions display

## 🚀 Benefits

### For World Creators
- **Reusability:** Don't recreate common rules for every world
- **Quick Start:** New worlds come with sensible behavioral defaults
- **Customization:** Can disable what doesn't fit the world theme
- **Consistency:** Same social behaviors across similar worlds

### For Teams
- **Collaboration:** Share a library of tested rules
- **Standards:** Establish canonical behavioral patterns
- **Quality:** Well-documented, reusable components
- **Efficiency:** Focus on world-specific content

### For Researchers
- **Reproducibility:** Same base rules across experiments
- **Modularity:** Test with/without specific rule sets
- **Documentation:** Well-documented psychological patterns
- **Comparison:** Easy to compare worlds with same base

## 🔮 Future Enhancements

### Potential Additions
1. **Import/Export:** Share base resource libraries
2. **Templates:** Pre-built sets (medieval pack, sci-fi pack)
3. **Versioning:** Track changes to base resources
4. **Analytics:** See which base resources are most used
5. **Dependencies:** Base rules that depend on other base rules
6. **Bulk Operations:** Enable/disable entire categories at once

## 🎯 Testing Checklist

- [x] Create base rule via Admin Panel
- [x] Create base action via Admin Panel
- [x] View base rules in Editor
- [x] View base actions in Actions tab
- [x] Toggle base rule on/off for a world
- [x] Toggle base action on/off for a world
- [x] Verify disabled resources don't show in Editor
- [x] Verify disabled resources don't show in Actions
- [x] Create world-specific rule (still works)
- [x] Create world-specific action (still works)
- [x] View base resource in detail view
- [x] See proper badges and styling

## 📝 Related Documentation

- `docs/BASE_RULES_AND_ACTIONS.md` - Original specification
- `docs/BASE_RULES_IMPLEMENTATION.md` - Implementation guide
- `shared/schema.ts` - Database schema
- `server/db/storage.ts` - IStorage interface

## ✅ Summary

The Base Rules & Actions system is **fully implemented and ready for production use**. Users can now:

1. ✅ Create global base rules and actions in Admin Panel
2. ✅ Toggle them on/off per world in World Management
3. ✅ See them displayed with special styling in Editor
4. ✅ Use them in simulations alongside world-specific resources
5. ✅ Build a reusable library of behavioral patterns

**The system maintains Insimul's permissive philosophy** - all base resources are enabled by default, but users have full control to customize per world.

---

**Status:** COMPLETE ✅  
**Ready for:** Production Use  
**Next Steps:** Create base resource libraries for common scenarios (fantasy, sci-fi, modern, etc.)
