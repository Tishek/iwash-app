import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { returnMarkerStyle } from './helpers';
const ClusteredMarker = ({ geometry, properties, onPress, clusterColor, clusterTextColor, clusterFontFamily, tracksViewChanges = false, }) => {
    const points = properties.point_count;
    const { width, height, fontSize, size } = returnMarkerStyle(points);
    return (<Marker coordinate={{
            longitude: geometry.coordinates[0],
            latitude: geometry.coordinates[1],
        }} style={{ zIndex: points + 1 }} onPress={onPress} tracksViewChanges={tracksViewChanges}>
      <View style={[styles.container, { width, height }]}>
        <View style={[
            styles.wrapper,
            {
                backgroundColor: clusterColor,
                width,
                height,
                borderRadius: width / 2,
            },
        ]}/>
        <View style={[
            styles.cluster,
            {
                backgroundColor: clusterColor,
                width: size,
                height: size,
                borderRadius: size / 2,
            },
        ]}>
          <Text style={[
            styles.text,
            {
                color: clusterTextColor,
                fontSize,
                fontFamily: clusterFontFamily,
            },
        ]}>
            {points}
          </Text>
        </View>
      </View>
    </Marker>);
};
const styles = StyleSheet.create({
    container: { justifyContent: 'center', alignItems: 'center' },
    wrapper: { position: 'absolute', opacity: 0.5, zIndex: 0 },
    cluster: { justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    text: { fontWeight: 'bold' },
});
export default memo(ClusteredMarker);
