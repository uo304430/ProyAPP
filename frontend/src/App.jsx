import React, { useState } from 'react';
import RegistroForm from './components/RegistroForm';
import LoginForm from './components/LoginForm';
import MenuView from './components/MenuView';
import BloquesView from './components/BloquesView';
import SemanasView from './components/SemanasView';
import DiasView from './components/DiasView';
import CrearBloqueView from './components/CrearBloqueView';
import EntrenosDiaView from './components/EntrenosDiaView';
import EjecucionSerieView from './components/EjecucionSerieView';
import DisenoBaseView from './components/DisenoBaseView';

function App() {
  const [currentView, setCurrentView] = useState('register');
  const [athleteId, setAthleteId] = useState(null); 
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

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

      {currentView === 'blocks' && (
        <BloquesView 
          athleteId={athleteId || 1} 
          onSelectBlock={(blockId) => {
            setSelectedBlockId(blockId);
            setSelectedWeekId(null); // Limpia las semanas anteriores
            setSelectedDayId(null);  // Limpia los días anteriores
            setCurrentView('weeks');
          }}
          // Añadimos estas dos líneas que faltaban
          onCreateBlock={() => setCurrentView('create-block')}
          onBack={() => setCurrentView('menu')}
        />
      )}

     {currentView === 'create-block' && (
        <CrearBloqueView 
          coachId={1} // o el ID de tu entrenador/atleta
          athleteId={athleteId} 
          onBlockCreated={(blockId) => {
            setSelectedBlockId(blockId); // Setea el ID del bloque
            setCurrentView('diseno-base'); // Va a DisenoBaseView
          }} 
          onBack={() => setCurrentView('blocks')} 
        />
      )}

      {/* Flujo de diseño base añadido */}
      {currentView === 'diseno-base' && (
        <DisenoBaseView 
          blockId={selectedBlockId}
          daysPerWeek={4} 
          onFinish={() => {
            alert('¡Semana base diseñada y replicada con éxito!');
            setCurrentView('blocks');
          }}
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
            setSelectedDayId(dayId);
            setCurrentView('entrenos-dia');
          }} 
          onBack={() => setCurrentView('weeks')} 
        />
      )}

      {currentView === 'entrenos-dia' && (
        <EntrenosDiaView 
          dayId={selectedDayId}
          onSelectWorkout={(workout) => {
            setSelectedWorkout(workout);
            setCurrentView('ejecucion-serie');
          }}
          onBack={() => setCurrentView('days')}
        />
      )}

      {currentView === 'ejecucion-serie' && (
        <EjecucionSerieView 
          workout={selectedWorkout}
          athleteId={athleteId || 1}
          onBack={() => setCurrentView('entrenos-dia')}
        />
      )}
      {currentView === 'ejecucion-entreno' && (
        <EjecucionEntrenoView 
          workout={selectedWorkout} 
          onBack={() => setCurrentView('entrenos-dia')} 
        />
      )}

      

    </div>
  );
}

export default App;