import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

/* ─── Keys ─── */
const TOKEN_KEY = "ah_token";
const TOS_KEY   = "ah_tos_accepted";

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════════ */
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.5L2 4V8C2 11.3 4.7 14.3 8 15C11.3 14.3 14 11.3 14 8V4L8 1.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2 15C2 12.2 4.7 10 8 10C11.3 10 14 12.2 14 15"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconFlag = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 2V14M3 2H12L10 6H13L11 10H3" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconDatabase = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 4V8C3 9.1 5.2 10 8 10C10.8 10 13 9.1 13 8V4" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 8V12C3 13.1 5.2 14 8 14C10.8 14 13 13.1 13 12V8" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="8" cy="11.5" r="0.7" fill="currentColor"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5.5 7V5.5A2.5 2.5 0 0 1 10.5 5.5V7" stroke="currentColor"
      strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 2C8 2 6 5 6 8C6 11 8 14 8 14M8 2C8 2 10 5 10 8C10 11 8 14 8 14M2 8H14"
      stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 14L5.5 13L13 5.5L10.5 3L3 10.5L2 14Z" stroke="currentColor"
      strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M10.5 3L13 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CONTENT
═══════════════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  {
    num: '01', icon: <IconShield />, color: 'green',
    title: 'Acceptance of Terms',
    body: [
      'By accessing or using AfterHours, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use the application.',
      'AfterHours is a community-driven safety awareness Progressive Web App (PWA) designed specifically for Olongapo City in its Pilot Stage. It is intended to help users make informed decisions about their personal safety in public spaces.',
    ],
  },
  {
    num: '02', icon: <IconUser />, color: 'blue',
    title: 'User Responsibility',
    body: [
      'AfterHours provides safety "vibe" scores and incident reports derived from community-submitted data. This information is indicative and not a guarantee of safety.',
    ],
    bullets: [
      'You must exercise your own judgment at all times. Do not rely solely on AfterHours data for safety decisions.',
      'We are not liable for any personal safety decisions, outcomes, or incidents arising from use the use of AfterHours',
      'In an emergency, always contact local authorities (PNP: 911) rather than relying on this app.',
    ],
  },
  {
    num: '03', icon: <IconFlag />, color: 'amber',
    title: 'Anonymous Reporting',
    body: [
      'All incident reports submitted through AfterHours are anonymous by default. We do not collect, store, or share any personally identifiable information tied to your reports.',
    ],
    bullets: [
      'You agree not to submit false, misleading, or fabricated incident reports.',
      'You agree not to use the reporting system to harass, target, or defame any individual or group.',
      'You agree not to submit spam, duplicate reports, or content unrelated to public safety.',
      'Abuse of the reporting system may result in your session being blocked from future submissions.',
    ],
  },
  {
    num: '04', icon: <IconDatabase />, color: 'accent',
    title: 'Data Usage & Privacy',
    body: ['We take your privacy seriously. AfterHours is built with a privacy-first architecture.'],
    bullets: [
      'Location data is used exclusively for real-time safety updates and heatmap generation, and is not retained after processing.',
      'Raw report text is discarded after AI sentiment analysis. Only the processed category label and risk score are stored.',
      'Your anonymous session ID is rotated regularly if session rotation is enabled in Settings.',
      'No personal identity data is sold, rented, or shared with third parties under any circumstances.',
      'Data is stored using Firebase / Firestore with security rules that prevent unauthorized access.',
    ],
  },
  {
    num: '05', icon: <IconAlert />, color: 'red',
    title: 'Limitation of Liability',
    body: [
      'AfterHours and its developer provide this application on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding:',
    ],
    bullets: [
      'The accuracy, completeness, or timeliness of community-submitted safety data.',
      'The availability or uninterrupted operation of the application.',
      'The fitness of the application for any particular purpose.',
    ],
    bodyAfter: [
      'To the maximum extent permitted by applicable law, we shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the application.',
    ],
  },
  {
    num: '06', icon: <IconLock />, color: 'blue',
    title: 'Prohibited Conduct',
    body: ['When using AfterHours, you agree not to:'],
    bullets: [
      'Attempt to reverse-engineer, hack, or disrupt the application or its backend systems.',
      'Use automated tools to submit reports, scrape data, or overload the API.',
      'Impersonate another user, authority, or organization in reports.',
      'Use the app in any way that violates Philippine law or local Olongapo City ordinances.',
    ],
  },
  {
    num: '07', icon: <IconGlobe />, color: 'green',
    title: 'Governing Law',
    body: [
      'These Terms of Service are governed by the laws of the Republic of the Philippines. Any disputes arising from the use of AfterHours shall be subject to the exclusive jurisdiction of the courts of Olongapo City, Zambales.',
      'By using this application, you consent to the jurisdiction and venue of such courts.',
    ],
  },
  {
    num: '08', icon: <IconEdit />, color: 'amber',
    title: 'Changes to These Terms',
    body: [
      'We reserve the right to update or modify these Terms of Service at any time. Changes will be indicated by an updated "Last Updated" date at the bottom of this page.',
      'Continued use of AfterHours after changes are posted constitutes your acceptance of the revised terms. We encourage you to review this page periodically.',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function TermsOfService() {
  const navigate  = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ── a "gate" visit (user must accept to proceed)?
  // True when:  user has a token BUT hasn't accepted ToS yet
  // False when: user opened /terms from the Settings page (already accepted)
  const isGated =
    !!sessionStorage.getItem(TOKEN_KEY) &&
    localStorage.getItem(TOS_KEY) !== "true";

  // ── Accept ──────────────────────────────────────────────────────────────
  function handleAccept() {
    localStorage.setItem(TOS_KEY, "true");
    navigate('/home', { replace: true });
  }

  // ── Decline ─────────────────────────────────────────────────────────────
  // Clears the auth token so the user is effectively logged out,
  // then sends them back to /login.
  function handleDecline() {
    sessionStorage.removeItem(TOKEN_KEY);
    navigate('/login', { replace: true });
  }

  // ── Back button ──────────────────────────────────────────────────────────
  // If gated: back = decline (no way to sneak past without accepting)
  // If not gated: normal browser back (came from Settings)
  function handleBack() {
    if (isGated) {
      handleDecline();
    } else {
      navigate(-1);
    }
  }

  return (
    <div className={`tos-root ${mounted ? 'tos-root--in' : ''}`}>

      {/* Header */}
      <header className="tos-header">
        <button className="tos-back-btn" onClick={handleBack} aria-label="Go back">
          <IconBack />
        </button>
        <div className="tos-header__center">
          <h1 className="tos-header__title">Terms of Service</h1>
          <p className="tos-header__sub">AfterHours</p>
        </div>
        <div className="tos-back-btn" style={{ visibility: 'hidden' }} aria-hidden="true" />
      </header>

      {/* Content */}
      <div className="tos-scroll">

        {/* Gate banner — only shown when user must accept to proceed */}
        {isGated && (
          <div className="tos-gate-banner">
            <IconShield />
            <p>
              Please read and accept these terms to continue using AfterHours.
            </p>
          </div>
        )}

        {/* Intro */}
        <div className="tos-intro">
          <p>
            Please read these terms carefully before using AfterHours.
            They define your rights and responsibilities as a member of this safety community.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((s) => (
          <section key={s.num} className="tos-section">
            <div className="tos-section__header">
              <div className={`tos-section__icon tos-section__icon--${s.color}`}>
                {s.icon}
              </div>
              <div className="tos-section__meta">
                <span className="tos-section__num">{s.num}</span>
                <h2 className="tos-section__title">{s.title}</h2>
              </div>
            </div>

            {s.body?.map((p, i) => (
              <p key={i} className="tos-section__body">{p}</p>
            ))}

            {s.bullets && (
              <ul className="tos-section__list">
                {s.bullets.map((b, i) => (
                  <li key={i} className="tos-section__item">
                    <span className="tos-section__bullet" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {s.bodyAfter?.map((p, i) => (
              <p key={i} className="tos-section__body tos-section__body--after">{p}</p>
            ))}
          </section>
        ))}

        {/* Footer */}
        <footer className="tos-footer">
          <div className="tos-footer__meta">
            <span>Last Updated: May 2026</span>
            <span className="tos-footer__dot" aria-hidden="true" />
            <span>Version 1.0</span>
          </div>

          <div className="tos-footer__notice">
            <IconShield />
            <p>
              AfterHours is a student project built for community safety.
              It is not a substitute for professional emergency services.
            </p>
          </div>

          {/*
            Button behaviour changes based on context:
            - GATED visit:     Accept sets flag → /home | Decline clears token → /login
            - Settings visit:  Accept/Decline both just go back (already accepted)
          */}
          {isGated ? (
            <>
              <button className="tos-accept-btn" onClick={handleAccept}>
                I Understand &amp; Accept
              </button>
              <button className="tos-decline-btn" onClick={handleDecline}>
                Decline
              </button>
            </>
          ) : (
            <>
              <button className="tos-accept-btn" onClick={() => navigate(-1)}>
                Done
              </button>
            </>
          )}
        </footer>

        <div style={{ height: '16px' }} aria-hidden="true" />
      </div>
    </div>
  );
}
