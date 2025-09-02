import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAVORITES_KEY, FAVORITES_DATA_KEY, MAX_FAVORITES } from '../utils/constants';

export function useFavorites() {
  const [favorites, setFavorites] = useState({});      // { [place_id]: true }
  const [favoritesData, setFavoritesData] = useState({}); // { [id]: snapshot }

  const I18N = {
    cs: {
      favLimitTitle: 'Limit oblíbených',
      favLimitMsg: `Můžeš mít maximálně ${MAX_FAVORITES} oblíbené položky.`,
    },
    en: {
      favLimitTitle: 'Favorites limit',
      favLimitMsg: `You can have a maximum of ${MAX_FAVORITES} favorite items.`,
    },
  };

  // Load favorites
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // Load cached data of favorites
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_DATA_KEY);
        if (raw) setFavoritesData(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const isFav = (id) => !!favorites[id];

  const toggleFav = (item, langKey = 'cs') => {
    setFavorites(prev => {
      const exists = !!prev[item.id];

      // If adding a new favorite, enforce the limit
      if (!exists) {
        const currentCount = Object.keys(prev).length;
        if (currentCount >= MAX_FAVORITES) {
          try {
            const { favLimitTitle, favLimitMsg } = I18N[langKey === 'en' ? 'en' : 'cs'];
            Alert.alert(favLimitTitle, favLimitMsg);
          } catch {}
          return prev; // do not change state
        }
      }

      const next = { ...prev };
      if (exists) {
        delete next[item.id];
      } else {
        next[item.id] = true;
      }

      // Persist favorites map
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});

      // Keep the cached snapshot in sync
      setFavoritesData(prevData => {
        const dataNext = { ...prevData };
        if (exists) {
          delete dataNext[item.id];
        } else {
          dataNext[item.id] = {
            id: item.id,
            name: item.name,
            address: item.address,
            location: item.location,
            inferredType: item.inferredType,
            rating: item.rating,
            userRatingsTotal: item.userRatingsTotal ?? 0,
            openNow: (typeof item.openNow === 'boolean') ? item.openNow : null,
            distanceM: item.distanceM ?? null,
          };
        }
        AsyncStorage.setItem(FAVORITES_DATA_KEY, JSON.stringify(dataNext)).catch(() => {});
        return dataNext;
      });

      return next;
    });
  };

  return { favorites, favoritesData, isFav, toggleFav };
}