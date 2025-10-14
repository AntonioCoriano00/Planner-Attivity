#!/usr/bin/env python3
"""
Script per migrare il database esistente aggiungendo la colonna user_id
"""

import os
import sys
import sqlite3
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app_factory import create_app, db
from models import Activity, User

def migrate_database():
    """Migra il database esistente"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Migrazione database in corso...")
        
        try:
            # Connessione diretta al database SQLite
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Verifica se la colonna user_id esiste già
            cursor.execute("PRAGMA table_info(activities)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'user_id' not in columns:
                print("📝 Aggiunta colonna user_id alla tabella activities...")
                cursor.execute("ALTER TABLE activities ADD COLUMN user_id INTEGER")
                print("✅ Colonna user_id aggiunta")
            else:
                print("✅ Colonna user_id già presente")
            
            # Crea la tabella users se non esiste
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(80) NOT NULL UNIQUE,
                    email VARCHAR(120) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at DATETIME,
                    updated_at DATETIME,
                    is_active BOOLEAN DEFAULT 1
                )
            """)
            print("✅ Tabella users creata/verificata")
            
            # Crea gli indici
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_username ON users (username)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_created_at ON users (created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_is_active ON users (is_active)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_activities_user_id ON activities (user_id)")
            print("✅ Indici creati/verificati")
            
            conn.commit()
            conn.close()
            
            # Ora usa SQLAlchemy per le operazioni
            print("👤 Creazione utente di default...")
            
            # Crea un utente di default se non esiste
            default_user = User.query.filter_by(username='default').first()
            if not default_user:
                default_user = User(
                    username='default',
                    email='default@example.com'
                )
                default_user.set_password('password123')
                db.session.add(default_user)
                db.session.commit()
                print("✅ Utente di default creato (username: default, password: password123)")
            else:
                print("✅ Utente di default già esistente")
            
            # Assegna tutte le attività senza user_id all'utente di default
            activities_without_user = Activity.query.filter(Activity.user_id.is_(None)).count()
            if activities_without_user > 0:
                print(f"📋 Assegnazione {activities_without_user} attività all'utente di default...")
                Activity.query.filter(Activity.user_id.is_(None)).update({
                    'user_id': default_user.id
                })
                db.session.commit()
                print(f"✅ {activities_without_user} attività assegnate all'utente di default")
            else:
                print("✅ Tutte le attività hanno già un utente assegnato")
            
            # Verifica finale
            activity_count = Activity.query.count()
            user_count = User.query.count()
            print(f"📊 Attività totali: {activity_count}")
            print(f"👥 Utenti totali: {user_count}")
            
            print("🎉 Migrazione completata con successo!")
            return True
            
        except Exception as e:
            print(f"❌ Errore durante la migrazione: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 MIGRAZIONE DATABASE - SISTEMA DI AUTENTICAZIONE")
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
        print("3. Registra un nuovo utente o usa:")
        print("   - Username: default")
        print("   - Password: password123")
    else:
        print("❌ MIGRAZIONE FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 60)
