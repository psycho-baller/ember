-- Migration: Add support for unauthenticated sessions
-- This allows users to send their first message before providing email

-- Create unauthenticated_sessions table to track sessions before email confirmation
create table if not exists unauthenticated_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null, -- phone number or other identifier
  phone_number text,
  first_name text,
  last_name text,
  profile_name text,
  first_message text,
  first_message_at timestamptz not null default now(),
  email_requested_at timestamptz,
  email_confirmed_at timestamptz,
  confirmed_email text,
  linked_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for performance
create index if not exists unauthenticated_sessions_session_id_idx on unauthenticated_sessions(session_id);
create index if not exists unauthenticated_sessions_phone_idx on unauthenticated_sessions(phone_number);
create index if not exists unauthenticated_sessions_created_idx on unauthenticated_sessions(created_at desc);

-- Add a trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_unauthenticated_sessions_updated_at
  before update on unauthenticated_sessions
  for each row execute function update_updated_at_column();

-- Add phone_number field to users table if it doesn't exist
alter table users add column if not exists phone_number text;
create index if not exists users_phone_idx on users(phone_number);

-- Add session tracking to users
alter table users add column if not exists session_id text;
create index if not exists users_session_id_idx on users(session_id);
