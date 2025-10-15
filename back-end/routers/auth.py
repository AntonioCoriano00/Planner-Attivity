"""
Authentication routes for FastAPI
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import re

from database import get_db
from models_fastapi import User
from schemas import (
    UserCreate, UserLogin, UserResponse, LoginResponse, RegisterResponse,
    Token, TokenVerify, PasswordChange, MessageResponse
)
from auth_fastapi import create_access_token, verify_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password (at least 6 characters)"""
    return len(password) >= 6

def validate_username(username: str) -> bool:
    """Validate username (3-20 characters, alphanumeric and underscore only)"""
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **username**: 3-20 characters, alphanumeric and underscore only
    - **email**: Valid email address
    - **password**: At least 6 characters
    """
    # Validate username
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username deve essere di 3-20 caratteri e contenere solo lettere, numeri e underscore"
        )
    
    # Validate email
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato email non valido"
        )
    
    # Validate password
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password deve essere di almeno 6 caratteri"
        )
    
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
        email=user_data.email.lower()
    )
    new_user.set_password(user_data.password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    token = create_access_token(data={"user_id": new_user.id})
    
    return RegisterResponse(
        message="Registrazione completata con successo",
        token=token,
        user=UserResponse(**new_user.to_dict())
    )

@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login user
    
    - **username**: Username or email
    - **password**: User password
    """
    # Try to find user by username or email
    username_or_email = credentials.username.strip()
    
    if '@' in username_or_email:
        user = db.query(User).filter(User.email == username_or_email.lower()).first()
    else:
        user = db.query(User).filter(User.username == username_or_email).first()
    
    # Verify user and password
    if not user or not user.check_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account disattivato"
        )
    
    # Generate token
    token = create_access_token(data={"user_id": user.id})
    
    return LoginResponse(
        message="Login effettuato con successo",
        token=token,
        user=UserResponse(**user.to_dict())
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    Requires authentication
    """
    return UserResponse(**current_user.to_dict())

@router.post("/verify")
def verify_token_endpoint(token_data: TokenVerify, db: Session = Depends(get_db)):
    """
    Verify if a token is valid
    
    - **token**: JWT token to verify
    """
    payload = verify_token(token_data.token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto"
        )
    
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato o disattivato"
        )
    
    return {
        "valid": True,
        "user": UserResponse(**user.to_dict())
    }

@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user (client-side token removal)
    Requires authentication
    """
    return MessageResponse(message="Logout effettuato con successo")

@router.put("/change-password", response_model=MessageResponse)
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    Requires authentication
    
    - **current_password**: Current password
    - **new_password**: New password (at least 6 characters)
    """
    # Verify current password
    if not current_user.check_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password corrente non valida"
        )
    
    # Validate new password
    if not validate_password(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nuova password deve essere di almeno 6 caratteri"
        )
    
    # Update password
    current_user.set_password(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(message="Password aggiornata con successo")

