import os
import json
import random
import string
import smtplib
import nltk

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS

import firebase_admin
from firebase_admin import credentials, auth, firestore

from dotenv import load_dotenv
from textblob import TextBlob

load_dotenv()

# ── Download TextBlob / NLTK corpora on startup ────────────────────────────
nltk.download('punkt',                      quiet=True)
nltk.download('punkt_tab',                  quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "https://afterhours-peach.vercel.app",
    "https://*.vercel.app",
])

# ── Firebase Admin SDK ─────────────────────────────────────────────────────
_sa_env = os.getenv("FIREBASE_SERVICE_ACCOUNT")
if _sa_env:
    _sa_dict = json.loads(_sa_env)
    cred = credentials.Certificate(_sa_dict)
else:
    cred = credentials.Certificate("service_account.json")

firebase_admin.initialize_app(cred)
db = firestore.client()


# ── Auth helper ────────────────────────────────────────────────────────────
def verify_token(req):
    header = req.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise ValueError("Missing or malformed Authorization header.")
    return auth.verify_id_token(header.split("Bearer ")[1])


# ── Email helper ───────────────────────────────────────────────────────────
def send_email(to_address, subject, html_body):
    sender   = os.getenv("MAIL_SENDER")
    app_pass = os.getenv("MAIL_APP_PASSWORD")
    if not sender or not app_pass:
        raise RuntimeError("MAIL_SENDER or MAIL_APP_PASSWORD not set.")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = sender
    msg["To"]      = to_address
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, app_pass)
        server.sendmail(sender, to_address, msg.as_string())


# ══════════════════════════════════════════════════════════════════════════
# NLP — TextBlob sentiment analysis + keyword matching
# ══════════════════════════════════════════════════════════════════════════

CATEGORY_KEYWORDS = {
    "poor_lighting":         ["dark", "light", "unlit", "dim", "visibility", "blackout", "streetlight", "lamp"],
    "loitering":             ["loiter", "lurk", "suspicious", "hanging", "stranger", "following", "watching"],
    "catcalling":            ["catcall", "harass", "whistle", "shout", "verbal", "comment", "stare", "whisper"],
    "broken_infrastructure": ["broken", "pothole", "damage", "crack", "road", "pavement", "hazard", "flooded"],
    "unsafe_vehicle":        ["vehicle", "car", "reckless", "speeding", "driver", "motorcycle", "swerving"],
    "no_bystanders":         ["empty", "alone", "isolated", "deserted", "nobody", "quiet", "no one"],
}

HIGH_URGENCY_WORDS = {
    # Direct danger / violence
    "help", "danger", "dangerous", "attack", "attacked", "threat", "threatened",
    "emergency", "weapon", "knife", "gun", "armed", "blood", "bleeding",
    "assault", "assaulted", "violence", "violent", "hit", "punch", "kick",
    "grab", "grabbed", "choke", "choked", "rape", "molest", "abuse", "abused",
    "kidnap", "hostage", "trapped",

    # Fear / distress
    "scared", "terrified", "terrifying", "afraid", "fear", "fearful", "panic",
    "panicking", "screaming", "scream", "crying", "cry", "shaking", "horrified",
    "horrifying", "desperate", "pleading",

    # Pursuit / predatory behavior
    "following", "followed", "stalking", "stalked", "chasing", "chased",
    "cornered", "blocking", "blocked", "surrounded",

    # Theft / crime in progress
    "robbed", "robbery", "stolen", "stealing", "mugged", "mugging",
    "breaking in", "break-in", "trespassing",

    # Explicit calls for help
    "call police", "call 911", "call cops", "need help", "someone help",
    "get away", "run", "hide", "hiding",
}

MODERATE_URGENCY_WORDS = {
    # Uncomfortable but not immediate
    "uncomfortable", "uneasy", "nervous", "anxious", "worried", "concern",
    "concerned", "suspicious", "odd", "strange", "weird", "creepy", "creep",
    "lurking", "lurk", "loitering", "loiter", "staring", "stared",
    "harassing", "harassment", "catcalling", "catcall", "whistling",
    "shouting", "yelling", "aggressive", "aggressively", "threatening",
    "intimidating", "intimidate", "unsafe", "unpleasant",

    # Environmental hazards
    "broken", "damaged", "hazard", "pothole", "no lights",
    "dark area", "poorly lit", "unlit", "abandoned", "vandalized",
}

