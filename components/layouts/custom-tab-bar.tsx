import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = 'overview' | 'activity' | 'budget' | 'savings' | 'insights';

const ICON_PATHS: Record<IconName, string[]> = {
  overview: [
    'M3 12L12 3l9 9',
    'M5 10v10a1 1 0 0 0 1 1h3v-7h6v7h3a1 1 0 0 0 1-1V10',
  ],
  activity: [
    'M8 6h13',
    'M8 12h13',
    'M8 18h13',
    'M3 6h.01',
    'M3 12h.01',
    'M3 18h.01',
  ],
  budget: [
    'M21.21 15.89A10 10 0 1 1 8 2.83',
    'M22 12A10 10 0 0 0 12 2v10z',
  ],
  savings: [
    'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z',
    'M16 14h2',
    'M4 7V5a2 2 0 0 1 2-2h11',
  ],
  insights: [
    'M3 3v18h18',
    'M7 16V10',
    'M12 16V7',
    'M17 16v-4',
  ],
};

const ROUTE_TO_CONFIG: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'overview', label: 'Overview' },
  transactions: { icon: 'activity', label: 'Activity' },
  budget: { icon: 'budget', label: 'Budgets' },
  savings: { icon: 'savings', label: 'Savings' },
  reports: { icon: 'insights', label: 'Insights' },
};

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {ICON_PATHS[name].map((d, i) => (
        <Path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.surface || theme.background,
      borderTopColor: theme.borderSoft || 'rgba(0,0,0,0.06)',
      paddingBottom: bottomInset,
    },
  ];

  return (
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const config = ROUTE_TO_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;
        const color = isFocused ? theme.tint : theme.tabIconDefault;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            try {
              Haptics.selectionAsync().catch(() => {});
            } catch {}
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={{ color: 'rgba(36,107,253,0.12)', borderless: true }}
            style={styles.tab}
          >
            {isFocused && (
              <View style={[styles.indicator, { backgroundColor: theme.tint }]} />
            )}
            <View style={styles.iconWrapper}>
              <TabIcon name={config.icon} color={color} />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    position: 'relative',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
});
