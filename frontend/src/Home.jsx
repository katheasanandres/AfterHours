import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useLocation } from './hooks/useLocation';
import ReportModal from './ReportModal';
import './Home.css';

/* ═══════════════════════════════════════════════════════════════════════════
   MAP SUB-COMPONENTS
   These live outside Home() so they don't re-mount on every render.
═══════════════════════════════════════════════════════════════════════════ */

/** Renders the risk heatmap layer inside the Leaflet map context */
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points?.length) return;

    const layer = L.heatLayer(points, {
      radius:  28,
      blur:    18,
      maxZoom: 17,
      gradient: {
        0.0: 'rgba(34,197,94,0)',
        0.3: '#22C55E',   // green  — low risk
        0.6: '#F59E0B',   // amber  — moderate
        1.0: '#E03E2D',   // red    — high risk
      },
    }).addTo(map);

    return () => map.removeLayer(layer);
  }, [map, points]);

  return null;
}

/** Blinking blue dot at the user's real GPS position */
function UserDot({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const icon = L.divIcon({
      className: '',
      html: '<div class="user-dot"><div class="user-dot__pulse"></div></div>',
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker(position, { icon, zIndexOffset: 1000 }).addTo(map);
    return () => map.removeLayer(marker);
  }, [map, position]);

  return null;
}

/**
 * Exposes the Leaflet map instance to the parent via a ref.
 * Parent calls mapRef.current.flyTo([lat, lng]) to re-center.
 */
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ICONS
═══════════════════════════════════════════════════════════════════════════ */
const NavIconMap = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
    <rect x="13" y="2"  width="7" height="7" rx="1.5" fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
    <rect x="2"  y="13" width="7" height="7" rx="1.5" fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
    <rect x="13" y="13" width="7" height="7" rx="1.5" fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.25)'}/>
  </svg>
);
const NavIconReports = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C7.5 2 5 4.5 5 7.5C5 12 11 20 11 20C11 20 17 12 17 7.5C17 4.5 14.5 2 11 2Z"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4" strokeLinejoin="round"/>
    <circle cx="11" cy="7.5" r="2.2"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4"/>
  </svg>
);
const NavIconProfile = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="4"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4"/>
    <path d="M4 20C4 16.7 7.1 14 11 14C14.9 14 18 16.7 18 20"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const NavIconSettings = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="3"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4"/>
    <path d="M11 2V4.5M11 17.5V20M2 11H4.5M17.5 11H20M4.9 4.9L6.7 6.7M15.3 15.3L17.1 17.1M4.9 17.1L6.7 15.3M15.3 6.7L17.1 4.9"
      stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  const [activeNav,    setActiveNav]    = useState('map');
  const [alertVisible, setAlertVisible] = useState(true);
  const [currentTime,  setCurrentTime]  = useState('');
  const [reportOpen,   setReportOpen]   = useState(false);

  // Ref to the Leaflet map instance — used by the re-center button
  const mapRef = useRef(null);

  // ── Real GPS coords from the custom hook ──────────────────────────────
  const { coords, error: locationError, loading: locationLoading } = useLocation();

  const mapCenter = coords
    ? [coords.lat, coords.lng]
    : [14.8348, 120.2821];

  // ── Real-time heatmap data from Firestore ─────────────────────────────
  const [heatPoints, setHeatPoints] = useState([]);
  const [allReports, setAllReports] = useState([]); // raw docs for vibe calc

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const points  = [];
      const reports = [];

      snapshot.forEach(doc => {
        const d = doc.data();
        reports.push(d);
        if (d.location?.lat && d.location?.lng) {
          // Use effective_urgency (NLP-adjusted) if available, else fall back
          const urgency  = d.effective_urgency ?? d.urgency ?? 'low';
          const intensity = { high: 1.0, moderate: 0.55, low: 0.25 }[urgency] ?? 0.4;
          points.push([d.location.lat, d.location.lng, intensity]);
        }
      });

      setHeatPoints(points);
      setAllReports(reports);
    });

    return () => unsub();
  }, []);

  // ── Dynamic area vibe ──────────────────────────────────────────────────
  // Calculates a risk score and dominant tags from reports within ~500m
  // of the user. Falls back to all reports if coords unavailable.
  const areaVibe = useCallback(() => {
    if (!allReports.length) return null;

    // Filter to reports within ~500m (roughly 0.005 degrees lat/lng)
    const RADIUS = 0.005;
    const nearby = coords
      ? allReports.filter(r =>
          r.location?.lat && r.location?.lng &&
          Math.abs(r.location.lat - coords.lat) < RADIUS &&
          Math.abs(r.location.lng - coords.lng) < RADIUS
        )
      : allReports;

    const pool = nearby.length > 0 ? nearby : allReports;

    // Risk score: weighted average of effective_urgency values (0–10 scale)
    const weights = { high: 10, moderate: 5.5, low: 2.5 };
    const total   = pool.reduce((sum, r) => {
      const u = r.effective_urgency ?? r.urgency ?? 'low';
      return sum + (weights[u] ?? 2.5);
    }, 0);
    const score = (total / pool.length).toFixed(1);

    // Dominant categories — top 3 most reported
    const catCount = {};
    pool.forEach(r => {
      const cat = r.ai_category ?? r.category ?? 'other';
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    });
    const topCats = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Overall urgency level for the score badge color
    const highCount = pool.filter(r =>
      (r.effective_urgency ?? r.urgency) === 'high').length;
    const modCount  = pool.filter(r =>
      (r.effective_urgency ?? r.urgency) === 'moderate').length;
    const level = highCount > pool.length * 0.4 ? 'high'
                : modCount  > pool.length * 0.4 ? 'moderate'
                : 'low';

    return { score, topCats, level, count: pool.length };
  }, [allReports, coords]);

  const vibe = areaVibe();

  // Human-readable category labels
  const CAT_LABELS = {
    poor_lighting:         'Poor lighting',
    loitering:             'Loitering',
    catcalling:            'Harassment',
    broken_infrastructure: 'Broken infra',
    unsafe_vehicle:        'Unsafe vehicle',
    no_bystanders:         'Isolated area',
    other:                 'Other',
  };

  // Tag color by category type
  const CAT_TAG_COLOR = {
    poor_lighting:         'tag--amber',
    loitering:             'tag--red',
    catcalling:            'tag--red',
    broken_infrastructure: 'tag--amber',
    unsafe_vehicle:        'tag--red',
    no_bystanders:         'tag--gray',
    other:                 'tag--gray',
  };

  // Score badge class
  const SCORE_CLASS = {
    high:     'vibe-row__score--high',
    moderate: 'vibe-row__score--mid',
    low:      'vibe-row__score--safe',
  };

  // ── Re-center button ───────────────────────────────────────────────────
  function handleRecenter() {
    if (mapRef.current && coords) {
      mapRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });
    }
  }

  // ── Live clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Navigation handler ─────────────────────────────────────────────────
  function handleNav(key) {
    setActiveNav(key);
    if (key !== 'map') navigate(`/${key}`);
  }

  /* ── JSX ── */
  return (
    <div className="home-root">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="home-header">
        <h1 className="home-logo">After<span>Hours</span></h1>

        <div className="header-right">
          {/* show a subtle indicator if GPS is loading or errored */}
          {locationLoading && (
            <span className="location-status location-status--loading">
              Locating…
            </span>
          )}
          {locationError && !locationLoading && (
            <span className="location-status location-status--error" title={locationError}>
              📍 GPS off
            </span>
          )}

          <div className="time-chip">
            <span className="time-chip__dot" aria-hidden="true" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* ── MAP AREA ────────────────────────────────────────────────────── */}
      <div className="map-area">
        <MapContainer
          center={mapCenter}
          zoom={15}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <HeatmapLayer points={heatPoints} />
          <UserDot position={mapCenter} />
          <MapController mapRef={mapRef} />
        </MapContainer>

        {/* Floating alert banner */}
        {alertVisible && (
          <div className="alert-banner" role="alert">
            <div className="alert-banner__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L12.5 11H1.5L7 1.5Z"
                  stroke="#ff6b4a" strokeWidth="1.2" strokeLinejoin="round"/>
                <line x1="7" y1="6" x2="7" y2="9"
                  stroke="#ff6b4a" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="7" cy="10.5" r="0.6" fill="#ff6b4a"/>
              </svg>
            </div>
            <div className="alert-banner__body">
              <strong>High-risk zone ahead</strong>
              <p>Poor lighting · 5 reports in last 2 hrs</p>
            </div>
            <button
              className="alert-banner__close"
              onClick={() => setAlertVisible(false)}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        )}

        {/* Risk legend */}
        <div className="map-legend" aria-label="Risk level legend">
          <div className="map-legend__item">
            <span className="map-legend__dot map-legend__dot--high" />
            <span>High</span>
          </div>
          <div className="map-legend__item">
            <span className="map-legend__dot map-legend__dot--mid" />
            <span>Mid</span>
          </div>
          <div className="map-legend__item">
            <span className="map-legend__dot map-legend__dot--safe" />
            <span>Safe</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────────── */}
      <div className="bottom-sheet">
        <div className="bottom-sheet__handle" aria-hidden="true" />

        <div className="vibe-row">
          <span className="vibe-row__label">Area vibe now</span>
          {vibe ? (
            <span className={`vibe-row__score ${SCORE_CLASS[vibe.level]}`}>
              {vibe.score} / 10 risk
            </span>
          ) : (
            <span className="vibe-row__score vibe-row__score--empty">
              No reports yet
            </span>
          )}
        </div>

        <div className="tag-row">
          {vibe?.topCats.map(cat => (
            <span key={cat} className={`tag ${CAT_TAG_COLOR[cat] ?? 'tag--gray'}`}>
              {CAT_LABELS[cat] ?? cat}
            </span>
          ))}
          <span className="tag tag--gray">
            {vibe ? `${vibe.count} report${vibe.count !== 1 ? 's' : ''}` : '0 reports'}
          </span>
        </div>

        <div className="action-row">
          <button className="btn-report" onClick={() => setReportOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="7.5" y1="5" x2="7.5" y2="8.2"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7.5" cy="10" r="0.7" fill="currentColor"/>
            </svg>
            Report Incident
          </button>

          <button
            className="btn-icon"
            onClick={handleRecenter}
            aria-label="Re-center map on my location"
            title={coords ? 'Re-center on my location' : 'Location unavailable'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="9" y1="1" x2="9" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="9" y1="14" x2="9" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="1" y1="9" x2="4" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="14" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { key: 'map',      label: 'Map',      Icon: NavIconMap      },
          { key: 'reports',  label: 'Reports',  Icon: NavIconReports  },
          { key: 'profile',  label: 'Profile',  Icon: NavIconProfile  },
          { key: 'settings', label: 'Settings', Icon: NavIconSettings },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-item ${activeNav === key ? 'nav-item--active' : ''}`}
            onClick={() => handleNav(key)}
            aria-current={activeNav === key ? 'page' : undefined}
          >
            <Icon active={activeNav === key} />
            <span className="nav-item__label">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── REPORT MODAL ────────────────────────────────────────────────── */}
      {reportOpen && (
        <ReportModal
          onClose={() => setReportOpen(false)}
          userCoords={coords}
        />
      )}

    </div>
  );
}