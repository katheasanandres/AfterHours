import os
import json
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
from nlp import analyze_report
from dotenv import load_dotenv

load_dotenv()

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite dev server

# ── Firebase Admin SDK ─────────────────────────────────────────────────────
cred = credentials.Certificate("service_account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


# ── Auth helper ────────────────────────────────────────────────────────────
def verify_token(request):
    """
    Extracts and verifies the Firebase ID token from the
    Authorization: Bearer <token> header.
    Returns the decoded token dict, or raises on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing or malformed Authorization header.")
    id_token = auth_header.split("Bearer ")[1]
    return auth.verify_id_token(id_token)


# ── Email helper ───────────────────────────────────────────────────────────
def send_email(to_address, subject, html_body):
    """
    Sends an email via Gmail SMTP using credentials from .env.
    MAIL_SENDER and MAIL_APP_PASSWORD must be set.
    """
    sender   = os.getenv("MAIL_SENDER")
    app_pass = os.getenv("MAIL_APP_PASSWORD")

    if not sender or not app_pass:
        raise RuntimeError("MAIL_SENDER or MAIL_APP_PASSWORD not set in .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = sender
    msg["To"]      = to_address
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, app_pass)
        server.sendmail(sender, to_address, msg.as_string())


# ══════════════════════════════════════════════════════════════════════════
# POST /api/reports  — submit a new incident report
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/reports", methods=["POST"])
def submit_report():

    # 1. Verify if the user is authenticated
    try:
        token = verify_token(request)
    except Exception as e:
        return jsonify({"error": "Unauthorized", "detail": str(e)}), 401

    # 2. Parse request body
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400

    # 3. Validate required fields
    for field in ["category", "urgency"]:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 422

    # 4. ── Run NLP analysis ──────────────────────────────────────────────
    nlp_result = analyze_report(
        description=data.get("description", ""),
        user_category=data["category"],
        user_urgency=data["urgency"],
    )

    # 5. Build the Firestore document
    report = {
        "uid":         token["uid"],
        "category":    data["category"],
        "urgency":     data["urgency"],
        "description": data.get("description", ""),
        "location":    data.get("location"),
        "timestamp":   firestore.SERVER_TIMESTAMP,
        "status":      "pending",
        "ai_category":         nlp_result["ai_category"],
        "ai_urgency":          nlp_result["ai_urgency"],
        "category_confidence": nlp_result["category_confidence"],
        "urgency_confidence":  nlp_result["urgency_confidence"],
        "category_mismatch":   nlp_result["category_mismatch"],
        "urgency_mismatch":    nlp_result["urgency_mismatch"],
        "low_confidence":      nlp_result["low_confidence"],
        "effective_urgency":   nlp_result["effective_urgency"],
    }

    _, doc_ref = db.collection("reports").add(report)
    return jsonify({"success": True, "report_id": doc_ref.id}), 201


# ══════════════════════════════════════════════════════════════════════════
# GET /api/reports  — fetch all reports for heatmap rendering
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/reports", methods=["GET"])
def get_reports():
    reports_ref = db.collection("reports").stream()
    reports = []
    for doc in reports_ref:
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
# POST /api/auth/send-otp
# Generates a 6-digit OTP, stores it in Firestore with a 10-min expiry,
# and emails it to the user.
# Public endpoint — no auth token needed (user is logged out).
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    # Verify the email belongs to a real Firebase user before sending anything
    try:
        auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        # Return success anyway to avoid leaking whether an account exists
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": "Could not verify email."}), 500

    # Generate a secure 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Store in Firestore — document ID is the email so it overwrites any
    # previous pending OTP for the same address automatically
    db.collection("otp_requests").document(email).set({
        "otp":        otp_code,
        "expires_at": expires_at,
        "used":       False,
    })

    # Send the email
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
                If this wasn't you, you can safely ignore this email.
              </p>
              <div style="background:#0E2540;border:1px solid rgba(255,255,255,0.1);
                          border-radius:12px;padding:24px;text-align:center;
                          margin-bottom:24px;">
                <p style="color:rgba(228,237,245,0.5);font-size:13px;margin-bottom:8px;">
                  Your one-time code
                </p>
                <p style="font-size:36px;font-weight:700;letter-spacing:0.2em;
                           color:#F97316;margin:0;">
                  {otp_code}
                </p>
              </div>
              <p style="color:rgba(228,237,245,0.4);font-size:12px;">
                This code expires in <strong>10 minutes</strong>.
                Do not share it with anyone.
              </p>
            </div>
            """
        )
    except Exception as e:
        # Clean up the stored OTP if email fails
        db.collection("otp_requests").document(email).delete()
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({"success": True}), 200


# ══════════════════════════════════════════════════════════════════════════
# POST /api/auth/verify-otp
# Checks that the submitted OTP matches, hasn't expired, and hasn't been used.
# Does NOT reset the password yet — just validates the code.
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp   = data.get("otp", "").strip()

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required."}), 400

    doc_ref  = db.collection("otp_requests").document(email)
    snap     = doc_ref.get()

    if not snap.exists:
        return jsonify({"error": "No OTP found for this email. Please request a new one."}), 400

    record = snap.to_dict()

    # Already used
    if record.get("used"):
        return jsonify({"error": "This code has already been used. Please request a new one."}), 400

    # Expired
    expires_at = record.get("expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        doc_ref.delete()
        return jsonify({"error": "This code has expired. Please request a new one."}), 400

    # Wrong code
    if record.get("otp") != otp:
        return jsonify({"error": "Incorrect code. Please check and try again."}), 400

    # Valid — mark as used so it can't be replayed
    doc_ref.update({"used": True})
    return jsonify({"success": True}), 200


# ══════════════════════════════════════════════════════════════════════════
# POST /api/auth/reset-password
# Re-verifies the OTP (already marked used), then uses Firebase Admin SDK
# to update the user's password. Deletes the OTP doc on success.
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data         = request.get_json(silent=True) or {}
    email        = data.get("email", "").strip().lower()
    otp          = data.get("otp", "").strip()
    new_password = data.get("new_password", "").strip()

    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP, and new password are required."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 422

    # Re-check the OTP document — must exist and be marked used (from verify step)
    doc_ref = db.collection("otp_requests").document(email)
    snap    = doc_ref.get()

    if not snap.exists:
        return jsonify({"error": "Session expired. Please start over."}), 400

    record = snap.to_dict()

    # Must have gone through verify-otp first
    if not record.get("used"):
        return jsonify({"error": "OTP not verified. Please verify your code first."}), 400

    # OTP must still match (extra tamper check)
    if record.get("otp") != otp:
        return jsonify({"error": "Invalid session. Please start over."}), 400

    # Update the password via Firebase Admin SDK
    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=new_password)
    except auth.UserNotFoundError:
        return jsonify({"error": "No account found with this email."}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to update password: {str(e)}"}), 500

    # Clean up the OTP document
    doc_ref.delete()

    return jsonify({"success": True}), 200


# ══════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)