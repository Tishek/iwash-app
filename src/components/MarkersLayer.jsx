import React from 'react';
import { Marker } from 'react-native-maps';
import MarkerPin from './MarkerPin';
import MeMarker from './MeMarker';

export default function MarkersLayer({
  filteredPlaces,
  selectedId,
  onMarkerPress,
  getPinScale,
  isFav,
  coords,
  ringScale,
  ringOpacity,
  styles,
}) {
  return (
    <>
      {filteredPlaces.map((p) => {
        const scale = getPinScale(p.id);
        const color = (
          p.inferredType === 'NONCONTACT' ? '#2E90FA' :
          p.inferredType === 'FULLSERVICE' ? '#12B76A' :
          p.inferredType === 'CONTACT' ? '#111' :
          '#6B7280'
        );
        return (
          <Marker
            key={p.id}
            coordinate={p.location}
            onPress={() => onMarkerPress(p)}
            tracksViewChanges={false}
            zIndex={selectedId === p.id ? 999 : 1}
            cluster={selectedId === p.id ? false : true}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MarkerPin selected={selectedId === p.id} color={color} scale={scale} fav={isFav(p.id)} />
          </Marker>
        );
      })}

      <MeMarker coords={coords} ringScale={ringScale} ringOpacity={ringOpacity} styles={styles} />
    </>
  );
}


