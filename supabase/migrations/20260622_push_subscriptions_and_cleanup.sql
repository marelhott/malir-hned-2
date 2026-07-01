create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  painter_id uuid not null references painters(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_painter_id
  on push_subscriptions(painter_id);

drop function if exists public.respond_to_offer(text, text);
drop function if exists public.confirm_job_assignment(uuid, text);
drop function if exists public.cancel_public_job(text);
