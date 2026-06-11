# Beta Verification Checklist

Use this before inviting players into a beta session.

## Local Checks

- [ ] `npm.cmd test`
  - Blocked locally: Vitest/esbuild cannot read a Windows parent directory while loading `vitest.config.ts`.
- [x] `npm.cmd run lint`
  - Passes with existing warnings only.
- [x] `npm.cmd exec tsc -- --noEmit`
- [x] `npm.cmd run build`

## Current Beta Status

- Local type check, lint, and production build pass.
- Vercel production deployment is `READY`.
- Vercel production runtime logs show no `error` or `fatal` entries in the last 24 hours.
- Supabase project `sessionforge` is `ACTIVE_HEALTHY`.
- Supabase storage logs show ZIP-imported map images and atlas images returning public `200` responses.
- Added migration `012_beta_audio_and_legacy_security.sql` for the missing live `campaign_state.audio` column and legacy table security.
- Added migration `013_beta_character_journal_level_fixes.sql` for character stats, journal saving, DM level grants, spellbook compatibility, and player sheet loading.
- Added migration `014_beta_signup_trigger_public_revoke.sql` to close direct API access to the signup helper.
- Live Supabase migration list now includes all three beta migrations.
- Still required before beta: deploy the current code to Vercel, then run the manual two-browser DM/player checklist.

## DM And Player Core Flow

1. Open Browser 1 as the DM.
2. Open Browser 2 as a player in the same campaign.
3. DM creates or opens a campaign and copies the join code.
4. Player joins with the code and creates a character.
5. DM opens the Maps tab.
6. DM imports a ZIP with at least town, tavern, shop, forest, cave, and encounter maps.
7. DM confirms the atlas and individual maps appear in the map library.
8. DM displays the atlas to players.
9. Player sees the atlas update without refreshing.
10. DM switches to a tavern or cave map.
11. Player sees the new active map without refreshing.
12. DM adds and moves a token.
13. Player sees token movement.
14. DM switches maps and confirms old tokens do not appear on the new map.
15. Player clicks the map to ping a location.
16. DM sees the ping.
17. DM creates or updates a quest.
18. Player sees the quest update.
19. Player sends a public chat message.
20. DM receives it.
21. DM sends a whisper to one player.
22. Only the target player and DM can see the whisper.
23. DM and player each roll dice.
24. Each roll appears once and does not duplicate.

## Session Import Review

1. DM opens Import Session.
2. DM pastes the Session 1 script.
3. DM clicks Review Session.
4. Review screen shows locations, quests, NPCs, items, and encounters.
5. Locations are shown as reference only and no generated maps are promised.
6. Shop stock, price lists, and gear tier choices do not appear as imported loot.
7. Loot cache rewards do appear as items.
8. DM unchecks at least one item and one NPC.
9. DM edits one quest title or reward.
10. DM saves checked content.
11. Sessions tab records the import.
12. Quests, NPCs, Items, and Encounters tabs contain only checked content.

## Supabase Checks

- [ ] `campaign_state` has realtime enabled.
- [ ] `campaign_chat` has realtime enabled.
- [ ] `campaign-maps` storage bucket exists and is public.
- [x] ZIP map uploads create public image URLs in `campaign-maps`.
- [ ] RLS prevents non-members from reading campaign data.
- [ ] Join code lookup works only through the server route.
- [x] Apply `supabase/migrations/012_beta_audio_and_legacy_security.sql` to production.
- [x] Apply `supabase/migrations/013_beta_character_journal_level_fixes.sql` to production.
- [x] Apply `supabase/migrations/014_beta_signup_trigger_public_revoke.sql` to production.
- [x] Re-run Supabase security advisor after the migration.

## Vercel Checks

- [ ] Production environment variables match `.env.local.example`.
- [x] Latest deployment builds successfully.
- [ ] Login, campaign list, DM route, and player route load in production.
- [ ] ZIP map import can upload maps to Supabase Storage in production.
- [ ] Session import review works in production without creating maps from text.
- [x] Production runtime logs have no `error` or `fatal` entries in the last 24 hours.
