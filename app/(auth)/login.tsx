import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { DickGlyph } from '@/components/DickGlyph';
import { Body, Button, Field, Screen, Subtitle, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme/colors';

// On propose deux chemins (le lien magique ouvre l'app ; le code 6 chiffres du
// même email marche partout, pratique en Expo Go).
export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendLink = async () => {
    if (!email.includes('@')) {
      Alert.alert('Email invalide', 'Entre une adresse email valide.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: Platform.OS === 'web' ? undefined : Linking.createURL('/'),
      },
    });
    setBusy(false);
    if (error) {
      Alert.alert('Oups', error.message);
      return;
    }
    setSent(true);
  };

  const verify = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      Alert.alert('Code refusé', error.message);
    }
    // Succès -> onAuthStateChange déclenche le Gate.
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <DickGlyph size={104} />
          <Title>PoyPoyo Surf</Title>
          <Subtitle>Le scoreboard le plus bandant entre potes. 21 cm = 1 🍆</Subtitle>
        </View>

        <View style={styles.form}>
          {!sent ? (
            <>
              <Field
                label="Ton email"
                value={email}
                onChangeText={setEmail}
                placeholder="rider@popoyo.surf"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                inputMode="email"
              />
              <Button label="Recevoir le lien magique" onPress={sendLink} loading={busy} />
            </>
          ) : (
            <>
              <Body muted>
                Lien + code envoyés à {email}. Clique le lien, ou entre le code à 6 chiffres.
              </Body>
              <Field
                label="Code"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button label="Valider le code" onPress={verify} loading={busy} />
              <Button label="Changer d'email" variant="ghost" onPress={() => setSent(false)} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
});
