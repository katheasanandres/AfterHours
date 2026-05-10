import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage      from "./AuthPage";
import TermsOfService from "./TermsOfService";
import Home          from "./Home";
import Profile       from "./Profile";
import Settings      from "./Settings";
import Reports       from "./Reports";

/* ─── Keys ───────────────────────────────────────────────────────────────── */
const TOKEN_KEY = "ah_token";
const TOS_KEY   = "ah_tos_accepted";

/* ─── PrivateRoute ───────────────────────────────────────────────────────── */
/*
  Three possible states:
    1. No token              → not logged in          → /login
    2. Token + ToS accepted  → fully authorised       → render children]
    ''''''''''''''''''''''''''''''''
    3. Token + no ToS        → logged in but not accepted yet → /terms
*/
function PrivateRoute({ children }) {
  const token       = sessionStorage.getItem(TOKEN_KEY);
  const tosAccepted = localStorage.getItem(TOS_KEY) === "true";

  if (!token)       return <Navigate to="/login"  replace />;
  if (!tosAccepted) return <Navigate to="/terms"  replace />;
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