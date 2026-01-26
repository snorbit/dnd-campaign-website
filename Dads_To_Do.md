# Dad's To-Do List

## 🎲 Dice Roller Feature (Item #6 from CONTRIBUTING.md)

### Overview
Build an in-app dice rolling component with animations, modifiers, roll history, and campaign broadcast functionality.

### Requirements (from CONTRIBUTING.md)
- Multiple dice types (d4, d6, d8, d10, d12, d20, d100)
- Modifiers (+/- bonuses)
- Roll history
- Broadcast rolls to campaign

---

## Implementation Checklist

### Phase 1: Core Component
- [x] Create `components/shared/DiceRoller.tsx`
  - [x] Dice type selector UI
  - [x] Quantity input (1-20)
  - [x] Modifier input field
  - [x] Roll button
  - [x] Result display area
  - [x] Public/Private toggle

### Phase 2: Logic & Hooks
- [x] Create `components/shared/hooks/useDiceRoller.ts`
  - [x] Basic roll function (random number generation)
  - [x] Modifier calculation
  - [x] Advantage/Disadvantage for d20
  - [x] Roll history state management
  - [x] Roll formula parser

### Phase 3: Animations
- [x] Create `components/shared/DiceRoller.module.css`
  - [x] 3D dice rolling animation
  - [x] Bounce effect on result
  - [x] Critical hit/fail pulse animation
  - [x] Smooth transitions

### Phase 4: Roll History
- [x] History panel UI
  - [x] Display past rolls with timestamps
  - [x] Show formula and results
  - [x] Clear history button
  - [x] Scroll to latest roll

### Phase 5: Real-time Broadcast
- [x] Supabase real-time integration
  - [x] Create campaign-specific channel
  - [x] Broadcast public rolls
  - [x] Subscribe to roll events
  - [x] Display toast for incoming rolls
  - [x] Shared roll feed component

### Phase 6: Integration
- [x] Add to DM view (`app/dm/[campaignId]/page.tsx`)
  - [x] Floating action button
  - [x] Modal/drawer for dice roller
- [x] Add to Player view (`app/player/[campaignId]/page.tsx`)
  - [x] Same UI as DM view
  - [x] Access to campaign roll feed

### Phase 7: Testing
- [x] Unit tests for roll logic
- [x] Test advantage/disadvantage
- [x] Test modifier calculations
- [x] Manual testing on mobile
- [x] Accessibility testing
- [x] Real-time broadcast testing (2 browsers)

---

## Optional Enhancements (Future)
- [ ] Database persistence (`004_dice_rolls.sql` migration)
- [ ] Dice sound effects
- [ ] Custom dice themes/skins
- [ ] Saved roll presets (e.g., "Fireball: 8d6")
- [ ] Roll statistics dashboard

---

## Technical Notes

### Dice Roll Formula
- Format: `{quantity}d{sides} + {modifier}`
- Example: `2d6 + 3` = Roll 2 six-sided dice and add 3

### Advantage/Disadvantage (d20 only)
- **Advantage**: Roll 2d20, take the higher result
- **Disadvantage**: Roll 2d20, take the lower result

### Real-time Channel
- Channel name: `campaign:{campaignId}:dice`
- Event: `roll`
- Payload: `{ formula, results, total, rolledBy, timestamp }`

---

## Files to Create
1. `components/shared/DiceRoller.tsx` - Main component
2. `components/shared/hooks/useDiceRoller.ts` - Logic hook
3. `components/shared/DiceRoller.module.css` - Animations
4. `supabase/migrations/004_dice_rolls.sql` - Optional DB table

## Files to Modify
1. `app/dm/[campaignId]/page.tsx` - Add dice roller button
2. `app/player/[campaignId]/page.tsx` - Add dice roller button

---

## Priority
**Medium** - Fun feature that enhances gameplay but not critical for core functionality.

## Estimated Time
- Core functionality: 4-6 hours
- Animations & polish: 2-3 hours
- Real-time broadcast: 2-3 hours
- Testing: 1-2 hours
- **Total: ~10-14 hours**
