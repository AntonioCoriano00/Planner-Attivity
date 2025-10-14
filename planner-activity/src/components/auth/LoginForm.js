import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForm.css';

const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Pulisce l'errore quando l'utente inizia a digitare
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    if (!result.success) {
      setError(result.error);
    }
    // Se il login ha successo, l'AuthContext gestirà il redirect

    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <div className="auth-branding">
        <div className="calendar-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Header del calendario */}
            <defs>
              <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <rect x="10" y="15" width="80" height="15" rx="3" fill="url(#headerGradient)"/>
            {/* Corpo del calendario */}
            <rect x="10" y="25" width="80" height="60" rx="3" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            {/* Righe orizzontali */}
            <line x1="10" y1="40" x2="90" y2="40" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="10" y1="55" x2="90" y2="55" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="10" y1="70" x2="90" y2="70" stroke="#e0e7ff" strokeWidth="1"/>
            {/* Colonne verticali */}
            <line x1="30" y1="40" x2="30" y2="85" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="50" y1="40" x2="50" y2="85" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="70" y1="40" x2="70" y2="85" stroke="#e0e7ff" strokeWidth="1"/>
            {/* Giorni evidenziati */}
            <circle cx="20" cy="47.5" r="3" fill="#8b5cf6" opacity="0.8"/>
            <circle cx="40" cy="62.5" r="3" fill="#6366f1" opacity="0.8"/>
            <circle cx="60" cy="47.5" r="3" fill="#a855f7" opacity="0.8"/>
            <circle cx="80" cy="77.5" r="3" fill="#8b5cf6" opacity="0.8"/>
            {/* Anelli superiori */}
            <rect x="25" y="10" width="4" height="10" rx="2" fill="#4f46e5"/>
            <rect x="71" y="10" width="4" height="10" rx="2" fill="#4f46e5"/>
          </svg>
        </div>
        <h1 className="app-title">My Planner</h1>
        <p className="app-tagline">Il tuo assistente per la gestione delle attività</p>
      </div>
      <div className="auth-form">
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username o Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Inserisci username o email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Inserisci la password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Non hai un account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Registrati qui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
