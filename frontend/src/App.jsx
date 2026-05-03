import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import Home     from "./Home";
import Profile  from "./Profile";
import Settings from "./Settings";
import Reports  from "./Reports";

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem("ah_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={<AuthPage />} />
        
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

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}