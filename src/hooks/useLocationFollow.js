import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export function useLocationFollow({ animateToRegionSafe, initialRegionFallback }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [region, setRegion] = useState(null);
  const [coords, setCoords] = useState(null);
  const [followMe, setFollowMe] = useState(true);

  const locSubRef = useRef(null);
  const followRef = useRef(followMe);
  const animateToRegionSafeRef = useRef(animateToRegionSafe);
  const initialRegionFallbackRef = useRef(initialRegionFallback);
  const hasInitializedRef = useRef(false);
  
  // Update refs when props change
  followRef.current = followMe;
  animateToRegionSafeRef.current = animateToRegionSafe;
  initialRegionFallbackRef.current = initialRegionFallback;

  // Permissions + initial position
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        setRegion(initialRegionFallbackRef.current);
        hasInitializedRef.current = true;
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(next);
      setRegion({ ...next, latitudeDelta: 0.03, longitudeDelta: 0.03 });
      hasInitializedRef.current = true;
    })();
  }, []);

  // Live updates
  useEffect(() => {
    let sub = null;
    (async () => {
      if (!hasPermission) return;
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
          (loc) => {
            const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setCoords(next);
            if (followRef.current && typeof animateToRegionSafeRef.current === 'function') {
              animateToRegionSafeRef.current({
                ...next,
                latitudeDelta: region?.latitudeDelta ?? 0.02,
                longitudeDelta: region?.longitudeDelta ?? 0.02,
              }, 350);
            }
          }
        );
        locSubRef.current = sub;
      } catch {}
    })();
    return () => {
      try { sub?.remove?.(); } catch {}
      locSubRef.current = null;
    };
  }, [hasPermission, region?.latitudeDelta, region?.longitudeDelta]);

  const disableFollow = () => { followRef.current = false; setFollowMe(false); };

  const recenter = () => {
    setFollowMe(true);
    if (coords && typeof animateToRegionSafeRef.current === 'function') {
      animateToRegionSafeRef.current({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 450);
    }
  };

  return { hasPermission, region, setRegion, coords, followMe, setFollowMe, disableFollow, recenter };
}


