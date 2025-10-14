# 🔐 Sistema di Autenticazione JWT - My Planner

## 📋 Panoramica

Il sistema di autenticazione JWT è stato implementato con successo nel tuo progetto My Planner. Ora gli utenti possono:

- **Registrarsi** con username, email e password
- **Accedere** con username/email e password
- **Gestire le proprie attività** in modo privato e sicuro
- **Effettuare il logout** quando necessario

## 🚀 Come Avviare il Sistema

### 1. Backend (Flask)
```bash
cd planner-activity3/back-end
python run.py
```
Il backend sarà disponibile su: `http://localhost:5000`

### 2. Frontend (React)
```bash
cd planner-activity3/planner-activity
npm start
```
Il frontend sarà disponibile su: `http://localhost:3000`

## 👤 Account di Default

È stato creato un account di default per testare il sistema:

- **Username**: `default`
- **Password**: `password123`
- **Email**: `default@example.com`

## 🔧 Funzionalità Implementate

### Backend (Flask)
- ✅ **Modello User** con hash delle password
- ✅ **Sistema JWT** per l'autenticazione
- ✅ **Route di autenticazione**:
  - `POST /api/auth/register` - Registrazione
  - `POST /api/auth/login` - Login
  - `GET /api/auth/me` - Informazioni utente corrente
  - `POST /api/auth/verify` - Verifica token
  - `POST /api/auth/logout` - Logout
  - `PUT /api/auth/change-password` - Cambio password
- ✅ **Protezione delle route** con decorator `@token_required`
- ✅ **Relazione User-Activity** (ogni attività appartiene a un utente)

### Frontend (React)
- ✅ **AuthContext** per gestire lo stato di autenticazione
- ✅ **Componenti di autenticazione**:
  - `LoginForm` - Form di login
  - `RegisterForm` - Form di registrazione
  - `AuthPage` - Pagina principale di autenticazione
- ✅ **Header aggiornato** con informazioni utente e logout
- ✅ **Protezione delle route** (solo utenti autenticati possono accedere all'app)
- ✅ **Gestione automatica del token** tramite interceptor axios

## 🎨 Interfaccia Utente

### Pagina di Login/Registrazione
- Design moderno con gradiente
- Form responsive
- Validazione lato client
- Messaggi di errore chiari
- Animazioni fluide

### App Principale
- Header con informazioni utente
- Pulsante logout con conferma
- Tutte le funzionalità esistenti mantenute
- Protezione automatica delle API

## 🔒 Sicurezza

- **Password hashate** con Werkzeug
- **Token JWT** con scadenza (24 ore)
- **Validazione input** lato server e client
- **Protezione CSRF** tramite token
- **Gestione errori** sicura

## 📊 Database

Il database è stato aggiornato con:

- **Tabella `users`**:
  - `id` (Primary Key)
  - `username` (Unique)
  - `email` (Unique)
  - `password_hash`
  - `created_at`, `updated_at`
  - `is_active`

- **Tabella `activities`** (aggiornata):
  - Tutti i campi esistenti
  - `user_id` (Foreign Key verso users)

## 🧪 Test del Sistema

### 1. Registrazione
1. Vai su `http://localhost:3000`
2. Clicca "Registrati qui"
3. Compila il form con:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Clicca "Registrati"

### 2. Login
1. Usa le credenziali create o l'account default
2. Clicca "Accedi"
3. Verrai reindirizzato all'app principale

### 3. Gestione Attività
1. Crea, modifica, elimina attività
2. Ogni attività sarà associata al tuo account
3. Altri utenti non vedranno le tue attività

### 4. Logout
1. Clicca il pulsante "Logout" nell'header
2. Conferma l'azione
3. Verrai reindirizzato alla pagina di login

## 🛠️ Personalizzazione

### Cambiare la Chiave Segreta JWT
Nel file `planner-activity3/back-end/auth.py`:
```python
JWT_SECRET_KEY = 'your-new-secret-key-here'
```

### Modificare la Scadenza del Token
Nel file `planner-activity3/back-end/auth.py`:
```python
JWT_EXPIRATION_HOURS = 24  # Cambia questo valore
```

### Aggiungere Validazioni Password
Nel file `planner-activity3/back-end/auth_routes.py`, modifica la funzione `validate_password()`.

## 🐛 Risoluzione Problemi

### Backend non si avvia
- Verifica che tutte le dipendenze siano installate: `pip install -r requirements.txt`
- Controlla che la porta 5000 sia libera

### Frontend non si avvia
- Verifica che Node.js sia installato
- Esegui `npm install` nella cartella del frontend
- Controlla che la porta 3000 sia libera

### Errori di autenticazione
- Verifica che il backend sia in esecuzione
- Controlla la console del browser per errori
- Verifica che il token non sia scaduto

### Database non funziona
- Esegui `python setup_database.py` per ricreare il database
- Verifica i permessi della cartella `instance/`

## 📝 Note Aggiuntive

- Il sistema è completamente funzionale e pronto per l'uso
- Tutte le funzionalità esistenti sono state mantenute
- Il codice è ben documentato e modulare
- È possibile estendere il sistema con funzionalità aggiuntive (ruoli, permessi, ecc.)

## 🎉 Conclusione

Il sistema di autenticazione JWT è stato implementato con successo! Ora hai un'applicazione completa e sicura per la gestione delle attività personali.

Per qualsiasi domanda o problema, controlla i log del backend e del frontend per maggiori dettagli.
