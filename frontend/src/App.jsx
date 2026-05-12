import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AuthPage      from "./AuthPage";
import TermsOfService from "./TermsOfService";
import Home          from "./Home";
import Profile       from "./Profile";
import Settings      from "./Settings";
import Reports       from "./Reports";

const TOKEN_KEY = "ah_token";
const TOS_KEY   = "ah_tos_accepted";

function PrivateRoute({ children }) {
  // 1. Initialize state immediately from storage so there is no "null" gap
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
  const [loading, setLoading] = useState(!hasToken); 
  
  const tosAccepted = localStorage.getItem(TOS_KEY) === "true";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (user || token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#0f172a", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        <p>Checking authorization...</p>
      </div>
    );
  }

  // 2. Redirect logic
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!tosAccepted)    return <Navigate to="/terms" replace />;
  
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/terms" element={<TermsOfService />} />

        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}