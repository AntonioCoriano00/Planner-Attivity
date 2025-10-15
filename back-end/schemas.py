"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import date, time, datetime
from enum import Enum

# Enums
class ActivityStatusEnum(str, Enum):
    DA_FARE = 'da-fare'
    IN_CORSO = 'in-corso'
    FATTA = 'fatta'
    RIMANDATA = 'rimandata'

class ActivityPriorityEnum(str, Enum):
    BASSA = 'bassa'
    MEDIA = 'media'
    ALTA = 'alta'

# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=20, pattern=r'^[a-zA-Z0-9_]{3,20}$')
    email: EmailStr

class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    createdAt: datetime
    updatedAt: datetime
    isActive: bool
    isAdmin: bool
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """Schema for user update"""
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str = Field(..., min_length=6)

# ==================== AUTH SCHEMAS ====================

class Token(BaseModel):
    """Schema for JWT token response"""
    token: str
    user: UserResponse

class TokenVerify(BaseModel):
    """Schema for token verification"""
    token: str

class LoginResponse(BaseModel):
    """Schema for login response"""
    message: str
    token: str
    user: UserResponse

class RegisterResponse(BaseModel):
    """Schema for register response"""
    message: str
    token: str
    user: UserResponse

# ==================== ACTIVITY SCHEMAS ====================

class ActivityBase(BaseModel):
    """Base activity schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    date: date
    time: Optional[time] = None
    endDate: Optional[date] = None
    endTime: Optional[time] = None
    isMultiDay: bool = False
    isMultiHour: bool = False
    status: ActivityStatusEnum = ActivityStatusEnum.DA_FARE
    priority: ActivityPriorityEnum = ActivityPriorityEnum.MEDIA
    category: Optional[str] = None

class ActivityCreate(ActivityBase):
    """Schema for activity creation"""
    pass

class ActivityUpdate(BaseModel):
    """Schema for activity update - all fields optional"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    date: Optional[date] = None
    time: Optional[time] = None
    endDate: Optional[date] = None
    endTime: Optional[time] = None
    isMultiDay: Optional[bool] = None
    isMultiHour: Optional[bool] = None
    status: Optional[ActivityStatusEnum] = None
    priority: Optional[ActivityPriorityEnum] = None
    category: Optional[str] = None

class ActivityStatusUpdate(BaseModel):
    """Schema for updating only activity status"""
    status: ActivityStatusEnum

class ActivityResponse(ActivityBase):
    """Schema for activity response"""
    id: int
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

# ==================== STATS SCHEMAS ====================

class ActivityStats(BaseModel):
    """Schema for activity statistics"""
    total: int
    byStatus: dict
    byPriority: dict
    byCategory: dict
    thisWeek: int
    thisMonth: int

# ==================== RESPONSE SCHEMAS ====================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database: str

# ==================== RLS SCHEMAS ====================

class RLSContext(BaseModel):
    """RLS context schema"""
    user_id: Optional[int] = None
    session_id: Optional[str] = None

class RLSStats(BaseModel):
    """RLS statistics schema"""
    policies_count: int
    triggers_count: int
    views_count: int
    current_context: Optional[RLSContext] = None
    rls_enabled: bool
    error: Optional[str] = None

