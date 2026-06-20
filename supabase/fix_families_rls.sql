-- =============================================
-- ФИКС: new row violates row-level security policy for table "families"
-- Выполни целиком в Supabase → SQL Editor → New query → Run
-- =============================================
--
-- Вместо прямого INSERT в families/family_members с клиента (что зависит
-- от точного состояния RLS-политик и легко ломается), создание и
-- вступление в семью теперь идёт через RPC-функции SECURITY DEFINER.
-- Они выполняют всю операцию атомарно с правами функции, минуя
-- возможные расхождения в политиках на твоей базе.

create or replace function public.create_family(p_name text)
returns table (id uuid, name text, owner_id uuid, invite_code text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_family_id uuid;
begin
  v_code := upper(substring(md5(random()::text) from 1 for 6));

  insert into families (name, owner_id, invite_code)
  values (p_name, auth.uid(), v_code)
  returning families.id into v_family_id;

  insert into family_members (family_id, user_id, role)
  values (v_family_id, auth.uid(), 'owner');

  update profiles set family_id = v_family_id where id = auth.uid();

  return query select families.id, families.name, families.owner_id, families.invite_code, families.created_at
    from families where families.id = v_family_id;
end;
$$;

grant execute on function public.create_family(text) to authenticated;

create or replace function public.join_family(p_invite_code text)
returns table (id uuid, name text, owner_id uuid, invite_code text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
begin
  select families.id into v_family_id from families
    where families.invite_code = upper(p_invite_code);

  if v_family_id is null then
    raise exception 'Family not found';
  end if;

  if exists (select 1 from family_members where family_id = v_family_id and user_id = auth.uid()) then
    raise exception 'You are already a member of this family';
  end if;

  insert into family_members (family_id, user_id, role)
  values (v_family_id, auth.uid(), 'member');

  update profiles set family_id = v_family_id where id = auth.uid();

  return query select families.id, families.name, families.owner_id, families.invite_code, families.created_at
    from families where families.id = v_family_id;
end;
$$;

grant execute on function public.join_family(text) to authenticated;
