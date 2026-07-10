# Global scores backend (optional)

The game works fully client-side. This directory holds everything needed to turn
the local leaderboard into a shared global one: one table and one public edge
function on any Supabase project.

## What gets created

- `pd_scores` table (see `migrations/`): RLS enabled with no policies, so the anon
  key cannot read or write it. Only the edge function (service role) touches it.
- `scores` edge function (see `functions/scores/`): public, no JWT, CORS enabled.
  - `GET` returns `{ "scores": [ { name, score, level, date }, ... ] }` (top 10).
  - `POST { name, score, level }` validates, inserts, and returns the same shape.

## Deploy

With the Supabase CLI, from this directory:

```sh
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase functions deploy scores --no-verify-jwt
```

Or paste `migrations/20260710000000_pd_scores.sql` into the dashboard SQL editor
and create the `scores` function from `functions/scores/index.ts` (disable
"Verify JWT").

## Wire the game

Set the endpoint in `js/main.js`:

```js
const SCORES_ENDPOINT = 'https://<PROJECT_REF>.supabase.co/functions/v1/scores';
```

The client always keeps a local copy and falls back to it whenever the endpoint
is unset or unreachable, so this can be enabled or rolled back at any time.

## Notes

- Nothing here is secret: the function URL is public by design and no keys ship
  with the game (see the scores rule in `CLAUDE.md`).
- Server-side limits: name 1-20 chars, level up to 24 chars, score 0 to 5,000,000.
