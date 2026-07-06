import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Pattern, Rect } from 'react-native-svg';

// Motif de fond : petites bites tuilées, très discrètes (texture dans le vide).
export function DickPattern() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dickpat" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
          <G fill="#FF3D7F" opacity={0.05}>
            {/* motif 1 */}
            <Circle cx={9} cy={34} r={3.1} />
            <Circle cx={14} cy={35} r={3.1} />
            <Rect x={9.5} y={22} width={6} height={12} rx={3} />
            <Circle cx={12.5} cy={20} r={4.2} />
            {/* motif 2 décalé */}
            <Circle cx={34} cy={12} r={2.7} />
            <Circle cx={39} cy={13} r={2.7} />
            <Rect x={34.5} y={2} width={5.2} height={10} rx={2.6} />
            <Circle cx={37} cy={1} r={3.6} />
          </G>
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#dickpat)" />
    </Svg>
  );
}
