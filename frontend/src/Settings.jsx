import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import './Settings.css';

/*  ₊˚ ✧ ━━━━⊱ SVG Icons ⊰━━━━ ✧ ₊˚  */
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconBell = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M8.5 2C5.7 2 3.5 4.2 3.5 7V11L2 13H15L13.5 11V7C13.5 4.2 11.3 2 8.5 2Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M7 13C7 13.8 7.7 14.5 8.5 14.5C9.3 14.5 10 13.8 10 13"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconRadius = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="8.5" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.2"
      strokeDasharray="2 1.5"/>
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor"/>
  </svg>
);
const IconLocation = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M8.5 2C6 2 4 4 4 6.5C4 10 8.5 15 8.5 15C8.5 15 13 10 13 6.5C13 4 11 2 8.5 2Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <circle cx="8.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconBug = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <rect x="5" y="5" width="7" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 8H3M12 8H14M5 11H3M12 11H14M6.5 5V3.5M10.5 5V3.5"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconPhone = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M5 2H12C12.6 2 13 2.4 13 3V14C13 14.6 12.6 15 12 15H5C4.4 15 4 14.6 4 14V3C4 2.4 4.4 2 5 2Z"
      stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="8.5" cy="12.5" r="0.7" fill="currentColor"/>
    <line x1="6.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor"
      strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconDoc = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <rect x="3.5" y="2" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="6" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="6" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="6" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* TOGGLE — reused from Profile pattern */
