import { useMemo } from 'react';

export function useClusterRadiusPx(region) {
  return useMemo(() => {
    if (!region) return 60;
    const zoom = Math.log2(360 / (region.latitudeDelta || 1));
    // Větší radius = dřívější skládání; držíme rozumné meze
    // Při běžném zoomu ~12–14 chceme radius kolem 80–100 px
    // Ještě dřívější clustering – velmi velký radius
    const r = Math.round(210 - zoom * 1.5);
    const clampLocal = (v, min, max) => Math.max(min, Math.min(max, v));
    return clampLocal(r, 80, 220);
  }, [region]);
}
