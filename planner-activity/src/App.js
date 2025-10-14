import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Header from './components/Header';
import ViewSelector from './components/ViewSelector';
import ActivityForm from './components/ActivityForm';
import DailyView from './components/views/DailyView';
import WeeklyView from './components/views/WeeklyView';
import MonthlyView from './components/views/MonthlyView';
import StatusView from './components/views/StatusView';
import AdminDashboard from './components/admin/AdminDashboard';
import { useActivities } from './hooks/useActivities';
import { healthService } from './services/api';

// Componente principale dell'app (solo per utenti autenticati)
function AppContent() {
  const [currentView, setCurrentView] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date();
  });
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { user, logout } = useAuth();

  // Hook per gestire le attività dal backend - SEMPRE chiamato prima di qualsiasi return condizionale
  const {
    activities,
    loading,
    error,
    addActivity: addActivityToBackend,
    updateActivity: updateActivityInBackend,
    deleteActivity: deleteActivityFromBackend,
    toggleActivityStatus: toggleActivityStatusInBackend,
  } = useActivities();

  // Controlla lo stato del backend al caricamento - SEMPRE chiamato prima di qualsiasi return condizionale
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await healthService.checkHealth();
        setBackendStatus('connected');
      } catch (error) {
        console.error('Backend non disponibile:', error);
        setBackendStatus('disconnected');
      }
    };

    checkBackendHealth();
  }, []);

  // Se l'utente è admin e ha aperto il pannello admin
  if (user && user.isAdmin && showAdminPanel) {
    return (
      <div className="App">
        <Header user={user} onLogout={logout} />
        <div style={{ padding: '10px', background: '#f0f0f0', textAlign: 'center' }}>
          <button 
            onClick={() => setShowAdminPanel(false)}
            style={{
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ← Torna alle Mie Attività
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  const addActivity = async (activity) => {
    try {
      await addActivityToBackend(activity);
      setShowForm(false);
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'attività:', error);
      // Qui potresti mostrare un messaggio di errore all'utente
    }
  };

  const updateActivity = async (updatedActivity) => {
    try {
      // Usa l'ID dell'attività che stiamo modificando, non dai dati del form
      await updateActivityInBackend(editingActivity.id, updatedActivity);
      setEditingActivity(null);
      setShowForm(false);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'attività:', error);
      // Qui potresti mostrare un messaggio di errore all'utente
    }
  };

  const deleteActivity = async (id) => {
    // Trova l'attività per mostrare il titolo nella conferma
    const activity = activities.find(a => a.id === id);
    const activityTitle = activity ? activity.title : 'questa attività';
    
    // Mostra il dialog di conferma
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare "${activityTitle}"?\n\nQuesta azione non può essere annullata.`
    );
    
    if (!confirmed) {
      return; // L'utente ha annullato l'eliminazione
    }
    
    try {
      await deleteActivityFromBackend(id);
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'attività:', error);
      // Qui potresti mostrare un messaggio di errore all'utente
    }
  };

  const toggleActivityStatus = async (id) => {
    try {
      await toggleActivityStatusInBackend(id);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error);
      // Qui potresti mostrare un messaggio di errore all'utente
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  // Funzioni di navigazione per le date
  const navigateToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (currentView === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'monthly') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (currentView === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'daily':
        return (
          <DailyView 
            activities={activities}
            selectedDate={selectedDate}
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteActivity}
            onToggleStatus={toggleActivityStatus}
            onNavigateToPrevious={navigateToPrevious}
            onNavigateToNext={navigateToNext}
          />
        );
      case 'weekly':
        return (
          <WeeklyView 
            activities={activities}
            selectedDate={selectedDate}
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteActivity}
            onToggleStatus={toggleActivityStatus}
            onNavigateToDay={(date) => {
              setSelectedDate(date);
              setCurrentView('daily');
            }}
            onNavigateToPrevious={navigateToPrevious}
            onNavigateToNext={navigateToNext}
          />
        );
      case 'monthly':
        return (
          <MonthlyView 
            activities={activities}
            selectedDate={selectedDate}
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteActivity}
            onToggleStatus={toggleActivityStatus}
            onNavigateToPrevious={navigateToPrevious}
            onNavigateToNext={navigateToNext}
          />
        );
      case 'status':
        return (
          <StatusView 
            activities={activities}
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteActivity}
            onToggleStatus={toggleActivityStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <Header user={user} onLogout={logout} />
      
      {/* Indicatore di stato del backend */}
      {backendStatus === 'disconnected' && (
        <div className="backend-status-error">
          <p>⚠️ Backend non disponibile. Le modifiche non verranno salvate.</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>❌ Errore: {error}</p>
        </div>
      )}
      
      <ViewSelector 
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddActivity={() => setShowForm(true)}
        isAdmin={user && user.isAdmin}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
      />

      <main className="main-content">
        {loading && <div className="loading-indicator">Caricamento...</div>}
        {renderCurrentView()}
      </main>

      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onSave={editingActivity ? updateActivity : addActivity}
          onCancel={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
        />
      )}
    </div>
  );
}

// Componente principale che gestisce l'autenticazione
function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AppContent />;
}

export default App;