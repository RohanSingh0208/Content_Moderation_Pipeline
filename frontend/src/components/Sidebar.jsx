import React from 'react';
import { ShieldCheck, Flag, List, Settings } from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, queueCount }) => {
  const navItems = [
    { id: 'moderate', label: 'Moderate', icon: <ShieldCheck size={20} /> },
    { id: 'queue', label: 'Review Queue', icon: <Flag size={20} />, badge: queueCount },
    { id: 'log', label: 'Audit Log', icon: <List size={20} /> },
    { id: 'policy', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
            title={item.label}
          >
            <div style={{display: 'flex', alignItems: 'center', width: '20px', justifyContent: 'center'}}>
              {item.icon}
            </div>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="badge">{item.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
