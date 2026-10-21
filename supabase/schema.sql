-- Lucky Reels – databas för konton, saldo, topplistor, nivåer, turneringar och admin.
--
-- Kör hela filen i Supabase: SQL Editor → New query → klistra in → Run.
-- Filen går att köra igen utan att något går sönder (den lägger bara till det som saknas
-- och ersätter funktionerna). Kör den igen varje gång den uppdateras.
--
-- Säkerhet: spelare kan bara LÄSA profiler (för topplistan). Saldot ändras
-- enbart via funktionerna nedan, som kontrollerar inloggning, insatsgränser
-- och att saldot räcker.

-- ---------- Profiler ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  balance bigint not null default 100000 check (balance >= 0),
  total_won bigint not null default 0,
  biggest_win bigint not null default 0,
  spins bigint not null default 0,
  last_bet bigint not null default 0,
  last_daily timestamptz,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_ÅÄÖåäö]{3,20}$')
);

-- Kolumner som lagts till senare (finns de redan händer inget)
alter table public.profiles add column if not exists xp bigint not null default 0;
alter table public.profiles add column if not exists level int not null default 1;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists watch_day date;
alter table public.profiles add column if not exists watch_today int not null default 0;
alter table public.profiles add column if not exists watch_started timestamptz;
alter table public.profiles add column if not exists last_watch timestamptz;

-- Nya konton får 100 000 kr (låtsaspengar)
alter table public.profiles alter column balance set default 100000;

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

-- ---------- Daglig bonus (10 000 kr var 24:e timme) ----------
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
  update profiles set balance = balance + 10000, last_daily = now()
  where id = auth.uid()
  returning * into me;
  return json_build_object('ok', true, 'balance', me.balance, 'last_daily', me.last_daily);
end;
$$;

-- ---------- Gratis påfyllning till 100 000 kr när saldot är under 1 000 ----------
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
  update profiles set balance = 100000
  where id = auth.uid() and balance < 1000
  returning balance into new_balance;
  if new_balance is null then
    select balance into new_balance from profiles where id = auth.uid();
  end if;
  return new_balance;
end;
$$;

-- ---------- Inställningar (t.ex. meddelande i lobbyn) ----------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "Alla kan läsa inställningar" on public.settings;
create policy "Alla kan läsa inställningar" on public.settings for select using (true);

