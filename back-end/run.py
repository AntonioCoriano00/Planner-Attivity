#!/usr/bin/env python3
"""
Script principale per avviare l'applicazione Flask
"""
import os
from app_factory import create_app

# Crea l'applicazione
app = create_app()

if __name__ == '__main__':
    # Configurazione per l'avvio
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 Avvio del server Flask su http://{host}:{port}")
    print(f"📊 Ambiente: {'Development' if debug else 'Production'}")
    print(f"🔗 API disponibili su: http://{host}:{port}/api/")
    
    app.run(host=host, port=port, debug=debug)
