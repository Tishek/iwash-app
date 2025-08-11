import React from 'react';
import TopBars from './TopBars';
import RadiusDock from './RadiusDock';
import QuickRadiusChips from './QuickRadiusChips';

export default function SearchControls({
  isExpanded,
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
    <>
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

      {!isExpanded && (
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

      <QuickRadiusChips
        radiusM={radiusM}
        commitRadius={onCommitRadius}
        styles={styles}
        t={t}
      />
    </>
  );
}


