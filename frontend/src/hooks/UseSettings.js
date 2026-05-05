import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase'; // Added auth import
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULTS = {
  proximityAlerts: true,
  alertRadius:     250,
  locationEnabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading,  setLoading]  = useState(true);

  // Use the permanent UID so settings are saved to your account, not just the session
  const user = auth.currentUser;
  const uid = user ? user.uid : null;
  const docRef = uid ? doc(db, 'user_settings', uid) : null;

  /* ── Load settings from Firestore on mount ─────────────────────────── */
  useEffect(() => {
    // If the user isn't logged in, stop loading and get out
    if (!uid || !docRef) { 
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }

    const unsub = onSnapshot(docRef, async (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULTS, ...snap.data() });
      } else {
        await setDoc(docRef, DEFAULTS);
        setSettings(DEFAULTS);
      }
      setLoading(false);
    }, (err) => {
      console.error('useSettings error:', err);
      setLoading(false);
    });

    return () => unsub();
    
  }, [uid, docRef]);

  /* ── Update a single setting ───────────────────────────────────────── */
  const updateSetting = useCallback(async (key, value) => {
    if (!docRef) return;

    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      await setDoc(docRef, { [key]: value }, { merge: true });
    } catch (err) {
      console.error('Failed to save setting:', err);
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  }, [docRef]);

  return { settings, loading, updateSetting };
}