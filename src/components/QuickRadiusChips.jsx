import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export default function QuickRadiusChips({ radiusM, commitRadius, styles, t }) {
  return (
    <View pointerEvents="box-none" style={styles.quickChipsWrap}>
      {[{ km: 0.5 }, { km: 1 }, { km: 3 }, { km: 5 }].map(({ km }) => {
        const m = Math.round(km * 1000);
        const active = radiusM === m;
        return (
          <TouchableOpacity
            key={m}
            onPress={() => commitRadius(m)}
            style={[styles.quickChip, active && styles.quickChipActive]}
            accessibilityLabel={`${t('radius')} ${km} ${t('units.km')}`}
          >
            <Text style={[styles.quickChipTxt, active && styles.quickChipTxtActive]}>
              {km} {t('units.km')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


