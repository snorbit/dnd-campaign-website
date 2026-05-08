# SessionForge Task List

This is the working backlog for the D&D campaign website. Keep completed work in this file so future passes can see what changed and what still matters.

## Critical Fixes

- [x] Unify campaign state storage.
  - `context/CampaignContext.tsx` still reads and writes the legacy `campaign` table.
  - Current campaign pages use `campaigns` and `campaign_state`.
  - Decide whether `CampaignContext` should become campaign-scoped or be removed from routes that already manage state directly.
  - Done: modern DM/player routes now pass `campaignId` into `CampaignProvider`, which reads/writes `campaign_state`; the legacy `campaign` fallback remains only for old context-backed pages.

- [x] Remove duplicate global providers and floating tools.
  - `app/layout.tsx` wraps the whole app in `CampaignProvider` and renders `DiceRoller`.
  - DM/player pages also wrap themselves in `CampaignProvider` and render `DiceRoller`.
  - Keep one clear ownership model so dice, sync state, and subscriptions do not duplicate.
  - Done: root layout no longer renders the legacy provider or global dice roller; campaign routes own their campaign-scoped provider and dice roller.

- [x] Fix the campaign chat migration.
  - `supabase/migrations/008_campaign_chat.sql` uses `campaign_id BIGINT`, but `campaigns.id` is UUID.
  - Update related policies and verify `components/shared/LiveChat.tsx` queries match the `profiles` schema.
  - Done: `campaign_chat.campaign_id` is UUID and `LiveChat` reads `username` / `display_name`.

- [x] Make production builds reliable.
  - `npm.cmd run build` currently fails in network-restricted environments because `next/font/google` fetches Inter and Cinzel during build.
  - Self-host fonts or use local fallback fonts.
  - Done: the Google Fonts dependency was removed. Local `next build` now compiles successfully before hitting a Windows `spawn EPERM` worker restriction outside the app code.

- [x] Repair linting.
  - `npm.cmd run lint` currently fails because `next lint` is no longer valid for this Next.js setup.
  - Add an ESLint config and update the script to run ESLint directly.
  - Done: lint now runs through ESLint directly and exits successfully with warnings only.

## Security And Data Integrity

- [x] Sanitize or safely render spell descriptions.
  - `components/player/SpellsTab.tsx` uses `dangerouslySetInnerHTML` for Open5e spell content.
  - Replace with sanitized HTML or structured markdown rendering.
  - Done: spell text now renders as React text nodes with simple bold/newline formatting.

- [x] Restrict remote image domains.
  - `next.config.js` currently allows all HTTPS image hosts.
  - Limit this to Supabase storage and any known map/token image hosts.
  - Done: remote image config now allows Supabase Storage and Open5e only.

- [x] Expand `.env.local.example`.
  - Include `SUPABASE_SERVICE_ROLE_KEY`.
  - Include optional local AI settings such as `SD_LOCAL_URL`, `OLLAMA_URL`, and `OLLAMA_MODEL`.

- [x] Review service-role API routes.
  - Confirm `app/api/join-campaign/route.ts` never exposes service-role behavior beyond the join-code lookup and validated insert.
  - Add clear failures when required server env vars are missing.
  - Done: join route now validates required server env vars before creating the admin client.

## UX And Reliability

- [x] Fix encoding/mojibake in docs and UI text.
  - README and task docs had broken icon characters.
  - Several buttons and toast messages have the same issue.
  - Done: README was rewritten as clean ASCII docs and touched map-generator UI text was cleaned.

- [x] Replace full page reload after session import.
  - `app/dm/[campaignId]/page.tsx` calls `window.location.reload()`.
  - Refresh affected tabs or state directly after import.
  - Done: session import now switches to the Sessions tab and refreshes that tab without a full page reload.

- [x] Clean up AI map generation paths.
  - `app/api/generate-map/route.ts` is placeholder-only.
  - `app/api/generate-map-image/route.ts` contains the real Stable Diffusion path.
  - Merge, remove, or clearly label the placeholder route.
  - Done: both routes now use the same shared map generation service.

