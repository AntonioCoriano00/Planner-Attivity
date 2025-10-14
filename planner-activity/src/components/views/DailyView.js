import React, { useState } from 'react';
import ActivityCard from '../ActivityCard';
import DailyDashboard from './DailyDashboard';
import { getActivitiesForDate } from '../../utils/activityUtils';
import './DailyView.css';

const DailyView = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToPrevious, onNavigateToNext }) => {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' o 'classic'
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDate(selectedDate);
  
  // Filtra le attività per la data selezionata (incluso multi-giorno)
  const dailyActivities = getActivitiesForDate(activities, selectedDateStr);

  // Raggruppa le attività per stato
  const activitiesByStatus = {
    'da-fare': dailyActivities.filter(a => a.status === 'da-fare'),
    'in-corso': dailyActivities.filter(a => a.status === 'in-corso'),
    'fatta': dailyActivities.filter(a => a.status === 'fatta'),
    'rimandata': dailyActivities.filter(a => a.status === 'rimandata')
  };

  const statusConfig = {
    'da-fare': { label: 'Da Fare', color: '#ff9800', icon: '⏳' },
    'in-corso': { label: 'In Corso', color: '#2196f3', icon: '🔄' },
    'fatta': { label: 'Fatte', color: '#4caf50', icon: '✅' },
    'rimandata': { label: 'Rimandate', color: '#f44336', icon: '⏰' }
  };

  const getTotalActivities = () => dailyActivities.length;
  const getCompletedActivities = () => activitiesByStatus['fatta'].length;
  const getProgressPercentage = () => {
    const total = getTotalActivities();
    return total > 0 ? Math.round((getCompletedActivities() / total) * 100) : 0;
  };

  return (
    <div className="daily-view">
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
        <DailyDashboard 
          activities={activities}
          selectedDate={selectedDate}
          onEditActivity={onEditActivity}
          onDeleteActivity={onDeleteActivity}
          onToggleStatus={onToggleStatus}
          onNavigateToPrevious={onNavigateToPrevious}
          onNavigateToNext={onNavigateToNext}
        />
      ) : (
        <>
          <div className="daily-header">
            <h2>Attività del {selectedDate.toLocaleDateString('it-IT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}</h2>
            
            <div className="daily-stats">
              <div className="stat-item">
                <span className="stat-number">{getTotalActivities()}</span>
                <span className="stat-label">Totale</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getCompletedActivities()}</span>
                <span className="stat-label">Completate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getProgressPercentage()}%</span>
                <span className="stat-label">Progresso</span>
              </div>
            </div>
          </div>

          {getTotalActivities() === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>Nessuna attività per oggi</h3>
              <p>Aggiungi una nuova attività per iniziare a pianificare la tua giornata!</p>
            </div>
          ) : (
            <div className="daily-content">
              {Object.entries(activitiesByStatus).map(([status, activities]) => (
                <div key={status} className="status-section">
                  <div 
                    className="status-header"
                    style={{ borderLeftColor: statusConfig[status].color }}
                  >
                    <span className="status-icon">{statusConfig[status].icon}</span>
                    <h3>{statusConfig[status].label}</h3>
                    <span className="activity-count">({activities.length})</span>
                  </div>
                  
                  <div className="activities-grid">
                    {activities.length === 0 ? (
                      <div className="empty-status">
                        <p>Nessuna attività in questo stato</p>
                      </div>
                    ) : (
                      activities
                        .sort((a, b) => {
                          // Ordina per priorità e poi per ora
                          const priorityOrder = { alta: 3, media: 2, bassa: 1 };
                          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                          if (priorityDiff !== 0) return priorityDiff;
                          return (a.time || '').localeCompare(b.time || '');
                        })
                        .map(activity => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onEdit={() => onEditActivity(activity)}
                            onDelete={() => onDeleteActivity(activity.id)}
                            onToggleStatus={() => onToggleStatus(activity.id)}
                          />
                        ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyView;
