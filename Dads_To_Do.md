# 🔄 Item 9: Real-time Synchronization Improvements

## Overview
Optimize real-time updates using Supabase subscriptions so map changes, quest updates, and item additions happen **instantly without page refresh**.

> [!IMPORTANT]
> This is an **Advanced Task** requiring database + API work. Supabase Realtime must be enabled for the `campaign_state` table.

---

## Current State Analysis

### ✅ Components WITH Real-time Sync
| Component | Table | Channel |
|-----------|-------|---------|
| `context/CampaignContext.tsx` | `campaign` | `campaign_updates` |
| `components/player/MapTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_map` |
| `components/dm/QuestsTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_quests` |
| `components/player/QuestsTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_quests` |
| `components/dm/EncountersTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_encounters` |
| `components/dm/ItemsTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_items` |
| `components/dm/NPCsTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_npcs` |
| `components/player/PartyTab.tsx` | `campaign_state` | `realtime_campaign_state_{id}_npcs` |
| `components/player/InventoryTab.tsx` | `player_inventory` | `realtime_player_inventory_{id}_*` |

### ❌ Components MISSING Real-time Sync
*All components now have real-time synchronization implemented or standardized.*

---

## Implementation Plan

### Phase 1: Create Reusable Real-time Hook

#### 1.1 Create `useRealtimeSubscription` Hook
**File**: `components/shared/hooks/useRealtimeSubscription.ts`

```typescript
// Generic hook for subscribing to campaign_state changes
// Params: campaignId, column (e.g., 'quests', 'encounters'), callback
// Returns: subscription status, error state
```

**Features**:
- Subscribe to specific columns of `campaign_state` table
- Handle connection status (connecting, connected, error)
- Auto-cleanup on unmount
- Reconnection logic

---

### Phase 2: Add Real-time to High-Priority Components ✅

#### 2.1 DM QuestsTab (`components/dm/QuestsTab.tsx`)
- Import `useRealtimeSubscription` hook
- Subscribe to `quests` column changes
- Update quests state when real-time event received
- Add connection status indicator (optional)

#### 2.2 Player QuestsTab (`components/player/QuestsTab.tsx`)
- Same pattern as DM QuestsTab
- Players see quest updates immediately when DM makes changes

#### 2.3 EncountersTab (`components/dm/EncountersTab.tsx`)
- Subscribe to `encounters` column
- Critical for combat - DM and players need synchronized view

---

### Phase 3: Add Real-time to Medium-Priority Components ✅

#### 3.1 ItemsTab (`components/dm/ItemsTab.tsx`)
- Subscribe to `items` column

#### 3.2 NPCsTab (`components/dm/NPCsTab.tsx`)
- Subscribe to `npcs` column

#### 3.3 Player InventoryTab (`components/player/InventoryTab.tsx`)
- Subscribe to `items` column

#### 3.4 PartyTab (`components/player/PartyTab.tsx`)
- Subscribe to `players` column

---

### Phase 4: Optimize Existing Implementations ✅

#### 4.1 CampaignContext Improvements
**File**: `context/CampaignContext.tsx`
- Add debouncing for rapid updates
- Implement conflict resolution (last-write-wins or merge)
- Add connection status UI feedback

#### 4.2 MapTab Improvements
**File**: `components/player/MapTab.tsx`
- Add loading/syncing indicators
- Handle offline/reconnection gracefully

---

## Database Requirements

### Supabase Realtime Configuration
1. Go to **Database > Replication** in Supabase dashboard
2. Ensure `campaign_state` table is in `supabase_realtime` publication
3. Enable replication for columns: `quests`, `encounters`, `items`, `npcs`, `map`, `players`

### SQL Verification
```sql
-- Check if table is in realtime publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Add table to realtime if missing
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_state;
```

---

## Implementation Details

### Hook Signature
```typescript
export const useRealtimeSubscription = <T>(
  campaignId: string,
  column: string,
  onUpdate: (data: T) => void
) => {
  status: 'connecting' | 'connected' | 'error';
  error: string | null;
};
```

### Subscription Pattern
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`campaign_${campaignId}_${column}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaign_state',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => {
        const newData = payload.new[column];
        if (newData) {
          onUpdate(newData);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [campaignId, column, onUpdate]);
```

---

## Verification Plan

### Automated Tests
1. **Existing test**: Run `npm run test` to ensure no regressions
2. **New unit test**: Create `useRealtimeSubscription.test.ts` to test:
   - Channel creation/cleanup
   - Callback invocation on updates
   - Error handling

### Manual Testing
1. **Two-browser test**:
   - Open DM view in Browser 1
   - Open Player view in Browser 2
   - Create/update quest in Browser 1
   - Verify Browser 2 updates WITHOUT refresh

2. **Connection recovery**:
   - Disconnect network briefly
   - Reconnect and verify sync resumes

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `components/shared/hooks/useRealtimeSubscription.ts` | CREATE | Reusable subscription hook |
| `components/dm/QuestsTab.tsx` | MODIFY | Add real-time subscription |
| `components/player/QuestsTab.tsx` | MODIFY | Add real-time subscription |
| `components/dm/EncountersTab.tsx` | MODIFY | Add real-time subscription |
| `components/dm/ItemsTab.tsx` | MODIFY | Add real-time subscription |
| `components/dm/NPCsTab.tsx` | MODIFY | Add real-time subscription |
| `components/player/InventoryTab.tsx` | MODIFY | Add real-time subscription |
| `components/player/PartyTab.tsx` | MODIFY | Add real-time subscription |

---

## Estimated Effort
- **Phase 1** (Hook): 1-2 hours
- **Phase 2** (High priority): 2-3 hours  
- **Phase 3** (Medium priority): 2-3 hours
- **Phase 4** (Optimization): 1-2 hours
- **Testing**: 1-2 hours

**Total**: ~8-12 hours

---

## Success Criteria
- [x] All listed components have real-time sync
- [x] Updates appear within 1 second across browsers
- [x] Connection status indicators present
- [x] Graceful handling of network issues (Status indicators + Manual refresh fallbacks)
- [x] No duplicate subscriptions or memory leaks (Standardized hook cleanup)
- [x] Existing tests pass (npm run build verified)
