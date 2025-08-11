import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';

export default function MapViewClustered({
  mapRef,
  region,
  onRegionChangeComplete,
  onPanDrag,
  clusterRadiusPx,
  renderCluster,
  renderMarkers,
  searchCenter,
  radiusM,
}) {
  if (!region) return null;
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
      radius={clusterRadiusPx}
      extent={256}
      clusterColor="#111"
      clusterTextColor="#fff"
      renderCluster={renderCluster}
    >
      {searchCenter && (
        <Circle
          center={searchCenter}
          radius={radiusM}
          strokeWidth={2}
          strokeColor="rgba(56,116,255,0.7)"
          fillColor="rgba(56,116,255,0.12)"
        />
      )}

      {renderMarkers?.()}
    </ClusteredMapView>
  );
}


