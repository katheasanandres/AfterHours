import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import './Profile.css';

/** ₊˚ ✧ ━━━━⊱SVG Icons⊰━━━━ ✧ ₊˚ * */
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M8.5 1.5L2.5 4.5V8.5C2.5 12 5.2 15 8.5 16C11.8 15 14.5 12 14.5 8.5V4.5L8.5 1.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconRotate = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M14 8.5A5.5 5.5 0 1 1 8.5 3H11M11 1V3V5" stroke="currentColor"
      strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTrash = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path d="M3 5H14M6 5V3.5C6 3 6.5 2.5 7 2.5H10C10.5 2.5 11 3 11 3.5V5M13 5L12.3 13.5C12.2 14.3 11.5 14.8 10.8 14.8H6.2C5.5 14.8 4.8 14.3 4.7 13.5L4 5"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconVerified = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M4 6.5L5.8 8.3L9 5" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** ₊˚ ✧ ━━━━⊱TOGGLE SWITCH⊰━━━━ ✧ ₊˚ * */
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

/* * ₊˚ ✧ ━━━━⊱ DELETE CONFIRMATION MODAL ⊰━━━━ ✧ ₊˚ * */
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true"
      aria-labelledby="modal-title">
      <div className="modal-card">
        <div className="modal-icon">
          <IconTrash />
        </div>
        <h3 id="modal-title" className="modal-title">Delete all reports?</h3>
        <p className="modal-desc">
          This permanently removes all your submitted reports from our servers.
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn modal-btn--confirm" onClick={onConfirm}>
            Yes, delete all
          </button>
        </div>
      </div>
    </div>
  );
}

