create extension if not exists pgcrypto;

create table if not exists painters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  approx_location text,
  experience_label text,
  role text,
  summary text,
  price_label text,
  response_label text,
  jobs_label text,
  image_url text,
  specialties jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null,
  client_name text,
  client_phone text,
  client_email text,
  client_address text,
  client_note text,
  booking_note text,
  property_type text,
  room_count integer,
  area_mode text,
  custom_area numeric,
  ceiling_height text,
  work_type text,
  repairs text,
  material text,
  furniture_moving text,
  covering text,
  cleaning text,
  empty_space text,
  carpets text,
  preferred_date_label text,
  preferred_time_label text,
  preferred_slot_id text,
  approximate_location text,
  estimated_price_low integer,
  estimated_price_high integer,
  confirmed_price integer,
  painter_payout integer,
  selected_painter_id uuid references painters(id),
  selected_offer_id uuid,
  selected_painter_name text,
  needs_completion_reason text,
  public_token_hash text not null,
  cancel_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_at timestamptz
);

create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  painter_id uuid not null references painters(id),
  painter_name text not null,
  status text not null,
  token_hash text not null unique,
  offered_payout integer,
  approx_location text,
  sanitized_note text,
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  offer_id uuid references job_offers(id) on delete set null,
  event_type text not null,
  actor_type text not null,
  actor_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  offer_id uuid references job_offers(id) on delete set null,
  channel text not null,
  recipient text not null,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_status_created_at on jobs(status, created_at desc);
create index if not exists idx_jobs_public_token_hash on jobs(public_token_hash);
create index if not exists idx_jobs_cancel_token_hash on jobs(cancel_token_hash);
create index if not exists idx_job_offers_job_id_created_at on job_offers(job_id, created_at desc);
create index if not exists idx_job_offers_token_hash on job_offers(token_hash);
create index if not exists idx_job_events_job_id_created_at on job_events(job_id, created_at desc);

create or replace function public.respond_to_offer(offer_token text, offer_decision text)
returns jsonb
language plpgsql
security definer
as $$
declare
  token_hash_input text := encode(digest(offer_token, 'sha256'), 'hex');
  target_offer job_offers%rowtype;
  target_job jobs%rowtype;
begin
  select * into target_offer
  from job_offers
  where token_hash = token_hash_input
  for update;

  if not found then
    raise exception 'Tato nabídka už není dostupná.';
  end if;

  select * into target_job
  from jobs
  where id = target_offer.job_id
  for update;

  if target_offer.status <> 'ceka_na_reakci' then
    raise exception 'Tato nabídka už není dostupná.';
  end if;

  if target_offer.expires_at < now() then
    update job_offers
    set status = 'prosla', updated_at = now()
    where id = target_offer.id;

    insert into job_events(job_id, offer_id, event_type, actor_type, actor_label)
    values (target_offer.job_id, target_offer.id, 'offer_expired', 'system', 'System');

    raise exception 'Tato nabídka už není dostupná.';
  end if;

  if exists (
    select 1
    from job_offers
    where job_id = target_offer.job_id
      and status = 'prijata'
      and id <> target_offer.id
  ) then
    raise exception 'Tato nabídka už není dostupná.';
  end if;

  if offer_decision = 'accept' then
    update job_offers
    set status = 'prijata', responded_at = now(), updated_at = now()
    where id = target_offer.id;

    update jobs
    set status = 'malir_prijal',
        selected_offer_id = target_offer.id,
        selected_painter_id = target_offer.painter_id,
        selected_painter_name = target_offer.painter_name,
        updated_at = now()
    where id = target_offer.job_id;

    insert into job_events(job_id, offer_id, event_type, actor_type, actor_label)
    values (target_offer.job_id, target_offer.id, 'offer_accepted', 'painter', target_offer.painter_name);
  else
    update job_offers
    set status = 'odmitnuta', responded_at = now(), updated_at = now()
    where id = target_offer.id;

    update jobs
    set status = 'pripravena_k_nabidnuti',
        updated_at = now()
    where id = target_offer.job_id;

    insert into job_events(job_id, offer_id, event_type, actor_type, actor_label)
    values (target_offer.job_id, target_offer.id, 'offer_declined', 'painter', target_offer.painter_name);
  end if;

  return jsonb_build_object('ok', true, 'jobId', target_offer.job_id, 'offerId', target_offer.id, 'decision', offer_decision);
end;
$$;

create or replace function public.confirm_job_assignment(job_id_input uuid, admin_email_input text)
returns jsonb
language plpgsql
security definer
as $$
declare
  target_job jobs%rowtype;
  winning_offer job_offers%rowtype;
begin
  select * into target_job
  from jobs
  where id = job_id_input
  for update;

  if not found or target_job.selected_offer_id is null then
    raise exception 'Zakázka nemá přijatou nabídku.';
  end if;

  select * into winning_offer
  from job_offers
  where id = target_job.selected_offer_id
  for update;

  if not found or winning_offer.status <> 'prijata' then
    raise exception 'Přijatá nabídka už není dostupná.';
  end if;

  update job_offers
  set status = 'stazena', updated_at = now()
  where job_id = job_id_input
    and id <> winning_offer.id
    and status = 'ceka_na_reakci';

  update jobs
  set status = 'potvrzena_klientovi',
      assigned_at = now(),
      updated_at = now()
  where id = job_id_input;

  insert into job_events(job_id, offer_id, event_type, actor_type, actor_label, payload)
  values
    (job_id_input, winning_offer.id, 'job_assigned', 'admin', admin_email_input, jsonb_build_object('painterName', winning_offer.painter_name)),
    (job_id_input, winning_offer.id, 'client_assigned_notification_queued', 'system', 'System', '{}'::jsonb),
    (job_id_input, winning_offer.id, 'painter_contact_unlocked', 'system', 'System', '{}'::jsonb);

  return jsonb_build_object('ok', true, 'jobId', job_id_input, 'offerId', winning_offer.id);
end;
$$;

create or replace function public.cancel_public_job(cancel_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  token_hash_input text := encode(digest(cancel_token, 'sha256'), 'hex');
  target_job jobs%rowtype;
begin
  select * into target_job
  from jobs
  where cancel_token_hash = token_hash_input
  for update;

  if not found then
    raise exception 'Zakázka nebyla nalezena.';
  end if;

  update jobs
  set status = 'zrusena',
      updated_at = now()
  where id = target_job.id;

  update job_offers
  set status = 'stazena',
      updated_at = now()
  where job_id = target_job.id
    and status = 'ceka_na_reakci';

  insert into job_events(job_id, event_type, actor_type, actor_label)
  values (target_job.id, 'job_canceled', 'client', coalesce(target_job.client_name, 'Klient'));

  return jsonb_build_object('ok', true, 'jobId', target_job.id);
end;
$$;
