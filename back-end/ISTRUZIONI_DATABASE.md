# Istruzioni per il Database - Planner Attività

## ✅ Database Creato con Successo!

Il database per la tua applicazione Planner Attività è stato creato e inizializzato correttamente.

### 📊 Cosa è stato fatto:

1. **Database creato**: `planner_activities_dev.db` (40KB)
2. **Tabella creata**: `activities` con tutti i campi necessari
3. **Dati di esempio**: 3 attività di test sono state aggiunte
4. **Dipendenze installate**: Tutti i moduli Python necessari

### 🚀 Come avviare l'applicazione:

#### Opzione 1: Usando il file batch (più semplice)
```bash
# Doppio clic su:
start_server.bat
```

#### Opzione 2: Usando la riga di comando
```bash
# Apri il prompt dei comandi nella cartella back-end e esegui:
python run.py
```

### 🔗 URL dell'API:
- **Server**: http://localhost:5000
- **API Base**: http://localhost:5000/api/
- **Attività**: http://localhost:5000/api/activities

### 📝 Struttura del Database:

La tabella `activities` contiene:
- `id` - Identificatore univoco
- `title` - Titolo dell'attività
- `description` - Descrizione
- `date` - Data (YYYY-MM-DD)
- `time` - Ora (HH:MM)
- `status` - Stato (da-fare, in-corso, fatta, rimandata)
- `priority` - Priorità (bassa, media, alta)
- `category` - Categoria
- `created_at` - Data di creazione
- `updated_at` - Data di aggiornamento

### 🧪 Test del Database:

Per testare che tutto funzioni:
```bash
python simple_test.py
```

### 📁 File del Database:
- **Posizione**: `instance/planner_activities_dev.db`
- **Dimensione**: 40KB (con dati di esempio)
- **Tipo**: SQLite

### ⚠️ Note Importanti:

1. **Non eliminare** il file `planner_activities_dev.db`
2. **Non modificare** la cartella `instance/`
3. Il database viene **aggiornato automaticamente** quando usi l'app
4. Per **svuotare** il database, elimina il file e ri-esegui `python init_db.py`

### 🔧 Risoluzione Problemi:

Se hai problemi:
1. Verifica che Python sia installato
2. Verifica che tutte le dipendenze siano installate: `pip install -r requirements.txt`
3. Controlla che la porta 5000 non sia occupata
4. Riavvia il server se necessario

### 📞 Supporto:

Il database è ora pronto per l'uso! Puoi iniziare a usare l'applicazione frontend per gestire le tue attività.
