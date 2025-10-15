"""
Activities routes for FastAPI
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date as date_type

from database import get_db
from models_fastapi import User, Activity
from schemas import (
    ActivityCreate, ActivityUpdate, ActivityResponse, ActivityStatusUpdate,
    ActivityStats, MessageResponse, HealthResponse, RLSStats, ActivityStatusEnum
)
from rls_manager_fastapi import rls_dependency, admin_rls_dependency, get_rls_stats, test_rls_isolation

router = APIRouter(prefix="", tags=["Activities"])

@router.get("/activities", response_model=List[ActivityResponse])
def get_activities(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get all activities for current user with optional filters
    
    - **status**: Filter by status (da-fare, in-corso, fatta, rimandata)
    - **priority**: Filter by priority (bassa, media, alta)
    - **category**: Filter by category
    - **date_from**: Filter from date
    - **date_to**: Filter to date
    """
    # Base query - filter by user_id
    query = db.query(Activity).filter(Activity.user_id == current_user.id)
    
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
                detail="Formato date_from non valido (usa YYYY-MM-DD)"
            )
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            query = query.filter(Activity.date <= date_to_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato date_to non valido (usa YYYY-MM-DD)"
            )
    
    # Order by date and time
    activities = query.order_by(Activity.date.desc(), Activity.time.desc()).all()
    
    return [ActivityResponse(**activity.to_dict()) for activity in activities]

@router.get("/activities/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: int,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get a specific activity by ID
    """
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attività non trovata"
        )
    
    return ActivityResponse(**activity.to_dict())

@router.post("/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_data: ActivityCreate,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new activity
    
    - **title**: Activity title (required)
    - **date**: Activity date (required)
    - **description**: Activity description (optional)
    - **time**: Activity time (optional)
    - **endDate**: End date for multi-day activities (optional)
    - **endTime**: End time for multi-hour activities (optional)
    - **status**: Activity status (default: da-fare)
    - **priority**: Activity priority (default: media)
    - **category**: Activity category (optional)
    """
    # Additional validations
    if activity_data.endDate and activity_data.endDate < activity_data.date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La data di fine non può essere precedente alla data di inizio"
        )
    
    if (activity_data.endTime and activity_data.time and 
        activity_data.endDate == activity_data.date and 
        activity_data.endTime <= activity_data.time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'ora di fine deve essere successiva all'ora di inizio"
        )
    
    # Create activity
    activity = Activity(
        title=activity_data.title,
        description=activity_data.description,
        date=activity_data.date,
        time=activity_data.time,
        end_date=activity_data.endDate,
        end_time=activity_data.endTime,
        is_multi_day=activity_data.isMultiDay,
        is_multi_hour=activity_data.isMultiHour,
        status=activity_data.status.value,
        priority=activity_data.priority.value,
        category=activity_data.category,
        user_id=current_user.id
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    return ActivityResponse(**activity.to_dict())

@router.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_data: ActivityUpdate,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing activity
    
    All fields are optional. Only provided fields will be updated.
    """
    # Get activity
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attività non trovata"
        )
    
    # Update fields
    update_data = activity_data.model_dump(exclude_unset=True)
    
    # Validate dates if being updated
    new_date = update_data.get('date', activity.date)
    new_end_date = update_data.get('endDate', activity.end_date)
    
    if new_end_date and new_end_date < new_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La data di fine non può essere precedente alla data di inizio"
        )
    
    # Validate times if being updated
    new_time = update_data.get('time', activity.time)
    new_end_time = update_data.get('endTime', activity.end_time)
    
    if (new_end_time and new_time and new_date == new_end_date and new_end_time <= new_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'ora di fine deve essere successiva all'ora di inizio"
        )
    
    # Apply updates
    for field, value in update_data.items():
        if field == 'status' and isinstance(value, ActivityStatusEnum):
            setattr(activity, field, value.value)
        elif field in ['date', 'time', 'endDate', 'endTime', 'isMultiDay', 'isMultiHour']:
            # Map camelCase to snake_case
            field_map = {
                'date': 'date',
                'time': 'time',
                'endDate': 'end_date',
                'endTime': 'end_time',
                'isMultiDay': 'is_multi_day',
                'isMultiHour': 'is_multi_hour'
            }
            db_field = field_map.get(field, field)
            setattr(activity, db_field, value)
        else:
            setattr(activity, field, value)
    
    activity.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(activity)
    
    return ActivityResponse(**activity.to_dict())

@router.delete("/activities/{activity_id}", response_model=MessageResponse)
def delete_activity(
    activity_id: int,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete an activity
    """
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attività non trovata"
        )
    
    db.delete(activity)
    db.commit()
    
    return MessageResponse(message="Attività eliminata con successo")

