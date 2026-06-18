from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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
        ai_response = evaluate_content(request.content, request.platform, request.context, request.user_history, policy)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Moderation AI service unavailable: {e}")

    try:
        scores = ai_response.get("scores", {})
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

        verdict, triggered_category = apply_policy_routing(request.content, default_scores, policy)

        flagged_segment = ai_response.get("flagged_segment")
        if flagged_segment and flagged_segment not in request.content:
            flagged_segment = None
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

        if verdict == "needs_review":
            item_id = int(time.time() * 1000)
            db.queue.insert(0, {
                "id": item_id,
                "content": request.content,
                "verdict": verdict,
                "triggered_category": triggered_category,
                "flagged_segment": flagged_segment,
                "reasoning": reasoning,
                "platform": request.platform,
                "confidence": confidence,
                "scores": default_scores,
                "context": request.context,
                "user_history": request.user_history
            })
        else:
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

        db.save()
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

    current = db.policies[platform]
    if "thresholds" in policy:
        current["thresholds"].update({k: int(v) for k, v in policy["thresholds"].items()})
    if "category_toggles" in policy:
        current["category_toggles"].update({k: bool(v) for k, v in policy["category_toggles"].items()})
    if "custom_rules" in policy:
        current["custom_rules"] = policy["custom_rules"]

    db.save()
    return {"message": "Policy updated", "policy": current}

@app.get("/queue")
def get_queue():
    return db.queue

@app.post("/queue/{item_id}/resolve")
def resolve_queue_item(item_id: int, request: ResolveRequest):
    item = next((q for q in db.queue if q["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    db.queue = [q for q in db.queue if q["id"] != item_id]

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
        "flaggedCategory": item.get("triggered_category") or "multiple/manual"
    })

    agreed_with_ai = (request.decision == "removed")
    db.feedback_log.insert(0, {
        "id": int(time.time() * 1000),
        "queue_item_id": item_id,
        "platform": item["platform"],
        "ai_verdict": item["verdict"],
        "ai_triggered_category": item.get("triggered_category"),
        "ai_confidence": item["confidence"],
        "human_decision": request.decision,
        "agreed_with_ai": agreed_with_ai,
        "note": request.note
    })

    db.save()
    return {"message": "Resolved"}

@app.get("/audit-log")
def get_audit_log():
    return db.audit_log

@app.get("/feedback-stats")
def get_feedback_stats():
    total = len(db.feedback_log)
    if total == 0:
        return {"total_reviewed": 0, "agreement_rate": None, "most_overridden_category": None, "overrides_by_category": {}}

    agreed = sum(1 for f in db.feedback_log if f["agreed_with_ai"])
    overrides_by_category = {}
    for f in db.feedback_log:
        if not f["agreed_with_ai"] and f["ai_triggered_category"]:
            cat = f["ai_triggered_category"]
            overrides_by_category[cat] = overrides_by_category.get(cat, 0) + 1
    most_overridden = max(overrides_by_category, key=overrides_by_category.get) if overrides_by_category else None

    return {
        "total_reviewed": total,
        "agreement_rate": round(agreed / total, 3),
        "most_overridden_category": most_overridden,
        "overrides_by_category": overrides_by_category
    }

# Serve React frontend in production
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))