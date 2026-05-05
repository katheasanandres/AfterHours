/**
 * useLocation.js
 *
 * Watches the user's GPS position via the Geolocation API.
 * Respects the `locationEnabled` setting — when false, GPS watching
 * stops entirely and coords is set to null.
 */

import { useState, useEffect, useCallback } from 'react';

export function useLocation(locationEnabled = true) {
  const [coords,  setCoords]  = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  const onSuccess = useCallback((pos) => {
    setCoords({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
    setLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    setError(err.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. If location is disabled in settings, stop immediately
    if (!locationEnabled) {
      // FIX: Use a timeout to move these state updates to the next tick
      const t = setTimeout(() => {
        setCoords(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    // 2. Check browser support
    if (!navigator.geolocation) {
      const t = setTimeout(() => {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    // FIX: Also wrap this in a timeout to avoid cascading renders on the start-up
    const tLoading = setTimeout(() => setLoading(true), 0);

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout:            10000,
        maximumAge:         30000,
      }
    );

    return () => {
      clearTimeout(tLoading);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [locationEnabled, onSuccess, onError]);

  return { coords, error, loading };
}