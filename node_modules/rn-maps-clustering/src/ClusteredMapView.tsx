import React, {
  memo,
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { LayoutAnimation, Platform, useWindowDimensions } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import type { MapViewProps, Region, LatLng } from 'react-native-maps';
import SuperCluster from 'supercluster';
import ClusteredMarker from './ClusteredMarker';
import {
  isMarker,
  markerToGeoJSONFeature,
  calculateBBox,
  returnMapZoom,
  generateSpiral,
} from './helpers';
import type { InputPointFeature, ClusterFeature, PointFeature } from './types';

export interface ClusteredMapViewProps extends MapViewProps {
  children: React.ReactNode;
  clusteringEnabled?: boolean;
  tracksViewChanges?: boolean;
  radius?: number;
  maxZoom?: number;
  minZoom?: number;
  minPoints?: number;
  extent?: number;
  nodeSize?: number;
  spiralEnabled?: boolean;
  spiderfyOnMaxZoom?: boolean;
  clusterColor?: string;
  clusterTextColor?: string;
  clusterFontFamily?: string;
  spiderLineColor?: string;
  renderCluster?: (
    cluster: ClusterFeature,
    onPress: () => void
  ) => React.ReactNode;
  onClusterPress?: (cluster: ClusterFeature, markers?: PointFeature[]) => void;
  animationEnabled?: boolean;
  edgePadding?: { top: number; left: number; right: number; bottom: number };
}

const ClusteredMapView = forwardRef<MapView, ClusteredMapViewProps>(
  (
    {
      clusteringEnabled = true,
      spiralEnabled = true,
      spiderfyOnMaxZoom = true,
      animationEnabled = true,
      radius = 40,
      maxZoom = 20,
      minZoom = 1,
      minPoints = 2,
      extent = 512,
      nodeSize = 64,
      clusterColor = '#00B386',
      clusterTextColor = '#FFFFFF',
      clusterFontFamily,
      spiderLineColor = '#FF0000',
      edgePadding = { top: 50, left: 50, right: 50, bottom: 50 },
      children,
      onRegionChangeComplete,
      onClusterPress,
      renderCluster,
      tracksViewChanges,
      ...restProps
    },
    ref
  ) => {
    const [markers, setMarkers] = useState<(ClusterFeature | PointFeature)[]>(
      []
    );
    const [spiderMarkers, setSpiderMarkers] = useState<
      ReturnType<typeof generateSpiral>
    >([]);
    const [otherChildren, setOtherChildren] = useState<React.ReactNode[]>([]);

    const clustererRef = useRef<SuperCluster<any, any> | null>(null);
    const mapRef = useRef<MapView>(null);
    const { width } = useWindowDimensions();

    useImperativeHandle(ref, () => mapRef.current!, []);

    const memoizedChildren = useMemo(
      () => React.Children.toArray(children),
      [children]
    );

    const handleRegionChange = useCallback(
      (region: Region) => {
        if (clustererRef.current) {
          const bbox = calculateBBox(region);
          const zoom = returnMapZoom(region, width);
          const newMarkers = clustererRef.current.getClusters(bbox, zoom);

          if (animationEnabled && Platform.OS === 'ios')
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

          setMarkers(newMarkers);

          if (spiralEnabled && spiderfyOnMaxZoom && zoom >= maxZoom) {
            const newSpiderMarkers = newMarkers.flatMap((marker) => {
              if ('cluster' in marker.properties) {
                const leaves = clustererRef.current!.getLeaves(
                  marker.properties.cluster_id,
                  Infinity
                );
                return generateSpiral(
                  marker as ClusterFeature,
                  leaves as PointFeature[]
                );
              }
              return [];
            });
            setSpiderMarkers(newSpiderMarkers);
          } else {
            setSpiderMarkers([]);
          }

          onRegionChangeComplete?.(region, { isGesture: false });
        } else {
          onRegionChangeComplete?.(region, { isGesture: false });
        }
      },
      [
        animationEnabled,
        spiralEnabled,
        spiderfyOnMaxZoom,
        maxZoom,
        onRegionChangeComplete,
        width,
      ]
    );

    useEffect(() => {
      if (!clusteringEnabled) {
        setMarkers([]);
        setSpiderMarkers([]);
        setOtherChildren(memoizedChildren);
        clustererRef.current = null;
        return;
      }

      const markerData: InputPointFeature[] = [];
      const nonMarkerChildren: React.ReactNode[] = [];

      memoizedChildren.forEach((child, index) => {
        if (isMarker(child)) {
          markerData.push(markerToGeoJSONFeature(child, index));
        } else {
          nonMarkerChildren.push(child);
        }
      });

      clustererRef.current = new SuperCluster({
        radius,
        maxZoom,
        minZoom,
        minPoints,
        extent,
        nodeSize,
      });
      clustererRef.current.load(markerData);
      setOtherChildren(nonMarkerChildren);

      const initialRegion = restProps.region || restProps.initialRegion;
      if (initialRegion) handleRegionChange(initialRegion as Region);
    }, [
      memoizedChildren,
      clusteringEnabled,
      radius,
      maxZoom,
      minZoom,
      minPoints,
      extent,
      nodeSize,
      restProps.region,
      restProps.initialRegion,
      handleRegionChange,
    ]);

    const handleClusterPress = useCallback(
      (cluster: ClusterFeature) => {
        if (!clustererRef.current) return;

        const leaves = clustererRef.current.getLeaves(
          cluster.properties.cluster_id,
          Infinity
        ) as PointFeature[];
        onClusterPress?.(cluster, leaves);

        const coordinates: LatLng[] = leaves.map((leaf) => ({
          latitude: leaf.geometry.coordinates[1],
          longitude: leaf.geometry.coordinates[0],
        }));
        mapRef.current?.fitToCoordinates(coordinates, { edgePadding });
      },
      [onClusterPress, edgePadding]
    );

    return (
      <MapView
        {...restProps}
        ref={mapRef}
        onRegionChangeComplete={handleRegionChange}
      >
        {markers.map((marker) => {
          if ('cluster' in marker.properties) {
            const cluster = marker as ClusterFeature;
            const onPress = () => handleClusterPress(cluster);
            return renderCluster ? (
              renderCluster(cluster, onPress)
            ) : (
              <ClusteredMarker
                key={`cluster-${cluster.id}`}
                {...cluster}
                onPress={onPress}
                clusterColor={clusterColor}
                clusterTextColor={clusterTextColor}
                clusterFontFamily={clusterFontFamily}
                tracksViewChanges={tracksViewChanges}
              />
            );
          }
          const point = marker as PointFeature;
          const originalMarker = memoizedChildren[
            point.properties.index
          ] as React.ReactElement;
          return spiderMarkers.length > 0
            ? null
            : React.cloneElement(originalMarker, {
                key: `marker-${point.properties.index}`,
              });
        })}
        {otherChildren}
        {spiderMarkers.map((marker) => {
          const spiderfiedMarker = memoizedChildren[
            marker.index
          ] as React.ReactElement<any>;
          return (
            <React.Fragment key={`spider-${marker.index}`}>
              <Polyline
                coordinates={[
                  marker.centerPoint,
                  { latitude: marker.latitude, longitude: marker.longitude },
                ]}
                strokeColor={spiderLineColor}
                strokeWidth={1}
              />
              {React.cloneElement(spiderfiedMarker, {
                coordinate: {
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                },
              })}
            </React.Fragment>
          );
        })}
      </MapView>
    );
  }
);

export default memo(ClusteredMapView);
