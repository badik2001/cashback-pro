-- =============================================
-- CashBack Pro — Supabase Database Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  username text,
  avatar_url text,
  family_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- FAMILIES
-- =============================================
create table if not exists families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references profiles(id) on delete cascade not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- =============================================
-- FAMILY MEMBERS
-- =============================================
create table if not exists family_members (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references families(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique(family_id, user_id)
);

-- =============================================
-- CARDS
-- =============================================
create table if not exists cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  bank_name text not null,
  bank_color text default '#6366f1',
  image_url text,
  cashback_limit numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CASHBACK CATEGORIES
-- =============================================
create table if not exists cashback_categories (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  name text not null,
  percent numeric(5,2) not null check (percent >= 0 and percent <= 100),
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table cards enable row level security;
alter table cashback_categories enable row level security;

-- Helper: resolve the current user's family_id through a
-- SECURITY DEFINER function so dependent policies never have to
-- run a self-referential select on `profiles` (which would cause
-- "infinite recursion detected in policy for relation profiles").
create or replace function public.current_family_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_family_id() to authenticated;

-- Profiles: users see their own profile + family members profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view family member profiles" on profiles for select
  using (family_id is not null and family_id = public.current_family_id());

-- Families: members can view their family
create policy "Family members can view family" on families for select
  using (id = public.current_family_id());
create policy "Owner can create family" on families for insert
  with check (owner_id = auth.uid());
create policy "Owner can update family" on families for update
  using (owner_id = auth.uid());

-- Family members
create policy "View own family members" on family_members for select
  using (family_id = public.current_family_id());
create policy "Join family" on family_members for insert
  with check (user_id = auth.uid());
create policy "Owner can remove members" on family_members for delete
  using (
    user_id = auth.uid() or
    family_id in (select id from families where owner_id = auth.uid())
  );

-- Cards: users manage own, family members can view
create policy "Users manage own cards" on cards for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Family members view cards" on cards for select
  using (
    user_id in (select user_id from family_members where family_id = public.current_family_id())
  );

-- Cashback categories: follows card access
create policy "View categories of own cards" on cashback_categories for all
  using (card_id in (select id from cards where user_id = auth.uid()))
  with check (card_id in (select id from cards where user_id = auth.uid()));
create policy "Family view categories" on cashback_categories for select
  using (
    card_id in (
      select c.id from cards c
      join family_members fm on fm.user_id = c.user_id
      where fm.family_id = public.current_family_id()
    )
  );

-- =============================================
-- SEED DATA (default banks)
-- =============================================
-- Default banks are handled in the frontend for each new user.
-- No global seed needed as cards are per-user.

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_cards_user_id on cards(user_id);
create index if not exists idx_cashback_categories_card_id on cashback_categories(card_id);
create index if not exists idx_family_members_family_id on family_members(family_id);
create index if not exists idx_family_members_user_id on family_members(user_id);
create index if not exists idx_profiles_family_id on profiles(family_id);
create index if not exists idx_families_invite_code on families(invite_code);
