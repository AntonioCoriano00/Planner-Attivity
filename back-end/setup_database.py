#!/usr/bin/env python3
"""
Script per configurare il database con il sistema di autenticazione
"""

import os
import sys
import sqlite3
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_database():
    """Configura il database da zero"""
    print("🔄 Configurazione database in corso...")
    
    try:
        # Percorso del database
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        
        # Rimuovi il database esistente se presente
        if os.path.exists(db_path):
            print(f"🗑️  Rimozione database esistente: {db_path}")
            os.remove(db_path)
        
        # Crea la directory instance se non esiste
        os.makedirs('instance', exist_ok=True)
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Crea la tabella users
        print("👤 Creazione tabella users...")
        cursor.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(80) NOT NULL UNIQUE,
                email VARCHAR(120) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME,
                updated_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                is_admin BOOLEAN DEFAULT 0
            )
        """)
        
        # Crea la tabella activities
        print("📋 Creazione tabella activities...")
        cursor.execute("""
            CREATE TABLE activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                time TIME,
                end_date DATE,
                end_time TIME,
                is_multi_day BOOLEAN DEFAULT 0,
                is_multi_hour BOOLEAN DEFAULT 0,
                status VARCHAR(20) DEFAULT 'da-fare',
                priority VARCHAR(20) DEFAULT 'media',
                category VARCHAR(100),
                user_id INTEGER NOT NULL,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Crea gli indici
        print("🔍 Creazione indici...")
        cursor.execute("CREATE INDEX ix_users_username ON users (username)")
        cursor.execute("CREATE INDEX ix_users_email ON users (email)")
        cursor.execute("CREATE INDEX ix_users_created_at ON users (created_at)")
        cursor.execute("CREATE INDEX ix_users_is_active ON users (is_active)")
        cursor.execute("CREATE INDEX ix_users_is_admin ON users (is_admin)")
        cursor.execute("CREATE INDEX ix_activities_title ON activities (title)")
        cursor.execute("CREATE INDEX ix_activities_date ON activities (date)")
        cursor.execute("CREATE INDEX ix_activities_time ON activities (time)")
        cursor.execute("CREATE INDEX ix_activities_end_date ON activities (end_date)")
        cursor.execute("CREATE INDEX ix_activities_end_time ON activities (end_time)")
        cursor.execute("CREATE INDEX ix_activities_is_multi_day ON activities (is_multi_day)")
        cursor.execute("CREATE INDEX ix_activities_is_multi_hour ON activities (is_multi_hour)")
        cursor.execute("CREATE INDEX ix_activities_status ON activities (status)")
        cursor.execute("CREATE INDEX ix_activities_priority ON activities (priority)")
        cursor.execute("CREATE INDEX ix_activities_category ON activities (category)")
        cursor.execute("CREATE INDEX ix_activities_user_id ON activities (user_id)")
        cursor.execute("CREATE INDEX ix_activities_created_at ON activities (created_at)")
        cursor.execute("CREATE INDEX ix_activities_updated_at ON activities (updated_at)")
        
        # Crea l'account admin
        print("👑 Creazione account admin...")
        from werkzeug.security import generate_password_hash
        admin_password_hash = generate_password_hash('admin123')
        now = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at, updated_at, is_active, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('admin', 'admin@planner.com', admin_password_hash, now, now, 1, 1))
        
        # Crea un utente di default
        print("👤 Creazione utente di default...")
        default_password_hash = generate_password_hash('password123')
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at, updated_at, is_active, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('default', 'default@example.com', default_password_hash, now, now, 1, 0))
        
        # Salva le modifiche
        conn.commit()
        conn.close()
        
        print("✅ Database configurato con successo!")
        print(f"📁 Percorso database: {os.path.abspath(db_path)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante la configurazione: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 CONFIGURAZIONE DATABASE - SISTEMA DI AUTENTICAZIONE")
    print("=" * 60)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = setup_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ CONFIGURAZIONE COMPLETATA CON SUCCESSO!")
        print()
        print("📝 PROSSIMI PASSI:")
        print("1. Avvia il backend: python run.py")
        print("2. Avvia il frontend: npm start")
        print("3. Accedi con l'account admin:")
        print("   - Username: admin")
        print("   - Password: admin123")
        print("4. Oppure usa l'utente di default:")
        print("   - Username: default")
        print("   - Password: password123")
    else:
        print("❌ CONFIGURAZIONE FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 60)
