#!/usr/bin/env python3
"""
Script per testare che gli admin possano modificare le password degli utenti
"""

import sqlite3
import os
from datetime import datetime

def test_admin_password_update():
    """Testa che gli admin possano modificare le password degli utenti"""
    print("🧪 Test modifica password admin in corso...")
    
    try:
        # Percorso del database
        db_path = os.path.join('instance', 'planner_activities_dev.db')
        
        if not os.path.exists(db_path):
            print(f"❌ Database non trovato: {db_path}")
            return False
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Trova l'ID dell'admin
        cursor.execute("SELECT id, username, is_admin FROM users WHERE is_admin = 1 LIMIT 1")
        admin = cursor.fetchone()
        
        if not admin:
            print("❌ Nessun utente admin trovato nel database")
            conn.close()
            return False
        
        admin_id, admin_username, is_admin = admin
        print(f"✅ Admin trovato: {admin_username} (ID: {admin_id})")
        
        # Trova un utente normale da testare
        cursor.execute("SELECT id, username FROM users WHERE is_admin = 0 LIMIT 1")
        user = cursor.fetchone()
        
        if not user:
            print("⚠️  Nessun utente normale trovato per il test")
            print("   Creo un utente di test...")
            
            # Crea un utente di test
            test_password_hash = "pbkdf2:sha256:600000$test$hash"
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, is_admin, is_active)
                VALUES (?, ?, ?, 0, 1)
            """, ("testuser", "test@example.com", test_password_hash))
            conn.commit()
            
            user_id = cursor.lastrowid
            user_username = "testuser"
            print(f"✅ Utente di test creato: {user_username} (ID: {user_id})")
        else:
            user_id, user_username = user
            print(f"✅ Utente normale trovato: {user_username} (ID: {user_id})")
        
        # Imposta il contesto RLS per l'admin
        print(f"🔐 Impostazione contesto RLS per admin (ID: {admin_id})...")
        cursor.execute("""
            UPDATE rls_context 
            SET current_user_id = ?, session_id = ?
            WHERE id = 1
        """, (admin_id, f"test_session_{admin_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"))
        conn.commit()
        
        # Tenta di aggiornare la password dell'utente normale
        print(f"🔄 Tentativo di aggiornamento password per {user_username}...")
        new_password_hash = f"pbkdf2:sha256:600000$test${datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        cursor.execute("""
            UPDATE users 
            SET password_hash = ?, updated_at = ?
            WHERE id = ?
        """, (new_password_hash, datetime.utcnow(), user_id))
        
        conn.commit()
        
        # Verifica che l'aggiornamento sia andato a buon fine
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        result = cursor.fetchone()
        
        if result and result[0] == new_password_hash:
            print("✅ Test superato! L'admin può modificare le password degli utenti")
            success = True
        else:
            print("❌ Test fallito! La password non è stata aggiornata")
            success = False
        
        conn.close()
        return success
        
    except Exception as e:
        print(f"❌ Errore durante il test: {e}")
        return False

if __name__ == '__main__':
    print("=" * 70)
    print("🧪 TEST MODIFICA PASSWORD ADMIN")
    print("=" * 70)
    print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = test_admin_password_update()
    
    print()
    print("=" * 70)
    if success:
        print("✅ TEST SUPERATO!")
        print()
        print("🎉 Gli admin possono ora modificare le password degli utenti")
    else:
        print("❌ TEST FALLITO!")
        print()
        print("Potrebbero essere necessarie ulteriori correzioni.")
    print("=" * 70)


