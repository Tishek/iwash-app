// src/hooks/usePlaceFocus.js
import * as Haptics from 'expo-haptics';
import { InteractionManager } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { breadcrumb } from '../utils/crashTrace';
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
  onFocusStart,
  onFocusEnd,
}) {
  const guardRef = { press: { current: false } };
  try { if (!usePlaceFocus._pressGuard) usePlaceFocus._pressGuard = { current: false }; } catch {}
  // shared module-level guard (extra safety across re-renders)
  const pressGuardRef = usePlaceFocus._pressGuard || guardRef.press;
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
    const task = () => InteractionManager.runAfterInteractions(() => {
      try { scrollToItemJS(idx); } catch {}
    });
    if (delayMs > 0) {
      setTimeout(task, delayMs);
    } else {
      // jeden frame počkáme, ať má layout čas a doběhnou animace
      requestAnimationFrame(task);
    }
  };
  // --------------------------------------------------------------------------

  const safeHaptics = () => callFromAnyThread(() => { try { Haptics.selectionAsync(); } catch {} });

  const safeSetExpanded = (next) =>
    callFromAnyThread((v) => setIsExpanded?.(v), next);

  const focusPlace = (place) => {
    try { onFocusStart?.(); } catch {}
    try { breadcrumb('list_item_press', { id: place?.id, name: place?.name }); } catch {}
    if (pressGuardRef.current) {
      try { breadcrumb('place_focus_skipped_guard', { id: place?.id }); } catch {}
      return;
    }
    pressGuardRef.current = true;
    setTimeout(() => { pressGuardRef.current = false; }, 260);

    safeHaptics();
    disableFollow?.();

    // výběr id vždy na JS
    callFromAnyThread((p) => {
      setSelectedId((prev) => (prev === p.id ? prev : p.id));
    }, place);

    if (!place?.location) return;

    // Posuň mapu: pokud list ještě není rozbalený, počkej až se rozbalí,
    // a teprve potom střed posuň (jinak by mohl být pin zakryt listem)
    const doCenter = () => {
      try { breadcrumb('place_focus_center', { id: place?.id }); } catch {}
      return moveMarkerToVisibleCenter(place.location, {
      zoomFactor: isExpanded ? 0.68 : 1.0,
      minDelta: 0.01,
      pinScale: PIN_SELECTED_SCALE,
      targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    };

    // Připrav pending refy a případně rozbal list
    if (!isExpanded) {
      callFromAnyThread((loc, scale) => setPendingFocusJS(loc, scale, pendingFocusCoordRef, pendingFocusScaleRef),
        place.location,
        PIN_SELECTED_SCALE
      );
      safeSetExpanded(true);
    } else {
      doCenter();
    }

    // Scroll na položku
    const idx = idToIndex[place.id];
    try { breadcrumb('place_focus_scroll', { id: place?.id, idx }); } catch {}
    callFromAnyThread(scheduleScrollJS, idx, isExpanded ? 120 : 320);
    setTimeout(() => { try { onFocusEnd?.(); } catch {} }, 650);
  };

  const onMarkerPress = (place) => {
    try { onFocusStart?.(); } catch {}
    try { breadcrumb('marker_press', { id: place?.id }); } catch {}
    if (selectedId === place.id && isExpanded) return;

    disableFollow?.();
    safeHaptics();

    callFromAnyThread((p) => {
      setSelectedId((prev) => (prev === p.id ? prev : p.id));
    }, place);

    // Posuň mapu – pokud list není rozbalený, počkej na rozbalení
    const doCenter = () => {
      try { breadcrumb('marker_center', { id: place?.id }); } catch {}
      return moveMarkerToVisibleCenter(place.location, {
      zoomFactor: isExpanded ? 0.7 : 1.0,
      minDelta: 0.01,
      pinScale: PIN_SELECTED_SCALE,
      targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    };

    if (!isExpanded) {
      callFromAnyThread((loc, scale) => setPendingFocusJS(loc, scale, pendingFocusCoordRef, pendingFocusScaleRef),
        place.location,
        PIN_SELECTED_SCALE
      );
      safeSetExpanded(true);
    } else {
      doCenter();
    }

    const idx = idToIndex[place.id];
    // když už je sheet otevřený, stačí kratší delay; jinak delší
    try { breadcrumb('marker_scroll', { id: place?.id, idx }); } catch {}
    callFromAnyThread(scheduleScrollJS, idx, isExpanded ? 120 : 320);
    setTimeout(() => { try { onFocusEnd?.(); } catch {} }, 650);
  };

  return { focusPlace, onMarkerPress };
}
