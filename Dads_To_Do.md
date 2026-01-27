# 🎯 Dad's Implementation Plan: Initiative Tracker (Item #8)

## Overview
The **Initiative Tracker** is a combat management tool for DMs to track turn order, HP, and conditions during D&D encounters. This integrates with the existing Encounters system and provides a streamlined combat experience.

---

## 📋 Feature Requirements (from CONTRIBUTING.md)

- **Add players/monsters** to the initiative order
- **Track turn order** with automatic sorting by initiative
- **HP tracking** during combat
- **Condition/status effects** (e.g., poisoned, stunned, prone)

---

## 🏗️ Architecture Overview

### Files to Create

| File | Purpose |
|------|---------|
| `components/dm/InitiativeTracker.tsx` | Main UI component |
| `components/dm/InitiativeTracker.module.css` | Component styling |
| `components/shared/hooks/useInitiativeTracker.ts` | Combat logic hook |
| `lib/initiative-data/conditions.ts` | D&D 5e condition definitions |

### Integration Points

- **EncountersTab.tsx** - Add "Start Combat" button that opens the Initiative Tracker
- **campaign_state** table - Store initiative data in existing JSONB structure

---

## 📊 Data Models

### `InitiativeCombatant` Interface
```typescript
interface InitiativeCombatant {
    id: string;
    name: string;
    type: 'player' | 'enemy' | 'ally';
    initiative: number;
    dexModifier?: number;  // For tie-breaking
    hpCurrent: number;
    hpMax: number;
    ac: number;
    conditions: Condition[];
    notes?: string;
    isVisible?: boolean;  // For hidden enemies
}
```

### `Condition` Interface
```typescript
interface Condition {
    id: string;
    name: string;
    icon: string;
    description: string;
    endTrigger?: 'start_of_turn' | 'end_of_turn' | 'manual';
    duration?: number;  // Rounds remaining, -1 = indefinite
}
```

### `InitiativeState` Interface
```typescript
interface InitiativeState {
    combatants: InitiativeCombatant[];
    currentTurn: number;  // Index in sorted array
    round: number;
    isActive: boolean;
    encounterId?: string;  // Link to parent encounter
}
```

---

## 🔧 Implementation Steps

### Phase 1: Data Layer (lib/initiative-data/)

#### Step 1.1: Create Conditions Data File
**File:** `lib/initiative-data/conditions.ts`

Define all D&D 5e conditions:
- Blinded, Charmed, Deafened, Exhaustion (1-6)
- Frightened, Grappled, Incapacitated, Invisible
- Paralyzed, Petrified, Poisoned, Prone
- Restrained, Stunned, Unconscious

Include for each:
- Name and icon (Lucide icons)
- Description (from PHB)
- Mechanical summary
- Common end triggers

---

### Phase 2: Hook Development (components/shared/hooks/)

#### Step 2.1: Create useInitiativeTracker Hook
**File:** `components/shared/hooks/useInitiativeTracker.ts`

##### State Management
```typescript
const [combatants, setCombatants] = useState<InitiativeCombatant[]>([]);
const [currentTurn, setCurrentTurn] = useState(0);
const [round, setRound] = useState(1);
const [isActive, setIsActive] = useState(false);
```

##### Core Functions to Implement

| Function | Description |
|----------|-------------|
| `addCombatant(combatant)` | Add player/enemy to initiative |
| `removeCombatant(id)` | Remove from initiative |
| `rollInitiative(id)` | Roll d20 + dex modifier |
| `rollAllInitiative()` | Auto-roll for all enemies |
| `setInitiative(id, value)` | Manual initiative entry |
| `sortByInitiative()` | Sort combatants descending |
| `nextTurn()` | Advance to next combatant |
| `previousTurn()` | Go back one turn |
| `updateHP(id, delta)` | Damage/heal a combatant |
| `addCondition(id, condition)` | Apply condition with duration |
| `removeCondition(id, conditionId)` | Remove a condition |
| `tickConditions()` | Process duration-based effects |
| `startCombat()` | Begin combat, reset round to 1 |
| `endCombat()` | Clean up and close tracker |

##### Utility Functions

| Function | Description |
|----------|-------------|
| `getActiveCombatant()` | Return current turn's combatant |
| `getSortedCombatants()` | Return initiative-sorted list |
| `getHealthPercentage(id)` | Calculate HP bar width |
| `isBloodied(id)` | True if HP <= 50% |
| `isDead(id)` | True if HP <= 0 |

---

### Phase 3: UI Component (components/dm/)

#### Step 3.1: Create InitiativeTracker.tsx

##### Component Structure
```
InitiativeTracker
├── Header
│   ├── Round Counter
│   ├── Combat Controls (Start/End/Reset)
│   └── Add Combatant Button
├── Initiative List
│   ├── CombatantRow (map)
│   │   ├── Turn Indicator (highlight current)
│   │   ├── Initiative Score
│   │   ├── Name & Type Icon
│   │   ├── HP Bar & Controls
│   │   ├── AC Display
│   │   ├── Condition Badges
│   │   └── Action Buttons
│   └── Empty State
├── Quick Add Panel
│   ├── Add Player (from campaign)
│   ├── Add Enemy (manual/from encounter)
│   └── Add Custom
└── Condition Modal
    ├── Condition Grid
    ├── Duration Selector
    └── Apply/Cancel Buttons
```