function Toggle({ checked, onChange, id, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      className={`toggle ${checked ? 'toggle--on' : 'toggle--off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__thumb" />
    </button>
  );
}

/* SLIDER */
function RadiusSlider({ value, onChange }) {
  const MIN = 100;
  const MAX = 500;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="slider-wrap">
      <div className="slider-val-row">
        <span className="slider-val">{value}m</span>
      </div>
      <div className="slider-track-wrap">
        {/* filled portion */}
        <div
          className="slider-fill"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          className="slider-input"
          min={MIN}
          max={MAX}
          step={10}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          aria-label={`Alert radius: ${value} meters`}
        />
      </div>
      <div className="slider-labels">
        <span>100m</span>
        <span>500m</span>
      </div>
    </div>
  );
}

/*  ₊˚ ✧ ━━━━⊱ MAIN COMPONENTS ⊰━━━━ ✧ ₊˚  */
export default function Settings() {
  const navigate = useNavigate();

  /* ₊˚ ✧ ━━━━⊱ SAFETY AND NOTIFS ⊰━━━━ ✧ ₊˚  */
  // TO DO (backend): persist to Firestore user doc
  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [alertRadius,     setAlertRadius]     = useState(250);

  /*  ₊˚ ✧ ━━━━⊱ PRIVACY AND DATA ⊰━━━━ ✧ ₊˚  */
  // TO DO (backend): connect to Firestore user doc + implement UID rotation
  const [locationPerms, setLocationPerms] = useState(true);

  /*  ₊˚ ✧ ━━━━⊱ LOGOUT ⊰━━━━ ✧ ₊˚  */
  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  /*  ₊˚ ✧ ━━━━⊱ NAV ⊰━━━━ ✧ ₊˚  */
  function handleNav(key) {
    if (key === 'settings') return;
    navigate(`/${key}`);
  }

  return (
    <div className="settings-root">

      {/* ₊˚ ✧ ━━━━⊱ HEADER ⊰━━━━ ✧ ₊˚  */}
      <header className="settings-header">
        <button
          className="back-btn"
          onClick={() => navigate('/home')}
          aria-label="Back to map"
        >
          <IconBack />
        </button>
        <h1 className="settings-header__title">Settings</h1>
        <div className="back-btn" style={{ visibility: 'hidden' }} aria-hidden="true" />
      </header>

      {/* ₊˚ ✧ ━━━━⊱ SCROLLABLE CONTENT ⊰━━━━ ✧ ₊˚  */}
      <main className="settings-scroll">

        {/*  ₊˚ ✧ ━━━━⊱ SAFETY AND NOTIFS ⊰━━━━ ✧ ₊˚  */}
        <section aria-labelledby="safety-heading">
          <h2 className="section-heading" id="safety-heading">
            Safety and Notifications
          </h2>

          {/* Proximity Alerts toggle */}
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-row__icon setting-row__icon--red">
                <IconBell />
              </div>
              <div className="setting-row__body">
                <label className="setting-row__title" htmlFor="proximity-alerts">
                  Proximity Alerts
                </label>
                <p className="setting-row__desc">
                  Enable to receive notifications when you enter a high risk area
                </p>
              </div>
              <Toggle
                id="proximity-alerts"
                label="Toggle proximity alerts"
                checked={proximityAlerts}
                onChange={setProximityAlerts}
              />
            </div>

            <div className="card-divider" aria-hidden="true" />

            {/* Alert Radius slider (TO DO: CONNECT TO USER LOC) */}
            <div className="setting-row setting-row--column">
              <div className="setting-row__top">
                <div className="setting-row__icon setting-row__icon--amber">
                  <IconRadius />
                </div>
                <div className="setting-row__body">
                  <p className="setting-row__title">Alert Radius</p>
                  <p className="setting-row__desc">
                    Distance at which proximity alerts trigger
                  </p>
                </div>
              </div>
              <RadiusSlider
                value={alertRadius}
                onChange={setAlertRadius}
              />
            </div>
          </div>
        </section>

        {/*  ₊˚ ✧ ━━━━⊱ PRIVACY AND DATA HANDLING ⊰━━━━ ✧ ₊˚  */}
        <section aria-labelledby="privacy-heading">
          <h2 className="section-heading" id="privacy-heading">
            Privacy and Data Handling
          </h2>

          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-row__icon setting-row__icon--green">
                <IconLocation />
              </div>
              <div className="setting-row__body">
                <label className="setting-row__title" htmlFor="location-perms">
                  Location Permissions
                </label>
                <p className="setting-row__desc">
                  Enable location to see live safety updates and receive alerts
                  about reported incidents near you
                </p>
              </div>
              <Toggle
                id="location-perms"
                label="Toggle location permissions"
                checked={locationPerms}
                onChange={setLocationPerms}
              />
            </div>
          </div>
        </section>

        {/*  ₊˚ ✧ ━━━━⊱ SUPPORT AND DOC ⊰━━━━ ✧ ₊˚  */}
        <section aria-labelledby="support-heading">
          <h2 className="section-heading" id="support-heading">
            Support and Documentation
          </h2>

          <div className="settings-card">
            {/* Report a Bug */}
            <button
              className="support-row"
              onClick={() => {/* TODO: open bug report form / email */}}
              aria-label="Report a bug"
            >
              <div className="setting-row__icon setting-row__icon--blue">
                <IconBug />
              </div>
              <span className="support-row__label">Report a Bug</span>
              <IconChevron />
            </button>

            <div className="card-divider" aria-hidden="true" />

            {/* Emergency Hotlines */}
            <button
              className="support-row"
              onClick={() => {/* TODO: navigate to hotlines page */}}
              aria-label="Emergency hotlines"
            >
              <div className="setting-row__icon setting-row__icon--red">
                <IconPhone />
              </div>
              <span className="support-row__label">Emergency Hotlines</span>
              <IconChevron />
            </button>

            <div className="card-divider" aria-hidden="true" />

            {/* Terms of Service */}
            <button className="support-row" onClick={() => navigate('/terms')}>
            
              <div className="setting-row__icon setting-row__icon--gray">
                <IconDoc />
              </div>
              <span className="support-row__label">Terms of Service</span>
              <IconChevron />
            </button>
          </div>
        </section>

        {/*  ₊˚ ✧ ━━━━⊱ LOGOUT ⊰━━━━ ✧ ₊˚  */}
        <button className="logout-row" onClick={handleLogout}>
          Logout
        </button>

        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* ₊˚ ✧ ━━━━⊱ BOTTOM NAV ⊰━━━━ ✧ ₊˚  */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          {
            key: 'home', label: 'Map',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5"
                  fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="2" width="7" height="7" rx="1.5"
                  fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="2" y="13" width="7" height="7" rx="1.5"
                  fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="13" width="7" height="7" rx="1.5"
                  fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              </svg>
            ),
          },
          {
            key: 'reports', label: 'Reports',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="11" cy="7.5" r="2.2"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
              </svg>
            ),
          },
          {
            key: 'profile', label: 'Profile',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
                <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            key: 'settings', label: 'Settings',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="3"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
                <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
                  stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map(({ key, label, icon }) => {
          const active = key === 'settings';
          return (
            <button
              key={key}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              onClick={() => handleNav(key)}
              aria-current={active ? 'page' : undefined}
            >
              {icon(active)}
              <span className="nav-item__label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}