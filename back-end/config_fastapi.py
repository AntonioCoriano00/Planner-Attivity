"""
FastAPI Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    app_name: str = "Planner Attività API"
    app_version: str = "2.0.0"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite:///./instance/planner_activities_dev.db"
    
    # JWT Settings
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    
    # Server
    host: str = "0.0.0.0"
    port: int = 5000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Crea istanza globale delle settings
settings = Settings()

