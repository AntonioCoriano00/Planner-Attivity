#!/usr/bin/env python3
"""
Script per testare le funzionalità admin
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def test_admin_functionality():
    """Testa le funzionalità admin"""
    print("🧪 Test delle funzionalità admin")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Test health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check fallito: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Errore health check: {e}")
        return False
    
    # Test 2: Login admin
    print("\n2. Test login admin...")
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            print("✅ Login admin OK")
            print(f"   Username: {user.get('username')}")
            print(f"   Is Admin: {user.get('isAdmin')}")
        else:
            print(f"❌ Login admin fallito: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Errore login admin: {e}")
        return False
    
    # Test 3: Test endpoint admin (dashboard)
    print("\n3. Test dashboard admin...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Dashboard admin OK")
            print(f"   Utenti recenti: {len(data.get('recent_users', []))}")
            print(f"   Attività recenti: {len(data.get('recent_activities', []))}")
        else:
            print(f"❌ Dashboard admin fallita: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Errore dashboard admin: {e}")
    
    # Test 4: Test lista utenti
    print("\n4. Test lista utenti...")
    try:
        response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print("✅ Lista utenti OK")
            print(f"   Totale utenti: {data.get('total', 0)}")
            for user in users:
                admin_status = "Admin" if user.get('isAdmin') else "User"
                active_status = "Attivo" if user.get('isActive') else "Inattivo"
                print(f"   - {user.get('username')} ({admin_status}, {active_status})")
        else:
            print(f"❌ Lista utenti fallita: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Errore lista utenti: {e}")
    
    # Test 5: Test statistiche
    print("\n5. Test statistiche...")
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Statistiche OK")
            print(f"   Totale utenti: {data.get('users', {}).get('total', 0)}")
            print(f"   Utenti attivi: {data.get('users', {}).get('active', 0)}")
            print(f"   Admin: {data.get('users', {}).get('admins', 0)}")
            print(f"   Totale attività: {data.get('activities', {}).get('total', 0)}")
        else:
            print(f"❌ Statistiche fallite: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Errore statistiche: {e}")
    
    # Test 6: Test creazione utente
    print("\n6. Test creazione utente...")
    try:
        new_user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "is_admin": False,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/admin/users", json=new_user_data, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Creazione utente OK")
            print(f"   Nuovo utente: {data.get('user', {}).get('username')}")
        else:
            print(f"❌ Creazione utente fallita: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Errore creazione utente: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completati!")
    return True

if __name__ == '__main__':
    print("Aspetto che il backend si avvii...")
    time.sleep(3)
    test_admin_functionality()
