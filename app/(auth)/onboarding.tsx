import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Body, Button, Field, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useUpsertProfile } from '@/lib/queries';
import { spacing } from '@/theme/colors';

export default function Onboarding() {
  const { userId } = useAuth();
  const upsert = useUpsertProfile();
  const [pseudo, setPseudo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const save = async () => {
    if (!userId) return;
    if (pseudo.trim().length < 2) {
      Alert.alert('Pseudo trop court', 'Choisis un pseudo (2 caractères min).');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: userId,
        pseudo: pseudo.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      // Le Gate prend le relais dès que le profil existe.
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d’enregistrer le profil.');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Ton blaze</Title>
        <Subtitle>Comment on t’appelle au pic ?</Subtitle>
      </View>

      <View style={styles.avatarRow}>
        <Avatar pseudo={pseudo || '?'} url={avatarUrl || null} size={88} />
      </View>

      <View style={styles.form}>
        <Field
          label="Pseudo"
          value={pseudo}
          onChangeText={setPseudo}
          placeholder="Popoyo Kid"
          autoCapitalize="words"
          maxLength={24}
        />
        <Field
          label="Avatar (URL, optionnel)"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://…"
          autoCapitalize="none"
          keyboardType="url"
        />
        <Body muted>Tu pourras changer tout ça plus tard.</Body>
        <Button label="C’est parti" onPress={save} loading={upsert.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xl, gap: spacing.xs },
  avatarRow: { alignItems: 'center', paddingVertical: spacing.xl },
  form: { gap: spacing.md },
});
