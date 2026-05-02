import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import './Settings.css';

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Settings() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  
  /* Feature States */
  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [locationPerms, setLocationPerms] = useState(true);
  const [radius, setRadius] = useState(250);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("ah_token");
    navigate('/login');
  };

  return (
    <div className={`settings-root ${mounted ? 'settings-root--in' : ''}`}>
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <IconBack />
        </button>
        <h1 className="header-title">Settings</h1>
      </header>

      <div className="settings-scroll-area">
        
        {/* SAFETY AND NOTIFICATIONS */}
        <section className="settings-section">
          <h2 className="section-title">Safety and Notifications</h2>
          <div className="setting-control">
            <div className="control-header">
              <span className="control-label">Proximity Alerts</span>
              <input 
                type="checkbox" 
                className="ios-toggle"
                checked={proximityAlerts} 
                onChange={() => setProximityAlerts(!proximityAlerts)} 
              />
            </div>
            <p className="control-desc">Enable to receive notifications when you enter a high risk area</p>
          </div>

          <div className="setting-control">
            <span className="control-label">Alert Radius</span>
            <div className="slider-container">
              <input 
                type="range" 
                min="100" 
                max="500" 
                step="50"
                value={radius} 
                onChange={(e) => setRadius(e.target.value)}
                className="radius-slider"
              />
              <div className="slider-labels">
                <span>100m</span>
                <span className="current-val">{radius}m</span>
                <span>500m</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* PRIVACY AND DATA HANDLING */}
        <section className="settings-section">
          <h2 className="section-title">Privacy and Data Handling</h2>
          <div className="setting-control">
            <div className="control-header">
              <span className="control-label">Location Permissions</span>
              <input 
                type="checkbox" 
                className="ios-toggle"
                checked={locationPerms} 
                onChange={() => setLocationPerms(!locationPerms)} 
              />
            </div>
            <p className="control-desc">Enable location to see live safety updates and receive alerts about reported incidents near you</p>
          </div>
        </section>

        <hr className="divider" />

        {/* SUPPORT AND DOCUMENTATION */}
        <section className="settings-section">
          <h2 className="section-title">Support and Documentation</h2>
          <nav className="support-nav">
            <button className="nav-link">Report a Bug</button>
            <button className="nav-link">Emergency Hotlines</button>
            <button className="nav-link">Terms of Service</button>
          </nav>
        </section>

        {/* FOOTER AREA */}
        <div className="settings-footer">
          <div className="footer-arc" />
          <button className="logout-button" onClick={handleLogout}>
            Logout?
          </button>
        </div>
      </div>
    </div>
  );
}