LOW_URGENCY_WORDS = {
    # Hedging / uncertainty
    "minor", "small", "slight", "maybe", "possibly", "unsure", "think",
    "probably", "just", "bit", "somewhat", "potential", "might", "seems",
    "appeared", "looked like", "not sure", "perhaps", "could be",

    # Passive observation
    "noticed", "saw", "observed", "heard", "felt", "seemed",
    "checking", "reporting", "just wanted", "fyi", "heads up",
    "not urgent", "no rush", "whenever",
}

# Neutral/positive tone + these words = likely understating danger
RISK_CONTEXT_WORDS = {
    "alone", "by myself", "no one around", "nobody around", "isolated",
    "deserted", "empty street", "dark", "midnight", "late night", "2am", "3am",
    "no lights", "no streetlights", "far from", "no bystanders", "no people",
    "dead end", "alley", "unfamiliar", "lost",
}


def analyze_report(description: str, user_category: str, user_urgency: str) -> dict:
    text           = description.strip()
    low_confidence = not bool(text)

    if low_confidence:
        return {
            "ai_category":         user_category,
            "ai_urgency":          user_urgency,
            "category_confidence": 0.5,
            "urgency_confidence":  0.5,
            "category_mismatch":   False,
            "urgency_mismatch":    False,
            "low_confidence":      True,
            "effective_urgency":   user_urgency,
            "sentiment_score":     0.0,
        }

    text_lower = text.lower()
    words      = set(text_lower.split())

    blob         = TextBlob(text_lower)
    sentiment    = blob.sentiment.polarity      # -1.0 → +1.0
    subjectivity = blob.sentiment.subjectivity  # 0.0  → 1.0

    # ── Category detection via keyword matching ────────────────────────────
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text_lower)

    best_cat   = max(scores, key=scores.get)
    best_score = scores[best_cat]

    if best_score == 0:
        ai_category       = user_category
        cat_confidence    = 0.5
        category_mismatch = False
    else:
        ai_category       = best_cat
        cat_confidence    = min(0.5 + best_score * 0.15, 0.95)
        category_mismatch = ai_category != user_category

    # ── Urgency detection ──────────────────────────────────────────────────
    has_high_words     = bool(HIGH_URGENCY_WORDS     & words)
    has_moderate_words = bool(MODERATE_URGENCY_WORDS & words)
    has_low_words      = bool(LOW_URGENCY_WORDS      & words)
    has_risk_context   = bool(RISK_CONTEXT_WORDS     & words)

    # Neutral/positive tone + risky context = likely understating danger
    is_understating = has_risk_context and sentiment >= -0.1 and not has_high_words

    if has_high_words or sentiment < -0.5 or (subjectivity > 0.8 and sentiment < -0.2):
        ai_urgency     = "high"
        urg_confidence = 0.90
    elif is_understating or (has_moderate_words and not has_low_words):
        ai_urgency     = "moderate"
        urg_confidence = 0.75
    elif has_low_words or sentiment > 0.2:
        ai_urgency     = "low"
        urg_confidence = 0.70
    else:
        if sentiment < -0.1:
            ai_urgency     = "moderate"
            urg_confidence = 0.65
        else:
            ai_urgency     = "low"
            urg_confidence = 0.60

    urgency_mismatch  = ai_urgency != user_urgency
    effective_urgency = ai_urgency if urg_confidence >= 0.70 else user_urgency

    return {
        "ai_category":         ai_category,
        "ai_urgency":          ai_urgency,
        "category_confidence": round(cat_confidence,  3),
        "urgency_confidence":  round(urg_confidence,  3),
        "category_mismatch":   category_mismatch,
        "urgency_mismatch":    urgency_mismatch,
        "low_confidence":      low_confidence,
        "effective_urgency":   effective_urgency,
        "sentiment_score":     round(sentiment, 3),
    }


