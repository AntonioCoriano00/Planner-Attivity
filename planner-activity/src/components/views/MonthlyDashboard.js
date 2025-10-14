import React, { useState, useEffect } from 'react';
import { getActivitiesForDate } from '../../utils/activityUtils';
import './MonthlyDashboard.css';

const MonthlyDashboard = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToPrevious, onNavigateToNext }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Funzioni per calcolare le statistiche
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + (firstDay.getDay() === 0 ? -6 : 1));
    
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const getActivitiesForDateLocal = (date) => {
    const dateStr = formatDate(date);
    return getActivitiesForDate(activities, dateStr);
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

  // Statistiche mensili avanzate
  const getMonthlyStats = () => {
    const monthDates = getMonthDates(selectedDate);
    const currentMonthDates = monthDates.filter(date => isCurrentMonth(date));
    
    let totalActivities = 0;
    let completedActivities = 0;
    let inProgressActivities = 0;
    let pendingActivities = 0;
    let postponedActivities = 0;
    let productiveDays = 0;
    let totalHours = 0;

    currentMonthDates.forEach(date => {
      const dayActivities = getActivitiesForDateLocal(date);
      if (dayActivities.length > 0) productiveDays++;
      
      dayActivities.forEach(activity => {
        totalActivities++;
        totalHours += activity.duration || 0;
        
        switch (activity.status) {
          case 'fatta':
            completedActivities++;
            break;
          case 'in-corso':
            inProgressActivities++;
            break;
          case 'da-fare':
            pendingActivities++;
            break;
          case 'rimandata':
            postponedActivities++;
            break;
        }
      });
    });

    const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
    const productivityScore = totalActivities > 0 ? Math.round((completedActivities + inProgressActivities * 0.5) / totalActivities * 100) : 0;
    const averageActivitiesPerDay = productiveDays > 0 ? Math.round(totalActivities / productiveDays * 10) / 10 : 0;

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      pendingActivities,
      postponedActivities,
      completionRate,
      productivityScore,
      productiveDays,
      totalDays: currentMonthDates.length,
      totalHours,
      averageActivitiesPerDay
    };
  };

  // Statistiche per settimana
  const getWeeklyStats = () => {
    const monthDates = getMonthDates(selectedDate);
    const weeks = [];
    
    for (let i = 0; i < monthDates.length; i += 7) {
      const week = monthDates.slice(i, i + 7);
      const weekActivities = week.reduce((total, date) => {
        return total + getActivitiesForDateLocal(date).length;
      }, 0);
      
      const weekCompleted = week.reduce((total, date) => {
        const dayActivities = getActivitiesForDateLocal(date);
        return total + dayActivities.filter(a => a.status === 'fatta').length;
      }, 0);
      
      weeks.push({
        weekNumber: Math.floor(i / 7) + 1,
        total: weekActivities,
        completed: weekCompleted,
        productivity: weekActivities > 0 ? Math.round((weekCompleted / weekActivities) * 100) : 0
      });
    }
    
    return weeks;
  };

  // Confronto con mese precedente
  const getPreviousMonthComparison = () => {
    const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const prevMonthDates = getMonthDates(prevMonth);
    const prevCurrentMonthDates = prevMonthDates.filter(date => 
      date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear()
    );
    
    let prevTotal = 0;
    let prevCompleted = 0;
    
    prevCurrentMonthDates.forEach(date => {
      const dayActivities = getActivitiesForDateLocal(date);
      prevTotal += dayActivities.length;
      prevCompleted += dayActivities.filter(a => a.status === 'fatta').length;
    });
    
    const currentStats = getMonthlyStats();
    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;
    
    return {
      activitiesChange: currentStats.totalActivities - prevTotal,
      completionChange: currentStats.completionRate - prevCompletionRate,
      isImproving: currentStats.completionRate > prevCompletionRate
    };
  };

  const getActivityStatusCounts = (date) => {
    const dayActivities = getActivitiesForDateLocal(date);
    return {
      total: dayActivities.length,
      completed: dayActivities.filter(a => a.status === 'fatta').length,
      inProgress: dayActivities.filter(a => a.status === 'in-corso').length,
      pending: dayActivities.filter(a => a.status === 'da-fare').length,
      postponed: dayActivities.filter(a => a.status === 'rimandata').length
    };
  };

  const getProductivityLevel = (date) => {
    const counts = getActivityStatusCounts(date);
    if (counts.total === 0) return 0;
    return Math.round((counts.completed + counts.inProgress * 0.5) / counts.total * 100);
  };

  const handleDayClick = (date) => {
    if (isCurrentMonth(date)) {
      setSelectedDay(date);
      setShowDayModal(true);
    }
  };

  const monthDates = getMonthDates(selectedDate);
  const stats = getMonthlyStats();
  const weeklyStats = getWeeklyStats();
  const comparison = getPreviousMonthComparison();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="monthly-dashboard">
      {/* Header con statistiche principali */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>{getMonthName(selectedDate)}</h2>
          <div className="month-navigation">
            <button 
              onClick={() => onNavigateToPrevious && onNavigateToPrevious()}
              className="nav-btn"
              title="Mese precedente"
            >
              ←
            </button>
            <button 
              onClick={() => onNavigateToNext && onNavigateToNext()}
              className="nav-btn"
              title="Mese successivo"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="main-stats">
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalActivities}</div>
              <div className="stat-label">Attività Totali</div>
              <div className="stat-change">
                {comparison.activitiesChange > 0 ? '+' : ''}{comparison.activitiesChange} vs mese scorso
              </div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completionRate}%</div>
              <div className="stat-label">Completamento</div>
              <div className="stat-change">
                {comparison.completionChange > 0 ? '+' : ''}{comparison.completionChange}% vs mese scorso
              </div>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-number">{stats.productivityScore}%</div>
              <div className="stat-label">Produttività</div>
              <div className="stat-change">
                {stats.productiveDays}/{stats.totalDays} giorni attivi
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalHours}h</div>
              <div className="stat-label">Ore Totali</div>
              <div className="stat-change">
                {stats.averageActivitiesPerDay} attività/giorno
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grafici e insights */}
       <div className="dashboard-content">
        <div className="charts-section">
          <div className="chart-card">
            <h3>Produttività Settimanale</h3>
            <div className="weekly-chart">
              {weeklyStats.map((week, index) => (
                <div key={index} className="week-bar">
                  <div className="week-label">S{week.weekNumber}</div>
                  <div className="bar-container">
                    <div 
                      className="productivity-bar"
                      style={{ height: `${week.productivity}%` }}
                      title={`${week.completed}/${week.total} attività completate`}
                    ></div>
                  </div>
                  <div className="week-stats">
                    <div className="week-total">{week.total}</div>
                    <div className="week-completed">{week.completed}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-card">
            <h3>Distribuzione Attività</h3>
            <div className="status-chart">
              <div className="status-item completed">
                <div className="status-bar" style={{ width: `${(stats.completedActivities / stats.totalActivities) * 100}%` }}></div>
                <div className="status-info">
                  <span className="status-label">Completate</span>
                  <span className="status-count">{stats.completedActivities}</span>
                </div>
              </div>
              <div className="status-item in-progress">
                <div className="status-bar" style={{ width: `${(stats.inProgressActivities / stats.totalActivities) * 100}%` }}></div>
                <div className="status-info">
                  <span className="status-label">In Corso</span>
                  <span className="status-count">{stats.inProgressActivities}</span>
                </div>
              </div>
              <div className="status-item pending">
                <div className="status-bar" style={{ width: `${(stats.pendingActivities / stats.totalActivities) * 100}%` }}></div>
                <div className="status-info">
                  <span className="status-label">Da Fare</span>
                  <span className="status-count">{stats.pendingActivities}</span>
                </div>
              </div>
              <div className="status-item postponed">
                <div className="status-bar" style={{ width: `${(stats.postponedActivities / stats.totalActivities) * 100}%` }}></div>
                <div className="status-info">
                  <span className="status-label">Rimandate</span>
                  <span className="status-count">{stats.postponedActivities}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario con heatmap */}
        <div className="calendar-section">
          <div className="calendar-card">
            <h3>Calendario Produttività</h3>
            <div className="calendar-container">
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
                  const productivity = getProductivityLevel(date);
                  const isCurrentMonthDay = isCurrentMonth(date);
                  const isTodayDay = isToday(date);
                  
                  return (
                    <div 
                      key={index} 
                      className={`calendar-day ${!isCurrentMonthDay ? 'other-month' : ''} ${isTodayDay ? 'today' : ''}`}
                      onClick={() => handleDayClick(date)}
                      style={{
                        '--productivity': productivity,
                        '--activity-count': counts.total
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
                          
                          {productivity > 0 && (
                            <div className="productivity-indicator">
                              <div 
                                className="productivity-bar"
                                style={{ width: `${productivity}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Insights e consigli */}
        <div className="insights-section">
          <div className="insights-card">
            <h3>💡 Insights e Consigli</h3>
            <div className="insights-content">
              {stats.completionRate >= 80 && (
                <div className="insight positive">
                  <strong>Ottimo lavoro!</strong> Hai completato l'80% delle attività. Continua così!
                </div>
              )}
              {stats.completionRate < 50 && (
                <div className="insight warning">
                  <strong>Attenzione:</strong> Il tasso di completamento è basso. Considera di ridurre il carico di lavoro.
                </div>
              )}
              {stats.postponedActivities > stats.totalActivities * 0.3 && (
                <div className="insight info">
                  <strong>Suggerimento:</strong> Molte attività sono state rimandate. Valuta se sono davvero necessarie.
                </div>
              )}
              {stats.productiveDays < stats.totalDays * 0.5 && (
                <div className="insight info">
                  <strong>Consiglio:</strong> Prova a distribuire meglio le attività durante il mese.
                </div>
              )}
              {comparison.isImproving && (
                <div className="insight positive">
                  <strong>Miglioramento!</strong> Stai performando meglio rispetto al mese scorso.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal per dettagli giornata */}
      {showDayModal && selectedDay && (
        <div className="day-modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="day-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Attività del {selectedDay.toLocaleDateString('it-IT')}</h3>
              <button className="close-btn" onClick={() => setShowDayModal(false)}>×</button>
            </div>
            <div className="modal-content">
              {getActivitiesForDateLocal(selectedDay).length === 0 ? (
                <p>Nessuna attività per questo giorno.</p>
              ) : (
                <div className="day-activities-list">
                  {getActivitiesForDateLocal(selectedDay).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-info">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <div className="activity-meta">
                          <span className={`status-badge ${activity.status}`}>
                            {activity.status === 'fatta' ? 'Completata' :
                             activity.status === 'in-corso' ? 'In Corso' :
                             activity.status === 'da-fare' ? 'Da Fare' : 'Rimandata'}
                          </span>
                          {activity.duration && <span className="duration">{activity.duration}h</span>}
                        </div>
                      </div>
                      <div className="activity-actions">
                        <button 
                          onClick={() => onToggleStatus(activity.id)}
                          className="action-btn toggle"
                        >
                          {activity.status === 'fatta' ? '↩️' : '✅'}
                        </button>
                        <button 
                          onClick={() => onEditActivity(activity)}
                          className="action-btn edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDeleteActivity(activity.id)}
                          className="action-btn delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyDashboard;