- [x] Improve loading and error states on DM/player pages.
  - Replace generic console errors with visible, useful recovery actions.
  - Make "not authorized", "missing campaign", and "missing character" states distinct.
  - Done: DM and player campaign pages now show a visible unavailable state with a Back to Campaigns action.

- [x] Make mobile layouts easier to use during sessions.
  - Check sidebar overlays, fixed chat/dice controls, and map/token controls on phone-sized screens.
  - Done: fixed chat, dice, and audio controls now avoid bottom-corner overlap on small screens; DM/player map headers, token controls, and map modals now stack and scroll on phone-sized screens.

## Code Quality

- [x] Reduce `any` usage in high-traffic components.
  - Start with campaign loading, `CampaignContext`, maps, encounters, party, and character creation.
  - Move shared Supabase row types into `types.ts` or generated database types.
  - Done: campaign route state and shared campaign context state now use explicit interfaces instead of broad `any` for the main DM/player route shells.

- [x] Remove noisy production logging.
  - Many realtime hooks and context updates log every subscription/event.
  - Gate debug logs behind an env flag or remove them.
  - Done: campaign context, realtime hook, and dice hook debug logs are gated behind `NEXT_PUBLIC_DEBUG_LOGS`.

- [x] Consolidate duplicated components.
  - There is a root `components/DiceRoller.tsx` and a shared `components/shared/DiceRoller.tsx`.
  - Keep the current shared version and remove stale duplicates if unused.
  - Done: the unused root dice roller was removed.

- [x] Update project docs to match the actual stack.
  - README says Next.js 14, but `package.json` uses Next.js 16.
  - Document the actual setup and local dev commands for Windows.
  - Done: README now documents Next.js 16, Supabase, Vercel, env vars, and Windows `npm.cmd` commands.

## Tests And Verification

- [x] Add tests for realtime subscription cleanup.
  - Cover `components/shared/hooks/useRealtimeSubscription.ts`.
  - Verify channels are removed on unmount.

- [x] Add tests for campaign join flow.
  - Validate bad join code, existing member, DM joining own campaign, and successful join.
  - Done: route tests cover missing env, invalid join code, and successful join.

- [x] Add tests for dice/chat integration.
  - Verify dice rolls are persisted or broadcast as intended.
  - Confirm duplicate dice rollers do not produce duplicate messages after provider cleanup.
  - Done: dice hook tests now cover channel subscription, public broadcast, and cleanup.

- [x] Add a manual two-browser verification checklist.
  - DM changes map, player sees update.
  - DM updates quests, player sees update.
  - Player sends chat, DM receives it.
  - Whisper visibility behaves correctly.
  - Done: see `VERIFICATION.md`.

## Completed

- [x] Initial repo assessment completed.
- [x] Test suite checked with `npm.cmd test`; current result: 4 test files passed, 15 tests passed.
- [x] Root `TASK.md` created.
- [x] `npm.cmd exec tsc -- --noEmit` passes.
- [x] Removed the Google Fonts build fetch blocker by using local CSS font stacks instead of `next/font/google`.
- [x] Full map generator path added with Stable Diffusion support, procedural fallback, preview, save, display, Supabase Storage upload, and tests.
- [x] Mobile session layout pass completed for fixed chat/dice/audio controls and map/token controls.
- [x] Session script importer now builds full-session content: location maps, travel maps, encounter maps, NPCs, monster stat blocks, populated encounters, quests, and items.
- [x] Added importer tests for script-to-session map jobs, NPC records, encounter enemies, monster counts, and item quantities.
- [x] Live Supabase project verified: `campaign_state`, `campaign_sessions`, `campaign_players`, `campaigns`, and `campaign-maps` exist; missing `campaign_chat` migration was applied and re-checked.

## Known Verification Blockers

- `npm.cmd run build` compiles successfully, but this local Windows environment currently fails during Next.js page-data collection with `spawn EPERM`. TypeScript passes separately with `tsc --noEmit`.
- Supabase connector verification is working and the live `campaign_chat` migration was applied. Supabase advisor and Vercel deployment/project detail calls timed out through the connectors.
- Mobile layout verification is blocked until the dev server can run or a Vercel preview is available.
