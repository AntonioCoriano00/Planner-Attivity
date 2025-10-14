import React, { useState } from 'react';
import ActivityCard from '../ActivityCard';
import StatusDashboard from './StatusDashboard';
import './StatusView.css';

const StatusView = ({ activities, onEditActivity, onDeleteActivity, onToggleStatus }) => {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' o 'classic'
  const statusConfig = {
    'da-fare': { 
      label: 'Da Fare', 
      color: '#ff9800', 
      icon: '⏳',
      description: 'Attività da completare'
    },
    'in-corso': { 
      label: 'In Corso', 
      color: '#2196f3', 
      icon: '🔄',
      description: 'Attività in corso di svolgimento'
    },
    'fatta': { 
      label: 'Fatte', 
      color: '#4caf50', 
      icon: '✅',
      description: 'Attività completate'
    },
    'rimandata': { 
      label: 'Rimandate', 
      color: '#f44336', 
      icon: '⏰',
      description: 'Attività rimandate'
    }
  };

  const getActivitiesByStatus = () => {
    const grouped = {};
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = activities.filter(activity => activity.status === status);
    });
    return grouped;
  };

  const activitiesByStatus = getActivitiesByStatus();

  const getTotalActivities = () => activities.length;
  const getCompletedActivities = () => activitiesByStatus['fatta'].length;
  const getInProgressActivities = () => activitiesByStatus['in-corso'].length;
  const getPendingActivities = () => activitiesByStatus['da-fare'].length;
  const getPostponedActivities = () => activitiesByStatus['rimandata'].length;

  const getProgressPercentage = () => {
    const total = getTotalActivities();
    return total > 0 ? Math.round((getCompletedActivities() / total) * 100) : 0;
  };

  const sortActivities = (activities) => {
    return activities.sort((a, b) => {
      // Ordina per priorità
      const priorityOrder = { alta: 3, media: 2, bassa: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Poi per data
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      
      // Infine per ora
      return (a.time || '').localeCompare(b.time || '');
    });
  };

  return (
    <div className="status-view">
      {/* Toggle per cambiare vista */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'classic' ? 'active' : ''}`}
          onClick={() => setViewMode('classic')}
        >
          📋 Classica
        </button>
      </div>

      {viewMode === 'dashboard' ? (
        <StatusDashboard 
          activities={activities}
          onEditActivity={onEditActivity}
          onDeleteActivity={onDeleteActivity}
          onToggleStatus={onToggleStatus}
        />
      ) : (
        <>
          <div className="status-header">
            <h2>Attività per Stato</h2>
            
            <div className="status-stats">
              <div className="stat-item">
                <span className="stat-number">{getTotalActivities()}</span>
                <span className="stat-label">Totale</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getCompletedActivities()}</span>
                <span className="stat-label">Completate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getInProgressActivities()}</span>
                <span className="stat-label">In Corso</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getPendingActivities()}</span>
                <span className="stat-label">Da Fare</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getPostponedActivities()}</span>
                <span className="stat-label">Rimandate</span>
              </div>
              <div className="stat-item progress">
                <span className="stat-number">{getProgressPercentage()}%</span>
                <span className="stat-label">Progresso</span>
              </div>
            </div>
          </div>

          {getTotalActivities() === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Nessuna attività</h3>
              <p>Aggiungi la tua prima attività per iniziare a organizzare il tuo tempo!</p>
            </div>
          ) : (
            <div className="status-content">
              {Object.entries(activitiesByStatus).map(([status, activities]) => {
                const config = statusConfig[status];
                const sortedActivities = sortActivities([...activities]);
                
                return (
                  <div key={status} className="status-section">
                    <div 
                      className="status-section-header"
                      style={{ borderLeftColor: config.color }}
                    >
                      <div className="status-info">
                        <span className="status-icon">{config.icon}</span>
                        <div className="status-details">
                          <h3>{config.label}</h3>
                          <p>{config.description}</p>
                        </div>
                      </div>
                      <div className="status-count">
                        <span className="count-number">{activities.length}</span>
                        <span className="count-label">attività</span>
                      </div>
                    </div>
                    
                    <div className="status-activities">
                      {activities.length === 0 ? (
                        <div className="empty-status">
                          <div className="empty-status-icon">📭</div>
                          <p>Nessuna attività in questo stato</p>
                        </div>
                      ) : (
                        <div className="activities-grid">
                          {sortedActivities.map(activity => (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              onEdit={() => onEditActivity(activity)}
                              onDelete={() => onDeleteActivity(activity.id)}
                              onToggleStatus={() => onToggleStatus(activity.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatusView;
