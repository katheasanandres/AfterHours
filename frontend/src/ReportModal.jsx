import { useState, useEffect } from 'react';
import './ReportModal.css';

/*₊˚ ✧ ━━━━⊱ICONS⊰━━━━ ✧ ₊˚ */
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <circle cx="14" cy="14" r="13" stroke="var(--green)" strokeWidth="1.5"/>
    <path d="M8 14L12 18L20 10" stroke="var(--green)"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M6.5 1L2 3.5V7C2 10 4.5 12 6.5 12.5C8.5 12 11 10 11 7V3.5L6.5 1Z"
      stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    <path d="M4.5 7L5.8 8.3L8.8 5.3" stroke="currentColor"
      strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/*₊˚ ✧ ━━━━⊱REPORT CATEGORIES   ⊰━━━━ ✧ ₊˚ 
   Each has an emoji for instant visual scanning, a label, a color token,
   and a type tag that will feed the NLP pipeline later.
*/
const CATEGORIES = [
  {
    id:    'poor_lighting',
    emoji: '🔦',
    label: 'Poor Lighting',
    type:  'environmental',
    color: 'amber',
  },
  {
    id:    'loitering',
    emoji: '👥',
    label: 'Suspicious Loitering',
    type:  'social',
    color: 'red',
  },
  {
    id:    'catcalling',
    emoji: '📢',
    label: 'Catcalling / Harassment',
    type:  'social',
    color: 'red',
  },
  {
    id:    'broken_infrastructure',
    emoji: '🚧',
    label: 'Broken Infrastructure',
    type:  'environmental',
    color: 'amber',
  },
  {
    id:    'unsafe_vehicle',
    emoji: '🚗',
    label: 'Unsafe / Reckless Vehicle',
    type:  'social',
    color: 'red',
  },
  {
    id:    'no_bystanders',
    emoji: '🏚️',
    label: 'Isolated / No Bystanders',
    type:  'environmental',
    color: 'gray',
  },
  {
    id:    'other',
    emoji: '⚠️',
    label: 'Other',
    type:  'general',
    color: 'gray',
  },
];

const URGENCY_LEVELS = [
  { id: 'high',     label: 'High',     desc: 'Immediate threat',   color: 'red'   },
  { id: 'moderate', label: 'Moderate', desc: 'Concerning but safe', color: 'amber' },
  { id: 'low',      label: 'Low',      desc: 'Worth noting',        color: 'green' },
];

/*₊˚ ✧ ━━━━⊱STEPS⊰━━━━ ✧ ₊˚ */

