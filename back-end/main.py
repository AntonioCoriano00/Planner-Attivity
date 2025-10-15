"""
FastAPI Main Application
Planner Attività - Backend API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config_fastapi import settings
from database import init_db, engine
from models_fastapi import Base

# Import routers
from routers import auth, activities, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for FastAPI application
    """
    # Startup: Initialize database
    print("🚀 Initializing database...")
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown: Cleanup (if needed)
    print("👋 Shutting down...")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    # Planner Attività API
    
    Sistema di gestione attività con:
    - 🔐 **Autenticazione JWT**
    - 👥 **Multi-tenant con RLS**
    - 📊 **Gestione attività**
    - 👑 **Pannello amministratore**
    
    ## Features
    
    - **Authentication**: JWT token-based authentication
    - **Multi-tenancy**: Row Level Security for data isolation
    - **Activities**: Full CRUD operations for activities
    - **Admin Panel**: User management and statistics
    - **Filtering**: Advanced filtering for activities
    - **Statistics**: Activity and user statistics
    
    ## Security
    
    - Row Level Security (RLS) at database level
    - JWT token authentication
    - Password hashing with bcrypt
    - CORS protection
    
    ## Usage
    
    1. Register or login to get JWT token
    2. Use token in Authorization header: `Bearer <token>`
    3. All routes are protected except `/auth/login` and `/auth/register`
    """,
    lifespan=lifespan,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Root endpoint
@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint - API Information
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json"
    }

# Health check endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "OK",
        "version": settings.app_version,
        "database": "SQLite",
        "message": "Backend funzionante"
    }

if __name__ == "__main__":
    import uvicorn
    
    print(f"""
    ╔══════════════════════════════════════════════════════╗
    ║                                                      ║
    ║       🚀 Planner Attività API - FastAPI v2.0        ║
    ║                                                      ║
    ╚══════════════════════════════════════════════════════╝
    
    📊 Server: http://{settings.host}:{settings.port}
    📚 Documentation: http://{settings.host}:{settings.port}/docs
    📖 ReDoc: http://{settings.host}:{settings.port}/redoc
    🔧 Environment: {'Development' if settings.debug else 'Production'}
    
    ✅ Features:
       • JWT Authentication
       • Multi-tenant with RLS
       • Activity Management
       • Admin Panel
    
    """)
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )

