#!/bin/bash

echo "========================================"
echo "   AVVIO SISTEMA PLANNER ATTIVITA'"
echo "========================================"
echo

echo "1. Installazione dipendenze React..."
cd planner-activity3/planner-activity
npm install
if [ $? -ne 0 ]; then
    echo "ERRORE: Installazione dipendenze React fallita"
    exit 1
fi

echo
echo "2. Installazione dipendenze Backend..."
cd ../back-end
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERRORE: Installazione dipendenze Backend fallita"
    exit 1
fi

echo
echo "3. Creazione file .env per React..."
cd ../planner-activity
if [ ! -f .env ]; then
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "REACT_APP_API_TIMEOUT=10000" >> .env
    echo "File .env creato con successo"
else
    echo "File .env già esistente"
fi

echo
echo "========================================"
echo "   SISTEMA CONFIGURATO CORRETTAMENTE"
echo "========================================"
echo
echo "Per avviare il sistema:"
echo "1. Apri un terminale e vai in planner-activity3/back-end"
echo "2. Esegui: python run.py"
echo "3. Apri un altro terminale e vai in planner-activity3/planner-activity"
echo "4. Esegui: npm start"
echo
echo "Il backend sarà disponibile su: http://localhost:5000"
echo "Il frontend sarà disponibile su: http://localhost:3000"
echo
