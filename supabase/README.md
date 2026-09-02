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

## GDPR duties once this is live

Enabling the endpoint makes whoever deploys it the data controller for the
nicknames in `pd_scores`. The game side is already handled: the end screen shows
an unchecked "Publish to the global leaderboard" box and nothing is POSTed
without it, and the in-game privacy notice describes the service. Server side:

- **Data minimisation**: the table holds nickname, score, level and a timestamp
  only. Keep it that way; do not add IP addresses or user agents.
- **Region**: create the Supabase project in an EU region (for example
  `eu-central-1`) so player data is not transferred outside the EEA.
- **Logs**: Supabase keeps edge function and API logs (which include client IPs)
  for a limited time under its own retention. Sign Supabase's DPA in the dashboard
  (Organization settings, Legal documents).
- **Retention**: decide how long entries live and prune on a schedule, for
  example monthly via the SQL editor or `pg_cron`:

  ```sql
  delete from public.pd_scores where created_at < now() - interval '12 months';
  ```

- **Erasure requests**: players are told to contact the site owner with the
  nickname, score and date. Delete matching rows with:

  ```sql
  delete from public.pd_scores
   where name = '<nickname>' and score = <score> and created_at::date = '<YYYY-MM-DD>';
  ```

- **Notice**: if you change what is stored or where, update the privacy notice
  in `index.html` and the README privacy section in the same change.
