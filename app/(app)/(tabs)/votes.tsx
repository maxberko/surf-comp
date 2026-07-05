import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, EmptyState, Loader, Pill, Screen, Subtitle, Title } from '@/components/ui';
import { cm } from '@/lib/format';
import {
  useActiveTrip,
  useAwardVotes,
  useAwards,
  useCloseAward,
  useCrewMembers,
  useOpenAwards,
  useTodaySession,
  useVote,
} from '@/lib/queries';
import type { Award, AwardVote, Profile, ScoreRule } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCrew } from '@/providers/CrewProvider';
import { colors, radius, spacing } from '@/theme/colors';

type AwardWithRule = Award & { rule: Pick<ScoreRule, 'label' | 'points'> | null };

function AwardCard({
  award,
  members,
  sessionId,
}: {
  award: AwardWithRule;
  members: Profile[];
  sessionId: string;
}) {
  const { userId } = useAuth();
  const { data: votes = [] } = useAwardVotes(award.id);
  const vote = useVote();
  const closeAward = useCloseAward();

  const myVote = votes.find((v: AwardVote) => v.voter_id === userId);
  const tally = useMemo(() => {
    const m = new Map<string, number>();
    votes.forEach((v: AwardVote) => m.set(v.nominee_id, (m.get(v.nominee_id) ?? 0) + 1));
    return m;
  }, [votes]);

  const closed = award.status === 'closed';
  const winner = members.find((m) => m.id === award.winner_user_id);

  return (
    <Card style={styles.awardCard}>
      <View style={styles.awardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.awardTitle}>{award.rule?.label ?? 'Superlatif'}</Text>
          <Text style={styles.awardPts}>{cm(award.rule?.points ?? 0)} au gagnant</Text>
        </View>
        {closed ? (
          <Pill label="Clôturé" color={colors.textMuted} tint="rgba(143,169,189,0.14)" />
        ) : (
          <Pill label={`${votes.length} vote${votes.length > 1 ? 's' : ''}`} color={colors.coral} tint="rgba(255,122,89,0.14)" />
        )}
      </View>

      {closed ? (
        <View style={styles.winnerRow}>
          <Avatar pseudo={winner?.pseudo} url={winner?.avatar_url} size={40} rank={1} />
          <Text style={styles.winnerText}>
            🏅 {winner?.pseudo ?? 'Personne'} remporte le titre
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.nominees}>
            {members.map((m) => {
              const picked = myVote?.nominee_id === m.id;
              const count = tally.get(m.id) ?? 0;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => vote.mutate({ awardId: award.id, voterId: userId!, nomineeId: m.id })}
                  style={[styles.nominee, picked && styles.nomineePicked]}
                >
                  <Avatar pseudo={m.pseudo} url={m.avatar_url} size={32} />
                  <Text style={[styles.nomineeName, picked && styles.nomineeNamePicked]} numberOfLines={1}>
                    {m.pseudo}
                  </Text>
                  {count > 0 ? <Text style={styles.nomineeCount}>{count}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Clôturer & attribuer"
            variant="ghost"
            onPress={() =>
              Alert.alert('Clôturer ce superlatif ?', 'Le plus voté remporte les points.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Clôturer',
                  onPress: () => closeAward.mutate({ awardId: award.id, sessionId }),
                },
              ])
            }
            disabled={votes.length === 0}
          />
        </>
      )}
    </Card>
  );
}

export default function Votes() {
  const { crew } = useCrew();
  const { data: trip } = useActiveTrip(crew?.id);
  const { data: session, isLoading: sLoading } = useTodaySession(trip?.id);
  const { data: awards = [], isLoading: aLoading } = useAwards(session?.id);
  const { data: members = [] } = useCrewMembers(crew?.id);
  const openAwards = useOpenAwards();

  if (sLoading) return <Loader />;

  if (!session) {
    return (
      <Screen>
        <View style={styles.header}>
          <Title>Votes du soir</Title>
        </View>
        <EmptyState emoji="🌙" title="Pas de session aujourd’hui" hint="Ouvre la session pour lancer les superlatifs." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Votes du soir</Title>
        <Subtitle>Tranche les superlatifs de la session.</Subtitle>
      </View>

      {aLoading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {awards.length === 0 ? (
            <View style={styles.centered}>
              <EmptyState emoji="🗳️" title="Superlatifs pas encore ouverts" hint="Ouvre-les en fin de session." />
              <Button
                label="Ouvrir les superlatifs"
                onPress={() => openAwards.mutate(session.id)}
                loading={openAwards.isPending}
              />
            </View>
          ) : (
            awards.map((a: AwardWithRule) => (
              <AwardCard key={a.id} award={a} members={members} sessionId={session.id} />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 2 },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  centered: { gap: spacing.lg, paddingTop: spacing.xl },
  awardCard: { gap: spacing.md },
  awardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  awardTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  awardPts: { color: colors.textMuted, fontSize: 13 },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  winnerText: { color: colors.gold, fontWeight: '700', fontSize: 15, flex: 1 },
  nominees: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nominee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  nomineePicked: { borderColor: colors.coral, backgroundColor: 'rgba(255,122,89,0.12)' },
  nomineeName: { color: colors.text, fontWeight: '700', maxWidth: 110 },
  nomineeNamePicked: { color: colors.coral },
  nomineeCount: {
    color: colors.bg,
    backgroundColor: colors.coral,
    fontWeight: '800',
    fontSize: 12,
    minWidth: 20,
    textAlign: 'center',
    borderRadius: 10,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
});
