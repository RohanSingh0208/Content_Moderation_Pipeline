import React, { useState } from 'react';

const API_BASE = "http://localhost:8000";

const ReviewQueue = ({ queue, refreshState }) => {
  const [notes, setNotes] = useState({});

  const handleNoteChange = (id, text) => {
    setNotes({...notes, [id]: text});
  };

  const handleAction = async (item, decision) => {
    try {
      await fetch(`${API_BASE}/queue/${item.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: notes[item.id] || null })
      });
      
      // Clear note
      const newNotes = {...notes};
      delete newNotes[item.id];
      setNotes(newNotes);

      // Refresh global state
      refreshState();
    } catch (e) {
      alert("Failed to resolve item");
    }
  };

  return (
    <div className="animate-fade-in">
      <h2>Human Review Queue</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-secondary)'}}>
        Items flagged by AI requiring manual human decision.
      </p>

      {queue.length === 0 ? (
        <div className="card" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)'}}>
          <span style={{fontSize: '3rem'}}>🎉</span>
          <h3>Queue is Empty!</h3>
          <p>All pending items have been reviewed.</p>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {queue.map(item => (
            <div key={item.id} className="card" style={{display: 'flex', gap: '2rem'}}>
              <div style={{flex: 2}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  <span className="status-badge status-needs_review">Needs Review</span>
                  <span style={{
                    fontWeight: 600, fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#fff',
                    backgroundColor: item.platform === 'General Social Media' ? '#3b82f6' : 
                                     item.platform === 'Gaming Platform' ? '#a855f7' :
                                     item.platform === "Children's Platform" ? '#22c55e' :
                                     item.platform === 'Adult Platform' ? '#ef4444' : '#6b7280'
                  }}>
                    {item.platform}
                  </span>
                </div>
                
                <div style={{backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.5'}}>
                  {/* Highlight flagged segment */}
                  {item.flagged_segment ? item.content.split(item.flagged_segment).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i !== arr.length - 1 && (
                        <mark style={{backgroundColor: 'var(--warning-light)', color: '#d9a400', padding: '0 2px', borderRadius: '2px'}}>
                          {item.flagged_segment}
                        </mark>
                      )}
                    </React.Fragment>
                  )) : item.content}
                </div>

                <div style={{marginBottom: '1rem'}}>
                  <strong>AI Reasoning:</strong> <span style={{color: 'var(--text-secondary)'}}>{item.reasoning}</span>
                </div>
                <div>
                  <strong>AI Confidence:</strong> {(item.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem'}}>
                <textarea 
                  placeholder="Add a review note (optional)..."
                  value={notes[item.id] || ''}
                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                  style={{width: '100%', height: '100px', resize: 'none', marginBottom: '1rem'}}
                />
                <div style={{display: 'flex', gap: '1rem', marginTop: 'auto'}}>
                  <button 
                    className="btn-success" 
                    style={{flex: 1}}
                    onClick={() => handleAction(item, 'approved')}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn-danger" 
                    style={{flex: 1}}
                    onClick={() => handleAction(item, 'removed')}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