@router.patch("/activities/{activity_id}/status", response_model=ActivityResponse)
def update_activity_status(
    activity_id: int,
    status_data: ActivityStatusUpdate,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Update only the status of an activity
    
    - **status**: New status (da-fare, in-corso, fatta, rimandata)
    """
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attività non trovata"
        )
    
    activity.status = status_data.status.value
    activity.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(activity)
    
    return ActivityResponse(**activity.to_dict())

@router.get("/activities/date/{date}", response_model=List[ActivityResponse])
def get_activities_by_date(
    date: str,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get activities for a specific date (including multi-day activities)
    
    - **date**: Date in format YYYY-MM-DD
    """
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato data non valido (usa YYYY-MM-DD)"
        )
    
    # Activities starting on this date
    activities_starting = db.query(Activity).filter(
        Activity.date == date_obj,
        Activity.user_id == current_user.id
    ).all()
    
    # Multi-day activities that include this date
    activities_multi_day = db.query(Activity).filter(
        Activity.end_date.isnot(None),
        Activity.date <= date_obj,
        Activity.end_date >= date_obj,
        Activity.user_id == current_user.id
    ).all()
    
    # Combine and remove duplicates
    all_activities = activities_starting + activities_multi_day
    unique_activities = list({activity.id: activity for activity in all_activities}.values())
    
    # Sort by time
    unique_activities.sort(key=lambda x: x.time if x.time else datetime.min.time(), reverse=True)
    
    return [ActivityResponse(**activity.to_dict()) for activity in unique_activities]

@router.get("/activities/status/{status}", response_model=List[ActivityResponse])
def get_activities_by_status(
    status: str,
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get activities by status
    
    - **status**: Status (da-fare, in-corso, fatta, rimandata)
    """
    # Validate status
    valid_statuses = ['da-fare', 'in-corso', 'fatta', 'rimandata']
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stato non valido. Valori consentiti: {', '.join(valid_statuses)}"
        )
    
    activities = db.query(Activity).filter(
        Activity.status == status,
        Activity.user_id == current_user.id
    ).order_by(Activity.date.desc(), Activity.time.desc()).all()
    
    return [ActivityResponse(**activity.to_dict()) for activity in activities]

@router.get("/activities/stats", response_model=ActivityStats)
def get_activity_stats(
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get activity statistics for current user
    """
    user_id = current_user.id
    
    # Total count
    total = db.query(Activity).filter(Activity.user_id == user_id).count()
    
    # By status
    by_status = {
        'da-fare': db.query(Activity).filter(Activity.status == 'da-fare', Activity.user_id == user_id).count(),
        'in-corso': db.query(Activity).filter(Activity.status == 'in-corso', Activity.user_id == user_id).count(),
        'fatta': db.query(Activity).filter(Activity.status == 'fatta', Activity.user_id == user_id).count(),
        'rimandata': db.query(Activity).filter(Activity.status == 'rimandata', Activity.user_id == user_id).count(),
    }
    
    # By priority
    by_priority = {
        'alta': db.query(Activity).filter(Activity.priority == 'alta', Activity.user_id == user_id).count(),
        'media': db.query(Activity).filter(Activity.priority == 'media', Activity.user_id == user_id).count(),
        'bassa': db.query(Activity).filter(Activity.priority == 'bassa', Activity.user_id == user_id).count(),
    }
    
    # By category
    categories_result = db.query(Activity.category, func.count(Activity.id)).filter(
        Activity.user_id == user_id,
        Activity.category.isnot(None)
    ).group_by(Activity.category).all()
    
    by_category = {cat: count for cat, count in categories_result if cat}
    
    # This week and month (simple implementation)
    today = datetime.now().date()
    this_week = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.date >= today
    ).count()
    
    this_month = db.query(Activity).filter(
        Activity.user_id == user_id,
        func.strftime('%Y-%m', Activity.date) == today.strftime('%Y-%m')
    ).count()
    
    return ActivityStats(
        total=total,
        byStatus=by_status,
        byPriority=by_priority,
        byCategory=by_category,
        thisWeek=this_week,
        thisMonth=this_month
    )

@router.get("/activities/categories", response_model=List[str])
def get_categories(
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get all categories used by current user
    """
    categories = db.query(Activity.category).filter(
        Activity.category.isnot(None),
        Activity.user_id == current_user.id
    ).distinct().all()
    
    return [cat[0] for cat in categories if cat[0]]

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint
    """
    return HealthResponse(
        status="OK",
        version="2.0.0",
        database="SQLite"
    )

@router.get("/rls/stats", response_model=RLSStats)
def get_rls_statistics(
    current_user: User = Depends(rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Get RLS statistics
    Requires authentication
    """
    stats = get_rls_stats(db)
    return RLSStats(**stats)

@router.get("/rls/test")
def test_rls(
    current_user: User = Depends(admin_rls_dependency),
    db: Session = Depends(get_db)
):
    """
    Test RLS isolation (admin only)
    """
    test_results = test_rls_isolation(db)
    
    return {
        'message': 'Test RLS completato',
        'test_results': test_results,
        'timestamp': datetime.utcnow().isoformat()
    }

