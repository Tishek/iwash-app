import React from 'react';
import { Marker } from 'react-native-maps';
import MarkerPin from './MarkerPin';
import MeMarker from './MeMarker';
import { DEV_LOG, DEV_WARN, DEV_ERROR } from '../utils/devlog';

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
  // Debug logging without setTimeout to avoid render issues
  React.useEffect(() => {
    DEV_LOG('[markers] rendering', filteredPlaces?.length || 0, 'items');
    if (filteredPlaces?.[0]) {
      DEV_LOG('[markers] first item', filteredPlaces[0].name, filteredPlaces[0].location);
    }
  }, [filteredPlaces]);

  const validPlaces = React.useMemo(() => {
    // Ensure filteredPlaces is an array
    if (!Array.isArray(filteredPlaces)) {
      DEV_WARN('[markers] filteredPlaces is not an array:', filteredPlaces);
      return [];
    }

    const places = filteredPlaces.filter(p => {
      // Ensure place object exists and is not null/undefined
      if (!p || typeof p !== 'object' || p === null) {
        DEV_WARN('[markers] Invalid place object:', p);
        return false;
      }

      // Ensure place has required properties
      if (!p.id || typeof p.id !== 'string') {
        DEV_WARN('[markers] Place missing valid id:', p);
        return false;
      }

      // Ensure location exists and has valid coordinates
      const loc = p?.location;
      if (!loc || typeof loc !== 'object' || loc === null) {
        DEV_WARN('[markers] Place missing location object:', p.name || p.id);
        return false;
      }

      const { latitude, longitude } = loc;
      const isValid = typeof latitude === 'number' && 
                     typeof longitude === 'number' && 
                     !isNaN(latitude) && 
                     !isNaN(longitude) &&
                     isFinite(latitude) &&
                     isFinite(longitude) &&
                     latitude >= -90 && latitude <= 90 &&
                     longitude >= -180 && longitude <= 180;
      
      if (!isValid) {
        DEV_WARN('[markers] Invalid place coordinates:', p.name || p.id, loc);
      }
      return isValid;
    });

    DEV_LOG('[markers] Valid places after filtering:', places.length);
    return places;
  }, [filteredPlaces]);

  // Cache poslední render, aby při krátkém re-renderu (např. při změně filtru)
  // nemizely všechny piny na 1 frame
  const lastMarkersRef = React.useRef([]);

  // 🛠️ VRACÍME PŘÍMO POLE Markerů s error boundary protection
  const markers = React.useMemo(() => {
    try {
      const markerComponents = [];
      
      // Process place markers with additional safety
      for (let i = 0; i < validPlaces.length; i++) {
        const p = validPlaces[i];
        
        // Additional safety checks (should not be needed due to validPlaces filter, but extra safety)
        if (!p || !p.id || typeof p.id !== 'string') {
          console.warn('[markers] Place missing valid id in markers generation:', p);
          continue;
        }

        const loc = p.location;
        if (!loc || typeof loc !== 'object') {
          console.warn('[markers] Place missing location in markers generation:', p.id);
          continue;
        }

        const { latitude, longitude } = loc;

        // Double-check coordinates are still valid (should be from validPlaces filter)
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
            isNaN(latitude) || isNaN(longitude) || 
            !isFinite(latitude) || !isFinite(longitude)) {
          console.warn('[markers] Invalid coordinates in valid place:', p.id, loc);
          continue;
        }

        // Validate scale function result
        let scale = 1;
        try {
          if (typeof getPinScale === 'function') {
            const scaleResult = getPinScale(p.id);
            scale = (typeof scaleResult === 'number' && isFinite(scaleResult)) ? scaleResult : 1;
          }
        } catch (error) {
          DEV_WARN('[markers] Error getting pin scale for', p.id, error);
          scale = 1;
        }

        const color =
          p.inferredType === 'NONCONTACT'   ? '#2E90FA' :
          p.inferredType === 'FULLSERVICE'  ? '#12B76A' :
          p.inferredType === 'CONTACT'      ? '#111'    :
                                              '#6B7280';

        const isSelected = selectedId === p.id;

        DEV_LOG(`[markers] Rendering marker ${p.id} at ${latitude}, ${longitude}`);

        try {
          const marker = (
            <Marker
              key={`place-${p.id}`} // More specific key to avoid conflicts
              coordinate={{ latitude, longitude }}
              onPress={() => {
                try {
                  if (typeof onMarkerPress === 'function') {
                    onMarkerPress(p);
                  }
                } catch (error) {
                  DEV_ERROR('[markers] Error in onMarkerPress:', error);
                }
              }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={isSelected ? 999 : 1}
              title={p.name || 'Unknown Place'}
              description={`${p.inferredType || 'UNKNOWN'} - ${latitude}, ${longitude}`}
            >
              <MarkerPin
                selected={isSelected}
                color={color}
                scale={scale}
                fav={typeof isFav === 'function' ? isFav(p.id) : false}
              />
            </Marker>
          );
          
          markerComponents.push(marker);
        } catch (error) {
          DEV_ERROR('[markers] Error creating marker for', p.id, error);
        }
      }

      // Přidáme i MeMarker pokud existuje
      if (coords && 
          typeof coords === 'object' && 
          typeof coords.latitude === 'number' && 
          typeof coords.longitude === 'number' &&
          isFinite(coords.latitude) && 
          isFinite(coords.longitude)) {
        try {
          markerComponents.push(
            <MeMarker
              key="me-marker"
              coords={coords}
              ringScale={ringScale}
              ringOpacity={ringOpacity}
              styles={styles}
            />
          );
        } catch (error) {
          DEV_ERROR('[markers] Error creating MeMarker:', error);
        }
      }

      DEV_LOG(`[markers] Successfully created ${markerComponents.length} markers`);
      if (markerComponents.length > 0) lastMarkersRef.current = markerComponents;
      return markerComponents.length > 0 ? markerComponents : lastMarkersRef.current;
    } catch (error) {
      DEV_ERROR('[markers] Critical error in markers generation:', error);
      return [];
    }
  }, [validPlaces, selectedId, getPinScale, isFav, coords, ringScale, ringOpacity, styles, onMarkerPress]);

  // Ensure we return a valid React element or null
  if (!markers || markers.length === 0) {
    DEV_LOG('[markers] No markers to render');
    return null;
  }
  
  DEV_LOG(`[markers] Returning ${markers.length} markers`);
  // Return markers as Fragment for React compatibility
  return <>{markers}</>;
}
