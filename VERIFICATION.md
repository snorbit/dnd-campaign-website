# Manual Verification Checklist

Use this after major changes or before deploying to Vercel.

## Local Checks

- [ ] `npm.cmd test`
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd exec tsc -- --noEmit`
- [ ] `npm.cmd run build`

## Two-Browser Session Check

1. Open Browser 1 as the DM.
2. Open Browser 2 as a player in the same campaign.
3. DM creates or opens a campaign and copies the join code.
4. Player joins with the code and creates a character.
5. DM generates a map in the Maps tab.
6. DM saves and displays the generated map.
7. Player sees the map update without refreshing.
8. DM adds and moves a token.
9. Player sees token movement.
10. Player clicks the map to ping a location.
11. DM sees the ping.
12. DM creates or updates a quest.
13. Player sees the quest update.
14. Player sends a public chat message.
15. DM receives it.
16. DM sends a whisper to one player.
17. Only the target player and DM can see the whisper.
18. DM and player each roll dice.
19. Each roll appears once and does not duplicate.

## Supabase Checks

- [ ] `campaign_state` has realtime enabled.
- [ ] `campaign_chat` has realtime enabled.
- [ ] `campaign-maps` storage bucket exists and is public.
- [ ] RLS prevents non-members from reading campaign data.
- [ ] Join code lookup works only through the server route.

## Vercel Checks

- [ ] Production environment variables match `.env.local.example`.
- [ ] Latest deployment builds successfully.
- [ ] Login, campaign list, DM route, and player route load in production.
- [ ] Map generation can upload generated maps to Supabase Storage.
