import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { bitesLabel } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/colors';

/**
 * Affiche une animation quand `bites` augmente (franchissement d'un palier 21 cm).
 * Se déclenche uniquement sur une hausse réelle, pas au premier rendu.
 */
export function PalierCelebration({ bites }: { bites: number }) {
  const prev = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prev.current !== null && bites > prev.current) {
      setCount(bites);
      setVisible(true);
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
    prev.current = bites;
  }, [bites, anim]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: anim,
            transform: [
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            ],
          },
        ]}
      >
        <Text style={styles.emoji}>🍆</Text>
        <Text style={styles.title}>Nouvelle bite de surf !</Text>
        <Text style={styles.count}>Tu es à {bitesLabel(count)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  badge: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: { fontSize: 56 },
  title: { color: colors.gold, fontWeight: '800', fontSize: 18 },
  count: { color: colors.text, fontWeight: '600' },
});
