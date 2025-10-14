/**
 * Utility functions for activity management
 */

/**
 * Checks if an activity is active on a specific date
 * @param {Object} activity - The activity object
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {boolean} - True if activity is active on the target date
 */
export const isActivityActiveOnDate = (activity, targetDate) => {
  if (!activity || !targetDate) return false;
  
  const activityStartDate = activity.date;
  const activityEndDate = activity.endDate || activity.date;
  
  // If activity has no end date, it's only active on the start date
  if (!activity.endDate) {
    return activityStartDate === targetDate;
  }
  
  // For multi-day activities, check if target date falls within the range
  return targetDate >= activityStartDate && targetDate <= activityEndDate;
};

/**
 * Gets all activities that are active on a specific date
 * @param {Array} activities - Array of all activities
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {Array} - Filtered activities active on the target date
 */
export const getActivitiesForDate = (activities, targetDate) => {
  if (!activities || !targetDate) return [];
  
  return activities.filter(activity => isActivityActiveOnDate(activity, targetDate));
};

/**
 * Gets all activities that are active within a date range
 * @param {Array} activities - Array of all activities
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Filtered activities active within the date range
 */
export const getActivitiesForDateRange = (activities, startDate, endDate) => {
  if (!activities || !startDate || !endDate) return [];
  
  return activities.filter(activity => {
    const activityStartDate = activity.date;
    const activityEndDate = activity.endDate || activity.date;
    
    // Check if activity overlaps with the date range
    return activityStartDate <= endDate && activityEndDate >= startDate;
  });
};

/**
 * Checks if an activity is multi-day
 * @param {Object} activity - The activity object
 * @returns {boolean} - True if activity spans multiple days
 */
export const isMultiDayActivity = (activity) => {
  if (!activity) return false;
  return activity.isMultiDay || (activity.endDate && activity.endDate !== activity.date);
};

/**
 * Checks if an activity is multi-hour
 * @param {Object} activity - The activity object
 * @returns {boolean} - True if activity spans multiple hours
 */
export const isMultiHourActivity = (activity) => {
  if (!activity) return false;
  return activity.isMultiHour || (activity.endTime && activity.time && activity.endTime !== activity.time);
};

/**
 * Gets the duration of an activity in hours
 * @param {Object} activity - The activity object
 * @returns {number} - Duration in hours, or 0 if not calculable
 */
export const getActivityDuration = (activity) => {
  if (!activity) return 0;
  
  // If it's a multi-day activity, calculate days
  if (isMultiDayActivity(activity)) {
    const startDate = new Date(activity.date);
    const endDate = new Date(activity.endDate || activity.date);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // If it has time information, calculate more precisely
    if (activity.time && activity.endTime) {
      const startTime = new Date(`${activity.date}T${activity.time}`);
      const endTime = new Date(`${activity.endDate || activity.date}T${activity.endTime}`);
      return Math.ceil((endTime - startTime) / (1000 * 60 * 60));
    }
    
    // Default to 8 hours per day for multi-day activities
    return daysDiff * 8;
  }
  
  // If it's a multi-hour activity on the same day
  if (isMultiHourActivity(activity) && activity.time && activity.endTime) {
    const startTime = new Date(`2000-01-01T${activity.time}`);
    const endTime = new Date(`2000-01-01T${activity.endTime}`);
    return Math.ceil((endTime - startTime) / (1000 * 60 * 60));
  }
  
  // Default duration for single activities
  return activity.duration || 1;
};

/**
 * Formats activity time range for display
 * @param {Object} activity - The activity object
 * @returns {string} - Formatted time range
 */
export const formatActivityTimeRange = (activity) => {
  if (!activity) return '';
  
  if (isMultiDayActivity(activity)) {
    const startDate = new Date(activity.date).toLocaleDateString('it-IT');
    const endDate = new Date(activity.endDate || activity.date).toLocaleDateString('it-IT');
    
    if (activity.time && activity.endTime) {
      return `${startDate} ${activity.time} - ${endDate} ${activity.endTime}`;
    } else if (activity.time) {
      return `${startDate} ${activity.time} - ${endDate}`;
    } else {
      return `${startDate} - ${endDate}`;
    }
  }
  
  if (isMultiHourActivity(activity) && activity.time && activity.endTime) {
    return `${activity.time} - ${activity.endTime}`;
  }
  
  return activity.time || '';
};

/**
 * Gets activity status for a specific date (useful for multi-day activities)
 * @param {Object} activity - The activity object
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {string} - Activity status for the target date
 */
export const getActivityStatusForDate = (activity, targetDate) => {
  if (!activity || !targetDate) return activity?.status || 'da-fare';
  
  // For single-day activities, return the main status
  if (!isMultiDayActivity(activity)) {
    return activity.status;
  }
  
  // For multi-day activities, we could implement more complex logic
  // For now, return the main status
  return activity.status;
};
