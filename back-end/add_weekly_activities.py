#!/usr/bin/env python3
"""
Script per aggiungere attività settimanali al database del planner
"""
import requests
import json
from datetime import datetime, date, timedelta

# URL base dell'API
BASE_URL = "http://localhost:5000/api"

def add_weekly_activities():
    """Aggiunge attività per tutta la settimana"""
    
    # Calcola le date della settimana corrente
    today = date.today()
    # Trova il lunedì della settimana corrente
    monday = today - timedelta(days=today.weekday())
    
    # Attività settimanali con categorie diverse
    weekly_activities = [
        # LUNEDÌ
        {
            "title": "Riunione team settimanale",
            "description": "Discussione obiettivi e priorità della settimana",
            "date": (monday + timedelta(days=0)).isoformat(),
            "time": "09:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Lavoro"
        },
        {
            "title": "Spesa settimanale",
            "description": "Acquisto generi alimentari per la settimana",
            "date": (monday + timedelta(days=0)).isoformat(),
            "time": "18:30",
            "status": "da-fare",
            "priority": "media",
            "category": "Casa"
        },
        {
            "title": "Palestra",
            "description": "Allenamento cardio e pesi",
            "date": (monday + timedelta(days=0)).isoformat(),
            "time": "19:30",
            "status": "da-fare",
            "priority": "media",
            "category": "Salute"
        },
        
        # MARTEDÌ
        {
            "title": "Presentazione progetto",
            "description": "Presentazione del nuovo progetto al cliente",
            "date": (monday + timedelta(days=1)).isoformat(),
            "time": "14:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Lavoro"
        },
        {
            "title": "Chiamata con il dentista",
            "description": "Prenotazione controllo dentistico",
            "date": (monday + timedelta(days=1)).isoformat(),
            "time": "10:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Salute"
        },
        {
            "title": "Lettura serale",
            "description": "Leggere 30 minuti del nuovo libro",
            "date": (monday + timedelta(days=1)).isoformat(),
            "time": "21:00",
            "status": "da-fare",
            "priority": "bassa",
            "category": "Tempo libero"
        },
        
        # MERCOLEDÌ
        {
            "title": "Revisione codice",
            "description": "Controllo e revisione del codice del team",
            "date": (monday + timedelta(days=2)).isoformat(),
            "time": "10:30",
            "status": "da-fare",
            "priority": "alta",
            "category": "Lavoro"
        },
        {
            "title": "Cena con amici",
            "description": "Cena al ristorante con il gruppo di amici",
            "date": (monday + timedelta(days=2)).isoformat(),
            "time": "20:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Sociale"
        },
        {
            "title": "Pulizia casa",
            "description": "Pulizia generale degli ambienti",
            "date": (monday + timedelta(days=2)).isoformat(),
            "time": "16:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Casa"
        },
        
        # GIOVEDÌ
        {
            "title": "Meeting con il cliente",
            "description": "Discussione dettagli del progetto in corso",
            "date": (monday + timedelta(days=3)).isoformat(),
            "time": "11:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Lavoro"
        },
        {
            "title": "Corso di cucina",
            "description": "Lezione di cucina italiana avanzata",
            "date": (monday + timedelta(days=3)).isoformat(),
            "time": "19:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Hobby"
        },
        {
            "title": "Chiamata ai genitori",
            "description": "Telefonata settimanale ai genitori",
            "date": (monday + timedelta(days=3)).isoformat(),
            "time": "20:30",
            "status": "da-fare",
            "priority": "media",
            "category": "Famiglia"
        },
        
        # VENERDÌ
        {
            "title": "Consegna progetto",
            "description": "Finalizzazione e consegna del progetto settimanale",
            "date": (monday + timedelta(days=4)).isoformat(),
            "time": "17:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Lavoro"
        },
        {
            "title": "Cinema",
            "description": "Visione del nuovo film in uscita",
            "date": (monday + timedelta(days=4)).isoformat(),
            "time": "21:30",
            "status": "da-fare",
            "priority": "bassa",
            "category": "Tempo libero"
        },
        {
            "title": "Pianificazione weekend",
            "description": "Organizzazione delle attività del weekend",
            "date": (monday + timedelta(days=4)).isoformat(),
            "time": "18:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Pianificazione"
        },
        
        # SABATO
        {
            "title": "Escursione in montagna",
            "description": "Trekking di mezza giornata in montagna",
            "date": (monday + timedelta(days=5)).isoformat(),
            "time": "08:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Sport"
        },
        {
            "title": "Pranzo con la famiglia",
            "description": "Pranzo domenicale con tutta la famiglia",
            "date": (monday + timedelta(days=5)).isoformat(),
            "time": "13:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Famiglia"
        },
        {
            "title": "Shopping",
            "description": "Acquisto vestiti per la stagione",
            "date": (monday + timedelta(days=5)).isoformat(),
            "time": "15:30",
            "status": "da-fare",
            "priority": "bassa",
            "category": "Shopping"
        },
        
        # DOMENICA
        {
            "title": "Relax e riposo",
            "description": "Giornata di riposo e relax totale",
            "date": (monday + timedelta(days=6)).isoformat(),
            "time": "10:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Tempo libero"
        },
        {
            "title": "Preparazione settimana",
            "description": "Pianificazione e preparazione per la settimana successiva",
            "date": (monday + timedelta(days=6)).isoformat(),
            "time": "16:00",
            "status": "da-fare",
            "priority": "media",
            "category": "Pianificazione"
        },
        {
            "title": "Cena romantica",
            "description": "Cena romantica con il partner",
            "date": (monday + timedelta(days=6)).isoformat(),
            "time": "20:00",
            "status": "da-fare",
            "priority": "alta",
            "category": "Relazioni"
        }
    ]
    
    print("Aggiunta attività settimanali al database...")
    print(f"Data inizio settimana: {monday}")
    print(f"Numero totale attività: {len(weekly_activities)}")
    print()
    
    created_activities = []
    failed_activities = []
    
    for i, activity in enumerate(weekly_activities, 1):
        try:
            print(f"[{i:2d}/{len(weekly_activities)}] Aggiungendo: {activity['title']} - {activity['date']}")
            
            response = requests.post(f"{BASE_URL}/activities", json=activity)
            
            if response.status_code == 201:
                created_activity = response.json()
                created_activities.append(created_activity)
                print(f"    ✓ Creata con ID: {created_activity['id']}")
            else:
                print(f"    ✗ Errore: {response.status_code} - {response.text}")
                failed_activities.append(activity)
                
        except requests.exceptions.ConnectionError:
            print(f"    ✗ Errore di connessione al server")
            failed_activities.append(activity)
        except Exception as e:
            print(f"    ✗ Errore: {e}")
            failed_activities.append(activity)
    
    print()
    print("=" * 50)
    print("RIEPILOGO:")
    print(f"Attività create con successo: {len(created_activities)}")
    print(f"Attività fallite: {len(failed_activities)}")
    
    if created_activities:
        print("\nAttività create:")
        for activity in created_activities:
            print(f"  - ID {activity['id']}: {activity['title']} ({activity['date']})")
    
    if failed_activities:
        print("\nAttività fallite:")
        for activity in failed_activities:
            print(f"  - {activity['title']} ({activity['date']})")
    
    return created_activities, failed_activities

