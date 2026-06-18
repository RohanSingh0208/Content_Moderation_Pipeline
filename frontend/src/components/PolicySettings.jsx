import React, { useState } from 'react';

const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

import { Info } from 'lucide-react';

const categories = [
  'hate_speech', 'harassment', 'spam', 'misinformation',
  'graphic_violence', 'adult_content', 'self_harm'
];

const formatLabel = (str) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const PolicySettings = ({ policies, refreshState, platforms }) => {
  const [localPolicies, setLocalPolicies] = useState(policies);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sync local if global changes
  React.useEffect(() => {
    setLocalPolicies(policies);
  }, [policies]);

  const handleSliderChange = (platform, category, value) => {
    setLocalPolicies({
      ...localPolicies,
      [platform]: {
        ...localPolicies[platform],
        [category]: parseInt(value)
      }
    });
  };

  const savePolicies = async (platform) => {
    try {
      await fetch(`${API_BASE}/policies/${encodeURIComponent(platform)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localPolicies[platform])
      });
      refreshState();
      alert(`Saved policies for ${platform}`);
    } catch (e) {
      alert("Failed to save policies");
    }
  };

  return (
    <div className="animate-fade-in">
      <h2>Policy Settings</h2>
      <div style={{marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative'}}>
        <span style={{color: 'var(--text-secondary)'}}>Configure auto-remove thresholds (0-100) for each platform.</span>
        <div 
          onMouseEnter={() => setShowTooltip(true)} 
          onMouseLeave={() => setShowTooltip(false)}
          style={{cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center'}}
        >
          <Info size={16} />
        </div>
        
        {showTooltip && (
          <div style={{
            position: 'absolute', top: '100%', left: '0', marginTop: '0.5rem',
            backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
            padding: '1rem', borderRadius: '6px', zIndex: 10,
            boxShadow: 'var(--shadow-md)', fontSize: '0.85rem', color: 'var(--text-secondary)'
          }}>
            <strong style={{color: 'var(--text-primary)'}}>Routing Logic:</strong>
            <ul style={{margin: '0.5rem 0 0 1rem', padding: 0}}>
              <li>Above threshold = Auto Remove</li>
              <li>Above half threshold = Needs Review</li>
              <li>Below half threshold = Approved</li>
            </ul>
          </div>
        )}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem'}}>
        {platforms.map(platform => (
          <div key={platform} className="card">
            <h3 style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
              {platform}
            </h3>
            
            {categories.map(cat => {
              const threshold = localPolicies[platform]?.[cat] || 0;
              return (
                <div key={cat} style={{marginBottom: '1rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                    <span style={{fontWeight: 500, fontSize: '0.875rem'}}>{formatLabel(cat)}</span>
                    <span className="badge" style={{backgroundColor: 'var(--primary)'}}>{threshold}</span>
                  </div>
                  <div className="slider-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={threshold} 
                      onChange={(e) => handleSliderChange(platform, cat, e.target.value)}
                    />
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                    <span>0</span>
                    <span>Review: {Math.floor(threshold/2)}+</span>
                    <span>Remove: {threshold}+</span>
                    <span>100</span>
                  </div>
                </div>
              );
            })}
            
            <button 
              className="btn-primary" 
              style={{width: '100%', marginTop: '1rem'}}
              onClick={() => savePolicies(platform)}
            >
              Save Policy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PolicySettings;
