from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time

from .models import ModerationRequest, ModerationResult, ResolveRequest
from .data_store import db
from .groq_client import evaluate_content
from .routing import apply_policy_routing

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/moderate", response_model=ModerationResult)
def moderate_content(request: ModerationRequest):
    if request.platform not in db.policies:
        raise HTTPException(status_code=400, detail="Invalid platform")
        
    policy = db.policies[request.platform]
    
    try:
        # 1. Call AI
        ai_response = evaluate_content(request.content, request.platform, request.context, request.user_history, policy)
        
        # 2. Extract scores safely
        scores = ai_response.get("scores", {})
        # ensure defaults if ai misses them
        default_scores = {
            "hate_speech": 0.0, "harassment": 0.0, "spam": 0.0, "misinformation": 0.0,
            "graphic_violence": 0.0, "adult_content": 0.0, "self_harm": 0.0
        }
        for k in default_scores:
            if k in scores:
                try:
                    default_scores[k] = float(scores[k])
                except:
                    pass
        
        # 3. Apply post-processing routing logic
        verdict, triggered_category = apply_policy_routing(default_scores, policy)
        
        flagged_segment = ai_response.get("flagged_segment")
        reasoning = ai_response.get("reasoning", "No reasoning provided.")
        confidence = float(ai_response.get("confidence", 0.0))
        
        result = ModerationResult(
            scores=default_scores,
            verdict=verdict,
            triggered_category=triggered_category,
            flagged_segment=flagged_segment,
            reasoning=reasoning,
            confidence=confidence
        )
        
        # 4. Handle state updates
        if verdict == "needs_review":
            item_id = int(time.time() * 1000)
            db.queue.insert(0, {
                "id": item_id,
                "content": request.content,
                "verdict": verdict,
                "flagged_segment": flagged_segment,
                "reasoning": reasoning,
                "platform": request.platform,
                "confidence": confidence,
                "scores": default_scores
            })
        else:
            # Auto-approved or auto-removed goes straight to audit log
            db.audit_log.insert(0, {
                "id": int(time.time() * 1000),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "contentPreview": request.content[:50] + ("..." if len(request.content) > 50 else ""),
                "platform": request.platform,
                "aiVerdict": verdict,
                "finalDecision": "approved" if verdict == "approved" else "removed",
                "decidedBy": "AI Auto",
                "flaggedCategory": triggered_category or "None"
            })
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/policies")
def get_policies():
    return db.policies

@app.put("/policies/{platform}")
def update_policy(platform: str, policy: dict):
    if platform not in db.policies:
        raise HTTPException(status_code=404, detail="Platform not found")
    # Ensure values are integers
    updated = {k: int(v) for k, v in policy.items()}
    db.policies[platform].update(updated)
    return {"message": "Policy updated", "policy": db.policies[platform]}

@app.get("/queue")
def get_queue():
    return db.queue

@app.post("/queue/{item_id}/resolve")
def resolve_queue_item(item_id: int, request: ResolveRequest):
    item = next((q for q in db.queue if q["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
        
    # Remove from queue
    db.queue = [q for q in db.queue if q["id"] != item_id]
    
    # Add to audit log
    decided_by = "Human Reviewer"
    if request.note:
        decided_by += f" (Note: {request.note})"
        
    db.audit_log.insert(0, {
        "id": int(time.time() * 1000),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "contentPreview": item["content"][:50] + ("..." if len(item["content"]) > 50 else ""),
        "platform": item["platform"],
        "aiVerdict": item["verdict"],
        "finalDecision": request.decision,
        "decidedBy": decided_by,
        "flaggedCategory": "multiple/manual"
    })
    
    return {"message": "Resolved"}

@app.get("/audit-log")
def get_audit_log():
    return db.audit_log
