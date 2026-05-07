import React, { useState } from 'react';
import { t } from './styles/theme';
import LoginForm from './components/LoginForm';
import RegistroForm from './components/RegistroForm';
import MenuView from './components/MenuView';
import BloquesView from './components/BloquesView';
import CrearBloqueView from './components/CrearBloqueView';
import SemanasView from './components/SemanasView';
import DiasView from './components/DiasView';
import EntrenosDiaView from './components/EntrenosDiaView';
import EjecucionSerieView from './components/EjecucionSerieView';

function App() {
  const [view, setView] = useState('login');
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const handleAuthSuccess = (id, role) => {
    setUserId(id);
    setUserRole(role);
    setView('menu');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text }}>

      {view === 'login' && (
        <LoginForm
          onLoginSuccess={(id, role) => handleAuthSuccess(id, role)}
          onGoRegister={() => setView('register')}
        />
      )}

      {view === 'register' && (
        <RegistroForm
          onRegisterSuccess={(id, role) => handleAuthSuccess(id, role)}
          onGoLogin={() => setView('login')}
        />
      )}

      {view === 'menu' && (
        <MenuView userId={userId} userRole={userRole} setView={setView} />
      )}

      {view === 'blocks' && (
        <BloquesView
          athleteId={userId}
          onSelectBlock={(blockId) => {
            setSelectedBlockId(blockId);
            setSelectedWeekId(null);
            setSelectedDayId(null);
            setView('weeks');
          }}
          onCreateBlock={() => setView('create-block')}
          onBack={() => setView('menu')}
        />
      )}

      {view === 'create-block' && (
        <CrearBloqueView
          coachId={userId}
          athleteId={userId}
          onFinished={() => setView('blocks')}
          onBack={() => setView('blocks')}
        />
      )}

      {view === 'weeks' && (
        <SemanasView
          blockId={selectedBlockId}
          onSelectWeek={(weekId) => {
            setSelectedWeekId(weekId);
            setView('days');
          }}
          onBack={() => setView('blocks')}
        />
      )}

      {view === 'days' && (
        <DiasView
          weekId={selectedWeekId}
          onSelectDay={(dayId) => {
            setSelectedDayId(dayId);
            setView('entrenos-dia');
          }}
          onBack={() => setView('weeks')}
        />
      )}

      {view === 'entrenos-dia' && (
        <EntrenosDiaView
          dayId={selectedDayId}
          onSelectWorkout={(workout) => {
            setSelectedWorkout(workout);
            setView('ejecucion');
          }}
          onBack={() => setView('days')}
        />
      )}

      {view === 'ejecucion' && (
        <EjecucionSerieView
          workout={selectedWorkout}
          athleteId={userId}
          onBack={() => setView('entrenos-dia')}
        />
      )}
    </div>
  );
}

export default App;
