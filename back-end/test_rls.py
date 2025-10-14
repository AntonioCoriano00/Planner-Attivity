#!/usr/bin/env python3
"""
Script di test per verificare il funzionamento di Row Level Security (RLS)
"""

import os
import sys
import sqlite3
import requests
import json
from datetime import datetime, date, time

# Aggiungi il percorso del progetto al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurazione
BASE_URL = "http://localhost:5000/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}
DEFAULT_CREDENTIALS = {"username": "default", "password": "password123"}

class RLSTester:
    """Tester per Row Level Security"""
    
    def __init__(self):
        self.admin_token = None
        self.default_token = None
        self.test_results = []
    
    def login_user(self, credentials):
        """Effettua login e restituisce il token"""
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=credentials)
            if response.status_code == 200:
                data = response.json()
                return data.get('token')
            else:
                print(f"❌ Login fallito: {response.json()}")
                return None
        except Exception as e:
            print(f"❌ Errore nel login: {e}")
            return None
    
    def setup_tokens(self):
        """Configura i token per admin e utente default"""
        print("🔐 Configurazione token di autenticazione...")
        
        self.admin_token = self.login_user(ADMIN_CREDENTIALS)
        self.default_token = self.login_user(DEFAULT_CREDENTIALS)
        
        if self.admin_token:
            print("✅ Token admin ottenuto")
        else:
            print("❌ Impossibile ottenere token admin")
        
        if self.default_token:
            print("✅ Token utente default ottenuto")
        else:
            print("❌ Impossibile ottenere token utente default")
        
        return self.admin_token and self.default_token
    
    def make_request(self, method, endpoint, token=None, data=None):
        """Effettua una richiesta HTTP"""
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Metodo HTTP non supportato: {method}")
            
            return response
        except Exception as e:
            print(f"❌ Errore nella richiesta {method} {endpoint}: {e}")
            return None
    
    def test_rls_stats(self):
        """Test delle statistiche RLS"""
        print("\n📊 Test statistiche RLS...")
        
        # Test con admin
        response = self.make_request('GET', '/rls/stats', self.admin_token)
        if response and response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistiche RLS (admin): {stats}")
            self.test_results.append("✅ Statistiche RLS funzionanti")
        else:
            print(f"❌ Errore statistiche RLS: {response.json() if response else 'Nessuna risposta'}")
            self.test_results.append("❌ Errore statistiche RLS")
        
        # Test con utente normale
        response = self.make_request('GET', '/rls/stats', self.default_token)
        if response and response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistiche RLS (utente): {stats}")
        else:
            print(f"❌ Errore statistiche RLS utente: {response.json() if response else 'Nessuna risposta'}")
    
    def test_activity_isolation(self):
        """Test dell'isolamento delle attività"""
        print("\n🔒 Test isolamento attività...")
        
        # Crea un'attività con admin
        admin_activity = {
            "title": "Attività Admin",
            "description": "Attività creata dall'admin",
            "date": "2024-01-15",
            "time": "10:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "admin"
        }
        
        response = self.make_request('POST', '/activities', self.admin_token, admin_activity)
        if response and response.status_code == 201:
            admin_activity_id = response.json().get('id')
            print(f"✅ Attività admin creata con ID: {admin_activity_id}")
        else:
            print(f"❌ Errore creazione attività admin: {response.json() if response else 'Nessuna risposta'}")
            return
        
        # Crea un'attività con utente default
        default_activity = {
            "title": "Attività Default",
            "description": "Attività creata dall'utente default",
            "date": "2024-01-15",
            "time": "14:00",
            "status": "da-fare",
            "priority": "media",
            "category": "default"
        }
        
        response = self.make_request('POST', '/activities', self.default_token, default_activity)
        if response and response.status_code == 201:
            default_activity_id = response.json().get('id')
            print(f"✅ Attività default creata con ID: {default_activity_id}")
        else:
            print(f"❌ Errore creazione attività default: {response.json() if response else 'Nessuna risposta'}")
            return
        
        # Test: Admin non dovrebbe vedere l'attività dell'utente default
        response = self.make_request('GET', f'/activities/{default_activity_id}', self.admin_token)
        if response and response.status_code == 404:
            print("✅ RLS: Admin non può vedere attività di altri utenti")
            self.test_results.append("✅ Isolamento attività funzionante")
        else:
            print(f"❌ RLS: Admin può vedere attività di altri utenti: {response.json() if response else 'Nessuna risposta'}")
            self.test_results.append("❌ Violazione isolamento attività")
        
        # Test: Utente default non dovrebbe vedere l'attività dell'admin
        response = self.make_request('GET', f'/activities/{admin_activity_id}', self.default_token)
        if response and response.status_code == 404:
            print("✅ RLS: Utente default non può vedere attività di altri utenti")
        else:
            print(f"❌ RLS: Utente default può vedere attività di altri utenti: {response.json() if response else 'Nessuna risposta'}")
        
        # Test: Ogni utente dovrebbe vedere solo le proprie attività
        response = self.make_request('GET', '/activities', self.admin_token)
        if response and response.status_code == 200:
            admin_activities = response.json()
            admin_activity_titles = [a['title'] for a in admin_activities]
            if "Attività Admin" in admin_activity_titles and "Attività Default" not in admin_activity_titles:
                print("✅ RLS: Admin vede solo le proprie attività")
            else:
                print(f"❌ RLS: Admin vede attività di altri utenti: {admin_activity_titles}")
        
        response = self.make_request('GET', '/activities', self.default_token)
        if response and response.status_code == 200:
            default_activities = response.json()
            default_activity_titles = [a['title'] for a in default_activities]
            if "Attività Default" in default_activity_titles and "Attività Admin" not in default_activity_titles:
                print("✅ RLS: Utente default vede solo le proprie attività")
            else:
                print(f"❌ RLS: Utente default vede attività di altri utenti: {default_activity_titles}")
    
    def test_database_level_isolation(self):
        """Test dell'isolamento a livello database"""
        print("\n🗄️  Test isolamento a livello database...")
        
        try:
            db_path = os.path.join('instance', 'planner_activities_dev.db')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Test 1: Verifica che i trigger RLS esistano
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='trigger' AND name LIKE 'rls_%'
            """)
            triggers = cursor.fetchall()
            
            if len(triggers) >= 4:  # Almeno 4 trigger per activities
                print(f"✅ Trigger RLS presenti: {[t[0] for t in triggers]}")
                self.test_results.append("✅ Trigger RLS configurati")
            else:
                print(f"❌ Trigger RLS mancanti. Trovati: {[t[0] for t in triggers]}")
                self.test_results.append("❌ Trigger RLS mancanti")
            
            # Test 2: Verifica che le viste protette esistano
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='view' AND name LIKE 'protected_%'
            """)
            views = cursor.fetchall()
            
            if len(views) >= 2:  # Almeno 2 viste protette
                print(f"✅ Viste protette presenti: {[v[0] for v in views]}")
                self.test_results.append("✅ Viste protette configurate")
            else:
                print(f"❌ Viste protette mancanti. Trovate: {[v[0] for v in views]}")
                self.test_results.append("❌ Viste protette mancanti")
            
            # Test 3: Verifica che le policy RLS esistano
            cursor.execute("SELECT COUNT(*) FROM rls_policies WHERE is_active = 1")
            policy_count = cursor.fetchone()[0]
            
            if policy_count >= 6:  # Almeno 6 policy attive
                print(f"✅ Policy RLS attive: {policy_count}")
                self.test_results.append("✅ Policy RLS configurate")
            else:
                print(f"❌ Policy RLS insufficienti. Trovate: {policy_count}")
                self.test_results.append("❌ Policy RLS insufficienti")
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Errore nel test database: {e}")
            self.test_results.append(f"❌ Errore test database: {e}")
    
    def test_admin_rls_test_endpoint(self):
        """Test dell'endpoint di test RLS (solo admin)"""
        print("\n🧪 Test endpoint test RLS...")
        
        # Test con admin
        response = self.make_request('GET', '/rls/test', self.admin_token)
        if response and response.status_code == 200:
            test_data = response.json()
            print(f"✅ Test RLS (admin): {test_data}")
            self.test_results.append("✅ Endpoint test RLS funzionante")
        else:
            print(f"❌ Errore test RLS admin: {response.json() if response else 'Nessuna risposta'}")
            self.test_results.append("❌ Errore endpoint test RLS")
        
        # Test con utente normale (dovrebbe fallire)
        response = self.make_request('GET', '/rls/test', self.default_token)
        if response and response.status_code == 403:
            print("✅ RLS: Utente normale non può accedere al test RLS")
        else:
            print(f"❌ RLS: Utente normale può accedere al test RLS: {response.json() if response else 'Nessuna risposta'}")
    
    def run_all_tests(self):
        """Esegue tutti i test RLS"""
        print("=" * 70)
        print("🧪 TEST ROW LEVEL SECURITY (RLS)")
        print("=" * 70)
        print(f"⏰ Data e ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Setup
        if not self.setup_tokens():
            print("❌ Impossibile configurare i token. Test interrotti.")
            return
        
        # Esegui tutti i test
        self.test_rls_stats()
        self.test_activity_isolation()
        self.test_database_level_isolation()
        self.test_admin_rls_test_endpoint()
        
        # Risultati finali
        print("\n" + "=" * 70)
        print("📋 RISULTATI FINALI")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result.startswith("✅"))
        total = len(self.test_results)
        
        for result in self.test_results:
            print(result)
        
        print(f"\n📊 Test superati: {passed}/{total}")
        
        if passed == total:
            print("🎉 TUTTI I TEST RLS SUPERATI!")
            print("✅ Row Level Security funziona correttamente")
        else:
            print("⚠️  ALCUNI TEST FALLITI")
            print("❌ Verificare la configurazione RLS")
        
        print("=" * 70)

def main():
    """Funzione principale"""
    tester = RLSTester()
    tester.run_all_tests()

if __name__ == '__main__':
    main()
