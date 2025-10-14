#!/usr/bin/env python3
"""
Manager per Row Level Security (RLS) - Gestione del contesto utente
"""

import sqlite3
import os
from datetime import datetime
from functools import wraps
from flask import request, jsonify, current_app, g
from sqlalchemy import text

class RLSManager:
    """Manager per la gestione del Row Level Security"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Inizializza RLS con l'app Flask"""
        self.app = app
        
        # Registra le funzioni di contesto
        @app.before_request
        def set_rls_context():
            """Imposta il contesto RLS prima di ogni richiesta"""
            # Il contesto viene impostato dal decorator @rls_required
            pass
    
    def set_user_context(self, user_id, session_id=None):
        """Imposta il contesto utente per RLS"""
        try:
            if session_id is None:
                session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Usa la connessione del database corrente
            from app_factory import db
            with db.engine.connect() as conn:
                conn.execute(text(
                    "UPDATE rls_context SET current_user_id = :user_id, session_id = :session_id, created_at = CURRENT_TIMESTAMP WHERE id = 1"
                ), {"user_id": user_id, "session_id": session_id})
                conn.commit()
            
            # Salva nel contesto Flask per questa richiesta
            g.rls_user_id = user_id
            g.rls_session_id = session_id
            
            current_app.logger.info(f"RLS Context set for user_id: {user_id}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Errore nell'impostazione del contesto RLS: {e}")
            return False
    
    def get_current_context(self):
        """Ottiene il contesto RLS corrente"""
        try:
            # Prima controlla il contesto Flask
            if hasattr(g, 'rls_user_id'):
                return {
                    'user_id': g.rls_user_id,
                    'session_id': getattr(g, 'rls_session_id', None)
                }
            
            # Altrimenti interroga il database
            from app_factory import db
            with db.engine.connect() as conn:
                result = conn.execute(text("SELECT current_user_id, session_id FROM rls_context WHERE id = 1")).fetchone()
                
                if result:
                    return {'user_id': result[0], 'session_id': result[1]}
                return None
                
        except Exception as e:
            current_app.logger.error(f"Errore nel recupero del contesto RLS: {e}")
            return None
    
    def clear_context(self):
        """Pulisce il contesto RLS"""
        try:
            from app_factory import db
            with db.engine.connect() as conn:
                conn.execute(text("UPDATE rls_context SET current_user_id = NULL, session_id = NULL WHERE id = 1"))
                conn.commit()
            
            # Pulisce anche il contesto Flask
            if hasattr(g, 'rls_user_id'):
                delattr(g, 'rls_user_id')
            if hasattr(g, 'rls_session_id'):
                delattr(g, 'rls_session_id')
                
            current_app.logger.info("RLS Context cleared")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Errore nella pulizia del contesto RLS: {e}")
            return False
    
    def is_admin_user(self, user_id=None):
        """Verifica se l'utente corrente è admin"""
        try:
            if user_id is None:
                context = self.get_current_context()
                if not context:
                    return False
                user_id = context['user_id']
            
            from app_factory import db
            with db.engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT is_admin FROM users WHERE id = :user_id"
                ), {"user_id": user_id}).fetchone()
                
                return result and result[0] == 1
                
        except Exception as e:
            current_app.logger.error(f"Errore nella verifica admin: {e}")
            return False

# Istanza globale del manager RLS
rls_manager = RLSManager()

