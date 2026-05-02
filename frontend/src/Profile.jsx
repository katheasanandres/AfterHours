import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './Profile.css';

/* Profile Icons ──────────────────────────────────────────────────────── */
const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 3L15 7M1.5 16.5L5.5 16L15.5 6C16.3 5.2 16.3 3.8 15.5 3C14.7 2.2 13.3 2.2 12.5 3L2.5 13L2 17L6 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 5V10C3 14.4 6 18.5 10 20C14 18.5 17 14.4 17 10V5L10 2Z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // timer to trigger the fade-in animation
    const timer = setTimeout(() => setMounted(true), 50);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigate]);

  return (
    <div className={`profile-root ${mounted ? 'profile-root--in' : ''}`}>
      {/* ── HEADER ── */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <IconBack />
        </button>
        <h1 className="header-title">My Profile</h1>
        <button className="edit-btn" aria-label="Edit profile">
          <IconEdit />
        </button>
      </header>

      {/* ── USER INFO ── */}
      <section className="user-hero">
        <div className="avatar-wrap">
          <div className="avatar-ring" />
          <img 
            src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
            alt="Profile" 
            className="user-avatar"
          />
        </div>
        <h2 className="user-name">{user?.displayName || "Guardian User"}</h2>
        <p className="user-email">{user?.email}</p>
        <div className="user-badge">
          <IconShield />
          <span>Active Contributor</span>
        </div>
      </section>

      {/* ── STATS GRID ── */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">12</span>
          <span className="stat-label">Reports</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">84</span>
          <span className="stat-label">Karma</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">3</span>
          <span className="stat-label">Badges</span>
        </div>
      </section>

      {/* ── ACTIVITY FEED ── */}
      <section className="activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-dot dot--red" />
            <div className="activity-content">
              <p>Reported <strong>Poor Lighting</strong></p>
              <span>Near Gordon College · 2h ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-dot dot--green" />
            <div className="activity-content">
              <p>Verified <strong>Safe Path</strong></p>
              <span>Magsaysay Ave · Yesterday</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}