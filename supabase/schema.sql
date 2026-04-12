-- Credit Card Benefits Tracker Schema
-- Run this in the Supabase SQL editor to set up your database

-- Table: benefit_state
-- Stores the current used amount, notes, and last-reset period for each benefit
create table if not exists public.benefit_state (
  id           text primary key,          -- matches benefit "key" from cards.json
  card_id      text not null,
  used         numeric not null default 0,
  notes        text not null default '',
  reset_period text not null default '',  -- e.g. "2024-Q1", "2024-Jan", "2024-annual"
  updated_at   timestamptz not null default now()
);

-- Table: free_night_state
-- Stores whether each free night has been used/checked
create table if not exists public.free_night_state (
  id         text primary key,            -- "{cardId}-{index}"
  card_id    text not null,
  used       boolean not null default false,
  exp        text not null default '',    -- ISO date string (may be auto-rolled)
  updated_at timestamptz not null default now()
);

-- Enable RLS but allow all for anon (app uses shared password, not per-user auth)
alter table public.benefit_state enable row level security;
alter table public.free_night_state enable row level security;

create policy "Allow all for anon" on public.benefit_state
  for all using (true) with check (true);

create policy "Allow all for anon" on public.free_night_state
  for all using (true) with check (true);
