from ai_service import (
    classify_report,
    estimate_resources,
    predict_impact,
    summarize_area_pattern,
)


def test_classify_report_detects_light_keyword():
    result = classify_report(None, "Street light is broken")
    assert result == {"category": "infrastructure", "confidence": 0.9, "needs_review": False}


def test_classify_report_defaults_to_other():
    result = classify_report(None, "Something weird happened here")
    assert result == {"category": "other", "confidence": 0.4, "needs_review": True}


def test_classify_report_handles_missing_text():
    result = classify_report(None, None)
    assert result["category"] == "other"
    assert result["needs_review"] is True


def test_predict_impact_flags_high_environmental_impact():
    result = predict_impact("We want to plant a community garden with compost bins")
    assert result["environmental_impact"] == "High Impact"


def test_predict_impact_defaults_to_moderate_impact():
    result = predict_impact("A generic idea with no keywords")
    assert result["environmental_impact"] == "Moderate Impact"


def test_predict_impact_social_keywords_raise_score():
    baseline = predict_impact("just something")["social_connectivity_pct"]
    boosted = predict_impact("A community market and art festival event")["social_connectivity_pct"]
    assert boosted > baseline


def test_predict_impact_score_caps_at_90():
    text = "market gather festival " * 10
    result = predict_impact(text)
    assert result["social_connectivity_pct"] <= 90


def test_estimate_resources_scales_with_text_length():
    short = estimate_resources("short idea")
    long_result = estimate_resources("x" * 500)
    assert long_result["budget_min"] > short["budget_min"]
    assert long_result["volunteers_min"] > short["volunteers_min"]


def test_estimate_resources_handles_empty_text():
    result = estimate_resources("")
    assert result == {
        "budget_min": 300,
        "budget_max": 800,
        "currency": "EUR",
        "volunteers_min": 3,
        "volunteers_max": 6,
    }


def test_summarize_area_pattern_low_volume():
    summary = summarize_area_pattern([{"category": "safety"}, {"category": "safety"}])
    assert "Low report volume" in summary


def test_summarize_area_pattern_reports_top_category():
    reports = [{"category": "safety"}, {"category": "safety"}, {"category": "cleanliness"}]
    summary = summarize_area_pattern(reports)
    assert "3 reports" in summary
    assert "safety" in summary
