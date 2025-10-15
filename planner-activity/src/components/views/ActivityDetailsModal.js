import React, { useState, useEffect, useRef } from 'react';
import './ActivityDetailsModal.css';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const ActivityDetailsModal = ({ activity, onClose, onEdit, onDelete, onToggleStatus, onUpdateActivity }) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);
  
  // Chiudi dropdown se clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!activity) return null;

  const getStatusConfig = (status) => {
    const configs = {
      'da-fare': { label: 'Da Fare', color: '#ff9800', icon: '⏳', bg: '#fff3e0' },
      'in-corso': { label: 'In Corso', color: '#2196f3', icon: '🔄', bg: '#e3f2fd' },
      'fatta': { label: 'Fatta', color: '#4caf50', icon: '✅', bg: '#e8f5e9' },
      'rimandata': { label: 'Rimandata', color: '#f44336', icon: '⏰', bg: '#ffebee' }
    };
    return configs[status] || configs['da-fare'];
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'bassa': { label: 'Bassa', color: '#4caf50', icon: '🟢' },
      'media': { label: 'Media', color: '#ff9800', icon: '🟡' },
      'alta': { label: 'Alta', color: '#f44336', icon: '🔴' }
    };
    return configs[priority] || configs['media'];
  };

  const statusConfig = getStatusConfig(activity.status);
  const priorityConfig = getPriorityConfig(activity.priority);

  const allStatuses = [
    { key: 'da-fare', label: 'Da Fare', color: '#ff9800', icon: '⏳', bg: '#fff3e0' },
    { key: 'in-corso', label: 'In Corso', color: '#2196f3', icon: '🔄', bg: '#e3f2fd' },
    { key: 'fatta', label: 'Fatta', color: '#4caf50', icon: '✅', bg: '#e8f5e9' },
    { key: 'rimandata', label: 'Rimandata', color: '#f44336', icon: '⏰', bg: '#ffebee' }
  ];

  const handleStatusChange = async (newStatus) => {
    if (isChangingStatus) return; // Previeni click multipli
    
    console.log('=== DEBUG CAMBIO STATO ===');
    console.log('Activity ID:', activity.id);
    console.log('Stato attuale:', activity.status);
    console.log('Nuovo stato richiesto:', newStatus);
    console.log('onUpdateActivity disponibile:', !!onUpdateActivity);
    console.log('onToggleStatus disponibile:', !!onToggleStatus);
    
    setIsChangingStatus(true);
    try {
      if (onUpdateActivity) {
        console.log('Chiamando onUpdateActivity...');
        const result = await onUpdateActivity(activity.id, newStatus);
        console.log('Risultato onUpdateActivity:', result);
        console.log('Stato cambiato con successo!');
        
        // Forza un piccolo delay per permettere l'aggiornamento dell'array activities
        setTimeout(() => {
          console.log('Stato aggiornato nel modal:', activity.status);
        }, 100);
      } else {
        console.log('onUpdateActivity non disponibile, uso fallback con toggle');
        // Fallback: cicla tra gli stati fino a raggiungere quello desiderato
        const statusOrder = ['da-fare', 'in-corso', 'fatta', 'rimandata'];
        const currentIndex = statusOrder.indexOf(activity.status);
        const targetIndex = statusOrder.indexOf(newStatus);
        
        console.log('Indice corrente:', currentIndex, 'Indice target:', targetIndex);
        
        if (currentIndex !== targetIndex) {
          // Cicla fino a raggiungere lo stato target
          let currentStatus = activity.status;
          let attempts = 0;
          while (currentStatus !== newStatus && attempts < 4) {
            console.log('Toggle attempt', attempts + 1, 'stato corrente:', currentStatus);
            onToggleStatus(activity.id);
            // Aspetta un po' per permettere l'aggiornamento
            await new Promise(resolve => setTimeout(resolve, 100));
            currentStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];
            attempts++;
          }
        }
      }
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Errore nel cambio stato:', error);
      console.error('Stack trace:', error.stack);
      setToast({ message: 'Errore nel cambio stato: ' + error.message, type: 'error' });
    } finally {
      setIsChangingStatus(false);
      console.log('=== FINE DEBUG ===');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  return (
    <div className="activity-details-modal-overlay" onClick={onClose}>
      <div className="activity-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{activity.title}</h2>
          <button className="close-btn" onClick={onClose} title="Chiudi">
            <span>✕</span>
          </button>
        </div>

        <div className="modal-body">

          {/* Status e Priorità */}
          <div className="detail-badges">
            <div 
              className="badge status-badge"
              style={{ 
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                borderColor: statusConfig.color
              }}
            >
              <span className="badge-icon">{statusConfig.icon}</span>
              <span className="badge-label">{statusConfig.label}</span>
            </div>

            <div 
              className="badge priority-badge"
              style={{ 
                color: priorityConfig.color,
                borderColor: priorityConfig.color
              }}
            >
              <span className="badge-icon">{priorityConfig.icon}</span>
              <span className="badge-label">Priorità {priorityConfig.label}</span>
            </div>
          </div>

          {/* Descrizione */}
          {activity.description && (
            <div className="detail-section">
              <h4 className="section-title">📝 Descrizione</h4>
              <p className="section-content">{activity.description}</p>
            </div>
          )}

          {/* Data e Ora */}
          <div className="detail-section">
            <h4 className="section-title">📅 Data e Ora</h4>
            <div className="datetime-info">
              {activity.date && (
                <div className="info-row">
                  <span className="info-label">Data:</span>
                  <span className="info-value">{formatDate(activity.date)}</span>
                </div>
              )}
              
              {activity.endDate && activity.endDate !== activity.date && (
                <div className="info-row">
                  <span className="info-label">Data fine:</span>
                  <span className="info-value">{formatDate(activity.endDate)}</span>
                </div>
              )}

              {activity.time && (
                <div className="info-row">
                  <span className="info-label">Ora inizio:</span>
                  <span className="info-value">{formatTime(activity.time)}</span>
                </div>
              )}

              {activity.endTime && (
                <div className="info-row">
                  <span className="info-label">Ora fine:</span>
                  <span className="info-value">{formatTime(activity.endTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Categoria */}
          {activity.category && (
            <div className="detail-section">
              <h4 className="section-title">📁 Categoria</h4>
              <p className="section-content category-value">{activity.category}</p>
            </div>
          )}

          {/* Informazioni aggiuntive */}
          <div className="detail-section metadata">
            {activity.isMultiHour && (
              <div className="meta-tag">⏰ Attività multi-oraria</div>
            )}
            {activity.endDate && activity.endDate !== activity.date && (
              <div className="meta-tag">📅 Attività multi-giorno</div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="status-dropdown-container" ref={dropdownRef}>
            <button 
              className="modal-btn secondary-btn"
              onClick={() => {
                console.log('Toggle dropdown:', !showStatusDropdown);
                setShowStatusDropdown(!showStatusDropdown);
              }}
              title="Cambia stato"
            >
              {statusConfig.icon} Cambia Stato {showStatusDropdown ? '▲' : '▼'}
            </button>
            
            {showStatusDropdown && (
              <div 
                className="status-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  marginTop: '8px',
                  zIndex: 1002
                }}
              >
                {allStatuses.map((status) => (
                  <button
                    key={status.key}
                    className={`status-option ${activity.status === status.key ? 'current' : ''} ${isChangingStatus ? 'changing' : ''}`}
                    onClick={() => handleStatusChange(status.key)}
                    disabled={isChangingStatus}
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                      border: `2px solid ${activity.status === status.key ? status.color : 'transparent'}`
                    }}
                  >
                    <span className="status-icon">{status.icon}</span>
                    <span className="status-label">{status.label}</span>
                    {activity.status === status.key && <span className="current-indicator">✓</span>}
                    {isChangingStatus && <span className="loading-indicator">⏳</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="modal-btn primary-btn"
            onClick={() => {
              onEdit(activity);
              onClose();
            }}
            title="Modifica attività"
          >
            ✏️ Modifica
          </button>
          
          <button 
            className="modal-btn danger-btn"
            onClick={() => setShowDeleteConfirm(true)}
            title="Elimina attività"
          >
            🗑️ Elimina
          </button>
        </div>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="🗑️ Eliminazione"
          message="Sei sicuro di voler eliminare questa attività? Questa azione non può essere annullata."
          onConfirm={() => {
            onDelete(activity.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
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
    </div>
  );
};

export default ActivityDetailsModal;

