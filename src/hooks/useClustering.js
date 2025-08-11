import { useCallback } from 'react';

export function useClustering({
  insets,
  topUiBottomY,
  isExpanded,
  sheetTop,
  screen,
  regionRef,
  region,
  clusterRadiusPx,
  filteredPlaces,
  moveMarkerToVisibleCenter,
  centerLockRef,
}) {
  const getClusterEdgePadding = useCallback(() => {
    const topSafe = insets?.top || 0;
    const topOcclusion = Math.max(topSafe, topUiBottomY);
    const bottomOcclusionPx = isExpanded ? 110 /* SNAP_COLLAPSED fallback */ : (screen.height - sheetTop);
    const topPad = Math.max(16, topOcclusion + 16);
    const bottomPad = Math.max(16, bottomOcclusionPx + 16);
    const sidePad = 24;
    return { topPad, bottomPad, sidePad };
  }, [insets?.top, topUiBottomY, isExpanded, sheetTop, screen.height]);

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const waitForUnlock = async (timeout = 1200, tick = 30) => {
    const start = Date.now();
    while (centerLockRef.current) {
      if (Date.now() - start > timeout) break;
      // eslint-disable-next-line no-await-in-loop
      await wait(tick);
    }
  };

  const progressiveClusterZoom = useCallback(async (center) => {
    if (!center) return;
    const STEPS_M = [1200, 800, 550, 360, 260];
    for (let i = 0; i < STEPS_M.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await waitForUnlock(1000);
      // eslint-disable-next-line no-await-in-loop
      await moveMarkerToVisibleCenter(center, {
        targetSpanM: Math.min(STEPS_M[i], 1000),
        minDelta: 0.003,
        pinScale: 0,
        duration: 240,
      });
      // eslint-disable-next-line no-await-in-loop
      await wait(320);
    }
  }, [moveMarkerToVisibleCenter]);

  const collectCoordsFromBBox = useCallback((center) => {
    if (!center || !(regionRef.current || region)) return [];
    const regionArg = regionRef.current || region;
    const pxR = Math.max(40, Math.min(72, clusterRadiusPx));
    const latPerPx = (regionArg.latitudeDelta || 0.02) / screen.height;
    const lonPerPx = (regionArg.longitudeDelta || 0.02) / screen.width;
    const scale = 1.6;
    const latRadiusDeg = latPerPx * pxR * scale;
    const lonRadiusDeg = lonPerPx * pxR * scale;

    const minLat = center.latitude - latRadiusDeg;
    const maxLat = center.latitude + latRadiusDeg;
    const minLng = center.longitude - lonRadiusDeg;
    const maxLng = center.longitude + lonRadiusDeg;

    return (filteredPlaces || [])
      .map((p) => p?.location)
      .filter((c) => c && typeof c.latitude === 'number' && typeof c.longitude === 'number')
      .filter((c) => c.latitude >= minLat && c.latitude <= maxLat && c.longitude >= minLng && c.longitude <= maxLng);
  }, [regionRef, region, clusterRadiusPx, screen.height, screen.width, filteredPlaces]);

  return { getClusterEdgePadding, progressiveClusterZoom, collectCoordsFromBBox };
}


