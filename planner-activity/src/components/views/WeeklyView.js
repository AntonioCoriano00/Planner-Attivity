import React, { useState } from 'react';
import ActivityCard from '../ActivityCard';
import WeeklyDashboard from './WeeklyDashboard';
import './WeeklyView.css';

const WeeklyView = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToDay, onNavigateToPrevious, onNavigateToNext }) => {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' o 'classic'
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      week.push(dayDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const getActivitiesForDate = (date) => {
    const dateStr = formatDate(date);
    return activities.filter(activity => activity.date === dateStr);
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('it-IT', { weekday: 'short' });
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getTotalActivitiesForWeek = () => {
    return weekDates.reduce((total, date) => {
      return total + getActivitiesForDate(date).length;
    }, 0);
  };

  const getCompletedActivitiesForWeek = () => {
    return weekDates.reduce((total, date) => {
      const dayActivities = getActivitiesForDate(date);
      return total + dayActivities.filter(a => a.status === 'fatta').length;
    }, 0);
  };

  return (
    <div className="weekly-view">
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
          📅 Classica
        </button>
      </div>

      {viewMode === 'dashboard' ? (
        <WeeklyDashboard 
          activities={activities}
          selectedDate={selectedDate}
          onEditActivity={onEditActivity}
          onDeleteActivity={onDeleteActivity}
          onToggleStatus={onToggleStatus}
          onNavigateToDay={onNavigateToDay}
          onNavigateToPrevious={onNavigateToPrevious}
          onNavigateToNext={onNavigateToNext}
        />
      ) : (
        <>
          <div className="weekly-header">
            <h2>
              Settimana del {weekDates[0].toLocaleDateString('it-IT', { 
                day: 'numeric', 
                month: 'long' 
              })} - {weekDates[6].toLocaleDateString('it-IT', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </h2>
            
            <div className="weekly-stats">
              <div className="stat-item">
                <span className="stat-number">{getTotalActivitiesForWeek()}</span>
                <span className="stat-label">Totale</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getCompletedActivitiesForWeek()}</span>
                <span className="stat-label">Completate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {getTotalActivitiesForWeek() > 0 
                    ? Math.round((getCompletedActivitiesForWeek() / getTotalActivitiesForWeek()) * 100) 
                    : 0}%
                </span>
                <span className="stat-label">Progresso</span>
              </div>
            </div>
          </div>

          <div className="weekly-grid">
            {weekDates.map((date, index) => {
              const dayActivities = getActivitiesForDate(date);
              const completedCount = dayActivities.filter(a => a.status === 'fatta').length;
              
              return (
                <div key={index} className={`day-column ${isToday(date) ? 'today' : ''}`}>
                  <div 
                    className="day-header clickable-day"
                    onClick={() => onNavigateToDay && onNavigateToDay(date)}
                    title="Clicca per vedere le attività di questo giorno"
                  >
                    <div className="day-info">
                      <span className="day-name">{getDayName(date)}</span>
                      <span className="day-number">{getDayNumber(date)}</span>
                    </div>
                    <div className="day-stats">
                      <span className="activity-count">{dayActivities.length}</span>
                      {dayActivities.length > 0 && (
                        <span className="completion-rate">
                          {Math.round((completedCount / dayActivities.length) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="day-activities">
                    {dayActivities.length === 0 ? (
                      <div className="empty-day">
                        <span className="empty-icon">📅</span>
                        <p>Nessuna attività</p>
                      </div>
                    ) : (
                      dayActivities
                        .sort((a, b) => {
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
                            compact={true}
                          />
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyView;
