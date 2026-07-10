-- Global high-score table for Pipeline Defense.
-- RLS is enabled with no policies on purpose: the anon key cannot touch this
-- table. All access goes through the "scores" edge function (service role).
create table if not exists public.pd_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Anonymous' check (char_length(name) between 1 and 20),
  score integer not null check (score >= 0 and score <= 5000000),
  level text not null default '' check (char_length(level) <= 24),
  created_at timestamptz not null default now()
);

alter table public.pd_scores enable row level security;

create index if not exists pd_scores_score_idx
  on public.pd_scores (score desc, created_at asc);
