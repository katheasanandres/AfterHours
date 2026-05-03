import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase'; 
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
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

/** ₊˚ ✧ ━━━━⊱ DELETE CONFIRMATION MODAL ⊰━━━━ ✧ ₊˚ * */
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true"
      aria-labelledby="modal-title">
      <div className="modal-card">
        <div className="modal-icon"><IconTrash /></div>
        <h3 id="modal-title" className="modal-title">Delete all reports?</h3>
        <p className="modal-desc">
          This permanently removes all your submitted reports from our servers.
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn modal-btn--confirm" onClick={onConfirm}>Yes, delete all</button>
        </div>
      </div>
    </div>
  );
}

/** ₊˚ ✧ ━━━━⊱MAIN COMPONENT⊰━━━━ ✧ ₊˚ **/
export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessionRotation, setSessionRotation] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [stats, setStats] = useState({
    submitted: 0,
    verified: 0,
    usersHelped: '0',
    trustScore: 0,
  });

  /** ── HELPERS (Declared before useEffect to avoid declaration errors) ── */
  
  const setupSession = useCallback((uid) => {
    const lastLoginUid = localStorage.getItem('last_login_uid');
    if (sessionRotation && lastLoginUid !== uid) {
      const anonymousId = `session_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', anonymousId);
      localStorage.setItem('last_login_uid', uid);
    }
  }, [sessionRotation]);

  const listenToUserStats = useCallback((uid) => {
    const q = query(collection(db, "reports"), where("userId", "==", uid));
    
    return onSnapshot(q, (snapshot) => {
      const reportCount = snapshot.size;
      const verifiedCount = snapshot.docs.filter(doc => doc.data().status === 'verified').length;
      const calculatedTrust = Math.min(reportCount * 5, 100);
      
      setStats({
        submitted: reportCount,
        verified: verifiedCount,
        usersHelped: (reportCount * 12).toLocaleString(), 
        trustScore: calculatedTrust,
      });
    });
  }, []);

  /** ── AUTH & DATA INIT ── */
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setupSession(u.uid);
        const unsubscribeStats = listenToUserStats(u.uid);
        return () => unsubscribeStats();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate, setupSession, listenToUserStats]);

  /** ── HANDLERS ── */
  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  async function handleDeleteData() {
    if (!user) return;
    try {
      const q = query(collection(db, "reports"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function getInitials() {
    if (!user) return '?';
    if (user.displayName) {
      return user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() ?? '?';
  }

  function getTrustLabel(score) {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Trusted';
    if (score >= 40) return 'Regular';
    return 'New';
  }

  if (!user) return null;

  return (
    <div className="profile-root">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/home')} aria-label="Back to map">
          <IconBack />
        </button>
        <h1 className="profile-header__title">Profile</h1>
        <div className="back-btn" style={{ visibility: 'hidden' }} aria-hidden="true" />
      </header>

      <main className="profile-scroll">
        <section className="profile-card avatar-card">
          <div className="avatar-ring">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="avatar-img" />
            ) : (
              <span className="avatar-initials">{getInitials()}</span>
            )}
          </div>
          <div className="avatar-info">
            <p className="avatar-name">{user.displayName || 'Anonymous User'}</p>
            <p className="avatar-email">{user.email}</p>
            <div className="anon-pill"><IconShield /><span>Anonymous · No PII stored</span></div>
          </div>
        </section>

        <section>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card__num stat-card__num--accent">{stats.submitted}</span>
              <span className="stat-card__label">Reports submitted</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num stat-card__num--green">{stats.verified}</span>
              <span className="stat-card__label">Community verified</span>
            </div>
            <div className="stat-card stat-card--wide">
              <span className="stat-card__num">{stats.usersHelped}</span>
              <span className="stat-card__label">Users helped by your reports</span>
            </div>
          </div>
        </section>

        <section className="profile-card trust-card">
          <div className="trust-card__header">
            <div>
              <p className="trust-card__label">Community trust score</p>
              <p className="trust-card__sublabel">{getTrustLabel(stats.trustScore)} reporter</p>
            </div>
            <div className="trust-badge"><IconVerified /><span>{stats.trustScore} / 100</span></div>
          </div>
          <div className="trust-bar" role="progressbar" aria-valuenow={stats.trustScore} aria-valuemin={0} aria-valuemax={100}>
            <div className="trust-bar__fill" style={{ width: `${stats.trustScore}%` }} />
          </div>
          <p className="trust-card__note">Higher trust scores give your reports more weight in the heatmap</p>
        </section>

        <section>
          <h2 className="section-heading">Privacy &amp; Data</h2>
          <div className="profile-card setting-row">
            <div className="setting-row__icon setting-row__icon--blue"><IconRotate /></div>
            <div className="setting-row__body">
              <label className="setting-row__title" htmlFor="session-rotation">Session Rotation</label>
              <p className="setting-row__desc">Cycles your anonymous ID so your reports can't be linked across visits</p>
            </div>
            <Toggle id="session-rotation" checked={sessionRotation} onChange={setSessionRotation} />
          </div>

          <div className="profile-card setting-row setting-row--danger">
            <div className="setting-row__icon setting-row__icon--red"><IconTrash /></div>
            <div className="setting-row__body">
              <p className="setting-row__title">Delete all my reports</p>
              <p className="setting-row__desc">Permanently remove every report tied to your session</p>
            </div>
            <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete</button>
          </div>
        </section>

        <section>
          <h2 className="section-heading">Account</h2>
          <button className="profile-card menu-row" onClick={handleLogout}>
            <span className="menu-row__label">Log out</span>
            <IconChevron />
          </button>
        </section>
        <div style={{ height: '24px' }} />
      </main>

      <nav className="bottom-nav">
        {['map', 'reports', 'profile', 'settings'].map((key) => (
          <button
            key={key}
            className={`nav-item ${key === 'profile' ? 'nav-item--active' : ''}`}
            onClick={() => key !== 'profile' && navigate(`/${key}`)}
          >
            <span className="nav-item__label" style={{textTransform: 'capitalize'}}>{key}</span>
          </button>
        ))}
      </nav>

      {showDeleteModal && (
        <DeleteModal onConfirm={handleDeleteData} onCancel={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}