def rls_required(f):
    """Decorator per proteggere le route con RLS"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Verifica che ci sia un utente autenticato
        if not hasattr(request, 'current_user') or not request.current_user:
            return jsonify({'error': 'Autenticazione richiesta'}), 401
        
        # Imposta il contesto RLS per l'utente corrente
        user_id = request.current_user.id
        if not rls_manager.set_user_context(user_id):
            return jsonify({'error': 'Errore nell\'impostazione del contesto di sicurezza'}), 500
        
        # Imposta il contesto RLS nel database
        from app_factory import db
        with db.engine.connect() as conn:
            conn.execute(text(
                "UPDATE rls_context SET current_user_id = :user_id, session_id = :session_id WHERE id = 1"
            ), {"user_id": user_id, "session_id": f"session_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"})
            conn.commit()
        
        try:
            return f(*args, **kwargs)
        finally:
            # Pulisce il contesto RLS
            rls_manager.clear_context()
            # Opzionalmente pulisce il contesto dopo la richiesta
            # rls_manager.clear_context()
            pass
    
    return decorated

def admin_rls_required(f):
    """Decorator per proteggere le route admin con RLS"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Prima verifica l'autenticazione usando il decorator token_required
        from auth import get_current_user
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Token mancante o non valido'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account disattivato'}), 401
        
        # Verifica che sia admin
        if not user.is_admin:
            return jsonify({'error': 'Privilegi di amministratore richiesti'}), 403
        
        # Aggiunge l'utente corrente alla richiesta
        request.current_user = user
        
        # Imposta il contesto RLS per l'utente admin
        user_id = user.id
        if not rls_manager.set_user_context(user_id):
            return jsonify({'error': 'Errore nell\'impostazione del contesto di sicurezza'}), 500
        
        try:
            return f(*args, **kwargs)
        finally:
            pass
    
    return decorated

def get_rls_stats():
    """Ottiene statistiche RLS"""
    try:
        from app_factory import db
        with db.engine.connect() as conn:
            # Conta le policy attive
            result = conn.execute(text("SELECT COUNT(*) FROM rls_policies WHERE is_active = 1"))
            policies_count = result.fetchone()[0]
            
            # Conta i trigger RLS
            result = conn.execute(text("""
                SELECT COUNT(*) FROM sqlite_master 
                WHERE type='trigger' AND name LIKE 'rls_%'
            """))
            triggers_count = result.fetchone()[0]
            
            # Conta le viste protette
            result = conn.execute(text("""
                SELECT COUNT(*) FROM sqlite_master 
                WHERE type='view' AND name LIKE 'protected_%'
            """))
            views_count = result.fetchone()[0]
            
            # Contesto corrente
            context = rls_manager.get_current_context()
            
            return {
                'policies_count': policies_count,
                'triggers_count': triggers_count,
                'views_count': views_count,
                'current_context': context,
                'rls_enabled': True
            }
            
    except Exception as e:
        current_app.logger.error(f"Errore nel recupero delle statistiche RLS: {e}")
        return {
            'policies_count': 0,
            'triggers_count': 0,
            'views_count': 0,
            'current_context': None,
            'rls_enabled': False,
            'error': str(e)
        }

def test_rls_isolation():
    """Test per verificare l'isolamento RLS"""
    try:
        results = []
        
        # Test 1: Verifica che un utente non possa vedere dati di altri utenti
        from app_factory import db
        with db.engine.connect() as conn:
            # Imposta contesto per utente 1
            conn.execute(text("UPDATE rls_context SET current_user_id = 1 WHERE id = 1"))
            
            # Conta attività per utente 1
            count_user1 = conn.execute(text("SELECT COUNT(*) FROM activities")).fetchone()[0]
            results.append(f"Utente 1 vede {count_user1} attività")
            
            # Imposta contesto per utente 2 (se esiste)
            conn.execute(text("UPDATE rls_context SET current_user_id = 2 WHERE id = 1"))
            
            # Conta attività per utente 2
            count_user2 = conn.execute(text("SELECT COUNT(*) FROM activities")).fetchone()[0]
            results.append(f"Utente 2 vede {count_user2} attività")
            
            # Verifica isolamento
            if count_user1 != count_user2:
                results.append("✅ Isolamento RLS funzionante")
            else:
                results.append("⚠️  Possibile problema di isolamento")
        
        return results
        
    except Exception as e:
        return [f"❌ Errore nel test RLS: {e}"]

# Funzioni di utilità per debugging
def debug_rls_context():
    """Debug del contesto RLS"""
    context = rls_manager.get_current_context()
    stats = get_rls_stats()
    
    return {
        'context': context,
        'stats': stats,
        'timestamp': datetime.now().isoformat()
    }

def reset_rls_context():
    """Reset del contesto RLS (solo per debug)"""
    return rls_manager.clear_context()
