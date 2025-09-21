-- Acton North Demo CRM — Database Schema (Supabase/Postgres)
-- extensions
create extension if not exists vector;

-- users
create table if not exists users (
  id uuid primary key default auth.uid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now(),
  zep_user_id text
);

-- contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  external_user_id uuid,
  zep_entity_id text,
  first_met_at timestamptz,
  first_met_where text,
  last_interaction_at timestamptz,
  notes text,
  conversation_ids uuid[] default '{}'
);
create index if not exists contacts_owner_idx on contacts(owner_id);

-- conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  location text,
  raw_transcript text,
  transcript_hash text not null,
  stt_provider text not null,
  zep_conversation_id text,
  vapi_call_id text
);
create index if not exists conversations_owner_started_idx on conversations(owner_id, started_at desc);
create index if not exists conversations_contact_idx on conversations(contact_id);

-- entities
create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  kind text not null,
  name text not null,
  canonical_key text not null,
  meta jsonb,
  salience float8,
  zep_entity_id text
);
create index if not exists entities_owner_key_idx on entities(owner_id, canonical_key);
create index if not exists entities_conversation_idx on entities(conversation_id);

-- relations
create table if not exists relations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  src_entity_id uuid not null references entities(id) on delete cascade,
  dst_entity_id uuid not null references entities(id) on delete cascade,
  type text not null,
  weight float8
);
create index if not exists relations_owner_src_idx on relations(owner_id, src_entity_id);
create index if not exists relations_owner_dst_idx on relations(owner_id, dst_entity_id);

-- memories
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] default '{}',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  source_conversation_id uuid references conversations(id) on delete set null
);
create index if not exists memories_owner_contact_idx on memories(owner_id, contact_id);

-- embeddings (optional)
create table if not exists embeddings (
  owner_id uuid not null references users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  model text not null,
  vec vector(1536) not null,
  primary key (owner_id, entity_id)
);
