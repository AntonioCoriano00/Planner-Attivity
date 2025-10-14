import React, { useState, useEffect, useRef } from 'react';
import ActivityCard from '../ActivityCard';
import { getActivitiesForDate } from '../../utils/activityUtils';
import './DailyCalendar.css';

const DailyCalendar = ({ 
  activities, 
  selectedDate, 
  onEditActivity, 
  onDeleteActivity, 
  onToggleStatus, 
  onNavigateToPrevious, 
  onNavigateToNext,
  onCreateActivity 
}) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const timelineRef = useRef(null);

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
      const slotHeight = 60; // 60px per slot (30 minuti)
      
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
    <div className="daily-calendar">
      {/* Header del calendario - stile uniforme con altre pagine */}
      <div className="daily-header">
        <div className="header-content">
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
              ←
            </button>
            <button 
              onClick={() => {
                const today = new Date();
                if (formatDate(selectedDate) !== formatDate(today)) {
                  // Logica per andare a oggi
                }
              }}
              className="nav-btn today-btn"
              title="Vai a oggi"
            >
              Oggi
            </button>
            <button 
              onClick={onNavigateToNext}
              className="nav-btn"
              title="Giorno successivo"
            >
              →
            </button>
          </div>
        </div>
        
        {/* Statistiche giornaliere */}
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
      </div>

      {/* Controlli del calendario */}
      <div className="calendar-controls">
        <button 
          className="control-btn scroll-to-current"
          onClick={scrollToCurrentTime}
          title="Vai all'ora corrente"
        >
          🕐 Ora Corrente
        </button>
        <button 
          className="control-btn create-activity"
          onClick={() => {
            const preFilledActivity = {
              title: '',
              description: '',
              date: selectedDateStr,
              time: '',
              status: 'da-fare',
              priority: 'media',
              category: ''
            };
            onCreateActivity && onCreateActivity(preFilledActivity);
          }}
          title="Crea nuova attività"
        >
          ➕ Nuova Attività
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
                const topPosition = currentSlot * 60 + (currentMinute % 30) * 2; // 60px per slot
                
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
                    <div className="slot-activities">
                      {slot.activities.map((activity, actIndex) => (
                        <div 
                          key={activity.id}
                          className={`activity-event ${activity.status} ${activity.priority}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditActivity(activity);
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
                onEdit={() => onEditActivity(activity)}
                onDelete={() => onDeleteActivity(activity.id)}
                onToggleStatus={() => onToggleStatus(activity.id)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyCalendar;
