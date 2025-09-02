// src/components/SearchControls.jsx
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
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
  const isCollapsed = !isExpanded; // COLLAPSED = false, HALF/FULL = true

  // Plynulý fade pro rychlé čipy při přechodu do/ze stavu HALF/FULL
  const chipsOpacity = useRef(new Animated.Value(isCollapsed ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(chipsOpacity, {
      toValue: isCollapsed ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isCollapsed, chipsOpacity]);

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

      {/* Fázované mizení čipů místo ostrého přepnutí */}
      <Animated.View pointerEvents={isCollapsed ? 'auto' : 'none'} style={{ opacity: chipsOpacity }}>
        {isCollapsed && (
          <QuickRadiusChips
            radiusM={radiusM}
            commitRadius={onCommitRadius}
            styles={styles}
            t={t}
          />
        )}
      </Animated.View>
    </>
  );
}
