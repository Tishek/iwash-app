// src/components/MainMapView.jsx
import React, { useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import MapViewClustered from './MapViewClustered';
import ClusterRenderer from './ClusterRenderer';
import { Marker } from 'react-native-maps';
import MarkerPin from './MarkerPin';
import MeMarker from './MeMarker';
import { makeClusterPressHandler } from '../utils/clusterHandlers';
import { DEV_LOG, DEV_WARN } from '../utils/devlog';

// Error boundary for the entire map view
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    try { console.warn('[MapErrorBoundary] Caught error:', error); } catch {}
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    try { console.warn('[MapErrorBoundary] Error details:', error, errorInfo); } catch {}
  }
  render() {
    if (this.state.hasError) {
      try { console.warn('[MapErrorBoundary] Rendering fallback due to error:', this.state.error); } catch {}
      return (
        <View style={{ flex: 1, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ color: 'red', textAlign: 'center' }}>Map Error</Text>
            <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>
              Please restart the app
            </Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function MainMapView({
  mapRef,
  region,
  onRegionChangeComplete,
  onPanDrag,
  clusterRadiusPx,
  searchCenter,
  radiusM,
  filteredPlaces,
  selectedId,
  onMarkerPress,
  getPinScale,
  isFav,
  coords,
  ringScale,
  ringOpacity,
  styles,
  disableFollow,
  getClusterEdgePadding,
  collectCoordsFromBBoxWrapped,
  progressiveClusterZoomWrapped,
  regionRef,
  showCrosshair,
  log,
  clusteringEnabled = true,
  suspendMarkers = false,
}) {
  // Debug logging for tracking state
  useEffect(() => {
    DEV_LOG('[MainMapView] Props debug:');
    DEV_LOG('- region:', region);
    DEV_LOG('- filteredPlaces length:', filteredPlaces?.length || 0);
    DEV_LOG('- mapRef:', !!mapRef);
    DEV_LOG('- clusterRadiusPx:', clusterRadiusPx);
    if (filteredPlaces?.[0]) {
      DEV_LOG('- First place:', filteredPlaces[0].name, filteredPlaces[0].location);
    }
    if (!filteredPlaces) {
      DEV_WARN('[MainMapView] No filteredPlaces provided!');
    }
  }, [region, filteredPlaces, mapRef, clusterRadiusPx]);

  // onMapReady (guard uvnitř)
  const handleMapReady = useCallback(() => {
    DEV_LOG('[MainMapView] Map ready callback triggered');
    setTimeout(() => {
      try {
        DEV_LOG('[Cluster] Map is ready, clustering is handled internally by rn-maps-clustering');
        if (mapRef?.current) {
          DEV_LOG('[Debug] mapRef.current present, keys:', Object.keys(mapRef.current));
        }
      } catch (error) {
        console.error('[Cluster] Error checking map ref:', error);
      }
    }, 100);
  }, [mapRef]);

  // onRegionChangeComplete (guard uvnitř)
  const handleRegionChangeComplete = useCallback((newRegion) => {
    setTimeout(() => {
      if (!newRegion) return;
      DEV_LOG('[MainMapView] Region changed to:', {
        lat: newRegion.latitude?.toFixed?.(4),
        lng: newRegion.longitude?.toFixed?.(4),
        latDelta: newRegion.latitudeDelta?.toFixed?.(4),
        lngDelta: newRegion.longitudeDelta?.toFixed?.(4),
      });
    }, 0);
    onRegionChangeComplete?.(newRegion);
  }, [onRegionChangeComplete]);

  // Safe render cluster function with error handling
  const renderCluster = useCallback((cluster, onPress) => {
    try {
      if (!cluster) {
        DEV_WARN('[MainMapView] No cluster data provided to renderCluster');
        return null;
      }
      DEV_LOG('[MainMapView] Rendering cluster:', cluster.properties?.point_count, 'points');
      return (
        <ClusterRenderer
          cluster={cluster}
          onPress={onPress}
          disableFollow={disableFollow}
          getClusterEdgePadding={getClusterEdgePadding}
          collectCoordsFromBBox={(c) => collectCoordsFromBBoxWrapped(c)}
          progressiveClusterZoom={(c) => progressiveClusterZoomWrapped(c)}
          region={region}
          regionRef={regionRef}
          clusterRadiusPx={clusterRadiusPx}
          makeClusterPressHandler={(args) =>
            makeClusterPressHandler({ ...args, mapRef })
          }
          styles={styles}
          log={log}
        />
      );
    } catch (error) {
      console.error('[MainMapView] Error in renderCluster:', error);
      return null;
    }
  }, [
    disableFollow,
    getClusterEdgePadding,
    collectCoordsFromBBoxWrapped,
    progressiveClusterZoomWrapped,
    region,
    regionRef,
    clusterRadiusPx,
    mapRef,
    styles,
    log,
  ]);

  // Přímo renderuj Marker prvky jako děti ClusteredMapView (nutné pro clustering)
  const placeMarkers = React.useMemo(() => {
    if (suspendMarkers) return [];
    try {
      if (!Array.isArray(filteredPlaces)) return [];
      // Stabilní pořadí a žádné duplikáty (prevence key/ordering warningů)
      const seen = new Set();
      const stable = [];
      for (let i = 0; i < filteredPlaces.length; i++) {
        const p = filteredPlaces[i];
        if (!p || seen.has(p.id)) continue;
        seen.add(p.id);
        stable.push(p);
      }
      // Stabilní řazení podle id (nezávislé na rychlých změnách pořadí)
      stable.sort((a, b) => (String(a.id) < String(b.id) ? -1 : 1));

      const out = [];
      for (let i = 0; i < stable.length; i++) {
        const p = stable[i];
        const loc = p?.location;
        if (!p || !loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') continue;
        const pid = String(p.id);
        const isSelected = String(selectedId || '') === pid;
        let scale = 1;
        try { const s = getPinScale?.(pid); if (typeof s === 'number' && isFinite(s)) scale = s; } catch {}
        const color =
          p.inferredType === 'NONCONTACT'   ? '#2E90FA' :
          p.inferredType === 'FULLSERVICE'  ? '#12B76A' :
          p.inferredType === 'CONTACT'      ? '#111'    :
                                              '#6B7280';
        out.push(
          <Marker
            key={`place-${pid}`}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            onPress={() => { try { onMarkerPress?.(p); } catch (e) { console.error('[marker] onPress error', e); } }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={isSelected ? 999 : 1}
            title={p.name || 'Car wash'}
          >
            <MarkerPin selected={isSelected} color={color} scale={scale} fav={isFav?.(pid)} />
          </Marker>
        );
      }
      return out;
    } catch (e) {
      console.error('[MainMapView] placeMarkers failed:', e);
      return [];
    }
  }, [filteredPlaces, selectedId, getPinScale, isFav, onMarkerPress, suspendMarkers]);

  // Force-remount the ClusteredMapView when the marker identity set changes.
  // This fully resets the internal index map of rn-maps-clustering and
  // prevents any stale indices when children change rapidly.
  const clusterKey = React.useMemo(() => {
    try {
      const ids = Array.isArray(filteredPlaces) ? filteredPlaces.map((p) => String(p.id)).join(',') : 'none';
      return `cmv:${ids}`;
    } catch { return 'cmv:none'; }
  }, [filteredPlaces]);


  // ❗Return až po všech hookách – pořadí hooků zůstává stejné v každém renderu
  if (!region) {
    console.warn('[MainMapView] No region provided!');
    return null;
  }

  return (
    <MapErrorBoundary>
      <View style={{ flex: 1 }}>
        <MapViewClustered
          key={clusterKey}
          mapRef={mapRef}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPanDrag={onPanDrag}
          clusterRadiusPx={clusterRadiusPx}
          searchCenter={searchCenter}
          radiusM={radiusM}
          onMapReady={handleMapReady}
          renderCluster={renderCluster}
          clusteringEnabled={clusteringEnabled}
          freezeChildren={suspendMarkers}
        >
          {/* Kružnice vyhledávacího okruhu necháváme, není klastrována */}
          {placeMarkers}
          {/* MeMarker jako vnořená komponenta – nebude klastrován */}
          {coords ? (
            <MeMarker
              key="me-marker"
              coords={coords}
              ringScale={ringScale}
              ringOpacity={ringOpacity}
              styles={styles}
            />
          ) : null}
        </MapViewClustered>

        {showCrosshair && styles?.crosshair && styles?.crossDot && (
          <View pointerEvents="none" style={styles.crosshair}>
            <View style={styles.crossDot} />
          </View>
        )}
      </View>
    </MapErrorBoundary>
  );
}
