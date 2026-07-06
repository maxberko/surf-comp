import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BiteMeter } from '@/components/BiteMeter';
import { DickGlyph } from '@/components/DickGlyph';
import { Button, Card, EmptyState, Loader, Screen, Subtitle } from '@/components/ui';
import { bitesLabel, cm, signed } from '@/lib/format';
import { useActiveTrip, useJournal, useProfile, useScores } from '@/lib/queries';
import type { LedgerEntry, ScoreRow } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCrew } from '@/providers/CrewProvider';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, signOut } = useAuth();
  const { crew } = useCrew();
  const { data: trip } = useActiveTrip(crew?.id);
  const { data: profile, isLoading } = useProfile(id);
  const { data: scores = [] } = useScores(trip?.id);
  const { data: journal = [] } = useJournal(trip?.id, id);

  const me = scores.find((s: ScoreRow) => s.user_id === id);
  const isMe = id === userId;

  if (isLoading) return <Loader />;

  return (
    <Screen>
      <FlatList
        data={journal}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.head}>
            <Avatar pseudo={profile?.pseudo} url={profile?.avatar_url} size={96} />
            <Text style={styles.pseudo}>{profile?.pseudo ?? 'Rider'}</Text>
            <Subtitle>{trip?.name ?? 'Trip'}</Subtitle>

            <Card style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreCell}>
                  <DickGlyph size={30} />
                  <Text style={styles.scoreBig}>{bitesLabel(me?.bites_de_surf ?? 0)}</Text>
                  <Text style={styles.scoreLabel}>bites de surf</Text>
                </View>
                <View style={styles.scoreCell}>
                  <Text style={styles.scoreBig}>{cm(me?.total_cm ?? 0)}</Text>
                  <Text style={styles.scoreLabel}>total cumulé</Text>
                </View>
              </View>
              <BiteMeter totalCm={me?.total_cm ?? 0} />
            </Card>

            <Text style={styles.journalTitle}>Journal du trip</Text>
          </View>
        }
        renderItem={({ item }: { item: LedgerEntry }) => (
          <View style={styles.entry}>
            <View style={styles.entryLeft}>
              <Text style={styles.entryEmoji}>{item.source_type === 'award' ? '🏅' : '🌊'}</Text>
              <View>
                <Text style={styles.entrySource}>
                  {item.label ?? (item.source_type === 'award' ? 'Superlatif' : 'Fait validé')}
                </Text>
                <Text style={styles.entryKind}>
                  {item.source_type === 'award' ? 'Superlatif' : 'Fait validé'}
                </Text>
              </View>
            </View>
            <Text style={[styles.entryPts, item.points < 0 && styles.entryPtsNeg]}>
              {signed(item.points)} cm
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState emoji="📖" title="Journal vide" hint="Les points validés apparaîtront ici." />
        }
        ListFooterComponent={
          isMe ? (
            <View style={styles.footer}>
              <Button label="Se déconnecter" variant="ghost" onPress={signOut} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  head: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  pseudo: { color: colors.text, fontSize: 24, fontWeight: '800' },
  scoreCard: { width: '100%', gap: spacing.md, marginTop: spacing.md },
  scoreRow: { flexDirection: 'row' },
  scoreCell: { flex: 1, alignItems: 'center', gap: 4 },
  scoreBig: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  scoreLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  journalTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  entryEmoji: { fontSize: 18 },
  entrySource: { color: colors.text, fontSize: 15, fontWeight: '700' },
  entryKind: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
  entryPts: { color: colors.success, fontWeight: '800', fontSize: 15 },
  entryPtsNeg: { color: colors.danger },
  footer: { paddingTop: spacing.xl },
});
