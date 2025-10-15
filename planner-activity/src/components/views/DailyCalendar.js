import React, { useState, useEffect, useRef } from 'react';
import ActivityCard from '../ActivityCard';
import ActivityDetailsModal from './ActivityDetailsModal';
import { getActivitiesForDate } from '../../utils/activityUtils';
import './DailyCalendar.css';

const DailyCalendar = ({ 
  activities, 
  selectedDate, 
  onEditActivity, 
  onDeleteActivity, 
  onToggleStatus, 
  onUpdateActivity,
  onNavigateToPrevious, 
  onNavigateToNext, 
  onNavigateToToday, 
  onCreateActivity 
}) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const timelineRef = useRef(null);

  // Aggiorna selectedActivity quando l'array activities cambia
  useEffect(() => {
    if (selectedActivity) {
      const updatedActivity = activities.find(a => a.id === selectedActivity.id);
      if (updatedActivity) {
        setSelectedActivity(updatedActivity);
      }
    }
  }, [activities, selectedActivity]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDate(selectedDate);
  
  // Filtra le attività per la data selezionata
  const dailyActivities = getActivitiesForDate(activities, selectedDateStr);

  // Genera le fasce orarie (ogni mezz'ora)
  const generateTimeSlots = () => {
    const slots = [];
    const currentTime = new Date();
    const isToday = formatDate(selectedDate) === formatDate(currentTime);
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotTime = new Date();
        slotTime.setHours(hour, minute, 0, 0);
        
        // Trova le attività in questo slot orario
        const activitiesInSlot = dailyActivities.filter(activity => {
          if (!activity.time) return false;
          const activityTime = activity.time;
          const activityHour = parseInt(activityTime.split(':')[0]);
          const activityMinute = parseInt(activityTime.split(':')[1]);
          
          // Controlla se l'attività inizia in questo slot o si sovrappone
          if (activity.isMultiHour && activity.endTime) {
            const endHour = parseInt(activity.endTime.split(':')[0]);
            const endMinute = parseInt(activity.endTime.split(':')[1]);
            
            // Attività che inizia prima ma finisce durante questo slot
            if (activityHour < hour || (activityHour === hour && activityMinute <= minute)) {
              if (endHour > hour || (endHour === hour && endMinute > minute)) {
                return true;
              }
            }
          }
          
          // Attività che inizia esattamente in questo slot
          return activityHour === hour && Math.floor(activityMinute / 30) === Math.floor(minute / 30);
        });
        
        const slotTimeNum = hour * 60 + minute;
        const currentTimeNum = currentTime.getHours() * 60 + currentTime.getMinutes();
        
        slots.push({
          time: timeStr,
          hour,
          minute,
          activities: activitiesInSlot,
          isPast: isToday && slotTimeNum < currentTimeNum,
          isCurrent: isToday && Math.abs(slotTimeNum - currentTimeNum) <= 30,
          isFuture: isToday && slotTimeNum > currentTimeNum,
          isNightTime: hour >= 0 && hour < 6,
          isWorkTime: hour >= 9 && hour < 18,
          isWeekendTime: hour >= 10 && hour < 12
        });
      }
    }
    return slots;
  };

  // Scroll automatico all'ora corrente
  useEffect(() => {
    if (timelineRef.current) {
      const isToday = formatDate(selectedDate) === formatDate(new Date());
      if (isToday) {
        setTimeout(() => {
          scrollToCurrentTime();
        }, 100);
      }
    }
  }, [selectedDate]);

  const scrollToCurrentTime = () => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const slotHeight = 80; // 80px per slot (30 minuti)
      
      // Calcola la posizione dello slot corrente
      const currentSlot = currentHour * 2 + Math.floor(currentMinute / 30);
      const scrollPosition = currentSlot * slotHeight - 200; // Offset per centrare
      
      timelineRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  };

  const timeSlots = generateTimeSlots();

  // Statistiche giornaliere
  const getDailyStats = () => {
    const total = dailyActivities.length;
    const completed = dailyActivities.filter(a => a.status === 'fatta').length;
    const inProgress = dailyActivities.filter(a => a.status === 'in-corso').length;
    const pending = dailyActivities.filter(a => a.status === 'da-fare').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate
    };
  };

  const stats = getDailyStats();

  // Progressi ultimi 7 giorni (percentuale completamento per giorno)
  const getProgressLast7Days = () => {
    const progress = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - i);
      const dayStr = formatDate(d);
      const acts = getActivitiesForDate(activities, dayStr);
      const total = acts.length;
      const completed = acts.filter(a => a.status === 'fatta').length;
      const rate = total > 0 ? completed / total : 0;
      progress.push(rate);
      labels.push(
        d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' })
      );
    }
    return { progress, labels };
  };

  const { progress: last7Progress, labels: last7Labels } = getProgressLast7Days();

  const getMiniChartPoints = (data, width = 220, height = 64, padding = 2) => {
    const max = 1; // scala fissa 0-100%
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const step = innerW / (data.length - 1);
    const toY = (v) => padding + (innerH - (v / max) * innerH);
    const points = data.map((v, i) => ({ x: padding + i * step, y: toY(v), v }));
    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${padding},${padding + innerH} ${linePoints} ${padding + (data.length - 1) * step},${padding + innerH}`;
    return { linePoints, areaPoints, points, width, height, padding };
  };

  // Gestione creazione nuova attività
  const handleCreateActivity = (timeSlot) => {
    // Invece di aprire un modal, apriamo direttamente il form con i dati precompilati
    const preFilledActivity = {
      title: '',
      description: '',
      date: selectedDateStr,
      time: timeSlot.time,
      status: 'da-fare',
      priority: 'media',
      category: ''
    };
    
    // Chiamiamo la funzione di creazione che dovrebbe aprire il form
    onCreateActivity && onCreateActivity(preFilledActivity);
  };

  return (
   <div className='daily-calendar'> 
      {/* Header del calendario - stile uniforme con altre pagine */}
      <div className="daily-header">
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
            onClick={onNavigateToPrevious}
            className="nav-btn"
            title="Giorno precedente"
          >
            <span>←</span>
          </button>
          <button 
            onClick={onNavigateToNext}
            className="nav-btn"
            title="Giorno successivo"
          >
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Controlli del calendario */}
      <div className="calendar-controls">
        {/* Mini grafico frequenze per ora (sparkline) */}
        {(() => {
          const { linePoints, areaPoints, points } = getMiniChartPoints(last7Progress);
          return (
            <div className="mini-frequency-chart" title="Progresso giornaliero ultimi 7 giorni">
              <svg width="220" height="64" viewBox="0 0 220 64" preserveAspectRatio="none">
                <polyline points={areaPoints} className="spark-area" />
                <polyline points={linePoints} className="spark-line" />
                {points.map((p, i) => (
                  <g key={i} className="spark-point" transform={`translate(${p.x}, ${p.y})`}>
                    <circle r="2.5" className="point-circle" />
                    <g className="point-tooltip">
                      <rect x="-28" y="-30" width="56" height="20" rx="4" ry="4" />
                      <text x="0" y="-17" textAnchor="middle">
                        {last7Labels[i]} — {Math.round(p.v * 100)}%
                      </text>
                    </g>
                  </g>
                ))}
              </svg>
            </div>
          );
        })()}
        {/* Statistiche giornaliere centrate nei controlli */}
        <div className="daily-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Totale</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completate</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Corso</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Da Fare</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completionRate}%</span>
            <span className="stat-label">Progresso</span>
          </div>
        </div>
        <button 
          className="control-btn scroll-to-current"
          onClick={() => {
            if (onNavigateToToday) {
              onNavigateToToday();
            }
            setTimeout(() => {
              scrollToCurrentTime();
            }, 100);
          }}
          title="Vai a oggi e all'ora corrente"
        >
          🕐 Now
        </button>
      </div>

      {/* All-day events section */}
      {dailyActivities.filter(a => !a.time).length > 0 && (
        <div className="allday-section">
          <div className="allday-header">
            <h3>📅 Attività Tutto il Giorno</h3>
          </div>
          <div className="allday-events">
            {dailyActivities.filter(a => !a.time).map(activity => (
              <div 
                key={activity.id} 
                onClick={() => setSelectedActivity(activity)}
                style={{ cursor: 'pointer' }}
              >
                <ActivityCard
                  activity={activity}
                  onEdit={() => setSelectedActivity(activity)}
                  onDelete={() => onDeleteActivity(activity.id)}
                  onToggleStatus={() => onToggleStatus(activity.id)}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline principale */}
      <div className="calendar-timeline">
        <div className="timeline-container" ref={timelineRef}>
          <div className="time-column">
            {timeSlots.map((slot, index) => (
              <div key={index} className="time-label">
                {slot.minute === 0 ? slot.time : ''}
              </div>
            ))}
          </div>
          
          <div className="events-column">
            {/* Linea del tempo corrente */}
            {(() => {
              const now = new Date();
              const isToday = formatDate(selectedDate) === formatDate(now);
              if (isToday) {
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentSlot = currentHour * 2 + Math.floor(currentMinute / 30);
                const topPosition = currentSlot * 80 + (currentMinute % 30) * (80 / 30); // 80px per slot
                
                return (
                  <div 
                    className="current-time-line"
                    style={{ top: `${topPosition}px` }}
                  />
                );
              }
              return null;
            })()}
            
            {timeSlots.map((slot, index) => (
              <div 
                key={index} 
                className={`time-slot ${slot.isPast ? 'past' : ''} ${slot.isCurrent ? 'current' : ''} ${slot.isFuture ? 'future' : ''} ${slot.isNightTime ? 'night' : ''} ${slot.isWorkTime ? 'work' : ''}`}
                onClick={() => setSelectedTimeSlot(selectedTimeSlot === slot.time ? null : slot.time)}
              >
                <div className="slot-content">
                  {slot.activities.length > 0 ? (
                    <div className={`slot-activities ${slot.activities.length > 1 ? 'has-multiple' : ''}`}>
                      {slot.activities.map((activity, actIndex) => (
                        <div 
                          key={activity.id}
                          className={`activity-event ${activity.status} ${activity.priority}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(activity);
                          }}
                          title={`${activity.title} - ${activity.time}${activity.endTime ? ` - ${activity.endTime}` : ''}`}
                        >
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-time">
                            {activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                          </div>
                          <div className="activity-status">
                            {activity.status === 'fatta' ? '✅' :
                             activity.status === 'in-corso' ? '🔄' :
                             activity.status === 'rimandata' ? '⏰' : '⏳'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="empty-slot"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateActivity(slot);
                      }}
                      title={`Clicca per aggiungere un'attività alle ${slot.time}`}
                    >
                      <span className="add-icon">+</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dettagli slot selezionato */}
      {selectedTimeSlot && (
        <div className="slot-details">
          <h4>Attività alle {selectedTimeSlot}</h4>
          <div className="slot-activities-list">
            {timeSlots.find(s => s.time === selectedTimeSlot)?.activities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={() => setSelectedActivity(activity)}
                onDelete={() => onDeleteActivity(activity.id)}
                onToggleStatus={() => onToggleStatus(activity.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal dettagli attività */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={activities.find(a => a.id === selectedActivity.id) || selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
          onToggleStatus={onToggleStatus}
          onUpdateActivity={onUpdateActivity}
        />
      )}

    </div>
  );
};

export default DailyCalendar;
