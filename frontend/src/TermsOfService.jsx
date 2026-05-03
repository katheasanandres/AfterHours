import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

// TO BE FURTHER REFINED — currently a static page with placeholder text, but may eventually include dynamic content (e.g. version history, changelog, etc.)
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function TermsOfService() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toc-root ${mounted ? 'toc-root--in' : ''}`}>
      <header className="toc-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <IconBack />
        </button>
        <h1 className="header-title">Terms of Service</h1>
      </header>

      <div className="toc-content">
        <section className="toc-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing AfterHours, you agree to be bound by these terms. This PWA is a community-driven safety tool designed for awareness in Olongapo City.</p>
        </section>

        <section className="toc-section">
          <h2>2. User Responsibility</h2>
          <p>AfterHours provides "Vibe" scores and incident reports based on community data. Users must exercise their own judgment. We are not responsible for personal safety decisions made based on app data.</p>
        </section>

        <section className="toc-section">
          <h2>3. Anonymous Reporting</h2>
          <p>Reports are anonymous by default. You agree not to post false information, spam, or content that compromises the privacy of others.</p>
        </section>

        <section className="toc-section">
          <h2>4. Data Usage</h2>
          <p>Location data is used solely for real-time safety updates and heatmap generation. No personal identity data is sold or shared with third parties.</p>
        </section>

        <div className="toc-footer">
          <p>Last Updated: May 2026</p>
          <button className="toc-close-btn" onClick={() => navigate(-1)}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}