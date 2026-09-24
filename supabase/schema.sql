-- ==============================================================================
-- FRIENDS BINGO: Supabase PostgreSQL Schema with Realtime Replication
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Rooms Table
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  room_code text not null unique,
  host_id text not null,
  status text not null default 'lobby' check (status in ('lobby', 'setup', 'playing', 'ended')),
  current_turn_player_id text,
  current_turn_index integer not null default 0,
  called_numbers integer[] not null default '{}',
  last_called_by jsonb,
  winner_id text,
  winner_name text,
  round integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Players Table
create table if not exists public.players (
  id text not null,
  room_code text not null references public.rooms(room_code) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  is_ready boolean not null default false,
  turn_order integer not null default 0,
  lines_completed integer not null default 0,
  completed_lines text[] not null default '{}',
  has_won boolean not null default false,
  card integer[] not null default '{}',
  is_online boolean not null default true,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (room_code, id)
);

-- 4. Enable Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.players enable row level security;

-- Permissive public policies for game rooms (authenticated via room_code)
create policy "Allow all operations on rooms"
  on public.rooms for all
  using (true)
  with check (true);

create policy "Allow all operations on players"
  on public.players for all
  using (true)
  with check (true);

-- 5. Realtime Publication
-- Make sure tables send update events to Supabase Realtime subscribers
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;

-- 6. Indexes for performance
create index if not exists idx_rooms_room_code on public.rooms(room_code);
create index if not exists idx_players_room_code on public.players(room_code);
