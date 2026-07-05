-- PoyPoyo Surf — logique de scoring (triggers) + RPC (crew / trip / awards)
-- Tout ce qui écrit dans `ledger` passe par du code SECURITY DEFINER : le client
-- ne fait jamais d'INSERT direct dans ledger.

-- ---------------------------------------------------------------------------
-- Helper : l'utilisateur courant est-il membre du crew ?
-- ---------------------------------------------------------------------------
create or replace function is_crew_member(_crew_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from crew_members
    where crew_id = _crew_id and user_id = auth.uid()
  );
$$;

-- Helper : crew d'une session (via trip)
create or replace function crew_of_session(_session_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select t.crew_id
  from sessions s join trips t on t.id = s.trip_id
  where s.id = _session_id;
$$;

-- ---------------------------------------------------------------------------
-- FAIT : dès 2 témoins, l'action passe `validated`.
-- Trigger sur action_witnesses (AFTER INSERT).
-- On empêche aussi de se témoigner soi-même.
-- ---------------------------------------------------------------------------
create or replace function fn_witness_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _author uuid;
  _count  int;
  _status text;
begin
  select user_id, status into _author, _status
  from actions where id = new.action_id;

  if _author = new.user_id then
    raise exception 'Tu ne peux pas être ton propre témoin.';
  end if;

  if _status = 'proposed' then
    select count(*) into _count from action_witnesses where action_id = new.action_id;
    if _count >= 2 then
      update actions set status = 'validated' where id = new.action_id and status = 'proposed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_witness_validate on action_witnesses;
create trigger trg_witness_validate
  after insert on action_witnesses
  for each row execute function fn_witness_validate();

-- ---------------------------------------------------------------------------
-- FAIT validé -> écriture ledger (idempotent via unique source).
-- Trigger sur actions (AFTER UPDATE OF status), quand on passe à `validated`.
-- ---------------------------------------------------------------------------
create or replace function fn_action_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _trip uuid;
begin
  if new.status = 'validated' and old.status is distinct from 'validated' then
    select t.id into _trip
    from sessions s join trips t on t.id = s.trip_id
    where s.id = new.session_id;

    insert into ledger (trip_id, user_id, source_type, source_id, points)
    values (_trip, new.user_id, 'action', new.id, new.points)
    on conflict (source_type, source_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_action_to_ledger on actions;
create trigger trg_action_to_ledger
  after update of status on actions
  for each row execute function fn_action_to_ledger();

-- ---------------------------------------------------------------------------
-- RPC create_crew : crée le crew, ajoute le créateur, seed le barème par
-- défaut, ouvre un premier trip actif. Retourne le crew.
-- ---------------------------------------------------------------------------
create or replace function create_crew(_name text, _trip_name text default 'Trip 1')
returns crews
language plpgsql
security definer
set search_path = public
as $$
declare
  _crew crews;
  _code text;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;

  -- code d'invitation court, lisible, unique
  loop
    _code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from crews where invite_code = _code);
  end loop;

  insert into crews (name, invite_code, created_by)
  values (_name, _code, auth.uid())
  returning * into _crew;

  insert into crew_members (crew_id, user_id) values (_crew.id, auth.uid());

  -- Barème par défaut
  insert into score_rules (crew_id, key, label, points, type) values
    (_crew.id, 'barrel',         'Barrel',                  3, 'fait'),
    (_crew.id, 'vague_jour',     'Vague du jour',           2, 'superlatif'),
    (_crew.id, 'engagement',     'Plus gros engagement',    2, 'superlatif'),
    (_crew.id, 'barrel_enferme', 'Barrel enfermé',          1, 'fait'),
    (_crew.id, 'cascade_jour',   'Cascade du jour',         1, 'superlatif'),
    (_crew.id, 'refus',          'Refus / circonstance',   -1, 'fait');

  insert into trips (crew_id, name, is_active) values (_crew.id, _trip_name, true);

  return _crew;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC join_crew : rejoint un crew via son invite_code. Retourne le crew.
-- ---------------------------------------------------------------------------
create or replace function join_crew(_code text)
returns crews
language plpgsql
security definer
set search_path = public
as $$
declare
  _crew crews;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;

  select * into _crew from crews where invite_code = upper(_code);
  if _crew.id is null then
    raise exception 'Code invalide.';
  end if;

  insert into crew_members (crew_id, user_id)
  values (_crew.id, auth.uid())
  on conflict do nothing;

  return _crew;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC new_trip : clôt le trip actif du crew et en ouvre un nouveau.
-- ---------------------------------------------------------------------------
create or replace function new_trip(_crew_id uuid, _name text)
returns trips
language plpgsql
security definer
set search_path = public
as $$
declare
  _trip trips;
begin
  if not is_crew_member(_crew_id) then
    raise exception 'Non membre du crew.';
  end if;

  update trips set is_active = false, ended_at = now()
  where crew_id = _crew_id and is_active;

  insert into trips (crew_id, name, is_active)
  values (_crew_id, _name, true)
  returning * into _trip;

  return _trip;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC open_awards : ouvre (si absents) les awards pour toutes les règles
-- superlatif actives du crew de la session. Retourne les awards de la session.
-- ---------------------------------------------------------------------------
create or replace function open_awards(_session_id uuid)
returns setof awards
language plpgsql
security definer
set search_path = public
as $$
declare
  _crew uuid;
begin
  _crew := crew_of_session(_session_id);
  if _crew is null or not is_crew_member(_crew) then
    raise exception 'Non autorisé.';
  end if;

  insert into awards (session_id, rule_id)
  select _session_id, r.id
  from score_rules r
  where r.crew_id = _crew and r.type = 'superlatif' and r.active
  on conflict (session_id, rule_id) do nothing;

  return query select * from awards where session_id = _session_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC close_award : détermine le gagnant (nominee le + voté ; égalité tranchée
-- par le vote le plus ancien), clôt l'award, écrit dans le ledger.
-- ---------------------------------------------------------------------------
create or replace function close_award(_award_id uuid)
returns awards
language plpgsql
security definer
set search_path = public
as $$
declare
  _award   awards;
  _crew    uuid;
  _winner  uuid;
  _points  int;
  _trip    uuid;
begin
  select * into _award from awards where id = _award_id;
  if _award.id is null then
    raise exception 'Award introuvable.';
  end if;

  _crew := crew_of_session(_award.session_id);
  if not is_crew_member(_crew) then
    raise exception 'Non autorisé.';
  end if;

  if _award.status = 'closed' then
    return _award; -- déjà clôturé, idempotent
  end if;

  -- gagnant = plus de votes, égalité -> vote reçu le plus tôt
  select nominee_id into _winner
  from award_votes
  where award_id = _award_id
  group by nominee_id
  order by count(*) desc, min(created_at) asc
  limit 1;

  select points into _points from score_rules where id = _award.rule_id;

  update awards
  set status = 'closed', winner_user_id = _winner
  where id = _award_id
  returning * into _award;

  if _winner is not null then
    select t.id into _trip
    from sessions s join trips t on t.id = s.trip_id
    where s.id = _award.session_id;

    insert into ledger (trip_id, user_id, source_type, source_id, points)
    values (_trip, _winner, 'award', _award.id, _points)
    on conflict (source_type, source_id) do nothing;
  end if;

  return _award;
end;
$$;
