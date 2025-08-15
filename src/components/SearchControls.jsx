import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopBars from './TopBars';
import RadiusDock from './RadiusDock';
import QuickRadiusChips from './QuickRadiusChips';

export default function SearchControls({
  sheetIndex, // 0: collapsed, 1: mid, 2: expanded
  isDark,
  P,
  loading,
  t,
  styles,
  onTopLayout,
  onOpenSettings,
  onBrandLongPress,
  radiusM,
  onAdjustRadius,
  onSearchPress,
  onRecenter,
  onCommitRadius,
}) {
  return (
    <View style={stylesRoot.container} pointerEvents="box-none">
      <TopBars
        isDark={isDark}
        P={P}
        loading={loading}
        t={t}
        styles={styles}
        onTopLayout={onTopLayout}
        onOpenSettings={onOpenSettings}
        onBrandLongPress={onBrandLongPress}
      />

      {sheetIndex === 0 && (
        <RadiusDock
          isDark={isDark}
          P={P}
          radiusM={radiusM}
          adjustRadius={onAdjustRadius}
          searchHere={onSearchPress}
          recenter={onRecenter}
          styles={styles}
          t={t}
          loading={loading}
        />
      )}

      {(sheetIndex === 0 || sheetIndex === 1) && (
        <QuickRadiusChips
          sheetIndex={sheetIndex}
          radiusM={radiusM}
          commitRadius={onCommitRadius}
          styles={styles}
          t={t}
        />
      )}
    </View>
  );
}

const stylesRoot = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1100,
  },
});
