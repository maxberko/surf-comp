import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Loader, Screen, Subtitle, Title } from '@/components/ui';
import { useJoinCrew } from '@/lib/queries';
import { useCrew } from '@/providers/CrewProvider';
import { spacing } from '@/theme/colors';

// Deep link : poypoyo://join/AB12CD (partagé depuis l'écran Règles/Classement).
export default function JoinByCode() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { setCrewId } = useCrew();
  const join = useJoinCrew();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code || done) return;
    join
      .mutateAsync(code)
      .then((crew) => {
        setCrewId(crew.id);
        setDone(true);
        router.replace('/(app)/(tabs)');
      })
      .catch((e) => setError(e.message ?? 'Code invalide.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!error) return <Loader label={`Rejoindre ${code}…`} />;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xxl, gap: spacing.md }}>
        <Title>Aïe</Title>
        <Subtitle>Impossible de rejoindre ce crew</Subtitle>
        <Body muted>{error}</Body>
        <Button label="Retour" variant="ghost" onPress={() => router.replace('/crew')} />
      </View>
    </Screen>
  );
}
