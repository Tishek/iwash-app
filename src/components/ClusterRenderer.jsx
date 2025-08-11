import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

export default function ClusterRenderer({
  cluster,
  disableFollow,
  getClusterEdgePadding,
  collectCoordsFromBBox,
  progressiveClusterZoom,
  region,
  regionRef,
  clusterRadiusPx,
  makeClusterPressHandler,
  styles,
  log,
}) {
  const { id, geometry, properties } = cluster || {};
  const [lng, lat] = geometry?.coordinates || [];
  const center = (typeof lat === 'number' && typeof lng === 'number')
    ? { latitude: lat, longitude: lng }
    : null;
  const count = properties?.point_count ?? 0;
  const clusterId = properties?.cluster_id ?? id;

  const onPress = async () => {
    disableFollow();
    try { Haptics.selectionAsync(); } catch {}
    const handler = makeClusterPressHandler({
      center,
      clusterId,
      getClusterEdgePadding,
      collectCoordsFromBBox: (c) => collectCoordsFromBBox(c),
      progressiveClusterZoom: (c) => progressiveClusterZoom(c),
      region,
      regionRef,
      clusterRadiusPx,
      log,
    });
    await handler();
  };

  return (
    <Marker
      key={`cluster-${clusterId}`}
      coordinate={center || { latitude: 0, longitude: 0 }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.clusterWrap}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </Marker>
  );
}


