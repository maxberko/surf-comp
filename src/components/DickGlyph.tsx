import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Petit membre en érection (vertical), en chair, pour décorer l'UI.
export function DickGlyph({ size = 64 }: { size?: number }) {
  const uid = useId().replace(/[:]/g, '');
  const gS = `ds${uid}`;
  const gG = `dg${uid}`;
  const gB = `db${uid}`;
  const w = size;
  const h = size * (86 / 56);

  return (
    <Svg width={w} height={h} viewBox="0 0 56 86">
      <Defs>
        <LinearGradient id={gS} x1="18" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F4C8A9" />
          <Stop offset="0.5" stopColor="#DB9E7B" />
          <Stop offset="1" stopColor="#9C5F38" />
        </LinearGradient>
        <RadialGradient id={gG} cx="24" cy="14" r="20" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F6B8A2" />
          <Stop offset="0.55" stopColor="#D6836C" />
          <Stop offset="1" stopColor="#A54836" />
        </RadialGradient>
        <RadialGradient id={gB} cx="24" cy="66" r="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E0A67F" />
          <Stop offset="1" stopColor="#92582F" />
        </RadialGradient>
      </Defs>

      {/* poils à la base */}
      <G stroke="#1c110b" strokeWidth={1.7} fill="none" strokeLinecap="round" opacity={0.95}>
        <Path d="M12 70 C 6 76, 3 82, 4 86" />
        <Path d="M18 74 C 14 80, 12 84, 12 88" />
        <Path d="M44 70 C 50 76, 53 82, 52 86" />
        <Path d="M38 74 C 42 80, 44 84, 44 88" />
        <Path d="M28 78 C 27 83, 27 86, 28 90" />
        <Path d="M8 64 C 2 66, -1 70, 0 74" />
        <Path d="M48 64 C 54 66, 57 70, 56 74" />
      </G>

      {/* couilles */}
      <Ellipse cx={19} cy={66} rx={12} ry={13} fill={`url(#${gB})`} />
      <Ellipse cx={37} cy={66} rx={12} ry={13} fill={`url(#${gB})`} />
      <Path d="M28 55 C 24 62, 24 74, 28 80" stroke="#71401f" strokeWidth={1.6} fill="none" opacity={0.6} />

      {/* fût */}
      <Rect x={18} y={22} width={20} height={44} rx={10} fill={`url(#${gS})`} />
      {/* veines */}
      <Path d="M22 30 q-4 14 2 26" stroke="#7C5486" strokeWidth={1.8} fill="none" opacity={0.3} strokeLinecap="round" />
      <Path d="M35 28 q4 16 -1 30" stroke="#6E6EA0" strokeWidth={1.6} fill="none" opacity={0.26} strokeLinecap="round" />
      {/* reflet */}
      <Ellipse cx={24} cy={44} rx={2.6} ry={16} fill="#FFFFFF" opacity={0.22} />

      {/* couronne + gland */}
      <Ellipse cx={28} cy={22} rx={12} ry={7} fill="#BB6E51" />
      <Circle cx={28} cy={16} r={13} fill={`url(#${gG})`} />
      <Ellipse cx={23} cy={11} rx={3.6} ry={2.6} fill="#FFFFFF" opacity={0.5} />
      <Ellipse cx={28} cy={6} rx={4.5} ry={2} fill="#7A2E24" opacity={0.6} />
    </Svg>
  );
}
