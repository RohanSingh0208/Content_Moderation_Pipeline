import React, { useState } from 'react';
import ResultsCard from './ResultsCard';

// Fetch Groq API Key from .env (Vite uses import.meta.env)
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const ModerateContent = ({ currentPlatform, platforms, policies, addToQueue, addToLog }) => {
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleModerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const platformPolicy = JSON.stringify(policies[currentPlatform]);

    const promptText = `
You are a content moderation AI. Analyze the content below and return ONLY a valid JSON object — no explanation, no markdown, no code fences. Just raw JSON.

{
  "scores": {
    "hate_speech": 0.0,
    "harassment": 0.0,
    "spam": 0.0,
    "misinformation": 0.0,
    "graphic_violence": 0.0,
    "adult_content": 0.0,
    "self_harm": 0.0
  },
  "verdict": "approved",
  "triggered_category": null,
  "flagged_segment": null,
  "reasoning": "one sentence explanation",
  "confidence": 0.0
}

Verdict must be one of: "approved", "auto_removed", "needs_review"
Scores are 0.0 to 1.0.
Platform: ${currentPlatform}
Platform thresholds (auto_removed if score * 100 exceeds): ${platformPolicy}
Conversation context: ${context || "None"}
Content to moderate: ${content}
`;

    try {
      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Updated to current supported model
          messages: [{ role: "user", content: promptText }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails = response.statusText;
        try {
          const parsed = JSON.parse(errorText);
          errorDetails = parsed.error?.message || errorText;
        } catch(e) {
          errorDetails = errorText || response.statusText;
        }
        throw new Error(`API error (${response.status}): ${errorDetails}`);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content;

      // Strip markdown code fences
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedResult = JSON.parse(responseText);
      
      // Inject platform context for the ResultsCard
      parsedResult.platformContext = currentPlatform;
      setResult(parsedResult);

      // If it's an auto decision (approved/auto_removed), log it immediately
      if (parsedResult.verdict === 'approved' || parsedResult.verdict === 'auto_removed') {
        addToLog({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          platform: currentPlatform,
          aiVerdict: parsedResult.verdict,
          finalDecision: parsedResult.verdict === 'approved' ? 'approved' : 'removed',
          decidedBy: "AI Auto",
          flaggedCategory: parsedResult.triggered_category || "None"
        });
      }

    } catch (err) {
      setError(err.message || "Failed to parse API response");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setContext('');
    setResult(null);
  };

  return (
    <div className="animate-fade-in" style={{maxWidth: '800px', margin: '0 auto'}}>
      <h2>Moderate Content</h2>
      
      <div className="card" style={{marginTop: '1.5rem'}}>
        <div className="form-group">
          <label className="form-label">Content to Evaluate</label>
          <textarea 
            rows="6" 
            style={{width: '100%', resize: 'vertical'}}
            placeholder="Paste post, comment, or message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Conversation Context (Optional)</label>
          <input 
            type="text" 
            style={{width: '100%'}}
            placeholder="e.g., 'User is quoting a movie', 'Reply to a heated debate'"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
          <button 
            className="btn-primary" 
            style={{flex: 1, padding: '0.75rem', fontSize: '1rem', opacity: loading ? 0.7 : 1}}
            onClick={handleModerate}
            disabled={loading || !content.trim()}
          >
            {loading ? 'Analyzing with AI...' : 'Moderate Content'}
          </button>
          <button 
            style={{backgroundColor: 'var(--bg-light)', color: 'var(--text-secondary)'}}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        {error && (
          <div style={{marginTop: '1rem', color: 'var(--danger)', padding: '1rem', backgroundColor: 'var(--danger-light)', borderRadius: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <ResultsCard 
        result={result} 
        content={content}
        addToQueue={addToQueue} 
        reset={() => setResult(null)} 
      />
    </div>
  );
};

export default ModerateContent;
