"""
Database configuration and session management for FastAPI
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# URL del database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./instance/planner_activities_dev.db')

# Crea engine SQLite con check_same_thread=False per FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {},
    echo=False  # Set to True for SQL query logging
)

# SessionLocal class per creare sessioni database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class per i modelli
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency per ottenere una sessione database.
    Viene usata nelle route FastAPI come dependency injection.
    
    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Inizializza il database creando tutte le tabelle.
    Da chiamare all'avvio dell'applicazione.
    """
    from models import User, Activity  # Import qui per evitare circular imports
    Base.metadata.create_all(bind=engine)

