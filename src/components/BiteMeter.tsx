import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { CM_PER_BITE, progressToNextBite, resteFromCm } from '@/lib/format';
import { colors, radius } from '@/theme/colors';

// Jauge "bite de surf" : un membre qui GRANDIT et se REMPLIT au fil des cm.
// Longueur = progression vers le prochain palier de 21 cm (les couilles à la
// base, le gland à la pointe). À ~90% le gland s'illumine : palier imminent.
export function BiteMeter({ totalCm }: { totalCm: number }) {
  const pct = Math.max(0, Math.min(1, progressToNextBite(totalCm)));
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: pct, useNativeDriver: false, friction: 7, tension: 60 }).start();
  }, [pct, anim]);

  // Toujours un minimum visible (mode "flaccide"), puis ça pousse jusqu'à 100%.
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['26%', '100%'] });
  const almost = pct >= 0.8; // palier imminent : le gland s'illumine

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {/* couilles */}
        <View style={styles.balls}>
          <View style={styles.ball} />
          <View style={styles.ball} />
        </View>

        {/* rainure (distance restante jusqu'au palier) + membre qui grandit */}
        <View style={styles.groove}>
          <Animated.View style={[styles.member, { width }]}>
            <View style={styles.shaft} />
            <View style={[styles.head, almost && styles.headHot]} />
          </Animated.View>
        </View>
      </View>

      <Text style={styles.label}>
        {resteFromCm(totalCm)}/{CM_PER_BITE} cm → prochaine 🍆
      </Text>
    </View>
  );
}

const H = 14; // hauteur du fût
const BALL = 9;
const HEAD = 15;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  balls: { width: BALL + 2, alignItems: 'center', marginRight: -4, zIndex: 2 },
  ball: {
    width: BALL,
    height: BALL,
    borderRadius: BALL / 2,
    backgroundColor: colors.accentDim,
    marginVertical: -1.5,
  },
  groove: {
    flex: 1,
    height: H,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  member: {
    height: H,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: HEAD + 8,
  },
  shaft: {
    flex: 1,
    height: H,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    backgroundColor: colors.accent,
    marginLeft: -HEAD / 2,
  },
  headHot: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  label: { color: colors.textFaint, fontSize: 11, fontWeight: '700' },
});
