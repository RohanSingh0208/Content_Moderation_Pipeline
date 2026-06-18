import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)

def evaluate_content(content: str, platform: str, context: str, user_history: str, policy: Dict[str, int]) -> Dict[str, Any]:
    policy_str = json.dumps(policy)
    
    system_prompt = f"""
You are a content moderation AI. Analyze the content below and return ONLY a valid JSON object.
Use the following JSON schema:
{{
  "scores": {{
    "hate_speech": 0.0,
    "harassment": 0.0,
    "spam": 0.0,
    "misinformation": 0.0,
    "graphic_violence": 0.0,
    "adult_content": 0.0,
    "self_harm": 0.0
  }},
  "flagged_segment": null,
  "reasoning": "one sentence explanation",
  "confidence": 0.0
}}

Scores must be float values between 0.0 and 1.0.
If a category is triggered, extract the specific substring from the content as 'flagged_segment'. If no segment is uniquely responsible, leave it null.
'reasoning' should be a concise one-sentence explanation of the scores.
'confidence' is your confidence in the assessment from 0.0 to 1.0.

CRITICAL — Context-Aware Analysis:
The 'Conversation context' field below is the MOST IMPORTANT signal for your analysis. It provides real-world situational information about how the content was actually used. You MUST treat context as a high-priority override:
- If context indicates a threat, harassment, or harmful intent, you MUST score the relevant categories HIGH (0.8+) regardless of how innocent the surface text appears or what platform it is on.
- If context is empty or "None", rely on the platform norms and the content itself.
- The platform name alone does NOT excuse harmful content when context explicitly contradicts it.

Platform: {platform}
Platform thresholds (auto_removed if score * 100 exceeds): {policy_str}
Conversation context: {context if context else "None"}
User history: {user_history if user_history else "None"}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    
    raw_response = response.choices[0].message.content
    
    # Fallback strip markdown code fences just in case
    if raw_response.startswith("```json"):
        raw_response = raw_response.replace("```json", "", 1)
    if raw_response.endswith("```"):
        raw_response = raw_response[::-1].replace("```", "", 1)[::-1]
        
    return json.loads(raw_response.strip())
