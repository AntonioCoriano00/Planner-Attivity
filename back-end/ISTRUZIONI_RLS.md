# 🔒 ISTRUZIONI ROW LEVEL SECURITY (RLS)

## 🚀 Avvio Rapido

### 1. Configurazione Iniziale

```bash
# Vai nella directory backend
cd planner-activity3/back-end

# Esegui la configurazione automatica
setup_rls.bat
```

### 2. Configurazione Manuale

```bash
# 1. Configura il database con RLS
python rls_setup.py

# 2. Avvia il server backend
python run.py

# 3. In un altro terminale, testa RLS
python test_rls.py
```

## 📋 Checklist Pre-Installazione

- [ ] Python 3.7+ installato
- [ ] Database esistente (esegui `setup_database.py` se necessario)
- [ ] Dipendenze installate (`pip install -r requirements.txt`)
- [ ] Porta 5000 libera per il backend

## 🔧 Configurazione Dettagliata

### Step 1: Setup Database RLS

```bash
python rls_setup.py
```

**Cosa fa:**
- Crea tabelle RLS (`rls_context`, `rls_policies`)
- Configura trigger di sicurezza
- Crea viste protette
- Inserisce policy predefinite
- Imposta contesto di default

### Step 2: Verifica Configurazione

```bash
python test_rls.py
```

**Test eseguiti:**
- ✅ Verifica trigger RLS
- ✅ Test isolamento dati
- ✅ Verifica policy attive
- ✅ Test endpoint di monitoraggio

### Step 3: Avvio Sistema

```bash
# Backend
python run.py

# Frontend (in un altro terminale)
cd ../planner-activity
npm start
```

## 🎯 Utilizzo RLS

### Decorator per Route

```python
from rls_manager import rls_required, admin_rls_required

# Per utenti normali
@api.route('/activities', methods=['GET'])
@token_required
@rls_required
def get_activities():
    # RLS filtra automaticamente per user_id
    activities = Activity.query.all()
    return jsonify([activity.to_dict() for activity in activities])

# Per admin
@api.route('/admin/users', methods=['GET'])
@token_required
@admin_rls_required
def get_all_users():
    # Admin può vedere tutti gli utenti
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])
```

### Gestione Contesto

```python
from rls_manager import rls_manager

# Imposta contesto utente
rls_manager.set_user_context(user_id=123)

# Ottieni contesto corrente
context = rls_manager.get_current_context()

# Pulisci contesto
rls_manager.clear_context()
```

## 📊 Monitoraggio

### Endpoint Disponibili

| Endpoint | Metodo | Descrizione | Accesso |
|----------|--------|-------------|---------|
| `/api/rls/stats` | GET | Statistiche RLS | Utenti autenticati |
| `/api/rls/test` | GET | Test isolamento | Solo Admin |

### Esempio di Risposta

```json
{
  "policies_count": 6,
  "triggers_count": 6,
  "views_count": 2,
  "current_context": {
    "user_id": 1,
    "session_id": "session_1_20240115_143022"
  },
  "rls_enabled": true
}
```

## 🧪 Testing

### Test Automatici

```bash
# Test completo RLS
python test_rls.py

# Test specifico isolamento
curl -X GET http://localhost:5000/api/rls/test \
  -H "Authorization: Bearer <admin_token>"
```

### Test Manuali

1. **Login come Admin**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   ```

2. **Crea Attività**:
   ```bash
   curl -X POST http://localhost:5000/api/activities \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test RLS", "date": "2024-01-15"}'
   ```

3. **Verifica Isolamento**:
   ```bash
   # Login come utente diverso
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "default", "password": "password123"}'
   
   # Prova a vedere attività di altri utenti (dovrebbe fallire)
   curl -X GET http://localhost:5000/api/activities \
     -H "Authorization: Bearer <default_token>"
   ```

## 🔍 Debugging

### Controllo Contesto

```python
from rls_manager import debug_rls_context

