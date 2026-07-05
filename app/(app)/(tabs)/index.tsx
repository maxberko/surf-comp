import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BiteMeter } from '@/components/BiteMeter';
import { PalierCelebration } from '@/components/PalierCelebration';
import { Body, Card, EmptyState, Loader, Pill, Screen, Title } from '@/components/ui';
import { bitesLabel, cm } from '@/lib/format';
import { useActiveTrip, useNewTrip, useScores } from '@/lib/queries';
import type { ScoreRow } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCrew } from '@/providers/CrewProvider';
import { colors, radius, spacing } from '@/theme/colors';

const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`);

export default function Classement() {
  const router = useRouter();
  const { userId } = useAuth();
  const { crew, crews, setCrewId } = useCrew();
  const { data: trip } = useActiveTrip(crew?.id);
  const { data: scores = [], isLoading, refetch, isRefetching } = useScores(trip?.id);
  const newTrip = useNewTrip();
  const [switching, setSwitching] = useState(false);

  const shareCode = async () => {
    if (!crew) return;
    await Clipboard.setStringAsync(crew.invite_code);
    Alert.alert('Code copié', `Partage "${crew.invite_code}" pour inviter un rider.`);
  };

  const runNewTrip = (name: string) => {
    if (!crew) return;
    newTrip
      .mutateAsync({ crewId: crew.id, name: name.trim() || `Trip ${new Date().toISOString().slice(0, 10)}` })
      .catch((e) => Alert.alert('Erreur', e.message));
  };

  const startNewTrip = () => {
    if (!crew) return;
    const confirmMsg = 'Le classement repart de zéro (l’historique reste).';
    // Alert.prompt n'existe que sur iOS.
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('Nouveau trip', `${confirmMsg}\nNom du trip :`, (name) => runNewTrip(name ?? ''));
      return;
    }
    Alert.alert('Nouveau trip', confirmMsg, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Créer', onPress: () => runNewTrip('') },
    ]);
  };

  const myBites = scores.find((s: ScoreRow) => s.user_id === userId)?.bites_de_surf ?? 0;

  const cycleCrew = () => {
    if (crews.length < 2) return;
    setSwitching(true);
    const idx = crews.findIndex((c) => c.id === crew?.id);
    const next = crews[(idx + 1) % crews.length];
    setCrewId(next.id);
    setSwitching(false);
  };

  const renderItem = ({ item, index }: { item: ScoreRow; index: number }) => {
    const rank = index + 1;
    const isMe = item.user_id === userId;
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(app)/profile/[id]', params: { id: item.user_id } })}
      >
        <Card style={[styles.row, isMe && styles.rowMe]}>
          <Text style={styles.rank}>{medal(rank)}</Text>
          <Avatar pseudo={item.profile?.pseudo} url={item.profile?.avatar_url} rank={rank} />
          <View style={styles.rowMid}>
            <Text style={styles.pseudo} numberOfLines={1}>
              {item.profile?.pseudo ?? 'Rider'} {isMe ? '· toi' : ''}
            </Text>
            <BiteMeter totalCm={item.total_cm} />
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.bites}>{bitesLabel(item.bites_de_surf)}</Text>
            <Text style={styles.cm}>{cm(item.total_cm)}</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <Screen>
      <PalierCelebration bites={myBites} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={cycleCrew} disabled={crews.length < 2}>
            <Title>{crew?.name ?? 'Crew'}</Title>
          </Pressable>
          <Pressable onPress={shareCode} style={styles.codeChip}>
            <Text style={styles.codeText}>#{crew?.invite_code}</Text>
          </Pressable>
        </View>
        <View style={styles.headerMeta}>
          <Pill label={trip?.name ?? 'Aucun trip'} color={colors.wave} tint="rgba(56,163,209,0.14)" />
          {crews.length > 1 ? (
            <Body muted>{switching ? '…' : 'appuie sur le nom pour changer de crew'}</Body>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <Loader label="Chargement du classement…" />
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(s) => s.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🌊"
              title="Personne n’a encore marqué"
              hint="Ouvre la session du jour et logge ton premier fait."
            />
          }
          ListFooterComponent={
            <Pressable onPress={startNewTrip} style={styles.newTrip}>
              <Text style={styles.newTripText}>＋ Nouveau trip (reset du classement)</Text>
            </Pressable>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  codeChip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  codeText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowMe: { borderColor: colors.accentDim },
  rank: { width: 26, textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 16 },
  rowMid: { flex: 1, gap: 6 },
  pseudo: { color: colors.text, fontWeight: '700', fontSize: 16 },
  rowRight: { alignItems: 'flex-end' },
  bites: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  cm: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  newTrip: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  newTripText: { color: colors.textMuted, fontWeight: '700' },
});
