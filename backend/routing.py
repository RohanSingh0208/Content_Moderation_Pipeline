from typing import Dict, Any, Tuple

def apply_policy_routing(scores: Dict[str, float], policy: Dict[str, int]) -> Tuple[str, str]:
    """
    Applies the platform policy thresholds to the AI scores.
    Returns a tuple of (verdict, triggered_category).
    Verdict can be 'approved', 'needs_review', or 'auto_removed'.
    Scores are 0.0 to 1.0, thresholds are 0 to 100.
    """
    highest_score = 0.0
    triggered_category = None
    
    # Find the category with the highest risk relative to its threshold
    # But for routing, we strictly apply:
    # >= threshold -> auto_removed
    # >= threshold / 2 -> needs_review
    # < threshold / 2 -> approved
    
    verdict = "approved"
    
    for category, score in scores.items():
        if category not in policy:
            continue
            
        threshold_percentage = policy[category] / 100.0
        review_threshold = threshold_percentage / 2.0
        
        # Determine the worst severity across all categories
        if score >= threshold_percentage:
            verdict = "auto_removed"
            triggered_category = category
            break # auto_removed is the highest severity, can stop
        elif score >= review_threshold:
            if verdict != "needs_review":
                verdict = "needs_review"
                triggered_category = category
            
    return verdict, triggered_category
