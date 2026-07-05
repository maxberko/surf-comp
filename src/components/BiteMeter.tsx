import { StyleSheet, Text, View } from 'react-native';

import { CM_PER_BITE, progressToNextBite, resteFromCm } from '@/lib/format';
import { colors, radius } from '@/theme/colors';

/** Barre de progression vers la prochaine bite de surf (palier 21 cm). */
export function BiteMeter({ totalCm }: { totalCm: number }) {
  const pct = Math.max(0, Math.min(1, progressToNextBite(totalCm)));
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.label}>
        {resteFromCm(totalCm)}/{CM_PER_BITE} cm → prochaine 🍆
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.accent },
  label: { color: colors.textFaint, fontSize: 11, fontWeight: '700' },
});
