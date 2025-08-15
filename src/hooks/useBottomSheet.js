import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

const resolveSnapPoint = (sp) => {
  if (typeof sp === 'number') return sp;
  if (typeof sp === 'string' && sp.trim().endsWith('%')) {
    const pct = parseFloat(sp) / 100;
    if (!Number.isNaN(pct)) return SCREEN_H * pct;
  }
  return 0;
};

export function useBottomSheet({ onAtTargetHeight, snapPoints = [], sheetIndex = 0 }) {
  const [sheetTopH, setSheetTopH] = useState(0);
  const [sheetTop, setSheetTop] = useState(
    SCREEN_H - resolveSnapPoint(snapPoints[sheetIndex] ?? 0),
  );

  useEffect(() => {
    const h = resolveSnapPoint(snapPoints[sheetIndex] ?? 0);
    setSheetTop(SCREEN_H - h);
    onAtTargetHeight?.();
  }, [snapPoints, sheetIndex, onAtTargetHeight]);

  return { sheetTopH, setSheetTopH, sheetTop };
}

