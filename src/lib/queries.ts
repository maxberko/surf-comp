import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from './supabase';
import type {
  Action,
  ActionFeedItem,
  Award,
  AwardVote,
  Crew,
  LedgerEntry,
  Profile,
  ScoreRow,
  ScoreRule,
  Session,
  Trip,
} from './types';

// --------------------------------------------------------------------------
// Query keys
// --------------------------------------------------------------------------
export const qk = {
  myCrews: ['my-crews'] as const,
  profile: (id: string) => ['profile', id] as const,
  activeTrip: (crewId: string) => ['active-trip', crewId] as const,
  scores: (tripId: string) => ['scores', tripId] as const,
  rules: (crewId: string) => ['rules', crewId] as const,
  todaySession: (tripId: string) => ['today-session', tripId] as const,
  feed: (sessionId: string) => ['feed', sessionId] as const,
  awards: (sessionId: string) => ['awards', sessionId] as const,
  votes: (awardId: string) => ['votes', awardId] as const,
  journal: (tripId: string, userId: string) => ['journal', tripId, userId] as const,
};

const today = () => new Date().toISOString().slice(0, 10);

// --------------------------------------------------------------------------
// Profiles
// --------------------------------------------------------------------------
export function useProfile(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: qk.profile(userId ?? ''),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; pseudo: string; avatar_url?: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: input.id, pseudo: input.pseudo, avatar_url: input.avatar_url ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => qc.invalidateQueries({ queryKey: qk.profile(p.id) }),
  });
}

// --------------------------------------------------------------------------
// Crews & trips
// --------------------------------------------------------------------------
export function useMyCrews() {
  return useQuery({
    queryKey: qk.myCrews,
    queryFn: async (): Promise<Crew[]> => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('crews(*)')
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.crews).filter(Boolean) as Crew[];
    },
  });
}

export function useCrewMembers(crewId: string | undefined) {
  return useQuery({
    enabled: !!crewId,
    queryKey: ['crew-members', crewId ?? ''],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('profiles(*)')
        .eq('crew_id', crewId!);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.profiles).filter(Boolean) as Profile[];
    },
  });
}

export function useCreateCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; tripName?: string }) => {
      const { data, error } = await supabase.rpc('create_crew', {
        _name: input.name,
        _trip_name: input.tripName ?? 'Trip 1',
      });
      if (error) throw error;
      return data as unknown as Crew;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myCrews }),
  });
}

export function useJoinCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_crew', { _code: code.trim() });
      if (error) throw error;
      return data as unknown as Crew;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myCrews }),
  });
}

export function useActiveTrip(crewId: string | undefined) {
  return useQuery({
    enabled: !!crewId,
    queryKey: qk.activeTrip(crewId ?? ''),
    queryFn: async (): Promise<Trip | null> => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('crew_id', crewId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNewTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { crewId: string; name: string }) => {
      const { data, error } = await supabase.rpc('new_trip', {
        _crew_id: input.crewId,
        _name: input.name,
      });
      if (error) throw error;
      return data as unknown as Trip;
    },
    onSuccess: (_t, v) => {
      qc.invalidateQueries({ queryKey: qk.activeTrip(v.crewId) });
    },
  });
}

// --------------------------------------------------------------------------
// Classement (view user_scores + profils)
// --------------------------------------------------------------------------
export function useScores(tripId: string | undefined) {
  return useQuery({
    enabled: !!tripId,
    queryKey: qk.scores(tripId ?? ''),
    queryFn: async (): Promise<ScoreRow[]> => {
      const { data, error } = await supabase
        .from('user_scores')
        .select('*')
        .eq('trip_id', tripId!);
      if (error) throw error;
      const rows = data ?? [];
      const ids = rows.map((r) => r.user_id);
      const profiles = ids.length
        ? (await supabase.from('profiles').select('id, pseudo, avatar_url').in('id', ids)).data ?? []
        : [];
      const byId = new Map(profiles.map((p) => [p.id, p]));
      return rows
        .map((r) => ({
          ...r,
          profile: byId.get(r.user_id)
            ? { pseudo: byId.get(r.user_id)!.pseudo, avatar_url: byId.get(r.user_id)!.avatar_url }
            : null,
        }))
        .sort((a, b) => b.bites_de_surf - a.bites_de_surf || b.reste_cm - a.reste_cm);
    },
  });
}

