import { useState, useEffect } from 'react';

export function useLocation() {
  const [coords,  setCoords]  = useState(null);  // { lat, lng }
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    // keeps coords fresh as a user moves
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout:            10000,
        maximumAge:         30000,   // accept cached position up to 30s old
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, error, loading };
}