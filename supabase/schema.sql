-- Run in your Supabase SQL editor before enabling activity history.
-- Activity metadata only: no README content, API keys or OAuth tokens.
create table if not exists public.repopilot_activity (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  kind text not null check (kind in ('generation','pull_request')),
  mode text not null check (mode in ('create','update')),
  repository text not null check (length(repository) between 3 and 200),
  pr_url text,
  created_at timestamptz not null default now(),
  constraint pr_url_only_for_pr check (pr_url is null or kind='pull_request')
);
create index if not exists repopilot_activity_user_date_idx on public.repopilot_activity (user_id,created_at desc);
alter table public.repopilot_activity enable row level security;
-- No public/anon/authenticated policies: only server-side service-role access.
revoke all on public.repopilot_activity from anon,authenticated;
