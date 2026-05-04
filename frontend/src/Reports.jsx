import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useLocation } from './hooks/useLocation';
import './Reports.css';

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════════ */
const IconPin = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M5 1C3.3 1 2 2.3 2 4C2 6.3 5 9 5 9C5 9 8 6.3 8 4C8 2.3 6.7 1 5 1Z"
      stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
    <circle cx="5" cy="4" r="1.2" stroke="currentColor" strokeWidth="0.9"/>
  </svg>
);
const IconClock = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <circle cx="5" cy="5" r="3.8" stroke="currentColor" strokeWidth="0.9"/>
    <path d="M5 3V5L6.5 6.5" stroke="currentColor" strokeWidth="0.9"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAI = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <circle cx="5" cy="5" r="3.8" stroke="currentColor" strokeWidth="0.9"/>
    <path d="M3 5H7M5 3V7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const FILTER_GROUPS = [
  {
    id: 'status',
    label: 'Status',
    filters: [
      { id: 'pending',  label: 'Pending',  color: 'amber' },
      { id: 'resolved', label: 'Resolved', color: 'green' },
    ],
  },
  {
    id: 'urgency',
    label: 'Urgency',
    filters: [
      { id: 'high',     label: 'High Severity', color: 'red'   },
      { id: 'moderate', label: 'Moderate',       color: 'amber' },
      { id: 'low',      label: 'Low Severity',   color: 'gray'  },
    ],
  },
  {
    id: 'proximity',
    label: 'Proximity',
    filters: [
      { id: 'near_me', label: 'Near Me (500m)', color: 'blue' },
    ],
  },
  {
    id: 'recency',
    label: 'Recency',
    filters: [
      { id: 'recent',     label: 'Last 24 hrs',         color: 'blue'   },
      { id: 'late_night', label: 'Late Night (10PM–4AM)', color: 'purple' },
    ],
  },
];

// Maps Firestore category IDs → readable labels
const CAT_LABELS = {
  poor_lighting:         'Poor Lighting',
  loitering:             'Suspicious Loitering',
  catcalling:            'Catcalling / Harassment',
  broken_infrastructure: 'Broken Infrastructure',
  unsafe_vehicle:        'Unsafe / Reckless Vehicle',
  no_bystanders:         'Isolated / No Bystanders',
  other:                 'Other',
};

// Maps category IDs → environmental | social | general
const CAT_TYPE = {
  poor_lighting:         'Environmental',
  loitering:             'Social',
  catcalling:            'Social',
  broken_infrastructure: 'Environmental',
  unsafe_vehicle:        'Social',
  no_bystanders:         'Environmental',
  other:                 'General',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

/** Converts a Firestore Timestamp or ISO string to a relative label */
function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff  = (Date.now() - date.getTime()) / 1000; // seconds ago

  if (diff < 60)          return 'Just now';
  if (diff < 3600)        return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 86400 * 2)   return 'Yesterday';
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Returns true if report was submitted between 10PM and 4AM */
function isLateNight(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const h    = date.getHours();
  return h >= 22 || h < 4;
}

/** Returns true if report was submitted within the last 24 hours */
function isRecent(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return (Date.now() - date.getTime()) < 86400 * 1000;
}

