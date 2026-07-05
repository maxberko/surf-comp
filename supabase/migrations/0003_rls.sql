-- PoyPoyo Surf — Row Level Security
-- Principe : un rider ne voit et n'écrit que dans les crews dont il est membre.
-- Les écritures dans `ledger` sont réservées aux fonctions SECURITY DEFINER
-- (aucune policy INSERT/UPDATE/DELETE ici -> le client ne peut pas y toucher).

alter table profiles         enable row level security;
alter table crews            enable row level security;
alter table crew_members     enable row level security;
alter table trips            enable row level security;
alter table sessions         enable row level security;
alter table score_rules      enable row level security;
alter table actions          enable row level security;
alter table action_witnesses enable row level security;
alter table awards           enable row level security;
alter table award_votes      enable row level security;
alter table ledger           enable row level security;

-- ------------------------- profiles -------------------------
create policy "profiles_select_all" on profiles
  for select to authenticated using (true);
create policy "profiles_insert_self" on profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------- crews -------------------------
-- Lecture réservée aux membres. La recherche par invite_code passe par la RPC
-- join_crew (SECURITY DEFINER), donc pas besoin d'exposer tous les crews.
create policy "crews_select_member" on crews
  for select to authenticated using (is_crew_member(id));

-- ------------------------- crew_members -------------------------
create policy "members_select_member" on crew_members
  for select to authenticated using (is_crew_member(crew_id));
-- (l'ajout se fait via create_crew / join_crew)

-- ------------------------- trips -------------------------
create policy "trips_select_member" on trips
  for select to authenticated using (is_crew_member(crew_id));
-- (création via new_trip / create_crew)

-- ------------------------- sessions -------------------------
create policy "sessions_select_member" on sessions
  for select to authenticated
  using (is_crew_member((select crew_id from trips where id = trip_id)));
create policy "sessions_insert_member" on sessions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and is_crew_member((select crew_id from trips where id = trip_id))
  );

-- ------------------------- score_rules (barème éditable par le crew) -------------------------
create policy "rules_select_member" on score_rules
  for select to authenticated using (is_crew_member(crew_id));
create policy "rules_write_member" on score_rules
  for all to authenticated
  using (is_crew_member(crew_id))
  with check (is_crew_member(crew_id));

-- ------------------------- actions -------------------------
create policy "actions_select_member" on actions
  for select to authenticated using (is_crew_member(crew_of_session(session_id)));
create policy "actions_insert_self" on actions
  for insert to authenticated
  with check (user_id = auth.uid() and is_crew_member(crew_of_session(session_id)));
-- Contestation : un membre peut mettre à jour le statut (proposed->contested).
create policy "actions_update_member" on actions
  for update to authenticated
  using (is_crew_member(crew_of_session(session_id)))
  with check (is_crew_member(crew_of_session(session_id)));

-- ------------------------- action_witnesses -------------------------
create policy "witness_select_member" on action_witnesses
  for select to authenticated
  using (is_crew_member(crew_of_session((select session_id from actions where id = action_id))));
create policy "witness_insert_self" on action_witnesses
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_crew_member(crew_of_session((select session_id from actions where id = action_id)))
  );

-- ------------------------- awards -------------------------
create policy "awards_select_member" on awards
  for select to authenticated using (is_crew_member(crew_of_session(session_id)));
-- (ouverture/clôture via open_awards / close_award)

-- ------------------------- award_votes -------------------------
create policy "votes_select_member" on award_votes
  for select to authenticated
  using (is_crew_member(crew_of_session((select session_id from awards where id = award_id))));
create policy "votes_insert_self" on award_votes
  for insert to authenticated
  with check (
    voter_id = auth.uid()
    and is_crew_member(crew_of_session((select session_id from awards where id = award_id)))
  );
create policy "votes_update_self" on award_votes
  for update to authenticated
  using (voter_id = auth.uid())
  with check (voter_id = auth.uid());

-- ------------------------- ledger (lecture seule côté client) -------------------------
create policy "ledger_select_member" on ledger
  for select to authenticated
  using (is_crew_member((select crew_id from trips where id = trip_id)));

-- ---------------------------------------------------------------------------
-- Realtime : publier les tables qui alimentent classement + feed + votes.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table ledger;
alter publication supabase_realtime add table actions;
alter publication supabase_realtime add table action_witnesses;
alter publication supabase_realtime add table awards;
alter publication supabase_realtime add table award_votes;
