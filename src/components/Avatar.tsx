import { Image, StyleSheet, Text, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors } from '@/theme/colors';

export function Avatar({
  pseudo,
  url,
  size = 44,
  rank,
}: {
  pseudo?: string | null;
  url?: string | null;
  size?: number;
  rank?: number;
}) {
  const ring =
    rank === 1 ? colors.gold : rank === 2 ? '#C7D3DC' : rank === 3 ? colors.coral : undefined;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        ring ? { borderColor: ring, borderWidth: 2 } : null,
      ]}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(pseudo)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { color: colors.accent, fontWeight: '800' },
});
