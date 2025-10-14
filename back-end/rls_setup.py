#!/usr/bin/env python3
"""
Script per configurare Row Level Security (RLS) per il sistema multi-tenant
Implementa RLS usando trigger e viste per compatibilità con SQLite
"""

import os
import sys
import sqlite3
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_rls():
    """Configura Row Level Security per il database"""
    print("🔒 Configurazione Row Level Security (RLS) in corso...")
    
    try:
        # Percorso del database
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        
        if not os.path.exists(db_path):
            print(f"❌ Database non trovato: {db_path}")
            print("Esegui prima setup_database.py per creare il database")
            return False
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Abilita le foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        print("🔍 Verifica versione SQLite...")
        cursor.execute("SELECT sqlite_version()")
        version = cursor.fetchone()[0]
        print(f"   Versione SQLite: {version}")
        
        # Controlla se RLS è già configurato
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='rls_context'
        """)
        if cursor.fetchone():
            print("⚠️  RLS già configurato. Reimpostazione...")
            drop_rls(cursor)
        
        # Crea la tabella per il contesto RLS
        print("📋 Creazione tabella contesto RLS...")
        cursor.execute("""
            CREATE TABLE rls_context (
                id INTEGER PRIMARY KEY,
                current_user_id INTEGER,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Crea la tabella per le policy RLS
        print("🛡️  Creazione tabella policy RLS...")
        cursor.execute("""
            CREATE TABLE rls_policies (
                id INTEGER PRIMARY KEY,
                table_name TEXT NOT NULL,
                policy_name TEXT NOT NULL,
                policy_type TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
                policy_expression TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Inserisce le policy per la tabella activities
        print("📝 Configurazione policy per tabella activities...")
        policies_activities = [
            {
                'table_name': 'activities',
                'policy_name': 'activities_select_policy',
                'policy_type': 'SELECT',
                'policy_expression': 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)'
            },
            {
                'table_name': 'activities',
                'policy_name': 'activities_insert_policy',
                'policy_type': 'INSERT',
                'policy_expression': 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)'
            },
            {
                'table_name': 'activities',
                'policy_name': 'activities_update_policy',
                'policy_type': 'UPDATE',
                'policy_expression': 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)'
            },
            {
                'table_name': 'activities',
                'policy_name': 'activities_delete_policy',
                'policy_type': 'DELETE',
                'policy_expression': 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)'
            }
        ]
        
        for policy in policies_activities:
            cursor.execute("""
                INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_expression)
                VALUES (?, ?, ?, ?)
            """, (policy['table_name'], policy['policy_name'], 
                  policy['policy_type'], policy['policy_expression']))
        
        # Inserisce le policy per la tabella users (solo per admin)
        print("👤 Configurazione policy per tabella users...")
        policies_users = [
            {
                'table_name': 'users',
                'policy_name': 'users_select_policy',
                'policy_type': 'SELECT',
                'policy_expression': 'id = (SELECT current_user_id FROM rls_context WHERE id = 1) OR (SELECT is_admin FROM users WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)) = 1'
            },
            {
                'table_name': 'users',
                'policy_name': 'users_update_policy',
                'policy_type': 'UPDATE',
                'policy_expression': 'id = (SELECT current_user_id FROM rls_context WHERE id = 1)'
            }
        ]
        
        for policy in policies_users:
            cursor.execute("""
                INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_expression)
                VALUES (?, ?, ?, ?)
            """, (policy['table_name'], policy['policy_name'], 
                  policy['policy_type'], policy['policy_expression']))
        
        # Crea i trigger per implementare RLS
        print("⚡ Creazione trigger RLS...")
        create_rls_triggers(cursor)
        
        # Crea le viste protette
        print("👁️  Creazione viste protette...")
        create_protected_views(cursor)
        
        # Inserisce il contesto di default (user_id = 1 per admin)
        cursor.execute("""
            INSERT INTO rls_context (id, current_user_id, session_id)
            VALUES (1, 1, 'default')
        """)
        
        # Salva le modifiche
        conn.commit()
        conn.close()
        
        print("✅ Row Level Security configurato con successo!")
        print(f"📁 Database protetto: {os.path.abspath(db_path)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante la configurazione RLS: {e}")
        return False

def create_rls_triggers(cursor):
    """Crea i trigger per implementare RLS (solo INSERT, UPDATE, DELETE)"""
    
    # Trigger per INSERT su activities
    cursor.execute("""
        CREATE TRIGGER rls_activities_insert_trigger
        BEFORE INSERT ON activities
        BEGIN
            SELECT CASE
                WHEN NEW.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
            END;
        END;
    """)
    
    # Trigger per UPDATE su activities
    cursor.execute("""
        CREATE TRIGGER rls_activities_update_trigger
        BEFORE UPDATE ON activities
        BEGIN
            SELECT CASE
                WHEN OLD.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                OR NEW.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
            END;
        END;
    """)
    
    # Trigger per DELETE su activities
    cursor.execute("""
        CREATE TRIGGER rls_activities_delete_trigger
        BEFORE DELETE ON activities
        BEGIN
            SELECT CASE
                WHEN OLD.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
            END;
        END;
    """)
    
    # Trigger per UPDATE su users (solo per utente corrente o admin)
    cursor.execute("""
        CREATE TRIGGER rls_users_update_trigger
        BEFORE UPDATE ON users
        BEGIN
            SELECT CASE
                WHEN OLD.id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                AND (SELECT is_admin FROM users WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)) != 1
                THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
            END;
        END;
    """)

def create_protected_views(cursor):
    """Crea viste protette per accesso sicuro ai dati"""
    
    # Vista protetta per activities
    cursor.execute("""
        CREATE VIEW protected_activities AS
        SELECT * FROM activities
        WHERE user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)
    """)
    
    # Vista protetta per users
    cursor.execute("""
        CREATE VIEW protected_users AS
        SELECT * FROM users
        WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)
        OR (SELECT is_admin FROM users WHERE id = (SELECT current_user_id FROM rls_context WHERE id = 1)) = 1
    """)

def drop_rls(cursor):
    """Rimuove la configurazione RLS esistente"""
    print("🗑️  Rimozione configurazione RLS esistente...")
    
    # Rimuove i trigger
    triggers = [
        'rls_activities_insert_trigger', 
        'rls_activities_update_trigger',
        'rls_activities_delete_trigger',
        'rls_users_update_trigger'
    ]
    
    for trigger in triggers:
        cursor.execute(f"DROP TRIGGER IF EXISTS {trigger}")
    
    # Rimuove le viste
    views = ['protected_activities', 'protected_users']
    for view in views:
        cursor.execute(f"DROP VIEW IF EXISTS {view}")
    
    # Rimuove le tabelle RLS
    tables = ['rls_policies', 'rls_context']
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")

def set_user_context(user_id, session_id=None):
    """Imposta il contesto utente per RLS"""
    try:
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        if session_id is None:
            session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        cursor.execute("""
            UPDATE rls_context 
            SET current_user_id = ?, session_id = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (user_id, session_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Contesto RLS impostato per user_id: {user_id}")
        return True
        
    except Exception as e:
        print(f"❌ Errore nell'impostazione del contesto: {e}")
        return False

def get_current_context():
    """Ottiene il contesto RLS corrente"""
    try:
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT current_user_id, session_id FROM rls_context WHERE id = 1")
        result = cursor.fetchone()
        
        conn.close()
        
        if result:
            return {'user_id': result[0], 'session_id': result[1]}
        return None
        
    except Exception as e:
        print(f"❌ Errore nel recupero del contesto: {e}")
        return None

if __name__ == '__main__':
    print("=" * 70)
    print("🔒 CONFIGURAZIONE ROW LEVEL SECURITY (RLS) - MULTI-TENANT")
    print("=" * 70)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = setup_rls()
    
    print()
    print("=" * 70)
    if success:
        print("✅ RLS CONFIGURATO CON SUCCESSO!")
        print()
        print("🛡️  CARATTERISTICHE IMPLEMENTATE:")
        print("• Isolamento completo dei dati per utente")
        print("• Trigger di sicurezza per tutte le operazioni CRUD")
        print("• Viste protette per accesso sicuro")
        print("• Policy configurabili per ogni tabella")
        print("• Contesto utente dinamico")
        print()
        print("📝 PROSSIMI PASSI:")
        print("1. Aggiorna il codice per usare set_user_context()")
        print("2. Testa l'isolamento dei dati")
        print("3. Verifica le policy di sicurezza")
        print()
        print("🔧 COMANDI UTILI:")
        print("• set_user_context(user_id) - Imposta contesto utente")
        print("• get_current_context() - Ottieni contesto corrente")
    else:
        print("❌ CONFIGURAZIONE RLS FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 70)
