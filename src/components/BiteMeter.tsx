import { useEffect, useId, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { CM_PER_BITE, progressToNextBite, resteFromCm } from '@/lib/format';
import { colors } from '@/theme/colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Coordonnées du dessin (repère fixe). Le membre est dessiné en pleine taille
// (l'érection "cible"), et une jauge lumineuse le REMPLIT/le fait GRANDIR de la
// base vers le gland selon la progression vers le prochain palier de 21 cm.
const VBW = 138;
const VBH = 48;
const CY = 24;

// Silhouette (dessinée en fond fantôme, puis en version brillante clippée).
function ShaftGlans({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <G>
      {/* fût */}
      <Rect x={8} y={13} width={100} height={22} rx={11} ry={11} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
      {/* couronne (bourrelet du gland) */}
      <Ellipse cx={100} cy={CY} rx={6} ry={15} fill={fill} />
      {/* gland */}
      <Circle cx={112} cy={CY} r={15} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
    </G>
  );
}

export function BiteMeter({ totalCm }: { totalCm: number }) {
  const pct = Math.max(0, Math.min(1, progressToNextBite(totalCm)));
  const almost = pct >= 0.8;
  const uid = useId().replace(/[:]/g, '');

  const anim = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: pct, useNativeDriver: false, friction: 7, tension: 55 }).start();
  }, [pct, anim]);

  // Largeur de la zone remplie : de ~28 (juste le fût qui pointe) à 130 (gland compris).
  const fillW = anim.interpolate({ inputRange: [0, 1], outputRange: [28, 130] });

  const gShaft = `s${uid}`;
  const gGlans = `g${uid}`;
  const gBalls = `b${uid}`;
  const clip = `c${uid}`;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={38} viewBox={`0 0 ${VBW} ${VBH}`}>
        <Defs>
          <LinearGradient id={gShaft} x1="0" y1="13" x2="0" y2="35" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#7CEAD4" />
            <Stop offset="0.45" stopColor={colors.accent} />
            <Stop offset="1" stopColor="#15654F" />
          </LinearGradient>
          <RadialGradient id={gGlans} cx="107" cy="17" r="20" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#B8F4E6" />
            <Stop offset="0.55" stopColor="#43C9A8" />
            <Stop offset="1" stopColor="#1B7A63" />
          </RadialGradient>
          <RadialGradient id={gBalls} cx="12" cy="16" r="16" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#2FBFA0" />
            <Stop offset="1" stopColor="#155A48" />
          </RadialGradient>
          <ClipPath id={clip}>
            <AnimatedRect x={0} y={0} width={fillW as unknown as number} height={VBH} />
          </ClipPath>
        </Defs>

        {/* Fantôme : le membre en pleine taille (objectif à atteindre) */}
        <G opacity={0.16}>
          <ShaftGlans fill={colors.textFaint} />
        </G>

        {/* Couilles (toujours visibles : la base) */}
        <G>
          <Ellipse cx={13} cy={15} rx={9.5} ry={11} fill={`url(#${gBalls})`} />
          <Ellipse cx={13} cy={32} rx={9.5} ry={11} fill={`url(#${gBalls})`} />
          <Path d="M13 5 C 9 15, 9 33, 13 43" stroke="#0E4b3b" strokeWidth={1.4} fill="none" opacity={0.7} />
        </G>

        {/* Halo doré quand le palier est imminent */}
        {almost ? <Circle cx={112} cy={CY} r={19} fill={colors.gold} opacity={0.5} /> : null}

        {/* Membre brillant, révélé/rempli par la jauge */}
        <G clipPath={`url(#${clip})`}>
          <ShaftGlans fill={`url(#${gShaft})`} />
          <Circle cx={112} cy={CY} r={15} fill={`url(#${gGlans})`} />
          {/* veines */}
          <Path d="M22 19 q22 -5 44 1" stroke="#12604C" strokeWidth={2} fill="none" opacity={0.4} strokeLinecap="round" />
          <Path d="M26 29 q24 4 46 -1" stroke="#12604C" strokeWidth={2} fill="none" opacity={0.35} strokeLinecap="round" />
          {/* reflet sur le fût */}
          <Ellipse cx={54} cy={17} rx={34} ry={2.6} fill="#FFFFFF" opacity={0.22} />
          {/* reflet + fente du gland (vert) */}
          <Ellipse cx={106} cy={17} rx={4.5} ry={3} fill="#FFFFFF" opacity={0.5} />
          <Ellipse cx={123} cy={CY} rx={2.2} ry={5} fill="#0E4b3b" opacity={0.55} />
        </G>

        {/* Palier imminent : gland doré entièrement illuminé (hors clip) */}
        {almost ? (
          <G>
            <Circle cx={112} cy={CY} r={15} fill={colors.gold} />
            <Ellipse cx={106} cy={17} rx={4.5} ry={3} fill="#FFFFFF" opacity={0.6} />
            <Ellipse cx={123} cy={CY} rx={2.2} ry={5} fill="#7A4A00" opacity={0.6} />
          </G>
        ) : null}
      </Svg>

      <Text style={styles.label}>
        {resteFromCm(totalCm)}/{CM_PER_BITE} cm → prochaine 🍆
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  label: { color: colors.textFaint, fontSize: 11, fontWeight: '700' },
});
