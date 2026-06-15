import React from 'react';

const Sidebar = ({ currentPage, setCurrentPage, queueCount }) => {
  const navItems = [
    { id: 'moderate', label: 'Moderate Content', icon: '🔍' },
    { id: 'queue', label: 'Review Queue', icon: '📋', badge: queueCount },
    { id: 'log', label: 'Audit Log', icon: '📊' },
    { id: 'policy', label: 'Policy Settings', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        🛡️ AI Mod
      </div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span>{item.icon} {item.label}</span>
            {item.badge > 0 && <span className="badge">{item.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