def get_activities_summary():
    """Ottiene un riepilogo delle attività nel database"""
    try:
        response = requests.get(f"{BASE_URL}/activities/stats")
        if response.status_code == 200:
            stats = response.json()
            print("\nSTATISTICHE DATABASE:")
            print(f"Totale attività: {stats['total']}")
            print("Per stato:")
            for status, count in stats['by_status'].items():
                print(f"  - {status}: {count}")
            print("Per priorità:")
            for priority, count in stats['by_priority'].items():
                print(f"  - {priority}: {count}")
        else:
            print(f"Errore nel recupero statistiche: {response.status_code}")
    except Exception as e:
        print(f"Errore nel recupero statistiche: {e}")

def get_categories():
    """Ottiene tutte le categorie utilizzate"""
    try:
        response = requests.get(f"{BASE_URL}/activities/categories")
        if response.status_code == 200:
            categories = response.json()
            print(f"\nCategorie utilizzate ({len(categories)}):")
            for category in sorted(categories):
                print(f"  - {category}")
        else:
            print(f"Errore nel recupero categorie: {response.status_code}")
    except Exception as e:
        print(f"Errore nel recupero categorie: {e}")

def main():
    """Funzione principale"""
    print("PLANNER ATTIVITÀ - AGGIUNTA ATTIVITÀ SETTIMANALI")
    print("=" * 60)
    
    # Verifica connessione al server
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✓ Server backend raggiungibile")
        else:
            print("✗ Server backend non risponde correttamente")
            return
    except requests.exceptions.ConnectionError:
        print("✗ Impossibile connettersi al server backend")
        print("Assicurati che il server sia in esecuzione su http://localhost:5000")
        return
    
    # Aggiunge le attività settimanali
    created, failed = add_weekly_activities()
    
    # Mostra statistiche e categorie
    get_activities_summary()
    get_categories()
    
    print("\n" + "=" * 60)
    if len(created) > 0:
        print("✓ Operazione completata con successo!")
    else:
        print("✗ Nessuna attività è stata creata")

if __name__ == "__main__":
    main()
