# SessionForge Improvement Plan

This plan orders the backlog by risk. The goal is to make the app reliable first, then clean up UX and polish.

## Phase 1: Stabilize The Foundation

1. Fix schema mismatches.
   - Repair `campaign_chat.campaign_id` so it matches `campaigns.id`.
   - Verify all chat policies compile and enforce campaign membership correctly.
   - Confirm `LiveChat` reads valid profile fields.

2. Unify campaign state.
   - Audit every use of `CampaignProvider` and `useCampaign`.
   - Decide whether the app still needs the legacy `campaign` table.
   - Move shared state to `campaign_state` or remove the legacy context from modern routes.

3. Remove duplicated app shell behavior.
   - Keep one `CampaignProvider` per route scope, or one global provider if it can be campaign-aware.
   - Render the dice roller in one place only.
   - Verify DM and player pages do not open duplicate realtime subscriptions.

4. Make local checks meaningful.
   - Replace the broken `lint` script.
   - Add a basic ESLint config compatible with Next 16.
   - Keep `npm.cmd test` passing.

## Phase 2: Make Builds And Deploys Predictable

1. Remove network-dependent font builds.
   - Replace `next/font/google` with local fonts or CSS font stacks.
   - Run `npm.cmd run build` again.

2. Update environment documentation.
   - Expand `.env.local.example`.
   - Document required Supabase variables separately from optional local AI variables.

3. Tighten external resource config.
   - Restrict `next.config.js` image hosts.
   - Confirm map/token image sources still work.

4. Clean up migrations.
   - Identify which SQL files are historical fixes and which are meant to be run now.
   - Create one current setup path for a fresh Supabase project.

## Phase 3: Improve Session UX

1. Build a full functioning D&D map generator. Done locally.
   - Support typed prompts such as tavern, forest, dungeon, cave, castle, town, road, and boss arena.
   - Generate usable top-down battle maps with grid options, map size presets, terrain tags, lighting/mood, and encounter notes.
   - Provide a reliable fallback generator when local Stable Diffusion is unavailable, using the existing canvas-based map generator as the starting point.
   - Let the DM preview, rename, regenerate, save, delete, and display generated maps to players.
   - Save generated maps to Supabase Storage and attach metadata to `campaign_state.map.queue`.
   - Add map editing tools for tokens, pings, labels, fog/hidden areas, and basic obstacles.
   - Make generated maps sync live to the player view without a page refresh.
   - Verify the full flow: generate map, save to library, display to players, move tokens, and reload the campaign.

2. Replace reload-based refresh. Done locally.
   - After session import, refresh map, quest, encounter, item, and session state directly.
   - Show exact import results and partial failures.

3. Improve map operations. Partially done locally.
   - Ensure map tokens save the final dragged position reliably.
   - Add clearer feedback when Stable Diffusion is unavailable.
   - Remove or merge the placeholder map API route.

4. Improve player and DM error states.
   - Split "not signed in", "not in campaign", "campaign missing", and "character missing".
   - Add clear navigation buttons for recovery.

5. Verify mobile layouts. Done locally.
   - Check DM sidebar, player sidebar, chat bubble, dice roller, map pings, and token controls.
   - Fix overlapping fixed UI elements.
   - Chat, dice, and audio fixed controls now avoid bottom-corner overlap on phone-sized screens; map controls and generator modals now stack and scroll.

## Phase 4: Security And Data Safety

1. Replace unsafe spell rendering.
   - Sanitize Open5e HTML or convert markdown-like content to React nodes.
   - Keep spell formatting readable without raw HTML injection.

2. Review server routes.
   - Validate request bodies.
   - Return predictable errors when env vars are missing.
   - Keep service-role usage limited to routes that truly need it.

3. Reduce client-side trust.
   - Move sensitive permission decisions to RLS or server routes.
   - Keep client-side filtering only as a UX fallback, not the security boundary.

## Phase 5: Code Health And Tests

1. Add focused tests around risky shared behavior.
   - Realtime subscription setup and cleanup.
   - Join campaign route behavior.
   - Dice roll parsing and broadcast behavior.

2. Reduce broad `any` usage.
   - Start with shared hooks, campaign state, maps, players, encounters, and character creation.
   - Prefer shared row interfaces or generated Supabase types.

3. Remove noisy logs.
   - Keep errors and useful warnings.
   - Gate realtime debug logs behind a debug flag.

4. Update public docs.
   - Fix README encoding.
   - Correct Next.js version.
   - Add Windows-friendly commands using `npm.cmd` when PowerShell blocks `npm.ps1`.

## Verification Checklist

- [x] `npm.cmd test` passes.
- [x] Lint command runs and reports actionable issues.
- [x] `npm.cmd run build` passes without external font fetches.
- [ ] Fresh Supabase migration path works.
- [ ] DM can create a campaign and copy a join code.
- [ ] Player can join and create a character.
- [ ] DM map update appears in player view without refresh.
- [ ] Chat works for public messages and whispers.
- [x] Dice roller appears once and does not duplicate events.

Connector status: Supabase and Vercel live verification is currently blocked by expired connector auth tokens.
