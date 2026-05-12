import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AuthPage       from "./AuthPage";
import TermsOfService from "./TermsOfService";
import Home           from "./Home";
import Profile        from "./Profile";
import Settings       from "./Settings";
import Reports        from "./Reports";

const TOKEN_KEY = "ah_token";
const TOS_KEY   = "ah_tos_accepted";

/* ─── PrivateRoute ───────────────────────────────────────────────────────── */
function PrivateRoute({ children }) {
  const tosAccepted = localStorage.getItem(TOS_KEY) === "true";

  // Always wait for Firebase to confirm auth — never trust only the
  // stored token string. It can be stale or expired after a reload.
  const [authState, setAuthState] = useState("loading"); // "loading" | "auth" | "unauth"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Silently refresh the stored token so it never expires mid-session
        try {
          const freshToken = await user.getIdToken(false);
          localStorage.setItem(TOKEN_KEY, freshToken);
        } catch {
          // Token refresh failed but Firebase session is still valid — continue
        }
        setAuthState("auth");
      } else {
        // No active Firebase session — clear any stale stored token
        localStorage.removeItem(TOKEN_KEY);
        setAuthState("unauth");
      }
    });

    return () => unsub();
  }, []);

  // Branded loading splash — shows for ~200ms while Firebase resolves
  if (authState === "loading") {
    return (
      <div style={{
        background:     "#08192A",
        height:         "100dvh",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        <div style={{
          width:        "10px",
          height:       "10px",
          borderRadius: "50%",
          background:   "#F97316",
          boxShadow:    "0 0 16px rgba(249,115,22,0.5)",
          animation:    "ahPulse 1.2s ease-in-out infinite",
        }} />
        <style>{`
          @keyframes ahPulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.35; transform:scale(0.65); }
          }
        `}</style>
      </div>
    );
  }

  if (authState === "unauth") return <Navigate to="/login" replace />;
  if (!tosAccepted)           return <Navigate to="/terms" replace />;
  return children;
}

/* ─── App ─────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* ── Protected ───────────────────────────────────────────────── */}
        <Route path="/home"     element={<PrivateRoute><Home     /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile  /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/reports"  element={<PrivateRoute><Reports  /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}