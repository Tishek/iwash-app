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
  // Normalizuj děti (React.Children.toArray odfiltruje null/undefined a přidá interní klíče)
  const normalizedChildren = React.useMemo(() => React.Children.toArray(children), [children]);

  // Stabilní snapshot dětí – aktualizuje se jen když není aktivní freeze (externí ani interní)
  const [stableChildren, setStableChildren] = React.useState(normalizedChildren);
  const freezeRef = React.useRef(freezeChildren);
  freezeRef.current = freezeChildren;

  React.useEffect(() => {
    // Pokud chceme zmrazit, snapshot neměň
    if (freezeRef.current) return;
    // Debounce pro zklidnění re-indexace v knihovně (cloneElement race)
    const id = setTimeout(() => {
      setStableChildren(normalizedChildren);
    }, 40);
    return () => clearTimeout(id);
  }, [normalizedChildren]);

  // Sleduj změnu počtu dětí a jen aktualizuj referenci (bez dalších zásahů)
  const prevLenRef = React.useRef(normalizedChildren.length);
  React.useEffect(() => {
    prevLenRef.current = normalizedChildren.length;
  }, [normalizedChildren.length]);

  // No timers to clean up in simplified mode

  DEV_LOG('[MapViewClustered] Rendering with children:', stableChildren.length);
  
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
        {/* Děti předáváme ve stabilním snapshotu, aby se během cluster reindexu nezměnily */}
        {stableChildren}

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
      </ClusteredMapView>
  );
}
