import React from 'react';
import DailyCalendar from './DailyCalendar';
import './DailyView.css';

const DailyView = ({ activities, selectedDate, onEditActivity, onDeleteActivity, onToggleStatus, onNavigateToPrevious, onNavigateToNext, onCreateActivity }) => {

  return (
    <div className="daily-view">
      <DailyCalendar 
        activities={activities}
        selectedDate={selectedDate}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
        onToggleStatus={onToggleStatus}
        onNavigateToPrevious={onNavigateToPrevious}
        onNavigateToNext={onNavigateToNext}
        onCreateActivity={onCreateActivity}
      />
    </div>
  );
};

export default DailyView;
