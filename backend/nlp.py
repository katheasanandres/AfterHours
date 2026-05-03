from transformers import pipeline

_classifier = pipeline(
    "zero-shot-classification",
    model="typeform/distilbart-mnli-12-3"
)

# Frontend category IDs
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

# Maps NLP output back to the app's IDs
CATEGORY_MAP = {
    "poor lighting or dark area":              "poor_lighting",
    "suspicious loitering or lurking person":  "loitering",
    "catcalling or verbal harassment":         "catcalling",
    "broken infrastructure or road hazard":    "broken_infrastructure",
    "unsafe or reckless vehicle":              "unsafe_vehicle",
    "isolated area with no bystanders":        "no_bystanders",
    "general safety concern":                  "other",
}

URGENCY_MAP = {
    "immediate danger or threat":                   "high",
    "concerning but not immediately dangerous":     "moderate",
    "minor safety concern worth noting":            "low",
}


def analyze_report(description: str, user_category: str, user_urgency: str) -> dict:
    """
    Runs zero-shot NLP classification on the report text.
    Falls back to the user's category label if no description provided.
    Returns a dict of AI analysis results to store alongside the report.
    """
    # If no description, use the category as fallback text
    # This ensures NLP always runs — just with lower confidence
    text = description.strip() if description.strip() else _label_from_category(user_category)
    low_confidence = not description.strip()

    # Classify category
    cat_result = _classifier(text, CATEGORY_LABELS, multi_label=False)
    top_cat_label = cat_result["labels"][0]
    top_cat_score = cat_result["scores"][0]

    # Classify urgency
    urg_result = _classifier(text, URGENCY_LABELS, multi_label=False)
    top_urg_label = urg_result["labels"][0]
    top_urg_score = urg_result["scores"][0]

    ai_category = CATEGORY_MAP[top_cat_label]
    ai_urgency  = URGENCY_MAP[top_urg_label]

    # Detect mismatch between what user picked and what NLP detected
    category_mismatch = ai_category != user_category
    urgency_mismatch  = ai_urgency  != user_urgency

    return {
        "ai_category":         ai_category,
        "ai_urgency":          ai_urgency,
        "category_confidence": round(top_cat_score, 3),
        "urgency_confidence":  round(top_urg_score, 3),
        "category_mismatch":   category_mismatch,
        "urgency_mismatch":    urgency_mismatch,
        "low_confidence":      low_confidence,
        # The heatmap uses AI urgency when confidence is high,
        # falls back to user urgency when confidence is low
        "effective_urgency": ai_urgency if top_urg_score > 0.6 else user_urgency,
    }


def _label_from_category(category_id: str) -> str:
    """Converts a category ID back to human-readable text for NLP fallback."""
    labels = {
        "poor_lighting":         "poor lighting dark area unsafe",
        "loitering":             "suspicious person loitering lurking",
        "catcalling":            "catcalling verbal harassment unwanted attention",
        "broken_infrastructure": "broken road hazard damaged infrastructure",
        "unsafe_vehicle":        "reckless driver unsafe vehicle",
        "no_bystanders":         "isolated area no people around",
        "other":                 "general safety concern",
    }
    return labels.get(category_id, "safety concern")