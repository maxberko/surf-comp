import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Loader, Screen, Subtitle } from '@/components/ui';
import { signed } from '@/lib/format';
import { useActiveTrip, useLogAction, useRules, useTodaySession } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import type { ScoreRule } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCrew } from '@/providers/CrewProvider';
import { colors, radius, spacing } from '@/theme/colors';

export default function AddFact() {
  const router = useRouter();
  const { userId } = useAuth();
  const { crew } = useCrew();
  const { data: trip } = useActiveTrip(crew?.id);
  const { data: session } = useTodaySession(trip?.id);
  const { data: rules = [], isLoading } = useRules(crew?.id);
  const log = useLogAction();

  const [selected, setSelected] = useState<ScoreRule | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const faits = rules.filter((r: ScoreRule) => r.type === 'fait' && r.active);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', 'Autorise l’accès aux photos pour ajouter une preuve.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
    });
    if (!res.canceled) setMediaUri(res.assets[0].uri);
  };

  // Upload optionnel vers le bucket "media". La preuve ne donne PAS de points ;
  // en cas d'échec on log quand même le fait sans média.
  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaUri || !userId) return null;
    try {
      setUploading(true);
      const blob = await (await fetch(mediaUri)).blob();
      const ext = mediaUri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    } catch {
      return null; // dégradation gracieuse
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!selected || !session || !userId) return;
    const mediaUrl = await uploadMedia();
    try {
      await log.mutateAsync({ sessionId: session.id, userId, rule: selected, mediaUrl });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  if (isLoading) return <Loader />;

  if (!session) {
    return (
      <Screen>
        <View style={styles.center}>
          <Body muted>Ouvre d’abord la session du jour depuis l’onglet Session.</Body>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Subtitle>Quel fait d’armes ?</Subtitle>

        <View style={styles.grid}>
          {faits.map((rule: ScoreRule) => {
            const active = selected?.id === rule.id;
            return (
              <Pressable
                key={rule.id}
                onPress={() => setSelected(rule)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{rule.label}</Text>
                <Text style={[styles.chipPts, rule.points < 0 && styles.chipPtsNeg]}>
                  {signed(rule.points)} cm
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.mediaCard}>
          <Body>📎 Preuve (optionnelle, aucun bonus de points)</Body>
          {mediaUri ? (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: mediaUri }} style={styles.mediaImg} />
              <Button label="Retirer" variant="ghost" onPress={() => setMediaUri(null)} />
            </View>
          ) : (
            <Button label="Ajouter une photo/vidéo" variant="ghost" onPress={pickMedia} />
          )}
        </Card>

        <Button
          label={selected ? `Logger : ${selected.label}` : 'Choisis un fait'}
          onPress={submit}
          disabled={!selected}
          loading={log.isPending || uploading}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingVertical: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 4,
    minWidth: '46%',
  },
  chipActive: { borderColor: colors.accent, backgroundColor: 'rgba(47,191,160,0.10)' },
  chipLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  chipLabelActive: { color: colors.accent },
  chipPts: { color: colors.textMuted, fontWeight: '800' },
  chipPtsNeg: { color: colors.danger },
  mediaCard: { gap: spacing.md },
  mediaPreview: { gap: spacing.md },
  mediaImg: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.bgElevated },
});
