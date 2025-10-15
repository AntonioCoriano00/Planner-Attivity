import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  type = 'danger' // 'danger' o 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog-header ${type}`}>
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="confirm-dialog-btn cancel-btn"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog-btn confirm-btn ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

