#!/usr/bin/env python3
"""
Script per aggiornare il database con i nuovi campi per attività multi-giorno e multi-ora
"""

import sqlite3
import os
from datetime import datetime

def update_database():
    """Aggiorna il database aggiungendo i nuovi campi"""
    
    db_path = os.path.join('instance', 'planner_activities_dev.db')
    
    if not os.path.exists(db_path):
        print("❌ Database non trovato! Assicurati che il database esista.")
        return False
    
    try:
        # Backup del database
        backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup creato: {backup_path}")
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verifica se i campi esistono già
        cursor.execute("PRAGMA table_info(activities)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ('end_date', 'DATE'),
            ('end_time', 'TIME'),
            ('is_multi_day', 'BOOLEAN DEFAULT 0'),
            ('is_multi_hour', 'BOOLEAN DEFAULT 0')
        ]
        
        added_columns = []
        for column_name, column_type in new_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE activities ADD COLUMN {column_name} {column_type}")
                    added_columns.append(column_name)
                    print(f"✅ Aggiunto campo: {column_name}")
                except sqlite3.Error as e:
                    print(f"❌ Errore aggiungendo {column_name}: {e}")
            else:
                print(f"ℹ️  Campo {column_name} già esistente")
        
        # Commit delle modifiche
        conn.commit()
        
        # Verifica finale
        cursor.execute("PRAGMA table_info(activities)")
        final_columns = [column[1] for column in cursor.fetchall()]
        
        print(f"\n📊 Struttura finale della tabella:")
        for column in final_columns:
            print(f"  - {column}")
        
        conn.close()
        
        if added_columns:
            print(f"\n🎉 Database aggiornato con successo!")
            print(f"📝 Campi aggiunti: {', '.join(added_columns)}")
        else:
            print(f"\n✅ Database già aggiornato - nessuna modifica necessaria")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante l'aggiornamento: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Aggiornamento database per attività multi-giorno/multi-ora...")
    print("=" * 60)
    
    success = update_database()
    
    if success:
        print("\n✅ Aggiornamento completato!")
        print("🚀 Ora puoi avviare il server con: python run.py")
    else:
        print("\n❌ Aggiornamento fallito!")
        print("🔧 Controlla i messaggi di errore sopra")
