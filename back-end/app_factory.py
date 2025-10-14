from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import config
import os

# Inizializza le estensioni
db = SQLAlchemy()

def create_app(config_name=None):
    """Factory function per creare l'applicazione Flask"""
    app = Flask(__name__)
    
    # Carica la configurazione
    config_name = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Inizializza le estensioni
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Inizializza RLS Manager (dopo l'inizializzazione di db)
    from rls_manager import rls_manager
    rls_manager.init_app(app)
    
    # Registra i Blueprint
    from routes import api
    from auth_routes import auth_bp
    from admin_routes import admin_bp
    app.register_blueprint(api)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    
    # Importa i modelli per assicurarsi che siano registrati
    # Questo import deve avvenire DOPO l'inizializzazione di db
    from models import Activity, User
    
    # Crea le tabelle del database
    with app.app_context():
        db.create_all()
    
    return app
