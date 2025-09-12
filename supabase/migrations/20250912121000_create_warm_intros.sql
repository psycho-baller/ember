-- Warm Intros: track requests and sent introductions between profiles

-- Enum for intro status
-- do $$ begin
--   if not exists (select 1 from pg_type where typname = 'intro_status') then
--     create type intro_status as enum (
--       'pending',      -- created, awaiting approvals
--       'approved',     -- both sides approved
--       'sent',         -- intro message sent/delivered
--       'rejected',     -- one side declined
--       'cancelled',    -- creator cancelled before sending
--       'expired'       -- timed out
--     );
--   end if;
-- end $$;

-- Table: warm_intros
create table if not exists public.warm_intros (
  id uuid primary key default gen_random_uuid(),

  -- auditing
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- the requester and the intended recipient
  from_profile_id uuid not null references public.profiles(id) on delete cascade,
  to_profile_id   uuid not null references public.profiles(id) on delete cascade,

  -- intro content and delivery
  intro_message   text not null,
  delivery_medium text check (delivery_medium in ('email','whatsapp')) default 'whatsapp',
  delivered_thread_url text,
  message_id text -- the id of the message that was sent

  -- workflow state
  -- status intro_status not null default 'pending',
  -- requester_approved_at timestamptz,
  -- recipient_approved_at timestamptz,
);

-- Ensure a requester cannot create duplicate active requests to same recipient
-- create unique index if not exists warm_intros_unique_active
-- on public.warm_intros (from_profile_id, to_profile_id)
-- where status in ('pending','approved','sent');

-- Helpful indexes
create index if not exists warm_intros_from_idx on public.warm_intros (from_profile_id);
create index if not exists warm_intros_to_idx on public.warm_intros (to_profile_id);

-- Trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists warm_intros_set_updated_at on public.warm_intros;
create trigger warm_intros_set_updated_at
before update on public.warm_intros
for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.warm_intros enable row level security;

-- Involved users can view the intro
drop policy if exists "Warm intros: involved can view" on public.warm_intros;
create policy "Warm intros: involved can view" on public.warm_intros
  for select
  using (
    auth.uid() = from_profile_id
    or auth.uid() = to_profile_id
  );

-- Requester creates (must be the creator and the from_profile_id)
drop policy if exists "Warm intros: requester can insert" on public.warm_intros;
create policy "Warm intros: requester can insert" on public.warm_intros
  for insert
  with check (
    auth.uid() = from_profile_id
  );

-- Involved users can update (status transitions, approvals, delivery info)
drop policy if exists "Warm intros: involved can update" on public.warm_intros;
create policy "Warm intros: involved can update" on public.warm_intros
  for update
  using (
    auth.uid() = from_profile_id
    or auth.uid() = to_profile_id
  );

-- Only creator can delete
drop policy if exists "Warm intros: creator can delete" on public.warm_intros;
create policy "Warm intros: creator can delete" on public.warm_intros
  for delete
  using (auth.uid() = from_profile_id);
