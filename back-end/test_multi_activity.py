#!/usr/bin/env python3
"""
Script di test per le attività multi-giorno e multi-ora
"""
import requests
import json
from datetime import datetime, date, time, timedelta

# URL base dell'API
BASE_URL = "http://localhost:5000/api"

def test_create_multi_day_activity():
    """Test di creazione di un'attività multi-giorno"""
    print("Test Creazione Attività Multi-Giorno...")
    
    # Attività che inizia oggi e finisce tra 3 giorni
    today = date.today()
    end_date = today + timedelta(days=3)
    
    activity_data = {
        "title": "Progetto Multi-Giorno",
        "description": "Un progetto che si estende su più giorni",
        "date": today.isoformat(),
        "time": "09:00",
        "endDate": end_date.isoformat(),
        "endTime": "17:00",
        "isMultiDay": True,
        "isMultiHour": True,
        "status": "in-corso",
        "priority": "alta",
        "category": "Progetto"
    }
    
    response = requests.post(f"{BASE_URL}/activities", json=activity_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        return response.json()['id']
    return None

def test_create_multi_hour_activity():
    """Test di creazione di un'attività multi-ora"""
    print("Test Creazione Attività Multi-Ora...")
    
    today = date.today()
    
    activity_data = {
        "title": "Riunione Lunga",
        "description": "Una riunione che dura diverse ore",
        "date": today.isoformat(),
        "time": "10:00",
        "endTime": "15:00",
        "isMultiHour": True,
        "status": "da-fare",
        "priority": "media",
        "category": "Riunione"
    }
    
    response = requests.post(f"{BASE_URL}/activities", json=activity_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        return response.json()['id']
    return None

def test_get_activities_by_date():
    """Test di recupero attività per data specifica"""
    print("Test Recupero Attività per Data...")
    
    today = date.today()
    tomorrow = today + timedelta(days=1)
    day_after_tomorrow = today + timedelta(days=2)
    
    # Test per oggi
    print(f"\n--- Attività per oggi ({today.isoformat()}) ---")
    response = requests.get(f"{BASE_URL}/activities/date/{today.isoformat()}")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività per oggi")
    for activity in activities:
        print(f"  - {activity['title']} ({activity['date']} - {activity.get('endDate', 'N/A')})")
    
    # Test per domani
    print(f"\n--- Attività per domani ({tomorrow.isoformat()}) ---")
    response = requests.get(f"{BASE_URL}/activities/date/{tomorrow.isoformat()}")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività per domani")
    for activity in activities:
        print(f"  - {activity['title']} ({activity['date']} - {activity.get('endDate', 'N/A')})")
    
    # Test per dopodomani
    print(f"\n--- Attività per dopodomani ({day_after_tomorrow.isoformat()}) ---")
    response = requests.get(f"{BASE_URL}/activities/date/{day_after_tomorrow.isoformat()}")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività per dopodomani")
    for activity in activities:
        print(f"  - {activity['title']} ({activity['date']} - {activity.get('endDate', 'N/A')})")

def test_get_all_activities():
    """Test di recupero di tutte le attività"""
    print("Test Recupero Tutte le Attività...")
    response = requests.get(f"{BASE_URL}/activities")
    print(f"Status: {response.status_code}")
    activities = response.json()
    print(f"Trovate {len(activities)} attività totali")
    
    print("\n--- Dettagli Attività ---")
    for activity in activities:
        print(f"ID: {activity['id']}")
        print(f"Titolo: {activity['title']}")
        print(f"Data inizio: {activity['date']}")
        print(f"Data fine: {activity.get('endDate', 'N/A')}")
        print(f"Ora inizio: {activity.get('time', 'N/A')}")
        print(f"Ora fine: {activity.get('endTime', 'N/A')}")
        print(f"Multi-giorno: {activity.get('isMultiDay', False)}")
        print(f"Multi-ora: {activity.get('isMultiHour', False)}")
        print(f"Stato: {activity['status']}")
        print("---")

def main():
    """Esegue tutti i test per le attività multi"""
    print("Avvio Test Attività Multi-Giorno e Multi-Ora")
    print("=" * 60)
    
    try:
        # Test di base
        print("Test Health Check...")
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
        
        # Test creazione attività multi
        multi_day_id = test_create_multi_day_activity()
        print()
        
        multi_hour_id = test_create_multi_hour_activity()
        print()
        
        # Test recupero attività
        test_get_all_activities()
        print()
        
        test_get_activities_by_date()
        print()
        
        print("Tutti i test completati!")
        print("\nVerifica ora le dashboard del frontend per vedere se le attività multi-giorno")
        print("vengono visualizzate correttamente in tutti i giorni del periodo!")
        
    except requests.exceptions.ConnectionError:
        print("Errore: Impossibile connettersi al server")
        print("Assicurati che il server sia in esecuzione su http://localhost:5000")
    except Exception as e:
        print(f"Errore durante i test: {e}")

if __name__ == "__main__":
    main()