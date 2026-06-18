from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional, Any, List

class ModerationRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    platform: str
    context: Optional[str] = ""
    user_history: Optional[str] = ""

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, v):
        if not v.strip():
            raise ValueError("content cannot be empty or whitespace only")
        return v

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
    triggered_category: Optional[str] = None
    flagged_segment: Optional[str] = None
    reasoning: str
    platform: str
    confidence: float
    scores: Dict[str, float]
    context: Optional[str] = ""
    user_history: Optional[str] = ""

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