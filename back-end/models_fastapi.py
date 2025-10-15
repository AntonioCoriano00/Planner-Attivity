"""
SQLAlchemy models for FastAPI
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Text, ForeignKey
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from database import Base

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    """User model"""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False, index=True)

    # Relationship
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password: str):
        """Set password hash"""
        self.password_hash = pwd_context.hash(password)

    def check_password(self, password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(password, self.password_hash)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'isActive': self.is_active,
            'isAdmin': self.is_admin
        }


class Activity(Base):
    """Activity model"""
    __tablename__ = 'activities'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, index=True)
    end_date = Column(Date, index=True)
    end_time = Column(Time, index=True)
    is_multi_day = Column(Boolean, default=False, index=True)
    is_multi_hour = Column(Boolean, default=False, index=True)
    status = Column(String(20), default='da-fare', index=True)
    priority = Column(String(20), default='media', index=True)
    category = Column(String(100), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="activities")

    def __repr__(self):
        return f'<Activity {self.id}: {self.title}>'

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'endTime': self.end_time.strftime('%H:%M') if self.end_time else None,
            'isMultiDay': self.is_multi_day,
            'isMultiHour': self.is_multi_hour,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

