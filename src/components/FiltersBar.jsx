import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function FiltersBar({ t, filterMode, setFilterMode, isDark, onLayout }) {
  return (
    <View onLayout={onLayout} style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
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
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor:
              filterMode === key ? 'rgba(56,116,255,0.2)' : 'rgba(127,127,127,0.12)',
          }}
        >
          <Text style={{ color: isDark ? '#fff' : '#111' }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

