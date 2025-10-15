import axios from 'axios';

// Configurazione base dell'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crea un'istanza di axios con configurazione predefinita
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondi di timeout
});

// Funzione per ottenere il token dal localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Interceptor per aggiungere automaticamente il token alle richieste
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Errore API:', error.response?.data || error.message);
    
    // Se il token è scaduto o non valido, rimuovilo
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Potresti anche reindirizzare al login qui se necessario
    }
    
    return Promise.reject(error);
  }
);

// Servizi per le attività
export const activityService = {
  // Ottiene tutte le attività con filtri opzionali
  getActivities: async (filters = {}) => {
    try {
      const response = await api.get('/activities', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero delle attività: ${error.response?.data?.error || error.message}`);
    }
  },

  // Ottiene un'attività specifica per ID
  getActivity: async (id) => {
    try {
      const response = await api.get(`/activities/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero dell'attività: ${error.response?.data?.error || error.message}`);
    }
  },

  // Crea una nuova attività
  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nella creazione dell'attività: ${error.response?.data?.error || error.message}`);
    }
  },

  // Aggiorna un'attività esistente
  updateActivity: async (id, activityData) => {
    try {
      const response = await api.put(`/activities/${id}`, activityData);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento dell'attività: ${error.response?.data?.error || error.message}`);
    }
  },

  // Elimina un'attività
  deleteActivity: async (id) => {
    try {
      const response = await api.delete(`/activities/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione dell'attività: ${error.response?.data?.error || error.message}`);
    }
  },

  // Aggiorna solo lo stato di un'attività
  updateActivityStatus: async (id, status) => {
    console.log('=== API updateActivityStatus ===');
    console.log('ID:', id, 'Status:', status);
    console.log('URL:', `/activities/${id}/status`);
    
    try {
      console.log('Faccio la chiamata PATCH al server...');
      const response = await api.patch(`/activities/${id}/status`, { status });
      console.log('Risposta dal server:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore API updateActivityStatus:', error);
      console.error('Response error:', error.response);
      throw new Error(`Errore nell'aggiornamento dello stato: ${error.response?.data?.error || error.message}`);
    }
  },

  // Ottiene le attività per una data specifica
  getActivitiesByDate: async (date) => {
    try {
      const response = await api.get(`/activities/date/${date}`);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero delle attività per data: ${error.response?.data?.error || error.message}`);
    }
  },

  // Ottiene le attività per uno stato specifico
  getActivitiesByStatus: async (status) => {
    try {
      const response = await api.get(`/activities/status/${status}`);
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero delle attività per stato: ${error.response?.data?.error || error.message}`);
    }
  },

  // Ottiene le statistiche delle attività
  getActivityStats: async () => {
    try {
      const response = await api.get('/activities/stats');
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero delle statistiche: ${error.response?.data?.error || error.message}`);
    }
  },

  // Ottiene tutte le categorie utilizzate
  getCategories: async () => {
    try {
      const response = await api.get('/activities/categories');
      return response.data;
    } catch (error) {
      throw new Error(`Errore nel recupero delle categorie: ${error.response?.data?.error || error.message}`);
    }
  },
};

// Servizi per l'autenticazione
export const authService = {
  // Login
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Errore durante il login');
    }
  },

  // Registrazione
  register: async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Errore durante la registrazione');
    }
  },

  // Verifica token
  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify', { token });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Token non valido');
    }
  },

  // Ottieni informazioni utente corrente
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Errore nel recupero delle informazioni utente');
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      // Anche se il logout fallisce, rimuoviamo il token localmente
      localStorage.removeItem('token');
      throw new Error('Errore durante il logout');
    }
  },

  // Cambia password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Errore nel cambio password');
    }
  },
};

// Servizio per il controllo dello stato del backend
export const healthService = {
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Backend non disponibile: ${error.message}`);
    }
  },
};

export default api;
