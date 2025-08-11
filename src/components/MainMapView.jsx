import React from 'react';
import { View } from 'react-native';
import MapViewClustered from './MapViewClustered';
import ClusterRenderer from './ClusterRenderer';
import MarkersLayer from './MarkersLayer';
import { makeClusterPressHandler } from '../utils/clusterHandlers';

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
  if (!region) return null;
  return (
    <View style={{ flex: 1 }}>
      <MapViewClustered
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onPanDrag={onPanDrag}
        clusterRadiusPx={clusterRadiusPx}
        searchCenter={searchCenter}
        radiusM={radiusM}
        renderCluster={(cluster) => (
          <ClusterRenderer
            cluster={cluster}
            disableFollow={disableFollow}
            getClusterEdgePadding={getClusterEdgePadding}
            collectCoordsFromBBox={collectCoordsFromBBoxWrapped}
            progressiveClusterZoom={progressiveClusterZoomWrapped}
            region={region}
            regionRef={regionRef}
            clusterRadiusPx={clusterRadiusPx}
            makeClusterPressHandler={(args) => makeClusterPressHandler({ ...args, mapRef })}
            styles={styles}
            log={log}
          />
        )}
        renderMarkers={() => (
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
        )}
      />

      {showCrosshair && (
        <View pointerEvents="none" style={styles.crosshair}>
          <View style={styles.crossDot} />
        </View>
      )}
    </View>
  );
}


