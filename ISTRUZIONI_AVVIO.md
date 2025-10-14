# 🚀 Istruzioni per Avviare il Sistema Planner Attività

## ✅ Configurazione Completata

L'app React "planner-activity" è stata **completamente collegata** al backend Flask. Ecco cosa è stato implementato:

### 🔧 Modifiche Apportate

1. **Servizi API** (`src/services/api.js`)
   - Integrazione completa con axios
   - Gestione di tutti gli endpoint del backend
   - Gestione errori e timeout

2. **Hook Personalizzati**
   - `useActivities.js` - Gestione completa delle attività
   - `useActivityStats.js` - Statistiche delle attività

3. **App.js Aggiornato**
   - Sostituito localStorage con chiamate al backend
   - Indicatori di stato del backend
   - Gestione errori e caricamento

4. **Dipendenze Aggiunte**
   - `axios` per le chiamate HTTP

## 🚀 Come Avviare il Sistema

### Opzione 1: Script Automatico (Windows)
```bash
# Esegui lo script di configurazione
start-system.bat
```

### Opzione 2: Configurazione Manuale

#### 1. Installa le Dipendenze React
```bash
cd planner-activity3/planner-activity
npm install
```

#### 2. Crea il File .env
Crea un file `.env` nella cartella `planner-activity3/planner-activity/` con:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000
```

#### 3. Avvia il Backend
```bash
cd planner-activity3/back-end
python run.py
```
Il backend sarà disponibile su: **http://localhost:5000**

#### 4. Avvia il Frontend
```bash
cd planner-activity3/planner-activity
npm start
```
Il frontend sarà disponibile su: **http://localhost:3000**

## 🔍 Test della Connessione

### Test Automatico
L'app include indicatori di stato che mostrano:
- ✅ **Verde**: Backend connesso
- ⚠️ **Rosso**: Backend non disponibile
- 🔄 **Caricamento**: Operazioni in corso

### Test Manuale
Puoi testare la connessione aprendo la console del browser e verificando che:
1. Le attività vengono caricate dal backend
2. Le operazioni CRUD funzionano correttamente
3. Gli errori vengono gestiti appropriatamente

## 📋 Funzionalità Disponibili

### ✅ Completamente Funzionanti
- **Visualizzazione attività** dal backend
- **Creazione nuove attività** con salvataggio nel database
- **Modifica attività esistenti**
- **Eliminazione attività**
- **Cambio stato attività** (da-fare → in-corso → fatta → rimandata)
- **Filtri per data, stato, priorità**
- **Statistiche in tempo reale**
- **Gestione errori e stati di caricamento**

### 🎯 Endpoint API Utilizzati
- `GET /api/activities` - Lista attività
- `POST /api/activities` - Crea attività
- `PUT /api/activities/{id}` - Aggiorna attività
- `DELETE /api/activities/{id}` - Elimina attività
- `PATCH /api/activities/{id}/status` - Cambia stato
- `GET /api/activities/stats` - Statistiche
- `GET /api/health` - Health check

## 🛠️ Risoluzione Problemi

### Backend Non Raggiungibile
1. Verifica che il backend sia in esecuzione su porta 5000
2. Controlla i log del backend per errori
3. Verifica che il file `.env` contenga l'URL corretto

### Errori di Installazione
1. Assicurati di avere Node.js installato
2. Assicurati di avere Python e pip installati
3. Esegui `npm install` nella cartella React
4. Esegui `pip install -r requirements.txt` nella cartella backend

### Errori CORS
Il backend è già configurato per accettare richieste da `http://localhost:3000`

## 🎉 Sistema Pronto!

Il sistema è ora **completamente funzionante** con:
- ✅ Frontend React collegato al backend
- ✅ Database SQLite per la persistenza
- ✅ API REST complete
- ✅ Gestione errori robusta
- ✅ Interfaccia utente reattiva

**Buon lavoro con il tuo Planner Attività!** 🎯
