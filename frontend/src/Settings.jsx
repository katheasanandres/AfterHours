import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import './Settings.css';

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════════ */
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
    <circle cx="8.5" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
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
    <line x1="6.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconPhoneCall = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M3 1.5C3 1.5 1.5 3 1.5 5.5C1.5 9.5 5.5 13.5 9.5 13.5C12 13.5 13.5 12 13.5 12L11 9.5L9.5 11C9.5 11 7.5 9.5 6 8C4.5 6.5 3 4.5 3 4.5L4.5 3L3 1.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
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
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="15" stroke="var(--green)" strokeWidth="1.5"/>
    <path d="M9 16L13.5 20.5L23 11" stroke="var(--green)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TOGGLE
═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   RADIUS SLIDER
═══════════════════════════════════════════════════════════════════════════ */
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
        <div className="slider-fill" style={{ width: `${pct}%` }} aria-hidden="true" />
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

/* ═══════════════════════════════════════════════════════════════════════════
   BUG REPORT SHEET
   Fully in-app. POSTs to Flask /api/bugs → Flask sends email via Gmail SMTP.
   No mailto. No new tab. User never leaves AfterHours.
═══════════════════════════════════════════════════════════════════════════ */
const BUG_CATEGORIES = [
  { id: 'ui_bug',          label: 'UI / Visual Bug',          color: 'amber' },
  { id: 'app_crash',       label: 'App Crash',                color: 'red'   },
  { id: 'map_not_loading', label: 'Map Not Loading',          color: 'amber' },
  { id: 'report_failed',   label: 'Report Submission Failed', color: 'red'   },
  { id: 'location_error',  label: 'Location Not Working',     color: 'amber' },
  { id: 'other',           label: 'Other',                    color: 'gray'  },
];

const BUG_SEVERITIES = [
  { id: 'low',    label: 'Low',    desc: 'Minor annoyance',   color: 'green' },
  { id: 'medium', label: 'Medium', desc: 'Affects usability', color: 'amber' },
  { id: 'high',   label: 'High',   desc: 'App unusable',      color: 'red'   },
];

