// src/components/MainMapView.jsx
import React, { useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import MapViewClustered from './MapViewClustered';
import ClusterRenderer from './ClusterRenderer';
import MarkersLayer from './MarkersLayer';
import { makeClusterPressHandler } from '../utils/clusterHandlers';
import { DEV_LOG, DEV_WARN } from '../utils/devlog';

// Error boundary for the entire map view
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    console.error('[MapErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[MapErrorBoundary] Error details:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      console.error('[MapErrorBoundary] Rendering fallback due to error:', this.state.error);
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

  // Memoize markers layer (vrátí null, když není co kreslit)
  const markersLayer = React.useMemo(() => {
    try {
      if (!filteredPlaces || !Array.isArray(filteredPlaces)) return null;
      return (
        <MarkersLayer
          filteredPlaces={filteredPlaces}
          selectedId={selectedId}
          onMarkerPress={onMarkerPress}
          getPinScale={getPinScale}
          isFav={isFav}
          coords={coords}
          ringScale={ringScale}
          ringOpacity={ringOpacity}
          styles={styles}
        />
      );
    } catch (error) {
      console.error('[MainMapView] Error creating MarkersLayer:', error);
      return null;
    }
  }, [filteredPlaces, selectedId, onMarkerPress, getPinScale, isFav, coords, ringScale, ringOpacity, styles]);

  // ❗Return až po všech hookách – pořadí hooků zůstává stejné v každém renderu
  if (!region) {
    console.warn('[MainMapView] No region provided!');
    return null;
  }

  return (
    <MapErrorBoundary>
      <View style={{ flex: 1 }}>
        <MapViewClustered
          mapRef={mapRef}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPanDrag={onPanDrag}
          clusterRadiusPx={clusterRadiusPx}
          searchCenter={searchCenter}
          radiusM={radiusM}
          onMapReady={handleMapReady}
          renderCluster={renderCluster}
        >
          {markersLayer}
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
