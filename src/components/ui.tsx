import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/colors';

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={[styles.screenInner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.bodyMuted]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary && styles.btnPrimary,
        isDanger && styles.btnDanger,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.accent : colors.bg} />
      ) : (
        <Text style={[styles.btnLabel, variant === 'ghost' && styles.btnLabelGhost]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.field, style]}
        {...rest}
      />
    </View>
  );
}

export function Pill({
  label,
  color = colors.accent,
  tint,
}: {
  label: string;
  color?: string;
  tint?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: tint ?? 'rgba(47,191,160,0.14)' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  emoji,
  title,
  hint,
  art,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  art?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {art ?? (emoji ? <Text style={styles.emptyEmoji}>{emoji}</Text> : null)}
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={colors.accent} />
      {label ? <Text style={styles.loaderLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { flex: 1, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  bodyMuted: { color: colors.textMuted },
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnDanger: { backgroundColor: colors.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.cardBorder },
  btnDisabled: { opacity: 0.45 },
  btnPressed: { opacity: 0.85 },
  btnLabel: { color: colors.bg, fontSize: 16, fontWeight: '800' },
  btnLabelGhost: { color: colors.accent },
  fieldWrap: { gap: spacing.xs },
  fieldLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  field: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    height: 50,
    fontSize: 16,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.lg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loaderLabel: { color: colors.textMuted },
});
