import React from 'react';
import { isMultiDayActivity, isMultiHourActivity, formatActivityTimeRange } from '../utils/activityUtils';
import './ActivityCard.css';

const ActivityCard = ({ activity, onEdit, onDelete, onToggleStatus, compact = false }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'da-fare': { label: 'Da Fare', color: '#ff9800', icon: '⏳' },
      'in-corso': { label: 'In Corso', color: '#2196f3', icon: '🔄' },
      'fatta': { label: 'Fatta', color: '#4caf50', icon: '✅' },
      'rimandata': { label: 'Rimandata', color: '#f44336', icon: '⏰' }
    };
    return configs[status] || configs['da-fare'];
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'bassa': { label: 'Bassa', color: '#4caf50' },
      'media': { label: 'Media', color: '#ff9800' },
      'alta': { label: 'Alta', color: '#f44336' }
    };
    return configs[priority] || configs['media'];
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // Rimuove i secondi
  };

  const statusConfig = getStatusConfig(activity.status);
  const priorityConfig = getPriorityConfig(activity.priority);
  
  // Check if this is a multi-day or multi-hour activity
  const isMultiDay = isMultiDayActivity(activity);
  const isMultiHour = isMultiHourActivity(activity);
  const timeRange = formatActivityTimeRange(activity);

  return (
    <div className={`activity-card ${activity.status} ${compact ? 'compact' : ''}`}>
      <div className="activity-header">
        <div className="activity-title-section">
          <h4 className="activity-title">
            {activity.title}
            {(isMultiDay || isMultiHour) && (
              <span className="multi-indicator">
                {isMultiDay ? ' 📅' : ''}{isMultiHour ? ' ⏰' : ''}
              </span>
            )}
          </h4>
          {timeRange && (
            <span className="activity-time">
              🕐 {timeRange}
            </span>
          )}
        </div>
        
        <div className="activity-actions">
          <button 
            className="action-btn toggle-status"
            onClick={onToggleStatus}
            title="Cambia stato"
          >
            {statusConfig.icon}
          </button>
          <button 
            className="action-btn edit"
            onClick={onEdit}
            title="Modifica"
          >
            ✏️
          </button>
          <button 
            className="action-btn delete"
            onClick={onDelete}
            title="Elimina"
          >
            🗑️
          </button>
        </div>
      </div>

      {activity.description && (
        <p className="activity-description">{activity.description}</p>
      )}

      <div className="activity-footer">
        <div className="activity-meta">
          {activity.category && (
            <span className="activity-category">
              📁 {activity.category}
            </span>
          )}
          
          <span 
            className="activity-priority"
            style={{ color: priorityConfig.color }}
          >
            ⚡ {priorityConfig.label}
          </span>
        </div>
        
        <div 
          className="activity-status"
          style={{ 
            backgroundColor: statusConfig.color + '20',
            color: statusConfig.color,
            borderColor: statusConfig.color
          }}
        >
          {statusConfig.icon} {statusConfig.label}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
