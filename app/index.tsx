import { Redirect } from 'expo-router';

// Le Gate (app/_layout) redirige selon l'état auth/profil/crew ; par défaut on
// pointe vers le classement.
export default function Index() {
  return <Redirect href="/(app)/(tabs)" />;
}
