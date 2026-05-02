import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { useState, useEffect } from "react";
import "./AuthPage.css";

/* ─── tiny inline SVG icons (no extra dep) ─────────────────────────────── */
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M2 2L16 16M7.5 7.6A2.5 2.5 0 0 0 10.4 10.5M5.2 5.3C3.3 6.4 1.9 8 1 9c1 2 4 6 8 6a8 8 0 0 0 3.8-1M9 3C13.8 3 16.7 7 17 9a9.5 9.5 0 0 1-1.8 2.6"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 6L9 11L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="4" y="8" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="9" cy="11.5" r="1" fill="currentColor"/>
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1L2 3.5V7C2 10 4.5 12.5 7 13C9.5 12.5 12 10 12 7V3.5L7 1Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="8" y1="5.5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="0.7" fill="currentColor"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.5 7L6 8.5L9.5 5.5" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const navigate = useNavigate();
setSuccess(true);
setTimeout(() => navigate("/home"), 1200);

/* ─── password strength helper ──────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "",         color: "" },
    { label: "Weak",     color: "var(--red)" },
    { label: "Fair",     color: "var(--amber)" },
    { label: "Good",     color: "var(--amber)" },
    { label: "Strong",   color: "var(--green)" },
  ];
  return { score, ...map[score] };
}

/* ─── reusable input field ──────────────────────────────────────────────── */
function InputField({ id, label, type, value, onChange, onBlur,
                      icon, error, placeholder, children }) {
  return (
    <div className={`field-group ${error ? "field-error" : ""}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="field-wrap">
        <span className="field-icon">{icon}</span>
        <input
          id={id}
          className="field-input"
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={id}
          spellCheck="false"
        />
        {children}
      </div>
      {error && (
        <p className="field-err-msg" role="alert">
          <IconAlert /> {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const [mode, setMode]           = useState("login");   // "login" | "signup"
  const [mounted, setMounted]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [apiError, setApiError]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showPw2, setShowPw2]     = useState(false);

  /* form state */
  const [form, setForm] = useState({
    displayName: "", email: "", password: "", confirm: ""
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors]   = useState({});

  /* mount animation trigger */
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  /* reset form on mode switch */
  function switchMode(m) {
    setMode(m);
    setForm({ displayName: "", email: "", password: "", confirm: "" });
    setTouched({});
    setErrors({});
    setApiError("");
    setSuccess(false);
    setShowPw(false);
    setShowPw2(false);
  }

  /* field update */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // clear error on type
    if (errors[name]) setErrors(er => ({ ...er, [name]: "" }));
    setApiError("");
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    validate({ ...form, [name]: form[name] }, name);
  }

  /* validation */
  function validate(data, field) {
    const errs = { ...errors };

    const check = (f) => {
      switch (f) {
        case "displayName":
          errs.displayName = data.displayName.trim().length < 2
            ? "Display name must be at least 2 characters" : "";
          break;
        case "email":
          errs.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
            ? "Enter a valid email address" : "";
          break;
        case "password":
          errs.password = data.password.length < 8
            ? "Password must be at least 8 characters" : "";
          break;
        case "confirm":
          errs.confirm = data.confirm !== data.password
            ? "Passwords don't match" : "";
          break;
        default: break;
      }
    };

    if (field) {
      check(field);
    } else {
      const fields = mode === "signup"
        ? ["displayName", "email", "password", "confirm"]
        : ["email", "password"];
      fields.forEach(check);
    }

    setErrors(errs);
    return Object.values(errs).every(v => !v);
  }

  /* submit */
  try {
  let userCredential;

  if (mode === "signup") {
    // 1. Create the account
    userCredential = createUserWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );
    // 2. Set the display name
    await updateProfile(userCredential.user, {
      displayName: form.displayName,
    });
  } else {
    // Login
    userCredential = await signInWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );
  }

  // 3. Get the ID token — attach this to Flask API calls later
  const idToken = await userCredential.user.getIdToken();
  sessionStorage.setItem("ah_token", idToken);

  setSuccess(true);
  // TODO: navigate("/map")

} catch (err) {
  // Map Firebase error codes to readable messages
  const messages = {
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/too-many-requests":      "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  setApiError(messages[err.code] || "Something went wrong. Please try again.");
}

  const strength = getStrength(form.password);
  const isLogin  = mode === "login";

  return (
    <div className={`auth-root ${mounted ? "auth-root--in" : ""}`}>

      {/* ── animated city grid background ── */}
      <div className="auth-bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow--1" />
        <div className="bg-glow bg-glow--2" />
        <div className="bg-glow bg-glow--3" />
        {/* floating orbs */}
        <div className="orb orb--1" />
        <div className="orb orb--2" />
      </div>

      {/* ── card ── */}
      <main className="auth-card" role="main">

        {/* logo + wordmark */}
        <div className="auth-logo">
          <div className="logo-mark" aria-hidden="true">
            <span className="logo-ring logo-ring--outer" />
            <span className="logo-ring logo-ring--inner" />
            <span className="logo-dot" />
          </div>
          <div className="logo-text">
            <span className="logo-after">After</span>
            <span className="logo-hours">Hours</span>
          </div>
        </div>

        {/* tagline */}
        <p className="auth-tagline">
          {isLogin
            ? "Stay aware. Stay safe."
            : "Join the safety network."}
        </p>

        {/* mode tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={isLogin}
            className={`auth-tab ${isLogin ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={!isLogin}
            className={`auth-tab ${!isLogin ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Create Account
          </button>
          <span className="auth-tab-indicator" style={{
            transform: `translateX(${isLogin ? "0%" : "100%"})`
          }} />
        </div>

        {/* ── success state ── */}
        {success ? (
          <div className="auth-success" role="status">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="var(--green)" strokeWidth="1.5"/>
                <path d="M8 14L12 18L20 10" stroke="var(--green)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="success-title">
              {isLogin ? "Welcome back!" : "Account created!"}
            </p>
            <p className="success-sub">Redirecting to the map…</p>
          </div>
        ) : (

        /* ── form ── */
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* API-level error banner */}
          {apiError && (
            <div className="api-error" role="alert">
              <IconAlert />
              <span>{apiError}</span>
            </div>
          )}

          {/* Display name — signup only */}
          {!isLogin && (
            <InputField
              id="displayName"
              label="Display Name"
              type="text"
              value={form.displayName}
              onChange={e => handleChange({ target: { name: "displayName", value: e.target.value }})}
              onBlur={e => handleBlur({ target: { name: "displayName" }})}
              icon={<IconUser />}
              error={touched.displayName ? errors.displayName : ""}
              placeholder="How should we call you?"
            />
          )}

          {/* Email */}
          <InputField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={e => handleChange({ target: { name: "email", value: e.target.value }})}
            onBlur={e => handleBlur({ target: { name: "email" }})}
            icon={<IconMail />}
            error={touched.email ? errors.email : ""}
            placeholder="you@email.com"
          />

          {/* Password */}
          <InputField
            id="password"
            label="Password"
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={e => handleChange({ target: { name: "password", value: e.target.value }})}
            onBlur={e => handleBlur({ target: { name: "password" }})}
            icon={<IconLock />}
            error={touched.password ? errors.password : ""}
            placeholder={isLogin ? "Your password" : "Min. 8 characters"}
          >
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <IconEyeOff /> : <IconEye />}
            </button>
          </InputField>

          {/* Password strength bar — signup only */}
          {!isLogin && form.password && (
            <div className="strength-wrap" aria-label={`Password strength: ${strength.label}`}>
              <div className="strength-bars">
                {[1,2,3,4].map(n => (
                  <div
                    key={n}
                    className="strength-bar"
                    style={{
                      background: n <= strength.score ? strength.color : "var(--surface3)"
                    }}
                  />
                ))}
              </div>
              {strength.label && (
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              )}
            </div>
          )}

          {/* Confirm password — signup only */}
          {!isLogin && (
            <InputField
              id="confirm"
              label="Confirm Password"
              type={showPw2 ? "text" : "password"}
              value={form.confirm}
              onChange={e => handleChange({ target: { name: "confirm", value: e.target.value }})}
              onBlur={e => handleBlur({ target: { name: "confirm" }})}
              icon={<IconLock />}
              error={touched.confirm ? errors.confirm : ""}
              placeholder="Repeat your password"
            >
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw2(v => !v)}
                aria-label={showPw2 ? "Hide confirm password" : "Show confirm password"}
              >
                {showPw2 ? <IconEyeOff /> : <IconEye />}
              </button>
            </InputField>
          )}

          {/* Forgot password — login only */}
          {isLogin && (
            <div className="forgot-wrap">
              <button type="button" className="forgot-btn">
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>{isLogin ? "Signing in…" : "Creating account…"}</span>
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>

          {/* Anonymous pill */}
          <div className="anon-notice">
            <IconShield />
            <span>No personal data stored · Anonymous by default</span>
          </div>

          {/* Sign up nudge */}
          <p className="mode-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="mode-switch-btn"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>

        </form>
        )}

      </main>

      {/* bottom attribution */}
      <footer className="auth-footer">
        <span>AfterHours · Stay safe, always.</span>
      </footer>
    </div>
  );
}
