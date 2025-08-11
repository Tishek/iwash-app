import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

export function useBottomSheet({
  onAtTargetHeight,
  collapsedH = 110,
  expandedMaxH = Math.min(420, SCREEN_H * 0.6),
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetTopH, setSheetTopH] = useState(0);
  const [sheetTop, setSheetTop] = useState(SCREEN_H - collapsedH);
  const sheetH = useRef(new Animated.Value(collapsedH)).current;

  useEffect(() => {
    Animated.spring(sheetH, {
      toValue: isExpanded ? expandedMaxH : collapsedH,
      useNativeDriver: false,
      friction: 9,
      tension: 80,
    }).start();
  }, [isExpanded, sheetH, collapsedH, expandedMaxH]);

  useEffect(() => {
    const id = sheetH.addListener(({ value }) => {
      setSheetTop(SCREEN_H - value);
      const targetH = isExpanded ? expandedMaxH : collapsedH;
      if (Math.abs(value - targetH) < 0.5) {
        onAtTargetHeight?.();
      }
    });
    return () => { sheetH.removeListener(id); };
  }, [sheetH, isExpanded, collapsedH, expandedMaxH, onAtTargetHeight]);

  return { isExpanded, setIsExpanded, sheetH, sheetTopH, setSheetTopH, sheetTop };
}


