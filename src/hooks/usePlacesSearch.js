import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchNearbyCarWashes } from '../services/places';

export function usePlacesSearch({ t, API_KEY, settings, coords, radiusM, searchCenter, autoReload }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const autoReloadTimerRef = useRef(null);

  // Diagnostics: confirm that API key is present (boolean only)
  useEffect(() => {
    try {
      console.log('[usePlacesSearch] hasKey:', Boolean(API_KEY));
    } catch {}
  }, [API_KEY]);

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

      // Diagnostics: what we are about to fetch
      try {
        console.log('[usePlacesSearch] searchHere →', {
          lat: searchCenter.latitude,
          lng: searchCenter.longitude,
          radiusM,
          hasKey: Boolean(API_KEY),
        });
      } catch {}

      const items = await fetchNearbyCarWashes({ searchCenter, radiusM });
      setPlaces(items);

      const focusCoord = (settings.searchFrom === 'myLocation' && coords)
        ? coords
        : { latitude: searchCenter.latitude, longitude: searchCenter.longitude };

      onBeforeExpand?.(focusCoord);
    } catch (e) {
      const msg = String(e?.message || e);
      setLastError(msg);
      try { console.warn('[usePlacesSearch] search error →', msg); } catch {}
      Alert.alert(t('common.loadErrorTitle'), msg);
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
      try { console.log('[usePlacesSearch] autoReload tick'); } catch {}
      if (!loading) searchHere(searchCenter);
    }, 550);
    return () => {
      if (autoReloadTimerRef.current) clearTimeout(autoReloadTimerRef.current);
    };
  }, [autoReload, searchCenter?.latitude, searchCenter?.longitude, radiusM, API_KEY, loading, searchHere]);

  return { places, setPlaces, loading, lastError, setLastError, autoReloadTimerRef, searchHere };
}
