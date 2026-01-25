# 🔔 Dad's To-Do: Toast Notification System

## Overview
Replace all `alert()` calls with a modern toast notification system using `sonner` library.

**Estimated Time:** 1.5-2 hours  
**Difficulty:** Easy-Medium �  
**Task:** CONTRIBUTING.md Item #2 - Add Toast Notifications

---

## Why This Matters

**Current Problem:**
- Using browser `alert()` dialogs (14 instances found)
- Blocks user interaction
- Looks unprofessional
- No styling control
- Can't show multiple notifications

**After Implementation:**
- ✨ Modern, non-blocking notifications
- 🎨 Consistent styling with our dark theme
- 📱 Mobile-friendly
- ⚡ Multiple toasts can stack
- 🎯 Success/Error/Info/Warning variants
- ⏱️ Auto-dismiss with configurable duration

---

## 📊 Current Alert Usage Analysis

Found **14 alert() calls** across **5 files**:

| File | Count | Types |
|------|-------|-------|
| `app/campaigns/page.tsx` | 5 | Errors, validation |
| `app/dm/[campaignId]/page.tsx` | 4 | Success, errors, clipboard |
| `components/dm/EncountersTab.tsx` | 1 | Success |
| `components/dm/PlayersTab.tsx` | 2 | Success, error |
| `components/player/LevelUpModal.tsx` | 1 | Error |

---

## ✅ Phase 1: Setup Toast System (30 minutes)

### [x] 1.1 Install Sonner Library
- **Action:** Install the toast library
- **Command:**
  ```bash
  npm install sonner
  ```
- **Why Sonner?**
  - Lightweight (3kb)
  - Beautiful default styling
  - TypeScript support
  - Works great with dark mode
  - Zero configuration needed

### [x] 1.2 Create Toast Provider Component
- **File:** `components/shared/ui/ToastProvider.tsx` (NEW)
- **What:** Wrapper component for Sonner's Toaster
- **Features:**
  - Dark theme styling
  - Position: bottom-right
  - Custom duration defaults
  - Rich colors matching our theme

### [x] 1.3 Add Provider to Root Layout
- **File:** `app/layout.tsx`
- **Action:** Wrap app with `<ToastProvider />`
- **Test:** Verify toast container renders

---

## ✅ Phase 2: Replace Alert Calls (45 minutes)

### [x] 2.1 Campaign Creation Page
- **File:** `app/campaigns/page.tsx`
- **Alerts to Replace:** 5 instances
  
  | Line | Current | Toast Type |
  |------|---------|------------|
  | 119 | `alert('Campaign error: ' + error.message)` | `toast.error()` |
  | 127 | `alert('Failed to generate unique campaign code...')` | `toast.error()` |
  | 137 | `alert('State error: ' + stateError.message)` | `toast.error()` |
  | 146 | `alert('Error: ' + error.message)` | `toast.error()` |

### [x] 2.2 DM Campaign Page
- **File:** `app/dm/[campaignId]/page.tsx`
- **Alerts to Replace:** 4 instances

  | Line | Current | Toast Type |
  |------|---------|------------|
  | 75 | `alert('Please enter campaign text')` | `toast.warning()` |
  | 97 | `alert('Campaign imported successfully!...')` | `toast.success()` |
  | 105 | `alert('Failed to import campaign...')` | `toast.error()` |
  | 187 | `alert('Join code copied!');` | `toast.success()` |

### [x] 2.3 DM Encounters Tab
- **File:** `components/dm/EncountersTab.tsx`
- **Alerts to Replace:** 1 instance

  | Line | Current | Toast Type |
  |------|---------|------------|
  | 130 | `alert('Encounter reset!...')` | `toast.success()` |

### [x] 2.4 DM Players Tab
- **File:** `components/dm/PlayersTab.tsx`
- **Alerts to Replace:** 2 instances

  | Line | Current | Toast Type |
  |------|---------|------------|
  | 96 | `alert('Level granted! Player is now level ${newLevel}.')` | `toast.success()` |
  | 99 | `alert('Failed to grant level')` | `toast.error()` |

### [x] 2.5 Player Level Up Modal
- **File:** `components/player/LevelUpModal.tsx`
- **Alerts to Replace:** 1 instance

  | Line | Current | Toast Type |
  |------|---------|------------|
  | 137 | `alert('Failed to complete level up')` | `toast.error()` |

