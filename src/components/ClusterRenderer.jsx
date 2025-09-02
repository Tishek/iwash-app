import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

// Error boundary component for cluster rendering
class ClusterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error('[ClusterErrorBoundary] Caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ClusterErrorBoundary] Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Don't render anything if there's an error
    }

    return this.props.children;
  }
}

export default function ClusterRenderer({
  cluster,
  onPress: onPressFromLib,
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
  // Validate cluster object
  if (!cluster || typeof cluster !== 'object' || cluster === null) {
    console.warn('[ClusterRenderer] Invalid cluster object:', cluster);
    return null;
  }

  const { id, geometry, properties } = cluster;
  
  // Validate geometry
  if (!geometry || typeof geometry !== 'object' || geometry === null) {
    console.warn('[ClusterRenderer] Missing geometry object:', geometry);
    return null;
  }

  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    console.warn('[ClusterRenderer] Invalid cluster geometry coordinates:', geometry);
    return null;
  }

  const [lng, lat] = geometry.coordinates;
  
  // Validate coordinates with more comprehensive checks
  if (typeof lat !== 'number' || typeof lng !== 'number' || 
      isNaN(lat) || isNaN(lng) ||
      !isFinite(lat) || !isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn('[ClusterRenderer] Invalid cluster coordinates:', { lat, lng });
    return null;
  }

  const center = { latitude: lat, longitude: lng };
  
  // Validate properties
  if (!properties || typeof properties !== 'object') {
    console.warn('[ClusterRenderer] Invalid properties object:', properties);
    return null;
  }

  const count = properties.point_count ?? 0;
  const clusterId = properties.cluster_id ?? id;

  // Ensure count is a valid number
  if (typeof count !== 'number' || isNaN(count) || count < 0) {
    console.warn('[ClusterRenderer] Invalid point count:', count);
    return null;
  }

  // Ensure count is reasonable (prevent potential overflow issues)
  const safeCount = Math.min(count, 9999);

  const onPress = React.useCallback(async () => {
    try {
      // Použijeme onPress callback z knihovny, pokud existuje
      if (onPressFromLib && typeof onPressFromLib === 'function') {
        try { 
          await Haptics.selectionAsync(); 
        } catch (error) {
          console.warn('[ClusterRenderer] Haptics error:', error);
        }
        onPressFromLib();
        return;
      }
      
      // Fallback na vlastní implementaci
      if (typeof disableFollow === 'function') {
        disableFollow();
      }
      
      try { 
        await Haptics.selectionAsync(); 
      } catch (error) {
        console.warn('[ClusterRenderer] Haptics error:', error);
      }

      if (typeof makeClusterPressHandler === 'function') {
        const handler = makeClusterPressHandler({
          center,
          clusterId,
          getClusterEdgePadding,
          collectCoordsFromBBox,
          progressiveClusterZoom,
          region,
          regionRef,
          clusterRadiusPx,
          log,
        });

        if (typeof handler === 'function') {
          await handler();
        }
      }
    } catch (error) {
      console.error('[ClusterRenderer] Error in onPress handler:', error);
    }
  }, [onPressFromLib, disableFollow, makeClusterPressHandler, center, clusterId, getClusterEdgePadding, collectCoordsFromBBox, progressiveClusterZoom, region, regionRef, clusterRadiusPx, log]);

  // Validate styles with fallback
  const safeStyles = React.useMemo(() => {
    if (!styles || typeof styles !== 'object' || styles === null) {
      console.warn('[ClusterRenderer] Invalid styles object, using fallback:', styles);
      return {
        clusterWrap: {
          backgroundColor: '#111',
          borderRadius: 20,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        clusterText: {
          color: '#fff',
          fontSize: 14,
          fontWeight: 'bold',
        }
      };
    }

    // Validate required style properties
    if (!styles.clusterWrap || !styles.clusterText) {
      console.warn('[ClusterRenderer] Missing required styles (clusterWrap, clusterText), using fallback:', styles);
      return {
        clusterWrap: styles.clusterWrap || {
          backgroundColor: '#111',
          borderRadius: 20,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        clusterText: styles.clusterText || {
          color: '#fff',
          fontSize: 14,
          fontWeight: 'bold',
        }
      };
    }

    return styles;
  }, [styles]);

  try {
    return (
      <ClusterErrorBoundary>
        <Marker
          key={`cluster-${clusterId || 'unknown'}-${safeCount}`} // Include count in key for uniqueness
          coordinate={center}
          onPress={onPress}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }} // Center anchor for clusters
          zIndex={1000} // High z-index for clusters
        >
          <View style={safeStyles.clusterWrap}>
            <Text style={safeStyles.clusterText}>{safeCount}</Text>
          </View>
        </Marker>
      </ClusterErrorBoundary>
    );
  } catch (error) {
    console.error('[ClusterRenderer] Error creating cluster marker:', error);
    return null;
  }
}