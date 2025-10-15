"""
Row Level Security (RLS) Manager for FastAPI
"""
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models_fastapi import User
from auth_fastapi import get_current_user

class RLSManager:
    """Manager for Row Level Security operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def set_user_context(self, user_id: int, session_id: Optional[str] = None) -> bool:
        """
        Set RLS context for current user
        
        Args:
            user_id: User ID to set in context
            session_id: Optional session identifier
            
        Returns:
            True if successful
        """
        try:
            if session_id is None:
                session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            self.db.execute(
                text(
                    "UPDATE rls_context SET current_user_id = :user_id, "
                    "session_id = :session_id, created_at = CURRENT_TIMESTAMP WHERE id = 1"
                ),
                {"user_id": user_id, "session_id": session_id}
            )
            self.db.commit()
            
            return True
            
        except Exception as e:
            print(f"Error setting RLS context: {e}")
            self.db.rollback()
            return False
    
    def get_current_context(self) -> Optional[dict]:
        """
        Get current RLS context
        
        Returns:
            Dictionary with user_id and session_id or None
        """
        try:
            result = self.db.execute(
                text("SELECT current_user_id, session_id FROM rls_context WHERE id = 1")
            ).fetchone()
            
            if result:
                return {
                    'user_id': result[0],
                    'session_id': result[1]
                }
            return None
            
        except Exception as e:
            print(f"Error getting RLS context: {e}")
            return None
    
    def clear_context(self) -> bool:
        """
        Clear RLS context
        
        Returns:
            True if successful
        """
        try:
            self.db.execute(
                text("UPDATE rls_context SET current_user_id = NULL, session_id = NULL WHERE id = 1")
            )
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"Error clearing RLS context: {e}")
            self.db.rollback()
            return False

def get_rls_manager(db: Session = Depends(get_db)) -> RLSManager:
    """
    Dependency to get RLS Manager instance
    """
    return RLSManager(db)

def rls_dependency(
    current_user: User = Depends(get_current_user),
    rls_manager: RLSManager = Depends(get_rls_manager)
) -> User:
    """
    Dependency that sets RLS context and returns current user
    Use this in routes that need RLS protection
    
    Usage:
        @router.get("/activities")
        def get_activities(user: User = Depends(rls_dependency)):
            # RLS context is automatically set
            ...
    """
    # Set RLS context for current user
    if not rls_manager.set_user_context(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nell'impostazione del contesto di sicurezza"
        )
    
    return current_user

def admin_rls_dependency(
    current_user: User = Depends(get_current_user),
    rls_manager: RLSManager = Depends(get_rls_manager)
) -> User:
    """
    Dependency that checks admin privileges and sets RLS context
    Use this in admin-only routes
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilegi di amministratore richiesti"
        )
    
    # Set RLS context for admin user
    if not rls_manager.set_user_context(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nell'impostazione del contesto di sicurezza"
        )
    
    return current_user

def get_rls_stats(db: Session) -> dict:
    """
    Get RLS statistics
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with RLS statistics
    """
    try:
        # Count active policies
        result = db.execute(
            text("SELECT COUNT(*) FROM rls_policies WHERE is_active = 1")
        )
        policies_count = result.fetchone()[0]
        
        # Count RLS triggers
        result = db.execute(
            text("SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'rls_%'")
        )
        triggers_count = result.fetchone()[0]
        
        # Count protected views
        result = db.execute(
            text("SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name LIKE 'protected_%'")
        )
        views_count = result.fetchone()[0]
        
        # Get current context
        result = db.execute(
            text("SELECT current_user_id, session_id FROM rls_context WHERE id = 1")
        ).fetchone()
        
        current_context = None
        if result and result[0] is not None:
            current_context = {
                'user_id': result[0],
                'session_id': result[1]
            }
        
        return {
            'policies_count': policies_count,
            'triggers_count': triggers_count,
            'views_count': views_count,
            'current_context': current_context,
            'rls_enabled': True
        }
        
    except Exception as e:
        return {
            'policies_count': 0,
            'triggers_count': 0,
            'views_count': 0,
            'current_context': None,
            'rls_enabled': False,
            'error': str(e)
        }

def test_rls_isolation(db: Session) -> list:
    """
    Test RLS isolation between users
    
    Args:
        db: Database session
        
    Returns:
        List of test results
    """
    try:
        results = []
        
        # Test 1: Set context for user 1
        db.execute(text("UPDATE rls_context SET current_user_id = 1 WHERE id = 1"))
        db.commit()
        
        # Count activities for user 1
        count_user1 = db.execute(text("SELECT COUNT(*) FROM activities")).fetchone()[0]
        results.append(f"Utente 1 vede {count_user1} attività")
        
        # Test 2: Set context for user 2
        db.execute(text("UPDATE rls_context SET current_user_id = 2 WHERE id = 1"))
        db.commit()
        
        # Count activities for user 2
        count_user2 = db.execute(text("SELECT COUNT(*) FROM activities")).fetchone()[0]
        results.append(f"Utente 2 vede {count_user2} attività")
        
        # Verify isolation
        if count_user1 != count_user2:
            results.append("✅ Isolamento RLS funzionante")
        else:
            results.append("⚠️ Possibile problema di isolamento")
        
        return results
        
    except Exception as e:
        return [f"❌ Errore nel test RLS: {e}"]

