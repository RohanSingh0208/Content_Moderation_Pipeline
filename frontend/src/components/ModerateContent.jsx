import React, { useState } from 'react';
import ResultsCard from './ResultsCard';

const API_BASE = "http://localhost:8000";

const ModerateContent = ({ currentPlatform, platforms, refreshState }) => {
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [userHistory, setUserHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleModerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform: currentPlatform,
          context,
          user_history: userHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error (${response.status})`);
      }

      const data = await response.json();
      data.platformContext = currentPlatform;
      setResult(data);
      
      // Update global state since a new item might have been added to the queue or log
      refreshState();

    } catch (err) {
      setError(err.message || "Failed to parse API response");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setContext('');
    setUserHistory('');
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

        <div className="form-group" style={{marginTop: '1rem'}}>
          <label className="form-label">User History (Optional)</label>
          <input 
            type="text" 
            style={{width: '100%'}}
            placeholder="e.g., 'First-time user', 'Previously flagged for spam'"
            value={userHistory}
            onChange={(e) => setUserHistory(e.target.value)}
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
        addToQueue={() => {}}
        reset={() => setResult(null)} 
      />
    </div>
  );
};

export default ModerateContent;
