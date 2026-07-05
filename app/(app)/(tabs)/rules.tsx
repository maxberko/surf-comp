import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Body, Button, Card, Field, Loader, Pill, Screen, Subtitle, Title } from '@/components/ui';
import { signed } from '@/lib/format';
import { useRules, useSaveRule } from '@/lib/queries';
import type { RuleType, ScoreRule } from '@/lib/types';
import { useCrew } from '@/providers/CrewProvider';
import { colors, radius, spacing } from '@/theme/colors';

function RuleRow({ rule }: { rule: ScoreRule }) {
  const save = useSaveRule();
  const bump = (delta: number) =>
    save.mutate({ ...rule, points: rule.points + delta });
  const toggle = (active: boolean) => save.mutate({ ...rule, active });

  return (
    <Card style={[styles.rule, !rule.active && styles.ruleOff]}>
      <View style={styles.ruleMain}>
        <Text style={styles.ruleLabel}>{rule.label}</Text>
        <Pill
          label={rule.type === 'fait' ? 'Fait · 2 témoins' : 'Superlatif · vote'}
          color={rule.type === 'fait' ? colors.wave : colors.coral}
          tint={rule.type === 'fait' ? 'rgba(56,163,209,0.14)' : 'rgba(255,122,89,0.14)'}
        />
      </View>
      <View style={styles.ruleControls}>
        <Pressable style={styles.stepBtn} onPress={() => bump(-1)}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={[styles.rulePts, rule.points < 0 && styles.rulePtsNeg]}>
          {signed(rule.points)} cm
        </Text>
        <Pressable style={styles.stepBtn} onPress={() => bump(1)}>
          <Text style={styles.stepText}>＋</Text>
        </Pressable>
        <Switch
          value={rule.active}
          onValueChange={toggle}
          trackColor={{ true: colors.accentDim, false: colors.cardBorder }}
          thumbColor={rule.active ? colors.accent : colors.textFaint}
        />
      </View>
    </Card>
  );
}

export default function Rules() {
  const { crew } = useCrew();
  const { data: rules = [], isLoading } = useRules(crew?.id);
  const save = useSaveRule();

  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<RuleType>('fait');

  const share = async () => {
    if (!crew) return;
    await Clipboard.setStringAsync(`poypoyo://join/${crew.invite_code}`);
    Alert.alert('Lien copié', 'Envoie-le à un pote pour qu’il rejoigne le crew.');
  };

  const addRule = () => {
    if (!crew || newLabel.trim().length < 2) return;
    const key = newLabel
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    save.mutate(
      { crew_id: crew.id, key, label: newLabel.trim(), points: 1, type: newType, active: true },
      { onSuccess: () => setNewLabel('') }
    );
  };

  if (isLoading) return <Loader />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Title>Barème</Title>
          <Subtitle>Éditable par le crew. Snapshot au moment du log.</Subtitle>
        </View>

        <Card style={styles.inviteCard}>
          <Body>🤙 Inviter un rider</Body>
          <View style={styles.inviteRow}>
            <Text style={styles.inviteCode}>#{crew?.invite_code}</Text>
            <Button label="Copier le lien" variant="ghost" onPress={share} style={{ flex: 1 }} />
          </View>
        </Card>

        {rules.map((r: ScoreRule) => (
          <RuleRow key={r.id} rule={r} />
        ))}

        <Card style={styles.addCard}>
          <Body>➕ Nouvelle règle</Body>
          <Field value={newLabel} onChangeText={setNewLabel} placeholder="Ex : 360 sauté" />
          <View style={styles.typeRow}>
            {(['fait', 'superlatif'] as RuleType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setNewType(t)}
                style={[styles.typeChip, newType === t && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, newType === t && styles.typeChipTextActive]}>
                  {t === 'fait' ? 'Fait' : 'Superlatif'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button label="Ajouter" onPress={addRule} loading={save.isPending} disabled={newLabel.trim().length < 2} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: 2, paddingBottom: spacing.sm },
  inviteCard: { gap: spacing.md },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inviteCode: { color: colors.accent, fontWeight: '800', fontSize: 18 },
  rule: { gap: spacing.md },
  ruleOff: { opacity: 0.5 },
  ruleMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ruleLabel: { color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 },
  ruleControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stepText: { color: colors.text, fontSize: 20, fontWeight: '800' },
  rulePts: { color: colors.accent, fontWeight: '800', fontSize: 16, minWidth: 60, textAlign: 'center' },
  rulePtsNeg: { color: colors.danger },
  addCard: { gap: spacing.md, marginTop: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  typeChipActive: { borderColor: colors.accent, backgroundColor: 'rgba(47,191,160,0.10)' },
  typeChipText: { color: colors.textMuted, fontWeight: '700' },
  typeChipTextActive: { color: colors.accent },
});
