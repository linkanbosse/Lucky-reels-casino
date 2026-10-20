-- Lucky Reels – databas för konton, saldo och topplistor.
--
-- Kör hela filen en gång i Supabase: SQL Editor → New query → klistra in → Run.
-- Filen går att köra igen utan att något går sönder (den ersätter funktionerna).
--
-- Säkerhet: spelare kan bara LÄSA profiler (för topplistan). Saldot ändras
-- enbart via funktionerna nedan, som kontrollerar inloggning, insatsgränser
-- och att saldot räcker.

-- ---------- Profiler ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  balance bigint not null default 10000 check (balance >= 0),
  total_won bigint not null default 0,
  biggest_win bigint not null default 0,
  spins bigint not null default 0,
  last_bet bigint not null default 0,
  last_daily timestamptz,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_ÅÄÖåäö]{3,20}$')
);

create unique index if not exists profiles_username_lower on public.profiles (lower(username));
create index if not exists profiles_balance on public.profiles (balance desc);
create index if not exists profiles_biggest_win on public.profiles (biggest_win desc);

alter table public.profiles enable row level security;

drop policy if exists "Alla kan läsa profiler" on public.profiles;
create policy "Alla kan läsa profiler" on public.profiles for select using (true);
-- Inga insert/update/delete-policies: ändringar sker bara via funktionerna nedan.

-- ---------- Skapa profil automatiskt vid registrering ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'username', '');
  chosen text;
begin
  if wanted ~ '^[A-Za-z0-9_ÅÄÖåäö]{3,20}$'
     and not exists (select 1 from profiles where lower(username) = lower(wanted)) then
    chosen := wanted;
  else
    chosen := 'Spelare_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into profiles (id, username) values (new.id, chosen);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Är användarnamnet ledigt? ----------
create or replace function public.username_available(p_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_name ~ '^[A-Za-z0-9_ÅÄÖåäö]{3,20}$'
     and not exists (select 1 from profiles where lower(username) = lower(p_name));
$$;

-- ---------- En spelrunda: dra insats och/eller betala ut vinst ----------
-- p_bet: insatsen (0 för free spins), p_win: vinsten. Returnerar nytt saldo.
create or replace function public.apply_round(p_bet bigint, p_win bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  new_balance bigint;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  if p_bet is null or p_win is null or p_bet < 0 or p_win < 0 or p_bet > 1000 then
    raise exception 'invalid_amount';
  end if;

  select * into me from profiles where id = auth.uid() for update;
  if not found then
    raise exception 'no_profile';
  end if;
  if p_bet > me.balance then
    raise exception 'insufficient_funds';
  end if;
  -- Ingen enskild vinst får vara större än 10 000 × senaste insatsen
  if p_win > greatest(me.last_bet, p_bet, 10) * 10000 then
    raise exception 'win_too_large';
  end if;

  update profiles set
    balance = balance - p_bet + p_win,
    spins = spins + case when p_bet > 0 then 1 else 0 end,
    last_bet = case when p_bet > 0 then p_bet else last_bet end,
    total_won = total_won + p_win,
    biggest_win = greatest(biggest_win, p_win)
  where id = auth.uid()
  returning balance into new_balance;

  return new_balance;
end;
$$;

-- ---------- Daglig bonus (1 000 mynt var 24:e timme) ----------
create or replace function public.claim_daily()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  select * into me from profiles where id = auth.uid() for update;
  if me.last_daily is not null and me.last_daily > now() - interval '24 hours' then
    return json_build_object('ok', false, 'balance', me.balance, 'last_daily', me.last_daily);
  end if;
  update profiles set balance = balance + 1000, last_daily = now()
  where id = auth.uid()
  returning * into me;
  return json_build_object('ok', true, 'balance', me.balance, 'last_daily', me.last_daily);
end;
$$;

-- ---------- Gratis påfyllning när saldot är under 100 ----------
create or replace function public.refill()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance bigint;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  update profiles set balance = 10000
  where id = auth.uid() and balance < 100
  returning balance into new_balance;
  if new_balance is null then
    select balance into new_balance from profiles where id = auth.uid();
  end if;
  return new_balance;
end;
$$;

-- ---------- Behörigheter ----------
revoke execute on function public.apply_round(bigint, bigint) from public, anon;
revoke execute on function public.claim_daily() from public, anon;
revoke execute on function public.refill() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.apply_round(bigint, bigint) to authenticated;
grant execute on function public.claim_daily() to authenticated;
grant execute on function public.refill() to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
