// src/hooks/useBottomSheet.js
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

/**
 * Lehké „kompat“ API:
 * - vrací Animated.Value sheetH, ale bez RN .start() animací
 * - hlavní animaci listu teď dělá BottomSheetContainer (Reanimated)
 */
function useBottomSheet({ collapsedH = 110, expandedH = 420 } = {}) {
  const sheetH = useRef(new Animated.Value(collapsedH)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetTopH, setSheetTopH] = useState(null); // top Y pozice listu, doplňuje BottomSheetContainer

  useEffect(() => {
    const target = isExpanded ? expandedH : collapsedH;
    try { sheetH.setValue(target); } catch {}
  }, [isExpanded, collapsedH, expandedH, sheetH]);

  const screenH = Dimensions.get('window').height;
  const sheetTop = Number.isFinite(sheetTopH)
    ? sheetTopH
    : (isExpanded ? Math.round(screenH * 0.55) : screenH);

  return { isExpanded, setIsExpanded, sheetH, sheetTopH, setSheetTopH, sheetTop };
}

export { useBottomSheet };     // pojmenovaný export
export default useBottomSheet;  // default export
