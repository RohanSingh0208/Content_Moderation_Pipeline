from typing import Dict, Any, List, Optional, Tuple

def apply_policy_routing(content: str, scores: Dict[str, float], policy: Dict[str, Any]) -> Tuple[str, Optional[str]]:
    """
    Applies the platform policy (custom rules, category toggles, severity
    thresholds) to the AI scores. Returns (verdict, triggered_category).
    """
    thresholds = policy.get("thresholds", {})
    toggles = policy.get("category_toggles", {})
    custom_rules: List[Dict[str, str]] = policy.get("custom_rules", [])

    lower_content = content.lower()
    for rule in custom_rules:
        keyword = (rule.get("keyword") or "").lower().strip()
        if keyword and keyword in lower_content:
            return rule.get("action", "needs_review"), "custom_rule"

    verdict = "approved"
    triggered_category = None
    margin = -1.0 

    for category, score in scores.items():
        if category not in thresholds:
            continue
        if not toggles.get(category, True):
            continue 

        threshold = thresholds[category] / 100.0
        review_threshold = threshold / 2.0

        if score >= threshold and score - threshold > margin:
            verdict = "auto_removed"
            triggered_category = category
            margin = score - threshold
        elif score >= review_threshold and verdict != "auto_removed" and score - review_threshold > margin:
            verdict = "needs_review"
            triggered_category = category
            margin = score - review_threshold

    return verdict, triggered_category