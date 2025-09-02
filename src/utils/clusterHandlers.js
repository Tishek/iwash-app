// utils/clusterHandlers.js
export function featuresToCoords(features) {
  return (features || [])
    .map((f) => ({
      latitude: f?.geometry?.coordinates?.[1],
      longitude: f?.geometry?.coordinates?.[0],
    }))
    .filter(
      (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number'
    );
}

export function makeClusterPressHandler({
  center,
  clusterId,
  mapRef,
  getClusterEdgePadding,
  collectCoordsFromBBox,
  progressiveClusterZoom,
  region,
  regionRef,
  clusterRadiusPx,
  log = () => {},
}) {
  return async function onPress() {
    if (!center) return;

    // helper pro fit
    const fitCoords = (coords) => {
      if (!coords || coords.length === 0) return false;
      const { topPad, bottomPad, sidePad } = getClusterEdgePadding();
      const map = mapRef.current?.getMapRef?.() || mapRef.current;
      try {
        map?.fitToCoordinates(coords, {
          edgePadding: { top: topPad, right: sidePad, bottom: bottomPad, left: sidePad },
          animated: true,
        });
        log('fitToCoordinates', { points: coords.length, topPad, bottomPad, sidePad });
        return true;
      } catch (e) {
        log('fitToCoordinates error', String(e?.message || e));
        return false;
      }
    };

    // 1) zkusit supercluster engine
    let coordsFromEngine = [];
    const engine = mapRef.current?.getClusteringEngine?.();
    if (engine && clusterId != null) {
      try {
        const leaves = engine.getLeaves(clusterId, 1000, 0) || [];
        coordsFromEngine = featuresToCoords(leaves);
        log('engine leaves', { count: coordsFromEngine.length });
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('No cluster with the specified id')) {
          log('engine race (missing id) — skip leaves');
        } else {
          log('engine leaves error', msg);
        }
      }

      // zkus rozbalit děti, když leaves nic nevrátily
      if (!coordsFromEngine.length) {
        try {
          const children = engine.getChildren(clusterId) || [];
          if (children.length) {
            const pointChildren = children.filter((c) => !c?.properties?.cluster);
            const clusterChildren = children.filter((c) => c?.properties?.cluster);
            coordsFromEngine = featuresToCoords(pointChildren);
            for (const ch of clusterChildren) {
              const cid = ch?.properties?.cluster_id ?? ch?.id;
              if (cid == null) continue;
              try {
                const chLeaves = engine.getLeaves(cid, 1000, 0) || [];
                coordsFromEngine.push(...featuresToCoords(chLeaves));
              } catch {}
            }
            log('engine children expanded', { count: coordsFromEngine.length });
          }
        } catch {}
      }
    }

    // 2) když máme souřadnice z enginu, zkus fit
    if (coordsFromEngine.length) {
      if (fitCoords(coordsFromEngine)) return;
    }

    // 3) bbox approx fallback
    const approx = collectCoordsFromBBox(center, regionRef.current || region, clusterRadiusPx);
    if (approx.length) {
      if (fitCoords(approx)) {
        log('fitToCoordinates(bbox) used', { points: approx.length });
        return;
      }
    }

    // 4) progresivní zoom fallback — NOVĚ POSÍLÁME clusterId + kontext
    await progressiveClusterZoom(center, clusterId, {
      mapRef,
      regionRef,
      region,
      clusterRadiusPx,
      getClusterEdgePadding,
      collectCoordsFromBBox,
      duration: 350,
    });
  };
}