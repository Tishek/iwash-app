// src/components/SearchControls.jsx
import React from 'react';
import TopBars from './TopBars';
import RadiusDock from './RadiusDock';

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
  const isCollapsed = !isExpanded; // COLLAPSED = false, HALF/FULL = true

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

      {isCollapsed && (
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

      {/* Rychlé čipy vpravo byly na přání odstraněny */}
    </>
  );
}
