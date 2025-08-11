import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function usePinSelection(selectedId) {
  const pinScales = useRef({});
  const prevSelectedRef = useRef(null);

  const getPinScale = (id) => {
    if (!pinScales.current[id]) {
      pinScales.current[id] = new Animated.Value(1);
    }
    return pinScales.current[id];
  };

  useEffect(() => {
    const nextId = selectedId;
    const prevId = prevSelectedRef.current;
    if (prevId && nextId && prevId === nextId) return;
    if (prevId && pinScales.current[prevId]) {
      Animated.spring(pinScales.current[prevId], {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    }
    if (nextId && pinScales.current[nextId]) {
      Animated.spring(pinScales.current[nextId], {
        toValue: 1.35,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    }
    prevSelectedRef.current = nextId || null;
  }, [selectedId]);

  return { getPinScale };
}


