import React from 'react';
import { View, Animated } from 'react-native';
import { Marker } from 'react-native-maps';

export default function MeMarker({ coords, ringScale, ringOpacity, styles }) {
  if (!coords) return null;
  return (
    <Marker
      coordinate={coords}
      cluster={false}
      zIndex={9999}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={styles.meContainer}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <View style={styles.meDotShadow}><View style={styles.meDot} /></View>
      </View>
    </Marker>
  );
}


