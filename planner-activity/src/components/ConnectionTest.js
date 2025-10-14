import React, { useState } from 'react';
import { runFullConnectionTest } from '../utils/testConnection';

const ConnectionTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    
    try {
      const result = await runFullConnectionTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Errore imprevisto: ${error.message}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="connection-test">
      <h3>Test Connessione Backend</h3>
      <button 
        onClick={runTest} 
        disabled={isRunning}
        className="test-button"
      >
        {isRunning ? 'Test in corso...' : 'Esegui Test'}
      </button>
      
      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          <p>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </p>
        </div>
      )}
      
      <style jsx>{`
        .connection-test {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .connection-test h3 {
          margin-top: 0;
          color: #333;
        }
        
        .test-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .test-button:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .test-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .test-result {
          padding: 10px;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .test-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .test-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default ConnectionTest;