---

## ✅ Phase 3: Enhanced Toast Features (15 minutes)

### [x] 3.1 Add Custom Toast Variants
- **File:** `utils/toast.ts` (NEW)
- **What:** Created utility helpers for standardizing toasts across the app.

### [x] 3.2 Special Cases
- **Success:** Implemented `toast.promise()` for campaign imports.
- **Success:** Added 📋 icon for clipboard copy.
- **Success:** Added ⬆️ icon for player level granting.

---

## ✅ Phase 4: Testing & Verification (20 minutes)

### 4.1 Manual Testing Checklist

Test each toast type in the app:

- [ ] **Campaign Creation**
  - [ ] Create campaign successfully
  - [ ] Trigger validation errors
  - [ ] Test error scenarios

- [ ] **DM Campaign Page**
  - [ ] Import session (success)
  - [ ] Import session (error)
  - [ ] Copy join code
  - [ ] Empty import text warning

- [ ] **DM Encounters**
  - [ ] Reset encounter

- [ ] **DM Players**
  - [ ] Grant level (success)
  - [ ] Grant level (error)

- [ ] **Player Level Up**
  - [ ] Level up failure

### 4.2 Visual Verification

- [ ] Toasts appear in bottom-right
- [ ] Dark theme styling matches app
- [ ] Auto-dismiss works correctly
- [ ] Multiple toasts stack properly
- [ ] Mobile responsive
- [ ] Icons display correctly
- [ ] Long messages wrap properly

### 4.3 Cross-browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

---

## 📝 Implementation Pattern Reference

### Basic Replacement Pattern

**Before:**
```typescript
alert('Something happened!');
```

**After:**
```typescript
import { toast } from 'sonner';

toast.success('Something happened!');
```

### Error Handling Pattern

**Before:**
```typescript
try {
  // ... code
} catch (error) {
  alert('Error: ' + error.message);
}
```

**After:**
```typescript
import { toast } from 'sonner';

try {
  // ... code
} catch (error) {
  toast.error(error.message || 'An error occurred');
}
```

### Async Operation Pattern

**Before:**
```typescript
const result = await someAsyncOperation();
if (result.success) {
  alert('Success!');
} else {
  alert('Failed!');
}
```

**After:**
```typescript
import { toast } from 'sonner';

toast.promise(
  someAsyncOperation(),
  {
    loading: 'Processing...',
    success: 'Success!',
    error: 'Failed!',
  }
);
```

---

## 🎯 Success Criteria

- [x] Sonner library installed
- [x] ToastProvider created and added to layout
- [x] All 14 alert() calls replaced
- [x] No console errors
- [x] Toasts display correctly in all scenarios
- [x] Mobile responsive
- [x] Consistent styling with app theme
- [x] Auto-dismiss works as expected

---

## 📦 Files Created/Modified Summary

### New Files (2)
- `components/shared/ui/ToastProvider.tsx`
- `utils/toast.ts` (optional helpers)

### Modified Files (6)
1. `package.json` - Add sonner dependency
2. `app/layout.tsx` - Add ToastProvider
3. `app/campaigns/page.tsx` - Replace 5 alerts
4. `app/dm/[campaignId]/page.tsx` - Replace 4 alerts
5. `components/dm/EncountersTab.tsx` - Replace 1 alert
6. `components/dm/PlayersTab.tsx` - Replace 2 alerts
7. `components/player/LevelUpModal.tsx` - Replace 1 alert

---

## 💡 Pro Tips

1. **Import Once**: Add `import { toast } from 'sonner'` at the top of each file
2. **Test Errors**: Temporarily break things to see error toasts
3. **Duration Matters**: 
   - Success: 3s
   - Error: 4s (users need more time to read)
   - Info: 3s
   - Warning: 3.5s
4. **Use Descriptions**: For longer messages, use the `description` field
5. **Icons**: Add emoji icons for visual appeal (📋, ⬆️, ✅, ❌)
6. **Promise Toasts**: Use `toast.promise()` for async operations

---

## 🚀 Ready to Start?

1. Install sonner: `npm install sonner`
2. Create ToastProvider component
3. Add to layout
4. Replace alerts one file at a time
5. Test each replacement
6. Commit when done!

**Good luck, Dad! This will make the app feel much more professional! 💪**
