import { useMemo } from 'react';

export function useClusterRadiusPx(region) {
  return useMemo(() => {
    if (!region) return 60;
    const zoom = Math.log2(360 / (region.latitudeDelta || 1));
    const r = Math.round(80 - zoom * 4);
    const clampLocal = (v, min, max) => Math.max(min, Math.min(max, v));
    return clampLocal(r, 18, 72);
  }, [region]);
}


