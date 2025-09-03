import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClusteredMapView from 'rn-maps-clustering';
import { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { DEV_LOG, DEV_WARN } from '../utils/devlog';

export default function MapViewClustered({
  mapRef,
  region,
  onRegionChangeComplete,
  onPanDrag,
  clusterRadiusPx,
  renderCluster,
  searchCenter,
  radiusM,
  children,
  clusteringEnabled = true,
  freezeChildren = false,
}) {
  if (!region) {
    console.warn('[MapViewClustered] No region provided');
    return null;
  }
  
  DEV_LOG('[MapViewClustered] Rendering with children:', !!children);
  DEV_LOG('[MapViewClustered] Children count:', React.Children.count(children));

  // Děti předej přímo – knihovna si je sama memoizuje (Children.toArray)
  // a pracuje s klíči. Složitější stabilizace zde může clustering rozbít.
  const forwardedChildren = React.useMemo(() => {
    try { return React.Children.count(children) ? children : null; }
    catch { return children || null; }
  }, [children]);
  
  // Safe render cluster function
  const safeRenderCluster = React.useCallback((cluster, onPress) => {
    try {
      if (!renderCluster || typeof renderCluster !== 'function') {
        DEV_WARN('[MapViewClustered] No renderCluster function provided');
        return null;
      }
      
      if (!cluster) {
        DEV_WARN('[MapViewClustered] No cluster data provided to renderCluster');
        return null;
      }
      
      return renderCluster(cluster, onPress);
    } catch (error) {
      console.error('[MapViewClustered] Error in renderCluster:', error);
      return null;
    }
  }, [renderCluster]);
  
  return (
    <ClusteredMapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onPanDrag={onPanDrag}
      showsCompass={false}
      showsMyLocationButton={false}
      showsScale={false}
      clusteringEnabled={!!clusteringEnabled}
      spiralEnabled
      // Dřívější shlukování – přidáme ~40 px k odhadovanému radiusu
      // a držíme rozumné meze. Tím se klastry tvoří už při mírném oddálení.
      radius={Math.max(120, Math.min((clusterRadiusPx || 80) + 40, 280))}
      minPoints={2}
      extent={512}
      clusterColor="#111"
      clusterTextColor="#fff"
      renderCluster={safeRenderCluster}
      // Add error handling props
      onError={(error) => {
        console.error('[MapViewClustered] Map error:', error);
      }}
    >
      {searchCenter && (
        <Circle
          key="search-circle"
          center={searchCenter}
          radius={radiusM}
          strokeWidth={2}
          strokeColor="rgba(56,116,255,0.7)"
          fillColor="rgba(56,116,255,0.12)"
        />
      )}

      {forwardedChildren}
    </ClusteredMapView>
  );
}
