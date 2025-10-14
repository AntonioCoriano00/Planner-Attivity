import { useState, useEffect, useCallback } from 'react';
import { activityService } from '../services/api';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica tutte le attività
  const loadActivities = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityService.getActivities(filters);
      setActivities(data);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento delle attività:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica le attività al montaggio del componente
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Aggiunge una nuova attività
  const addActivity = useCallback(async (activityData) => {
    setLoading(true);
    setError(null);
    try {
      const newActivity = await activityService.createActivity(activityData);
      setActivities(prev => [newActivity, ...prev]);
      return newActivity;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggiorna un'attività esistente
  const updateActivity = useCallback(async (id, activityData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedActivity = await activityService.updateActivity(id, activityData);
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? updatedActivity : activity
        )
      );
      return updatedActivity;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Elimina un'attività
  const deleteActivity = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await activityService.deleteActivity(id);
      setActivities(prev => prev.filter(activity => activity.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggiorna lo stato di un'attività
  const toggleActivityStatus = useCallback(async (id) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const statusOrder = ['da-fare', 'in-corso', 'fatta', 'rimandata'];
    const currentIndex = statusOrder.indexOf(activity.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    setLoading(true);
    setError(null);
    try {
      const updatedActivity = await activityService.updateActivityStatus(id, newStatus);
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? updatedActivity : activity
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activities]);

  // Carica le attività per una data specifica
  const loadActivitiesByDate = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityService.getActivitiesByDate(date);
      setActivities(data);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento delle attività per data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica le attività per uno stato specifico
  const loadActivitiesByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityService.getActivitiesByStatus(status);
      setActivities(data);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento delle attività per stato:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activities,
    loading,
    error,
    loadActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityStatus,
    loadActivitiesByDate,
    loadActivitiesByStatus,
  };
};