# ══════════════════════════════════════════════════════════════════════════
# POST /api/reports
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/reports", methods=["POST", "OPTIONS"])
def submit_report():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        token = verify_token(request)
    except Exception as e:
        return jsonify({"error": "Unauthorized", "detail": str(e)}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400

    for field in ["category", "urgency"]:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 422

    nlp = analyze_report(
        description=data.get("description", ""),
        user_category=data["category"],
        user_urgency=data["urgency"],
    )

    report = {
        "uid":                 token["uid"],
        "reporter_id":         data.get("reporter_id", ""),
        "category":            data["category"],
        "urgency":             data["urgency"],
        "description":         data.get("description", ""),
        "location":            data.get("location"),
        "timestamp":           firestore.SERVER_TIMESTAMP,
        "status":              "pending",
        "ai_category":         nlp["ai_category"],
        "ai_urgency":          nlp["ai_urgency"],
        "category_confidence": nlp["category_confidence"],
        "urgency_confidence":  nlp["urgency_confidence"],
        "category_mismatch":   nlp["category_mismatch"],
        "urgency_mismatch":    nlp["urgency_mismatch"],
        "low_confidence":      nlp["low_confidence"],
        "effective_urgency":   nlp["effective_urgency"],
        "sentiment_score":     nlp["sentiment_score"],
    }

    _, doc_ref = db.collection("reports").add(report)
    return jsonify({"success": True, "report_id": doc_ref.id}), 201


# ══════════════════════════════════════════════════════════════════════════
# GET /api/reports
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/reports", methods=["GET"])
def get_reports():
    reports = []
    for doc in db.collection("reports").stream():
        d = doc.to_dict()
        if d.get("location"):
            reports.append({
                "id":                doc.id,
                "category":          d.get("category"),
                "urgency":           d.get("urgency"),
                "effective_urgency": d.get("effective_urgency", d.get("urgency")),
                "ai_urgency":        d.get("ai_urgency"),
                "location":          d.get("location"),
                "status":            d.get("status", "pending"),
            })
    return jsonify(reports), 200


# ══════════════════════════════════════════════════════════════════════════
# POST /api/bugs
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/bugs", methods=["POST", "OPTIONS"])
def submit_bug():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        token = verify_token(request)
    except Exception as e:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}

    bug = {
        "uid":         token["uid"],
        "category":    data.get("category", "other"),
        "severity":    data.get("severity", "low"),
        "description": data.get("description", ""),
        "device":      data.get("device", {}),
        "timestamp":   firestore.SERVER_TIMESTAMP,
    }
    _, doc_ref = db.collection("bug_reports").add(bug)

    try:
        send_email(
            to_address="kikatrize@gmail.com",
            subject=f"[AfterHours Bug] {bug['severity'].upper()} — {bug['category']}",
            html_body=f"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;
                        background:#08192A;color:#E4EDF5;padding:32px;border-radius:16px;">
              <h2 style="color:#F97316;margin-bottom:4px;">AfterHours — Bug Report</h2>
              <p style="color:rgba(228,237,245,0.5);margin-bottom:24px;font-size:13px;">
                Submitted {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}
              </p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:8px 0;color:rgba(228,237,245,0.5);width:120px;">Category</td>
                    <td style="padding:8px 0;font-weight:600;">{bug['category']}</td></tr>
                <tr><td style="padding:8px 0;color:rgba(228,237,245,0.5);">Severity</td>
                    <td style="padding:8px 0;font-weight:600;color:#F97316;">{bug['severity'].upper()}</td></tr>
              </table>
              <div style="background:#0E2540;border-radius:12px;padding:16px;margin-bottom:20px;">
                <p style="color:rgba(228,237,245,0.5);font-size:11px;margin-bottom:8px;
                           text-transform:uppercase;letter-spacing:0.08em;">Description</p>
                <p style="margin:0;line-height:1.6;">{bug['description']}</p>
              </div>
              <div style="background:#0E2540;border-radius:12px;padding:16px;">
                <p style="color:rgba(228,237,245,0.5);font-size:11px;margin-bottom:8px;
                           text-transform:uppercase;letter-spacing:0.08em;">Device Info</p>
                <p style="margin:0;font-size:11px;color:rgba(228,237,245,0.6);
                           word-break:break-all;line-height:1.6;">
                  {data.get('device', {}).get('userAgent', '—')}<br/>
                  Screen: {data.get('device', {}).get('screenSize', '—')} ·
                  Viewport: {data.get('device', {}).get('viewport', '—')}
                </p>
              </div>
            </div>
            """
        )
    except Exception as e:
        print(f"Email send failed: {e}")

    return jsonify({"success": True, "bug_id": doc_ref.id}), 201


# ══════════════════════════════════════════════════════════════════════════
# OTP routes (password reset)
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/auth/send-otp", methods=["POST", "OPTIONS"])
def send_otp():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required."}), 400

    try:
        auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "Could not verify email."}), 500

    otp_code   = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.collection("otp_requests").document(email).set({
        "otp":        otp_code,
        "expires_at": expires_at,
        "used":       False,
    })

    try:
        send_email(
            to_address=email,
            subject="AfterHours — Your Password Reset Code",
            html_body=f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;
                        background:#08192A;color:#E4EDF5;padding:32px;border-radius:16px;">
              <h2 style="color:#F97316;margin-bottom:8px;">AfterHours</h2>
              <p style="color:rgba(228,237,245,0.6);margin-bottom:24px;">
                Someone requested a password reset for your account.
                If this wasn't you, ignore this email.
              </p>
              <div style="background:#0E2540;border:1px solid rgba(255,255,255,0.1);
                          border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="color:rgba(228,237,245,0.5);font-size:13px;margin-bottom:8px;">
                  Your one-time code
                </p>
                <p style="font-size:36px;font-weight:700;letter-spacing:0.2em;
                           color:#F97316;margin:0;">
                  {otp_code}
                </p>
              </div>
              <p style="color:rgba(228,237,245,0.4);font-size:12px;">
                Expires in <strong>10 minutes</strong>. Do not share this code.
              </p>
            </div>
            """
        )
    except Exception as e:
        db.collection("otp_requests").document(email).delete()
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({"success": True}), 200


