from flask import Blueprint, request, jsonify
from datetime import datetime
from models import User, db
from auth import generate_token, verify_token, token_required
import re

# Crea un Blueprint per le route di autenticazione
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Valida il formato dell'email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida la password (almeno 6 caratteri)"""
    return len(password) >= 6

def validate_username(username):
    """Valida il nome utente (3-20 caratteri, solo lettere, numeri e underscore)"""
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra un nuovo utente"""
    try:
        data = request.get_json()
        
        # Validazione dei dati richiesti
        if not data.get('username'):
            return jsonify({'error': 'Username richiesto'}), 400
        
        if not data.get('email'):
            return jsonify({'error': 'Email richiesta'}), 400
        
        if not data.get('password'):
            return jsonify({'error': 'Password richiesta'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validazione del formato
        if not validate_username(username):
            return jsonify({'error': 'Username deve essere di 3-20 caratteri e contenere solo lettere, numeri e underscore'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Formato email non valido'}), 400
        
        if not validate_password(password):
            return jsonify({'error': 'Password deve essere di almeno 6 caratteri'}), 400
        
        # Controlla se l'utente esiste già
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username già esistente'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email già esistente'}), 400
        
        # Crea il nuovo utente
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Genera il token
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'Registrazione completata con successo',
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Effettua il login dell'utente"""
    try:
        data = request.get_json()
        
        # Validazione dei dati richiesti
        if not data.get('username') and not data.get('email'):
            return jsonify({'error': 'Username o email richiesti'}), 400
        
        if not data.get('password'):
            return jsonify({'error': 'Password richiesta'}), 400
        
        username_or_email = data.get('username', '').strip()
        password = data['password']
        
        # Cerca l'utente per username o email
        user = None
        if '@' in username_or_email:
            user = User.query.filter_by(email=username_or_email.lower()).first()
        else:
            user = User.query.filter_by(username=username_or_email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Credenziali non valide'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account disattivato'}), 401
        
        # Genera il token
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'Login effettuato con successo',
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_info():
    """Ottiene le informazioni dell'utente corrente"""
    try:
        user = request.current_user
        return jsonify({
            'user': user.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify', methods=['POST'])
def verify_token_endpoint():
    """Verifica se un token è valido"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token richiesto'}), 400
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token non valido o scaduto'}), 401
        
        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'Utente non trovato o disattivato'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Effettua il logout (lato client)"""
    return jsonify({'message': 'Logout effettuato con successo'})

@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password():
    """Cambia la password dell'utente corrente"""
    try:
        data = request.get_json()
        
        if not data.get('current_password'):
            return jsonify({'error': 'Password corrente richiesta'}), 400
        
        if not data.get('new_password'):
            return jsonify({'error': 'Nuova password richiesta'}), 400
        
        user = request.current_user
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Verifica la password corrente
        if not user.check_password(current_password):
            return jsonify({'error': 'Password corrente non valida'}), 400
        
        # Valida la nuova password
        if not validate_password(new_password):
            return jsonify({'error': 'Nuova password deve essere di almeno 6 caratteri'}), 400
        
        # Aggiorna la password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Password aggiornata con successo'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
