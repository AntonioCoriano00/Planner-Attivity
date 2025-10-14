import React, { useState, useEffect } from 'react';
import ActivityCard from '../ActivityCard';
import { getActivitiesForDate, isMultiDayActivity, isMultiHourActivity, formatActivityTimeRange } from '../../utils/activityUtils';
import './DailyDashboard.css';

const DailyDashboard = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToPrevious, onNavigateToNext }) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'kanban', 'focus'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [timelineRef, setTimelineRef] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Effetto per scorrere automaticamente all'ora corrente quando si carica la timeline
  useEffect(() => {
    if (timelineRef && viewMode === 'timeline') {
      const isToday = formatDate(selectedDate) === formatDate(new Date());
      if (isToday) {
        // Aspetta un po' per assicurarsi che la timeline sia renderizzata
        setTimeout(() => {
          scrollToCurrentHour();
        }, 100);
      }
    }
  }, [timelineRef, viewMode, selectedDate]);

  // Funzione di scroll rimossa - timeline ora completamente adattiva

  const scrollToCurrentHour = () => {
    if (timelineRef) {
      const currentHour = new Date().getHours();
      const containerWidth = timelineRef.clientWidth;
      const slotWidth = containerWidth / 24; // Larghezza adattiva per slot
      const scrollPosition = currentHour * slotWidth;
      
      timelineRef.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
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
    'da-fare': { label: 'Da Fare', color: '#ff9800', icon: '⏳', bgColor: '#fff3e0' },
    'in-corso': { label: 'In Corso', color: '#2196f3', icon: '🔄', bgColor: '#e3f2fd' },
    'fatta': { label: 'Fatte', color: '#4caf50', icon: '✅', bgColor: '#e8f5e8' },
    'rimandata': { label: 'Rimandate', color: '#f44336', icon: '⏰', bgColor: '#ffebee' }
  };

  // Statistiche giornaliere avanzate
  const getDailyStats = () => {
    const total = dailyActivities.length;
    const completed = activitiesByStatus['fatta'].length;
    const inProgress = activitiesByStatus['in-corso'].length;
    const pending = activitiesByStatus['da-fare'].length;
    const postponed = activitiesByStatus['rimandata'].length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const productivityScore = total > 0 ? Math.round((completed + inProgress * 0.5) / total * 100) : 0;
    
    // Calcola ore totali
    const totalHours = dailyActivities.reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);
    
    // Calcola ore completate
    const completedHours = activitiesByStatus['fatta'].reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);
    
    // Trova attività ad alta priorità
    const highPriorityActivities = dailyActivities.filter(a => a.priority === 'alta');
    const completedHighPriority = highPriorityActivities.filter(a => a.status === 'fatta').length;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      postponed,
      completionRate,
      productivityScore,
      totalHours,
      completedHours,
      highPriorityCount: highPriorityActivities.length,
      completedHighPriority,
      highPriorityCompletion: highPriorityActivities.length > 0 ? 
        Math.round((completedHighPriority / highPriorityActivities.length) * 100) : 0
    };
  };

  // Genera slot orari per la timeline
  const generateTimeSlots = () => {
    const slots = [];
    const currentHour = new Date().getHours();
    const isToday = formatDate(selectedDate) === formatDate(new Date());
    
    for (let hour = 0; hour <= 23; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const activitiesInSlot = dailyActivities.filter(activity => {
        if (!activity.time) return false;
        const activityHour = parseInt(activity.time.split(':')[0]);
        return activityHour === hour;
      });
      
      slots.push({
        time: timeStr,
        hour: hour,
        activities: activitiesInSlot,
        isNightTime: hour >= 0 && hour < 6,
        isWorkTime: hour >= 9 && hour < 18,
        isCurrentHour: isToday && hour === currentHour
      });
    }
    return slots;
  };

  // Analisi della giornata
  const getDayAnalysis = () => {
    const stats = getDailyStats();
    const timeSlots = generateTimeSlots();
    const mostProductiveHour = timeSlots.reduce((max, slot) => 
      slot.activities.length > max.activities.length ? slot : max, 
      { activities: [] }
    );
    
    const insights = [];
    
    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Giornata Eccellente!',
        message: `Hai completato l'${stats.completionRate}% delle attività. Continua così!`
      });
    } else if (stats.completionRate < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Attenzione',
        message: 'Il tasso di completamento è basso. Considera di ridurre il carico di lavoro.'
      });
    }
    
    if (stats.highPriorityCompletion === 100 && stats.highPriorityCount > 0) {
      insights.push({
        type: 'success',
        icon: '⭐',
        title: 'Priorità Completate',
        message: 'Hai completato tutte le attività ad alta priorità!'
      });
    }
    
    if (mostProductiveHour.activities.length > 0) {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'Ora Più Produttiva',
        message: `Le ${mostProductiveHour.time} sono state le più produttive con ${mostProductiveHour.activities.length} attività.`
      });
    }
    
    if (stats.postponed > stats.total * 0.3) {
      insights.push({
        type: 'info',
        icon: '🔄',
        title: 'Molte Attività Rimandate',
        message: 'Considera se tutte le attività rimandate sono davvero necessarie.'
      });
    }
    
    return { insights, mostProductiveHour };
  };

  const sortActivities = (activities) => {
    return activities.sort((a, b) => {
      const priorityOrder = { alta: 3, media: 2, bassa: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.time || '').localeCompare(b.time || '');
    });
  };

  const stats = getDailyStats();
  const timeSlots = generateTimeSlots();
  const { insights, mostProductiveHour } = getDayAnalysis();

  return (
    <div className="daily-dashboard">
      {/* Header con statistiche principali */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>
            {selectedDate.toLocaleDateString('it-IT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </h2>
          <div className="date-navigation">
            <button 
              onClick={() => onNavigateToPrevious && onNavigateToPrevious()}
              className="nav-btn"
              title="Giorno precedente"
            >
              ←
            </button>
            <button 
              onClick={() => onNavigateToNext && onNavigateToNext()}
              className="nav-btn"
              title="Giorno successivo"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="main-stats">
          <div className="stat-card primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Attività Totali</div>
              <div className="stat-detail">{stats.highPriorityCount} ad alta priorità</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completionRate}%</div>
              <div className="stat-label">Completamento</div>
              <div className="stat-detail">{stats.completed}/{stats.total} completate</div>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-number">{stats.productivityScore}%</div>
              <div className="stat-label">Produttività</div>
              <div className="stat-detail">{stats.inProgress} in corso</div>
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
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            🕐 Timeline
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            📋 Kanban
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
            onClick={() => setViewMode('focus')}
          >
            🎯 Focus
          </button>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="dashboard-content">
        {viewMode === 'timeline' && (
          <div className="timeline-view">
            <div className="timeline-container">
              <h3>Timeline della Giornata</h3>
              <button 
                className="timeline-current-hour-btn"
                onClick={scrollToCurrentHour}
                title="Vai all'ora corrente"
              >
                🕐
              </button>
              <div 
                className="timeline-slots"
                ref={setTimelineRef}
              >
                {timeSlots.map((slot, index) => (
                  <div 
                    key={index} 
                    className={`time-slot ${slot.activities.length > 0 ? 'has-activities' : ''} ${selectedTimeSlot === slot.hour ? 'selected' : ''} ${slot.isNightTime ? 'night-time' : ''} ${slot.isWorkTime ? 'work-time' : ''} ${slot.isCurrentHour ? 'current-hour' : ''}`}
                    onClick={() => setSelectedTimeSlot(selectedTimeSlot === slot.hour ? null : slot.hour)}
                  >
                    <div className="time-label">
                      {slot.time}
                      {slot.isNightTime && <span className="night-indicator">🌙</span>}
                      {slot.isWorkTime && <span className="work-indicator">💼</span>}
                    </div>
                    <div className="time-activities">
                      {slot.activities.length === 0 ? (
                        <div className="empty-slot">
                          <span className="empty-icon">⭕</span>
                        </div>
                      ) : (
                        <div className="activity-indicators">
                          {slot.activities.slice(0, 3).map((activity, actIndex) => (
                            <div 
                              key={actIndex}
                              className="activity-item"
                              title={activity.title}
                            >
                              <div className={`activity-dot ${activity.status}`}></div>
                              <span className="activity-title">{activity.title}</span>
                            </div>
                          ))}
                          {slot.activities.length > 3 && (
                            <div className="more-activities">+{slot.activities.length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedTimeSlot !== null && (
              <div className="time-slot-details">
                <h4>Attività alle {timeSlots.find(s => s.hour === selectedTimeSlot)?.time}</h4>
                <div className="slot-activities">
                  {timeSlots.find(s => s.hour === selectedTimeSlot)?.activities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={() => onEditActivity(activity)}
                      onDelete={() => onDeleteActivity(activity.id)}
                      onToggleStatus={() => onToggleStatus(activity.id)}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Insights per vista Timeline */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights della Giornata</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia la giornata!</strong> Aggiungi alcune attività per vedere insights personalizzati.
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

        {viewMode === 'kanban' && (
          <div className="kanban-view">
            <div className="kanban-board">
              {Object.entries(activitiesByStatus).map(([status, activities]) => {
                const config = statusConfig[status];
                const sortedActivities = sortActivities([...activities]);
                
                return (
                  <div key={status} className="kanban-column">
                    <div 
                      className="column-header"
                      style={{ backgroundColor: config.bgColor, borderTopColor: config.color }}
                    >
                      <div className="column-title">
                        <span className="column-icon">{config.icon}</span>
                        <span className="column-label">{config.label}</span>
                        <span className="column-count">({activities.length})</span>
                      </div>
                    </div>
                    
                    <div className="column-content">
                      {activities.length === 0 ? (
                        <div className="empty-column">
                          <div className="empty-icon">📭</div>
                          <p>Nessuna attività</p>
                        </div>
                      ) : (
                        sortedActivities.map(activity => (
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
            
            {/* Insights per vista Kanban */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights della Giornata</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia la giornata!</strong> Aggiungi alcune attività per vedere insights personalizzati.
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

        {viewMode === 'focus' && (
          <div className="focus-view">
            <div className="focus-content">
              <div className="focus-priorities">
                <h3>🎯 Attività ad Alta Priorità</h3>
                <div className="priority-activities">
                  {dailyActivities
                    .filter(a => a.priority === 'alta')
                    .sort((a, b) => {
                      const statusOrder = { 'da-fare': 3, 'in-corso': 2, 'fatta': 1, 'rimandata': 0 };
                      return statusOrder[b.status] - statusOrder[a.status];
                    })
                    .map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onEdit={() => onEditActivity(activity)}
                        onDelete={() => onDeleteActivity(activity.id)}
                        onToggleStatus={() => onToggleStatus(activity.id)}
                        highlight={true}
                      />
                    ))}
                </div>
              </div>
              
              <div className="focus-progress">
                <h3>📊 Progresso Giornaliero</h3>
                <div className="progress-ring">
                  <div className="progress-circle">
                    <div className="progress-text">
                      <div className="progress-percentage">{stats.completionRate}%</div>
                      <div className="progress-label">Completato</div>
                    </div>
                  </div>
                </div>
                <div className="progress-details">
                  <div className="progress-item">
                    <span className="progress-label">Completate</span>
                    <span className="progress-value">{stats.completed}</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">In Corso</span>
                    <span className="progress-value">{stats.inProgress}</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Da Fare</span>
                    <span className="progress-value">{stats.pending}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insights per vista Focus */}
            <div className="insights-section">
              <div className="insights-card">
                <h3>💡 Insights della Giornata</h3>
                <div className="insights-content">
                  {insights.length === 0 ? (
                    <div className="insight neutral">
                      <strong>Inizia la giornata!</strong> Aggiungi alcune attività per vedere insights personalizzati.
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
    </div>
  );
};

export default DailyDashboard;
