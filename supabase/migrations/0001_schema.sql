-- PoyPoyo Surf — schema
-- Unité de score maison : le centimètre (cm). 21 cm = 1 bite de surf.
-- Reset du classement = par trip. Source de vérité des points = ledger (append-only).

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  pseudo     text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Crew (la bande)
-- ---------------------------------------------------------------------------
create table if not exists crews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists crew_members (
  crew_id   uuid references crews(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Trip = saison (unité de reset du classement)
-- ---------------------------------------------------------------------------
create table if not exists trips (
  id         uuid primary key default gen_random_uuid(),
  crew_id    uuid references crews(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);

-- Un seul trip actif par crew.
create unique index if not exists trips_one_active_per_crew
  on trips (crew_id) where is_active;

-- ---------------------------------------------------------------------------
-- Session du jour
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references trips(id) on delete cascade,
  spot       text,
  date       date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Barème (éditable par crew, seedé par défaut à la création du crew)
-- ---------------------------------------------------------------------------
create table if not exists score_rules (
  id      uuid primary key default gen_random_uuid(),
  crew_id uuid references crews(id) on delete cascade,
  key     text not null,
  label   text not null,
  points  int  not null,
  type    text not null check (type in ('fait','superlatif')),
  active  boolean not null default true,
  unique (crew_id, key)
);

-- ---------------------------------------------------------------------------
-- Faits répétables (auto-déclarés, validés par 2 témoins)
-- ---------------------------------------------------------------------------
create table if not exists actions (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id    uuid references profiles(id),
  rule_id    uuid references score_rules(id),
  points     int  not null,        -- snapshot du barème au moment du log
  status     text not null default 'proposed'
             check (status in ('proposed','validated','contested')),
  media_url  text,                 -- preuve optionnelle, PAS de bonus de points
  created_at timestamptz not null default now()
);

create table if not exists action_witnesses (
  action_id  uuid references actions(id) on delete cascade,
  user_id    uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (action_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Superlatifs du jour (1 gagnant par session, au vote)
-- ---------------------------------------------------------------------------
create table if not exists awards (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references sessions(id) on delete cascade,
  rule_id        uuid references score_rules(id),
  winner_user_id uuid references profiles(id),
  status         text not null default 'open' check (status in ('open','closed')),
  created_at     timestamptz not null default now(),
  unique (session_id, rule_id)
);

create table if not exists award_votes (
  award_id   uuid references awards(id) on delete cascade,
  voter_id   uuid references profiles(id),
  nominee_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (award_id, voter_id)
);

-- ---------------------------------------------------------------------------
-- Ledger — source de vérité des points (append-only)
-- Une seule écriture par source (action validée / award clôturé) : garanti par
-- l'unique (source_type, source_id). Empêche tout double comptage.
-- ---------------------------------------------------------------------------
create table if not exists ledger (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references trips(id) on delete cascade,
  user_id     uuid references profiles(id),
  source_type text not null check (source_type in ('action','award')),
  source_id   uuid not null,
  points      int  not null,
  created_at  timestamptz not null default now(),
  unique (source_type, source_id)
);

-- ---------------------------------------------------------------------------
-- Classement calculé — cm cumulés, bites de surf (paliers de 21), reste reporté
-- ---------------------------------------------------------------------------
create or replace view user_scores as
select
  l.trip_id,
  l.user_id,
  coalesce(sum(l.points), 0)                              as total_cm,
  floor(coalesce(sum(l.points), 0) / 21.0)::int           as bites_de_surf,
  coalesce(sum(l.points), 0)
    - floor(coalesce(sum(l.points), 0) / 21.0)::int * 21  as reste_cm
from ledger l
group by l.trip_id, l.user_id;

-- Helpful indexes
create index if not exists idx_ledger_trip on ledger(trip_id);
create index if not exists idx_actions_session on actions(session_id);
create index if not exists idx_witnesses_action on action_witnesses(action_id);
create index if not exists idx_sessions_trip on sessions(trip_id);
create index if not exists idx_trips_crew on trips(crew_id);
