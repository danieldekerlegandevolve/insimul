# Phase 4: Gold/Currency System & Fine Payment

## Overview
Phase 4 implements a gold/currency system and fine payment mechanics, making the economy feel tangible and giving players agency to manage their reputation through financial means.

## ✅ Implementation Summary

### Part 1: Gold/Currency System ✅
Player gold tracking with automatic deductions for fines.

### Part 2: Fine Payment System ✅
Interactive UI to pay off outstanding fines and restore reputation.

---

## Feature 1: Player Gold Tracking

### Implementation
**Location**: `BabylonWorld.tsx:291`

```typescript
const [playerGold, setPlayerGold] = useState<number>(100); // Starting gold
```

**Key Features**:
- Players start with 100 gold
- Gold persists throughout gameplay session
- Foundation for broader economy integration

### Gold Display in HUD
**Location**: `BabylonGUIManager.ts:237-309`

**UI Elements**:
- Gold text in player stats panel
- Bright gold color (#FFD700)
- Format: "Gold: X"
- Real-time updates

**Panel Layout**:
```
┌─ Player Status ────────┐
│ Ready                  │
│ ████████░░ 80 / 100    │ (Energy bar)
│ Gold: 50              │ (Gold display)
└────────────────────────┘
```

### Gold Integration
**Location**: `BabylonGUIManager.ts:32-37, 657-665`

```typescript
export interface PlayerStatus {
  energy: number;
  maxEnergy: number;
  status: string;
  gold?: number; // NEW
}
```

---

## Feature 2: Automatic Fine Deductions

### Implementation
**Location**: `BabylonWorld.tsx:1150-1155`

When fine penalty is applied:
```typescript
if (violationResult.penaltyApplied === 'fine') {
  setPlayerEnergy(prev => Math.max(0, prev - 20)); // Energy penalty
  setPlayerGold(prev => Math.max(0, prev - 50));   // Gold penalty (NEW!)
}
```

**Fine Economics**:
- **Cost**: 50 gold per fine
- **Minimum**: Gold cannot go below 0
- **Timing**: Deducted immediately when fine imposed

**Example Progression**:
1. Start: 100 gold
2. Violation #2 (Fine): 50 gold (-50g)
3. Violation #2 again: 0 gold (-50g, but capped at 0)

---

## Feature 3: Fine Payment System

### Pay Fines Button
**Location**: `BabylonGUIManager.ts:617-633`

**Button Specifications**:
- **Label**: "Pay Fines (Xg)" (dynamically shows fine amount)
- **Color**: Green (rgba(76, 175, 80, 0.8))
- **Size**: 200px × 28px
- **Visibility**: Hidden by default

**Show Conditions**:
```typescript
if (data.outstandingFines > 0 && !data.isBanned) {
  button.isVisible = true;
  button.text = `Pay Fines (${data.outstandingFines}g)`;
} else {
  button.isVisible = false;
}
```

**Hidden When**:
- No outstanding fines
- Player is banned (fines don't clear ban)

### Reputation Panel Layout (with Fines)

```
┌─ Reputation ────────────────┐
│ Brightkeep                  │ (Settlement name)
│ Unfriendly                  │ (Standing)
│ ██████░░░░ -15 / 100       │ (Rep bar)
│ ⚠ Violations: 2             │ (Warning text)
│ ┌─────────────────────┐     │
│ │ Pay Fines (50g)     │     │ (Green button)
│ └─────────────────────┘     │
└─────────────────────────────┘
```

### handlePayFines() Function
**Location**: `BabylonWorld.tsx:1177-1261`

**Flow**:
1. **Validation**:
   - Check if in a zone with reputation
   - Check if player has enough gold

2. **API Call**:
   ```typescript
   POST /api/playthroughs/{id}/reputations/settlement/{id}/pay-fines
   ```

3. **On Success**:
   - Deduct gold from player
   - Update reputation state
   - Clear outstanding fines
   - Slight reputation improvement
   - Show success toast

4. **Error Handling**:
   - "Insufficient Gold" - if player can't afford
   - "Payment Failed" - if API error
   - "Cannot Pay Fines" - if no active reputation

**Code Example**:
```typescript
const handlePayFines = useCallback(async () => {
  if (!currentZone || !playthroughId || !currentReputation) {
    toast({ title: "Cannot Pay Fines", ... });
    return;
  }

  const fineAmount = currentReputation.outstandingFines || 0;

  if (playerGold < fineAmount) {
    toast({ title: "Insufficient Gold", ... });
    return;
  }

  const response = await fetch(`/api/.../pay-fines`, { method: 'POST' });

  if (response.ok) {
    setPlayerGold(prev => prev - fineAmount);
    // Update reputation...
    toast({ title: "Fines Paid", ... });
  }
}, [currentZone, playthroughId, currentReputation, playerGold, toast]);
```

### Callback Wiring
**Location**: `BabylonWorld.tsx:363`

```typescript
guiManager.setOnPayFines(() => handlePayFines());
```

---

## Testing Instructions

### Test 1: Gold Display
1. Start game
2. Check player stats panel
3. **Expected**: "Gold: 100" displayed in gold color

### Test 2: Fine Deduction
1. Enter a settlement
2. Press **V** twice to trigger fine
3. **Expected**:
   - Gold drops to 50
   - Energy drops to 80
   - Reputation panel shows "Fine due: 50 gold"
   - Pay Fines button appears: "Pay Fines (50g)"

### Test 3: Fine Payment
1. Follow Test 2 to accrue a fine
2. Ensure you have 50+ gold
3. Click **Pay Fines (50g)** button
4. **Expected**:
   - Toast: "Fines Paid - Paid 50 gold..."
   - Gold decreases by 50
   - Outstanding fines clear to 0
   - Pay Fines button disappears
   - Reputation improves slightly

### Test 4: Insufficient Gold
1. Trigger 2 fines (need 100 gold to pay)
2. Start with only 50 gold
3. Click Pay Fines button
4. **Expected**:
   - Toast: "Insufficient Gold - You need 100 gold but only have 50"
   - Button remains visible
   - No changes to gold or reputation

### Test 5: Multi-Fine Scenario
1. Trigger fine #1 → Gold: 50, Fines: 50
2. Trigger fine #2 → Gold: 0, Fines: 100
3. Try to pay fines
4. **Expected**:
   - "Insufficient Gold" error
   - Player stuck until they earn more gold (future feature)

---

## API Integration

### Endpoint Used
```
POST /api/playthroughs/:id/reputations/settlement/:settlementId/pay-fines
```

**Request**:
- Headers: Authorization bearer token
- Body: (none required)

**Response** (on success):
```json
{
  "newScore": -5,
  "newStanding": "neutral",
  "outstandingFines": 0,
  "totalFinesPaid": 50,
  "message": "Fines paid. Reputation slightly restored."
}
```

**API Logic** (from `reputation-service.ts`):
1. Clear outstanding fines
2. Add 5-10 reputation points (slight improvement)
3. Recalculate standing
4. Return updated reputation

---

## Code Organization

### New State Variables
- `BabylonWorld.tsx:291` - `playerGold: number` (default: 100)

### New Functions
- `BabylonWorld.tsx:1177-1261` - `handlePayFines()` - Fine payment handler

### Modified Functions
- `BabylonWorld.tsx:1150-1155` - `handleViolation()` - Added gold deduction for fines
- `BabylonWorld.tsx:1600-1606` - Player status update hook - Added gold to GUI update
- `BabylonGUIManager.ts:617-633` - `createReputationPanel()` - Added Pay Fines button
- `BabylonGUIManager.ts:1049-1060` - `updateReputation()` - Button visibility logic

### New UI Elements
- `BabylonGUIManager.ts:298-305` - Gold text in player stats
- `BabylonGUIManager.ts:618-633` - Pay Fines button in reputation panel

### New Callbacks
- `BabylonGUIManager.ts:103` - `onPayFines` callback property
- `BabylonGUIManager.ts:1033-1035` - `setOnPayFines()` method
- `BabylonWorld.tsx:363` - Wire handlePayFines to GUI

---

## Economic Balance

### Starting Economy
- **Starting Gold**: 100
- **Fine Cost**: 50 per violation
- **Payment Benefit**: +5-10 reputation

### Progression Path
1. **Early Game** (100-200 gold):
   - Can afford 2 fines
   - Must be careful with violations
   - Reputation matters more

2. **Mid Game** (200-500 gold):
   - Can afford multiple fines
   - More freedom to make mistakes
   - Economic pressure reduced

3. **Late Game** (500+ gold):
   - Fines become trivial
   - Focus shifts to other systems
   - Need higher-tier penalties

### Balance Considerations
**Too Cheap** (< 25g per fine):
- Fines become meaningless
- No economic pressure
- Players ignore reputation

**Too Expensive** (> 100g per fine):
- Single fine is devastating
- Players stuck in debt
- Punishing rather than challenging

**Current Balance** (50g):
- Meaningful but not crippling
- 2 strikes before broke
- Encourages careful play

---

## Future Enhancements

### 1. Gold Earning Mechanics
**Quest Rewards**:
```typescript
onQuestComplete(questId) => {
  setPlayerGold(prev => prev + questReward);
  toast({ title: "Quest Reward: +50 gold!" });
}
```

**NPC Trading**:
- Sell items to merchants
- Buy items with gold
- Dynamic pricing based on reputation

**Daily Income**:
- Passive gold generation
- Based on player properties/investments
- Allows recovery from financial mistakes

### 2. Fine Payment Benefits
**Reputation Restoration**:
- Current: +5-10 reputation
- Enhanced: +20 reputation for paying promptly
- Bonus: Reduce violation count

**Discounts for Good Standing**:
```typescript
if (reputation.standing === 'revered') {
  fineAmount *= 0.5; // 50% discount
}
```

**Payment Plans**:
```typescript
payFinesInInstallments(amount, installments) => {
  // Pay 10g now, 40g later
  // Prevents total lockout
}
```

### 3. Bankruptcy System
**When Gold = 0**:
- Can't pay fines
- Reputation locked until payment
- Alternative: Work off debt through quests
- Community service system

**Debt Recovery**:
```typescript
interface DebtQuest {
  gold_reward: number;
  specifically_for_fines: boolean;
  auto_pay_fines: boolean; // Gold goes directly to fines
}
```

### 4. Advanced Economy
**Multiple Currencies**:
- Gold (common)
- Silver (minor transactions)
- Reputation points (social currency)

**Inflation/Deflation**:
- Fine costs scale with player wealth
- Percentage-based fines

**Investment System**:
- Buy property → Generate passive income
- Fund businesses → Get returns
- Long-term economic gameplay

### 5. Social Features
**Fines for Others**:
```typescript
payFinesFor(otherPlayerId) => {
  // Help friends
  // Improve relations
  // Unlock special content
}
```

**Bail System**:
- Pay to get unbanned friend
- Creates social bonds
- Cooperative gameplay

---

## Known Limitations

1. **No Gold Earning**: Players can only spend, not earn
   - **Impact**: Eventually run out of gold
   - **Workaround**: Start with enough for multiple fines
   - **Future**: Add quest rewards, trading

2. **No Persistent Storage**: Gold resets each session
   - **Impact**: Progress not saved
   - **Workaround**: Session-based gameplay only
   - **Future**: Integrate with playthrough save data

3. **Binary Visibility**: Button either shown or hidden
   - **Impact**: Can't see "disabled but present" state
   - **Workaround**: Clear messaging in warnings
   - **Future**: Disabled button with tooltip

4. **No Partial Payments**: All-or-nothing fine payment
   - **Impact**: Can't pay off part of fine
   - **Workaround**: Must have full amount
   - **Future**: Payment plans, installments

5. **Gold UI Not Animated**: Number changes instantly
   - **Impact**: Less satisfying feedback
   - **Workaround**: Toast notifications
   - **Future**: Smooth number transitions, particle effects

---

## Technical Details

### State Management
- Gold is React state (`useState`)
- Updates trigger GUI re-render
- Passed to GUI via `updatePlayerStatus`

### Minimum Values
- Gold cannot go below 0
- Enforced with `Math.max(0, prev - amount)`
- Prevents negative balances

### API Dependencies
- Requires `/pay-fines` endpoint
- Requires authentication token
- Requires valid playthrough ID

### UI Dependencies
- Button in reputation panel (visible when fines > 0)
- Gold display in player stats (always visible)
- Toast notifications for feedback

---

## Success Metrics

✅ **Core Features Implemented**:
- Player gold tracking ✅
- Gold display in HUD ✅
- Automatic fine deductions ✅
- Pay Fines button ✅
- handlePayFines function ✅
- Insufficient gold handling ✅
- Success/error notifications ✅

✅ **Integration Complete**:
- Gold deducted on fine penalty ✅
- Button shows/hides based on fines ✅
- API call to pay-fines endpoint ✅
- Reputation updated after payment ✅

✅ **UI/UX Polish**:
- Gold color (#FFD700) ✅
- Dynamic button label ✅
- Clear error messages ✅
- Success confirmation ✅

**Phase 4 Part 2 is complete!** Fine payment system fully operational.

---

## Faction/Country Reputation (API Support)

### Backend Support ✅
The reputation system already fully supports factions/countries via the API:

**Entity Types Supported**:
- `settlement` - Individual settlements (implemented in UI)
- `country` - Nations/countries (API only)
- `faction` - Player groups/factions (API only)
- `character` - Individual NPCs (API only)

### API Endpoints (All Entity Types)
```
GET    /api/playthroughs/:id/reputations
GET    /api/playthroughs/:id/reputations/:entityType/:entityId
POST   /api/playthroughs/:id/reputations/:entityType/:entityId/violate
POST   /api/playthroughs/:id/reputations/:entityType/:entityId/adjust
POST   /api/playthroughs/:id/reputations/:entityType/:entityId/pay-fines
GET    /api/playthroughs/:id/reputations/:entityType/:entityId/ban-status
```

**Example - Country Reputation**:
```typescript
// Get reputation with a country
GET /api/playthroughs/abc123/reputations/country/country-id-456

// Record violation against country
POST /api/playthroughs/abc123/reputations/country/country-id-456/violate
Body: { violationType: "smuggling", severity: "severe" }

// Pay fines to country
POST /api/playthroughs/abc123/reputations/country/country-id-456/pay-fines
```

### Future UI Enhancement
To fully expose faction/country reputation in the UI:

**Multi-Reputation Panel**:
```
┌─ Reputations ──────────────┐
│ Brightkeep (Settlement)    │
│ Friendly       ██████ 45   │
│                            │
│ Kingdom of Aethel (Country)│
│ Neutral        ███░░░ 0    │
│                            │
│ Thieves Guild (Faction)    │
│ Hostile        ██░░░░ -60  │
└────────────────────────────┘
```

**Implementation Steps**:
1. Fetch multiple reputations on zone entry
2. Expand reputation panel to show list
3. Track country/faction IDs in zone metadata
4. Update all relevant reputations on violations

**Complexity**: Medium - mostly UI changes, backend ready

---

## Files Modified

### BabylonWorld.tsx
- Line 291: Added `playerGold` state
- Lines 1150-1155: Gold deduction for fines
- Lines 1177-1261: `handlePayFines()` function
- Line 363: Wire up pay fines callback
- Lines 1600-1606: Pass gold to GUI update

### BabylonGUIManager.ts
- Lines 32-37: Added `gold` to PlayerStatus interface
- Line 103: Added `onPayFines` callback property
- Line 240: Increased reputation panel height to 160px
- Lines 298-305: Gold display in player stats
- Lines 617-633: Pay Fines button in reputation panel
- Lines 657-665: Update gold display
- Lines 1049-1060: Show/hide Pay Fines button logic
- Lines 1033-1035: `setOnPayFines()` method

### Total Lines Added: ~120 lines

---

## Changelog

### v1.0 - Phase 4 Part 1 (Gold System)
- Added player gold tracking (starting: 100)
- Added gold display in player stats HUD
- Automatic gold deduction for fine penalties
- Foundation for economic system

### v2.0 - Phase 4 Part 2 (Fine Payment)
- Pay Fines button in reputation panel
- handlePayFines function with full error handling
- Insufficient gold detection
- Reputation improvement on payment
- Success/error toast notifications
- Dynamic button label with fine amount
- Button visibility based on fines/ban status

**Phase 4 Complete!** Economy system operational.
