import React, { useState, Component } from 'react';
import axios from 'axios';
import { t } from './styles/theme';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e.message || String(e) }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#1a0a0a', border: '1px solid #ff4757', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%' }}>
          <p style={{ color: '#ff4757', fontWeight: '700', marginBottom: '8px' }}>Error en la aplicación</p>
          <p style={{ color: '#9898b0', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{this.state.error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#ff475720', border: '1px solid #ff4757', borderRadius: '8px', color: '#ff4757', cursor: 'pointer', fontSize: '13px' }}>
            Recargar página
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}
import AppShell from './components/AppShell';
import LoginForm from './components/LoginForm';
import RegistroForm from './components/RegistroForm';
import BloquesView from './components/BloquesView';
import CrearBloqueView from './components/CrearBloqueView';
import SemanasView from './components/SemanasView';
import DiasView from './components/DiasView';
import EntrenosDiaView from './components/EntrenosDiaView';
import EjecucionSerieView from './components/EjecucionSerieView';
import EditarBloqueView from './components/EditarBloqueView';
import ConexionesView from './components/ConexionesView';
import PerfilView from './components/PerfilView';
import CalendarioView from './components/CalendarioView';
import CoachPanelView from './components/CoachPanelView';
import DashboardView from './components/DashboardView';
import CheckinView from './components/CheckinView';
import CompetitionsView from './components/CompetitionsView';

const ANON_VIEWS = ['login', 'register'];

function App() {
  const [view, setView] = useState('login');
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);   // full block object (for coach_id access)
  const [pendingBlockId, setPendingBlockId] = useState(null); // block being created (for cleanup)
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [viewingAthleteId, setViewingAthleteId] = useState(null);
  const [viewingAthleteName, setViewingAthleteName] = useState(null);

  const handleAuthSuccess = (id, role) => {
    setUserId(id);
    setUserRole(role);
    setView(role === 'coach' ? 'coach-panel' : 'blocks');
  };

  const handleNavigate = (id) => {
    // Guard: navigating away while wizard has a pending block
    if (view === 'create-block' && pendingBlockId) {
      if (!window.confirm('¿Salir del asistente? El bloque en creación se eliminará.')) return;
      axios.delete(`/api/blocks/${pendingBlockId}/`).catch(() => {});
      setPendingBlockId(null);
    }

    // Reset athlete context when going to own views
    const athleteSubViews = ['blocks', 'weeks', 'days', 'entrenos-dia', 'ejecucion', 'edit-block', 'create-block'];
    if (!athleteSubViews.includes(id)) {
      setViewingAthleteId(null);
      setViewingAthleteName(null);
    }

    setView(id);
  };

  const isAnon = ANON_VIEWS.includes(view);

  const content = (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text }}>

      {view === 'login' && (
        <LoginForm
          onLoginSuccess={handleAuthSuccess}
          onGoRegister={() => setView('register')}
        />
      )}

      {view === 'register' && (
        <RegistroForm
          onRegisterSuccess={handleAuthSuccess}
          onGoLogin={() => setView('login')}
        />
      )}

      {view === 'blocks' && (
        <BloquesView
          athleteId={viewingAthleteId || userId}
          userId={userId}
          viewingAthleteName={viewingAthleteId ? viewingAthleteName : null}
          onSelectBlock={(block) => {
            setSelectedBlockId(block.id);
            setSelectedBlock(block);
            setSelectedWeekId(null);
            setSelectedDayId(null);
            setView('weeks');
          }}
          onEditBlock={(blockId) => {
            setSelectedBlockId(blockId);
            setView('edit-block');
          }}
          onCreateBlock={() => setView('create-block')}
          onBack={() => {
            if (viewingAthleteId) {
              setViewingAthleteId(null);
              setViewingAthleteName(null);
              setView('connections');
            } else {
              setView('blocks');
            }
          }}
        />
      )}

      {view === 'edit-block' && (
        <EditarBloqueView
          blockId={selectedBlockId}
          athleteId={viewingAthleteId || userId}
          userId={userId}
          userRole={userRole}
          onBack={() => setView('blocks')}
        />
      )}

      {view === 'create-block' && (
        <CrearBloqueView
          coachId={userId}
          userId={userId}
          athleteId={viewingAthleteId || userId}
          onBlockCreated={(id) => setPendingBlockId(id)}
          onFinished={() => { setPendingBlockId(null); setView('blocks'); }}
          onBack={() => { setPendingBlockId(null); setView('blocks'); }}
        />
      )}

      {view === 'weeks' && (
        <SemanasView
          blockId={selectedBlockId}
          block={selectedBlock}
          userRole={userRole}
          athleteId={viewingAthleteId || userId}
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
          onCheckin={() => setView('checkin')}
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
          userRole={userRole}
          onBack={() => setView('entrenos-dia')}
        />
      )}

      {view === 'connections' && (
        <ConexionesView
          userId={userId}
          onViewAthleteBlocks={(athleteId, athleteName) => {
            setViewingAthleteId(athleteId);
            setViewingAthleteName(athleteName);
            setView('blocks');
          }}
          onBack={() => setView(userRole === 'coach' ? 'coach-panel' : 'blocks')}
        />
      )}

      {view === 'profile' && (
        <PerfilView
          userId={userId}
          onBack={() => setView(userRole === 'coach' ? 'coach-panel' : 'blocks')}
        />
      )}

      {view === 'calendario' && (
        <CalendarioView
          userId={viewingAthleteId || userId}
          onBack={() => {
            if (viewingAthleteId) { setViewingAthleteId(null); setViewingAthleteName(null); setView('coach-panel'); }
            else setView('blocks');
          }}
        />
      )}

      {view === 'coach-panel' && (
        <CoachPanelView
          coachId={userId}
          onViewAthleteBlocks={(athleteId, athleteName) => {
            setViewingAthleteId(athleteId);
            setViewingAthleteName(athleteName);
            setView('blocks');
          }}
          onViewAthleteCalendar={(athleteId, athleteName) => {
            setViewingAthleteId(athleteId);
            setViewingAthleteName(athleteName);
            setView('calendario');
          }}
        />
      )}

      {view === 'dashboard' && (
        <DashboardView
          athleteId={userId}
          userId={userId}
          userRole={userRole}
          onBack={() => setView(userRole === 'coach' ? 'coach-panel' : 'blocks')}
        />
      )}

      {view === 'checkin' && (
        <CheckinView
          athleteId={viewingAthleteId || userId}
          readOnly={!!viewingAthleteId}
          onBack={() => setView('days')}
        />
      )}

      {view === 'competitions' && (
        <CompetitionsView
          athleteId={userId}
          onBack={() => setView('blocks')}
        />
      )}
    </div>
  );

  if (isAnon) return <ErrorBoundary>{content}</ErrorBoundary>;

  return (
    <ErrorBoundary>
    <AppShell
      view={view}
      userRole={userRole}
      onNavigate={handleNavigate}
      onLogout={() => { setUserId(null); setUserRole(null); setView('login'); }}
    >
      {content}
    </AppShell>
    </ErrorBoundary>
  );
}

export default App;
