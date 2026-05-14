import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import { useLocation } from './hooks/UseLocation';
import { getReporterId } from './reporterId';
import './Reports.css';

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════════ */
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
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
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M3 7.5L6 10.5L12 4.5" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const FILTER_GROUPS = [
  {
    id: 'status', label: 'Status',
    filters: [
      { id: 'pending',  label: 'Pending',  color: 'amber' },
      { id: 'resolved', label: 'Resolved', color: 'green' },
    ],
  },
  {
    id: 'urgency', label: 'Urgency',
    filters: [
      { id: 'high',     label: 'High Severity', color: 'red'   },
      { id: 'moderate', label: 'Moderate',       color: 'amber' },
      { id: 'low',      label: 'Low Severity',   color: 'gray'  },
    ],
  },
  {
    id: 'proximity', label: 'Proximity',
    filters: [
      { id: 'near_me', label: 'Near Me (500m)', color: 'blue' },
    ],
  },
  {
    id: 'recency', label: 'Recency',
    filters: [
      { id: 'recent',     label: 'Last 24 hrs',           color: 'blue'   },
      { id: 'late_night', label: 'Late Night (10PM–4AM)', color: 'purple' },
    ],
  },
];

const CAT_LABELS = {
  poor_lighting:         'Poor Lighting',
  loitering:             'Suspicious Loitering',
  catcalling:            'Catcalling / Harassment',
  broken_infrastructure: 'Broken Infrastructure',
  unsafe_vehicle:        'Unsafe / Reckless Vehicle',
  no_bystanders:         'Isolated / No Bystanders',
  other:                 'Other',
};

const CAT_TYPE = {
  poor_lighting:         'Environmental',
  loitering:             'Social',
  catcalling:            'Social',
  broken_infrastructure: 'Environmental',
  unsafe_vehicle:        'Social',
  no_bystanders:         'Environmental',
  other:                 'General',
};

