import React, { useState } from 'react';
import './MonthlyView.css';
import MonthlyDashboard from './MonthlyDashboard';

const MonthlyView = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToPrevious, onNavigateToNext }) => {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' o 'calendar'
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + (firstDay.getDay() === 0 ? -6 : 1));
    
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 settimane
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const monthDates = getMonthDates(selectedDate);
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const getActivitiesForDate = (date) => {
    const dateStr = formatDate(date);
    return activities.filter(activity => activity.date === dateStr);
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  const isCurrentMonth = (date) => {
    const current = selectedDate;
    return date.getMonth() === current.getMonth() && date.getFullYear() === current.getFullYear();
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getTotalActivitiesForMonth = () => {
    return monthDates
      .filter(date => isCurrentMonth(date))
      .reduce((total, date) => {
        return total + getActivitiesForDate(date).length;
      }, 0);
  };

  const getCompletedActivitiesForMonth = () => {
    return monthDates
      .filter(date => isCurrentMonth(date))
      .reduce((total, date) => {
        const dayActivities = getActivitiesForDate(date);
        return total + dayActivities.filter(a => a.status === 'fatta').length;
      }, 0);
  };

  const getActivityStatusCounts = (date) => {
    const dayActivities = getActivitiesForDate(date);
    return {
      total: dayActivities.length,
      completed: dayActivities.filter(a => a.status === 'fatta').length,
      inProgress: dayActivities.filter(a => a.status === 'in-corso').length,
      pending: dayActivities.filter(a => a.status === 'da-fare').length,
      postponed: dayActivities.filter(a => a.status === 'rimandata').length
    };
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="monthly-view">
      {/* Toggle per cambiare vista */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          📅 Calendario
        </button>
      </div>

      {viewMode === 'dashboard' ? (
        <MonthlyDashboard 
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
          <div className="monthly-header">
            <h2>{getMonthName(selectedDate)}</h2>
            
            <div className="monthly-stats">
              <div className="stat-item">
                <span className="stat-number">{getTotalActivitiesForMonth()}</span>
                <span className="stat-label">Totale</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getCompletedActivitiesForMonth()}</span>
                <span className="stat-label">Completate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {getTotalActivitiesForMonth() > 0 
                    ? Math.round((getCompletedActivitiesForMonth() / getTotalActivitiesForMonth()) * 100) 
                    : 0}%
                </span>
                <span className="stat-label">Progresso</span>
              </div>
            </div>
          </div>

          <div className="monthly-calendar">
            <div className="calendar-header">
              {weekDays.map(day => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="calendar-grid">
              {monthDates.map((date, index) => {
                const counts = getActivityStatusCounts(date);
                const isCurrentMonthDay = isCurrentMonth(date);
                const isTodayDay = isToday(date);
                
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${!isCurrentMonthDay ? 'other-month' : ''} ${isTodayDay ? 'today' : ''}`}
                    onClick={() => {
                      if (isCurrentMonthDay && counts.total > 0) {
                        // Qui potresti aprire un modal con le attività del giorno
                        console.log('Attività per il', date.toLocaleDateString(), ':', getActivitiesForDate(date));
                      }
                    }}
                  >
                    <div className="day-number">{date.getDate()}</div>
                    
                    {counts.total > 0 && (
                      <div className="day-activities">
                        <div className="activity-indicators">
                          {counts.completed > 0 && (
                            <div className="indicator completed" title={`${counts.completed} completate`}>
                              {counts.completed}
                            </div>
                          )}
                          {counts.inProgress > 0 && (
                            <div className="indicator in-progress" title={`${counts.inProgress} in corso`}>
                              {counts.inProgress}
                            </div>
                          )}
                          {counts.pending > 0 && (
                            <div className="indicator pending" title={`${counts.pending} da fare`}>
                              {counts.pending}
                            </div>
                          )}
                          {counts.postponed > 0 && (
                            <div className="indicator postponed" title={`${counts.postponed} rimandate`}>
                              {counts.postponed}
                            </div>
                          )}
                        </div>
                        
                        {counts.total > 3 && (
                          <div className="more-activities">
                            +{counts.total - 3} altre
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="monthly-legend">
            <h3>Legenda</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color completed"></div>
                <span>Completate</span>
              </div>
              <div className="legend-item">
                <div className="legend-color in-progress"></div>
                <span>In Corso</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span>Da Fare</span>
              </div>
              <div className="legend-item">
                <div className="legend-color postponed"></div>
                <span>Rimandate</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyView;
