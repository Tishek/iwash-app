// src/hooks/usePlaceFocus.js
import * as Haptics from 'expo-haptics';
import { runOnJS } from 'react-native-reanimated';
import { ITEM_H, PIN_SELECTED_SCALE, TARGET_VISIBLE_SPAN_M } from '../utils/constants';

// Pomůcka: spustí fn na JS vlákně i když jsme uvnitř workletu.
const callFromAnyThread = (fn, ...args) => {
  // _WORKLET je true uvnitř UI workletu
  // eslint-disable-next-line no-underscore-dangle
  if (globalThis._WORKLET) {
    return runOnJS(fn)(...args);
  }
  return fn(...args);
};

export function usePlaceFocus({
  selectedId,
  setSelectedId,
  isExpanded,
  setIsExpanded,
  idToIndex,
  listRef,
  sheetTopH,
  moveMarkerToVisibleCenter,
  disableFollow,
  pendingFocusCoordRef,
  pendingFocusScaleRef,
}) {
  // Stabilní JS helper – upraví pending refy mimo worklet kontext
  const setPendingFocusJS = (loc, scale, coordRef, scaleRef) => {
    try {
      if (coordRef) coordRef.current = loc || null;
      if (scaleRef) scaleRef.current = scale;
    } catch {}
  };
  // ---- ČISTĚ JS scroll funkce (bez workletu) -------------------------------
  const scrollToItemJS = (idx) => {
    if (listRef?.current == null || typeof idx !== 'number') return;

    // bezpečný fallback: pokud scrollToIndex selže, použijeme offset
    try {
      listRef.current.scrollToIndex?.({
        index: idx,
        animated: true,
        viewPosition: 0,
        viewOffset: (Number(sheetTopH) || 0) + 8,
      });
    } catch {
      const off = Math.max(ITEM_H * idx - (Number(sheetTopH) || 0), 0);
      listRef.current.scrollToOffset?.({ offset: off, animated: true });
    }
  };

  const scheduleScrollJS = (idx, delayMs = 0) => {
    if (delayMs > 0) {
      setTimeout(() => scrollToItemJS(idx), delayMs);
    } else {
      // jeden frame počkáme, ať má layout čas
      requestAnimationFrame(() => scrollToItemJS(idx));
    }
  };
  // --------------------------------------------------------------------------

  const safeHaptics = () => callFromAnyThread(() => { try { Haptics.selectionAsync(); } catch {} });

  const safeSetExpanded = (next) =>
    callFromAnyThread((v) => setIsExpanded?.(v), next);

  const focusPlace = (place) => {
    safeHaptics();
    disableFollow?.();

    // výběr id vždy na JS
    callFromAnyThread((p) => {
      setSelectedId((prev) => (prev === p.id ? prev : p.id));
    }, place);

    if (!place?.location) return;

    if (selectedId === place.id && isExpanded) {
      const idx = idToIndex[place.id];
      callFromAnyThread(scheduleScrollJS, idx, 120);
      return;
    }

    if (isExpanded) {
      // tohle je normální JS funkce – ok
      moveMarkerToVisibleCenter(place.location, {
        zoomFactor: 0.65,
        minDelta: 0.01,
        pinScale: PIN_SELECTED_SCALE,
        targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    } else {
      // Nastav pending refy bezpečně z JS – nebalíme refy do worklet closure
      callFromAnyThread((loc, scale) => setPendingFocusJS(loc, scale, pendingFocusCoordRef, pendingFocusScaleRef),
        place.location,
        PIN_SELECTED_SCALE
      );

      safeSetExpanded(true);
    }
  };

  const onMarkerPress = (place) => {
    if (selectedId === place.id && isExpanded) return;

    disableFollow?.();
    safeHaptics();

    callFromAnyThread((p) => {
      setSelectedId((prev) => (prev === p.id ? prev : p.id));
    }, place);

    if (isExpanded) {
      moveMarkerToVisibleCenter(place.location, {
        zoomFactor: 0.7,
        minDelta: 0.01,
        pinScale: PIN_SELECTED_SCALE,
        targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    } else {
      callFromAnyThread((loc, scale) => setPendingFocusJS(loc, scale, pendingFocusCoordRef, pendingFocusScaleRef),
        place.location,
        PIN_SELECTED_SCALE
      );

      safeSetExpanded(true);
    }

    const idx = idToIndex[place.id];
    // když už je sheet otevřený, stačí kratší delay; jinak delší
    callFromAnyThread(scheduleScrollJS, idx, isExpanded ? 120 : 320);
  };

  return { focusPlace, onMarkerPress };
}
