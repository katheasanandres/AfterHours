from textblob import TextBlob

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
    text = description.strip()
    low_confidence = not bool(text)

    if low_confidence:
        text = FALLBACK_TEXT.get(user_category, "safety concern")

    blob = TextBlob(text)
    polarity  = blob.sentiment.polarity     # -1.0 (negative) to 1.0 (positive)
    subjectivity = blob.sentiment.subjectivity  # 0.0 (objective) to 1.0 (subjective)

    # More negative + more subjective = more urgent/fearful
    if polarity < -0.3 or subjectivity > 0.7:
        ai_urgency = "high"
        urgency_confidence = 0.80
    elif polarity < 0.0:
        ai_urgency = "moderate"
        urgency_confidence = 0.65
    else:
        ai_urgency = "low"
        urgency_confidence = 0.55

    urgency_mismatch  = ai_urgency != user_urgency
    effective_urgency = ai_urgency if urgency_confidence >= 0.60 else user_urgency

    return {
        "ai_category":         user_category,  # trust user on category
        "ai_urgency":          ai_urgency,
        "category_confidence": 0.0,
        "urgency_confidence":  urgency_confidence,
        "category_mismatch":   False,
        "urgency_mismatch":    urgency_mismatch,
        "low_confidence":      low_confidence,
        "effective_urgency":   effective_urgency,
    }