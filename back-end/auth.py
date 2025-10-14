import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models import User

# Chiave segreta per JWT (in produzione dovrebbe essere in una variabile d'ambiente)
JWT_SECRET_KEY = 'your-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def generate_token(user_id):
    """Genera un token JWT per l'utente"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verifica e decodifica un token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    """Ottiene l'utente corrente dal token JWT"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        token = auth_header.split(' ')[1]  # Rimuove "Bearer " dal token
    except IndexError:
        return None
    
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get('user_id')
    if not user_id:
        return None
    
    return User.query.get(user_id)

def token_required(f):
    """Decorator per proteggere le route che richiedono autenticazione"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Token mancante o non valido'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account disattivato'}), 401
        
        # Aggiunge l'utente corrente alla richiesta
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator per proteggere le route che richiedono privilegi di admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Token mancante o non valido'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account disattivato'}), 401
        
        if not user.is_admin:
            return jsonify({'error': 'Privilegi di amministratore richiesti'}), 403
        
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated
