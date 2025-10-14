#!/usr/bin/env python3
"""
Script per testare il flusso completo: login -> crea attività -> verifica
"""

import requests
import json
from datetime import datetime, date

def test_full_flow():
    """Testa il flusso completo"""
    base_url = "http://localhost:5000/api"
    
    print("=" * 60)
    print("🧪 TEST FLUSSO COMPLETO")
    print("=" * 60)
    print()
    
    # 1. Test login
    print("1️⃣ Test login...")
    login_data = {
        "username": "testuser",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print("✅ Login riuscito!")
            print(f"   Token: {token[:20]}...")
        else:
            print(f"❌ Login fallito: {response.status_code}")
            print(f"   Errore: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Errore di connessione: {e}")
        return False
    
    # 2. Test creazione attività
    print("\n2️⃣ Test creazione attività...")
    activity_data = {
        "title": "Test Activity",
        "description": "Attività di test",
        "date": date.today().isoformat(),
        "time": "10:00",
        "status": "da-fare",
        "priority": "media",
        "category": "test"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{base_url}/activities", json=activity_data, headers=headers)
        if response.status_code == 201:
            activity = response.json()
            print("✅ Attività creata!")
            print(f"   ID: {activity.get('id')}")
            print(f"   Titolo: {activity.get('title')}")
            activity_id = activity.get('id')
        else:
            print(f"❌ Creazione attività fallita: {response.status_code}")
            print(f"   Errore: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Errore nella creazione: {e}")
        return False
    
    # 3. Test recupero attività
    print("\n3️⃣ Test recupero attività...")
    try:
        response = requests.get(f"{base_url}/activities", headers=headers)
        if response.status_code == 200:
            activities = response.json()
            print(f"✅ Recupero riuscito! Trovate {len(activities)} attività")
            if activities:
                print("   Prima attività:")
                first = activities[0]
                print(f"   - ID: {first.get('id')}")
                print(f"   - Titolo: {first.get('title')}")
                print(f"   - Data: {first.get('date')}")
        else:
            print(f"❌ Recupero fallito: {response.status_code}")
            print(f"   Errore: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Errore nel recupero: {e}")
        return False
    
    print("\n🎉 Tutti i test sono passati!")
    return True

if __name__ == '__main__':
    test_full_flow()
