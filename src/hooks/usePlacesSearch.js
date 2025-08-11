import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchNearbyCarWashes } from '../services/places';

export function usePlacesSearch({ t, API_KEY, settings, coords, radiusM, searchCenter, autoReload }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const autoReloadTimerRef = useRef(null);

  const searchHere = useCallback(async (searchCenter, onBeforeExpand) => {
    if (!API_KEY) {
      Alert.alert(t('common.missingKeyTitle'), t('common.missingKeyBody'));
      return;
    }
    if (!searchCenter) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      setLastError(null);

      const items = await fetchNearbyCarWashes({ searchCenter, radiusM });
      setPlaces(items);

      const focusCoord = (settings.searchFrom === 'myLocation' && coords)
        ? coords
        : { latitude: searchCenter.latitude, longitude: searchCenter.longitude };

      onBeforeExpand?.(focusCoord);
    } catch (e) {
      setLastError(String(e.message || e));
      Alert.alert(t('common.loadErrorTitle'), String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [API_KEY, t, settings?.searchFrom, coords, radiusM]);

  // auto reload on dependencies changes
  useEffect(() => {
    if (!autoReload) return;
    if (!searchCenter) return;
    if (!API_KEY) return;
    if (autoReloadTimerRef.current) clearTimeout(autoReloadTimerRef.current);
    autoReloadTimerRef.current = setTimeout(() => {
      if (!loading) searchHere(searchCenter);
    }, 550);
    return () => {
      if (autoReloadTimerRef.current) clearTimeout(autoReloadTimerRef.current);
    };
  }, [autoReload, searchCenter?.latitude, searchCenter?.longitude, radiusM, API_KEY, loading, searchHere]);

  return { places, setPlaces, loading, lastError, setLastError, autoReloadTimerRef, searchHere };
}


