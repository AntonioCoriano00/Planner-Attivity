import React, { useState, useEffect } from 'react';
import ActivityCard from '../ActivityCard';
import { getActivitiesForDate } from '../../utils/activityUtils';
import './WeeklyDashboard.css';

const WeeklyDashboard = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToDay, onNavigateToPrevious, onNavigateToNext }) => {
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'analytics'
  const [selectedDay, setSelectedDay] = useState(null);
  const [timelineRange, setTimelineRange] = useState('week'); // '3days', '5days', 'week'

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    startOfWeek.setDate(diff);
    
    let daysToShow = 7; // Default full week
    if (timelineRange === '3days') {
      daysToShow = 3;
    } else if (timelineRange === '5days') {
      daysToShow = 5;
    }
    
    for (let i = 0; i < daysToShow; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      week.push(dayDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const getActivitiesForDateLocal = (date) => {
    const dateStr = formatDate(date);
    return getActivitiesForDate(activities, dateStr);
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

  // Statistiche settimanali avanzate
  const getWeeklyStats = () => {
    let totalActivities = 0;
    let completedActivities = 0;
    let inProgressActivities = 0;
    let pendingActivities = 0;
    let postponedActivities = 0;
    let totalHours = 0;
    let completedHours = 0;
    let productiveDays = 0;
    let highPriorityActivities = 0;
    let completedHighPriority = 0;

    weekDates.forEach(date => {
      const dayActivities = getActivitiesForDateLocal(date);
      if (dayActivities.length > 0) productiveDays++;
      
      dayActivities.forEach(activity => {
        totalActivities++;
        totalHours += activity.duration || 0;
        
        if (activity.priority === 'alta') {
          highPriorityActivities++;
          if (activity.status === 'fatta') completedHighPriority++;
        }
        
        switch (activity.status) {
          case 'fatta':
            completedActivities++;
            completedHours += activity.duration || 0;
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
    const highPriorityCompletion = highPriorityActivities > 0 ? Math.round((completedHighPriority / highPriorityActivities) * 100) : 0;
    const averageActivitiesPerDay = productiveDays > 0 ? Math.round(totalActivities / productiveDays * 10) / 10 : 0;

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      pendingActivities,
      postponedActivities,
      completionRate,
      productivityScore,
      totalHours,
      completedHours,
      productiveDays,
      highPriorityActivities,
      completedHighPriority,
      highPriorityCompletion,
      averageActivitiesPerDay
    };
  };

  // Analisi per giorno della settimana
  const getDayAnalysis = () => {
    return weekDates.map(date => {
      const dayActivities = getActivitiesForDateLocal(date);
      const completed = dayActivities.filter(a => a.status === 'fatta').length;
      const inProgress = dayActivities.filter(a => a.status === 'in-corso').length;
      const pending = dayActivities.filter(a => a.status === 'da-fare').length;
      const postponed = dayActivities.filter(a => a.status === 'rimandata').length;
      
      const totalHours = dayActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
      const completedHours = dayActivities
        .filter(a => a.status === 'fatta')
        .reduce((sum, activity) => sum + (activity.duration || 0), 0);
      
      const productivity = dayActivities.length > 0 ? 
        Math.round((completed + inProgress * 0.5) / dayActivities.length * 100) : 0;
      
      const highPriority = dayActivities.filter(a => a.priority === 'alta').length;
      const completedHighPriority = dayActivities
        .filter(a => a.priority === 'alta' && a.status === 'fatta').length;
      
      return {
        date,
        dayName: getDayName(date),
        dayNumber: getDayNumber(date),
        isToday: isToday(date),
        total: dayActivities.length,
        completed,
        inProgress,
        pending,
        postponed,
        productivity,
        totalHours,
        completedHours,
        highPriority,
        completedHighPriority,
        activities: dayActivities
      };
    });
  };

  // Confronto con settimana precedente
  const getPreviousWeekComparison = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const prevWeekDates = getWeekDates(prevWeek);
    
    let prevTotal = 0;
    let prevCompleted = 0;
    let prevHours = 0;
    
    prevWeekDates.forEach(date => {
      const dayActivities = getActivitiesForDateLocal(date);
      prevTotal += dayActivities.length;
      prevCompleted += dayActivities.filter(a => a.status === 'fatta').length;
      prevHours += dayActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    });
    
    const currentStats = getWeeklyStats();
    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;
    
    return {
      activitiesChange: currentStats.totalActivities - prevTotal,
      completionChange: currentStats.completionRate - prevCompletionRate,
      hoursChange: currentStats.totalHours - prevHours,
      isImproving: currentStats.completionRate > prevCompletionRate
    };
  };

  // Insights settimanali
  const getWeeklyInsights = () => {
    const stats = getWeeklyStats();
    const dayAnalysis = getDayAnalysis();
    const comparison = getPreviousWeekComparison();
    const insights = [];
    
    // Trova il giorno più produttivo
    const mostProductiveDay = dayAnalysis.reduce((max, day) => 
      day.productivity > max.productivity ? day : max, 
      { productivity: 0 }
    );
    
    // Trova il giorno con più attività
    const busiestDay = dayAnalysis.reduce((max, day) => 
      day.total > max.total ? day : max, 
      { total: 0 }
    );
    
    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Settimana Eccellente!',
        message: `Hai completato l'${stats.completionRate}% delle attività. Ottimo lavoro!`
      });
    } else if (stats.completionRate < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Attenzione',
        message: 'Il tasso di completamento è basso. Considera di ridurre il carico di lavoro.'
      });
    }
    
    if (stats.highPriorityCompletion === 100 && stats.highPriorityActivities > 0) {
      insights.push({
        type: 'success',
        icon: '⭐',
        title: 'Priorità Completate',
        message: 'Hai completato tutte le attività ad alta priorità della settimana!'
      });
    }
    
    if (mostProductiveDay.productivity > 0) {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'Giorno Più Produttivo',
        message: `${mostProductiveDay.dayName} è stato il giorno più produttivo con ${mostProductiveDay.productivity}% di produttività.`
      });
    }
    
    if (busiestDay.total > 0) {
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'Giorno Più Intenso',
        message: `${busiestDay.dayName} ha avuto il maggior numero di attività (${busiestDay.total}).`
      });
    }
    
    if (comparison.isImproving) {
      insights.push({
        type: 'success',
        icon: '📊',
        title: 'Miglioramento!',
        message: 'Stai performando meglio rispetto alla settimana scorsa.'
      });
    }
    
    if (stats.productiveDays < 5) {
      insights.push({
        type: 'info',
        icon: '📝',
        title: 'Consiglio',
        message: 'Prova a distribuire meglio le attività durante la settimana.'
      });
    }
    
    return insights;
  };

  const sortActivities = (activities) => {
    return activities.sort((a, b) => {
      const priorityOrder = { alta: 3, media: 2, bassa: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.time || '').localeCompare(b.time || '');
    });
  };

  const stats = getWeeklyStats();
  const dayAnalysis = getDayAnalysis();
  const comparison = getPreviousWeekComparison();
  const insights = getWeeklyInsights();

  return (
    <div className="weekly-dashboard">
      {/* Header con statistiche principali */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>
            {timelineRange === '3days' ? '3 Giorni' : 
             timelineRange === '5days' ? '5 Giorni' : 'Settimana'} del {weekDates[0].toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'long' 
            })} - {weekDates[weekDates.length - 1].toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'long' 
            })}
          </h2>
          <div className="week-navigation">
            <button 
              onClick={() => onNavigateToPrevious && onNavigateToPrevious()}
              className="nav-btn"
              title="Settimana precedente"
            >
              ←
            </button>
            <button 
              onClick={() => onNavigateToNext && onNavigateToNext()}
              className="nav-btn"
              title="Settimana successiva"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="main-stats">
          <div className="stat-card primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalActivities}</div>
              <div className="stat-label">Attività Totali</div>
              <div className="stat-detail">{stats.highPriorityActivities} ad alta priorità</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completionRate}%</div>
              <div className="stat-label">Completamento</div>
              <div className="stat-detail">{stats.completed}/{stats.totalActivities} completate</div>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-number">{stats.productivityScore}%</div>
              <div className="stat-label">Produttività</div>
              <div className="stat-detail">{stats.productiveDays}/7 giorni attivi</div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalHours}h</div>
              <div className="stat-label">Ore Pianificate</div>
              <div className="stat-detail">{stats.completedHours}h completate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controlli Dashboard */}
      <div className="dashboard-controls">
        {/* Toggle per cambiare vista */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            📊 Panoramica
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            📅 Dettagliata
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'analytics' ? 'active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            📈 Analisi
          </button>
        </div>

        {/* Timeline Range Selector */}
        <div className="timeline-range-selector">
          <div className="range-label">
            <span className="range-icon">📅</span>
            <span>Periodo:</span>
          </div>
          <div className="range-buttons">
            <button 
              className={`range-btn ${timelineRange === '3days' ? 'active' : ''}`}
              onClick={() => setTimelineRange('3days')}
              title="Mostra 3 giorni"
            >
              3 Giorni
            </button>
            <button 
              className={`range-btn ${timelineRange === '5days' ? 'active' : ''}`}
              onClick={() => setTimelineRange('5days')}
              title="Mostra 5 giorni"
            >
              5 Giorni
            </button>
            <button 
              className={`range-btn ${timelineRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimelineRange('week')}
              title="Mostra settimana completa"
            >
              Settimana
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      
        {viewMode === 'overview' && (
          <div className="overview-view">
            <div className="weekly-grid" data-days={timelineRange === '3days' ? '3' : timelineRange === '5days' ? '5' : '7'}>
              {dayAnalysis.map((day, index) => (
                <div key={index} className={`day-column ${day.isToday ? 'today' : ''}`}>
                  <div 
                    className="day-header clickable-day"
                    onClick={() => {
                      setSelectedDay(selectedDay === day.date ? null : day.date);
                      onNavigateToDay && onNavigateToDay(day.date);
                    }}
                    title="Clicca per vedere le attività di questo giorno"
                  >
                    <div className="day-info">
                      <span className="day-name">{day.dayName}</span>
                      <span className="day-number">{day.dayNumber}</span>
                    </div>
                    <div className="day-stats">
                      <span className="activity-count">{day.total}</span>
                      {day.total > 0 && (
                        <span className="completion-rate">
                          {day.productivity}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="day-activities">
                    {day.total === 0 ? (
                      <div className="empty-day">
                        <span className="empty-icon">📅</span>
                        <p>Nessuna attività</p>
                      </div>
                    ) : (
                      <>
                        <div className="activity-summary">
                          <div className="summary-item completed">
                            <span className="summary-count">{day.completed}</span>
                            <span className="summary-label">Completate</span>
                          </div>
                          <div className="summary-item in-progress">
                            <span className="summary-count">{day.inProgress}</span>
                            <span className="summary-label">In Corso</span>
                          </div>
                          <div className="summary-item pending">
                            <span className="summary-count">{day.pending}</span>
                            <span className="summary-label">Da Fare</span>
                          </div>
                        </div>
                        
                        {day.highPriority > 0 && (
                          <div className="high-priority-indicator">
                            <span className="priority-icon">⭐</span>
                            <span className="priority-text">{day.highPriority} alta priorità</span>
                          </div>
                        )}
                        
                        {selectedDay && selectedDay.getTime() === day.date.getTime() && (
                          <div className="day-details">
                            {sortActivities([...day.activities])
                              .slice(0, 3)
                              .map(activity => (
                                <ActivityCard
                                  key={activity.id}
                                  activity={activity}
                                  onEdit={() => onEditActivity(activity)}
                                  onDelete={() => onDeleteActivity(activity.id)}
                                  onToggleStatus={() => onToggleStatus(activity.id)}
                                  compact={true}
                                />
                              ))}
                            {day.activities.length > 3 && (
                              <div className="more-activities">
                                +{day.activities.length - 3} altre attività
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Insights per vista Panoramica */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights del Periodo</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia il periodo!</strong> Aggiungi alcune attività per vedere insights personalizzati.
                    </div>
                  ) : (
                    insights.map((insight, index) => (
                      <div key={index} className={`insight ${insight.type}`}>
                        <span className="insight-icon">{insight.icon}</span>
                        <div className="insight-content">
                          <strong>{insight.title}</strong>
                          <p>{insight.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'detailed' && (
          <div className="detailed-view">
            <div className="detailed-grid">
              {dayAnalysis.map((day, index) => (
                <div key={index} className="detailed-day">
                  <div className="day-header-detailed">
                    <div className="day-title">
                      <span className="day-name">{day.dayName}</span>
                      <span className="day-number">{day.dayNumber}</span>
                    </div>
                    <div className="day-metrics">
                      <div className="metric">
                        <span className="metric-value">{day.total}</span>
                        <span className="metric-label">Attività</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{day.productivity}%</span>
                        <span className="metric-label">Produttività</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{day.totalHours}h</span>
                        <span className="metric-label">Ore</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="day-activities-detailed">
                    {day.activities.length === 0 ? (
                      <div className="empty-day-detailed">
                        <span className="empty-icon">📅</span>
                        <p>Nessuna attività</p>
                      </div>
                    ) : (
                      sortActivities([...day.activities]).map(activity => (
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
              ))}
            </div>
            
            {/* Insights per vista Dettagliata */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights del Periodo</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia il periodo!</strong> Aggiungi alcune attività per vedere insights personalizzati.
                    </div>
                  ) : (
                    insights.map((insight, index) => (
                      <div key={index} className={`insight ${insight.type}`}>
                        <span className="insight-icon">{insight.icon}</span>
                        <div className="insight-content">
                          <strong>{insight.title}</strong>
                          <p>{insight.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="analytics-view">
            <div className="analytics-grid">
              <div className="chart-card">
                <h3>Produttività Giornaliera</h3>
                <div className="productivity-chart">
                  {dayAnalysis.map((day, index) => (
                    <div key={index} className="chart-bar">
                      <div className="bar-container">
                        <div 
                          className="productivity-bar"
                          style={{ height: `${day.productivity}%` }}
                          title={`${day.dayName}: ${day.productivity}% produttività`}
                        ></div>
                      </div>
                      <div className="bar-label">{day.dayName}</div>
                      <div className="bar-stats">
                        <div className="bar-total">{day.total}</div>
                        <div className="bar-completed">{day.completed}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Distribuzione Attività</h3>
                <div className="distribution-chart">
                  <div className="distribution-item completed">
                    <div className="distribution-bar" style={{ width: `${(stats.completedActivities / stats.totalActivities) * 100}%` }}></div>
                    <div className="distribution-info">
                      <span className="distribution-label">Completate</span>
                      <span className="distribution-count">{stats.completedActivities}</span>
                    </div>
                  </div>
                  <div className="distribution-item in-progress">
                    <div className="distribution-bar" style={{ width: `${(stats.inProgressActivities / stats.totalActivities) * 100}%` }}></div>
                    <div className="distribution-info">
                      <span className="distribution-label">In Corso</span>
                      <span className="distribution-count">{stats.inProgressActivities}</span>
                    </div>
                  </div>
                  <div className="distribution-item pending">
                    <div className="distribution-bar" style={{ width: `${(stats.pendingActivities / stats.totalActivities) * 100}%` }}></div>
                    <div className="distribution-info">
                      <span className="distribution-label">Da Fare</span>
                      <span className="distribution-count">{stats.pendingActivities}</span>
                    </div>
                  </div>
                  <div className="distribution-item postponed">
                    <div className="distribution-bar" style={{ width: `${(stats.postponedActivities / stats.totalActivities) * 100}%` }}></div>
                    <div className="distribution-info">
                      <span className="distribution-label">Rimandate</span>
                      <span className="distribution-count">{stats.postponedActivities}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Confronto Settimanale</h3>
                <div className="comparison-chart">
                  <div className="comparison-item">
                    <span className="comparison-label">Attività</span>
                    <div className="comparison-value">
                      <span className="current-value">{stats.totalActivities}</span>
                      <span className={`change ${comparison.activitiesChange >= 0 ? 'positive' : 'negative'}`}>
                        {comparison.activitiesChange >= 0 ? '+' : ''}{comparison.activitiesChange}
                      </span>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <span className="comparison-label">Completamento</span>
                    <div className="comparison-value">
                      <span className="current-value">{stats.completionRate}%</span>
                      <span className={`change ${comparison.completionChange >= 0 ? 'positive' : 'negative'}`}>
                        {comparison.completionChange >= 0 ? '+' : ''}{comparison.completionChange}%
                      </span>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <span className="comparison-label">Ore</span>
                    <div className="comparison-value">
                      <span className="current-value">{stats.totalHours}h</span>
                      <span className={`change ${comparison.hoursChange >= 0 ? 'positive' : 'negative'}`}>
                        {comparison.hoursChange >= 0 ? '+' : ''}{comparison.hoursChange}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insights per vista Analisi */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights del Periodo</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia il periodo!</strong> Aggiungi alcune attività per vedere insights personalizzati.
                    </div>
                  ) : (
                    insights.map((insight, index) => (
                      <div key={index} className={`insight ${insight.type}`}>
                        <span className="insight-icon">{insight.icon}</span>
                        <div className="insight-content">
                          <strong>{insight.title}</strong>
                          <p>{insight.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
};

export default WeeklyDashboard;
