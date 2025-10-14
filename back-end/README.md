# Backend Planner Attività

Backend Python per l'applicazione Planner Attività, sviluppato con Flask.

## 🚀 Caratteristiche

- **API RESTful** per la gestione delle attività
- **Database SQLite** per la persistenza dei dati
- **CORS abilitato** per l'integrazione con il frontend React
- **Validazione dei dati** con controlli di integrità
- **Endpoint per statistiche** e filtri avanzati

## 📋 Funzionalità

### Gestione Attività
- ✅ Creazione, lettura, aggiornamento ed eliminazione (CRUD)
- ✅ Filtri per data, stato, priorità e categoria
- ✅ Aggiornamento rapido dello stato
- ✅ Statistiche e report

### Stati delle Attività
- `da-fare` - Attività da completare
- `in-corso` - Attività in esecuzione
- `fatta` - Attività completata
- `rimandata` - Attività rimandata

### Priorità
- `bassa` - Priorità bassa
- `media` - Priorità media
- `alta` - Priorità alta

## 🛠️ Installazione

1. **Installa le dipendenze Python:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configura le variabili d'ambiente (opzionale):**
   ```bash
   cp .env.example .env
   # Modifica .env secondo le tue necessità
   ```

3. **Avvia il server:**
   ```bash
   python run.py
   ```

Il server sarà disponibile su `http://localhost:5000`

## 📡 API Endpoints

### Attività
- `GET /api/activities` - Ottiene tutte le attività
- `GET /api/activities/<id>` - Ottiene un'attività specifica
- `POST /api/activities` - Crea una nuova attività
- `PUT /api/activities/<id>` - Aggiorna un'attività
- `DELETE /api/activities/<id>` - Elimina un'attività
- `PATCH /api/activities/<id>/status` - Aggiorna solo lo stato

### Filtri e Ricerche
- `GET /api/activities/date/<date>` - Attività per data
- `GET /api/activities/status/<status>` - Attività per stato
- `GET /api/activities/categories` - Lista categorie
- `GET /api/activities/stats` - Statistiche

### Utility
- `GET /api/health` - Controllo stato del servizio

## 📊 Esempi di Utilizzo

### Creare una nuova attività
```bash
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Completare progetto",
    "description": "Finire la documentazione",
    "date": "2024-01-15",
    "time": "14:30",
    "status": "da-fare",
    "priority": "alta",
    "category": "Lavoro"
  }'
```

### Ottenere attività per data
```bash
curl http://localhost:5000/api/activities/date/2024-01-15
```

### Aggiornare lo stato
```bash
curl -X PATCH http://localhost:5000/api/activities/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in-corso"}'
```

## 🗄️ Struttura del Database

### Tabella `activities`
- `id` - Chiave primaria
- `title` - Titolo dell'attività (obbligatorio)
- `description` - Descrizione
- `date` - Data (obbligatorio)
- `time` - Ora
- `status` - Stato dell'attività
- `priority` - Priorità
- `category` - Categoria
- `created_at` - Data di creazione
- `updated_at` - Data ultimo aggiornamento

## 🔧 Configurazione

### Variabili d'ambiente
- `DATABASE_URL` - URL del database
- `FLASK_ENV` - Ambiente (development/production)
- `FLASK_DEBUG` - Modalità debug
- `CORS_ORIGINS` - Origini CORS consentite

### File di configurazione
- `config.py` - Configurazioni per diversi ambienti
- `.env` - Variabili d'ambiente locali

## 🧪 Test

Per testare l'API puoi utilizzare:

1. **Postman** - Importa la collection di test
2. **curl** - Comandi da terminale
3. **Frontend React** - Integrazione completa

## 📝 Note di Sviluppo

- Il database SQLite viene creato automaticamente al primo avvio
- CORS è configurato per accettare richieste dal frontend React
- Tutti gli endpoint restituiscono JSON
- Gestione errori completa con messaggi informativi
- Validazione dei dati di input

## 🔄 Integrazione con Frontend

Il backend è progettato per integrarsi perfettamente con il frontend React esistente. Assicurati che:

1. Il frontend faccia richieste a `http://localhost:5000/api/`
2. Le richieste includano l'header `Content-Type: application/json`
3. I dati inviati seguano il formato JSON definito negli endpoint
