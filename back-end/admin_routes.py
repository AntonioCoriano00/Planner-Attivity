from flask import Blueprint, request, jsonify
from datetime import datetime
from models import User, Activity, db
from auth import admin_required, token_required
from rls_manager import admin_rls_required
import re

# Crea un Blueprint per le route admin
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

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

@admin_bp.route('/users', methods=['GET'])
@admin_rls_required
def get_all_users():
    """Ottiene tutti gli utenti (solo admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '').strip()
        
        # Query base
        query = User.query
        
        # Filtro di ricerca
        if search:
            query = query.filter(
                (User.username.contains(search)) |
                (User.email.contains(search))
            )
        
        # Paginazione
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_rls_required
def get_user(user_id):
    """Ottiene un utente specifico (solo admin)"""
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({'user': user.to_dict()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@admin_rls_required
def create_user():
    """Crea un nuovo utente (solo admin)"""
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
        user = User(username=username, email=email, is_admin=False)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Utente creato con successo',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_rls_required
def update_user(user_id):
    """Aggiorna un utente (solo admin)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Non permettere di modificare l'admin principale
        if user.username == 'admin' and user.is_admin:
            return jsonify({'error': 'Non è possibile modificare l\'account admin principale'}), 403
        
        # Aggiorna i campi se forniti
        if 'username' in data:
            new_username = data['username'].strip()
            if not validate_username(new_username):
                return jsonify({'error': 'Username deve essere di 3-20 caratteri e contenere solo lettere, numeri e underscore'}), 400
            
            # Controlla se il nuovo username esiste già
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Username già esistente'}), 400
            
            user.username = new_username
        
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not validate_email(new_email):
                return jsonify({'error': 'Formato email non valido'}), 400
            
            # Controlla se la nuova email esiste già
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email già esistente'}), 400
            
            user.email = new_email
        
        if 'password' in data and data['password']:
            if not validate_password(data['password']):
                return jsonify({'error': 'Password deve essere di almeno 6 caratteri'}), 400
            user.set_password(data['password'])
        
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Utente aggiornato con successo',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_rls_required
def delete_user(user_id):
    """Elimina un utente (solo admin)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Non permettere di eliminare l'admin principale
        if user.username == 'admin' and user.is_admin:
            return jsonify({'error': 'Non è possibile eliminare l\'account admin principale'}), 403
        
        # Non permettere di eliminare se stessi
        if user.id == request.current_user.id:
            return jsonify({'error': 'Non è possibile eliminare il proprio account'}), 403
        
        # Elimina anche tutte le attività dell'utente
        # Per gli admin, disabilitiamo temporaneamente i trigger RLS
        from sqlalchemy import text
        
        # Disabilita temporaneamente i trigger RLS
        db.session.execute(text("DROP TRIGGER IF EXISTS rls_activities_delete_trigger"))
        
        # Elimina le attività dell'utente
        db.session.execute(text("DELETE FROM activities WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Ricrea il trigger RLS
        db.session.execute(text("""
            CREATE TRIGGER rls_activities_delete_trigger
            BEFORE DELETE ON activities
            BEGIN
                SELECT CASE
                    WHEN OLD.user_id != (SELECT current_user_id FROM rls_context WHERE id = 1)
                    THEN RAISE(ABORT, 'Access denied: Row Level Security violation')
                END;
            END;
        """))
        
        # Elimina l'utente
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Utente eliminato con successo'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/activities', methods=['GET'])
@admin_rls_required
def get_user_activities(user_id):
    """Ottiene tutte le attività di un utente (solo admin)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Parametri di query opzionali
        status = request.args.get('status')
        priority = request.args.get('priority')
        category = request.args.get('category')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Activity.query.filter_by(user_id=user_id)
        
        # Applica filtri se forniti
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        if category:
            query = query.filter_by(category=category)
        if date_from:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            query = query.filter(Activity.date >= date_from_obj)
        if date_to:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            query = query.filter(Activity.date <= date_to_obj)
        
        # Ordina per data e ora
        activities = query.order_by(Activity.date.desc(), Activity.time.desc()).all()
        
        return jsonify({
            'user': user.to_dict(),
            'activities': [activity.to_dict() for activity in activities]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@admin_rls_required
def get_admin_stats():
    """Ottiene statistiche generali del sistema (solo admin)"""
    try:
        # Statistiche utenti
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(is_admin=True).count()
        
        # Statistiche attività
        total_activities = Activity.query.count()
        activities_by_status = {}
        for status in ['da-fare', 'in-corso', 'fatta', 'rimandata']:
            activities_by_status[status] = Activity.query.filter_by(status=status).count()
        
        # Attività per utente
        user_activity_counts = db.session.query(
            User.username, 
            db.func.count(Activity.id).label('activity_count')
        ).outerjoin(Activity).group_by(User.id, User.username).all()
        
        return jsonify({
            'users': {
                'total': total_users,
                'active': active_users,
                'admins': admin_users
            },
            'activities': {
                'total': total_activities,
                'by_status': activities_by_status
            },
            'user_activity_counts': [
                {'username': username, 'activity_count': count} 
                for username, count in user_activity_counts
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@admin_rls_required
def get_admin_dashboard():
    """Ottiene i dati per la dashboard admin"""
    try:
        # Statistiche recenti
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_activities = Activity.query.order_by(Activity.created_at.desc()).limit(10).all()
        
        # Conteggi per grafici
        users_by_month = db.session.query(
            db.func.strftime('%Y-%m', User.created_at).label('month'),
            db.func.count(User.id).label('count')
        ).group_by('month').order_by('month').all()
        
        activities_by_month = db.session.query(
            db.func.strftime('%Y-%m', Activity.created_at).label('month'),
            db.func.count(Activity.id).label('count')
        ).group_by('month').order_by('month').all()
        
        return jsonify({
            'recent_users': [user.to_dict() for user in recent_users],
            'recent_activities': [activity.to_dict() for activity in recent_activities],
            'users_by_month': [{'month': month, 'count': count} for month, count in users_by_month],
            'activities_by_month': [{'month': month, 'count': count} for month, count in activities_by_month]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
