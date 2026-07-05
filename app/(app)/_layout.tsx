import { Stack } from 'expo-router';

import { useCrewRealtime } from '@/lib/useCrewRealtime';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  // Abonnement realtime global (classement + feed du jour) pour toute l'app.
  useCrewRealtime();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-fact" options={{ title: 'Logger un fait', presentation: 'modal' }} />
      <Stack.Screen name="profile/[id]" options={{ title: 'Profil' }} />
    </Stack>
  );
}
