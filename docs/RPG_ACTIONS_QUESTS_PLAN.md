# RPG Actions & Quests Implementation Plan

## Overview
Integrate the actions and quests systems into the Insimul Explore World (RPG) test game with distinct UX for each action category and a quest tracking system.

## Current State
The RPG game already:
- ✅ Loads actions, baseActions, and quests from API
- ✅ Has basic NPC interaction via SPACE key
- ✅ Displays dialogue system
- ✅ Tracks player movement and position
- ✅ Shows nearby NPCs with visual indicators

## Action Categories & UX Design

### 1. **Social Actions** (actionType: "social")
Examples: Greet, Compliment, Ask Question, Tell Joke, Gossip, Apologize

**UX Pattern: Dialogue-Based**
- Triggered during NPC conversations
- Appears as dialogue choices in conversation UI
- Shows relationship effects preview
- Visual: Speech bubble icon, relationship hearts/bars

**Implementation:**
```typescript
interface SocialActionUI {
  display: "dialogue-choice"
  icon: "💬"
  showRelationshipImpact: true
  requiresTarget: true
  targetType: "character"
}
```

### 2. **Mental Actions** (actionType: "mental")
Examples: Plan, Recall Memory, Analyze Situation, Meditate, Study, Focus

**UX Pattern: Thought Bubble Menu**
- Accessible via TAB key or thought bubble icon
- Radial/circular menu around player
- Shows cooldowns and energy costs
- Visual: Brain icon, thought bubble, concentration effects

**Implementation:**
```typescript
interface MentalActionUI {
  display: "radial-menu"
  icon: "🧠"
  position: "around-player"
  showCooldown: true
  showEnergyCost: true
}
```

### 3. **Combat Actions** (actionType: "combat")
Examples: Attack, Defend, Dodge, Cast Spell, Use Item, Flee

**UX Pattern: Action Bar / Hotkeys**
- Action bar at bottom of screen
- Number keys 1-9 for hotbar slots
- Shows cooldowns, damage, range
- Visual: Sword icon, combat indicators, hit effects

**Implementation:**
```typescript
interface CombatActionUI {
  display: "action-bar"
  icon: "⚔️"
  hotkey: number
  showRange: true
  showDamage: true
  combatOnly: true
}
```

### 4. **Movement Actions** (actionType: "movement")
Examples: Walk, Run, Jump, Teleport, Climb, Hide, Sneak

**UX Pattern: Context-Sensitive Prompts**
- Automatic WASD/Arrow keys for basic movement
- Context prompts for special movement (E to climb, SHIFT to run)
- Visual indicators on interactable objects
- Visual: Footsteps icon, movement trails

**Implementation:**
```typescript
interface MovementActionUI {
  display: "context-prompt"
  icon: "👟"
  autoTrigger: boolean
  contextKey: string // "E", "SHIFT", etc.
  showOnHover: true
}
```

### 5. **Economic Actions** (actionType: "economic")
Examples: Trade, Buy, Sell, Barter, Give Gift, Request Loan

**UX Pattern: Trade Window**
- Opens trade interface when near merchant/NPC
- Shows inventory, prices, currency
- Drag-and-drop or click to trade
- Visual: Coin icon, shop interface

**Implementation:**
```typescript
interface EconomicActionUI {
  display: "trade-window"
  icon: "💰"
  showInventory: true
  showPrices: true
  requiresTarget: true
  targetType: "merchant" | "character"
}
```

## Quest System Design

### Quest Indicators
- **Quest Giver:** Yellow exclamation mark (!) above NPC
- **Quest Available:** Gold sparkles around NPC
- **Quest In Progress:** Yellow question mark (?) above NPC
- **Quest Complete:** Green checkmark (✓) above NPC

### Quest UI Components

#### 1. Quest Log (Press Q)
```
╔══════════════════════════════════════╗
║  📜 Quest Log                        ║
╠══════════════════════════════════════╣
║  Active Quests (3)                   ║
║  ✓ Talk to 3 merchants   [3/3]      ║
║  ○ Explore the Forest    [Started]  ║
║  ○ Defeat 5 Wolves       [2/5]      ║
║                                      ║
║  Completed Quests (1)                ║
║  ✓ Welcome to the World             ║
╚══════════════════════════════════════╝
```

#### 2. Quest Tracker (Always Visible)
```
┌─────────────────────────────┐
│ 📌 Active Quests            │
├─────────────────────────────┤
│ ○ Talk to merchants [2/3]   │
│ ○ Defeat wolves [2/5]       │
└─────────────────────────────┘
```

