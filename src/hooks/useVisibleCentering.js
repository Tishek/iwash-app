import { useRef } from 'react';

export function useVisibleCentering({
  insets,
  topUiBottomY,
  sheetTop,
  screen,
  region,
  regionRef,
  isExpanded,
  animateToRegionSafe,
  pinAnchorOffsetBase,
}) {
  const centerLockRef = useRef(false);

  const moveMarkerToVisibleCenter = async (coord, opts = {}) => {
    if (!region || !coord) return;

    const { zoomFactor = 0.7, minDelta = 0.01, targetSpanM = null, pinScale = 0, duration = 320 } = opts;

    const now = Date.now();
    const key = `${Number(coord.latitude).toFixed(6)},${Number(coord.longitude).toFixed(6)}|${isExpanded ? 1 : 0}|${pinScale}`;
    if (moveMarkerToVisibleCenter._last && moveMarkerToVisibleCenter._last.key === key && now - moveMarkerToVisibleCenter._last.ts < 600) return;
    moveMarkerToVisibleCenter._last = { key, ts: now };

    if (centerLockRef.current) return;
    centerLockRef.current = true;
    setTimeout(() => { centerLockRef.current = false; }, duration + 120);

    const topSafe = insets?.top || 0;
    const topOcclusion = Math.max(topSafe, topUiBottomY);

    // Fallback, když sheetTop není k dispozici (např. v Expo Go/IOS při UI změnách)
    let sheetTopSafe = Number.isFinite(sheetTop) ? sheetTop : (isExpanded ? Math.round(screen.height * 0.55) : screen.height);
    const visibleH = Math.max(1, sheetTopSafe - topOcclusion);
    const desiredCenterY = topOcclusion + visibleH / 2;

    const anchorOffsetPx = pinScale > 0 ? pinAnchorOffsetBase * pinScale : 0;
    const desiredAnchorY = desiredCenterY + anchorOffsetPx;

    await new Promise(r => requestAnimationFrame(r));

    const current = regionRef?.current || region;
    const currentLatDelta = current?.latitudeDelta || 0.02;
    const currentLonDelta = current?.longitudeDelta || 0.02;

    let nextLatDelta, nextLonDelta;
    if (targetSpanM && targetSpanM > 0) {
      const scaleFactor = screen.height / visibleH;
      nextLatDelta = Math.max(minDelta, (targetSpanM / 111320) * scaleFactor);
      const aspect = screen.width / screen.height;
      nextLonDelta = Math.max(minDelta, nextLatDelta * aspect);
    } else {
      nextLatDelta = Math.max(minDelta, currentLatDelta * zoomFactor);
      nextLonDelta = Math.max(minDelta, currentLonDelta * zoomFactor);
    }

    const degPerPxLat = nextLatDelta / screen.height;
    const pixelDeltaY = desiredAnchorY - screen.height / 2;
    const targetLatitude = coord.latitude + pixelDeltaY * degPerPxLat;

    animateToRegionSafe({
      ...(current || {}),
      latitude: targetLatitude,
      longitude: coord.longitude,
      latitudeDelta: nextLatDelta,
      longitudeDelta: nextLonDelta,
    }, duration);
    // Vrať promise, která se resolve-ne po dokončení animace
    await new Promise((r) => setTimeout(r, duration + 60));
  };

  return { moveMarkerToVisibleCenter, centerLockRef };
}
