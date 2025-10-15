import React, { useState } from 'react';
import './Header.css';
import ConfirmDialog from './ConfirmDialog';

const Header = ({ user, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="🚪 Uscita Account"
        message="Sei sicuro di voler effettuare il logout?"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Esci"
        cancelText="Annulla"
        type="warning"
      />
    </header>
  );
};

export default Header;
