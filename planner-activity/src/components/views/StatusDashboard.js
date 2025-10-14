import React, { useState, useEffect, useMemo } from 'react';
import ActivityCard from '../ActivityCard';
import './StatusDashboard.css';

const StatusDashboard = ({ activities, onEditActivity, onDeleteActivity, onToggleStatus }) => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'analytics', 'filters'
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('priority'); // 'priority', 'date', 'title', 'status'

  const statusConfig = {
    'da-fare': { 
      label: 'Da Fare', 
      color: '#ff9800', 
      icon: '⏳',
      description: 'Attività da completare',
      bgColor: '#fff3e0'
    },
    'in-corso': { 
      label: 'In Corso', 
      color: '#2196f3', 
      icon: '🔄',
      description: 'Attività in corso di svolgimento',
      bgColor: '#e3f2fd'
    },
    'fatta': { 
      label: 'Fatte', 
      color: '#4caf50', 
      icon: '✅',
      description: 'Attività completate',
      bgColor: '#e8f5e8'
    },
    'rimandata': { 
      label: 'Rimandate', 
      color: '#f44336', 
      icon: '⏰',
      description: 'Attività rimandate',
      bgColor: '#ffebee'
    }
  };

  // Filtra e ordina le attività
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filtro per stato
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    // Filtro per priorità
    if (filters.priority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === filters.priority);
    }

    // Filtro per data
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(today.getDate());
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(activity => {
          const activityDate = new Date(activity.date);
          return activityDate >= filterDate;
        });
      }
    }

    // Filtro per ricerca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower)
      );
    }

    // Ordina le attività
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { alta: 3, media: 2, bassa: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.date) - new Date(b.date);
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          const statusOrder = { 'da-fare': 3, 'in-corso': 2, 'fatta': 1, 'rimandata': 0 };
          return statusOrder[b.status] - statusOrder[a.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [activities, filters, sortBy]);

  // Raggruppa le attività per stato
  const getActivitiesByStatus = () => {
    const grouped = {};
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = filteredActivities.filter(activity => activity.status === status);
    });
    return grouped;
  };

  const activitiesByStatus = getActivitiesByStatus();

  // Statistiche avanzate
  const getAdvancedStats = () => {
    const total = filteredActivities.length;
    const completed = activitiesByStatus['fatta'].length;
    const inProgress = activitiesByStatus['in-corso'].length;
    const pending = activitiesByStatus['da-fare'].length;
    const postponed = activitiesByStatus['rimandata'].length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const productivityScore = total > 0 ? Math.round((completed + inProgress * 0.5) / total * 100) : 0;
    
    // Statistiche per priorità
    const priorityStats = {
      alta: filteredActivities.filter(a => a.priority === 'alta').length,
      media: filteredActivities.filter(a => a.priority === 'media').length,
      bassa: filteredActivities.filter(a => a.priority === 'bassa').length
    };
    
    // Statistiche per data
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const overdue = filteredActivities.filter(a => 
      a.status !== 'fatta' && new Date(a.date) < today
    ).length;
    
    const todayActivities = filteredActivities.filter(a => a.date === todayStr).length;
    
    // Calcola ore totali
    const totalHours = filteredActivities.reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);
    
    const completedHours = activitiesByStatus['fatta'].reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);

    return {
      total,
      completed,
      inProgress,
      pending,
      postponed,
      completionRate,
      productivityScore,
      priorityStats,
      overdue,
      todayActivities,
      totalHours,
      completedHours
    };
  };

  // Analisi delle tendenze
  const getTrendAnalysis = () => {
    const stats = getAdvancedStats();
    const insights = [];
    
    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Ottimo Progresso!',
        message: `Hai completato l'${stats.completionRate}% delle attività. Continua così!`
      });
    } else if (stats.completionRate < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Attenzione',
        message: 'Il tasso di completamento è basso. Considera di ridurre il carico di lavoro.'
      });
    }
    
    if (stats.overdue > 0) {
      insights.push({
        type: 'warning',
        icon: '⏰',
        title: 'Attività Scadute',
        message: `Hai ${stats.overdue} attività scadute. Valuta se sono ancora necessarie.`
      });
    }
    
    if (stats.priorityStats.alta > 0) {
      const completedHighPriority = activitiesByStatus['fatta'].filter(a => a.priority === 'alta').length;
      const highPriorityCompletion = Math.round((completedHighPriority / stats.priorityStats.alta) * 100);
      
      if (highPriorityCompletion === 100) {
        insights.push({
          type: 'success',
          icon: '⭐',
          title: 'Priorità Completate',
          message: 'Hai completato tutte le attività ad alta priorità!'
        });
      } else if (highPriorityCompletion < 50) {
        insights.push({
          type: 'info',
          icon: '📋',
          title: 'Focus sulle Priorità',
          message: 'Concentrati sulle attività ad alta priorità per massimizzare l\'efficienza.'
        });
      }
    }
    
    if (stats.todayActivities > 0) {
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'Attività di Oggi',
        message: `Hai ${stats.todayActivities} attività programmate per oggi.`
      });
    }
    
    if (stats.postponed > stats.total * 0.3) {
      insights.push({
        type: 'info',
        icon: '🔄',
        title: 'Molte Attività Rimandate',
        message: 'Considera se tutte le attività rimandate sono davvero necessarie.'
      });
    }
    
    return insights;
  };

  const stats = getAdvancedStats();
  const insights = getTrendAnalysis();

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      dateRange: 'all',
      search: ''
    });
  };

  const hasActiveFilters = filters.status !== 'all' || 
                          filters.priority !== 'all' || 
                          filters.dateRange !== 'all' || 
                          filters.search !== '';

  return (
    <div className="status-dashboard">
      {/* Header con statistiche principali */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Dashboard Attività per Stato</h2>
          <div className="filter-summary">
            {hasActiveFilters && (
              <div className="active-filters">
                <span className="filter-count">{filteredActivities.length} attività filtrate</span>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Pulisci filtri
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="main-stats">
          <div className="stat-card primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Attività Totali</div>
              <div className="stat-detail">{stats.overdue} scadute</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completionRate}%</div>
              <div className="stat-label">Completamento</div>
              <div className="stat-detail">{stats.completed}/{stats.total} completate</div>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-number">{stats.productivityScore}%</div>
              <div className="stat-label">Produttività</div>
              <div className="stat-detail">{stats.inProgress} in corso</div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalHours}h</div>
              <div className="stat-label">Ore Totali</div>
              <div className="stat-detail">{stats.completedHours}h completate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle per cambiare vista */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          📋 Kanban
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
        >
          📊 Analisi
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'filters' ? 'active' : ''}`}
          onClick={() => setViewMode('filters')}
        >
          🔍 Filtri
        </button>
      </div>

      {/* Contenuto principale */}
       {/* <div className="dashboard-content">*/}
        {viewMode === 'kanban' && (
          <div className="kanban-view">
            <div className="kanban-controls">
              <div className="sort-controls">
                <label htmlFor="sort-select">Ordina per:</label>
                <select 
                  id="sort-select"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="priority">Priorità</option>
                  <option value="date">Data</option>
                  <option value="title">Titolo</option>
                  <option value="status">Stato</option>
                </select>
              </div>
            </div>
            
            <div className="kanban-board">
              {Object.entries(activitiesByStatus).map(([status, activities]) => {
                const config = statusConfig[status];
                
                return (
                  <div key={status} className="kanban-column">
                    <div 
                      className="column-header"
                      style={{ backgroundColor: config.bgColor, borderTopColor: config.color }}
                    >
                      <div className="column-title">
                        <span className="column-icon">{config.icon}</span>
                        <span className="column-label">{config.label}</span>
                        <span className="column-count">({activities.length})</span>
                      </div>
                      <div className="column-description">
                        {config.description}
                      </div>
                    </div>
                    
                    <div className="column-content">
                      {activities.length === 0 ? (
                        <div className="empty-column">
                          <div className="empty-icon">📭</div>
                          <p>Nessuna attività</p>
                        </div>
                      ) : (
                        activities.map(activity => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onEdit={() => onEditActivity(activity)}
                            onDelete={() => onDeleteActivity(activity.id)}
                            onToggleStatus={() => onToggleStatus(activity.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="analytics-view">
            <div className="analytics-grid">
              <div className="chart-card">
                <h3>Distribuzione per Stato</h3>
                <div className="status-chart">
                  {Object.entries(activitiesByStatus).map(([status, activities]) => {
                    const config = statusConfig[status];
                    const percentage = stats.total > 0 ? Math.round((activities.length / stats.total) * 100) : 0;
                    
                    return (
                      <div key={status} className="status-item">
                        <div className="status-bar" style={{ width: `${percentage}%` }}></div>
                        <div className="status-info">
                          <span className="status-label">{config.label}</span>
                          <span className="status-count">{activities.length}</span>
                          <span className="status-percentage">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Distribuzione per Priorità</h3>
                <div className="priority-chart">
                  {Object.entries(stats.priorityStats).map(([priority, count]) => {
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const priorityConfig = {
                      alta: { color: '#f44336', label: 'Alta' },
                      media: { color: '#ff9800', label: 'Media' },
                      bassa: { color: '#4caf50', label: 'Bassa' }
                    };
                    
                    return (
                      <div key={priority} className="priority-item">
                        <div 
                          className="priority-bar" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: priorityConfig[priority].color
                          }}
                        ></div>
                        <div className="priority-info">
                          <span className="priority-label">{priorityConfig[priority].label}</span>
                          <span className="priority-count">{count}</span>
                          <span className="priority-percentage">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Metriche di Produttività</h3>
                <div className="productivity-metrics">
                  <div className="metric-item">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                      <div className="metric-value">{stats.completionRate}%</div>
                      <div className="metric-label">Tasso di Completamento</div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon">⚡</div>
                    <div className="metric-content">
                      <div className="metric-value">{stats.productivityScore}%</div>
                      <div className="metric-label">Punteggio Produttività</div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon">⏰</div>
                    <div className="metric-content">
                      <div className="metric-value">{stats.overdue}</div>
                      <div className="metric-label">Attività Scadute</div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon">📅</div>
                    <div className="metric-content">
                      <div className="metric-value">{stats.todayActivities}</div>
                      <div className="metric-label">Attività di Oggi</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'filters' && (
          <div className="filters-view">
            <div className="filters-container">
              <div className="filter-section">
                <h3>🔍 Filtri Avanzati</h3>
                
                <div className="filter-group">
                  <label htmlFor="status-filter">Stato:</label>
                  <select 
                    id="status-filter"
                    value={filters.status} 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="da-fare">Da Fare</option>
                    <option value="in-corso">In Corso</option>
                    <option value="fatta">Fatte</option>
                    <option value="rimandata">Rimandate</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="priority-filter">Priorità:</label>
                  <select 
                    id="priority-filter"
                    value={filters.priority} 
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tutte le priorità</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="bassa">Bassa</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="date-filter">Periodo:</label>
                  <select 
                    id="date-filter"
                    value={filters.dateRange} 
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tutte le date</option>
                    <option value="today">Oggi</option>
                    <option value="week">Ultima settimana</option>
                    <option value="month">Ultimo mese</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="search-filter">Ricerca:</label>
                  <input 
                    id="search-filter"
                    type="text"
                    value={filters.search} 
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Cerca per titolo o descrizione..."
                    className="filter-input"
                  />
                </div>
              </div>
              
              <div className="filter-results">
                <h3>📋 Risultati Filtro</h3>
                <div className="results-summary">
                  <div className="result-stat">
                    <span className="result-number">{filteredActivities.length}</span>
                    <span className="result-label">Attività trovate</span>
                  </div>
                  <div className="result-stat">
                    <span className="result-number">{stats.completionRate}%</span>
                    <span className="result-label">Completamento</span>
                  </div>
                  <div className="result-stat">
                    <span className="result-number">{stats.totalHours}h</span>
                    <span className="result-label">Ore totali</span>
                  </div>
                </div>
                
                {filteredActivities.length > 0 ? (
                  <div className="filtered-activities">
                    {filteredActivities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onEdit={() => onEditActivity(activity)}
                        onDelete={() => onDeleteActivity(activity.id)}
                        onToggleStatus={() => onToggleStatus(activity.id)}
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h4>Nessun risultato trovato</h4>
                    <p>Prova a modificare i filtri per vedere più attività.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights e consigli */}
        <div className="insights-section">
          <div className="insights-card">
            <h3>💡 Insights e Consigli</h3>
            <div className="insights-content">
              {insights.length === 0 ? (
                <div className="insight neutral">
                  <strong>Nessuna attività!</strong> Aggiungi alcune attività per vedere insights personalizzati.
                </div>
              ) : (
                insights.map((insight, index) => (
                  <div key={index} className={`insight ${insight.type}`}>
                    <span className="insight-icon">{insight.icon}</span>
                    <div className="insight-content">
                      <strong>{insight.title}</strong>
                      <p>{insight.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      {/*</div>*/}  
    </div>
  );
};  

export default StatusDashboard;
