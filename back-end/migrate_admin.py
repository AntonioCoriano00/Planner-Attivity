#!/usr/bin/env python3
"""
Script per migrare il database esistente e aggiungere il supporto admin
"""

import os
import sys
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def migrate_database():
    """Migra il database esistente per aggiungere il supporto admin"""
    print("🔄 Migrazione database in corso...")
    
    try:
        # Percorso del database
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        
        if not os.path.exists(db_path):
            print("❌ Database non trovato. Esegui prima setup_database.py")
            return False
        
        # Backup del database
        backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        print(f"💾 Creazione backup: {backup_path}")
        
        import shutil
        shutil.copy2(db_path, backup_path)
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Controlla se la colonna is_admin esiste già
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' not in columns:
            print("➕ Aggiunta colonna is_admin alla tabella users...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            
            # Crea l'indice per is_admin
            print("🔍 Creazione indice per is_admin...")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_is_admin ON users (is_admin)")
        else:
            print("✅ Colonna is_admin già presente")
        
        # Controlla se l'admin esiste già
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        admin_exists = cursor.fetchone()[0] > 0
        
        if not admin_exists:
            print("👑 Creazione account admin...")
            admin_password_hash = generate_password_hash('admin123')
            now = datetime.utcnow().isoformat()
            
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, created_at, updated_at, is_active, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ('admin', 'admin@planner.com', admin_password_hash, now, now, 1, 1))
        else:
            print("✅ Account admin già esistente")
            # Assicurati che l'admin abbia i privilegi corretti
            cursor.execute("UPDATE users SET is_admin = 1 WHERE username = 'admin'")
        
        # Salva le modifiche
        conn.commit()
        conn.close()
        
        print("✅ Migrazione completata con successo!")
        print(f"📁 Percorso database: {os.path.abspath(db_path)}")
        print(f"💾 Backup salvato in: {os.path.abspath(backup_path)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante la migrazione: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 MIGRAZIONE DATABASE - SUPPORTO ADMIN")
    print("=" * 60)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = migrate_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ MIGRAZIONE COMPLETATA CON SUCCESSO!")
        print()
        print("📝 PROSSIMI PASSI:")
        print("1. Avvia il backend: python run.py")
        print("2. Avvia il frontend: npm start")
        print("3. Accedi con l'account admin:")
        print("   - Username: admin")
        print("   - Password: admin123")
        print("4. La dashboard admin ti permetterà di gestire tutti gli utenti")
    else:
        print("❌ MIGRAZIONE FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 60)
