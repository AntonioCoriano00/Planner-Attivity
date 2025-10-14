#!/usr/bin/env python3
"""
Script di test per l'API del backend
"""
import requests
import json
from datetime import datetime, date, time

# URL base dell'API
BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test dell'endpoint di health check"""
    print("🔍 Test Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_create_activity():
    """Test di creazione di un'attività"""
    print("🔍 Test Creazione Attività...")
    
    activity_data = {
        "title": "Test Attività",
        "description": "Questa è un'attività di test",
        "date": "2024-01-15",
        "time": "14:30",
        "status": "da-fare",
        "priority": "alta",
        "category": "Test"
    }
    
    response = requests.post(f"{BASE_URL}/activities", json=activity_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        return response.json()['id']
    return None

def test_get_activities():
    """Test di recupero di tutte le attività"""
    print("🔍 Test Recupero Attività...")
    response = requests.get(f"{BASE_URL}/activities")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività")
    if activities:
        print(f"Prima attività: {activities[0]['title']}")
    print()

def test_get_activity_by_id(activity_id):
    """Test di recupero di un'attività per ID"""
    if not activity_id:
        print("❌ Nessun ID attività disponibile per il test")
        return
    
    print(f"🔍 Test Recupero Attività ID {activity_id}...")
    response = requests.get(f"{BASE_URL}/activities/{activity_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_update_activity(activity_id):
    """Test di aggiornamento di un'attività"""
    if not activity_id:
        print("❌ Nessun ID attività disponibile per il test")
        return
    
    print(f"🔍 Test Aggiornamento Attività ID {activity_id}...")
    
    update_data = {
        "title": "Attività Aggiornata",
        "status": "in-corso",
        "priority": "media"
    }
    
    response = requests.put(f"{BASE_URL}/activities/{activity_id}", json=update_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_update_status(activity_id):
    """Test di aggiornamento solo dello stato"""
    if not activity_id:
        print("❌ Nessun ID attività disponibile per il test")
        return
    
    print(f"🔍 Test Aggiornamento Stato Attività ID {activity_id}...")
    
    status_data = {"status": "fatta"}
    response = requests.patch(f"{BASE_URL}/activities/{activity_id}/status", json=status_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_activities_by_date():
    """Test di recupero attività per data"""
    print("🔍 Test Recupero Attività per Data...")
    response = requests.get(f"{BASE_URL}/activities/date/2024-01-15")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività per la data 2024-01-15")
    print()

def test_get_activities_by_status():
    """Test di recupero attività per stato"""
    print("🔍 Test Recupero Attività per Stato...")
    response = requests.get(f"{BASE_URL}/activities/status/fatta")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività con stato 'fatta'")
    print()

def test_get_stats():
    """Test di recupero statistiche"""
    print("🔍 Test Recupero Statistiche...")
    response = requests.get(f"{BASE_URL}/activities/stats")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_categories():
    """Test di recupero categorie"""
    print("🔍 Test Recupero Categorie...")
    response = requests.get(f"{BASE_URL}/activities/categories")
    print(f"Status: {response.status_code}")
    categories = response.json()
    print(f"Categorie trovate: {categories}")
    print()

def test_delete_activity(activity_id):
    """Test di eliminazione di un'attività"""
    if not activity_id:
        print("❌ Nessun ID attività disponibile per il test")
        return
    
    print(f"🔍 Test Eliminazione Attività ID {activity_id}...")
    response = requests.delete(f"{BASE_URL}/activities/{activity_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def main():
    """Esegue tutti i test"""
    print("🚀 Avvio Test API Backend Planner Attività")
    print("=" * 50)
    
    try:
        # Test di base
        test_health()
        
        # Test CRUD
        activity_id = test_create_activity()
        test_get_activities()
        test_get_activity_by_id(activity_id)
        test_update_activity(activity_id)
        test_update_status(activity_id)
        
        # Test filtri e ricerche
        test_get_activities_by_date()
        test_get_activities_by_status()
        test_get_stats()
        test_get_categories()
        
        # Test eliminazione
        test_delete_activity(activity_id)
        
        print("✅ Tutti i test completati!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Errore: Impossibile connettersi al server")
        print("Assicurati che il server sia in esecuzione su http://localhost:5000")
    except Exception as e:
        print(f"❌ Errore durante i test: {e}")

if __name__ == "__main__":
    main()
