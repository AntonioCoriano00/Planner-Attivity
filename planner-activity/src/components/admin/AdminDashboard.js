import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState(null);
  const [toast, setToast] = useState(null);
  
  const { getAuthHeaders } = useAuth();

  // Form per nuovo/editing utente
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    is_active: true
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab, currentPage, searchTerm]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Errore nel caricamento dei dati dashboard');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10,
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pages);
      } else {
        setError('Errore nel caricamento degli utenti');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Errore nel caricamento delle statistiche');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
        setShowUserForm(false);
        resetUserForm();
        loadUsers();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella creazione dell\'utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
        setShowUserForm(false);
        setEditingUser(null);
        resetUserForm();
        loadUsers();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'aggiornamento dell\'utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Trova l'utente per mostrare l'username nella conferma
    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'questo utente';
    
    setDeleteUserData({
      userId,
      username
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserData) return;
    
    const { userId } = deleteUserData;
    setDeleteUserData(null);
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        loadUsers();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'eliminazione dell\'utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      
      if (response.ok) {
        setEditingPasswordUserId(null);
        setNewPassword('');
        setError(null);
        setToast({ message: 'Password aggiornata con successo', type: 'success' });
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'aggiornamento della password');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPassword = (userId) => {
    setEditingPasswordUserId(userId);
    setNewPassword('');
    setShowNewPassword(false);
  };

  const cancelEditingPassword = () => {
    setEditingPasswordUserId(null);
    setNewPassword('');
    setShowNewPassword(false);
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      is_active: true
    });
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      is_active: user.isActive
    });
    setShowUserForm(true);
  };

  const openCreateUser = () => {
    setEditingUser(null);
    resetUserForm();
    setShowUserForm(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const renderDashboard = () => {
    if (!dashboardData) return <div>Caricamento...</div>;

    return (
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Utenti Recenti</h3>
            <div className="recent-list">
              {dashboardData.recent_users.map(user => (
                <div key={user.id} className="recent-item">
                  <span className="username">{user.username}</span>
                  <span className="date">{formatDate(user.createdAt)}</span>
                  {user.isAdmin && <span className="admin-badge">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="users-content">
        <div className="users-header">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cerca utenti..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateUser}>
            Nuovo Utente
          </button>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Password</th>
                <th>Admin</th>
                <th>Attivo</th>
                <th>Data Creazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <div className="password-cell">
                      {editingPasswordUserId === user.id ? (
                        <div className="password-edit-inline">
                          <div className="password-input-wrapper">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              className="password-input"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdatePassword(user.id);
                                } else if (e.key === 'Escape') {
                                  cancelEditingPassword();
                                }
                              }}
                              placeholder="Nuova password (min 6 caratteri)"
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-xs btn-icon password-toggle"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              title={showNewPassword ? "Nascondi password" : "Mostra password"}
                            >
                              {showNewPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <button 
                            className="btn btn-xs btn-success"
                            onClick={() => handleUpdatePassword(user.id)}
                            disabled={loading}
                            title="Conferma nuova password"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn btn-xs btn-secondary"
                            onClick={cancelEditingPassword}
                            title="Annulla"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="password-display">
                          <span className="password-text">••••••••</span>
                          <button
                            className="btn btn-xs btn-warning"
                            onClick={() => startEditingPassword(user.id)}
                            title="Modifica password"
                          >
                            🔑 Modifica
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {user.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEditUser(user)}
                    >
                      Modifica
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.username === 'admin'}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Precedente
            </button>
            <span>Pagina {currentPage} di {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Successiva
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!stats) return <div>Caricamento...</div>;

    return (
      <div className="stats-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Utenti</h3>
            <div className="stat-number">{stats.users.total}</div>
            <div className="stat-details">
              <div>Attivi: {stats.users.active}</div>
              <div>Admin: {stats.users.admins}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>Attività</h3>
            <div className="stat-number">{stats.activities.total}</div>
            <div className="stat-details">
              <div>Da fare: {stats.activities.by_status['da-fare']}</div>
              <div>In corso: {stats.activities.by_status['in-corso']}</div>
              <div>Fatte: {stats.activities.by_status['fatta']}</div>
              <div>Rimandate: {stats.activities.by_status['rimandata']}</div>
            </div>
          </div>
        </div>

        <div className="user-activity-stats">
          <h3>Attività per Utente</h3>
          <div className="activity-list">
            {stats.user_activity_counts.map((item, index) => (
              <div key={index} className="activity-item">
                <span className="username">{item.username}</span>
                <span className="count">{item.activity_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Dashboard Amministratore</h1>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Gestione Utenti
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistiche
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="admin-content">
        {loading && <div className="loading-indicator">Caricamento...</div>}
        
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  required={!editingUser}
                  placeholder={editingUser ? "Lascia vuoto per non cambiare" : ""}
                />
              </div>
              
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                  />
                  Attivo
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                  resetUserForm();
                }}>
                  Annulla
                </button>
                <button type="submit" disabled={loading}>
                  {editingUser ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteUserData}
        title="🗑️ Eliminazione Utente"
        message={deleteUserData ? `Sei sicuro di voler eliminare l'utente "${deleteUserData.username}"? Questa azione non può essere annullata.` : ''}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteUserData(null)}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
