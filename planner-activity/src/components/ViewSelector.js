import React from 'react';
import './ViewSelector.css';

const ViewSelector = ({ currentView, onViewChange, onAddActivity, isAdmin, onOpenAdminPanel }) => {
  const views = [
    { id: 'daily', label: 'Giornaliera', icon: '📅' },
    { id: 'weekly', label: 'Settimanale', icon: '📊' },
    { id: 'monthly', label: 'Mensile', icon: '🗓️' },
    { id: 'status', label: 'Per Stato', icon: '📋' }
  ];

  return (
    <nav className="view-selector">
      <div className="view-selector-content">
        <div className="view-buttons">
          {views.map(view => (
            <button
              key={view.id}
              className={`view-button ${currentView === view.id ? 'active' : ''}`}
              onClick={() => onViewChange(view.id)}
              title={view.label}
            >
              <span className="view-icon">{view.icon}</span>
              <span className="view-label">{view.label}</span>
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button 
              className="admin-panel-btn"
              onClick={onOpenAdminPanel}
              title="Apri pannello amministratore"
              style={{
                padding: '10px 20px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ⚙️ Admin Panel
            </button>
          )}
          
          <button 
            className="add-activity-btn"
            onClick={onAddActivity}
            title="Aggiungi nuova attività"
          >
            + Nuova Attività
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ViewSelector;
