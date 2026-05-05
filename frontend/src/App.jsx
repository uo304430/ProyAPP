import React, { useState } from 'react';
import RegistroForm from './components/RegistroForm';
import LoginForm from './components/LoginForm';
import MenuView from './components/MenuView';
import PlanificarForm from './components/PlanificarForm';
import BloquesView from './components/BloquesView';
import SemanasView from './components/SemanasView';
import DiasView from './components/DiasView';

function App() {
  const [currentView, setCurrentView] = useState('register'); // Pantalla inicial
  const [athleteId, setAthleteId] = useState(null); 
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);

  const handleRegisterSuccess = (id) => {
    setAthleteId(id);
    setCurrentView('menu');
  };

  const handleLoginSuccess = (id) => {
    setAthleteId(id);
    setCurrentView('menu');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginTop: '10px', color: '#00e676' }}>Powerlifting SaaS</h1>

      {currentView === 'register' && (
        <div>
          <RegistroForm onRegisterSuccess={handleRegisterSuccess} />
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              onClick={() => setCurrentView('login')} 
              style={{ background: 'none', border: 'none', color: '#00e676', textDecoration: 'underline', cursor: 'pointer' }}
            >
              ¿Ya estás registrado? Inicia sesión
            </button>
          </div>
        </div>
      )}

      {currentView === 'login' && (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess} 
          setView={setCurrentView} 
        />
      )}

      {currentView === 'menu' && (
        <MenuView setView={setCurrentView} />
      )}

      {currentView === 'planificar' && (
        <div style={{ marginTop: '20px' }}>
          <PlanificarForm />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => setCurrentView('menu')}
              style={{ padding: '8px 16px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {currentView === 'blocks' && (
        <BloquesView 
          athleteId={athleteId || 1} 
          onSelectBlock={(blockId) => {
            setSelectedBlockId(blockId);
            setCurrentView('weeks');
          }} 
          onBack={() => setCurrentView('menu')} 
        />
      )}

      {currentView === 'weeks' && (
        <SemanasView 
          blockId={selectedBlockId} 
          onSelectWeek={(weekId) => {
            setSelectedWeekId(weekId);
            setCurrentView('days');
          }} 
          onBack={() => setCurrentView('blocks')} 
        />
      )}

      {currentView === 'days' && (
        <DiasView 
          weekId={selectedWeekId} 
          onSelectDay={(dayId) => {
            console.log(`Día seleccionado: ${dayId}`);
          }} 
          onBack={() => setCurrentView('weeks')} 
        />
      )}
    </div>
  );
}

export default App;