import React from 'react';
import { DEV_ERROR, DEV_WARN } from '../utils/devlog';
import { ScrollView, TouchableOpacity, Text } from 'react-native';

export default function FiltersRow({ filterMode, setFilterMode, isDark, P, styles, t }) {
  const buttons = [
    { key: 'ALL', label: t('filters.ALL') },
    { key: 'CONTACT', label: t('filters.CONTACT') },
    { key: 'NONCONTACT', label: t('filters.NONCONTACT') },
    { key: 'FULLSERVICE', label: t('filters.FULLSERVICE') },
    { key: 'FAV', label: t('filters.FAV') },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {buttons.map(btn => (
        <TouchableOpacity
          key={btn.key}
          onPress={() => {
            try {
              DEV_WARN('[filters] switching to', btn.key);
              setFilterMode(btn.key);
            } catch (e) {
              DEV_ERROR('[filters] setFilterMode failed:', e);
            }
          }}
          style={[
            styles.filterBtn,
            { backgroundColor: (filterMode === btn.key) ? '#111' : (isDark ? '#0F1522' : '#F2F4F7'), borderColor: P.border, borderWidth: isDark ? 1 : 0 }
          ]}
        >
          <Text style={[styles.filterTxt, { color: (filterMode === btn.key) ? '#fff' : P.text }]}>
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
