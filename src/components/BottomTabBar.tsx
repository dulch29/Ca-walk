import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type TabName = 'Home' | 'Record' | 'Me';

type Props = {
  activeTab?: TabName;
  onTabPress?: (tab: TabName) => void;
};

function renderTabIcon(name: TabName, isFocused: boolean) {
  const color = isFocused ? '#262A22' : '#8A8F85';
  if (name === 'Home') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
        <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </Svg>
    );
  }
  if (name === 'Record') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Circle cx="8" cy="7.5" r="1.8" fill={color} />
        <Circle cx="12" cy="5.5" r="1.8" fill={color} />
        <Circle cx="16" cy="7.5" r="1.8" fill={color} />
        <Circle cx="5" cy="11.5" r="1.5" fill={color} />
        <Circle cx="19" cy="11.5" r="1.5" fill={color} />
        <Path
          d="M12 11c-2.8 0-4.8 1.8-4.8 4.2 0 1.8 1.4 3.3 4.8 3.3s4.8-1.5 4.8-3.3c0-2.4-2-4.2-4.8-4.2z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

const TABS: { name: TabName; label: string }[] = [
  { name: 'Home', label: 'Home' },
  { name: 'Record', label: 'Record' },
  { name: 'Me', label: 'Me' },
];

export default function BottomTabBar({ activeTab = 'Home', onTabPress }: Props) {
  return (
    <View style={styles.bottomBarContainer}>
      {TABS.map((tab) => {
        const isFocused = tab.name === activeTab;
        return (
          <Pressable
            key={tab.name}
            onPress={() => onTabPress?.(tab.name)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            style={styles.tabItem}
          >
            {renderTabIcon(tab.name, isFocused)}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FAF7EE',
    borderTopWidth: 1.2,
    borderTopColor: '#ECE4D8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 10,
    elevation: 10,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F85',
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#262A22',
  },
});