# Debug completo
debug_info = debug_rls_context()
print(debug_info)
```

### Log di Debug

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Abilita log RLS
app.logger.setLevel(logging.DEBUG)
```

### Verifica Database

```sql
-- Controlla trigger RLS
SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'rls_%';

-- Controlla viste protette
SELECT name FROM sqlite_master WHERE type='view' AND name LIKE 'protected_%';

-- Controlla policy attive
SELECT * FROM rls_policies WHERE is_active = 1;

-- Controlla contesto corrente
SELECT * FROM rls_context;
```

## ⚠️ Troubleshooting

### Problemi Comuni

1. **"Access denied: Row Level Security violation"**
   ```
   Soluzione: Verifica che il contesto utente sia impostato
   - Controlla che l'utente sia autenticato
   - Verifica che @rls_required sia presente
   ```

2. **Trigger non funzionanti**
   ```
   Soluzione: Riconfigura RLS
   - Esegui: python rls_setup.py
   - Verifica versione SQLite: python -c "import sqlite3; print(sqlite3.sqlite_version)"
   ```

3. **Performance lente**
   ```
   Soluzione: Ottimizza indici
   - Verifica indici su user_id
   - Considera query più specifiche
   ```

4. **Test falliti**
   ```
   Soluzione: Verifica configurazione
   - Controlla che il server sia in esecuzione
   - Verifica credenziali admin/default
   - Controlla log del server
   ```

### Reset Completo

```bash
# 1. Ferma il server
# 2. Rimuovi database
del instance\planner_activities_dev.db

# 3. Ricrea database
python setup_database.py

# 4. Configura RLS
python rls_setup.py

# 5. Testa
python test_rls.py
```

## 📚 Esempi Pratici

### Esempio 1: Route Semplice

```python
@api.route('/my-activities', methods=['GET'])
@token_required
@rls_required
def get_my_activities():
    # RLS filtra automaticamente per user_id corrente
    activities = Activity.query.all()
    return jsonify([activity.to_dict() for activity in activities])
```

### Esempio 2: Route con Filtri

```python
@api.route('/activities/today', methods=['GET'])
@token_required
@rls_required
def get_today_activities():
    today = datetime.now().date()
    # RLS + filtro per data
    activities = Activity.query.filter_by(date=today).all()
    return jsonify([activity.to_dict() for activity in activities])
```

### Esempio 3: Route Admin

```python
@api.route('/admin/activities/all', methods=['GET'])
@token_required
@admin_rls_required
def get_all_activities_admin():
    # Admin può vedere tutte le attività
    activities = Activity.query.all()
    return jsonify([activity.to_dict() for activity in activities])
```

## 🎉 Vantaggi Ottenuti

### Sicurezza
- ✅ **Isolamento garantito**: Impossibile accedere a dati di altri utenti
- ✅ **Protezione a livello database**: Sicurezza indipendente dall'applicazione
- ✅ **Audit completo**: Tracciamento di tutte le policy

### Performance
- ✅ **Filtri automatici**: Nessun overhead nell'applicazione
- ✅ **Indici ottimizzati**: Query efficienti con RLS
- ✅ **Scalabilità**: Supporto per migliaia di utenti

### Manutenibilità
- ✅ **Policy centralizzate**: Gestione unificata delle regole
- ✅ **Configurazione flessibile**: Policy modificabili senza codice
- ✅ **Testing integrato**: Verifica automatica dell'isolamento

## 📞 Supporto

### Log e Debug
- Controlla i log del server per errori
- Usa `debug_rls_context()` per informazioni dettagliate
- Verifica le statistiche RLS con `/api/rls/stats`

### Contatti
- Documentazione completa: `RLS_IMPLEMENTATION.md`
- Esempi di codice: `rls_examples.py`
- Test automatici: `test_rls.py`

---

**Implementato il**: 15 Gennaio 2024  
**Versione**: 1.0  
**Stato**: ✅ Attivo e Testato
