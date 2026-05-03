import { useState, useEffect, useCallback } from 'react';

export function useLocation() {
  const [coords,  setCoords]  = useState(null);  // { lat, lng }
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
    if (!navigator.geolocation) {
      // Wrap in setTimeout so setState is never called synchronously
      // inside the effect body — satisfies react-hooks/set-state-in-effect
      const t = setTimeout(() => {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout:            10000,
        maximumAge:         30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onSuccess, onError]);

  return { coords, error, loading };
}
