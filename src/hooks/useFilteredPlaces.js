import { useMemo, useRef, useState } from 'react';
import { DEV_ERROR, DEV_WARN } from '../utils/devlog';
import { distanceMeters } from '../utils/geo';

export function useFilteredPlaces({ places, filterMode, isFav, favoritesData, searchCenter }) {
  const [selectedId, setSelectedId] = useState(null);

  const lastRef = useRef([]);
  const filteredPlaces = useMemo(() => {
    try {
      if (!Array.isArray(places)) return lastRef.current || [];
      DEV_WARN('[filters] rebuild', filterMode, 'places:', places.length);
      if (filterMode === 'ALL') {
        lastRef.current = places;
        return places;
      }
      if (filterMode === 'FAV') {
        const inRadius = places.filter(p => isFav(p.id));
        const stored = Object.values(favoritesData || {});
        const extra = stored
          .filter(s => !inRadius.some(ir => ir.id === s.id))
          .map(s => ({
            ...s,
            distanceM: searchCenter ? Math.round(distanceMeters(searchCenter, s.location)) : (s.distanceM ?? Number.MAX_SAFE_INTEGER),
          }));
        const combined = [...inRadius, ...extra].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
        lastRef.current = combined;
        return combined;
      }
      const out = places.filter(p => p && p.inferredType === filterMode);
      DEV_WARN('[filters] result length:', out.length);
      lastRef.current = out;
      return out;
    } catch (e) {
      DEV_ERROR('[filters] building filteredPlaces failed:', e);
      return lastRef.current || [];
    }
  }, [places, filterMode, favoritesData, isFav, searchCenter]);

  const idToIndex = useMemo(() => {
    const m = {};
    filteredPlaces.forEach((p, i) => { m[p.id] = i; });
    return m;
  }, [filteredPlaces]);

  return { filteredPlaces, selectedId, setSelectedId, idToIndex };
}