/** Returns true if report is within ~500m of user (rough degree estimate) */
function isNearMe(report, coords) {
  if (!coords || !report.location?.lat || !report.location?.lng) return false;
  const RADIUS = 0.0045; // ~500m in degrees
  return (
    Math.abs(report.location.lat - coords.lat) < RADIUS &&
    Math.abs(report.location.lng - coords.lng) < RADIUS
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER CHIP
═══════════════════════════════════════════════════════════════════════════ */
function FilterChip({ filter, active, onClick }) {
  return (
    <button
      className={`filter-chip filter-chip--${filter.color} ${active ? 'filter-chip--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {filter.label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPORT CARD
═══════════════════════════════════════════════════════════════════════════ */
function ReportCard({ report }) {
  // Use effective_urgency (NLP-adjusted) for the color, fall back to user urgency
  const displayUrgency = report.effective_urgency ?? report.urgency ?? 'low';
  const urgencyColor   = { high: 'red', moderate: 'amber', low: 'gray' }[displayUrgency] ?? 'gray';
  const statusColor    = report.status === 'resolved' ? 'green' : 'amber';

  const catLabel  = CAT_LABELS[report.category]  ?? report.category  ?? 'Unknown';
  const catType   = CAT_TYPE[report.category]    ?? 'General';
  const aiLabel   = CAT_LABELS[report.ai_category] ?? null;

  // Show an AI badge if NLP changed the category
  const showAIMismatch = report.category_mismatch && aiLabel;

  return (
    <article className={`report-card report-card--${urgencyColor}`}>
      <div className="report-card__top">
        <span className="report-card__category">{catLabel}</span>
        <span className={`status-pill status-pill--${statusColor}`}>
          {report.status === 'resolved' ? 'Resolved' : 'Pending'}
        </span>
      </div>

      {/* Location row */}
      {report.location && (
        <div className="report-card__loc">
          <IconPin />
          <span>
            {report.location.lat?.toFixed(4)}, {report.location.lng?.toFixed(4)}
          </span>
        </div>
      )}

      {/* Meta row */}
      <div className="report-card__meta">
        <span className="meta-tag">{catType}</span>
        <span className={`meta-tag meta-tag--${urgencyColor}`}>
          {displayUrgency === 'high'     ? 'High Severity' :
           displayUrgency === 'moderate' ? 'Moderate'      : 'Low Severity'}
        </span>

        {/* AI override badge — shown when NLP disagreed with user selection */}
        {showAIMismatch && (
          <span className="meta-tag meta-tag--ai" title={`AI classified as: ${aiLabel}`}>
            <IconAI /> AI: {aiLabel}
          </span>
        )}

        <span className="report-card__time">
          <IconClock />
          {timeAgo(report.timestamp)}
        </span>
      </div>

      {/* Description preview if available */}
      {report.description && (
        <p className="report-card__desc">"{report.description}"</p>
      )}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const navigate = useNavigate();
  const { coords } = useLocation();

  // ── Firestore state ────────────────────────────────────────────────────
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // ── Filter state ───────────────────────────────────────────────────────
  const [active, setActive] = useState({
    status:    null,
    urgency:   null,
    proximity: null,
    recency:   null,
  });

  // ── Load user's reports from Firestore in real-time ────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Query: only this user's reports, newest first
    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setFetchErr('Could not load reports. Please try again.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [navigate]);

  // ── Filter logic — runs client-side on the Firestore data ──────────────
  const filtered = useMemo(() => {
    return reports.filter(r => {
      // Status
      if (active.status && r.status !== active.status) return false;

      // Urgency — match against effective_urgency (NLP-adjusted) first
      if (active.urgency) {
        const urg = r.effective_urgency ?? r.urgency;
        if (urg !== active.urgency) return false;
      }

      // Proximity — within ~500m of user
      if (active.proximity === 'near_me' && !isNearMe(r, coords)) return false;

      // Recency
      if (active.recency === 'recent'     && !isRecent(r.timestamp))   return false;
      if (active.recency === 'late_night' && !isLateNight(r.timestamp)) return false;

      return true;
    });
  }, [reports, active, coords]);

  // ── Stats derived from full (unfiltered) dataset ───────────────────────
  const stats = useMemo(() => ({
    submitted:    reports.length,
    resolved:     reports.filter(r => r.status === 'resolved').length,
    aiProcessed:  reports.filter(r => r.ai_category != null).length,
  }), [reports]);

  // ── Helpers ────────────────────────────────────────────────────────────
  function toggleFilter(groupId, filterId) {
    setActive(prev => ({
      ...prev,
      [groupId]: prev[groupId] === filterId ? null : filterId,
    }));
  }

  function clearAll() {
    setActive({ status: null, urgency: null, proximity: null, recency: null });
  }

  const hasActiveFilters = Object.values(active).some(Boolean);

  /* ── JSX ── */
  return (
    <div className="reports-root">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="reports-header">
        <h1 className="reports-header__title">Your Reports</h1>
        <span className="reports-header__count">
          {loading ? '…' : `${reports.length} total`}
        </span>
      </header>

      <main className="reports-scroll">

        {/* ── IMPACT CARD ─────────────────────────────────────────────── */}
        <div className="impact-card">
          <div className="impact-card__title">
            Your impact
            <span className="impact-badge">All time</span>
          </div>
          <div className="impact-card__stats">
            <div className="impact-stat">
              <span className="impact-stat__num impact-stat__num--accent">
                {loading ? '—' : stats.submitted}
              </span>
              <span className="impact-stat__label">Reports filed</span>
            </div>
            <div className="impact-divider" aria-hidden="true" />
            <div className="impact-stat">
              <span className="impact-stat__num impact-stat__num--green">
                {loading ? '—' : stats.resolved}
              </span>
              <span className="impact-stat__label">Resolved</span>
            </div>
            <div className="impact-divider" aria-hidden="true" />
            <div className="impact-stat">
              <span className="impact-stat__num">
                {loading ? '—' : stats.aiProcessed}
              </span>
              <span className="impact-stat__label">NLP analysed</span>
            </div>
          </div>
        </div>

        {/* ── FILTERS ─────────────────────────────────────────────────── */}
        <div className="filter-section">
          <div className="filter-section__header">
            <span className="filter-section__label">Filter</span>
            {hasActiveFilters && (
              <button className="clear-btn" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          {FILTER_GROUPS.map(group => (
            <div key={group.id} className="filter-group">
              <span className="filter-group__label">{group.label}</span>
              <div className="filter-group__chips">
                {group.filters.map(filter => (
                  <FilterChip
                    key={filter.id}
                    filter={filter}
                    active={active[group.id] === filter.id}
                    onClick={() => toggleFilter(group.id, filter.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── REPORT LIST ─────────────────────────────────────────────── */}
        <div className="report-list">
          <div className="report-list__header">
            <span className="report-list__count">
              {loading ? 'Loading…' :
               filtered.length === reports.length
                 ? `All ${reports.length} report${reports.length !== 1 ? 's' : ''}`
                 : `${filtered.length} of ${reports.length} reports`}
            </span>
          </div>

          {/* Error state */}
          {fetchErr && (
            <div className="empty-state">
              <p className="empty-state__title">Something went wrong</p>
              <p className="empty-state__sub">{fetchErr}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !fetchErr && (
            <>
              <div className="report-card-skeleton" aria-hidden="true" />
              <div className="report-card-skeleton" aria-hidden="true" />
              <div className="report-card-skeleton" aria-hidden="true" />
            </>
          )}

          {/* No reports at all */}
          {!loading && !fetchErr && reports.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">No reports yet</p>
              <p className="empty-state__sub">
                Submit your first report from the map screen
              </p>
            </div>
          )}

          {/* Filter returned nothing */}
          {!loading && !fetchErr && reports.length > 0 && filtered.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">No reports match</p>
              <p className="empty-state__sub">Try clearing some filters</p>
              <button className="empty-clear-btn" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}

          {/* Real report cards */}
          {!loading && !fetchErr && filtered.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          {
            key: 'home', label: 'Map',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="2"  y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
                <rect x="13" y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              </svg>
            ),
          },
          {
            key: 'reports', label: 'Reports',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="11" cy="7.5" r="2.2"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
              </svg>
            ),
          },
          {
            key: 'profile', label: 'Profile',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
                <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            key: 'settings', label: 'Settings',
            icon: (a) => (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="3"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4"/>
                <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
                  stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map(({ key, label, icon }) => {
          const isActive = key === 'reports';
          return (
            <button
              key={key}
              className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => key !== 'reports' && navigate(`/${key}`)}
              aria-current={isActive ? 'page' : undefined}
            >
              {icon(isActive)}
              <span className="nav-item__label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}