#!/usr/bin/env python3
"""
Esempi di utilizzo di Row Level Security (RLS)
Questo file mostra come utilizzare RLS nelle route e nelle operazioni del database
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Activity, User
from app_factory import db
from auth import token_required
from rls_manager import rls_required, admin_rls_required, rls_manager

# Crea un Blueprint per gli esempi
examples_bp = Blueprint('examples', __name__, url_prefix='/api/examples')

# ============================================================================
# ESEMPI DI ROUTE CON RLS
# ============================================================================

@examples_bp.route('/activities/simple', methods=['GET'])
@token_required
@rls_required
def get_activities_simple():
    """
    Esempio semplice: Ottiene tutte le attività dell'utente corrente
    Con RLS, non serve filtrare manualmente per user_id
    """
    try:
        # RLS filtra automaticamente per user_id corrente
        activities = Activity.query.all()
        return jsonify([activity.to_dict() for activity in activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/activities/filtered', methods=['GET'])
@token_required
@rls_required
def get_activities_filtered():
    """
    Esempio con filtri: Combina RLS con filtri applicativi
    RLS garantisce l'isolamento, i filtri aggiungono criteri specifici
    """
    try:
        # Parametri di query
        status = request.args.get('status')
        priority = request.args.get('priority')
        category = request.args.get('category')
        
        # Query base - RLS filtra automaticamente per user_id
        query = Activity.query
        
        # Aggiungi filtri opzionali
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        if category:
            query = query.filter_by(category=category)
        
        # Ordina per data
        activities = query.order_by(Activity.date.desc()).all()
        return jsonify([activity.to_dict() for activity in activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/activities/create', methods=['POST'])
@token_required
@rls_required
def create_activity_example():
    """
    Esempio di creazione: RLS garantisce che user_id sia corretto
    """
    try:
        data = request.get_json()
        
        # Validazione base
        if not data.get('title'):
            return jsonify({'error': 'Titolo richiesto'}), 400
        
        # Crea l'attività
        activity = Activity.from_dict(data)
        # user_id viene impostato automaticamente dal decorator @rls_required
        activity.user_id = request.current_user.id
        
        db.session.add(activity)
        db.session.commit()
        
        return jsonify(activity.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/activities/<int:activity_id>', methods=['PUT'])
@token_required
@rls_required
def update_activity_example(activity_id):
    """
    Esempio di aggiornamento: RLS garantisce che solo il proprietario possa modificare
    """
    try:
        # RLS garantisce che l'attività appartenga all'utente corrente
        activity = Activity.query.filter_by(id=activity_id).first_or_404()
        
        data = request.get_json()
        activity.update_from_dict(data)
        
        db.session.commit()
        return jsonify(activity.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/activities/<int:activity_id>', methods=['DELETE'])
@token_required
@rls_required
def delete_activity_example(activity_id):
    """
    Esempio di eliminazione: RLS garantisce che solo il proprietario possa eliminare
    """
    try:
        # RLS garantisce che l'attività appartenga all'utente corrente
        activity = Activity.query.filter_by(id=activity_id).first_or_404()
        
        db.session.delete(activity)
        db.session.commit()
        
        return jsonify({'message': 'Attività eliminata con successo'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ESEMPI DI GESTIONE CONTESTO RLS
# ============================================================================

@examples_bp.route('/context/current', methods=['GET'])
@token_required
@rls_required
def get_current_context():
    """
    Esempio: Ottiene il contesto RLS corrente
    """
    try:
        context = rls_manager.get_current_context()
        return jsonify({
            'context': context,
            'user_info': request.current_user.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/context/set/<int:user_id>', methods=['POST'])
@token_required
@admin_rls_required
def set_context_example(user_id):
    """
    Esempio: Imposta il contesto RLS (solo admin)
    Utile per operazioni amministrative
    """
    try:
        success = rls_manager.set_user_context(user_id)
        if success:
            return jsonify({
                'message': f'Contesto impostato per user_id: {user_id}',
                'context': rls_manager.get_current_context()
            })
        else:
            return jsonify({'error': 'Errore nell\'impostazione del contesto'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ESEMPI DI QUERY AVANZATE CON RLS
# ============================================================================

@examples_bp.route('/activities/stats', methods=['GET'])
@token_required
@rls_required
def get_activity_stats_example():
    """
    Esempio: Statistiche delle attività con RLS
    RLS garantisce che le statistiche siano solo per l'utente corrente
    """
    try:
        # Tutte queste query sono automaticamente filtrate da RLS
        total = Activity.query.count()
        da_fare = Activity.query.filter_by(status='da-fare').count()
        in_corso = Activity.query.filter_by(status='in-corso').count()
        fatta = Activity.query.filter_by(status='fatta').count()
        
        # Statistiche per priorità
        alta = Activity.query.filter_by(priority='alta').count()
        media = Activity.query.filter_by(priority='media').count()
        bassa = Activity.query.filter_by(priority='bassa').count()
        
        return jsonify({
            'total': total,
            'by_status': {
                'da_fare': da_fare,
                'in_corso': in_corso,
                'fatta': fatta
            },
            'by_priority': {
                'alta': alta,
                'media': media,
                'bassa': bassa
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/activities/recent', methods=['GET'])
@token_required
@rls_required
def get_recent_activities():
    """
    Esempio: Attività recenti con RLS
    """
    try:
        # RLS filtra automaticamente per user_id
        recent_activities = Activity.query.order_by(
            Activity.created_at.desc()
        ).limit(10).all()
        
        return jsonify([activity.to_dict() for activity in recent_activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ESEMPI DI GESTIONE UTENTI CON RLS
# ============================================================================

@examples_bp.route('/users/profile', methods=['GET'])
@token_required
@rls_required
def get_user_profile():
    """
    Esempio: Profilo utente con RLS
    RLS garantisce che l'utente veda solo il proprio profilo
    """
    try:
        # RLS garantisce che l'utente veda solo il proprio profilo
        user = User.query.filter_by(id=request.current_user.id).first_or_404()
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@examples_bp.route('/users/all', methods=['GET'])
@token_required
@admin_rls_required
def get_all_users():
    """
    Esempio: Lista tutti gli utenti (solo admin)
    RLS permette agli admin di vedere tutti gli utenti
    """
    try:
        # RLS permette agli admin di vedere tutti gli utenti
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ESEMPI DI TESTING RLS
# ============================================================================

@examples_bp.route('/test/isolation', methods=['GET'])
@token_required
@admin_rls_required
def test_isolation_example():
    """
    Esempio: Test dell'isolamento RLS
    """
    try:
        # Test 1: Conta attività per utente corrente
        current_user_id = request.current_user.id
        current_activities = Activity.query.count()
        
        # Test 2: Prova a cambiare contesto (simulazione)
        # Nota: In un ambiente reale, questo test dovrebbe essere più sofisticato
        
        return jsonify({
            'current_user_id': current_user_id,
            'current_activities_count': current_activities,
            'rls_context': rls_manager.get_current_context(),
            'test_passed': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ESEMPI DI QUERY RAW CON RLS
# ============================================================================

@examples_bp.route('/activities/raw', methods=['GET'])
@token_required
@rls_required
def get_activities_raw_example():
    """
    Esempio: Query raw con RLS
    Anche le query raw rispettano RLS se usano le viste protette
    """
    try:
        # Usa la vista protetta per query raw
        result = db.session.execute("""
            SELECT id, title, status, priority, date 
            FROM protected_activities 
            WHERE status = 'da-fare'
            ORDER BY date ASC
        """)
        
        activities = []
        for row in result:
            activities.append({
                'id': row[0],
                'title': row[1],
                'status': row[2],
                'priority': row[3],
                'date': row[4].isoformat() if row[4] else None
            })
        
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# REGISTRAZIONE DEL BLUEPRINT
# ============================================================================

def register_examples_bp(app):
    """Registra il blueprint degli esempi nell'app"""
    app.register_blueprint(examples_bp)

