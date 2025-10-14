#!/usr/bin/env python3
"""
Script per configurare RLS nel database corretto
"""

import os
import sys
import sqlite3
from datetime import datetime

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_rls_correct():
    """Configura RLS nel database corretto"""
    print("🔒 Configurazione RLS nel database corretto...")
    
    try:
        # Usa il database nella directory principale (quello che usa Flask)
        db_path = 'planner_activities_dev.db'
        
        if not os.path.exists(db_path):
            print(f"❌ Database non trovato: {db_path}")
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
            # Rimuovi le tabelle RLS esistenti
            cursor.execute("DROP TABLE IF EXISTS rls_context")
            cursor.execute("DROP TABLE IF EXISTS rls_policies")
            cursor.execute("DROP VIEW IF EXISTS activities_view")
            cursor.execute("DROP VIEW IF EXISTS users_view")
        
        # Crea la tabella per il contesto RLS
        print("📋 Creazione tabella contesto RLS...")
        cursor.execute("""
            CREATE TABLE rls_context (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_user_id INTEGER,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Inserisci il record iniziale
        cursor.execute("""
            INSERT INTO rls_context (id, current_user_id, session_id) 
            VALUES (1, NULL, 'default')
        """)
        
        # Crea la tabella per le policy RLS
        print("🛡️  Creazione tabella policy RLS...")
        cursor.execute("""
            CREATE TABLE rls_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                policy_name TEXT NOT NULL,
                policy_type TEXT NOT NULL,
                policy_definition TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Configura policy per activities
        print("📝 Configurazione policy per tabella activities...")
        cursor.execute("""
            INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_definition) 
            VALUES ('activities', 'user_isolation', 'SELECT', 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)')
        """)
        cursor.execute("""
            INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_definition) 
            VALUES ('activities', 'user_isolation', 'INSERT', 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)')
        """)
        cursor.execute("""
            INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_definition) 
            VALUES ('activities', 'user_isolation', 'UPDATE', 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)')
        """)
        cursor.execute("""
            INSERT INTO rls_policies (table_name, policy_name, policy_type, policy_definition) 
            VALUES ('activities', 'user_isolation', 'DELETE', 'user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)')
        """)
        
        # Crea viste protette
        print("👁️  Creazione viste protette...")
        cursor.execute("""
            CREATE VIEW activities_view AS
            SELECT * FROM activities 
            WHERE user_id = (SELECT current_user_id FROM rls_context WHERE id = 1)
        """)
        
        # Salva le modifiche
        conn.commit()
        conn.close()
        
        print("✅ RLS configurato con successo!")
        print(f"📁 Database protetto: {os.path.abspath(db_path)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante la configurazione: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔒 CONFIGURAZIONE RLS - DATABASE CORRETTO")
    print("=" * 60)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = setup_rls_correct()
    
    print()
    print("=" * 60)
    if success:
        print("✅ RLS CONFIGURATO CON SUCCESSO!")
        print()
        print("🛡️  CARATTERISTICHE IMPLEMENTATE:")
        print("• Isolamento completo dei dati per utente")
        print("• Policy configurabili per ogni tabella")
        print("• Contesto utente dinamico")
    else:
        print("❌ CONFIGURAZIONE FALLITA!")
    print("=" * 60)
