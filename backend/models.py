from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class ModerationRequest(BaseModel):
    content: str
    platform: str
    context: Optional[str] = ""
    user_history: Optional[str] = ""

class Scores(BaseModel):
    hate_speech: float
    harassment: float
    spam: float
    misinformation: float
    graphic_violence: float
    adult_content: float
    self_harm: float

class ModerationResult(BaseModel):
    scores: Scores
    verdict: str
    triggered_category: Optional[str] = None
    flagged_segment: Optional[str] = None
    reasoning: str
    confidence: float

class QueueItem(BaseModel):
    id: int
    content: str
    verdict: str
    flagged_segment: Optional[str] = None
    reasoning: str
    platform: str
    confidence: float
    scores: Dict[str, float]

class AuditLogEntry(BaseModel):
    id: int
    timestamp: str
    contentPreview: str
    platform: str
    aiVerdict: str
    finalDecision: str
    decidedBy: str
    flaggedCategory: str

class ResolveRequest(BaseModel):
    decision: str
    note: Optional[str] = None
