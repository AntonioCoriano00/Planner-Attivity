import { useState, useEffect, useCallback } from 'react';
import { activityService } from '../services/api';

export const useActivityStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    by_status: {
      da_fare: 0,
      in_corso: 0,
      fatta: 0,
      rimandata: 0
    },
    by_priority: {
      alta: 0,
      media: 0,
      bassa: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica le statistiche
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityService.getActivityStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento delle statistiche:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica le statistiche al montaggio del componente
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
};
