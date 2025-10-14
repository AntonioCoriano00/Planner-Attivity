#!/usr/bin/env python3
"""
Script per correggere il trigger RLS e permettere agli admin di modificare gli utenti
"""

import sqlite3
import os
from datetime import datetime

def fix_admin_rls():
    """Corregge il trigger RLS per permettere agli admin di modificare gli utenti"""
    print("🔧 Correzione trigger RLS per admin in corso...")
    
    try:
        # Percorso del database
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        
        if not os.path.exists(db_path):
            print(f"❌ Database non trovato: {db_path}")
            return False
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Rimuove il vecchio trigger
        print("🗑️  Rimozione trigger RLS vecchio...")
        cursor.execute("DROP TRIGGER IF EXISTS rls_users_update_trigger")
        
        # Crea il nuovo trigger che permette agli admin di modificare qualsiasi utente
        print("⚡ Creazione nuovo trigger RLS con supporto admin...")
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
        
        # Salva le modifiche
        conn.commit()
        conn.close()
        
        print("✅ Trigger RLS aggiornato con successo!")
        print("   Gli admin possono ora modificare qualsiasi utente")
        
        return True
        
    except Exception as e:
        print(f"❌ Errore durante la correzione RLS: {e}")
        return False

if __name__ == '__main__':
    print("=" * 70)
    print("🔧 CORREZIONE TRIGGER RLS PER ADMIN")
    print("=" * 70)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = fix_admin_rls()
    
    print()
    print("=" * 70)
    if success:
        print("✅ CORREZIONE COMPLETATA CON SUCCESSO!")
        print()
        print("🛡️  MODIFICHE APPLICATE:")
        print("• Gli admin possono ora modificare qualsiasi utente")
        print("• Gli utenti normali possono modificare solo se stessi")
        print("• L'isolamento dei dati rimane attivo per le attività")
    else:
        print("❌ CORREZIONE FALLITA!")
        print("Controlla i log per i dettagli dell'errore.")
    print("=" * 70)

