// src/hooks/useBottomSheet.js
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Lehké „kompat“ API:
 * - vrací Animated.Value sheetH, ale bez RN .start() animací
 * - hlavní animaci listu teď dělá BottomSheetContainer (Reanimated)
 */
function useBottomSheet({ isExpanded, collapsedH, expandedH }) {
  const sheetH = useRef(new Animated.Value(collapsedH)).current;

  useEffect(() => {
    const target = isExpanded ? expandedH : collapsedH;
    try {
      // jen přestavíme hodnotu; žádné Animated.spring(...).start()
      sheetH.setValue(target);
    } catch {
      // když by v budoucnu sheetH nebyl Animated.Value, tady skončíme potichu
    }
  }, [isExpanded, collapsedH, expandedH, sheetH]);

  return { sheetH };
}

export { useBottomSheet };     // pojmenovaný export
export default useBottomSheet;  // default export