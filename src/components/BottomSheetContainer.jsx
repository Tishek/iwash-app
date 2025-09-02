// src/components/BottomSheetContainer.jsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DEV_INFO } from '../utils/devlog';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetPanel from './BottomSheetPanel';
import { ITEM_H } from '../utils/constants';

const ENABLE_SWIPE = true;       // swipe zapnutý
const VELOCITY_SNAP = 900;
const SNAP_TOLERANCE = 36;
const MIN_GAP_TOP = 220;
const MIN_GAP_BOTTOM = 260;
const TOP_MARGIN = 8;

export default function BottomSheetContainer(props) {
  const {
    styles,
    P,
    isDark,
    t,
    onSnapStart,
    onSnapEnd,
    setSheetTopH,
    setSheetTopY,
    isExpanded,
    setIsExpanded,
    filteredPlaces,
    places,
    radiusM,
    lastError,
    loading,
    onSearchPress,
    fromCache,
    cacheTs,
    filterMode,
    setFilterMode,
    listRef,
    selectedId,
    setSelectedId,
    settings,
    isFav,
    toggleFav,
    onNavigatePreferred,
    openNavigation,
    focusPlace,
  } = props;

  const insets = useSafeAreaInsets();
  const { height: SCREEN_H } = Dimensions.get('window');
  const listGestureRef = useRef(null);

  // Snap body (číselné px)
  const COLLAPSED_PX = useMemo(() => {
    const base = Platform.select({ ios: 84, android: 92, default: 88 });
    return (base ?? 88) + (insets?.bottom ?? 0);
  }, [insets?.bottom]);

  const EXPANDED_PX = useMemo(() => {
    const topInset = insets?.top ?? 0;
    return Math.max(300, SCREEN_H - topInset - TOP_MARGIN);
  }, [insets?.top, SCREEN_H]);

  const HALF_PX = useMemo(() => {
    // O něco vyšší half – pro lepší prostor na konci seznamu
    const minHalf = COLLAPSED_PX + MIN_GAP_BOTTOM;
    const maxHalf = EXPANDED_PX - MIN_GAP_TOP;
    const mid = Math.round(SCREEN_H * 0.56);
    return Math.max(minHalf, Math.min(maxHalf, mid));
  }, [COLLAPSED_PX, EXPANDED_PX, SCREEN_H]);

  const points = useMemo(
    () => ({ COLLAPSED: COLLAPSED_PX, HALF: HALF_PX, EXPANDED: EXPANDED_PX }),
    [COLLAPSED_PX, HALF_PX, EXPANDED_PX]
  );

  useEffect(() => { DEV_INFO('[BS] points', points); }, [points]);

  // Shared values – jedna proměnná pro výšku sheetu
  const animatedY = useSharedValue(isExpanded ? points.HALF : points.COLLAPSED);
  const ctx = useSharedValue(0);
  const isAnimatingRef = useRef(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const filterBusyRef = useRef(false);

  const nameForPoint = (p) => {
    if (Math.abs(p - points.COLLAPSED) < 2) return 'COLLAPSED';
    if (Math.abs(p - points.HALF) < 2) return 'HALF';
    return 'EXPANDED';
  };

  const notifyEnd = (targetPx) => {
    const name = nameForPoint(targetPx);
    const logicalExpanded = name !== 'COLLAPSED';
    try { Haptics.selectionAsync(); } catch {}
    setIsExpanded?.(logicalExpanded);
    setIsFullyExpanded(name === 'EXPANDED');
    // Předej skutečnou pozici horní hrany sheetu (odshora)
    try {
      const topY = SCREEN_H - Number(targetPx || 0);
      setSheetTopY?.(topY);
    } catch {}
  };

  const finishAnim = (targetPx) => {
    isAnimatingRef.current = false;
    notifyEnd(targetPx);
    try {
      const name = nameForPoint(targetPx);
      const topY = SCREEN_H - Number(targetPx || 0);
      onSnapEnd?.({ name, targetPx, topY });
    } catch {}
  };

  // Animace z JS vlákna s hlídačem rozjeté animace
  const animateToJS = (targetPx) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    DEV_INFO('[BS] animateTo ->', Math.round(targetPx));
    try { onSnapStart?.(); } catch {}
    animatedY.value = withTiming(targetPx, { duration: 220 }, (finished) => {
      if (finished) runOnJS(finishAnim)(targetPx);
      else runOnJS(() => { isAnimatingRef.current = false; })();
    });
  };

  // Pro worklet nebudeme volat JS. Přeneseme čistá čísla.
  const COLL = COLLAPSED_PX;
  const HALF = HALF_PX;
  const EXP = EXPANDED_PX;

  // Pan gesto (čistě worklet logika + onEnd animuje přímo na UI vlákně)
  const pan = Gesture.Pan()
    .simultaneousWithExternalGesture(listGestureRef)
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      try { runOnJS(() => { try { onSnapStart?.(); } catch {} })(); } catch {}
      ctx.value = animatedY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const delta = -e.translationY; // nahoru = +
      const next = Math.min(Math.max(COLL, ctx.value + delta), EXP);
      animatedY.value = next;
    })
    .onEnd((e) => {
      'worklet';
      const vy = -e.velocityY; // nahoru = +
      const val = animatedY.value;

      // --- inline toNearestSnap (worklet-safe) ---
      let target = HALF;
      if (Math.abs(val - HALF) <= SNAP_TOLERANCE) {
        target = HALF;
      } else if (Math.abs(vy) > VELOCITY_SNAP) {
        target = vy > 0 ? (val < HALF ? HALF : EXP) : (val > HALF ? HALF : COLL);
      } else {
        const dC = Math.abs(val - COLL);
        const dH = Math.abs(val - HALF);
        const dE = Math.abs(val - EXP);
        target = dC < dH ? (dC < dE ? COLL : EXP) : (dH < dE ? HALF : EXP);
      }

      // Animace z UI threadu; callback do JS jen kvůli setState
      animatedY.value = withTiming(target, { duration: 220 }, (finished) => {
        if (finished) runOnJS(finishAnim)(target);
      });
    });

  // Výška panelu je vždy EXP (plná), jezdíme přes bottom
  const style = useAnimatedStyle(() => ({
    height: EXP,
    bottom: animatedY.value - EXP,
  }));

  const handleSetFilterMode = (key) => {
    try { console.warn('[filters] click ->', key); } catch {}
    if (filterBusyRef.current) { try { console.warn('[filters] busy; skip'); } catch {} ; return; }
    filterBusyRef.current = true;
    try { setSelectedId?.(null); } catch {}
    // drobná de-bounce, ať se mapové klastrování nepere s listem
    requestAnimationFrame(() => {
      try {
        console.warn('[filters] setFilterMode', key);
        setFilterMode?.(key);
      } catch (e) {
        try { console.error('[filters] setFilterMode failed:', e); } catch {}
      } finally {
        setTimeout(() => { filterBusyRef.current = false; }, 140);
      }
    });
  };

  // Swipe-only: tap-toggle (funkční updater) ignorujeme
  const handleSetIsExpanded = (updater) => {
    if (typeof updater === 'function' && ENABLE_SWIPE) {
      DEV_INFO('[BS] tap toggle ignored (swipe only)');
      return;
    }
    const currentExpanded = nameForPoint(animatedY.value) !== 'COLLAPSED';
    const next = typeof updater === 'function' ? updater(currentExpanded) : !!updater;
    if (next === currentExpanded) return;
    if (isAnimatingRef.current) return;
    animateToJS(next ? points.HALF : points.COLLAPSED);
  };

  const sheetBody = (
    <Animated.View style={[stylesSheet.sheet, style]}>
      {/* Drag zóna pouze v horní části – list neovládá výšku sheetu */}
      <GestureDetector gesture={pan}>
        <Animated.View pointerEvents="auto" style={stylesSheet.dragZone} />
      </GestureDetector>
      <BottomSheetPanel
        styles={styles}
        P={P}
        isDark={isDark}
        t={t}
        sheetH={points.EXPANDED}
        setSheetTopH={setSheetTopH}
        isExpanded={isExpanded}
        isFullyExpanded={isFullyExpanded}
        setIsExpanded={handleSetIsExpanded}
        scrollHandlerRef={listGestureRef}
        filteredPlaces={filteredPlaces}
        places={places}
        radiusM={radiusM}
        lastError={lastError}
        loading={loading}
        onSearchPress={onSearchPress}
        fromCache={fromCache}
        cacheTs={cacheTs}
        filterMode={filterMode}
        setFilterMode={handleSetFilterMode}
        listRef={listRef}
        selectedId={selectedId}
        settings={settings}
        isFav={isFav}
        toggleFav={toggleFav}
        onNavigatePreferred={onNavigatePreferred}
        openNavigation={openNavigation}
        focusPlace={focusPlace}
      />
    </Animated.View>
  );

  return sheetBody;
}

const stylesSheet = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,   // animujeme přes bottom
    zIndex: 9999,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    // DEBUG - commented out for production
    // backgroundColor: 'rgba(255,0,0,0.06)',
    // borderTopWidth: 2,
    // borderTopColor: 'magenta',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 12 },
    }),
  },
  dragZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 48, // pouze horní pás reaguje na swipe
    zIndex: 5,
  },
});
