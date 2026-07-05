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

// Repère fixe. Membre "humain" charnu, dessiné en pleine taille (l'objectif),
// qu'une jauge lumineuse remplit/fait grandir selon la progression (palier 21 cm).
const VBW = 146;
const VBH = 54;
const CY = 27;

// Poils pubiens : touffe fournie à la base, autour des couilles.
function PubicHair() {
  const long = [
    'M24 12 C 15 3, 8 1, 2 2',
    'M21 8 C 15 2, 10 0, 4 -1',
    'M26 16 C 17 7, 9 5, 3 6',
    'M17 27 C 9 23, 4 21, -1 22',
    'M17 30 C 9 34, 4 37, -1 38',
    'M24 42 C 15 49, 9 51, 3 50',
    'M26 37 C 17 44, 9 47, 3 50',
    'M21 47 C 16 51, 12 53, 8 52',
    'M27 20 C 18 14, 10 12, 4 14',
    'M27 35 C 18 30, 10 29, 4 31',
    'M22 5 C 18 1, 14 0, 10 1',
    'M23 49 C 18 52, 14 54, 10 53',
    'M14 18 C 8 13, 3 12, -1 15',
    'M14 38 C 8 42, 3 44, -1 41',
  ];
  const short = [
    'M25 25 C 17 23, 9 23, 3 25',
    'M25 30 C 17 32, 9 35, 4 38',
    'M22 15 C 16 11, 11 10, 7 12',
    'M22 40 C 16 44, 11 45, 7 43',
    'M27 27 C 20 26, 12 27, 6 28',
  ];
  return (
    <G strokeLinecap="round" fill="none">
      <G stroke="#1c110b" strokeWidth={1.6} opacity={0.96}>
        {long.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
      <G stroke="#3d2718" strokeWidth={1.2} opacity={0.8}>
        {short.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </G>
  );
}

// Silhouette du membre (fût charnu + couronne + gland), réutilisée fantôme/brillant.
function ShaftGlans({ fill, glansFill, corona }: { fill: string; glansFill?: string; corona?: string }) {
  return (
    <G>
      <Rect x={8} y={13} width={106} height={28} rx={14} ry={14} fill={fill} />
      {corona ? <Ellipse cx={105} cy={CY} rx={9} ry={20} fill={corona} /> : null}
      <Circle cx={116} cy={CY} r={18} fill={glansFill ?? fill} />
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

  const fillW = anim.interpolate({ inputRange: [0, 1], outputRange: [34, 140] });

  const gShaft = `s${uid}`;
  const gGlans = `g${uid}`;
  const gGlansHot = `gh${uid}`;
  const gBalls = `b${uid}`;
  const clip = `c${uid}`;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={44} viewBox={`0 0 ${VBW} ${VBH}`}>
        <Defs>
          <LinearGradient id={gShaft} x1="0" y1="12" x2="0" y2="42" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#F4C8A9" />
            <Stop offset="0.4" stopColor="#DB9E7B" />
            <Stop offset="1" stopColor="#9C5F38" />
          </LinearGradient>
          <RadialGradient id={gGlans} cx="110" cy="18" r="24" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#F6B8A2" />
            <Stop offset="0.55" stopColor="#D6836C" />
            <Stop offset="1" stopColor="#A54836" />
          </RadialGradient>
          <RadialGradient id={gGlansHot} cx="110" cy="18" r="24" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC2B0" />
            <Stop offset="0.5" stopColor="#E76A55" />
            <Stop offset="1" stopColor="#96271C" />
          </RadialGradient>
          <RadialGradient id={gBalls} cx="13" cy="18" r="22" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#E0A67F" />
            <Stop offset="1" stopColor="#92582F" />
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
        <Path d="M27 6 C 6 6, 1 18, 2 27 C 1 36, 6 48, 27 48 Z" fill="#1c110b" opacity={0.92} />
        <PubicHair />

        {/* Couilles (scrotum) charnues */}
        <G>
          <Ellipse cx={14} cy={17} rx={11} ry={13} fill={`url(#${gBalls})`} />
          <Ellipse cx={14} cy={37} rx={11} ry={13} fill={`url(#${gBalls})`} />
          <Path d="M14 5 C 9 17, 9 37, 14 49" stroke="#71401f" strokeWidth={1.6} fill="none" opacity={0.75} />
          <Path d="M6 14 q5 3 10 1" stroke="#844d2c" strokeWidth={1.1} fill="none" opacity={0.5} />
          <Path d="M6 40 q5 -3 10 -1" stroke="#844d2c" strokeWidth={1.1} fill="none" opacity={0.5} />
        </G>

        {/* Halo chaud quand le palier est imminent */}
        {almost ? <Circle cx={116} cy={CY} r={23} fill="#FF7A59" opacity={0.4} /> : null}

        {/* Membre brillant, révélé/rempli par la jauge */}
        <G clipPath={`url(#${clip})`}>
          <ShaftGlans
            fill={`url(#${gShaft})`}
            glansFill={`url(#${almost ? gGlansHot : gGlans})`}
            corona="#BB6E51"
          />
          {/* ombre du dessous (galbe) */}
          <Ellipse cx={60} cy={38} rx={44} ry={4} fill="#8A4E2C" opacity={0.35} />
          {/* réseau de veines sous-cutanées */}
          <Path d="M22 19 q24 -6 48 1 q14 2 26 0" stroke="#7C5486" strokeWidth={2.2} fill="none" opacity={0.32} strokeLinecap="round" />
          <Path d="M26 24 q20 -3 40 0" stroke="#6E6EA0" strokeWidth={1.8} fill="none" opacity={0.26} strokeLinecap="round" />
          <Path d="M24 32 q26 5 50 0" stroke="#7C5486" strokeWidth={2} fill="none" opacity={0.28} strokeLinecap="round" />
          <Path d="M40 21 q6 6 4 12" stroke="#6E6EA0" strokeWidth={1.5} fill="none" opacity={0.22} strokeLinecap="round" />
          <Path d="M70 20 q8 5 5 13" stroke="#7C5486" strokeWidth={1.5} fill="none" opacity={0.22} strokeLinecap="round" />
          {/* reflet sur le fût */}
          <Ellipse cx={56} cy={18} rx={38} ry={3} fill="#FFFFFF" opacity={0.26} />
          {/* reflet du gland + méat (fente) */}
          <Ellipse cx={111} cy={18} rx={5} ry={3.4} fill="#FFFFFF" opacity={0.5} />
          <Ellipse cx={128} cy={CY} rx={2} ry={5} fill="#7A2E24" opacity={0.72} />
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