/** Step 1 — pick a category */
function StepCategory({ selected, onSelect }) {
  return (
    <div className="rm-step">
      <p className="rm-step__hint">What are you reporting?</p>
      <div className="rm-category-grid">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`rm-cat-btn rm-cat-btn--${cat.color}
              ${selected === cat.id ? 'rm-cat-btn--active' : ''}`}
            onClick={() => onSelect(cat.id)}
            aria-pressed={selected === cat.id}
          >
            <span className="rm-cat-btn__emoji" aria-hidden="true">{cat.emoji}</span>
            <span className="rm-cat-btn__label">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Step 2 — pick urgency + optional description */
function StepDetails({ urgency, onUrgency, description, onDescription, category }) {
  const catObj = CATEGORIES.find(c => c.id === category);
  const MAX    = 200;
  const remaining = MAX - description.length;

  return (
    <div className="rm-step">
      {/* selected category pill */}
      {catObj && (
        <div className="rm-selected-cat">
          <span aria-hidden="true">{catObj.emoji}</span>
          <span>{catObj.label}</span>
        </div>
      )}

      {/* urgency */}
      <p className="rm-step__hint">How urgent is this?</p>
      <div className="rm-urgency-row">
        {URGENCY_LEVELS.map(u => (
          <button
            key={u.id}
            className={`rm-urgency-btn rm-urgency-btn--${u.color}
              ${urgency === u.id ? 'rm-urgency-btn--active' : ''}`}
            onClick={() => onUrgency(u.id)}
            aria-pressed={urgency === u.id}
          >
            <span className="rm-urgency-btn__label">{u.label}</span>
            <span className="rm-urgency-btn__desc">{u.desc}</span>
          </button>
        ))}
      </div>

      {/* optional description */}
      <div className="rm-desc-wrap">
        <label className="rm-desc-label" htmlFor="rm-description">
          Additional details
          <span className="rm-desc-optional">optional</span>
        </label>
        <textarea
          id="rm-description"
          className="rm-desc-input"
          value={description}
          onChange={e => onDescription(e.target.value.slice(0, MAX))}
          placeholder="Describe what you saw — be specific but don't share anyone's personal info…"
          rows={3}
        />
        <p className={`rm-desc-counter ${remaining < 30 ? 'rm-desc-counter--warn' : ''}`}>
          {remaining} characters remaining
        </p>
      </div>
    </div>
  );
}

/** Step 3 — confirm & send */
function StepConfirm({ category, urgency, description }) {
  const catObj = CATEGORIES.find(c => c.id === category);
  const urgObj = URGENCY_LEVELS.find(u => u.id === urgency);

  return (
    <div className="rm-step rm-step--confirm">
      <p className="rm-step__hint">Review before submitting</p>

      <div className="rm-confirm-card">
        <div className="rm-confirm-row">
          <span className="rm-confirm-label">Incident</span>
          <span className="rm-confirm-value">
            {catObj?.emoji} {catObj?.label}
          </span>
        </div>
        <div className="rm-confirm-divider" aria-hidden="true" />
        <div className="rm-confirm-row">
          <span className="rm-confirm-label">Urgency</span>
          <span className={`rm-confirm-value rm-confirm-value--${urgObj?.color}`}>
            {urgObj?.label}
          </span>
        </div>
        {description.trim() && (
          <>
            <div className="rm-confirm-divider" aria-hidden="true" />
            <div className="rm-confirm-row rm-confirm-row--col">
              <span className="rm-confirm-label">Details</span>
              <span className="rm-confirm-desc">{description}</span>
            </div>
          </>
        )}
      </div>

      <div className="rm-confirm-notice">
        <IconShield />
        <p>
          Your report is <strong>100% anonymous</strong>. Your location is used
          only to place the report on the heatmap and is not stored.
        </p>
      </div>
    </div>
  );
}

/** Success state */
function StepSuccess() {
  return (
    <div className="rm-success">
      <div className="rm-success__icon">
        <IconCheck />
      </div>
      <h3 className="rm-success__title">Report submitted!</h3>
      <p className="rm-success__sub">
        Thank you for keeping Olongapo safer. Your report has been added to
        the community heatmap.
      </p>
    </div>
  );
}

/*₊˚ ✧ ━━━━⊱MAIN MODAL COMPONENTS⊰━━━━ ✧ ₊˚ */
const STEP_LABELS = ['Category', 'Details', 'Confirm'];

export default function ReportModal({ onClose }) {
  const [step,        setStep]        = useState(0);   // 0 | 1 | 2
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [visible,     setVisible]     = useState(false);

  /* form state */
  const [category,    setCategory]    = useState(null);
  const [urgency,     setUrgency]     = useState(null);
  const [description, setDescription] = useState('');

  /* slide-in on mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  /* close with slide-out animation */
  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 340);
  }

  /* dismiss on overlay click */
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  /* step navigation */
  function canAdvance() {
    if (step === 0) return !!category;
    if (step === 1) return !!urgency;
    return true;
  }

  function handleNext() {
    if (step < 2) { setStep(s => s + 1); return; }
    handleSubmit();
  }

  function handleBack() {
    if (step === 0) { handleClose(); return; }
    setStep(s => s - 1);
  }

  /* submit — TODO (backend): POST to Flask /api/reports with ID token */
  async function handleSubmit() {
    setSubmitting(true);

    const payload = {
      category,
      urgency,
      description: description.trim(),
      // location will be injected from the map context later
      // timestamp: new Date().toISOString(),
    };

    // Simulated network delay — replace with real fetch() call:
    // const idToken = await auth.currentUser.getIdToken();
    // await fetch('/api/reports', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    //   body: JSON.stringify(payload),
    // });

    await new Promise(r => setTimeout(r, 1200)); // remove when real API is ready
    console.log('Report payload (ready for Flask):', payload);

    setSubmitting(false);
    setSubmitted(true);

    // auto-close after success
    setTimeout(() => handleClose(), 2800);
  }

  const nextLabel = step === 2 ? 'Submit Report' : 'Continue';

  return (
    <div
      className={`rm-overlay ${visible ? 'rm-overlay--in' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Report an incident"
    >
      <div className={`rm-sheet ${visible ? 'rm-sheet--in' : ''}`}>

        {/* ── drag handle ── */}
        <div className="rm-handle" aria-hidden="true" />

        {/* ── header ── */}
        <div className="rm-header">
          <div className="rm-header__left">
            <h2 className="rm-header__title">
              {submitted ? 'Done' : 'Report Incident'}
            </h2>
            {!submitted && (
              <p className="rm-header__step">
                Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
              </p>
            )}
          </div>
          <button
            className="rm-close-btn"
            onClick={handleClose}
            aria-label="Close report modal"
          >
            <IconClose />
          </button>
        </div>

        {/* ── progress bar ── */}
        {!submitted && (
          <div className="rm-progress" aria-hidden="true">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`rm-progress__segment ${i <= step ? 'rm-progress__segment--done' : ''}`}
              />
            ))}
          </div>
        )}

        {/* ── step content ── */}
        <div className="rm-body">
          {submitted ? (
            <StepSuccess />
          ) : step === 0 ? (
            <StepCategory selected={category} onSelect={setCategory} />
          ) : step === 1 ? (
            <StepDetails
              urgency={urgency}       onUrgency={setUrgency}
              description={description} onDescription={setDescription}
              category={category}
            />
          ) : (
            <StepConfirm
              category={category}
              urgency={urgency}
              description={description}
            />
          )}
        </div>

        {/* ── footer actions ── */}
        {!submitted && (
          <div className="rm-footer">
            <button
              className="rm-btn rm-btn--back"
              onClick={handleBack}
              disabled={submitting}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            <button
              className={`rm-btn rm-btn--next ${submitting ? 'rm-btn--loading' : ''}`}
              onClick={handleNext}
              disabled={!canAdvance() || submitting}
            >
              {submitting ? (
                <>
                  <span className="rm-spinner" aria-hidden="true" />
                  <span>Submitting…</span>
                </>
              ) : (
                nextLabel
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}