#### 3. Quest Dialog Integration
When talking to quest giver:
```
💬 John Smith

[!] I need your help with something...

> Accept Quest: "Gather Herbs"
> Ask about quest details
> Decline
```

## Implementation Architecture

### 1. Action System

#### ActionManager Class
```typescript
class ActionManager {
  availableActions: Action[]
  activeActions: Map<string, ActionState>
  
  getActionsByCategory(category: string): Action[]
  canPerformAction(actionId: string, context: GameContext): boolean
  performAction(actionId: string, target?: Entity): Promise<ActionResult>
  getUIConfig(category: string): ActionUIConfig
  updateCooldowns(deltaTime: number): void
}
```

#### Action Execution Flow
1. Player triggers action (key press, UI click, context)
2. ActionManager validates prerequisites
3. Check energy, cooldown, range, target
4. Execute action effects
5. Update game state
6. Show visual feedback
7. Start cooldown timer

### 2. Quest System

#### QuestManager Class
```typescript
class QuestManager {
  activeQuests: Quest[]
  completedQuests: Quest[]
  availableQuests: Quest[]
  
  getQuestsForNPC(npcId: string): Quest[]
  acceptQuest(questId: string): void
  updateQuestProgress(questId: string, objectiveId: string, amount: number): void
  completeQuest(questId: string): QuestReward
  checkQuestCompletion(questId: string): boolean
}
```

#### Quest Progression
1. NPC offers quest (shows ! indicator)
2. Player talks to NPC → Quest dialog appears
3. Player accepts → Quest added to active list
4. Track objectives automatically during gameplay
5. When complete → Show notification, NPC shows ✓
6. Return to NPC → Claim rewards

## UI Layout

### Full Game UI with Actions & Quests
```
┌─────────────────────────────────────────────────────────────┐
│ HP: ████████░░  Energy: ██████░░░░  Gold: 150              │
├──────────────────┬──────────────────────────────────────────┤
│ 📌 Quest Tracker │                                          │
│ ┌──────────────┐ │                                          │
│ │ Active (2)   │ │         [Game Canvas]                   │
│ │ ○ Quest 1    │ │                                          │
│ │ ○ Quest 2    │ │                                          │
│ └──────────────┘ │                                          │
│                  │                                          │
│ 💭 Quick Actions │                                          │
│ [Tab] Think     │                                          │
│ [E] Interact     │                                          │
│ [Q] Quests      │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ ⚔️ [1] Attack  🛡️ [2] Defend  ✨ [3] Skill  💰 [4] Trade  │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
client/src/components/rpg/
├── RPGGame.tsx                    (main component - existing)
├── actions/
│   ├── ActionManager.ts          (action system logic)
│   ├── ActionBar.tsx              (combat actions hotbar)
│   ├── ActionRadialMenu.tsx      (mental actions menu)
│   ├── DialogueActions.tsx       (social actions in dialogue)
│   ├── ContextActions.tsx        (movement actions prompts)
│   └── TradeWindow.tsx            (economic actions interface)
├── quests/
│   ├── QuestManager.ts           (quest system logic)
│   ├── QuestLog.tsx               (full quest log UI)
│   ├── QuestTracker.tsx          (mini tracker always visible)
│   ├── QuestIndicators.tsx       (!, ?, ✓ above NPCs)
│   └── QuestDialog.tsx            (quest offer/complete UI)
└── types/
    ├── actions.ts                 (action interfaces)
    └── quests.ts                  (quest interfaces)
```

## Key Bindings

| Key | Action |
|-----|--------|
| WASD / Arrows | Movement |
| SPACE | Talk / Interact |
| E | Context Action (climb, open, etc.) |
| Q | Open Quest Log |
| TAB | Mental Actions Menu |
| 1-9 | Combat Action Hotbar |
| SHIFT | Run (movement action) |
| ESC | Close UI / Cancel |

## Implementation Phases

### Phase 1: Core Action System ✅ NEXT
- [ ] Create ActionManager class
- [ ] Load actions from worldData
- [ ] Filter actions by category
- [ ] Basic action execution (social actions in dialogue)
- [ ] Show available actions when talking to NPC

### Phase 2: Action UX by Category
- [ ] Social: Dialogue choice buttons
- [ ] Mental: Radial menu (TAB key)
- [ ] Combat: Action bar at bottom
- [ ] Movement: Context prompts
- [ ] Economic: Trade window

### Phase 3: Quest System
- [ ] Create QuestManager class
- [ ] Quest indicators above NPCs (!, ?, ✓)
- [ ] Quest acceptance dialog
- [ ] Quest log UI (Q key)
- [ ] Quest tracker (always visible)

