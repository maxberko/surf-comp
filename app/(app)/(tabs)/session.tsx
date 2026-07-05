import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, EmptyState, Loader, Pill, Screen, Subtitle, Title } from '@/components/ui';
import { signed } from '@/lib/format';
import {
  useActiveTrip,
  useContestAction,
  useOpenSession,
  useSessionFeed,
  useTodaySession,
  useWitness,
} from '@/lib/queries';
import type { ActionFeedItem } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCrew } from '@/providers/CrewProvider';
import { colors, radius, spacing } from '@/theme/colors';

function StatusPill({ item }: { item: ActionFeedItem }) {
  if (item.status === 'validated') return <Pill label="✅ Validé" color={colors.success} tint="rgba(63,207,142,0.14)" />;
  if (item.status === 'contested') return <Pill label="⚠️ Contesté" color={colors.danger} tint="rgba(229,84,75,0.14)" />;
  return (
    <Pill
      label={`${item.witnesses.length}/2 témoins`}
      color={colors.wave}
      tint="rgba(56,163,209,0.14)"
    />
  );
}

export default function SessionScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { crew } = useCrew();
  const { data: trip } = useActiveTrip(crew?.id);
  const { data: session, isLoading: sessionLoading } = useTodaySession(trip?.id);
  const {
    data: feed = [],
    isLoading: feedLoading,
    refetch,
    isRefetching,
  } = useSessionFeed(session?.id);
  const openSession = useOpenSession();
  const witness = useWitness();
  const contest = useContestAction();

  const open = async () => {
    if (!trip || !userId) return;
    try {
      await openSession.mutateAsync({ tripId: trip.id, userId });
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  if (sessionLoading) return <Loader label="Session du jour…" />;

  if (!session) {
    return (
      <Screen>
        <View style={styles.header}>
          <Title>Session</Title>
          <Subtitle>{trip?.name}</Subtitle>
        </View>
        <View style={styles.centered}>
          <EmptyState
            emoji="🌅"
            title="Pas encore de session aujourd’hui"
            hint="Ouvre la session du jour pour commencer à logger."
          />
          <Button label="Ouvrir la session du jour" onPress={open} loading={openSession.isPending} />
        </View>
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: ActionFeedItem }) => {
    const isAuthor = item.user_id === userId;
    const alreadyWitnessed = item.witnesses.some((w) => w.user_id === userId);
    const canWitness = !isAuthor && !alreadyWitnessed && item.status === 'proposed';
    const canContest = item.status === 'proposed';

    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <Avatar pseudo={item.author?.pseudo} url={item.author?.avatar_url} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.author}>{item.author?.pseudo ?? 'Rider'}</Text>
            <Text style={styles.ruleLabel}>
              {item.rule?.label ?? 'Fait'} {item.media_url ? '· 📎 preuve' : ''}
            </Text>
          </View>
          <Text style={[styles.points, item.points < 0 && styles.pointsNeg]}>
            {signed(item.points)} <Text style={styles.pointsUnit}>cm</Text>
          </Text>
        </View>

        <View style={styles.cardBottom}>
          <StatusPill item={item} />
          {item.status === 'proposed' ? (
            <View style={styles.actionsRow}>
              {canWitness ? (
                <Pressable
                  style={styles.witnessBtn}
                  onPress={() =>
                    witness.mutate({ actionId: item.id, userId: userId!, sessionId: session.id })
                  }
                >
                  <Text style={styles.witnessText}>👀 Je valide</Text>
                </Pressable>
              ) : null}
              {canContest ? (
                <Pressable
                  style={styles.contestBtn}
                  onPress={() => contest.mutate({ actionId: item.id, sessionId: session.id })}
                >
                  <Text style={styles.contestText}>Contester</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Session</Title>
        <Subtitle>
          {trip?.name} · {session.spot ?? 'Spot ?'} · {session.date}
        </Subtitle>
      </View>

      {feedLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState emoji="📝" title="Aucun fait loggé" hint="Sois le premier à te la raconter." />
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/(app)/add-fact')}>
        <Text style={styles.fabText}>＋ Ajouter un fait</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 2 },
  centered: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  list: { gap: spacing.md, paddingBottom: 96 },
  card: { gap: spacing.md, paddingVertical: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  author: { color: colors.text, fontWeight: '700', fontSize: 15 },
  ruleLabel: { color: colors.textMuted, fontSize: 13 },
  points: { color: colors.accent, fontWeight: '800', fontSize: 18 },
  pointsNeg: { color: colors.danger },
  pointsUnit: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  witnessBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  witnessText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  contestBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  contestText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#3A0F02', fontWeight: '800', fontSize: 16 },
});
