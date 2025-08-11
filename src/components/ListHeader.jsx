import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ListHeader({ P, t, radiusM, filteredCount, totalCount, lastError, loading, onSearchPress, styles }) {
  return (
    <View style={[styles.sheetHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.sheetTitle, { color: P.text }]}>{t('listTitle')}</Text>
        <Text style={[styles.sheetSubtitle, { color: P.textMute }]}>
          {filteredCount} / {totalCount} • {t('radius')} {(radiusM / 1000).toFixed(1)} {t('units.km')}{lastError ? ' • ⚠️ ' + t('error') : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onSearchPress}
        disabled={loading}
        style={{ backgroundColor: loading ? '#666' : '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        accessibilityLabel={t('search')}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{loading ? '…' : t('search')}</Text>
      </TouchableOpacity>
    </View>
  );
}


