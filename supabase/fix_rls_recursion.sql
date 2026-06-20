-- =============================================================
-- CashBack Pro — RLS recursion + "families" insert fix
-- =============================================================
-- Root cause: the policy "Users can view family member profiles"
-- on the `profiles` table looks up the caller's own family_id by
-- running `select family_id from profiles where id = auth.uid()`
-- *inside a policy defined on profiles itself*. Postgres has to
-- apply RLS to that inner select too, which re-triggers the same
-- policy — infinite recursion. Because almost every other policy
-- (on families / family_members / cards / cashback_categories)
-- also resolves "my family" via a subquery on profiles, the
-- recursion leaks into those tables as well — which is also why
-- creating a family could fail with a generic
-- "new row violates row-level security policy" error (Postgres
-- has to evaluate the SELECT policy on `families` to return the
-- newly inserted row, and that policy also reads profiles).
--
-- Fix: resolve "my family_id" through a SECURITY DEFINER function.
-- Such a function runs with the privileges of its owner, which
-- bypasses RLS on the table it queries — breaking the recursive
-- loop for good. Every other policy now calls this function
-- instead of repeating the subquery.
--
-- This script is idempotent — safe to run as many times as you
-- like. Paste the whole thing into the Supabase SQL editor and
-- run it once.
-- =============================================================

-- 1) Wipe every existing policy on the affected tables, whatever
--    they're currently named (covers any ad-hoc edits already
--    made directly in the dashboard).
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'families', 'family_members', 'cards', 'cashback_categories')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 2) Helper function — resolves the *current* user's family_id
--    without ever going through RLS on profiles.
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

-- 3) profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view family member profiles" on public.profiles
  for select using (family_id is not null and family_id = public.current_family_id());

-- 4) families
create policy "Family members can view family" on public.families
  for select using (id = public.current_family_id());

create policy "Owner can create family" on public.families
  for insert with check (owner_id = auth.uid());

create policy "Owner can update family" on public.families
  for update using (owner_id = auth.uid());

-- 5) family_members
create policy "View own family members" on public.family_members
  for select using (family_id = public.current_family_id());

create policy "Join family" on public.family_members
  for insert with check (user_id = auth.uid());

create policy "Owner can remove members" on public.family_members
  for delete using (
    user_id = auth.uid()
    or family_id in (select id from public.families where owner_id = auth.uid())
  );

-- 6) cards
create policy "Users manage own cards" on public.cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Family members view cards" on public.cards
  for select using (
    user_id in (select user_id from public.family_members where family_id = public.current_family_id())
  );

-- 7) cashback_categories
create policy "View categories of own cards" on public.cashback_categories
  for all
  using (card_id in (select id from public.cards where user_id = auth.uid()))
  with check (card_id in (select id from public.cards where user_id = auth.uid()));

create policy "Family view categories" on public.cashback_categories
  for select using (
    card_id in (
      select c.id from public.cards c
      join public.family_members fm on fm.user_id = c.user_id
      where fm.family_id = public.current_family_id()
    )
  );

-- Done. Re-run any time — every statement above is idempotent.
