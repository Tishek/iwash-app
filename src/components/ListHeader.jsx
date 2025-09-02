import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ListHeader({ P, t, isDark, radiusM, filteredCount, totalCount, lastError, loading, onSearchPress, styles, fromCache, cacheTs }) {
  const cacheAgeMin = React.useMemo(() => {
    if (!fromCache || !cacheTs) return null;
    const ageMs = Date.now() - cacheTs;
    if (ageMs < 0) return 0;
    return Math.floor(ageMs / 60000);
  }, [fromCache, cacheTs]);

  return (
    <View style={[styles.sheetHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.sheetTitle, { color: P.text }]}>{t('listTitle')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.sheetSubtitle, { color: P.textMute }]}>
            {filteredCount} / {totalCount} • {t('radius')} {(radiusM / 1000).toFixed(1)} {t('units.km')}{lastError ? ' • ⚠️ ' + t('error') : ''}
          </Text>
          {fromCache && (
            <View style={{ backgroundColor: isDark ? '#0F1522' : '#F2F4F7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: isDark ? 1 : 0, borderColor: P.border }}>
              <Text style={{ color: P.textMute, fontSize: 11, fontWeight: '700' }}>
                {t('cacheBadge', 'Z cache')}
                {typeof cacheAgeMin === 'number' ? ` · ${cacheAgeMin} ${t('units.min', 'min')}` : ''}
              </Text>
            </View>
          )}
        </View>
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

