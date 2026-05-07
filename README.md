# SessionForge

SessionForge is a web app for running D&D 5e campaigns online. It gives the Dungeon Master a campaign control surface and gives players a live campaign view with maps, character tools, quests, journals, inventory, spells, chat, and dice.

## Features

### Dungeon Master

- Campaign creation and campaign-code sharing
- Live map library with generated maps, pings, and tokens
- Encounter, player, quest, NPC, item, feat, session, journal, audio, and time tools
- Session import for turning notes into maps, quests, items, and encounters
- Map generation through local Stable Diffusion when available, with a procedural fallback

### Players

- Live map view with realtime updates
- Character sheet, stats, spells, inventory, party, quest, feat, and journal tabs
- Shared dice roller and live chat
- Character creation and level-up flow

## Tech Stack

- Framework: Next.js 16
- Language: TypeScript
- UI: React and Tailwind CSS
- Database/Auth/Realtime/Storage: Supabase
- Hosting: Vercel
- Tests: Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional local AI services
SD_LOCAL_URL=http://127.0.0.1:7860
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

3. Run the app:

```bash
npm.cmd run dev
```

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

## Checks

```bash
npm.cmd test
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

In this local Windows environment, Next.js build/dev can fail with `spawn EPERM` during worker startup. TypeScript and tests can still be checked directly.

## Supabase

Run the migrations in `supabase/migrations` for a fresh project. The app expects:

- `campaigns`
- `campaign_players`
- `campaign_state`
- `campaign_sessions`
- `campaign_chat`
- character, inventory, spell, feat, journal, and homebrew tables
- a public Supabase Storage bucket named `campaign-maps`

Realtime should be enabled for tables used by live session views, especially `campaign_state`, `campaign_chat`, and player-facing records.

## Vercel

Deploy through Vercel and configure the same environment variables there. The production app should use Supabase for database, auth, realtime, and map storage.

## Project Structure

```text
app/                 Next.js app routes and API routes
components/dm/       Dungeon Master tabs and tools
components/player/   Player tabs and tools
components/shared/   Shared UI, dice, chat, audio, realtime hooks
context/             Campaign context
lib/                 Supabase and map generation helpers
supabase/            Schema and migrations
public/              Static assets
data/                Campaign notes and imported content
```
