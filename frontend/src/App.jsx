import { useState, useEffect } from "react"; // Added hooks
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth"; // Added for auth check
import { auth } from "./firebase"; // Adjust path if necessary
import AuthPage      from "./AuthPage";
import TermsOfService from "./TermsOfService";
import Home          from "./Home";
import Profile       from "./Profile";
import Settings      from "./Settings";
import Reports       from "./Reports";

/* ─── Keys ───────────────────────────────────────────────────────────────── */
const TOKEN_KEY = "ah_token";
const TOS_KEY   = "ah_tos_accepted";
console.log("Token:", sessionStorage.getItem(TOKEN_KEY));
console.log("ToS:", localStorage.getItem(TOS_KEY));

/* ─── PrivateRoute ───────────────────────────────────────────────────────── */
function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const tosAccepted = localStorage.getItem(TOS_KEY) === "true";

  useEffect(() => {
    // Check both the Firebase Auth state and your manual token key
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (user || token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // While checking auth, show nothing or a splash screen to prevent flicker
  if (loading) {
    return (
      <div style={{ background: "#0f172a", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        <p>Loading AfterHours...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!tosAccepted)    return <Navigate to="/terms" replace />;
  
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
        <Route path="/home" element={
          <PrivateRoute><Home /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><Settings /></PrivateRoute>
        } />
        
        <Route path="/reports" element={
          <PrivateRoute><Reports /></PrivateRoute>
        } />

        {/* ── Fallback ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}