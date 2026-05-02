// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import Home     from "./Home";
import Profile  from "./Profile";
import Settings from "./Settings";

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem("ah_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<AuthPage />} />

        {/* Protected */}
        <Route path="/home" element={
          <PrivateRoute><Home /></PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}