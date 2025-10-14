import React, { useState, useEffect } from 'react';
import './ActivityForm.css';

const ActivityForm = ({ activity, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    isMultiDay: false,
    isMultiHour: false,
    status: 'da-fare',
    priority: 'media',
    category: ''
  });

  useEffect(() => {
    // Debug: controlla cosa viene passato al form
    console.log('ActivityForm - Activity ricevuta:', activity);
    console.log('ActivityForm - Ha ID?', activity && activity.id);
    
    if (activity) {
      // Se l'activity ha un id, è una modifica, altrimenti è una nuova attività con dati precompilati
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        date: activity.date || today,
        time: activity.time || '',
        endDate: activity.endDate || '',
        endTime: activity.endTime || '',
        isMultiDay: activity.isMultiDay || false,
        isMultiHour: activity.isMultiHour || false,
        status: activity.status || 'da-fare',
        priority: activity.priority || 'media',
        category: activity.category || ''
      });
    } else {
      // Imposta la data di oggi come default
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: today }));
    }
  }, [activity]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }
    onSave(formData);
  };

  const statusOptions = [
    { value: 'da-fare', label: 'Da Fare', color: '#ff9800' },
    { value: 'in-corso', label: 'In Corso', color: '#2196f3' },
    { value: 'fatta', label: 'Fatta', color: '#4caf50' },
    { value: 'rimandata', label: 'Rimandata', color: '#f44336' }
  ];

  const priorityOptions = [
    { value: 'bassa', label: 'Bassa', color: '#4caf50' },
    { value: 'media', label: 'Media', color: '#ff9800' },
    { value: 'alta', label: 'Alta', color: '#f44336' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{activity && activity.id ? 'Modifica Attività' : 'Nuova Attività'}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="activity-form">
          <div className="form-group">
            <label htmlFor="title">Titolo *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Inserisci il titolo dell'attività"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrizione dell'attività (opzionale)"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Data</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Ora</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isMultiDay"
                  checked={formData.isMultiDay}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Attività multi-giorno</span>
              </label>
            </div>
          </div>

          {formData.isMultiDay && (
            <div className="form-group">
              <label htmlFor="endDate">Data di fine</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.date}
              />
            </div>
          )}

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isMultiHour"
                  checked={formData.isMultiHour}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Attività multi-ora</span>
              </label>
            </div>
          </div>

          {formData.isMultiHour && (
            <div className="form-group">
              <label htmlFor="endTime">Ora di fine</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                min={formData.isMultiDay ? undefined : formData.time}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Stato</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priorità</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="es. Lavoro, Personale, Studio..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Annulla
            </button>
            <button type="submit" className="save-btn">
              {activity && activity.id ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
