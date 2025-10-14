# Configurazione Backend per Planner Attività

## Configurazione delle Variabili d'Ambiente

Crea un file `.env` nella cartella `planner-activity` con il seguente contenuto:

```env
# URL del backend API
REACT_APP_API_URL=http://localhost:5000/api

# Timeout per le richieste API (in millisecondi)
REACT_APP_API_TIMEOUT=10000
```

## Installazione delle Dipendenze

1. Installa le nuove dipendenze React:
```bash
cd planner-activity3/planner-activity
npm install
```

## Avvio del Sistema

### 1. Avvia il Backend (Flask)
```bash
cd planner-activity3/back-end
python run.py
```
Il backend sarà disponibile su `http://localhost:5000`

### 2. Avvia il Frontend (React)
```bash
cd planner-activity3/planner-activity
npm start
```
Il frontend sarà disponibile su `http://localhost:3000`

## Funzionalità Implementate

### API Backend
- ✅ CRUD completo per le attività
- ✅ Filtri per stato, priorità, categoria e date
- ✅ Statistiche delle attività
- ✅ Gestione degli stati (da-fare, in-corso, fatta, rimandata)
- ✅ Gestione delle priorità (bassa, media, alta)
- ✅ Endpoint di health check

### Frontend React
- ✅ Integrazione completa con il backend
- ✅ Gestione degli errori e stati di caricamento
- ✅ Indicatori di stato del backend
- ✅ Hook personalizzati per le attività
- ✅ Servizi API con axios
- ✅ Fallback in caso di disconnessione del backend

## Struttura dei Dati

### Attività
```json
{
  "id": 1,
  "title": "Titolo attività",
  "description": "Descrizione opzionale",
  "date": "2024-01-15",
  "time": "14:30",
  "status": "da-fare",
  "priority": "media",
  "category": "Lavoro",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Stati Validi
- `da-fare`: Attività da fare
- `in-corso`: Attività in corso
- `fatta`: Attività completata
- `rimandata`: Attività rimandata

### Priorità Valide
- `bassa`: Priorità bassa
- `media`: Priorità media
- `alta`: Priorità alta

## Endpoint API Disponibili

- `GET /api/activities` - Lista tutte le attività
- `GET /api/activities/{id}` - Ottiene un'attività specifica
- `POST /api/activities` - Crea una nuova attività
- `PUT /api/activities/{id}` - Aggiorna un'attività
- `DELETE /api/activities/{id}` - Elimina un'attività
- `PATCH /api/activities/{id}/status` - Aggiorna solo lo stato
- `GET /api/activities/date/{date}` - Attività per data
- `GET /api/activities/status/{status}` - Attività per stato
- `GET /api/activities/stats` - Statistiche
- `GET /api/activities/categories` - Lista categorie
- `GET /api/health` - Health check

## Risoluzione Problemi

### Backend non raggiungibile
- Verifica che il backend sia in esecuzione su `http://localhost:5000`
- Controlla i log del backend per errori
- Verifica che la porta 5000 non sia occupata

### Errori CORS
- Il backend è configurato per accettare richieste da `http://localhost:3000`
- Se usi una porta diversa, aggiorna la configurazione CORS nel backend

### Errori di connessione
- Verifica la configurazione della variabile `REACT_APP_API_URL`
- Controlla che il file `.env` sia nella cartella corretta
- Riavvia l'applicazione React dopo aver modificato le variabili d'ambiente
