# 🔒 Row Level Security (RLS) - Implementazione Multi-Tenant

## Panoramica

Questo documento descrive l'implementazione di **Row Level Security (RLS)** per il sistema multi-tenant del Planner Attività. RLS garantisce l'isolamento completo dei dati a livello di database, fornendo una sicurezza robusta contro l'accesso non autorizzato ai dati.

## 🎯 Obiettivi

- **Isolamento completo dei dati**: Ogni utente può accedere solo ai propri dati
- **Sicurezza a livello database**: Protezione implementata direttamente nel database
- **Trasparenza per l'applicazione**: L'applicazione non deve gestire manualmente i filtri
- **Scalabilità**: Supporto per migliaia di utenti senza impatti sulle performance
- **Audit e monitoraggio**: Tracciamento completo delle policy di sicurezza

## 🏗️ Architettura RLS

### Componenti Principali

1. **Tabelle RLS**:
   - `rls_context`: Contesto utente corrente
   - `rls_policies`: Policy di sicurezza configurabili

2. **Trigger di Sicurezza**:
   - `rls_activities_*_trigger`: Protezione operazioni CRUD su activities
   - `rls_users_*_trigger`: Protezione operazioni su users

3. **Viste Protette**:
   - `protected_activities`: Vista filtrata per activities
   - `protected_users`: Vista filtrata per users

4. **Manager RLS**:
   - `RLSManager`: Gestione del contesto utente
   - Decorator `@rls_required`: Protezione automatica delle route

## 📋 Policy Implementate

### Tabella `activities`

| Policy | Tipo | Espressione | Descrizione |
|--------|------|-------------|-------------|
| `activities_select_policy` | SELECT | `user_id = current_user_id` | Solo attività dell'utente corrente |
| `activities_insert_policy` | INSERT | `user_id = current_user_id` | Solo inserimento per utente corrente |
| `activities_update_policy` | UPDATE | `user_id = current_user_id` | Solo modifica delle proprie attività |
| `activities_delete_policy` | DELETE | `user_id = current_user_id` | Solo eliminazione delle proprie attività |

### Tabella `users`

| Policy | Tipo | Espressione | Descrizione |
|--------|------|-------------|-------------|
| `users_select_policy` | SELECT | `id = current_user_id OR is_admin = 1` | Utente corrente o admin |
| `users_update_policy` | UPDATE | `id = current_user_id` | Solo modifica del proprio profilo |

## 🔧 Configurazione

### 1. Setup Iniziale

```bash
# Configura il database con RLS
python rls_setup.py
```

### 2. Integrazione nell'Applicazione

```python
from rls_manager import rls_required, admin_rls_required

@api.route('/activities', methods=['GET'])
@token_required
@rls_required
def get_activities():
    # RLS filtra automaticamente per user_id
    activities = Activity.query.all()
    return jsonify([activity.to_dict() for activity in activities])
```

### 3. Gestione del Contesto

```python
from rls_manager import rls_manager

# Imposta contesto utente
rls_manager.set_user_context(user_id=123)

# Ottieni contesto corrente
context = rls_manager.get_current_context()

# Pulisci contesto
rls_manager.clear_context()
```

## 🧪 Testing

### Test Automatici

```bash
# Esegui tutti i test RLS
python test_rls.py
```

### Test Manuali

1. **Test Isolamento**:
   ```bash
   # Login come admin
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   
   # Crea attività
   curl -X POST http://localhost:5000/api/activities \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "date": "2024-01-15"}'
   ```

2. **Test Statistiche RLS**:
   ```bash
   curl -X GET http://localhost:5000/api/rls/stats \
     -H "Authorization: Bearer <token>"
   ```

## 📊 Monitoraggio

### Endpoint di Monitoraggio

- `GET /api/rls/stats`: Statistiche RLS
- `GET /api/rls/test`: Test isolamento (solo admin)

### Metriche Disponibili

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

## 🔍 Debugging

### Controllo Contesto

```python
from rls_manager import debug_rls_context

# Debug completo del contesto RLS
debug_info = debug_rls_context()
print(debug_info)
```

### Reset Contesto

```python
from rls_manager import reset_rls_context

# Reset del contesto (solo per debug)
reset_rls_context()
```

## 🚀 Vantaggi RLS

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

## ⚠️ Considerazioni

### Limitazioni SQLite

- **Trigger**: SQLite supporta trigger ma con limitazioni
- **Performance**: Trigger aggiungono overhead minimo
- **Compatibilità**: Funziona con SQLite 3.7.0+

### Best Practices

1. **Sempre usare `@rls_required`** per route protette
2. **Testare regolarmente** l'isolamento dei dati
3. **Monitorare le performance** con molti utenti
4. **Backup regolari** del database con RLS

## 🔄 Migrazione da Filtri Applicativi

### Prima (Filtri Applicativi)

```python
@api.route('/activities', methods=['GET'])
@token_required
def get_activities():
    user = request.current_user
    activities = Activity.query.filter_by(user_id=user.id).all()
    return jsonify([activity.to_dict() for activity in activities])
```

### Dopo (RLS)

```python
@api.route('/activities', methods=['GET'])
@token_required
@rls_required
def get_activities():
    # RLS filtra automaticamente per user_id
    activities = Activity.query.all()
    return jsonify([activity.to_dict() for activity in activities])
```

## 📚 Riferimenti

- [SQLite Trigger Documentation](https://www.sqlite.org/lang_createtrigger.html)
- [Row Level Security Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)

## 🆘 Troubleshooting

### Problemi Comuni

1. **"Access denied: Row Level Security violation"**
   - Verifica che il contesto utente sia impostato
   - Controlla che l'utente sia autenticato

2. **Trigger non funzionanti**
   - Verifica la versione di SQLite
   - Controlla che i trigger siano stati creati

3. **Performance lente**
   - Verifica gli indici sulle colonne user_id
   - Considera l'ottimizzazione delle query

### Log di Debug

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Abilita log RLS
app.logger.setLevel(logging.DEBUG)
```

---

**Implementato il**: 15 Gennaio 2024  
**Versione**: 1.0  
**Autore**: Sistema Planner Attività  
**Stato**: ✅ Attivo e Testato
