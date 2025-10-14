#!/usr/bin/env python3
"""
Script per aggiornare il database con le nuove tabelle di autenticazione
"""

import os
import sys
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app_factory import create_app, db
from models import Activity, User

def update_database():
    """Aggiorna il database con le nuove tabelle"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Aggiornamento database in corso...")
        
        try:
            # Crea tutte le tabelle (incluse le nuove)
            db.create_all()
            print("✅ Tabelle create/aggiornate con successo")
            
            # Verifica che le tabelle esistano
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"📋 Tabelle presenti nel database: {', '.join(tables)}")
            
            # Conta le attività esistenti
            activity_count = Activity.query.count()
            print(f"📊 Attività esistenti: {activity_count}")
            
            # Conta gli utenti esistenti
            user_count = User.query.count()
            print(f"👥 Utenti esistenti: {user_count}")
            
            # Se ci sono attività senza user_id, assegna un utente di default
            if activity_count > 0:
                activities_without_user = Activity.query.filter(Activity.user_id.is_(None)).count()
                if activities_without_user > 0:
                    print(f"⚠️  Trovate {activities_without_user} attività senza user_id")
                    print("💡 Creazione utente di default...")
                    
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
                    
                    # Assegna tutte le attività senza user_id all'utente di default
                    Activity.query.filter(Activity.user_id.is_(None)).update({
                        'user_id': default_user.id
                    })
                    db.session.commit()
                    print(f"✅ {activities_without_user} attività assegnate all'utente di default")
            
            print("🎉 Aggiornamento database completato con successo!")
            
        except Exception as e:
            print(f"❌ Errore durante l'aggiornamento: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 AGGIORNAMENTO DATABASE - SISTEMA DI AUTENTICAZIONE")
    print("=" * 60)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = update_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ AGGIORNAMENTO COMPLETATO CON SUCCESSO!")
        print()
        print("📝 PROSSIMI PASSI:")
        print("1. Avvia il backend: python run.py")
        print("2. Avvia il frontend: npm start")
        print("3. Registra un nuovo utente o usa:")
        print("   - Username: default")
        print("   - Password: password123")
    else:
        print("❌ AGGIORNAMENTO FALLITO!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 60)
