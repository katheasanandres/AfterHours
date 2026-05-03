import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
from nlp import analyze_report

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
    #    analyze_report() always runs — if no description was provided it
    #    falls back to the category label as input text, flagging the result
    #    as low_confidence so the heatmap weights it accordingly.
    nlp_result = analyze_report(
        description=data.get("description", ""),
        user_category=data["category"],
        user_urgency=data["urgency"],
    )

    # 5. Build the Firestore document
    #    uid comes from the verified token — never trust the client to send it
    report = {
        # ── User-submitted fields ──────────────────────────────────────
        "uid":         token["uid"],
        "category":    data["category"],
        "urgency":     data["urgency"],
        "description": data.get("description", ""),
        "location":    data.get("location"),    # { lat, lng } or None
        "timestamp":   firestore.SERVER_TIMESTAMP,
        "status":      "pending",

        # ── NLP-generated fields ───────────────────────────────────────
        # What the AI thinks the category and urgency are
        "ai_category":         nlp_result["ai_category"],
        "ai_urgency":          nlp_result["ai_urgency"],

        # How confident the model was (0.0 – 1.0)
        "category_confidence": nlp_result["category_confidence"],
        "urgency_confidence":  nlp_result["urgency_confidence"],

        # True if AI disagrees with what the user selected
        "category_mismatch":   nlp_result["category_mismatch"],
        "urgency_mismatch":    nlp_result["urgency_mismatch"],

        # True when no description was provided — NLP ran on fallback text
        "low_confidence":      nlp_result["low_confidence"],

        # The urgency value the heatmap actually uses:
        # AI urgency when confidence > 0.6, otherwise falls back to user urgency
        "effective_urgency":   nlp_result["effective_urgency"],
    }

    # 6. Write to Firestore
    _, doc_ref = db.collection("reports").add(report)

    return jsonify({
        "success":   True,
        "report_id": doc_ref.id,
    }), 201


# ══════════════════════════════════════════════════════════════════════════
# GET /api/reports  — fetch all reports for heatmap rendering
# ══════════════════════════════════════════════════════════════════════════
@app.route("/api/reports", methods=["GET"])
def get_reports():
    """
    Returns all reports that have a location.
    Public endpoint — no auth needed to read the heatmap.
    TODO: add ?hours=2 query param to filter by time window
    """
    reports_ref = db.collection("reports").stream()
    reports = []

    for doc in reports_ref:
        d = doc.to_dict()
        if d.get("location"):
            reports.append({
                "id":               doc.id,
                "category":         d.get("category"),
                "urgency":          d.get("urgency"),
                "effective_urgency": d.get("effective_urgency", d.get("urgency")),
                "ai_urgency":       d.get("ai_urgency"),
                "location":         d.get("location"),
                "status":           d.get("status", "pending"),
                # Never expose uid or description on public reads
            })

    return jsonify(reports), 200


# ══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    app.run(debug=True, port=5000)
