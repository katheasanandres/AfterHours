import { useEffect } from 'react';
import './Home.css';
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

// Leaflet Imports
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

/**
 * Component to render the Heatmap Layer
 * Points format: [lat, lng, intensity]
 */
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

function Home() {
  const position = [14.8348, 120.2821]; // Olongapo City center

  // Dummy Spatiotemporal Data
  // The 3rd value (0.2 - 1.0) represents the risk intensity from sentiment analysis
  const heatPoints = [
    [14.8350, 120.2830, 0.5],
    [14.8360, 120.2840, 0.2],
    [14.8340, 120.2810, 0.9], // High risk zone
    [14.8370, 120.2855, 0.6]
  ];

  return (
    <div className="home-container">
      {/* Top Header Section */}
      <header className="home-header">
        <h1 className="logo-text">After<span>Hours</span></h1>
        <div className="time-pill">
          <span className="dot"></span> 11 PM
        </div>
      </header>

      {/* Map Area with Integrated Leaflet & Heatmap */}
      <div className="map-view">
        <MapContainer 
          center={position} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          {/* Free Dark Mode Tiles (No API Key Required) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <HeatmapLayer points={heatPoints} />
        </MapContainer>

        {/* Floating UI Elements over Map */}
        <div className="alert-banner">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>High-risk zone ahead</strong>
            <p>Poor lighting • 5 reports last 2 hrs</p>
          </div>
          <button className="close-btn">×</button>
        </div>
        
        {/* The "User" blue dot (CSS-based overlay) */}
        <div className="user-location-dot">
          <div className="pulse"></div>
        </div>

        <div className="legend-box">
          <div className="legend-item"><span className="dot high"></span> High</div>
          <div className="legend-item"><span className="dot mid"></span> Mid</div>
          <div className="legend-item"><span className="dot safe"></span> Safe</div>
        </div>
      </div>

      {/* Bottom Action Sheet (The "Area Vibe" section) */}
      <div className="action-sheet">
        <div className="handle"></div>
        
        <div className="vibe-header">
          <span className="vibe-title">AREA VIBE NOW</span>
          <div className="risk-score">7.1 / 10 risk</div>
        </div>

        <div className="tags-container">
          <span className="tag danger">Poor lighting</span>
          <span className="tag danger">Loitering</span>
          <span className="tag warning">Isolated path</span>
          <span className="tag neutral">31 reports</span>
        </div>

        <div className="action-buttons">
          <button className="report-main-btn">
            <span className="report-icon">ⓘ</span> Report Incident
          </button>
          <button className="square-icon-btn">⌖</button>
          <button className="square-icon-btn">📍</button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <div className="nav-item active">
          <span className="nav-icon">⊞</span>
          <span className="nav-label">Map</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">📍</span>
          <span className="nav-label">Reports</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">☼</span>
          <span className="nav-label">Settings</span>
        </div>

        <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
      </nav>
    </div>
  );
}

export default Home;