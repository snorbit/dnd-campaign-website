# Supabase Setup

Use this folder as the source of truth for database setup.

## Fresh Project Order

1. Run `migrations/001_initial_schema.sql`.
2. Run each numbered migration in order:
   - `002_campaign_sessions.sql`
   - `003_character_skills.sql`
   - `004_initiative_tracker.sql`
   - `006_journal_updates.sql`
   - `007_player_spells.sql`
   - `008_campaign_chat.sql`
   - `009_fix_join_rls.sql`
   - `010_character_creator.sql`
   - `011_stats_and_spells.sql`
3. Run `POPULATE_STANDARD_FEATS.sql`.
4. Create a public storage bucket named `campaign-maps`.
5. Enable realtime for:
   - `campaign_state`
   - `campaign_chat`
   - `campaign_players`
   - `character_stats`
   - `player_inventory`

## Important Notes

- `schema.sql` is the older single-row campaign prototype and should not be used for new installs.
- `FIX_*.sql` and `COMPLETE_RESET.sql` are repair scripts for existing projects. Do not run them on a fresh project unless you know you need that specific fix.
- `RUN_THIS_IN_SUPABASE.sql` is a combined catch-up helper for later character-creator migrations, not a full fresh-project setup.
- The app uses the service-role key only in server routes that need privileged lookup or storage upload behavior. Never expose it to client code.

## Live Verification

The Supabase connector can be used to list projects, check migrations, and apply DDL. If connector auth expires, sign in again before live verification.
