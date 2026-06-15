import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_multi_category_classification():
    # 1. Multi-category classification
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
        response = client.post("/moderate", json={
            "content": content,
            "platform": "General Social Media",
            "context": ""
        })
        assert response.status_code == 200
        data = response.json()
        
        # Assert the expected category has the highest score
        scores = data["scores"]
        highest_category = max(scores, key=scores.get)
        assert highest_category == expected_category, f"Expected {expected_category} to be highest, but got {highest_category} for content: {content}"

def test_context_aware_analysis():
    # 2. Context-aware analysis
    # Same phrase, different platform (thresholds) -> different verdict
    content = "You suck at this game, I'll destroy you."
    
    # Children's Platform has harassment threshold 50 (review at 25)
    resp_child = client.post("/moderate", json={
        "content": content,
        "platform": "Children's Platform",
        "context": ""
    })
    
    # Gaming Platform has harassment threshold 60 (review at 30)
    # Plus, if we give it context, the AI might score it lower
    resp_gaming = client.post("/moderate", json={
        "content": content,
        "platform": "Gaming Platform",
        "context": "Typical competitive gaming trash talk"
    })
    
    assert resp_child.status_code == 200
    assert resp_gaming.status_code == 200
    
    # Since we explicitly want them to differ (as requested):
    # E.g., Gaming might be approved, Children's might be auto_removed or needs_review
    assert resp_child.json()["verdict"] != resp_gaming.json()["verdict"]

def test_confidence_based_routing():
    # 3. Confidence-based routing
    
    # Clearly safe -> approved
    safe_resp = client.post("/moderate", json={
        "content": "I really loved the sunset today, it was beautiful.",
        "platform": "General Social Media"
    })
    assert safe_resp.json()["verdict"] == "approved"
    
    # Clearly harmful -> auto_removed
    harm_resp = client.post("/moderate", json={
        "content": "I will murder everyone in this thread.",
        "platform": "Children's Platform"
    })
    assert harm_resp.json()["verdict"] == "auto_removed"
    
    # Ambiguous -> needs_review
    client.put("/policies/General Social Media", json={
        "hate_speech": 75, "harassment": 40, "spam": 80, "misinformation": 75,
        "graphic_violence": 70, "adult_content": 70, "self_harm": 60
    })
    ambig_resp = client.post("/moderate", json={
        "content": "You are a bit of an idiot sometimes.",
        "platform": "General Social Media"
    })
    assert ambig_resp.json()["verdict"] == "needs_review"

def test_explainability():
    # 4. Explainability
    content = "I really like this post. Also, buy my illegal drugs here."
    resp = client.post("/moderate", json={
        "content": content,
        "platform": "General Social Media"
    })
    data = resp.json()
    
    assert data["flagged_segment"] is not None
    assert data["flagged_segment"] in content
    assert len(data["reasoning"]) > 0

def test_policy_configuration():
    # 5. Policy configuration changes verdict
    # Use a very mild phrase that is completely safe at default thresholds
    content = "I disagree with what those people are doing."
    
    # Check baseline (should be approved)
    resp1 = client.post("/moderate", json={
        "content": content,
        "platform": "Children's Platform"
    })
    baseline_verdict = resp1.json()["verdict"]
    assert baseline_verdict == "approved"
    
    # Update policy to extremely strict (threshold 0 to catch anything > 0)
    client.put("/policies/Children's Platform", json={
        "hate_speech": 0, "harassment": 0, "spam": 0, "misinformation": 0,
        "graphic_violence": 0, "adult_content": 0, "self_harm": 0
    })
    
    # Check again
    resp2 = client.post("/moderate", json={
        "content": content,
        "platform": "Children's Platform"
    })
    new_verdict = resp2.json()["verdict"]
    
    # Should definitely be auto_removed now since threshold is 0
    assert new_verdict == "auto_removed"
    assert baseline_verdict != new_verdict
