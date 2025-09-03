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

  // Validate children to prevent crashes
  const isMarkerEl = (el) => !!(el && React.isValidElement(el) && el.props && el.props.coordinate);
  const prevChildrenRef = React.useRef(null);
  const validChildren = React.useMemo(() => {
    if (!children) return null;
    try {
      const childArray = React.Children.toArray(children);
      // Zachovej původní pořadí i klíče – viz React docs o stabilních keys
      const validChildArray = childArray.filter(child => React.isValidElement(child));
      if (freezeChildren) {
        if (!prevChildrenRef.current) prevChildrenRef.current = validChildArray;
        return prevChildrenRef.current;
      }
      // Stabilizační trik: pokud se počet markerů změnil oproti minulé verzi,
      // na jeden frame vrátíme předchozí sadu, aby se rn-maps-clustering
      // nesnažil klonovat staré indexy nad novým children polem.
      const markersCount = validChildArray.filter(isMarkerEl).length;
      const prev = prevChildrenRef.current;
      const prevCount = Array.isArray(prev) ? prev.filter(isMarkerEl).length : null;
      if (prev && prevCount !== null && markersCount !== prevCount) {
        DEV_WARN('[MapViewClustered] children changed (markers count)', prevCount, '→', markersCount, '— stabilizing 1 frame');
        // Keep previous children for this render, but remember the new list
        // so the next frame will switch to it (1-frame stabilization)
        prevChildrenRef.current = validChildArray;
        return prev;
      }
      prevChildrenRef.current = validChildArray;
      DEV_LOG(`[MapViewClustered] Valid children: ${validChildArray.length}/${childArray.length} (markers ${markersCount})`);
      return validChildArray.length > 0 ? validChildArray : null;
    } catch (error) {
      console.error('[MapViewClustered] Error processing children:', error);
      return prevChildrenRef.current || null;
    }
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
      radius={Math.max(100, Math.min((clusterRadiusPx || 160) + 80, 360))} // Much earlier clustering
      minPoints={1}
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

      {validChildren}
    </ClusteredMapView>
  );
}
