from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Activity, ActivityStatus, ActivityPriority
from app_factory import db
from auth import token_required
from rls_manager import rls_required, admin_rls_required

# Crea un Blueprint per le route
api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/activities', methods=['GET'])
@token_required
@rls_required
def get_activities():
    """Ottiene tutte le attività dell'utente corrente con filtri opzionali"""
    try:
        # Parametri di query opzionali
        status = request.args.get('status')
        priority = request.args.get('priority')
        category = request.args.get('category')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Query base - filtra per user_id dell'utente corrente
        query = Activity.query.filter_by(user_id=request.current_user.id)
        
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
        return jsonify([activity.to_dict() for activity in activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/activities/<int:activity_id>', methods=['GET'])
@token_required
@rls_required
def get_activity(activity_id):
    """Ottiene un'attività specifica per ID"""
    try:
        # Filtra per user_id dell'utente corrente
        activity = Activity.query.filter_by(id=activity_id, user_id=request.current_user.id).first_or_404()
        return jsonify(activity.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/activities', methods=['POST'])
@token_required
@rls_required
def create_activity():
    """Crea una nuova attività"""
    try:
        data = request.get_json()
        
        # Validazione dei dati richiesti
        if not data.get('title'):
            return jsonify({'error': 'Il titolo è obbligatorio'}), 400
        
        if not data.get('date'):
            return jsonify({'error': 'La data è obbligatoria'}), 400

        # Validazione dello stato
        if data.get('status') and data['status'] not in Activity.get_valid_statuses():
            return jsonify({'error': 'Stato non valido'}), 400
        
        # Validazione della priorità
        if data.get('priority') and data['priority'] not in Activity.get_valid_priorities():
            return jsonify({'error': 'Priorità non valida'}), 400

        # Validazione delle date di fine
        if data.get('endDate') and data.get('date'):
            try:
                start_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
                if end_date < start_date:
                    return jsonify({'error': 'La data di fine non può essere precedente alla data di inizio'}), 400
            except ValueError:
                return jsonify({'error': 'Formato data di fine non valido'}), 400

        # Validazione delle ore di fine
        if data.get('endTime') and data.get('time') and data.get('endDate') == data.get('date'):
            try:
                start_time = datetime.strptime(data['time'], '%H:%M').time()
                end_time = datetime.strptime(data['endTime'], '%H:%M').time()
                if end_time <= start_time:
                    return jsonify({'error': 'L\'ora di fine deve essere successiva all\'ora di inizio'}), 400
            except ValueError:
                return jsonify({'error': 'Formato ora di fine non valido'}), 400

        # Creazione della nuova attività
        activity = Activity.from_dict(data)
        activity.user_id = request.current_user.id
        
        db.session.add(activity)
        db.session.commit()

        return jsonify(activity.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': 'Formato data/ora non valido'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/activities/<int:activity_id>', methods=['PUT'])
@token_required
@rls_required
def update_activity(activity_id):
    """Aggiorna un'attività esistente"""
    try:
        # Filtra per user_id dell'utente corrente
        activity = Activity.query.filter_by(id=activity_id, user_id=request.current_user.id).first_or_404()
        data = request.get_json()

        # Validazione dello stato se fornito
        if data.get('status') and data['status'] not in Activity.get_valid_statuses():
            return jsonify({'error': 'Stato non valido'}), 400
        
        # Validazione della priorità se fornita
        if data.get('priority') and data['priority'] not in Activity.get_valid_priorities():
            return jsonify({'error': 'Priorità non valida'}), 400

        # Validazione delle date di fine
        if data.get('endDate') and (data.get('date') or activity.date):
            try:
                start_date = datetime.strptime(data.get('date', activity.date.isoformat()), '%Y-%m-%d').date()
                end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
                if end_date < start_date:
                    return jsonify({'error': 'La data di fine non può essere precedente alla data di inizio'}), 400
            except ValueError:
                return jsonify({'error': 'Formato data di fine non valido'}), 400

        # Validazione delle ore di fine
        if data.get('endTime') and (data.get('time') or activity.time) and (data.get('endDate', activity.end_date.isoformat() if activity.end_date else None) == (data.get('date', activity.date.isoformat()))):
            try:
                start_time = datetime.strptime(data.get('time', activity.time.strftime('%H:%M') if activity.time else '00:00'), '%H:%M').time()
                end_time = datetime.strptime(data['endTime'], '%H:%M').time()
                if end_time <= start_time:
                    return jsonify({'error': 'L\'ora di fine deve essere successiva all\'ora di inizio'}), 400
            except ValueError:
                return jsonify({'error': 'Formato ora di fine non valido'}), 400

        # Aggiornamento dell'attività
        activity.update_from_dict(data)
        db.session.commit()

        return jsonify(activity.to_dict())
    except ValueError as e:
        return jsonify({'error': 'Formato data/ora non valido'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/activities/<int:activity_id>', methods=['DELETE'])
@token_required
@rls_required
def delete_activity(activity_id):
    """Elimina un'attività"""
    try:
        # Filtra per user_id dell'utente corrente
        activity = Activity.query.filter_by(id=activity_id, user_id=request.current_user.id).first_or_404()
        db.session.delete(activity)
        db.session.commit()
        return jsonify({'message': 'Attività eliminata con successo'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/activities/<int:activity_id>/status', methods=['PATCH'])
@token_required
@rls_required
def update_activity_status(activity_id):
    """Aggiorna solo lo stato di un'attività"""
    try:
        # Filtra per user_id dell'utente corrente
        activity = Activity.query.filter_by(id=activity_id, user_id=request.current_user.id).first_or_404()
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Stato richiesto'}), 400
        
        if data['status'] not in Activity.get_valid_statuses():
            return jsonify({'error': 'Stato non valido'}), 400
        
        activity.status = data['status']
        activity.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(activity.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/activities/date/<date>', methods=['GET'])
@token_required
@rls_required
def get_activities_by_date(date):
    """Ottiene le attività per una data specifica (incluso multi-giorno)"""
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Query per attività che iniziano in questa data - filtra per user_id
        activities_starting = Activity.query.filter_by(date=date_obj, user_id=request.current_user.id).all()
        
        # Query per attività multi-giorno che includono questa data - filtra per user_id
        activities_multi_day = Activity.query.filter(
            Activity.end_date.isnot(None),
            Activity.date <= date_obj,
            Activity.end_date >= date_obj,
            Activity.user_id == request.current_user.id
        ).all()
        
        # Combina e rimuovi duplicati
        all_activities = activities_starting + activities_multi_day
        unique_activities = list({activity.id: activity for activity in all_activities}.values())
        
        # Ordina per ora
        unique_activities.sort(key=lambda x: x.time or time.min, reverse=True)
        
        return jsonify([activity.to_dict() for activity in unique_activities])
    except ValueError:
        return jsonify({'error': 'Formato data non valido'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/activities/status/<status>', methods=['GET'])
@token_required
@rls_required
def get_activities_by_status(status):
    """Ottiene le attività per uno stato specifico"""
    try:
        if status not in Activity.get_valid_statuses():
            return jsonify({'error': 'Stato non valido'}), 400
        
        # Filtra per user_id dell'utente corrente
        activities = Activity.query.filter_by(status=status, user_id=request.current_user.id).order_by(Activity.date.desc(), Activity.time.desc()).all()
        return jsonify([activity.to_dict() for activity in activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/activities/stats', methods=['GET'])
@token_required
@rls_required
def get_activity_stats():
    """Ottiene le statistiche delle attività"""
    try:
        # Filtra per user_id dell'utente corrente
        user_id = request.current_user.id
        total = Activity.query.filter_by(user_id=user_id).count()
        da_fare = Activity.query.filter_by(status=ActivityStatus.DA_FARE.value, user_id=user_id).count()
        in_corso = Activity.query.filter_by(status=ActivityStatus.IN_CORSO.value, user_id=user_id).count()
        fatta = Activity.query.filter_by(status=ActivityStatus.FATTA.value, user_id=user_id).count()
        rimandata = Activity.query.filter_by(status=ActivityStatus.RIMANDATA.value, user_id=user_id).count()
        
        # Statistiche per priorità
        alta_priority = Activity.query.filter_by(priority=ActivityPriority.ALTA.value, user_id=user_id).count()
        media_priority = Activity.query.filter_by(priority=ActivityPriority.MEDIA.value, user_id=user_id).count()
        bassa_priority = Activity.query.filter_by(priority=ActivityPriority.BASSA.value, user_id=user_id).count()
        
        return jsonify({
            'total': total,
            'by_status': {
                'da_fare': da_fare,
                'in_corso': in_corso,
                'fatta': fatta,
                'rimandata': rimandata
            },
            'by_priority': {
                'alta': alta_priority,
                'media': media_priority,
                'bassa': bassa_priority
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/activities/categories', methods=['GET'])
@token_required
@rls_required
def get_categories():
    """Ottiene tutte le categorie utilizzate"""
    try:
        # Filtra per user_id dell'utente corrente
        categories = db.session.query(Activity.category).filter(Activity.category.isnot(None), Activity.user_id == request.current_user.id).distinct().all()
        return jsonify([cat[0] for cat in categories if cat[0]])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/health', methods=['GET'])
def health_check():
    """Endpoint di controllo dello stato del servizio"""
    return jsonify({
        'status': 'OK', 
        'message': 'Backend funzionante',
        'timestamp': datetime.utcnow().isoformat()
    })

@api.route('/rls/stats', methods=['GET'])
@token_required
def get_rls_statistics():
    """Ottiene le statistiche RLS"""
    try:
        from rls_manager import get_rls_stats
        stats = get_rls_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/rls/test', methods=['GET'])
@token_required
@admin_rls_required
def test_rls():
    """Test dell'isolamento RLS (solo admin)"""
    try:
        from rls_manager import test_rls_isolation
        test_results = test_rls_isolation()
        return jsonify({
            'message': 'Test RLS completato',
            'test_results': test_results,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
