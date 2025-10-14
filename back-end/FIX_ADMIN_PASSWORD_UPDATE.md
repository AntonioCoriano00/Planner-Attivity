# Fix: Admin Password Update Error

## Problema
Quando un admin cercava di modificare la password di un utente dalla sezione admin, riceveva questo errore:

```
❌ (sqlite3.IntegrityError) Access denied: Row Level Security violation
[SQL: UPDATE users SET password_hash=?, updated_at=? WHERE users.id = ?]
```

## Causa
Il trigger RLS `rls_users_update_trigger` impediva qualsiasi modifica agli utenti se l'ID dell'utente da modificare non corrispondeva all'ID dell'utente corrente nel contesto RLS. Questo significa che anche gli admin non potevano modificare altri utenti.

### Trigger Vecchio (Problematico)
```sql
CREATE TRIGGER rls_users_update_trigger
BEFORE UPDATE ON users
BEGIN
    SELECT CASE
        WHEN OLD.id != (SELECT current_user_id FROM rls_context WHERE id = 1)
        THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
    END;
END;
```

## Soluzione
Il trigger è stato modificato per permettere agli admin di bypassare la restrizione RLS. Ora il trigger controlla se l'utente corrente è un admin prima di bloccare l'operazione.

### Trigger Nuovo (Corretto)
```sql
CREATE TRIGGER rls_users_update_trigger
BEFORE UPDATE ON users
BEGIN
    SELECT CASE
        WHEN OLD.id != (SELECT current_user_id FROM rls_context WHERE id = 1)
        AND (SELECT is_admin FROM users WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)) != 1
        THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
    END;
END;
```

### Logica del Nuovo Trigger
Il trigger ora blocca l'update solo se:
1. L'utente da modificare NON è l'utente corrente **E**
2. L'utente corrente NON è un admin

Questo significa:
- ✅ Gli admin possono modificare qualsiasi utente (incluse le password)
- ✅ Gli utenti normali possono modificare solo se stessi
- ✅ L'isolamento dei dati rimane attivo per le attività

## Come Applicare la Correzione

### Metodo 1: Eseguire lo Script di Correzione
```bash
cd planner-activity3/back-end
python fix_admin_rls.py
```

O su Windows:
```batch
cd planner-activity3\back-end
fix_admin_rls.bat
```

### Metodo 2: Eseguire Manualmente SQL
Connetti al database e esegui:

```sql
-- Rimuovi il vecchio trigger
DROP TRIGGER IF EXISTS rls_users_update_trigger;

-- Crea il nuovo trigger
CREATE TRIGGER rls_users_update_trigger
BEFORE UPDATE ON users
BEGIN
    SELECT CASE
        WHEN OLD.id != (SELECT current_user_id FROM rls_context WHERE id = 1)
        AND (SELECT is_admin FROM users WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)) != 1
        THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
    END;
END;
```

## Verificare la Correzione

Esegui il test per verificare che la correzione funzioni:

```bash
cd planner-activity3/back-end
python test_admin_password_update.py
```

Il test dovrebbe mostrare:
```
✅ TEST SUPERATO!

🎉 Gli admin possono ora modificare le password degli utenti
```

## File Modificati

1. **fix_admin_rls.py** - Script per applicare la correzione
2. **fix_admin_rls.bat** - Script batch per Windows
3. **test_admin_password_update.py** - Test per verificare la correzione
4. **rls_setup.py** - Aggiornato per future configurazioni
5. **FIX_ADMIN_PASSWORD_UPDATE.md** - Questa documentazione

## Note Importanti

- ✅ **Non è necessario riavviare il server** - Le modifiche ai trigger sono immediate
- ✅ **Sicurezza mantenuta** - Gli utenti normali possono ancora modificare solo se stessi
- ✅ **Isolamento RLS attivo** - L'isolamento dei dati per le attività funziona ancora correttamente
- ✅ **Future installazioni** - `rls_setup.py` è stato aggiornato per usare il trigger corretto

## Data Correzione
14 Ottobre 2025, 19:35 UTC