### Phase 4: Quest Progression
- [ ] Track quest objectives automatically
- [ ] Update quest progress during actions
- [ ] Quest completion detection
- [ ] Quest rewards and notifications
- [ ] Integration with actions (quest-required actions)

### Phase 5: Polish & Integration
- [ ] Visual effects for action feedback
- [ ] Sound effects (placeholder)
- [ ] Cooldown animations
- [ ] Energy cost display
- [ ] Action tooltips (hover for details)
- [ ] Quest waypoint markers

## Example: Social Action Flow

```
1. Player near NPC → Shows 💬 indicator
2. Player presses SPACE → Dialogue opens
3. Dialogue shows:
   ┌─────────────────────────────┐
   │ 💬 Marie (Merchant)         │
   ├─────────────────────────────┤
   │ "Hello traveler!"           │
   │                              │
   │ What do you want to do?     │
   │                              │
   │ > 💬 Greet warmly           │
   │ > 🤔 Ask about quests       │
   │ > 💰 Trade goods            │
   │ > 👋 Say goodbye            │
   └─────────────────────────────┘
4. Player clicks "Greet warmly" (social action)
5. Action executes:
   - Check prerequisites ✓
   - Apply effects: +5 relationship
   - Show feedback: "Marie smiles warmly"
   - Update NPC dialogue state
6. Continue conversation
```

## Example: Quest Flow

```
1. NPC with quest shows ! above head (gold)
2. Player talks to NPC
3. Quest dialog appears:
   ┌─────────────────────────────────┐
   │ [!] New Quest Available         │
   ├─────────────────────────────────┤
   │ "Gather Forest Herbs"           │
   │                                  │
   │ Objectives:                     │
   │ • Collect 5 Red Mushrooms       │
   │ • Collect 3 Blue Flowers        │
   │                                  │
   │ Rewards:                        │
   │ • 50 Gold                       │
   │ • 100 XP                        │
   │ • Herbalist's Pouch (item)     │
   │                                  │
   │ [Accept Quest] [Decline]        │
   └─────────────────────────────────┘
4. Player accepts quest
5. Quest added to tracker (top right)
6. As player explores:
   - Find mushroom → "Red Mushrooms: 1/5"
   - Notification appears briefly
7. Complete all objectives
8. Return to NPC (shows ✓ indicator)
9. Talk to NPC → Claim rewards
10. Quest marked complete in log
```

## Technical Considerations

### Performance
- Limit action checks to nearby entities only
- Cache available actions per frame
- Debounce quest progress updates
- Use RequestAnimationFrame for action animations

### State Management
- Store action cooldowns in game state
- Track quest progress in separate state
- Sync action effects with backend
- Local state for UI, sync to server on actions

### Extensibility
- Plugin architecture for new action categories
- Custom action renderers via strategy pattern
- Quest templates for easy content creation
- Mod support for community actions/quests

## Testing Checklist

### Actions
- [ ] Social actions appear in NPC dialogue
- [ ] Mental actions accessible via TAB
- [ ] Combat actions on hotbar
- [ ] Movement actions trigger on context
- [ ] Economic actions open trade window
- [ ] Action cooldowns work correctly
- [ ] Energy costs deducted properly
- [ ] Action prerequisites enforced
- [ ] Action effects applied to game state
- [ ] Visual feedback shows for all actions

### Quests
- [ ] Quest indicators show correctly (!, ?, ✓)
- [ ] Quest log opens with Q key
- [ ] Quest tracker updates in real-time
- [ ] Quest acceptance works
- [ ] Quest objectives track automatically
- [ ] Quest completion detected
- [ ] Quest rewards granted
- [ ] Multiple quests can be active
- [ ] Completed quests stay in log
- [ ] Quest waypoints guide player (if implemented)

## Future Enhancements

### Advanced Actions
- Action combos (chaining actions)
- Contextual action suggestions (AI)
- Custom action creation in editor
- Action macros (sequence of actions)

### Advanced Quests
- Branching quest paths
- Timed quests (must complete by timestep X)
- Repeatable daily/weekly quests
- Quest chains (one leads to next)
- Hidden/secret quests
- Dynamic quest generation based on world state

### Multiplayer
- Shared quests (party quests)
- Competitive quests (race to complete)
- Trade actions between players
- Social actions affect all players' relationships

---

**Status:** Planning Complete  
**Next Step:** Implement Phase 1 (Core Action System)  
**Priority:** High  
**Estimated Time:** Phase 1 = 4-6 hours
