import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Body, Button, Card, Field, Screen, Subtitle, Title } from '@/components/ui';
import { useCreateCrew, useJoinCrew } from '@/lib/queries';
import { useCrew } from '@/providers/CrewProvider';
import { spacing } from '@/theme/colors';

export default function CrewSetup() {
  const router = useRouter();
  const { setCrewId } = useCrew();
  const create = useCreateCrew();
  const join = useJoinCrew();
  const [crewName, setCrewName] = useState('');
  const [code, setCode] = useState('');

  const doCreate = async () => {
    if (crewName.trim().length < 2) {
      Alert.alert('Nom trop court', 'Donne un nom à ton crew.');
      return;
    }
    try {
      const crew = await create.mutateAsync({ name: crewName.trim() });
      setCrewId(crew.id);
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const doJoin = async () => {
    if (code.trim().length < 4) {
      Alert.alert('Code invalide', 'Entre le code d’invitation.');
      return;
    }
    try {
      const crew = await join.mutateAsync(code.trim());
      setCrewId(crew.id);
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Ton crew</Title>
        <Subtitle>Crée ta bande ou rejoins-en une.</Subtitle>
      </View>

      <View style={styles.stack}>
        <Card style={styles.card}>
          <Body>🆕 Nouveau crew</Body>
          <Field
            value={crewName}
            onChangeText={setCrewName}
            placeholder="Les Barrels de Popoyo"
            autoCapitalize="words"
          />
          <Button label="Créer le crew" onPress={doCreate} loading={create.isPending} />
        </Card>

        <Card style={styles.card}>
          <Body>🤝 Rejoindre avec un code</Body>
          <Field
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="AB12CD"
            autoCapitalize="characters"
            maxLength={8}
          />
          <Button label="Rejoindre" variant="ghost" onPress={doJoin} loading={join.isPending} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, gap: spacing.xs },
  stack: { gap: spacing.lg, paddingTop: spacing.xl },
  card: { gap: spacing.md },
});