-- ---------- Turneringar ----------
create table if not exists public.tournaments (
  id bigint generated always as identity primary key,
  name text not null check (length(name) between 3 and 60),
  game_id text,                                   -- null = alla spel
  metric text not null default 'multiplier' check (metric in ('multiplier', 'total_win', 'spins')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  prize_pool bigint not null default 0 check (prize_pool >= 0),
  entry_fee bigint not null default 0 check (entry_fee >= 0),
  prizes int[] not null default '{50,30,20}',     -- procent av potten till plats 1, 2, 3 …
  settled boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.tournament_entries (
  tournament_id bigint not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score numeric not null default 0,
  spins int not null default 0,
  prize bigint not null default 0,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);
create index if not exists tournament_entries_rank on public.tournament_entries (tournament_id, score desc);

alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;
drop policy if exists "Alla kan läsa turneringar" on public.tournaments;
create policy "Alla kan läsa turneringar" on public.tournaments for select using (true);
drop policy if exists "Alla kan läsa deltagare" on public.tournament_entries;
create policy "Alla kan läsa deltagare" on public.tournament_entries for select using (true);

-- ---------- Engångsbyte till kronor med högre insatser (allt ×10) ----------
-- Körs bara första gången filen körs efter uppdateringen; flaggan i settings hindrar dubbel uppräkning.
do $$
begin
  if not exists (select 1 from public.settings where key = 'economy_v2') then
    update public.profiles set
      balance = balance * 10,
      total_won = total_won * 10,
      biggest_win = biggest_win * 10,
      last_bet = last_bet * 10;
    update public.tournaments set prize_pool = prize_pool * 10, entry_fee = entry_fee * 10 where not settled;
    update public.tournament_entries e set score = score * 10
      from public.tournaments t
      where e.tournament_id = t.id and not t.settled and t.metric = 'total_win';
    insert into public.settings (key, value) values ('economy_v2', 'true'::jsonb);
  end if;
end $$;

-- En första turnering så att listan inte är tom
insert into public.tournaments (name, metric, ends_at, prize_pool)
select 'Veckans storvinst', 'multiplier', now() + interval '7 days', 1000000
where not exists (select 1 from public.tournaments);

-- ---------- Nivåer ----------
-- XP per snurr: 10 + insatsen/200 (max 60). Nivå = floor(sqrt(xp/100)) + 1.
-- Ny nivå N ger N × 2 500 kr. Samma formler finns i js/lib/levels.js.
create or replace function public.level_for_xp(p_xp bigint)
returns int
language sql
immutable
as $$ select floor(sqrt(greatest(p_xp, 0) / 100.0))::int + 1 $$;

-- ---------- En spelrunda: dra insats och/eller betala ut vinst ----------
-- p_bet: insatsen (0 för free spins och vinster), p_win: vinsten, p_game: spelets id.
-- Returnerar nytt saldo, XP, nivå och eventuell nivåbelöning.
create or replace function public.play_round(p_bet bigint, p_win bigint, p_game text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  gained int := 0;
  new_level int;
  reward bigint := 0;
  ref_bet bigint;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  -- Insatsen får vara högst 10 000 per snurr, och upp till 10 000 000 för bonusköp
  if p_bet is null or p_win is null or p_bet < 0 or p_win < 0 or p_bet > 10000000 then
    raise exception 'invalid_amount';
  end if;

  select * into me from profiles where id = auth.uid() for update;
  if not found then
    raise exception 'no_profile';
  end if;
  if me.banned then
    raise exception 'banned';
  end if;
  if p_bet > me.balance then
    raise exception 'insufficient_funds';
  end if;
  -- Ingen enskild vinst får vara större än 10 000 × senaste insatsen
  ref_bet := greatest(me.last_bet, p_bet, 10);
  if p_win > ref_bet * 10000 then
    raise exception 'win_too_large';
  end if;

  if p_bet > 0 then
    gained := 10 + least(p_bet, 10000) / 200;
  end if;
  new_level := level_for_xp(me.xp + gained);
  if new_level > me.level then
    -- Summan av N × 2 500 för varje ny nivå
    select coalesce(sum(n * 2500), 0) into reward from generate_series(me.level + 1, new_level) as n;
  end if;

  update profiles set
    balance = balance - p_bet + p_win + reward,
    spins = spins + case when p_bet > 0 then 1 else 0 end,
    last_bet = case when p_bet > 0 then p_bet else last_bet end,
    total_won = total_won + p_win,
    biggest_win = greatest(biggest_win, p_win),
    xp = xp + gained,
    level = new_level,
    last_seen = now()
  where id = auth.uid()
  returning * into me;

  -- Turneringspoäng för de turneringar spelaren är med i just nu
  update tournament_entries e set
    score = case t.metric
      when 'multiplier' then greatest(e.score, case when p_win > 0 then round(p_win::numeric / greatest(me.last_bet, 1), 2) else 0 end)
      when 'total_win' then e.score + p_win
      else e.score + case when p_bet > 0 then 1 else 0 end
    end,
    spins = e.spins + case when p_bet > 0 then 1 else 0 end
  from tournaments t
  where e.tournament_id = t.id
    and e.user_id = auth.uid()
    and now() between t.starts_at and t.ends_at
    and (t.game_id is null or t.game_id = p_game);

  return json_build_object('balance', me.balance, 'xp', me.xp, 'level', me.level, 'reward', reward);
end;
$$;

-- Äldre version av sidan anropar apply_round – den leder vidare till play_round
create or replace function public.apply_round(p_bet bigint, p_win bigint)
returns bigint
language sql
security definer
set search_path = public
as $$ select (play_round(p_bet, p_win, null) ->> 'balance')::bigint $$;

-- ---------- "Titta och få mynt" ----------
-- Spelaren tittar på en bild i 20 sekunder och får 2 500 kr.
-- Högst 10 gånger per dygn och minst 3 minuter mellan gångerna.
-- start_watch() startar klockan, claim_watch_reward() kräver att 20 sekunder gått.
create or replace function public.start_watch()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  today date := (now() at time zone 'Europe/Stockholm')::date;
  used int;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  select * into me from profiles where id = auth.uid() for update;
  if me.banned then
    raise exception 'banned';
  end if;
  used := case when me.watch_day = today then me.watch_today else 0 end;
  if used >= 10 then
    return json_build_object('ok', false, 'reason', 'limit', 'left', 0);
  end if;
  if me.last_watch is not null and me.last_watch > now() - interval '3 minutes' then
    return json_build_object('ok', false, 'reason', 'wait', 'wait_s', ceil(extract(epoch from me.last_watch + interval '3 minutes' - now())), 'left', 10 - used);
  end if;
  update profiles set watch_started = now() where id = auth.uid();
  return json_build_object('ok', true, 'left', 10 - used);
end;
$$;

create or replace function public.claim_watch_reward()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  today date := (now() at time zone 'Europe/Stockholm')::date;
  used int;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  select * into me from profiles where id = auth.uid() for update;
  used := case when me.watch_day = today then me.watch_today else 0 end;
  if me.banned or used >= 10 or me.watch_started is null or me.watch_started > now() - interval '19 seconds' then
    return json_build_object('ok', false, 'balance', me.balance);
  end if;
  update profiles set
    balance = balance + 2500,
    watch_day = today,
    watch_today = used + 1,
    watch_started = null,
    last_watch = now()
  where id = auth.uid()
  returning * into me;
  return json_build_object('ok', true, 'balance', me.balance, 'left', 10 - me.watch_today);
end;
$$;

-- ---------- Turneringar: gå med och dela ut priser ----------
create or replace function public.join_tournament(p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  t tournaments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  select * into t from tournaments where id = p_id for update;
  if not found or now() > t.ends_at or t.settled then
    raise exception 'tournament_closed';
  end if;
  if exists (select 1 from tournament_entries where tournament_id = p_id and user_id = auth.uid()) then
    raise exception 'already_joined';
  end if;
  select * into me from profiles where id = auth.uid() for update;
  if me.banned then
    raise exception 'banned';
  end if;
  if me.balance < t.entry_fee then
    raise exception 'insufficient_funds';
  end if;
  update profiles set balance = balance - t.entry_fee where id = auth.uid() returning * into me;
  update tournaments set prize_pool = prize_pool + t.entry_fee where id = p_id;
  insert into tournament_entries (tournament_id, user_id) values (p_id, auth.uid());
  return json_build_object('balance', me.balance);
end;
$$;

-- Delar ut priserna i avslutade turneringar. Kan anropas av vem som helst – den gör
-- bara något för turneringar som tagit slut och inte redan avgjorts.
create or replace function public.settle_tournaments()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  t tournaments%rowtype;
  e record;
  done int := 0;
  place int;
  amount bigint;
begin
  for t in select * from tournaments where not settled and ends_at < now() for update skip locked loop
    place := 0;
    for e in
      select user_id from tournament_entries
      where tournament_id = t.id and score > 0
      order by score desc, joined_at
      limit coalesce(array_length(t.prizes, 1), 0)
    loop
      place := place + 1;
      amount := floor(t.prize_pool * t.prizes[place] / 100.0);
      update tournament_entries set prize = amount where tournament_id = t.id and user_id = e.user_id;
      update profiles set balance = balance + amount where id = e.user_id;
    end loop;
    update tournaments set settled = true where id = t.id;
    done := done + 1;
  end loop;
  return done;
end;
$$;

-- ---------- Admin ----------
-- Gör dig själv till admin en gång (byt namnet):
--   update public.profiles set is_admin = true where username = 'DittAnvändarnamn';
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;

create or replace function public.admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return json_build_object(
    'users', (select count(*) from profiles),
    'new_24h', (select count(*) from profiles where created_at > now() - interval '24 hours'),
    'active_24h', (select count(*) from profiles where last_seen > now() - interval '24 hours'),
    'active_7d', (select count(*) from profiles where last_seen > now() - interval '7 days'),
    'banned', (select count(*) from profiles where banned),
    'coins', (select coalesce(sum(balance), 0) from profiles),
    'spins', (select coalesce(sum(spins), 0) from profiles),
    'tournaments_active', (select count(*) from tournaments where now() between starts_at and ends_at)
  );
end;
$$;

drop function if exists public.admin_users(text, int);
create or replace function public.admin_users(p_search text default '', p_limit int default 50)
returns table (
  id uuid, username text, email text, balance bigint, level int, xp bigint, spins bigint,
  biggest_win bigint, banned boolean, is_admin boolean, created_at timestamptz, last_seen timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return query
    select p.id, p.username, u.email::text, p.balance, p.level, p.xp, p.spins, p.biggest_win, p.banned, p.is_admin, p.created_at, p.last_seen
    from profiles p
    left join auth.users u on u.id = p.id
    where coalesce(p_search, '') = ''
       or p.username ilike '%' || p_search || '%'
       or u.email ilike '%' || p_search || '%'
    order by p.last_seen desc nulls last, p.created_at desc
    limit least(greatest(p_limit, 1), 200);
end;
$$;

create or replace function public.admin_update_user(p_user uuid, p_balance bigint default null, p_banned boolean default null, p_admin boolean default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if p_user = auth.uid() and (p_banned is true or p_admin is false) then
    raise exception 'cannot_change_self';
  end if;
  if p_balance is not null and p_balance < 0 then raise exception 'invalid_amount'; end if;
  update profiles set
    balance = coalesce(p_balance, balance),
    banned = coalesce(p_banned, banned),
    is_admin = coalesce(p_admin, is_admin)
  where id = p_user;
end;
$$;

create or replace function public.admin_save_tournament(
  p_name text, p_game text, p_metric text, p_starts timestamptz, p_ends timestamptz,
  p_pool bigint, p_fee bigint default 0, p_prizes int[] default '{50,30,20}'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  insert into tournaments (name, game_id, metric, starts_at, ends_at, prize_pool, entry_fee, prizes)
  values (p_name, nullif(p_game, ''), p_metric, coalesce(p_starts, now()), p_ends, p_pool, coalesce(p_fee, 0), p_prizes)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.admin_end_tournament(p_id bigint, p_delete boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if p_delete then
    delete from tournaments where id = p_id and not settled;
  else
    update tournaments set ends_at = now() - interval '1 second' where id = p_id and not settled and ends_at > now();
    perform settle_tournaments();
  end if;
end;
$$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  insert into settings (key, value, updated_at) values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

-- ---------- Behörigheter ----------
-- Funktioner är som standard körbara av alla – stäng allt och öppna det som behövs.
revoke execute on all functions in schema public from public, anon;
revoke execute on function public.handle_new_user() from authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.settle_tournaments() to anon, authenticated;
grant execute on function public.level_for_xp(bigint) to anon, authenticated;
grant execute on function public.play_round(bigint, bigint, text) to authenticated;
grant execute on function public.apply_round(bigint, bigint) to authenticated;
grant execute on function public.claim_daily() to authenticated;
grant execute on function public.refill() to authenticated;
grant execute on function public.join_tournament(bigint) to authenticated;
grant execute on function public.start_watch() to authenticated;
grant execute on function public.claim_watch_reward() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_users(text, int) to authenticated;
grant execute on function public.admin_update_user(uuid, bigint, boolean, boolean) to authenticated;
grant execute on function public.admin_save_tournament(text, text, text, timestamptz, timestamptz, bigint, bigint, int[]) to authenticated;
grant execute on function public.admin_end_tournament(bigint, boolean) to authenticated;
grant execute on function public.admin_set_setting(text, jsonb) to authenticated;
