import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

export default function RadiusDock({ isDark, P, radiusM, adjustRadius, searchHere, recenter, styles, t, loading }) {
  return (
    <View style={styles.radiusDockWrap}>
      <BlurView
        intensity={25}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.radiusDock, styles.glass, { borderColor: P?.border, borderWidth: isDark ? 1 : 0 }]}
      >
        <TouchableOpacity onPress={() => adjustRadius(-100)} style={styles.dockBtn}>
          <Text style={styles.dockBtnTxt}>–100</Text>
        </TouchableOpacity>

        <Text style={styles.dockRadius}>{radiusM} {t('units.m')}</Text>

        <TouchableOpacity onPress={() => adjustRadius(+100)} style={styles.dockBtn}>
          <Text style={styles.dockBtnTxt}>+100</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={searchHere} style={[styles.dockAction, { backgroundColor: loading ? '#666' : '#111' }]} disabled={loading}>
          <Text style={styles.dockActionTxt}>{loading ? '…' : t('search')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={recenter} style={styles.dockCircle}>
          <Text style={styles.dockCircleTxt}>◎</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}


