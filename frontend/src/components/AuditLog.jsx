import React, { useState } from 'react';

const AuditLog = ({ log, platforms }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');

  const filteredLog = log.filter(entry => {
    const matchesSearch = entry.contentPreview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || entry.platform === platformFilter;
    const matchesDecision = decisionFilter === 'All' || entry.finalDecision === decisionFilter;
    return matchesSearch && matchesPlatform && matchesDecision;
  });

  return (
    <div className="animate-fade-in card">
      <h2>Audit Log</h2>
      
      <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap'}}>
        <input 
          type="text" 
          placeholder="Search content..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{flex: 1, minWidth: '200px'}}
        />
        <select 
          value={platformFilter} 
          onChange={e => setPlatformFilter(e.target.value)}
        >
          <option value="All">All Platforms</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select 
          value={decisionFilter} 
          onChange={e => setDecisionFilter(e.target.value)}
        >
          <option value="All">All Decisions</option>
          <option value="approved">Approved</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      <div style={{overflowX: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Content Preview</th>
              <th>Platform</th>
              <th>AI Verdict</th>
              <th>Final Decision</th>
              <th>Decided By</th>
              <th>Flagged</th>
            </tr>
          </thead>
          <tbody>
            {filteredLog.length > 0 ? filteredLog.map(entry => (
              <tr key={entry.id}>
                <td style={{whiteSpace: 'nowrap'}}>{entry.timestamp}</td>
                <td style={{maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {entry.contentPreview}
                </td>
                <td style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: entry.platform === 'General Social Media' ? '#3b82f6' : 
                                     entry.platform === 'Gaming Platform' ? '#a855f7' :
                                     entry.platform === "Children's Platform" ? '#22c55e' :
                                     entry.platform === 'Adult Platform' ? '#ef4444' : '#6b7280'
                  }}></span>
                  {entry.platform}
                </td>
                <td><span className={`status-badge status-${entry.aiVerdict}`}>{entry.aiVerdict.replace('_', ' ')}</span></td>
                <td>
                  <span style={{
                    color: entry.finalDecision === 'approved' ? 'var(--success)' : 'var(--danger)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.85rem'
                  }}>
                    {entry.finalDecision}
                  </span>
                </td>
                <td>{entry.decidedBy}</td>
                <td>{entry.flaggedCategory}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
