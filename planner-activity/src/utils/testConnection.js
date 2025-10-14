// Utility per testare la connessione al backend
import { healthService, activityService } from '../services/api';

export const testBackendConnection = async () => {
  console.log('🔍 Testando la connessione al backend...');
  
  try {
    // Test 1: Health check
    console.log('1. Testando health check...');
    const healthResponse = await healthService.checkHealth();
    console.log('✅ Health check OK:', healthResponse);
    
    // Test 2: Recupero attività
    console.log('2. Testando recupero attività...');
    const activities = await activityService.getActivities();
    console.log('✅ Recupero attività OK:', activities.length, 'attività trovate');
    
    // Test 3: Statistiche
    console.log('3. Testando statistiche...');
    const stats = await activityService.getActivityStats();
    console.log('✅ Statistiche OK:', stats);
    
    // Test 4: Categorie
    console.log('4. Testando categorie...');
    const categories = await activityService.getCategories();
    console.log('✅ Categorie OK:', categories);
    
    console.log('🎉 Tutti i test di connessione sono passati!');
    return { success: true, message: 'Backend connesso correttamente' };
    
  } catch (error) {
    console.error('❌ Errore nella connessione al backend:', error);
    return { success: false, message: error.message };
  }
};

// Funzione per testare la creazione di un'attività di test
export const testCreateActivity = async () => {
  console.log('🧪 Testando creazione attività...');
  
  try {
    const testActivity = {
      title: 'Test Connessione Backend',
      description: 'Attività di test per verificare la connessione',
      date: new Date().toISOString().split('T')[0], // Data odierna
      time: '12:00',
      status: 'da-fare',
      priority: 'media',
      category: 'Test'
    };
    
    const createdActivity = await activityService.createActivity(testActivity);
    console.log('✅ Attività di test creata:', createdActivity);
    
    // Elimina l'attività di test
    await activityService.deleteActivity(createdActivity.id);
    console.log('✅ Attività di test eliminata');
    
    return { success: true, message: 'Test creazione/eliminazione OK' };
    
  } catch (error) {
    console.error('❌ Errore nel test di creazione:', error);
    return { success: false, message: error.message };
  }
};

// Funzione completa di test
export const runFullConnectionTest = async () => {
  console.log('🚀 Avviando test completo di connessione...');
  
  const connectionTest = await testBackendConnection();
  if (!connectionTest.success) {
    return connectionTest;
  }
  
  const createTest = await testCreateActivity();
  if (!createTest.success) {
    return createTest;
  }
  
  return { 
    success: true, 
    message: 'Tutti i test sono passati con successo!' 
  };
};
