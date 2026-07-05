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

// Repère fixe. Membre "humain" dessiné en pleine taille (l'objectif), qu'une
// jauge lumineuse remplit/fait grandir selon la progression vers le palier (21 cm).
const VBW = 140;
const VBH = 48;
const CY = 24;

// Poils pubiens (touffe à la base, autour des couilles).
function PubicHair() {
  const strands = [
    'M20 11 C 13 4, 8 2, 3 3',
    'M18 8 C 13 2, 9 1, 5 0',
    'M22 14 C 15 7, 9 5, 4 7',
    'M15 24 C 8 21, 4 19, 0 20',
    'M15 26 C 8 29, 4 31, 0 31',
    'M20 37 C 13 43, 8 45, 3 44',
    'M22 33 C 15 39, 9 42, 4 45',
    'M18 40 C 14 44, 11 46, 8 46',
    'M23 18 C 16 13, 10 11, 5 13',
    'M23 30 C 16 27, 10 26, 5 28',
    'M19 6 C 16 2, 13 1, 10 2',
    'M21 42 C 17 45, 14 47, 11 46',
  ];
  return (
    <G stroke="#241611" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.95}>
      {strands.map((d, i) => (
        <Path key={i} d={d} />
      ))}
      <G stroke="#3a251a" strokeWidth={1.1} opacity={0.7}>
        <Path d="M22 22 C 15 20, 9 20, 4 22" />
        <Path d="M22 28 C 15 30, 9 33, 5 36" />
        <Path d="M20 15 C 15 11, 11 10, 8 11" />
      </G>
    </G>
  );
}

// La silhouette du membre (fût + couronne + gland), réutilisée en fantôme et en brillant.
function ShaftGlans({ fill, glansFill, corona }: { fill: string; glansFill?: string; corona?: string }) {
  return (
    <G>
      <Rect x={8} y={13} width={100} height={22} rx={11} ry={11} fill={fill} />
      {corona ? <Ellipse cx={101} cy={CY} rx={7} ry={16} fill={corona} /> : null}
      <Circle cx={112} cy={CY} r={15} fill={glansFill ?? fill} />
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

  const fillW = anim.interpolate({ inputRange: [0, 1], outputRange: [30, 132] });

  const gShaft = `s${uid}`;
  const gGlans = `g${uid}`;
  const gGlansHot = `gh${uid}`;
  const gBalls = `b${uid}`;
  const clip = `c${uid}`;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={40} viewBox={`0 0 ${VBW} ${VBH}`}>
        <Defs>
          <LinearGradient id={gShaft} x1="0" y1="12" x2="0" y2="36" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#F2C6A6" />
            <Stop offset="0.42" stopColor="#DB9E7B" />
            <Stop offset="1" stopColor="#A5673F" />
          </LinearGradient>
          <RadialGradient id={gGlans} cx="107" cy="17" r="20" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#F4B5A0" />
            <Stop offset="0.55" stopColor="#D6836C" />
            <Stop offset="1" stopColor="#A94C3C" />
          </RadialGradient>
          <RadialGradient id={gGlansHot} cx="107" cy="17" r="20" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC0AE" />
            <Stop offset="0.5" stopColor="#E76A55" />
            <Stop offset="1" stopColor="#9E2E22" />
          </RadialGradient>
          <RadialGradient id={gBalls} cx="12" cy="15" r="17" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#DEA37E" />
            <Stop offset="1" stopColor="#9A5E3B" />
          </RadialGradient>
          <ClipPath id={clip}>
            <AnimatedRect x={0} y={0} width={fillW as unknown as number} height={VBH} />
          </ClipPath>
        </Defs>

        {/* Fantôme : membre pleine taille (objectif) */}
        <G opacity={0.14}>
          <ShaftGlans fill="#C99B82" glansFill="#C99B82" />
        </G>

        {/* Buisson + poils, derrière la base */}
        <Path d="M23 7 C 7 7, 2 17, 3 24 C 2 31, 7 41, 23 41 Z" fill="#241611" opacity={0.9} />
        <PubicHair />

        {/* Couilles (scrotum) */}
        <G>
          <Ellipse cx={13} cy={15} rx={9.5} ry={11} fill={`url(#${gBalls})`} />
          <Ellipse cx={13} cy={32} rx={9.5} ry={11} fill={`url(#${gBalls})`} />
          <Path d="M13 5 C 9 15, 9 33, 13 43" stroke="#7A4327" strokeWidth={1.4} fill="none" opacity={0.7} />
          <Path d="M6 13 q4 3 9 1" stroke="#8a5233" strokeWidth={1} fill="none" opacity={0.5} />
          <Path d="M6 33 q4 -3 9 -1" stroke="#8a5233" strokeWidth={1} fill="none" opacity={0.5} />
        </G>

        {/* Halo chaud quand le palier est imminent */}
        {almost ? <Circle cx={112} cy={CY} r={19} fill="#FF7A59" opacity={0.4} /> : null}

        {/* Membre brillant, révélé/rempli par la jauge */}
        <G clipPath={`url(#${clip})`}>
          <ShaftGlans
            fill={`url(#${gShaft})`}
            glansFill={`url(#${almost ? gGlansHot : gGlans})`}
            corona="#BE7154"
          />
          {/* veines sous-cutanées */}
          <Path d="M24 18 q22 -5 44 1" stroke="#8A5A86" strokeWidth={2} fill="none" opacity={0.28} strokeLinecap="round" />
          <Path d="M28 29 q24 4 44 -1" stroke="#8A5A86" strokeWidth={1.8} fill="none" opacity={0.24} strokeLinecap="round" />
          {/* reflet sur le fût */}
          <Ellipse cx={54} cy={17} rx={34} ry={2.4} fill="#FFFFFF" opacity={0.28} />
          {/* reflet du gland + méat (fente) */}
          <Ellipse cx={107} cy={17} rx={4.5} ry={3} fill="#FFFFFF" opacity={0.5} />
          <Ellipse cx={123} cy={CY} rx={1.8} ry={4.5} fill="#7A2E24" opacity={0.7} />
        </G>
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
