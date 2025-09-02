// src/hooks/usePlacesSearch.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchNearbyCarWashes } from '../services/places';
import { DEV_INFO } from '../utils/devlog';
import { GOOGLE_MAPS_API_KEY } from '../utils/config';
import { CACHE_ENABLED, CACHE_TTL_MS } from '../utils/constants';
import { makeCacheKey, readCache, writeCache, isFresh } from '../utils/cache';

/**
 * Stráž proti fetchi během animace:
 * - přidej do parentu stav `isSheetAnimating` (viz BottomSheetContainer onSnapStart/onSnapEnd)
 * - sem ho předej v parametru hooku
 */
export function usePlacesSearch({
  t,
  settings,
  coords,
  radiusM,
  searchCenter,
  autoReload,
  isSheetAnimating, // ← true během snapování listu
}) {
  const apiKey = GOOGLE_MAPS_API_KEY;
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [cacheTs, setCacheTs] = useState(null);

  const autoReloadTimerRef = useRef(null);
  const deferTimerRef = useRef(null);

  const clearTimers = () => {
    if (autoReloadTimerRef.current) {
      clearTimeout(autoReloadTimerRef.current);
      autoReloadTimerRef.current = null;
    }
    if (deferTimerRef.current) {
      clearTimeout(deferTimerRef.current);
      deferTimerRef.current = null;
    }
  };

  const searchHere = useCallback(
    async (center, onBeforeExpand) => {
      const effectiveCenter = center ?? searchCenter;

      // ⛔ Guard: během animace listu nefetchuj
      if (isSheetAnimating) {
        if (!deferTimerRef.current) {
          deferTimerRef.current = setTimeout(() => {
            deferTimerRef.current = null;
            if (!isSheetAnimating && effectiveCenter) {
              searchHere(effectiveCenter, onBeforeExpand);
            }
          }, 220);
        }
        return;
      }

      if (!effectiveCenter) return;

      // ⚡ Přednačti z cache (hydratuj UI rychle)
      let hydratedFromCache = false;
      const cacheEnabled = CACHE_ENABLED && (settings?.useCache ?? true);
      const ttlMs = Math.max(60 * 1000, (settings?.cacheTtlMin ?? (CACHE_TTL_MS / 60000)) * 60000);
      if (cacheEnabled) {
        try {
          const key = makeCacheKey(effectiveCenter, radiusM);
          const cached = await readCache(key);
          if (cached && isFresh(cached, ttlMs)) {
            setPlaces(cached.items || []);
            hydratedFromCache = true;
            setFromCache(true);
            setCacheTs(cached.ts || Date.now());
          }
        } catch {}
      }

      // Pokud chybí API key, ukonči po případné hydrataci z cache
      if (!apiKey) {
        if (!hydratedFromCache) {
          Alert.alert(t('common.missingKeyTitle'), t('common.missingKeyBody'));
          console.warn('[places] Missing Google Maps API key');
        }
        return;
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        setLastError(null);

        const items = await fetchNearbyCarWashes({
          searchCenter: effectiveCenter,
          radiusM,
          apiKey,
        });
        setPlaces(items);
        setFromCache(false);
        setCacheTs(null);
        // Zapiš do cache (ALL výsledky; filtry se aplikují v další vrstvě)
        if (cacheEnabled) {
          try {
            const key = makeCacheKey(effectiveCenter, radiusM);
            await writeCache(key, { items, ts: Date.now(), meta: { radiusM } });
          } catch {}
        }

        DEV_INFO('[places] fetched', items.length);

        const focusCoord =
          settings.searchFrom === 'myLocation' && coords
            ? coords
            : {
                latitude: effectiveCenter.latitude,
                longitude: effectiveCenter.longitude,
              };

        // Parent může po dokončení fetch → expandovat list a posunout mapu
         if (typeof onBeforeExpand === 'function') {
         try {
           onBeforeExpand(focusCoord);
         } catch (err) {
           // Neshoď vyhledávání kvůli UI chybě; jen zaloguj
           console.warn('[places] onBeforeExpand failed:', String(err?.message ?? err));
           DEV_INFO('[places] onBeforeExpand error:', String(err?.message ?? err));
         }
         }
      } catch (e) {
        const msg = String(e?.message ?? e);
        setLastError(msg);
        if (!hydratedFromCache) {
          Alert.alert(t('common.loadErrorTitle'), msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      apiKey,
      t,
      settings?.searchFrom,
      coords,
      radiusM,
      searchCenter,
      isSheetAnimating,
    ]
  );

  // 🔁 Auto-reload při změně deps
  useEffect(() => {
    if (!autoReload) return;
    if (!searchCenter) return;
    if (!apiKey) return;

    clearTimers();

    if (isSheetAnimating) {
      autoReloadTimerRef.current = setTimeout(() => {
        if (!isSheetAnimating && !loading) {
          searchHere(searchCenter);
        }
      }, 250);
      return () => clearTimers();
    }

    autoReloadTimerRef.current = setTimeout(() => {
      if (!loading) searchHere(searchCenter);
    }, 550);

    return () => clearTimers();
  }, [
    autoReload,
    searchCenter?.latitude,
    searchCenter?.longitude,
    radiusM,
    apiKey,
    loading,
    searchHere,
    isSheetAnimating,
  ]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    DEV_INFO(
      '[places] Loaded API key ends with:',
      apiKey ? String(apiKey).slice(-6) : 'MISSING'
    );
  }, [apiKey]);

  return {
    places,
    setPlaces,
    loading,
    lastError,
    setLastError,
    autoReloadTimerRef,
    searchHere,
    fromCache,
    cacheTs,
  };
}
