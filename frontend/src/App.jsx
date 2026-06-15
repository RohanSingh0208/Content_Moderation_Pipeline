import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ModerateContent from './components/ModerateContent'
import ReviewQueue from './components/ReviewQueue'
import AuditLog from './components/AuditLog'
import PolicySettings from './components/PolicySettings'
import './App.css'

const API_BASE = "http://localhost:8000";

function App() {
  const [currentPage, setCurrentPage] = useState('moderate');
  const [currentPlatform, setCurrentPlatform] = useState("General Social Media");
  
  // Global State fetched from backend
  const [policies, setPolicies] = useState({});
  const [reviewQueue, setReviewQueue] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const platforms = Object.keys(policies);

  const fetchState = async () => {
    try {
      const [polRes, qRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/policies`),
        fetch(`${API_BASE}/queue`),
        fetch(`${API_BASE}/audit-log`)
      ]);
      if (polRes.ok) setPolicies(await polRes.json());
      if (qRes.ok) setReviewQueue(await qRes.json());
      if (logRes.ok) setAuditLog(await logRes.json());
    } catch (e) {
      console.error("Failed to fetch initial state", e);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const refreshState = () => {
    fetchState();
  };

  const renderPage = () => {
    if (platforms.length === 0) return <div>Loading...</div>;

    switch(currentPage) {
      case 'moderate':
        return <ModerateContent 
                  currentPlatform={currentPlatform} 
                  setCurrentPlatform={setCurrentPlatform}
                  platforms={platforms}
                  refreshState={refreshState}
                  queueCount={reviewQueue.length}
                />;
      case 'queue':
        return <ReviewQueue 
                  queue={reviewQueue} 
                  refreshState={refreshState}
                />;
      case 'log':
        return <AuditLog log={auditLog} platforms={platforms} />;
      case 'policy':
        return <PolicySettings 
                  policies={policies} 
                  refreshState={refreshState}
                  platforms={platforms}
                />;
      default:
        return <ModerateContent />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        queueCount={reviewQueue.length} 
      />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
