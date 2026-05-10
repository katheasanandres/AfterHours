import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import "./AuthPage.css";

/* ₊˚ ✧ ━━━━⊱SVG Icons⊰━━━━ ✧ ₊˚ */
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
const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ₊˚ ✧ ━━━━⊱Password strength helper⊰━━━━ ✧ ₊˚ */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "",       color: "" },
    { label: "Weak",   color: "var(--red)" },
    { label: "Fair",   color: "var(--amber)" },
    { label: "Good",   color: "var(--amber)" },
    { label: "Strong", color: "var(--green)" },
  ];
  return { score, ...map[score] };
}

/* ₊˚ ✧ ━━━━⊱Reusable InputField⊰━━━━ ✧ ₊˚ */
function InputField({ id, label, type, value, onChange, onBlur,
                      icon, error, placeholder, children }) {
  return (
    <div className={`field-group ${error ? "field-error" : ""}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="field-wrap">
        <span className="field-icon">{icon}</span>
        <input
          id={id}
          name={id}
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
   FORGOT PASSWORD SHEET
   3-step OTP flow rendered as a slide-up overlay:
     Step 1 — enter email → POST /api/auth/send-otp
     Step 2 — enter 6-digit OTP → POST /api/auth/verify-otp
     Step 3 — enter new password → POST /api/auth/reset-password
═══════════════════════════════════════════════════════════════════════════ */
function ForgotPasswordSheet({ onClose }) {
  const [visible,  setVisible]  = useState(false);
  const [step,     setStep]     = useState(1);   // 1 | 2 | 3
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [success,  setSuccess]  = useState(false);

  // Step 1
  const [email,    setEmail]    = useState("");

  // Step 2 — six individual digit inputs
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const otpRefs    = useRef([]);

  // Step 3
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw,setConfirmPw]= useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Mount animation — same pattern as other sheets
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Auto-focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 340);
  }
  function handleOverlay(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  // ── Step 1: send OTP ─────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email.trim()) { setErr("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please enter a valid email address."); return;
    }
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setStep(2);
    } catch (e) {
      setErr(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: OTP digit input handling ────────────────────────────────
  function handleOtpChange(index, value) {
    // Only accept a single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setErr("");
    // Auto-advance to next box
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    // Backspace on empty box → go back
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Allow pasting a full 6-digit code
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) return;
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  // ── Step 2: verify OTP ───────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setErr("Please enter the full 6-digit code."); return; }
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setStep(3);
    } catch (e) {
      setErr(e.message || "Invalid or expired code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: reset password ───────────────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setErr("Passwords don't match."); return; }
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email: email.trim().toLowerCase(),
          otp:   otp.join(""),
          new_password: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setSuccess(true);
      // Auto-close after 2.5s so user can read the success message
      setTimeout(() => handleClose(), 2500);
    } catch (e) {
      setErr(e.message || "Reset failed. Please start over.");
    } finally {
      setLoading(false);
    }
  }

  const otpFilled = otp.every(d => d !== "");

  return (
    <div
      className={`fp-overlay ${visible ? "fp-overlay--in" : ""}`}
      onClick={handleOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Reset your password"
    >
      <div className={`fp-sheet ${visible ? "fp-sheet--in" : ""}`}>
        <div className="fp-handle" aria-hidden="true" />

        {/* Header */}
        <div className="fp-header">
          <div className="fp-header__left">
            <h2 className="fp-header__title">
              {success ? "Password Reset!" :
               step === 1 ? "Forgot Password" :
               step === 2 ? "Enter OTP" :
                            "New Password"}
            </h2>
            <p className="fp-header__sub">
              {success ? "You can now sign in with your new password." :
               step === 1 ? "Enter your email to receive a one-time code." :
               step === 2 ? `Check ${email} for your 6-digit code.` :
                            "Choose a strong new password."}
            </p>
          </div>
          <button className="fp-close" onClick={handleClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {/* Progress dots */}
        {!success && (
          <div className="fp-progress" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`fp-progress__dot ${n <= step ? "fp-progress__dot--active" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="fp-body">

          {/* ── Success ── */}
          {success && (
            <div className="fp-success">
              <div className="fp-success__icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="var(--green)" strokeWidth="2"/>
                  <path d="M14 24L20 30L34 18" stroke="var(--green)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="fp-success__title">Password updated!</p>
              <p className="fp-success__sub">Signing you back in shortly…</p>
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {!success && step === 1 && (
            <form onSubmit={handleSendOtp} noValidate>
              {err && (
                <div className="fp-err" role="alert"><IconAlert /><span>{err}</span></div>
              )}
              <div className="fp-field">
                <label className="fp-field__label" htmlFor="fp-email">Email address</label>
                <div className="fp-field__wrap">
                  <span className="fp-field__icon"><IconMail /></span>
                  <input
                    id="fp-email"
                    type="email"
                    className="fp-field__input"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErr(""); }}
                    placeholder="you@email.com"
                    autoComplete="email"
                    spellCheck="false"
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`fp-btn fp-btn--primary ${loading ? "fp-btn--loading" : ""}`}
                disabled={loading}
              >
                {loading
                  ? <><span className="fp-spinner" aria-hidden="true"/><span>Sending…</span></>
                  : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP boxes ── */}
          {!success && step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate>
              {err && (
                <div className="fp-err" role="alert"><IconAlert /><span>{err}</span></div>
              )}

              <div className="fp-otp-row" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    className={`fp-otp-box ${digit ? "fp-otp-box--filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <p className="fp-otp-hint">
                Didn't get it?{" "}
                <button
                  type="button"
                  className="fp-resend"
                  onClick={() => { setStep(1); setOtp(["","","","","",""]); setErr(""); }}
                >
                  Resend code
                </button>
              </p>

              <button
                type="submit"
                className={`fp-btn fp-btn--primary ${loading || !otpFilled ? "fp-btn--disabled" : ""}`}
                disabled={loading || !otpFilled}
              >
                {loading
                  ? <><span className="fp-spinner" aria-hidden="true"/><span>Verifying…</span></>
                  : "Verify Code"}
              </button>
            </form>
          )}

          {/* ── Step 3: New password ── */}
          {!success && step === 3 && (
            <form onSubmit={handleResetPassword} noValidate>
              {err && (
                <div className="fp-err" role="alert"><IconAlert /><span>{err}</span></div>
              )}

              {/* New password */}
              <div className="fp-field">
                <label className="fp-field__label" htmlFor="fp-newpw">New password</label>
                <div className="fp-field__wrap">
                  <span className="fp-field__icon"><IconLock /></span>
                  <input
                    id="fp-newpw"
                    type={showPw ? "text" : "password"}
                    className="fp-field__input"
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setErr(""); }}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="fp-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="fp-field">
                <label className="fp-field__label" htmlFor="fp-confirmpw">Confirm password</label>
                <div className="fp-field__wrap">
                  <span className="fp-field__icon"><IconLock /></span>
                  <input
                    id="fp-confirmpw"
                    type={showPw ? "text" : "password"}
                    className="fp-field__input"
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setErr(""); }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`fp-btn fp-btn--primary ${loading ? "fp-btn--loading" : ""}`}
                disabled={loading}
              >
                {loading
                  ? <><span className="fp-spinner" aria-hidden="true"/><span>Resetting…</span></>
                  : "Reset Password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN AUTH COMPONENT — unchanged except for showForgot state + sheet mount
═══════════════════════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const navigate = useNavigate();

  const [mode,        setMode]        = useState("login");
  const [mounted,     setMounted]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showPw2,     setShowPw2]     = useState(false);
  const [showForgot,  setShowForgot]  = useState(false); // ← NEW

  const [form, setForm] = useState({
    displayName: "", email: "", password: "", confirm: "",
  });
  const [touched, setTouched] = useState({});
  const [errors,  setErrors]  = useState({});

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: "" }));
    setApiError("");
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    validate({ ...form, [name]: form[name] }, name);
  }

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

  async function onAuthSuccess(credential) {
    const idToken = await credential.user.getIdToken();
    sessionStorage.setItem("ah_token", idToken);
    setSuccess(true);
    setTimeout(() => navigate("/home"), 1200);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const allTouched = mode === "signup"
      ? { displayName: true, email: true, password: true, confirm: true }
      : { email: true, password: true };
    setTouched(allTouched);
    if (!validate(form, null)) return;
    setLoading(true);
    setApiError("");
    try {
      let credential;
      if (mode === "signup") {
        credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(credential.user, { displayName: form.displayName });
      } else {
        credential = await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      await onAuthSuccess(credential);
    } catch (err) {
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
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoad(true);
    setApiError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await onAuthSuccess(credential);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" ||
          err.code === "auth/cancelled-popup-request") {
        setGoogleLoad(false);
        return;
      }
      const messages = {
        "auth/popup-blocked": "Popup was blocked. Please allow popups for this site and try again.",
        "auth/account-exists-with-different-credential": "An account already exists with this email. Try signing in with email & password.",
        "auth/network-request-failed": "Network error. Please check your connection.",
      };
      setApiError(messages[err.code] || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoad(false);
    }
  }

  const strength   = getStrength(form.password);
  const isLogin    = mode === "login";
  const anyLoading = loading || googleLoad;

  return (
    <div className={`auth-root ${mounted ? "auth-root--in" : ""}`}>

      {/* Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow--1" />
        <div className="bg-glow bg-glow--2" />
        <div className="bg-glow bg-glow--3" />
        <div className="orb orb--1" />
        <div className="orb orb--2" />
      </div>

      {/* Card */}
      <main className="auth-card" role="main">

        {/* Logo */}
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

        {/* Tagline */}
        <p className="auth-tagline">
          {isLogin ? "Stay aware. Stay safe." : "Join AfterHours!"}
        </p>

        {/* Success state */}
        {success ? (
          <div className="auth-success" role="status">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="var(--green)" strokeWidth="1.5"/>
                <path d="M8 14L12 18L20 10" stroke="var(--green)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="success-title">{isLogin ? "Welcome back!" : "Account created!"}</p>
            <p className="success-sub">Redirecting…</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {apiError && (
              <div className="api-error" role="alert">
                <IconAlert /><span>{apiError}</span>
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              className={`google-btn ${googleLoad ? "google-btn--loading" : ""}`}
              onClick={handleGoogleSignIn}
              disabled={anyLoading}
            >
              {googleLoad
                ? <><span className="spinner spinner--dark" aria-hidden="true"/><span>Connecting…</span></>
                : <><IconGoogle /><span>Continue with Google</span></>}
            </button>

            {/* Divider */}
            <div className="auth-divider" aria-hidden="true">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with email</span>
              <span className="auth-divider-line" />
            </div>

            {/* Display name — signup only */}
            {!isLogin && (
              <InputField
                id="displayName" label="Display Name" type="text"
                value={form.displayName} onChange={handleChange} onBlur={handleBlur}
                icon={<IconUser />} error={touched.displayName ? errors.displayName : ""}
                placeholder="How should we call you?"
              />
            )}

            {/* Email */}
            <InputField
              id="email" label="Email" type="email"
              value={form.email} onChange={handleChange} onBlur={handleBlur}
              icon={<IconMail />} error={touched.email ? errors.email : ""}
              placeholder="you@email.com"
            />

            {/* Password */}
            <InputField
              id="password" label="Password"
              type={showPw ? "text" : "password"}
              value={form.password} onChange={handleChange} onBlur={handleBlur}
              icon={<IconLock />} error={touched.password ? errors.password : ""}
              placeholder={isLogin ? "Your password" : "Min. 8 characters"}
            >
              <button type="button" className="pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </InputField>

            {/* Strength */}
            {!isLogin && form.password && (
              <div className="strength-wrap" aria-label={`Password strength: ${strength.label}`}>
                <div className="strength-bars">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="strength-bar"
                      style={{ background: n <= strength.score ? strength.color : "var(--surface3)" }}
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

            {/* Confirm — signup only */}
            {!isLogin && (
              <InputField
                id="confirm" label="Confirm Password"
                type={showPw2 ? "text" : "password"}
                value={form.confirm} onChange={handleChange} onBlur={handleBlur}
                icon={<IconLock />} error={touched.confirm ? errors.confirm : ""}
                placeholder="Repeat your password"
              >
                <button type="button" className="pw-toggle"
                  onClick={() => setShowPw2(v => !v)}
                  aria-label={showPw2 ? "Hide password" : "Show password"}>
                  {showPw2 ? <IconEyeOff /> : <IconEye />}
                </button>
              </InputField>
            )}

            {/* Forgot password — ← onClick now opens the sheet */}
            {isLogin && (
              <div className="forgot-wrap">
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
              disabled={anyLoading}
            >
              {loading
                ? <><span className="spinner" aria-hidden="true"/>
                    <span>{isLogin ? "Signing in…" : "Creating account…"}</span></>
                : isLogin ? "Sign In" : "Create Account"}
            </button>

            {/* Anon notice */}
            <div className="anon-notice">
              <IconShield />
              <span>No personal data stored · Anonymous by default</span>
            </div>

            {/* Mode switch */}
            <p className="mode-switch">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="mode-switch-btn"
                onClick={() => switchMode(isLogin ? "signup" : "login")}>
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>

          </form>
        )}
      </main>

      <footer className="auth-footer">
        <div className="auth-terms">
          By continuing, you agree to our
          <button type="button" className="terms-btn" onClick={() => navigate("/terms")}>
            Terms &amp; Conditions
          </button>
        </div>
        <span className="footer-copyright">AfterHours · Stay aware, stay safe.</span>
      </footer>

      {/* Forgot password sheet — mounts over the auth card */}
      {showForgot && <ForgotPasswordSheet onClose={() => setShowForgot(false)} />}

    </div>
  );
}