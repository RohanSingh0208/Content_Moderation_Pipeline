import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def fake_evaluate_content(content, platform, context, user_history, policy):
    base = {"hate_speech": 0.0, "harassment": 0.0, "spam": 0.0, "misinformation": 0.0,
            "graphic_violence": 0.0, "adult_content": 0.0, "self_harm": 0.0}
    lower = content.lower()
    flagged = None

    if "murder" in lower:
        base["harassment"] = 0.95
    elif "idiot sometimes" in lower:
        base["harassment"] = 0.3
    elif "illegal drugs" in lower:
        base["spam"] = 0.9
        flagged = "buy my illegal drugs here"
    elif "disagree with what those people" in lower:
        base["hate_speech"] = 0.05

    return {"scores": base, "flagged_segment": flagged, "reasoning": "Mocked evaluation for deterministic testing.", "confidence": 0.9}


def test_multi_category_classification():
    test_cases = [
        ("I hate [REDACTED] people, they are the worst scum.", "hate_speech"),
        ("You are a stupid idiot and you should stop posting.", "harassment"),
        ("Click here to buy cheap followers!!! http://spam.com", "spam"),
        ("Drinking bleach is a great way to cure the flu.", "misinformation"),
        ("He chopped off his arm and there was blood everywhere.", "graphic_violence"),
        ("Check out my naked pictures at this link.", "adult_content"),
        ("I am going to cut myself tonight, life is pointless.", "self_harm")
    ]
    for content, expected_category in test_cases:
        response = client.post("/moderate", json={"content": content, "platform": "General Social Media", "context": ""})
        assert response.status_code == 200
        scores = response.json()["scores"]
        highest_category = max(scores, key=scores.get)
        assert highest_category == expected_category, f"Expected {expected_category}, got {highest_category} for: {content}"


def test_context_aware_analysis():
    # Same platform, same content — only `context` changes, isolating it as the sole variable.
    content = "I'm going to destroy you in this match."
    platform = "Gaming Platform"

    resp_no_context = client.post("/moderate", json={"content": content, "platform": platform, "context": ""})
    resp_with_context = client.post("/moderate", json={
        "content": content, "platform": platform,
        "context": "This is a death threat sent to a coworker outside of any gaming context."
    })
    assert resp_no_context.status_code == 200 and resp_with_context.status_code == 200
    assert resp_no_context.json()["verdict"] != resp_with_context.json()["verdict"]


def test_confidence_based_routing():
    with patch("backend.main.evaluate_content", side_effect=fake_evaluate_content):
        safe_resp = client.post("/moderate", json={"content": "I really loved the sunset today, it was beautiful.", "platform": "General Social Media"})
        assert safe_resp.json()["verdict"] == "approved"

        harm_resp = client.post("/moderate", json={"content": "I will murder everyone in this thread.", "platform": "Children's Platform"})
        assert harm_resp.json()["verdict"] == "auto_removed"

        client.put("/policies/General Social Media", json={
            "thresholds": {"hate_speech": 75, "harassment": 40, "spam": 80, "misinformation": 75, "graphic_violence": 70, "adult_content": 70, "self_harm": 60}
        })
        ambig_resp = client.post("/moderate", json={"content": "You are a bit of an idiot sometimes.", "platform": "General Social Media"})
        assert ambig_resp.json()["verdict"] == "needs_review"


def test_explainability():
    with patch("backend.main.evaluate_content", side_effect=fake_evaluate_content):
        content = "I really like this post. Also, buy my illegal drugs here."
        resp = client.post("/moderate", json={"content": content, "platform": "General Social Media"})
        data = resp.json()
        assert data["flagged_segment"] is not None
        assert data["flagged_segment"] in content
        assert len(data["reasoning"]) > 0


def test_policy_configuration():
    with patch("backend.main.evaluate_content", side_effect=fake_evaluate_content):
        content = "I disagree with what those people are doing."
        resp1 = client.post("/moderate", json={"content": content, "platform": "Children's Platform"})
        baseline_verdict = resp1.json()["verdict"]
        assert baseline_verdict == "approved"

        client.put("/policies/Children's Platform", json={
            "thresholds": {"hate_speech": 0, "harassment": 0, "spam": 0, "misinformation": 0, "graphic_violence": 0, "adult_content": 0, "self_harm": 0}
        })
        resp2 = client.post("/moderate", json={"content": content, "platform": "Children's Platform"})
        new_verdict = resp2.json()["verdict"]
        assert new_verdict == "auto_removed"
        assert baseline_verdict != new_verdict

        client.put("/policies/Children's Platform", json={
            "thresholds": {"hate_speech": 50, "harassment": 50, "spam": 50, "misinformation": 50, "graphic_violence": 50, "adult_content": 50, "self_harm": 50}
        })


def test_category_toggle_and_custom_rules():
    high_harassment = {
        "scores": {"hate_speech": 0.0, "harassment": 0.9, "spam": 0.0, "misinformation": 0.0, "graphic_violence": 0.0, "adult_content": 0.0, "self_harm": 0.0},
        "flagged_segment": None, "reasoning": "mock", "confidence": 0.9
    }
    with patch("backend.main.evaluate_content", side_effect=lambda *a, **k: high_harassment):
        resp1 = client.post("/moderate", json={"content": "toggle test", "platform": "Gaming Platform"})
        assert resp1.json()["verdict"] == "auto_removed"

        client.put("/policies/Gaming Platform", json={"category_toggles": {"harassment": False}})
        resp2 = client.post("/moderate", json={"content": "toggle test", "platform": "Gaming Platform"})
        assert resp2.json()["verdict"] == "approved"

        client.put("/policies/Gaming Platform", json={"category_toggles": {"harassment": True}})

    client.put("/policies/Gaming Platform", json={"custom_rules": [{"keyword": "gg ez", "action": "approved"}]})
    with patch("backend.main.evaluate_content", side_effect=lambda *a, **k: high_harassment):
        resp3 = client.post("/moderate", json={"content": "gg ez nice game", "platform": "Gaming Platform"})
        assert resp3.json()["verdict"] == "approved"


def test_feedback_loop_and_flagged_segment_validation():
    with patch("backend.main.evaluate_content", side_effect=lambda *a, **k: {
        "scores": {"hate_speech": 0.0, "harassment": 0.45, "spam": 0.0, "misinformation": 0.0, "graphic_violence": 0.0, "adult_content": 0.0, "self_harm": 0.0},
        "flagged_segment": "this text does not appear in content",
        "reasoning": "mock", "confidence": 0.7
    }):
        resp = client.post("/moderate", json={"content": "you are kind of annoying", "platform": "Gaming Platform"})
        data = resp.json()
        assert data["verdict"] == "needs_review"
        assert data["flagged_segment"] is None  # bogus segment discarded

    queue = client.get("/queue").json()
    item_id = queue[0]["id"]

    resolve_resp = client.post(f"/queue/{item_id}/resolve", json={"decision": "approved", "note": "false positive"})
    assert resolve_resp.status_code == 200

    stats = client.get("/feedback-stats").json()
    assert stats["total_reviewed"] >= 1
    assert stats["agreement_rate"] is not None


def test_empty_content_rejected():
    resp = client.post("/moderate", json={"content": "   ", "platform": "Gaming Platform"})
    assert resp.status_code == 422