@app.route("/api/auth/verify-otp", methods=["POST", "OPTIONS"])
def verify_otp():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp   = data.get("otp", "").strip()
    if not email or not otp:
        return jsonify({"error": "Email and OTP are required."}), 400

    doc_ref = db.collection("otp_requests").document(email)
    snap    = doc_ref.get()
    if not snap.exists:
        return jsonify({"error": "No OTP found. Please request a new one."}), 400

    record = snap.to_dict()
    if record.get("used"):
        return jsonify({"error": "Code already used. Please request a new one."}), 400

    expires_at = record.get("expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        doc_ref.delete()
        return jsonify({"error": "Code expired. Please request a new one."}), 400

    if record.get("otp") != otp:
        return jsonify({"error": "Incorrect code. Please try again."}), 400

    doc_ref.update({"used": True})
    return jsonify({"success": True}), 200


@app.route("/api/auth/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data         = request.get_json(silent=True) or {}
    email        = data.get("email", "").strip().lower()
    otp          = data.get("otp", "").strip()
    new_password = data.get("new_password", "").strip()

    if not all([email, otp, new_password]):
        return jsonify({"error": "Email, OTP, and new password are required."}), 400
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 422

    doc_ref = db.collection("otp_requests").document(email)
    snap    = doc_ref.get()
    if not snap.exists:
        return jsonify({"error": "Session expired. Please start over."}), 400

    record = snap.to_dict()
    if not record.get("used"):
        return jsonify({"error": "OTP not verified. Please verify your code first."}), 400
    if record.get("otp") != otp:
        return jsonify({"error": "Invalid session. Please start over."}), 400

    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=new_password)
    except auth.UserNotFoundError:
        return jsonify({"error": "No account found with this email."}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to update password: {str(e)}"}), 500

    doc_ref.delete()
    return jsonify({"success": True}), 200


# ══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)