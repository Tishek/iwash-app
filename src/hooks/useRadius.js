import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { DEFAULT_SETTINGS, MIN_M, MAX_M, STEP_M } from '../utils/constants';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function useRadius(settings, saveSettings) {
  const [radiusM, setRadiusM] = useState(DEFAULT_SETTINGS.defaultRadiusM);

  useEffect(() => {
    if (typeof settings?.defaultRadiusM === 'number') {
      setRadiusM(settings.defaultRadiusM);
    }
  }, [settings?.defaultRadiusM]);

  const commitRadius = (valM) => {
    Haptics.selectionAsync();
    const v = clamp(Math.round(valM / STEP_M) * STEP_M, MIN_M, MAX_M);
    setRadiusM(v);
  };

  const adjustRadius = (delta) => {
    Haptics.selectionAsync();
    const next = clamp(Math.round((radiusM + delta) / STEP_M) * STEP_M, MIN_M, MAX_M);
    setRadiusM(next);
    saveSettings?.({ defaultRadiusM: next });
  };

  return { radiusM, setRadiusM, commitRadius, adjustRadius };
}


