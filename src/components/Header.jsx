import React from 'react';

const Header = ({ currentPlatform, setCurrentPlatform, platforms }) => {
  return (
    <div className="header">
      <div className="header-title">
        Dashboard
      </div>
      <div className="platform-selector">
        <label className="form-label" style={{marginBottom: 0}}>Platform Context:</label>
        <select 
          value={currentPlatform} 
          onChange={(e) => setCurrentPlatform(e.target.value)}
        >
          {platforms.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Header;
