from datetime import datetime
from enum import Enum
from app_factory import db
from werkzeug.security import generate_password_hash, check_password_hash

class ActivityStatus(Enum):
    """Enum per gli stati delle attività"""
    DA_FARE = 'da-fare'
    IN_CORSO = 'in-corso'
    FATTA = 'fatta'
    RIMANDATA = 'rimandata'

class ActivityPriority(Enum):
    """Enum per le priorità delle attività"""
    BASSA = 'bassa'
    MEDIA = 'media'
    ALTA = 'alta'

class User(db.Model):
    """Modello per gli utenti del sistema"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    is_admin = db.Column(db.Boolean, default=False, index=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        """Imposta la password hash"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica la password"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Converte l'oggetto User in un dizionario"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'isActive': self.is_active,
            'isAdmin': self.is_admin
        }

class Activity(db.Model):
    """Modello per le attività del planner"""
    __tablename__ = 'activities'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False, index=True)
    time = db.Column(db.Time, index=True)
    end_date = db.Column(db.Date, index=True)
    end_time = db.Column(db.Time, index=True)
    is_multi_day = db.Column(db.Boolean, default=False, index=True)
    is_multi_hour = db.Column(db.Boolean, default=False, index=True)
    status = db.Column(db.String(20), default=ActivityStatus.DA_FARE.value, index=True)
    priority = db.Column(db.String(20), default=ActivityPriority.MEDIA.value, index=True)
    category = db.Column(db.String(100), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relazione con User
    user = db.relationship('User', backref=db.backref('activities', lazy=True))

    def __repr__(self):
        return f'<Activity {self.id}: {self.title}>'

    def to_dict(self):
        """Converte l'oggetto Activity in un dizionario"""
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

    @classmethod
    def from_dict(cls, data):
        """Crea un'istanza di Activity da un dizionario"""
        activity = cls()
        activity.title = data.get('title')
        activity.description = data.get('description', '')
        activity.status = data.get('status', ActivityStatus.DA_FARE.value)
        activity.priority = data.get('priority', ActivityPriority.MEDIA.value)
        activity.category = data.get('category', '')
        activity.is_multi_day = data.get('isMultiDay', False)
        activity.is_multi_hour = data.get('isMultiHour', False)
        
        if data.get('date'):
            activity.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        if data.get('time'):
            activity.time = datetime.strptime(data['time'], '%H:%M').time()
        
        if data.get('endDate'):
            activity.end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        
        if data.get('endTime'):
            activity.end_time = datetime.strptime(data['endTime'], '%H:%M').time()
        
        return activity

    def update_from_dict(self, data):
        """Aggiorna l'istanza di Activity da un dizionario"""
        if 'title' in data:
            self.title = data['title']
        if 'description' in data:
            self.description = data['description']
        if 'date' in data:
            self.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'time' in data:
            if data['time']:
                self.time = datetime.strptime(data['time'], '%H:%M').time()
            else:
                self.time = None
        if 'endDate' in data:
            if data['endDate']:
                self.end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
            else:
                self.end_date = None
        if 'endTime' in data:
            if data['endTime']:
                self.end_time = datetime.strptime(data['endTime'], '%H:%M').time()
            else:
                self.end_time = None
        if 'isMultiDay' in data:
            self.is_multi_day = data['isMultiDay']
        if 'isMultiHour' in data:
            self.is_multi_hour = data['isMultiHour']
        if 'status' in data:
            self.status = data['status']
        if 'priority' in data:
            self.priority = data['priority']
        if 'category' in data:
            self.category = data['category']
        
        self.updated_at = datetime.utcnow()

    @staticmethod
    def get_valid_statuses():
        """Restituisce la lista degli stati validi"""
        return [status.value for status in ActivityStatus]

    @staticmethod
    def get_valid_priorities():
        """Restituisce la lista delle priorità valide"""
        return [priority.value for priority in ActivityPriority]
