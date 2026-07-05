// Types applicatifs + shape minimale de la base pour supabase-js.
// (Régénérables via `supabase gen types typescript`, mais on garde une version
// écrite à la main, lisible, alignée sur les migrations.)

export type RuleType = 'fait' | 'superlatif';
export type ActionStatus = 'proposed' | 'validated' | 'contested';
export type AwardStatus = 'open' | 'closed';

export type Profile = {
  id: string;
  pseudo: string;
  avatar_url: string | null;
  created_at: string;
};

export type Crew = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  crew_id: string;
  name: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
};

export type Session = {
  id: string;
  trip_id: string;
  spot: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
};

export type ScoreRule = {
  id: string;
  crew_id: string;
  key: string;
  label: string;
  points: number;
  type: RuleType;
  active: boolean;
};

export type Action = {
  id: string;
  session_id: string;
  user_id: string;
  rule_id: string;
  points: number;
  status: ActionStatus;
  media_url: string | null;
  created_at: string;
};

export type ActionWitness = {
  action_id: string;
  user_id: string;
  created_at: string;
};

export type Award = {
  id: string;
  session_id: string;
  rule_id: string;
  winner_user_id: string | null;
  status: AwardStatus;
  created_at: string;
};

export type AwardVote = {
  award_id: string;
  voter_id: string;
  nominee_id: string;
  created_at: string;
};

export type UserScore = {
  trip_id: string;
  user_id: string;
  total_cm: number;
  bites_de_surf: number;
  reste_cm: number;
};

// Vues enrichies utilisées par l'UI (jointures faites côté requête).
export type ActionFeedItem = Action & {
  rule: Pick<ScoreRule, 'label' | 'type' | 'points'> | null;
  author: Pick<Profile, 'pseudo' | 'avatar_url'> | null;
  witnesses: { user_id: string }[];
};

export type ScoreRow = UserScore & {
  profile: Pick<Profile, 'pseudo' | 'avatar_url'> | null;
};

export type LedgerEntry = {
  id: string;
  trip_id: string;
  user_id: string;
  source_type: 'action' | 'award';
  source_id: string;
  points: number;
  created_at: string;
};