/* * ₊˚ ✧ ━━━━⊱MAIN COMPONENTS⊰━━━━ ✧ ₊˚ **/
export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // * ₊˚ ✧ ━━━━⊱ Privacy Toggles ⊰━━━━ ✧ ₊˚ *
  // TODO (backend): persist these to Firestore under the user's doc
  const [sessionRotation, setSessionRotation] = useState(true);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);

  // * ₊˚ ✧ ━━━━⊱ Placeholder Stats ⊰━━━━ ✧ ₊˚ *
  // TODO (backend): fetch from Firestore — reports collection filtered by uid
  const stats = {
    submitted:  23,
    verified:   18,
    usersHelped: '4.2k',
    trustScore:  72,
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) setUser(u);
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  // * ₊˚ ✧ ━━━━⊱ Handlers ⊰━━━━ ✧ ₊˚ *
  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  function handleDeleteData() {
    // TODO (backend): call Flask DELETE /api/reports endpoint with ID token
    // For now just closes the modal
    setShowDeleteModal(false);
    console.log('TODO: delete user reports via Flask API');
  }

  // * ₊˚ ✧ ━━━━⊱ Avatar initials from display name or email ⊰━━━━ ✧ ₊˚ *
  function getInitials() {
    if (!user) return '?';
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() ?? '?';
  }

  // * ₊˚ ✧ ━━━━⊱ Trust score label ⊰━━━━ ✧ ₊˚ *
  function getTrustLabel(score) {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Trusted';
    if (score >= 40) return 'Regular';
    return 'New';
  }

  if (!user) return null; // wait for auth state

  return (
    <div className="profile-root">

      {/* * ₊˚ ✧ ━━━━⊱ HEADER ⊰━━━━ ✧ ₊˚ * */}
      <header className="profile-header">
        <button
          className="back-btn"
          onClick={() => navigate('/home')}
          aria-label="Back to map"
        >
          <IconBack />
        </button>
        <h1 className="profile-header__title">Profile</h1>
        <div className="back-btn" style={{ visibility: 'hidden' }} aria-hidden="true" />
      </header>

      {/* * ₊˚ ✧ ━━━━⊱ SCROLLABLE CONTENT ⊰━━━━ ✧ ₊˚ * */}
      <main className="profile-scroll">

        {/* * ₊˚ ✧ ━━━━⊱ AVATAR CARD ⊰━━━━ ✧ ₊˚ * */}
        <section className="profile-card avatar-card" aria-label="User info">
          <div className="avatar-ring">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="avatar-img" />
            ) : (
              <span className="avatar-initials">{getInitials()}</span>
            )}
          </div>
          <div className="avatar-info">
            <p className="avatar-name">
              {user.displayName || 'Anonymous User'}
            </p>
            <p className="avatar-email">{user.email}</p>
            <div className="anon-pill">
              <IconShield />
              <span>Anonymous · No PII stored</span>
            </div>
          </div>
        </section>

        {/* * ₊˚ ✧ ━━━━⊱ STATS GRID ⊰━━━━ ✧ ₊˚ * */}
        <section aria-label="Your statistics">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card__num stat-card__num--accent">
                {stats.submitted}
              </span>
              <span className="stat-card__label">Reports submitted</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num stat-card__num--green">
                {stats.verified}
              </span>
              <span className="stat-card__label">Community verified</span>
            </div>
            <div className="stat-card stat-card--wide">
              <span className="stat-card__num">{stats.usersHelped}</span>
              <span className="stat-card__label">Users helped by your reports</span>
            </div>
          </div>
        </section>

        {/* * ₊˚ ✧ ━━━━⊱ TRUST SCORE ⊰━━━━ ✧ ₊˚ * */}
        <section className="profile-card trust-card" aria-label="Community trust score">
          <div className="trust-card__header">
            <div>
              <p className="trust-card__label">Community trust score</p>
              <p className="trust-card__sublabel">
                {getTrustLabel(stats.trustScore)} reporter
              </p>
            </div>
            <div className="trust-badge">
              <IconVerified />
              <span>{stats.trustScore} / 100</span>
            </div>
          </div>

          <div className="trust-bar" role="progressbar"
            aria-valuenow={stats.trustScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Trust score: ${stats.trustScore} out of 100`}
          >
            <div
              className="trust-bar__fill"
              style={{ width: `${stats.trustScore}%` }}
            />
          </div>
          <p className="trust-card__note">
            Higher trust scores give your reports more weight in the heatmap
          </p>
        </section>

        {/* * ₊˚ ✧ ━━━━⊱ PRIVACY SETTINGS ⊰━━━━ ✧ ₊˚ * */}
        <section aria-labelledby="privacy-heading">
          <h2 className="section-heading" id="privacy-heading">
            Privacy &amp; Data
          </h2>

          {/* Session rotation toggle */}
          <div className="profile-card setting-row">
            <div className="setting-row__icon setting-row__icon--blue">
              <IconRotate />
            </div>
            <div className="setting-row__body">
              <label
                className="setting-row__title"
                htmlFor="session-rotation"
              >
                Session Rotation
              </label>
              <p className="setting-row__desc">
                Cycles your anonymous ID on each new session so your reports
                can't be linked across visits
              </p>
            </div>
            <Toggle
              id="session-rotation"
              label="Toggle session rotation"
              checked={sessionRotation}
              onChange={setSessionRotation}
            />
          </div>

          {/* Data retention info row */}
          <div className="profile-card setting-row setting-row--info">
            <div className="setting-row__icon setting-row__icon--green">
              <IconShield />
            </div>
            <div className="setting-row__body">
              <p className="setting-row__title">Report data retained</p>
              <p className="setting-row__desc">
                Raw report text is discarded after AI processing. Only the
                category label and risk score are stored — never your words.
              </p>
            </div>
          </div>

          {/* Delete all data */}
          <div className="profile-card setting-row setting-row--danger">
            <div className="setting-row__icon setting-row__icon--red">
              <IconTrash />
            </div>
            <div className="setting-row__body">
              <p className="setting-row__title">Delete all my reports</p>
              <p className="setting-row__desc">
                Permanently remove every report tied to your session from our
                servers
              </p>
            </div>
            <button
              className="delete-btn"
              onClick={() => setShowDeleteModal(true)}
              aria-label="Delete all my reports"
            >
              Delete
            </button>
          </div>
        </section>

        {/* * ₊˚ ✧ ━━━━⊱ ACCOUNT ⊰━━━━ ✧ ₊˚ * */}
        <section aria-labelledby="account-heading">
          <h2 className="section-heading" id="account-heading">Account</h2>

          <button className="profile-card menu-row" onClick={handleLogout}>
            <span className="menu-row__label">Log out</span>
            <IconChevron />
          </button>
        </section>

        {/* bottom breathing room so last card clears the nav */}
        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* * ₊˚ ✧ ━━━━⊱ BOTTOM NAV ⊰━━━━ ✧ ₊˚ * */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          {
            key: 'map', label: 'Map',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.25)"/>
                <rect x="13" y="2" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.25)"/>
                <rect x="2" y="13" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.25)"/>
                <rect x="13" y="13" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.25)"/>
              </svg>
            ),
          },
          {
            key: 'reports', label: 'Reports',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
                  stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="11" cy="7.5" r="2.2" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4"/>
              </svg>
            ),
          },
          {
            key: 'profile', label: 'Profile',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4" stroke="var(--accent)" strokeWidth="1.4"/>
                <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
                  stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            key: 'settings', label: 'Settings',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4"/>
                <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
                  stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nav-item ${key === 'profile' ? 'nav-item--active' : ''}`}
            onClick={() => key !== 'profile' && navigate(`/${key}`)}
            aria-current={key === 'profile' ? 'page' : undefined}
          >
            {icon}
            <span className="nav-item__label">{label}</span>
          </button>
        ))}
      </nav>

      {/* * ₊˚ ✧ ━━━━⊱ DELETE CONFIRMATION MODAL ⊰━━━━ ✧ ₊˚ * */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteData}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
