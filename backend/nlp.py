from transformers import pipeline

# ── Model ──────────────────────────────────────────────────────────────────
_classifier = pipeline(
    "zero-shot-classification",
    model="cross-encoder/nli-MiniLM2-L6-H768",
)

# ── Labels ─────────────────────────────────────────────────────────────────
CATEGORY_LABELS = [
    "poor lighting or dark area",
    "suspicious loitering or lurking person",
    "catcalling or verbal harassment",
    "broken infrastructure or road hazard",
    "unsafe or reckless vehicle",
    "isolated area with no bystanders",
    "general safety concern",
]

URGENCY_LABELS = [
    "immediate danger or threat",
    "concerning but not immediately dangerous",
    "minor safety concern worth noting",
]

CATEGORY_MAP = {
    "poor lighting or dark area":             "poor_lighting",
    "suspicious loitering or lurking person": "loitering",
    "catcalling or verbal harassment":        "catcalling",
    "broken infrastructure or road hazard":   "broken_infrastructure",
    "unsafe or reckless vehicle":             "unsafe_vehicle",
    "isolated area with no bystanders":       "no_bystanders",
    "general safety concern":                 "other",
}

URGENCY_MAP = {
    "immediate danger or threat":               "high",
    "concerning but not immediately dangerous": "moderate",
    "minor safety concern worth noting":        "low",
}

FALLBACK_TEXT = {
    "poor_lighting":         "poor lighting dark area unsafe at night",
    "loitering":             "suspicious person loitering lurking nearby",
    "catcalling":            "catcalling verbal harassment unwanted attention",
    "broken_infrastructure": "broken road hazard damaged infrastructure",
    "unsafe_vehicle":        "reckless driver unsafe vehicle speeding",
    "no_bystanders":         "isolated area no people around deserted",
    "other":                 "general safety concern",
}


def analyze_report(description: str, user_category: str, user_urgency: str) -> dict:
    """
    Runs zero-shot NLP classification on the report.

    - If a description was provided, NLP runs on that text.
    - If no description, NLP runs on a fallback phrase derived from the
      user's selected category. Result is flagged as low_confidence.

    Returns a dict of AI fields to store alongside the report in Firestore.
    """
    text          = description.strip()
    low_confidence = not bool(text)

    if low_confidence:
        text = FALLBACK_TEXT.get(user_category, "safety concern")

    # ── Category classification ───────────────────────────────────────────
    cat_result    = _classifier(text, list(CATEGORY_MAP.keys()), multi_label=False)
    top_cat_label = cat_result["labels"][0]
    top_cat_score = round(cat_result["scores"][0], 3)
    ai_category   = CATEGORY_MAP[top_cat_label]

    # ── Urgency classification ────────────────────────────────────────────
    urg_result    = _classifier(text, list(URGENCY_MAP.keys()), multi_label=False)
    top_urg_label = urg_result["labels"][0]
    top_urg_score = round(urg_result["scores"][0], 3)
    ai_urgency    = URGENCY_MAP[top_urg_label]

    # ── Mismatch detection ────────────────────────────────────────────────
    category_mismatch = ai_category != user_category
    urgency_mismatch  = ai_urgency  != user_urgency

    # ── Effective urgency ─────────────────────────────────────────────────
    # Use AI result when confidence is high enough, otherwise trust the user
    effective_urgency = ai_urgency if top_urg_score >= 0.60 else user_urgency

    return {
        "ai_category":         ai_category,
        "ai_urgency":          ai_urgency,
        "category_confidence": top_cat_score,
        "urgency_confidence":  top_urg_score,
        "category_mismatch":   category_mismatch,
        "urgency_mismatch":    urgency_mismatch,
        "low_confidence":      low_confidence,
        "effective_urgency":   effective_urgency,
    }