const CAT_EMOJI = {
  poor_lighting:         '🔦',
  loitering:             '👥',
  catcalling:            '📢',
  broken_infrastructure: '🚧',
  unsafe_vehicle:        '🚗',
  no_bystanders:         '🏚️',
  other:                 '⚠️',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function fullDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function isLateNight(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const h = date.getHours();
  return h >= 22 || h < 4;
}

function isRecent(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return (Date.now() - date.getTime()) < 86400 * 1000;
}

function isNearMe(report, coords) {
  if (!coords || !report.location?.lat || !report.location?.lng) return false;
  const RADIUS = 0.0045;
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
function ReportCard({ report, onTap }) {
  const displayUrgency = report.effective_urgency ?? report.urgency ?? 'low';
  const urgencyColor   = { high: 'red', moderate: 'amber', low: 'gray' }[displayUrgency] ?? 'gray';
  const statusColor    = report.status === 'resolved' ? 'green' : 'amber';
  const catLabel       = CAT_LABELS[report.category]    ?? report.category    ?? 'Unknown';
  const catType        = CAT_TYPE[report.category]      ?? 'General';
  const aiLabel        = CAT_LABELS[report.ai_category] ?? null;
  const showAIMismatch = report.category_mismatch && aiLabel;

  return (
    <article
      className={`report-card report-card--${urgencyColor} report-card--tappable`}
      onClick={() => onTap(report)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onTap(report)}
      aria-label={`View details for ${catLabel} report`}
    >
      <div className="report-card__top">
        <span className="report-card__category">{catLabel}</span>
        <div className="report-card__top-right">
          <span className={`status-pill status-pill--${statusColor}`}>
            {report.status === 'resolved' ? 'Resolved' : 'Pending'}
          </span>
          <span className="report-card__chevron"><IconChevronRight /></span>
        </div>
      </div>

      {report.location && (
        <div className="report-card__loc">
          <IconPin />
          <span>{report.location.lat?.toFixed(4)}, {report.location.lng?.toFixed(4)}</span>
        </div>
      )}

      <div className="report-card__meta">
        <span className="meta-tag">{catType}</span>
        <span className={`meta-tag meta-tag--${urgencyColor}`}>
          {displayUrgency === 'high' ? 'High Severity' :
           displayUrgency === 'moderate' ? 'Moderate' : 'Low Severity'}
        </span>
        {showAIMismatch && (
          <span className="meta-tag meta-tag--ai" title={`AI classified as: ${aiLabel}`}>
            <IconAI /> AI: {aiLabel}
          </span>
        )}
        <span className="report-card__time">
          <IconClock />{timeAgo(report.timestamp)}
        </span>
      </div>

      {report.description && (
        <p className="report-card__desc">"{report.description}"</p>
      )}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPORT DETAIL SHEET
═══════════════════════════════════════════════════════════════════════════ */
function ReportDetailSheet({ report, onClose, onResolved }) {
  const [visible,    setVisible]    = useState(false);
  const [resolving,  setResolving]  = useState(false);
  const [resolveErr, setResolveErr] = useState('');

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

  // ── Mark as Resolved ──────────────────────────────────────────────────
  // Only the reporter can do this — the query already filters by
  // reporter_id so only their own reports appear in this list.
  const handleResolve = useCallback(async () => {
    setResolving(true);
    setResolveErr('');
    try {
      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
      // Notify parent so it can update selectedReport from fresh Firestore data
      onResolved(report.id);
      handleClose();
    } catch (err) {
      console.error('Failed to resolve report:', err);
      setResolveErr('Could not update report. Please try again.');
      setResolving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id, onResolved]);

  if (!report) return null;

  const displayUrgency = report.effective_urgency ?? report.urgency ?? 'low';
  const urgencyColor   = { high: 'red', moderate: 'amber', low: 'gray' }[displayUrgency] ?? 'gray';
  const statusColor    = report.status === 'resolved' ? 'green' : 'amber';
  const catLabel       = CAT_LABELS[report.category]    ?? report.category    ?? 'Unknown';
  const catType        = CAT_TYPE[report.category]      ?? 'General';
  const catEmoji       = CAT_EMOJI[report.category]     ?? '⚠️';
  const aiCatLabel     = CAT_LABELS[report.ai_category] ?? report.ai_category ?? null;
  const aiUrgLabel     = report.ai_urgency
    ? report.ai_urgency.charAt(0).toUpperCase() + report.ai_urgency.slice(1)
    : null;
  const urgencyLabel   = displayUrgency === 'high' ? 'High Severity'
                       : displayUrgency === 'moderate' ? 'Moderate' : 'Low Severity';
  const isPending      = report.status !== 'resolved';

  return (
    <div
      className={`detail-overlay ${visible ? 'detail-overlay--in' : ''}`}
      onClick={handleOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Report details"
    >
      <div className={`detail-sheet ${visible ? 'detail-sheet--in' : ''}`}>

        <div className="detail-handle" aria-hidden="true" />

        <div className="detail-header">
          <div className="detail-header__emoji" aria-hidden="true">{catEmoji}</div>
          <div className="detail-header__text">
            <h2 className="detail-header__title">{catLabel}</h2>
            <p className="detail-header__type">{catType}</p>
          </div>
          <button className="detail-close" onClick={handleClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="detail-badges">
          <span className={`detail-badge detail-badge--${statusColor}`}>
            {report.status === 'resolved' ? '✓ Resolved' : '⏳ Pending'}
          </span>
          <span className={`detail-badge detail-badge--${urgencyColor}`}>
            {urgencyLabel}
          </span>
        </div>

        <div className="detail-body">

          {/* When */}
          <div className="detail-section">
            <p className="detail-section__label">Date &amp; Time</p>
            <p className="detail-section__value">{fullDateTime(report.timestamp)}</p>
            {isLateNight(report.timestamp) && (
              <span className="detail-tag detail-tag--purple">🌙 Late Night</span>
            )}
            {isRecent(report.timestamp) && (
              <span className="detail-tag detail-tag--blue">🕐 Within 24 hrs</span>
            )}
          </div>

          {/* Where */}
          {report.location && (
            <div className="detail-section">
              <p className="detail-section__label">Location</p>
              <p className="detail-section__value detail-section__value--mono">
                {report.location.lat?.toFixed(6)}, {report.location.lng?.toFixed(6)}
              </p>
              <a
                className="detail-map-link"
                href={`https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Google Maps ↗
              </a>
            </div>
          )}

          {/* Description */}
          <div className="detail-section">
            <p className="detail-section__label">Your description</p>
            {report.description
              ? <p className="detail-section__desc">"{report.description}"</p>
              : <p className="detail-section__empty">No description provided</p>
            }
          </div>

          {/* NLP Analysis */}
          <div className="detail-section">
            <p className="detail-section__label">AI Analysis</p>
            <div className="detail-nlp-card">
              <div className="detail-nlp-row">
                <span className="detail-nlp-key">Category detected</span>
                <span className={`detail-nlp-val ${report.category_mismatch ? 'detail-nlp-val--mismatch' : 'detail-nlp-val--match'}`}>
                  {aiCatLabel ?? '—'}
                  {report.category_mismatch && (
                    <span className="detail-nlp-note"> (differs from your pick)</span>
                  )}
                </span>
              </div>
              <div className="detail-nlp-row">
                <span className="detail-nlp-key">Urgency detected</span>
                <span className={`detail-nlp-val ${report.urgency_mismatch ? 'detail-nlp-val--mismatch' : 'detail-nlp-val--match'}`}>
                  {aiUrgLabel ?? '—'}
                  {report.urgency_mismatch && (
                    <span className="detail-nlp-note"> (differs from your pick)</span>
                  )}
                </span>
              </div>
              <div className="detail-nlp-row">
                <span className="detail-nlp-key">Effective urgency</span>
                <span className="detail-nlp-val">
                  {report.effective_urgency
                    ? report.effective_urgency.charAt(0).toUpperCase() + report.effective_urgency.slice(1)
                    : '—'}
                  <span className="detail-nlp-note"> (used on heatmap)</span>
                </span>
              </div>
              <div className="detail-nlp-row">
                <span className="detail-nlp-key">Category confidence</span>
                <span className="detail-nlp-val">
                  {report.category_confidence != null
                    ? `${Math.round(report.category_confidence * 100)}%`
                    : '—'}
                </span>
              </div>
              <div className="detail-nlp-row">
                <span className="detail-nlp-key">Urgency confidence</span>
                <span className="detail-nlp-val">
                  {report.urgency_confidence != null
                    ? `${Math.round(report.urgency_confidence * 100)}%`
                    : '—'}
                </span>
              </div>
              {report.low_confidence && (
                <p className="detail-nlp-disclaimer">
                  ⚠️ No description was provided — AI ran on the category label only.
                  Confidence is lower than usual.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="detail-footer">
          {resolveErr && (
            <p className="detail-resolve-err" role="alert">⚠️ {resolveErr}</p>
          )}

          {/* Mark as Resolved — only visible on pending reports.
              Since this page only shows the current user's own reports
              (queried by reporter_id), only the reporter sees this button. */}
          {isPending && (
            <button
              className={`detail-footer-btn detail-footer-btn--resolve
                ${resolving ? 'detail-footer-btn--loading' : ''}`}
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <>
                  <span className="detail-spinner" aria-hidden="true" />
                  <span>Marking resolved…</span>
                </>
              ) : (
                <><IconCheck /><span>Mark as Resolved</span></>
              )}
            </button>
          )}

          <button className="detail-footer-btn" onClick={handleClose}>
            {isPending ? 'Close' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const navigate = useNavigate();
  const { coords } = useLocation();

  const [reports,        setReports]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [fetchErr,       setFetchErr]       = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [active, setActive] = useState({
    status: null, urgency: null, proximity: null, recency: null,
  });

  // ── Real-time Firestore query by reporter_id ────────────────────────────
  // reporter_id is the anonymous localStorage ID — not the Firebase UID.
  // This ensures only the reporter who submitted the report can see and
  // resolve it, while keeping the system anonymous.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/login'); return; }

    const reporterId = getReporterId();
    if (!reporterId) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const q = query(
      collection(db, 'reports'),
      where('reporter_id', '==', reporterId),
      orderBy('timestamp', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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

  // ── Keep selectedReport in sync with live Firestore data ───────────────
  // ESLint fix: selectedReport.id is the only dependency we actually
  // need — we look it up in the latest reports[] every time either changes.
  // Using the full selectedReport object as a dep caused cascading renders.
  const selectedReportId = selectedReport?.id ?? null;

  useEffect(() => {
    if (!selectedReportId) return;
    const updated = reports.find(r => r.id === selectedReportId);
    if (updated) {
      setTimeout(() => {
        setSelectedReport(prev =>
          JSON.stringify(prev) !== JSON.stringify(updated) ? updated : prev
        );
      }, 0);
    }
  }, [reports, selectedReportId]);

  // ── Called by ReportDetailSheet after a successful resolve ─────────────
  // Closes the sheet — Firestore onSnapshot will push the status update
  // automatically so the card re-renders to "Resolved" on its own.
  const handleResolved = useCallback((resolvedId) => {
    setSelectedReport(prev => {
      if (prev?.id === resolvedId) return null;
      return prev;
    });
  }, []);

  // ── Client-side filtering ──────────────────────────────────────────────
  const filtered = useMemo(() => reports.filter(r => {
    if (active.status && r.status !== active.status) return false;
    if (active.urgency) {
      if ((r.effective_urgency ?? r.urgency) !== active.urgency) return false;
    }
    if (active.proximity === 'near_me'    && !isNearMe(r, coords))      return false;
    if (active.recency   === 'recent'     && !isRecent(r.timestamp))    return false;
    if (active.recency   === 'late_night' && !isLateNight(r.timestamp)) return false;
    return true;
  }), [reports, active, coords]);

  const stats = useMemo(() => ({
    submitted:   reports.length,
    resolved:    reports.filter(r => r.status === 'resolved').length,
    aiProcessed: reports.filter(r => r.ai_category != null).length,
  }), [reports]);

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

  return (
    <div className="reports-root">

      <header className="reports-header">
        <button className="back-btn" onClick={() => navigate('/home')} aria-label="Back to map">
          <IconBack />
        </button>
        <h1 className="reports-header__title">Your Reports</h1>
        <div style={{ width: '36px' }} aria-hidden="true" />
      </header>

      <main className="reports-scroll">

        {/* Impact card */}
        <div className="impact-card">
          <div className="impact-card__title">
            Your impact <span className="impact-badge">All time</span>
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

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-section__header">
            <span className="filter-section__label">Filter</span>
            {hasActiveFilters && (
              <button className="clear-btn" onClick={clearAll}>Clear all</button>
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

        {/* Report list */}
        <div className="report-list">
          <div className="report-list__header">
            <span className="report-list__count">
              {loading ? 'Loading…' :
               filtered.length === reports.length
                 ? `All ${reports.length} report${reports.length !== 1 ? 's' : ''}`
                 : `${filtered.length} of ${reports.length} reports`}
            </span>
            {!loading && reports.length > 0 && (
              <span className="report-list__hint">Tap a report for details</span>
            )}
          </div>

          {fetchErr && (
            <div className="empty-state">
              <p className="empty-state__title">Something went wrong</p>
              <p className="empty-state__sub">{fetchErr}</p>
            </div>
          )}

          {loading && !fetchErr && (
            <>
              <div className="report-card-skeleton" aria-hidden="true" />
              <div className="report-card-skeleton" aria-hidden="true" />
              <div className="report-card-skeleton" aria-hidden="true" />
            </>
          )}

          {!loading && !fetchErr && reports.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">No reports yet</p>
              <p className="empty-state__sub">Submit your first report from the map screen</p>
            </div>
          )}

          {!loading && !fetchErr && reports.length > 0 && filtered.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">No reports match</p>
              <p className="empty-state__sub">Try clearing some filters</p>
              <button className="empty-clear-btn" onClick={clearAll}>Clear filters</button>
            </div>
          )}

          {!loading && !fetchErr && filtered.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onTap={setSelectedReport}
            />
          ))}
        </div>

        <div style={{ height: '24px' }} aria-hidden="true" />
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { key: 'home',     label: 'Map',      icon: (a) => (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              <rect x="13" y="2"  width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              <rect x="2"  y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
              <rect x="13" y="13" width="7" height="7" rx="1.5" fill={a ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
            </svg>
          )},
          { key: 'reports',  label: 'Reports',  icon: (a) => (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinejoin="round"/>
              <circle cx="11" cy="7.5" r="2.2"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
            </svg>
          )},
          { key: 'profile',  label: 'Profile',  icon: (a) => (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="8" r="4"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
              <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )},
          { key: 'settings', label: 'Settings', icon: (a) => (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="3"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4"/>
              <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
                stroke={a ? 'var(--accent)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )},
        ].map(({ key, label, icon }) => {
          const isActive = key === 'reports';
          return (
            <button key={key}
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

      {/* Detail sheet */}
      {selectedReport && (
        <ReportDetailSheet
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}