// --------------------------------------------------------------------------
// Barème (score_rules)
// --------------------------------------------------------------------------
export function useRules(crewId: string | undefined) {
  return useQuery({
    enabled: !!crewId,
    queryKey: qk.rules(crewId ?? ''),
    queryFn: async (): Promise<ScoreRule[]> => {
      const { data, error } = await supabase
        .from('score_rules')
        .select('*')
        .eq('crew_id', crewId!)
        .order('points', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<ScoreRule> & { crew_id: string; key: string }) => {
      const { data, error } = await supabase
        .from('score_rules')
        .upsert(rule, { onConflict: 'crew_id,key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: qk.rules(r.crew_id) }),
  });
}

// --------------------------------------------------------------------------
// Session du jour + feed des faits
// --------------------------------------------------------------------------
export function useTodaySession(tripId: string | undefined) {
  return useQuery({
    enabled: !!tripId,
    queryKey: qk.todaySession(tripId ?? ''),
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('trip_id', tripId!)
        .eq('date', today())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useOpenSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tripId: string; spot?: string | null; userId: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ trip_id: input.tripId, spot: input.spot ?? null, created_by: input.userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (s) => qc.invalidateQueries({ queryKey: qk.todaySession(s.trip_id) }),
  });
}

export function useSessionFeed(sessionId: string | undefined) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: qk.feed(sessionId ?? ''),
    queryFn: async (): Promise<ActionFeedItem[]> => {
      const { data, error } = await supabase
        .from('actions')
        .select(
          `*,
           rule:score_rules(label, type, points),
           author:profiles(pseudo, avatar_url),
           witnesses:action_witnesses(user_id)`
        )
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ActionFeedItem[];
    },
  });
}

export function useLogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      userId: string;
      rule: ScoreRule;
      mediaUrl?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('actions')
        .insert({
          session_id: input.sessionId,
          user_id: input.userId,
          rule_id: input.rule.id,
          points: input.rule.points, // snapshot du barème
          media_url: input.mediaUrl ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Action;
    },
    onSuccess: (a) => qc.invalidateQueries({ queryKey: qk.feed(a.session_id) }),
  });
}

export function useWitness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { actionId: string; userId: string; sessionId: string }) => {
      const { error } = await supabase
        .from('action_witnesses')
        .insert({ action_id: input.actionId, user_id: input.userId });
      if (error) throw error;
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: qk.feed(v.sessionId) }),
  });
}

export function useContestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { actionId: string; sessionId: string }) => {
      const { error } = await supabase
        .from('actions')
        .update({ status: 'contested' })
        .eq('id', input.actionId)
        .eq('status', 'proposed'); // on ne conteste qu'avant validation
      if (error) throw error;
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: qk.feed(v.sessionId) }),
  });
}

// --------------------------------------------------------------------------
// Superlatifs (awards + votes)
// --------------------------------------------------------------------------
export function useAwards(sessionId: string | undefined) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: qk.awards(sessionId ?? ''),
    queryFn: async (): Promise<(Award & { rule: Pick<ScoreRule, 'label' | 'points'> | null })[]> => {
      const { data, error } = await supabase
        .from('awards')
        .select('*, rule:score_rules(label, points)')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useOpenAwards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc('open_awards', { _session_id: sessionId });
      if (error) throw error;
    },
    onSuccess: (_r, sessionId) => qc.invalidateQueries({ queryKey: qk.awards(sessionId) }),
  });
}

export function useAwardVotes(awardId: string | undefined) {
  return useQuery({
    enabled: !!awardId,
    queryKey: qk.votes(awardId ?? ''),
    queryFn: async (): Promise<AwardVote[]> => {
      const { data, error } = await supabase
        .from('award_votes')
        .select('*')
        .eq('award_id', awardId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { awardId: string; voterId: string; nomineeId: string }) => {
      const { error } = await supabase
        .from('award_votes')
        .upsert(
          { award_id: input.awardId, voter_id: input.voterId, nominee_id: input.nomineeId },
          { onConflict: 'award_id,voter_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: qk.votes(v.awardId) }),
  });
}

export function useCloseAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { awardId: string; sessionId: string }) => {
      const { error } = await supabase.rpc('close_award', { _award_id: input.awardId });
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: qk.awards(v.sessionId) });
    },
  });
}

// --------------------------------------------------------------------------
// Journal d'un rider (ledger détaillé sur le trip)
// --------------------------------------------------------------------------
export function useJournal(tripId: string | undefined, userId: string | undefined) {
  return useQuery({
    enabled: !!tripId && !!userId,
    queryKey: qk.journal(tripId ?? '', userId ?? ''),
    queryFn: async (): Promise<LedgerEntry[]> => {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('trip_id', tripId!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LedgerEntry[];
    },
  });
}

// --------------------------------------------------------------------------
// Realtime : refresh classement / feed / votes sur événement.
// --------------------------------------------------------------------------
function bump(qc: QueryClient, tripId?: string, sessionId?: string) {
  if (tripId) {
    qc.invalidateQueries({ queryKey: qk.scores(tripId) });
  }
  if (sessionId) {
    qc.invalidateQueries({ queryKey: qk.feed(sessionId) });
    qc.invalidateQueries({ queryKey: qk.awards(sessionId) });
  }
}

export function useRealtime(tripId: string | undefined, sessionId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!tripId && !sessionId) return;
    const channel = supabase
      .channel(`poypoyo:${tripId ?? 'none'}:${sessionId ?? 'none'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger' }, () =>
        bump(qc, tripId, sessionId)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actions' }, () =>
        bump(qc, tripId, sessionId)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_witnesses' }, () =>
        bump(qc, tripId, sessionId)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'awards' }, () =>
        bump(qc, tripId, sessionId)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'award_votes' }, () =>
        sessionId && qc.invalidateQueries({ queryKey: qk.awards(sessionId) })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, tripId, sessionId]);
}
