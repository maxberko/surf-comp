import { Alert, Platform } from 'react-native';

// Confirmation multi-plateforme. Sur le web, Alert.alert de react-native-web
// n'exécute pas les callbacks des boutons -> on utilise window.confirm.
export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirmer'
) {
  if (Platform.OS === 'web') {
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`${title}\n\n${message}`)
        : true; // pas de window (SSR) -> on exécute directement
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
