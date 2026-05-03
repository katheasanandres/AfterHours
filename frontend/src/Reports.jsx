import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Reports.css';

/*  ₊˚ ✧ ━━━━⊱ SVG Icons ⊰━━━━ ✧ ₊˚  */
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

/* FILTER CONFIG */
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
      { id: 'recent',    label: 'Last 24 hrs',       color: 'blue'   },
      { id: 'late_night', label: 'Late Night (10PM–4AM)', color: 'purple' },
    ],
  },
];

/* * ₊˚ ✧ ━━━━⊱ Placeholder report data ⊰━━━━ ✧ ₊˚ * */
/* TODO (backend): replace with Firestore query filtered by uid + active filters */
const DUMMY_REPORTS = [
  {
    id: 'r1',
    category:  'Poor Lighting',
    type:      'Environmental',
    location:  'Magsaysay Ave · near overpass',
    timeLabel: '2 hrs ago',
    status:    'pending',
    urgency:   'high',
    isNearMe:  true,
    isRecent:  true,
    isLateNight: false,
  },
  {
    id: 'r2',
    category:  'Suspicious Loitering',
    type:      'Social',
    location:  'Gordon Ave · corner alley',
    timeLabel: 'Yesterday',
    status:    'resolved',
    urgency:   'moderate',
    isNearMe:  true,
    isRecent:  false,
    isLateNight: true,
  },
  {
    id: 'r3',
    category:  'Broken Streetlight',
    type:      'Environmental',
    location:  'Rizal Ave · near school gate',
    timeLabel: '3 days ago',
    status:    'resolved',
    urgency:   'low',
    isNearMe:  false,
    isRecent:  false,
    isLateNight: false,
  },
  {
    id: 'r4',
    category:  'Catcalling',
    type:      'Social',
    location:  'National Highway · bus stop',
    timeLabel: '1 hr ago',
    status:    'pending',
    urgency:   'moderate',
    isNearMe:  true,
    isRecent:  true,
    isLateNight: true,
  },
  {
    id: 'r5',
    category:  'Unlit Pathway',
    type:      'Environmental',
    location:  'Kalaklan Area · riverside walk',
    timeLabel: '5 hrs ago',
    status:    'pending',
    urgency:   'high',
    isNearMe:  false,
    isRecent:  true,
    isLateNight: true,
  },
];

/* * ₊˚ ✧ ━━━━⊱ Filter logic ⊰━━━━ ✧ ₊˚ * */
function applyFilters(reports, active) {
  return reports.filter(r => {
    if (active.status    && r.status  !== active.status)  return false;
    if (active.urgency   && r.urgency !== active.urgency) return false;
    if (active.proximity === 'near_me'    && !r.isNearMe)   return false;
    if (active.recency   === 'recent'     && !r.isRecent)   return false;
    if (active.recency   === 'late_night' && !r.isLateNight) return false;
    return true;
  });
}

/* FILTER CHIP */
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

/* REPORT CARD */
function ReportCard({ report }) {
  const urgencyColor = {
    high:     'red',
    moderate: 'amber',
    low:      'gray',
  }[report.urgency];

  const statusColor = report.status === 'resolved' ? 'green' : 'amber';

  return (
    <article className={`report-card report-card--${urgencyColor}`}>
      <div className="report-card__top">
        <span className="report-card__category">{report.category}</span>
        <span className={`status-pill status-pill--${statusColor}`}>
          {report.status === 'resolved' ? 'Resolved' : 'Pending'}
        </span>
      </div>

      <div className="report-card__loc">
        <IconPin />
        <span>{report.location}</span>
      </div>

      <div className="report-card__meta">
        <span className="meta-tag">{report.type}</span>
        <span className={`meta-tag meta-tag--${urgencyColor}`}>
          {report.urgency === 'high'     ? 'High Severity' :
           report.urgency === 'moderate' ? 'Moderate'      : 'Low Severity'}
        </span>
        <span className="report-card__time">
          <IconClock />
          {report.timeLabel}
        </span>
      </div>
    </article>
  );
}

/* * ₊˚ ✧ ━━━━⊱ MAIN COMPONENTS ⊰━━━━ ✧ ₊˚ */
export default function Reports() {
  const navigate = useNavigate();

  const [active, setActive] = useState({
    status:    null,
    urgency:   null,
    proximity: null,
    recency:   null,
  });

  /* toggle: selecting the same chip again clears that group */
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
  const filtered = applyFilters(DUMMY_REPORTS, active);
  const totalReports = DUMMY_REPORTS.length;

  /* ── Stats (derived from full dataset, not filtered) ─────────────────── */
  const stats = {
    submitted:  totalReports,
    verified:   DUMMY_REPORTS.filter(r => r.status === 'resolved').length,
    usersReached: '4.2k',
  };

  return (
    <div className="reports-root">

      {/* * ₊˚ ✧ ━━━━⊱ HEADER ⊰━━━━ ✧ ₊˚ * */}
      <header className="reports-header">
        <h1 className="reports-header__title">Your Reports</h1>
        <span className="reports-header__count">{totalReports} total</span>
      </header>

      <main className="reports-scroll">

        {/* * ₊˚ ✧ ━━━━⊱ IMPACT CARD ⊰━━━━ ✧ ₊˚ * */}
        <div className="impact-card">
          <div className="impact-card__title">
            Your impact
            <span className="impact-badge">This month</span>
          </div>
          <div className="impact-card__stats">
            <div className="impact-stat">
              <span className="impact-stat__num impact-stat__num--accent">
                {stats.submitted}
              </span>
              <span className="impact-stat__label">Reports filed</span>
            </div>
            <div className="impact-divider" aria-hidden="true" />
            <div className="impact-stat">
              <span className="impact-stat__num impact-stat__num--green">
                {stats.verified}
              </span>
              <span className="impact-stat__label">Resolved</span>
            </div>
            <div className="impact-divider" aria-hidden="true" />
            <div className="impact-stat">
              <span className="impact-stat__num">
                {stats.usersReached}
              </span>
              <span className="impact-stat__label">Users reached</span>
            </div>
          </div>
        </div>

        {/* * ₊˚ ✧ ━━━━⊱ FILTERS ⊰━━━━ ✧ ₊˚ * */}
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

        {/* * ₊˚ ✧ ━━━━⊱ REPORT LIST ⊰━━━━ ✧ ₊˚ * */}
        <div className="report-list">
          <div className="report-list__header">
            <span className="report-list__count">
              {filtered.length === totalReports
                ? `All ${totalReports} reports`
                : `${filtered.length} of ${totalReports} reports`}
            </span>
          </div>

          {filtered.length > 0 ? (
            filtered.map(report => (
              <ReportCard key={report.id} report={report} />
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No reports match</p>
              <p className="empty-state__sub">Try clearing some filters</p>
              <button className="empty-clear-btn" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* * ₊˚ ✧ ━━━━⊱ BOTTOM NAV ⊰━━━━ ✧ ₊˚ * */}
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