import React, { useState } from 'react';

const categories = [
  'hate_speech', 'harassment', 'spam', 'misinformation',
  'graphic_violence', 'adult_content', 'self_harm'
];

const formatLabel = (str) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const PolicySettings = ({ policies, setPolicies, platforms }) => {
  const [localPolicies, setLocalPolicies] = useState(policies);

  const handleSliderChange = (platform, category, value) => {
    setLocalPolicies({
      ...localPolicies,
      [platform]: {
        ...localPolicies[platform],
        [category]: parseInt(value)
      }
    });
  };

  const savePolicies = (platform) => {
    setPolicies({
      ...policies,
      [platform]: localPolicies[platform]
    });
    alert(`Saved policies for ${platform}`);
  };

  return (
    <div className="animate-fade-in">
      <h2>Policy Settings</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-secondary)'}}>
        Configure auto-remove thresholds (0-100) for each platform. 
        <br/>• Above threshold = Auto Remove
        <br/>• Above half threshold = Needs Review
        <br/>• Below half threshold = Approved
      </p>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem'}}>
        {platforms.map(platform => (
          <div key={platform} className="card">
            <h3 style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
              {platform}
            </h3>
            
            {categories.map(cat => {
              const threshold = localPolicies[platform][cat];
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
