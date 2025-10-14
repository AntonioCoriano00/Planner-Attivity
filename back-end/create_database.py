#!/usr/bin/env python3
"""
Script per creare il database da zero con il sistema di autenticazione
"""

import os
import sys
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app_factory import create_app, db
from models import Activity, User

def create_database():
    """Crea il database da zero"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Creazione database in corso...")
        
        try:
            # Rimuovi il database esistente se presente
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            if os.path.exists(db_path):
                print(f"🗑️  Rimozione database esistente: {db_path}")
                os.remove(db_path)
            
            # Crea tutte le tabelle
            db.create_all()
            print("✅ Tabelle create con successo")
            
            # Crea un utente di default
            print("👤 Creazione utente di default...")
            default_user = User(
                username='default',
                email='default@example.com'
            )
            default_user.set_password('password123')
            db.session.add(default_user)
            db.session.commit()
            print("✅ Utente di default creato (username: default, password: password123)")
            
            # Verifica finale
            activity_count = Activity.query.count()
            user_count = User.query.count()
            print(f"📊 Attività totali: {activity_count}")
            print(f"👥 Utenti totali: {user_count}")
            
            print("🎉 Database creato con successo!")
            return True
            
        except Exception as e:
            print(f"❌ Errore durante la creazione: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 CREAZIONE DATABASE - SISTEMA DI AUTENTICAZIONE")
    print("=" * 60)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = create_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ CREAZIONE COMPLETATA CON SUCCESSO!")
        print()
        print("📝 PROSSIMI PASSI:")
        print("1. Avvia il backend: python run.py")
        print("2. Avvia il frontend: npm start")
        print("3. Registra un nuovo utente o usa:")
        print("   - Username: default")
        print("   - Password: password123")
    else:
        print("❌ CREAZIONE FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 60)
