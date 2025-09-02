import { useMemo, useState } from 'react';
import { distanceMeters } from '../utils/geo';

export function useFilteredPlaces({ places, filterMode, isFav, favoritesData, searchCenter }) {
  const [selectedId, setSelectedId] = useState(null);

  const filteredPlaces = useMemo(() => {
    if (filterMode === 'ALL') return places;
    if (filterMode === 'FAV') {
      const inRadius = places.filter(p => isFav(p.id));
      const stored = Object.values(favoritesData || {});
      const extra = stored
        .filter(s => !inRadius.some(ir => ir.id === s.id))
        .map(s => ({
          ...s,
          distanceM: searchCenter ? Math.round(distanceMeters(searchCenter, s.location)) : (s.distanceM ?? Number.MAX_SAFE_INTEGER),
        }));
      return [...inRadius, ...extra].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
    }
    return places.filter(p => p.inferredType === filterMode);
  }, [places, filterMode, favoritesData, isFav, searchCenter]);

  const idToIndex = useMemo(() => {
    const m = {};
    filteredPlaces.forEach((p, i) => { m[p.id] = i; });
    return m;
  }, [filteredPlaces]);

  return { filteredPlaces, selectedId, setSelectedId, idToIndex };
}


