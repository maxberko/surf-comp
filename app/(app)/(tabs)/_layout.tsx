import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/theme/colors';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.cardBorder,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Classement',
          tabBarIcon: ({ focused }) => <Icon emoji="🏆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Session',
          tabBarIcon: ({ focused }) => <Icon emoji="🌊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="votes"
        options={{
          title: 'Votes',
          tabBarIcon: ({ focused }) => <Icon emoji="🗳️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Règles',
          tabBarIcon: ({ focused }) => <Icon emoji="📖" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