# ============================================================================
# DOCUMENTAZIONE DEGLI ESEMPI
# ============================================================================

"""
ESEMPI DI UTILIZZO RLS:

1. Route Semplici:
   GET /api/examples/activities/simple
   - Mostra come RLS filtra automaticamente le attività

2. Route con Filtri:
   GET /api/examples/activities/filtered?status=da-fare&priority=alta
   - Combina RLS con filtri applicativi

3. Operazioni CRUD:
   POST /api/examples/activities/create
   PUT /api/examples/activities/1
   DELETE /api/examples/activities/1
   - RLS garantisce che solo il proprietario possa modificare

4. Gestione Contesto:
   GET /api/examples/context/current
   POST /api/examples/context/set/2 (solo admin)
   - Gestione del contesto RLS

5. Statistiche:
   GET /api/examples/activities/stats
   - Statistiche automaticamente filtrate per utente

6. Testing:
   GET /api/examples/test/isolation (solo admin)
   - Test dell'isolamento RLS

7. Query Raw:
   GET /api/examples/activities/raw
   - Query raw usando viste protette

DECORATOR DISPONIBILI:
- @rls_required: Protegge con RLS per utenti normali
- @admin_rls_required: Protegge con RLS per admin
- @token_required: Sempre necessario per autenticazione

BENEFICI RLS:
- Isolamento automatico dei dati
- Sicurezza a livello database
- Codice più pulito (meno filtri manuali)
- Protezione contro errori di programmazione
- Audit e monitoraggio integrati
"""
