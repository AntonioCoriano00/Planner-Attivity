"""
Admin routes for FastAPI
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import datetime

from database import get_db
from models_fastapi import User, Activity
from schemas import UserResponse, UserCreate, UserUpdate, ActivityResponse, MessageResponse
from rls_manager_fastapi import admin_rls_dependency

router = APIRouter(prefix="/admin", tags=["Admin"])

# ==================== USERS MANAGEMENT ====================

@router.get("/users", response_model=dict)
def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username or email"),
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get all users with pagination and search (admin only)
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 10, max: 100)
    - **search**: Search term for username or email
    """
    # Base query
    query = db.query(User)
    
    # Apply search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (User.username.like(search_term)) | (User.email.like(search_term))
        )
    
    # Count total
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    users = query.order_by(User.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Calculate pages
    pages = (total + per_page - 1) // per_page
    
    return {
        'users': [UserResponse(**user.to_dict()) for user in users],
        'total': total,
        'pages': pages,
        'current_page': page,
        'per_page': per_page
    }

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    return UserResponse(**user.to_dict())

@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new user (admin only)
    
    - **username**: 3-20 characters, alphanumeric and underscore only
    - **email**: Valid email address
    - **password**: At least 6 characters
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email.lower())
    ).first()
    
    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username già esistente"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già esistente"
            )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email.lower(),
        is_admin=False
    )
    new_user.set_password(user_data.password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        'message': 'Utente creato con successo',
        'user': UserResponse(**new_user.to_dict())
    }

@router.put("/users/{user_id}", response_model=dict)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Update a user (admin only)
    
    - **email**: New email (optional)
    - **is_active**: Active status (optional)
    
    Note: Cannot modify the main admin account
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # Prevent modification of main admin account
    if user.username == 'admin' and user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non è possibile modificare l'account admin principale"
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    
    if 'email' in update_data:
        new_email = update_data['email'].lower()
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == new_email).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già esistente"
            )
        user.email = new_email
    
    if 'is_active' in update_data:
        user.is_active = update_data['is_active']
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return {
        'message': 'Utente aggiornato con successo',
        'user': UserResponse(**user.to_dict())
    }

@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a user (admin only)
    
    Note: Cannot delete the main admin account or yourself
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # Prevent deletion of main admin account
    if user.username == 'admin' and user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non è possibile eliminare l'account admin principale"
        )
    
    # Prevent self-deletion
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non è possibile eliminare il proprio account"
        )
    
    # Delete user activities first (temporarily disable RLS triggers for admin operation)
    try:
        # Disable RLS trigger temporarily
        db.execute(text("DROP TRIGGER IF EXISTS rls_activities_delete_trigger"))
        
        # Delete user's activities
        db.execute(text("DELETE FROM activities WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Recreate RLS trigger
        db.execute(text("""
            CREATE TRIGGER rls_activities_delete_trigger
            BEFORE DELETE ON activities
            BEGIN
                SELECT CASE
                    WHEN OLD.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                    THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
                END;
            END;
        """))
        
        # Delete user
        db.delete(user)
        db.commit()
        
        return MessageResponse(message="Utente eliminato con successo")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante l'eliminazione: {str(e)}"
        )

@router.get("/users/{user_id}/activities", response_model=dict)
def get_user_activities(
    user_id: int,
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    date_from: Optional[str] = Query(None, description="Filter from date"),
    date_to: Optional[str] = Query(None, description="Filter to date"),
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get all activities of a specific user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # Base query
    query = db.query(Activity).filter(Activity.user_id == user_id)
    
    # Apply filters
    if status:
        query = query.filter(Activity.status == status)
    if priority:
        query = query.filter(Activity.priority == priority)
    if category:
        query = query.filter(Activity.category == category)
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            query = query.filter(Activity.date >= date_from_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato date_from non valido"
            )
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            query = query.filter(Activity.date <= date_to_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato date_to non valido"
            )
    
    # Order by date and time
    activities = query.order_by(Activity.date.desc(), Activity.time.desc()).all()
    
    return {
        'user': UserResponse(**user.to_dict()),
        'activities': [ActivityResponse(**activity.to_dict()) for activity in activities]
    }

# ==================== STATISTICS ====================

@router.get("/stats")
def get_admin_stats(
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get system statistics (admin only)
    """
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()
    
    # Activity statistics
    total_activities = db.query(Activity).count()
    
    activities_by_status = {}
    for status_val in ['da-fare', 'in-corso', 'fatta', 'rimandata']:
        activities_by_status[status_val] = db.query(Activity).filter(
            Activity.status == status_val
        ).count()
    
    # Activities per user
    user_activity_counts = db.query(
        User.username,
        func.count(Activity.id).label('activity_count')
    ).outerjoin(Activity).group_by(User.id, User.username).all()
    
    return {
        'users': {
            'total': total_users,
            'active': active_users,
            'admins': admin_users
        },
        'activities': {
            'total': total_activities,
            'by_status': activities_by_status
        },
        'user_activity_counts': [
            {'username': username, 'activity_count': count}
            for username, count in user_activity_counts
        ]
    }

@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard data (admin only)
    """
    # Recent users
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    
    # Recent activities
    recent_activities = db.query(Activity).order_by(Activity.created_at.desc()).limit(10).all()
    
    # Users by month
    users_by_month = db.query(
        func.strftime('%Y-%m', User.created_at).label('month'),
        func.count(User.id).label('count')
    ).group_by('month').order_by('month').all()
    
    # Activities by month
    activities_by_month = db.query(
        func.strftime('%Y-%m', Activity.created_at).label('month'),
        func.count(Activity.id).label('count')
    ).group_by('month').order_by('month').all()
    
    return {
        'recent_users': [UserResponse(**user.to_dict()) for user in recent_users],
        'recent_activities': [ActivityResponse(**activity.to_dict()) for activity in recent_activities],
        'users_by_month': [{'month': month, 'count': count} for month, count in users_by_month],
        'activities_by_month': [{'month': month, 'count': count} for month, count in activities_by_month]
    }

