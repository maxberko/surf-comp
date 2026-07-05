import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loader } from '@/components/ui';
import { useProfile } from '@/lib/queries';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { CrewProvider, useCrew } from '@/providers/CrewProvider';
import { colors } from '@/theme/colors';

function Gate() {
  const { userId, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(userId ?? undefined);
  const { crews, loading: crewLoading } = useCrew();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const group = segments[0]; // '(auth)' | '(app)' | 'crew' | 'join' | undefined
    const inAuth = group === '(auth)';
    const inJoin = group === 'join';

    if (!userId) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Connecté mais pas de profil -> onboarding.
    if (!profileLoading && !profile) {
      if (segments[1] !== 'onboarding') router.replace('/(auth)/onboarding');
      return;
    }

    if (profileLoading || crewLoading) return;

    // Profil OK mais aucun crew -> écran crew (sauf si on rejoint via lien).
    if (crews.length === 0) {
      if (group !== 'crew' && !inJoin) router.replace('/crew');
      return;
    }

    // Tout est prêt : sortir de l'onboarding/auth vers l'app.
    if (inAuth || group === 'crew') {
      router.replace('/(app)/(tabs)');
    }
  }, [
    authLoading,
    profileLoading,
    crewLoading,
    userId,
    profile,
    crews.length,
    segments,
    router,
  ]);

  if (authLoading) return <Loader label="PoyPoyo…" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="crew" options={{ title: 'Ton crew' }} />
      <Stack.Screen name="join/[code]" options={{ title: 'Rejoindre' }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
      })
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CrewProvider>
              <StatusBar style="light" />
              <Gate />
            </CrewProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
