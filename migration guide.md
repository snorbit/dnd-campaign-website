

## 3. Character Sheet & Skills Setup (CRITICAL)

The new character sheet requires additional fields in the `character_stats` table and a new `player_spells` table. If you are seeing a blank character sheet or "Missing Columns" errors, you **must** run `supabase/migrations/003_character_skills.sql`.

### What this migration does:
1.  **Adds JSONB columns** to `character_stats` for:
    *   `skills`: Tracks proficiency and expertise for all 18 D&D skills.
    *   `saving_throws`: Tracks proficiency in saving throws.
2.  **Adds numeric columns** for `speed` and `initiative_bonus`.
3.  **Creates the `player_spells` table**: To store character spells (Cantrips through Level 9).
4.  **Sets up RLS Policies**: Ensures players can only see/edit their own spells and DMs can see all spells in their campaigns.

### How to apply it:
1.  Open the **SQL Editor** in your Supabase dashboard.
2.  Create a **New Query**.
3.  Copy the entire content of `supabase/migrations/003_character_skills.sql`.
4.  Run the query.

### Updating Existing Characters:
The migration uses `DEFAULT` values, so existing rows in `character_stats` will automatically get the base skill/save JSON blobs. However, if you have character records created *before* running this, you may want to verify their stats are populated correctly in the Supabase Table Editor.

### 4. Populating Feats (Optional but Recommended)
The character sheet displays feats. To populate the library of standard D&D 5e feats:
1.  Run the contents of `supabase/POPULATE_STANDARD_FEATS.sql` in the SQL Editor.

## 5. Post-Migration Fixes

Sometimes RLS (Row Level Security) can cause infinite recursion errors. If you encounter issues viewing campaigns:

1.  Run `supabase/FIX_RECURSION.sql`.
2.  If you have issues with sign-up metadata, run `supabase/FIX_SIGNUP.sql`.

## 4. Specific Configuration Notes

### Authentication
The platform uses Supabase Auth. When a user signs up, a trigger automatically creates a row in the `public.profiles` table. Ensure that the **"Enable Email Confirmations"** setting in Supabase Auth is either configured or disabled depending on your preference.

### Realtime
To enable realtime updates for campaign state:
1.  Go to **Database** > **Replication** in the Supabase dashboard.
2.  In the `supabase_realtime` publication, ensure the `campaign_state` table is included.

## 5. Summary of Tables

| Table | Description |
| :--- | :--- |
| `profiles` | User profile data (linked to `auth.users`) |
| `campaigns` | Game campaigns managed by DMs |
| `campaign_players` | Links players to campaigns with character details |
| `character_stats` | HP, AC, Ability scores, Skills, and Saves |
| `campaign_state` | JSON store for world, map, encounters, etc. |
| `campaign_sessions` | Detailed logs for game sessions |
| `standard_feats` | Library of official D&D 5e feats |
| `homebrew_feats` | Campaign-specific custom feats |
| `player_feats` | Feats acquired by characters |
| `player_inventory` | Items carried by characters |
| `player_spells` | Spells known/prepared by characters |