function BugReportSheet({ onClose }) {
  const [visible,     setVisible]    = useState(false);
  const [submitted,   setSubmitted]  = useState(false);
  const [submitting,  setSubmitting] = useState(false);
  const [submitErr,   setSubmitErr]  = useState('');
  const [category,    setCategory]   = useState(null);
  const [severity,    setSeverity]   = useState(null);
  const [description, setDesc]       = useState('');

  const MAX = 500;

  // Auto-collected device info — included in the email Flask sends
  const deviceInfo = {
    userAgent:  navigator.userAgent,
    screenSize: `${window.screen.width}×${window.screen.height}`,
    viewport:   `${window.innerWidth}×${window.innerHeight}`,
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 340);
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  const canSubmit = !!category && !!severity && description.trim().length >= 10;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitErr('');

    try {
      // Firebase ID token — Flask uses this to verify the reporter
      const idToken = await auth.currentUser.getIdToken();

      const payload = {
        category,
        severity,
        description: description.trim(),
        device:      deviceInfo,
        timestamp:   new Date().toISOString(),
      };

      // POST to Flask — stays in-app, Flask handles the email
      const res = await fetch('/api/bugs', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      setSubmitted(true);
      setTimeout(() => handleClose(), 2800);

    } catch (err) {
      setSubmitErr(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`sheet-overlay ${visible ? 'sheet-overlay--in' : ''}`}
      onClick={handleOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Report a bug"
    >
      <div className={`sheet ${visible ? 'sheet--in' : ''}`}>
        <div className="sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-header__left">
            <h2 className="sheet-header__title">
              {submitted ? 'Report Sent!' : 'Report a Bug'}
            </h2>
            {!submitted && (
              <p className="sheet-header__sub">Help us improve AfterHours</p>
            )}
          </div>
          <button className="sheet-close" onClick={handleClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="sheet-body">

          {submitted ? (
            /* Success */
            <div className="sheet-success">
              <div className="sheet-success__icon"><IconCheck /></div>
              <p className="sheet-success__title">Thank you!</p>
              <p className="sheet-success__sub">
                Your report has been sent to the AfterHours team.
                We'll look into it as soon as possible.
              </p>
            </div>

          ) : (
            <>
              {/* Bug category */}
              <p className="sheet-label">What type of bug?</p>
              <div className="bug-cat-grid">
                {BUG_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`bug-cat-btn bug-cat-btn--${cat.color}
                      ${category === cat.id ? 'bug-cat-btn--active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={category === cat.id}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Severity */}
              <p className="sheet-label">How severe is this?</p>
              <div className="severity-row">
                {BUG_SEVERITIES.map(s => (
                  <button
                    key={s.id}
                    className={`severity-btn severity-btn--${s.color}
                      ${severity === s.id ? 'severity-btn--active' : ''}`}
                    onClick={() => setSeverity(s.id)}
                    aria-pressed={severity === s.id}
                  >
                    <span className="severity-btn__label">{s.label}</span>
                    <span className="severity-btn__desc">{s.desc}</span>
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="sheet-field">
                <label className="sheet-field__label" htmlFor="bug-desc">
                  Description
                  <span className="sheet-field__required">required · min 10 chars</span>
                </label>
                <textarea
                  id="bug-desc"
                  className="sheet-field__textarea"
                  value={description}
                  onChange={e => setDesc(e.target.value.slice(0, MAX))}
                  placeholder="Describe what happened, what you expected, and steps to reproduce…"
                  rows={4}
                />
                <p className={`sheet-field__counter
                  ${MAX - description.length < 60 ? 'sheet-field__counter--warn' : ''}`}>
                  {MAX - description.length} characters remaining
                </p>
              </div>

              {/* Device info — read-only, shown for transparency */}
              <div className="device-info">
                <p className="device-info__label">
                  Device info
                  <span className="device-info__note"> (auto-collected, included in report)</span>
                </p>
                <p className="device-info__row">
                  <span className="device-info__key">Screen</span>
                  <span className="device-info__val">{deviceInfo.screenSize}</span>
                </p>
                <p className="device-info__row">
                  <span className="device-info__key">Viewport</span>
                  <span className="device-info__val">{deviceInfo.viewport}</span>
                </p>
                <p className="device-info__row">
                  <span className="device-info__key">Browser</span>
                  <span className="device-info__val device-info__val--ua">
                    {deviceInfo.userAgent}
                  </span>
                </p>
              </div>

              {submitErr && (
                <p className="sheet-err" role="alert">⚠️ {submitErr}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="sheet-footer">
            <button
              className="sheet-btn sheet-btn--cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={`sheet-btn sheet-btn--submit
                ${submitting ? 'sheet-btn--loading' : ''}
                ${!canSubmit ? 'sheet-btn--disabled' : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <span className="sheet-spinner" aria-hidden="true" />
                  <span>Sending…</span>
                </>
              ) : 'Send Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMERGENCY HOTLINES SHEET
═══════════════════════════════════════════════════════════════════════════ */
const HOTLINES = [
  { label: 'National Emergency Hotline',   number: '911',            color: 'red'   },
  { label: 'PNP Emergency Hotline',        number: '166',            color: 'red'   },
  { label: 'Olongapo City Police Station', number: '(047) 224-4911', color: 'red'   },
  { label: 'Bureau of Fire Protection',    number: '(047) 222-3999', color: 'amber' },
  { label: 'Olongapo City Emergency',      number: '(047) 222-4141', color: 'red'   },
  { label: 'Olongapo City DRRMO',          number: '(047) 222-2411', color: 'amber' },
  { label: 'Women & Children Protection',  number: '(047) 222-3696', color: 'amber' },
  { label: 'NDRRMC (Disaster Risk)',       number: '(02) 911-5061',  color: 'amber' },
  { label: 'Philippine Red Cross',         number: '143',            color: 'red'   },
  { label: 'DOH Health Emergency',         number: '1555',           color: 'green' },
];

function HotlinesSheet({ onClose }) {
  const [visible, setVisible] = useState(false);

  // Proper useEffect mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 340);
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  return (
    <div
      className={`sheet-overlay ${visible ? 'sheet-overlay--in' : ''}`}
      onClick={handleOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Emergency hotlines"
    >
      <div className={`sheet ${visible ? 'sheet--in' : ''}`}>
        <div className="sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-header__left">
            <h2 className="sheet-header__title">Emergency Hotlines</h2>
            <p className="sheet-header__sub">Olongapo City &amp; Philippines</p>
          </div>
          <button className="sheet-close" onClick={handleClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="sheet-body">
          <div className="hotlines-notice">
            ⚠️ If you are in immediate danger, call <strong>911</strong> or{' '}
            <strong>166</strong> immediately. AfterHours is not a substitute
            for emergency services.
          </div>

          {HOTLINES.map(h => (
            <a
              key={`${h.label}-${h.number}`}
              className={`hotline-row hotline-row--${h.color}`}
              href={`tel:${h.number.replace(/[^0-9+]/g, '')}`}
              aria-label={`Call ${h.label}: ${h.number}`}
            >
              <div className="hotline-row__text">
                <span className="hotline-row__label">{h.label}</span>
                <span className="hotline-row__number">{h.number}</span>
              </div>
              {/* "Call" text on wide screens, phone icon on narrow */}
              <span className="hotline-row__cta">
                <span className="hotline-row__cta-text">Call</span>
                <span className="hotline-row__cta-icon"><IconPhoneCall /></span>
              </span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="sheet-footer">
          <button
            className="sheet-btn sheet-btn--cancel"
            style={{ flex: 1 }}
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Settings() {
  const navigate = useNavigate();

  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [alertRadius,     setAlertRadius]     = useState(250);
  const [locationPerms,   setLocationPerms]   = useState(true);
  const [showBugReport,   setShowBugReport]   = useState(false);
  const [showHotlines,    setShowHotlines]    = useState(false);

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  function handleNav(key) {
    if (key === 'settings') return;
    navigate(`/${key}`);
  }

  return (
    <div className="settings-root">

      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate('/home')} aria-label="Back to map">
          <IconBack />
        </button>
        <h1 className="settings-header__title">Settings</h1>
        <div className="back-btn" style={{ visibility: 'hidden' }} aria-hidden="true" />
      </header>

      <main className="settings-scroll">

        {/* Safety and Notifications */}
        <section aria-labelledby="safety-heading">
          <h2 className="section-heading" id="safety-heading">Safety and Notifications</h2>
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-row__icon setting-row__icon--red"><IconBell /></div>
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
            <div className="setting-row setting-row--column">
              <div className="setting-row__top">
                <div className="setting-row__icon setting-row__icon--amber"><IconRadius /></div>
                <div className="setting-row__body">
                  <p className="setting-row__title">Alert Radius</p>
                  <p className="setting-row__desc">Distance at which proximity alerts trigger</p>
                </div>
              </div>
              <RadiusSlider value={alertRadius} onChange={setAlertRadius} />
            </div>
          </div>
        </section>

        {/* Privacy and Data Handling */}
        <section aria-labelledby="privacy-heading">
          <h2 className="section-heading" id="privacy-heading">Privacy and Data Handling</h2>
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-row__icon setting-row__icon--green"><IconLocation /></div>
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

        {/* Support and Documentation */}
        <section aria-labelledby="support-heading">
          <h2 className="section-heading" id="support-heading">Support and Documentation</h2>
          <div className="settings-card">

            {/* Report a Bug — in-app sheet, no mailto, no new tab */}
            <button
              className="support-row"
              onClick={() => setShowBugReport(true)}
              aria-label="Report a bug"
            >
              <div className="setting-row__icon setting-row__icon--blue"><IconBug /></div>
              <span className="support-row__label">Report a Bug</span>
              <IconChevron />
            </button>

            <div className="card-divider" aria-hidden="true" />

            {/* Emergency Hotlines */}
            <button
              className="support-row"
              onClick={() => setShowHotlines(true)}
              aria-label="Emergency hotlines"
            >
              <div className="setting-row__icon setting-row__icon--red"><IconPhone /></div>
              <span className="support-row__label">Emergency Hotlines</span>
              <IconChevron />
            </button>

            <div className="card-divider" aria-hidden="true" />

            {/* Terms of Service */}
            <button className="support-row" onClick={() => navigate('/terms')}>
              <div className="setting-row__icon setting-row__icon--gray"><IconDoc /></div>
              <span className="support-row__label">Terms of Service</span>
              <IconChevron />
            </button>
          </div>
        </section>

        <button className="logout-row" onClick={handleLogout}>Logout</button>
        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { key: 'home',     label: 'Map',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="2"  y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              </svg>
            ),
          },
          { key: 'reports',  label: 'Reports',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="11" cy="7.5" r="2.2"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
              </svg>
            ),
          },
          { key: 'profile',  label: 'Profile',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
                <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          { key: 'settings', label: 'Settings',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="3"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
                <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map(({ key, label, icon }) => {
          const isActive = key === 'settings';
          return (
            <button key={key}
              className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => handleNav(key)}
              aria-current={isActive ? 'page' : undefined}
            >
              {icon(isActive)}
              <span className="nav-item__label">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sheets */}
      {showBugReport && <BugReportSheet onClose={() => setShowBugReport(false)} />}
      {showHotlines  && <HotlinesSheet  onClose={() => setShowHotlines(false)}  />}
    </div>
  );
}