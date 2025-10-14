# Nuove Funzionalità - Attività Multi-Giorno e Multi-Ora

## 🎯 Panoramica

Sono state aggiunte nuove funzionalità al Planner Attività per supportare:
- **Attività Multi-Giorno**: Attività che si estendono su più giorni
- **Attività Multi-Ora**: Attività che durano più ore nello stesso giorno

## 📊 Modifiche al Database

### Nuovi Campi Aggiunti

La tabella `activities` è stata estesa con i seguenti campi:

```sql
-- Nuovi campi per supportare attività multi-giorno e multi-ora
end_date DATE,           -- Data di fine per attività multi-giorno
end_time TIME,           -- Ora di fine per attività multi-ora
is_multi_day BOOLEAN,    -- Flag per attività multi-giorno (default: 0)
is_multi_hour BOOLEAN    -- Flag per attività multi-ora (default: 0)
```

### Aggiornamento Database

Per aggiornare il database esistente, esegui:
```bash
# Opzione 1: Script Python
python update_db.py

# Opzione 2: File batch
update_database.bat
```

## 🔧 Modifiche Backend

### Modello Activity (`models.py`)

- Aggiunti nuovi campi al modello
- Aggiornati i metodi `to_dict()`, `from_dict()`, e `update_from_dict()`
- Supporto per serializzazione/deserializzazione dei nuovi campi

### API Routes (`routes.py`)

- **Validazione date**: La data di fine non può essere precedente alla data di inizio
- **Validazione ore**: L'ora di fine deve essere successiva all'ora di inizio (stesso giorno)
- **Gestione errori**: Messaggi di errore specifici per validazioni fallite

### Endpoint API

Tutti gli endpoint esistenti supportano automaticamente i nuovi campi:

```json
{
  "title": "Vacanza Multi-Giorno",
  "description": "Vacanza di 3 giorni",
  "date": "2024-01-15",
  "time": "09:00",
  "endDate": "2024-01-17",
  "endTime": "18:00",
  "isMultiDay": true,
  "isMultiHour": true,
  "status": "da-fare",
  "priority": "alta",
  "category": "Vacanza"
}
```

## 🎨 Modifiche Frontend

### Form di Creazione/Modifica (`ActivityForm.js`)

- **Checkbox "Attività multi-giorno"**: Abilita/disabilita il campo data di fine
- **Checkbox "Attività multi-ora"**: Abilita/disabilita il campo ora di fine
- **Campi condizionali**: I campi di fine appaiono solo quando le checkbox sono selezionate
- **Validazione client-side**: Min/max date per prevenire errori

### Stili CSS (`ActivityForm.css`)

- Stili per checkbox personalizzati
- Layout responsive per i nuovi campi
- Indicatori visivi per le attività multi-giorno/multi-ora

## 🧪 Test

### Script di Test

Sono stati creati script di test specifici:

```bash
# Test generale API
python test_api.py

# Test nuove funzionalità
python test_multi_activity.py

# File batch per Windows
test_multi.bat
```

### Casi di Test

1. **Creazione attività multi-giorno**
2. **Creazione attività multi-ora**
3. **Creazione attività normale**
4. **Validazione errori** (date/ore non valide)
5. **Recupero e visualizzazione** delle attività

## 📱 Utilizzo

### Creazione di un'Attività Multi-Giorno

1. Apri il form di creazione attività
2. Compila titolo, descrizione, data e ora di inizio
3. ✅ Spunta "Attività multi-giorno"
4. Seleziona la data di fine
5. ✅ Spunta "Attività multi-ora" (opzionale)
6. Seleziona l'ora di fine (opzionale)
7. Salva l'attività

### Creazione di un'Attività Multi-Ora

1. Apri il form di creazione attività
2. Compila titolo, descrizione, data e ora di inizio
3. ✅ Spunta "Attività multi-ora"
4. Seleziona l'ora di fine
5. Salva l'attività

## ⚠️ Note Importanti

### Validazioni

- **Data di fine**: Deve essere successiva o uguale alla data di inizio
- **Ora di fine**: Deve essere successiva all'ora di inizio (stesso giorno)
- **Campi obbligatori**: Titolo e data di inizio rimangono obbligatori

### Compatibilità

- **Retrocompatibilità**: Le attività esistenti continuano a funzionare
- **Valori di default**: I nuovi campi hanno valori di default appropriati
- **API**: Tutti gli endpoint esistenti rimangono invariati

## 🚀 Avvio

1. **Aggiorna il database**:
   ```bash
   python update_db.py
   ```

2. **Avvia il server**:
   ```bash
   python run.py
   ```

3. **Avvia il frontend**:
   ```bash
   cd ../planner-activity
   npm start
   ```

4. **Testa le funzionalità**:
   ```bash
   python test_multi_activity.py
   ```

## 📞 Supporto

Per problemi o domande:
1. Controlla i log del server
2. Verifica che il database sia aggiornato
3. Esegui i test per verificare il funzionamento
4. Controlla la console del browser per errori JavaScript

---

**Versione**: 1.1.0  
**Data**: Gennaio 2024  
**Autore**: Sistema di gestione attività
