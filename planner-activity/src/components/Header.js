import React from 'react';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler effettuare il logout?')) {
      onLogout();
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="app-title">
          <h1 className="app-name">My Planner</h1>
          <p className="app-subtitle">Il tuo assistente per la gestione delle attività</p>
        </div>
        
        {user && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">Ciao, {user.username}!</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button 
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
