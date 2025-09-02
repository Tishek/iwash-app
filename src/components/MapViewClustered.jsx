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
}) {
  if (!region) {
    console.warn('[MapViewClustered] No region provided');
    return null;
  }
  
  DEV_LOG('[MapViewClustered] Rendering with children:', !!children);
  DEV_LOG('[MapViewClustered] Children count:', React.Children.count(children));
  
  // Validate children to prevent crashes
  const validChildren = React.useMemo(() => {
    if (!children) return null;
    
    try {
      const childArray = React.Children.toArray(children);
      const validChildArray = childArray.filter(child => {
        if (!React.isValidElement(child)) {
          DEV_WARN('[MapViewClustered] Invalid child element:', child);
          return false;
        }
        return true;
      });
      
      DEV_LOG(`[MapViewClustered] Valid children: ${validChildArray.length}/${childArray.length}`);
      return validChildArray.length > 0 ? validChildArray : null;
    } catch (error) {
      console.error('[MapViewClustered] Error processing children:', error);
      return null;
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
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onPanDrag={onPanDrag}
      showsCompass={false}
      showsMyLocationButton={false}
      showsScale={false}
      clusteringEnabled
      spiralEnabled
      radius={Math.max(20, Math.min(clusterRadiusPx || 60, 200))} // Clamp radius to safe range
      extent={256}
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

