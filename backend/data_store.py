from typing import Dict, List, Any
from .models import QueueItem, AuditLogEntry

class DataStore:
    def __init__(self):
        self.policies: Dict[str, Dict[str, int]] = {
            "Children's Platform": { "hate_speech": 50, "harassment": 50, "spam": 50, "misinformation": 50, "graphic_violence": 50, "adult_content": 50, "self_harm": 50 },
            "General Social Media": { "hate_speech": 75, "harassment": 75, "spam": 80, "misinformation": 75, "graphic_violence": 70, "adult_content": 70, "self_harm": 60 },
            "Adult Platform": { "hate_speech": 80, "harassment": 80, "spam": 80, "misinformation": 80, "graphic_violence": 80, "adult_content": 100, "self_harm": 70 },
            "Gaming Platform": { "hate_speech": 70, "harassment": 60, "spam": 80, "misinformation": 80, "graphic_violence": 80, "adult_content": 60, "self_harm": 60 }
        }
        
        self.queue: List[Dict[str, Any]] = [
            {
                "id": 1,
                "content": "This new game update is literal trash, the developers should jump off a bridge. I'm going to find where they live.",
                "verdict": "needs_review",
                "flagged_segment": "jump off a bridge. I'm going to find where they live.",
                "reasoning": "Contains potential self-harm ideation and harassment/threat towards developers.",
                "platform": "Gaming Platform",
                "confidence": 0.88,
                "scores": { "hate_speech": 0.2, "harassment": 0.85, "spam": 0.0, "misinformation": 0.0, "graphic_violence": 0.1, "adult_content": 0.0, "self_harm": 0.7 }
            },
            {
                "id": 2,
                "content": "Check out my profile for the best adult content! Link in bio. Subcribe to my OF for exclusive videos.",
                "verdict": "needs_review",
                "flagged_segment": "best adult content! Link in bio. Subcribe to my OF",
                "reasoning": "High likelihood of spam and adult content promotion.",
                "platform": "General Social Media",
                "confidence": 0.95,
                "scores": { "hate_speech": 0.0, "harassment": 0.0, "spam": 0.9, "misinformation": 0.0, "graphic_violence": 0.0, "adult_content": 0.85, "self_harm": 0.0 }
            }
        ]
        
        self.audit_log: List[Dict[str, Any]] = [
            { "id": 101, "timestamp": "2026-06-08 10:15:00", "contentPreview": "I love the new layout!", "platform": "General Social Media", "aiVerdict": "approved", "finalDecision": "approved", "decidedBy": "AI Auto", "flaggedCategory": "None" },
            { "id": 102, "timestamp": "2026-06-08 10:45:22", "contentPreview": "Click here to win a free iPhone!!! http://spam-link.com", "platform": "Children's Platform", "aiVerdict": "auto_removed", "finalDecision": "removed", "decidedBy": "AI Auto", "flaggedCategory": "spam" },
            { "id": 103, "timestamp": "2026-06-08 11:30:10", "contentPreview": "You are an idiot and should quit the game.", "platform": "Gaming Platform", "aiVerdict": "needs_review", "finalDecision": "approved", "decidedBy": "Human Reviewer", "flaggedCategory": "harassment" },
            { "id": 104, "timestamp": "2026-06-08 14:20:05", "contentPreview": "Looking to buy some dangerous items. DM me.", "platform": "General Social Media", "aiVerdict": "needs_review", "finalDecision": "removed", "decidedBy": "Human Reviewer", "flaggedCategory": "graphic_violence" },
            { "id": 105, "timestamp": "2026-06-08 16:05:40", "contentPreview": "Just posted a new video of my cat!", "platform": "Children's Platform", "aiVerdict": "approved", "finalDecision": "approved", "decidedBy": "AI Auto", "flaggedCategory": "None" },
        ]

db = DataStore()