##### Key UI Features

1. **Turn Highlighting**
   - Current combatant has glowing border
   - On-deck combatant has subtle indicator
   - Dead/unconscious combatants grayed out

2. **HP Controls**
   - Click HP to edit inline
   - Quick damage/heal buttons (+/- 1, 5, 10)
   - Color-coded HP bar:
     - Green: > 50%
     - Yellow: 25-50%
     - Red: < 25%
     - Gray: Dead (0)

3. **Condition Management**
   - Icon badges on combatant row
   - Hover for condition description
   - Click to remove or edit duration
   - Auto-prompt at turn start/end

4. **Drag & Drop (Optional/Future)**
   - Reorder for manual initiative adjustments

---

### Phase 4: Styling (InitiativeTracker.module.css)

#### Color Palette
```css
/* Player colors */
--player-bg: hsl(210, 30%, 25%);
--player-border: hsl(210, 60%, 50%);

/* Enemy colors */
--enemy-bg: hsl(0, 30%, 25%);
--enemy-border: hsl(0, 60%, 50%);

/* Ally colors */
--ally-bg: hsl(120, 30%, 25%);
--ally-border: hsl(120, 60%, 50%);

/* Current turn */
--active-glow: 0 0 20px rgba(234, 179, 8, 0.5);
```

#### Key Animations
- Turn transition (slide/fade)
- HP bar smooth transitions
- Condition badge pulse on add
- Next turn button pulse

---

### Phase 5: Integration

#### Step 5.1: Update EncountersTab.tsx
- Add "Combat Mode" button to active encounter
- Pass enemy data to InitiativeTracker
- Save initiative state back to campaign_state

#### Step 5.2: Add Players Integration
- Pull player data from `campaign_players` table
- Show players with their characters
- Use character DEX score for modifier

#### Step 5.3: Persistence
- Save state to `campaign_state.initiative` JSONB field
- Auto-save on each action
- Restore on page refresh
- Optional: Real-time sync for player visibility

---

## 📦 Dependencies

### Existing (No new packages needed)
- `lucide-react` - Icons for conditions
- `sonner` - Toast notifications
- `@/lib/supabase` - Data persistence

### Optional Enhancements
- `@dnd-kit/sortable` - Drag and drop (future)
- `framer-motion` - Smooth animations (future)

---

## 🎨 UX Considerations

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` / `N` | Next turn |
| `Backspace` / `B` | Previous turn |
| `D` | Quick damage dialog |
| `H` | Quick heal dialog |
| `C` | Add condition |
| `Esc` | Close modals |

### Accessibility
- All controls keyboard accessible
- ARIA labels for screen readers
- Color not sole indicator (icons + text)
- Focus management on turn change

---

## 🧪 Testing Checklist

- [x] Add single player
- [x] Add single enemy
- [x] Add multiple combatants
- [x] Roll initiative for one
- [x] Roll initiative for all
- [x] Manual initiative entry
- [x] Sort by initiative
- [x] Next turn cycles correctly
- [x] Previous turn works
- [x] Round counter increments
- [x] Damage reduces HP
- [x] Healing increases HP (max cap)
- [x] HP bar color changes
- [x] Death at 0 HP
- [x] Add condition
- [x] Remove condition
- [x] Condition duration decrements
- [x] Start combat
- [x] End combat
- [x] State persists on refresh
- [x] Works with existing encounters

---

## 📈 Future Enhancements (Out of Scope)

1. **Player View** - Players see simplified tracker on their screen
2. **Lair Actions** - Special turn at initiative 20
3. **Legendary Actions** - Track usage between turns
4. **Concentration** - Track concentration spells
5. **Roll History** - Log all initiative rolls
6. **Encounter Analytics** - Damage dealt/taken per combatant
7. **Templates** - Save enemy stat blocks for reuse

---

## ⏱️ Estimated Timeline

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Data Layer | 1-2 hours |
| Phase 2: Hook Development | 3-4 hours |
| Phase 3: UI Component | 4-6 hours |
| Phase 4: Styling | 2-3 hours |
| Phase 5: Integration | 2-3 hours |
| Testing & Polish | 2-3 hours |
| **Total** | **14-21 hours** |

---

## 🚀 Getting Started

1. [x] Create the `lib/initiative-data/` directory
2. [x] Implement `conditions.ts` with D&D 5e conditions
3. [x] Create the `useInitiativeTracker` hook shell
4. [x] Build the basic UI layout
5. [x] Implement add/remove combatants
6. [x] Add initiative rolling
7. [x] Implement turn tracking
8. [x] Add HP management
9. [x] Add condition system
10. [x] Integrate with EncountersTab
11. [x] Test thoroughly!

---

*Last Updated: 2026-01-27*
*Status: ✅ Implementation Complete - Integrated and Persistent*
