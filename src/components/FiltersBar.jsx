import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function FiltersBar({
  t,
  filterMode,
  setFilterMode,
  isDark,
  onLayout,
  styles,
}) {
  return (
    <View onLayout={onLayout} style={styles.filtersContainer}>
      {[
        ['ALL', t?.('all') || 'Vše'],
        ['CONTACT', t?.('contact') || 'Kontaktní'],
        ['NONCONTACT', t?.('noncontact') || 'Bezkontaktní'],
        ['FULLSERVICE', t?.('fullservice') || 'Full service'],
        ['FAV', t?.('favorites') || 'Oblíbené'],
      ].map(([key, label]) => (
        <TouchableOpacity
          key={key}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setFilterMode?.(key);
          }}
          style={[
            styles.filterButton,
            filterMode === key
              ? styles.filterButtonActive
              : styles.filterButtonInactive,
          ]}
        >
          <Text
            style={
              isDark ? styles.filterButtonTextDark : styles.filterButtonTextLight
            }
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

