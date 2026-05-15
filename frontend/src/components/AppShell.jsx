import React, { useState, useEffect } from 'react';
import { t } from '../styles/theme';

// Which top-level nav item each view belongs to
const VIEW_GROUP = {
  blocks: 'blocks', weeks: 'blocks', days: 'blocks',
  'entrenos-dia': 'blocks', ejecucion: 'blocks',
  'edit-block': 'blocks', 'create-block': 'blocks',
  calendario: 'calendario',
  dashboard: 'dashboard',
  competitions: 'competitions',
  connections: 'connections',
  'coach-panel': 'coach-panel',
  profile: 'profile',
};

const NAV = (userRole) => [
  { id: 'blocks',       icon: '📋', label: 'Mis Bloques'  },
  { id: 'calendario',   icon: '📅', label: 'Calendario'   },
  { id: 'dashboard',    icon: '📊', label: 'Dashboard'    },
  { id: 'competitions', icon: '🏆', label: 'Competiciones'},
  { id: 'connections',  icon: '🔗', label: 'Conexiones'   },
  ...(userRole === 'coach' ? [{ id: 'coach-panel', icon: '🏋️', label: 'Atletas' }] : []),
];

const SIDEBAR_W = 220;

const AppShell = ({ view, userRole, onNavigate, onLogout, children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 680);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const active = VIEW_GROUP[view] || '';
  const navItems = NAV(userRole);

  const navigate = (id) => {
    setSidebarOpen(false);
    onNavigate(id);
  };

  const NavBtn = ({ id, icon, label, isProfile = false }) => {
    const on = active === id || (isProfile && view === 'profile');
    return (
      <button
        onClick={() => navigate(isProfile ? 'profile' : id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '11px',
          padding: '10px 13px', borderRadius: '10px', border: 'none',
          cursor: 'pointer', textAlign: 'left', width: '100%',
          backgroundColor: on ? t.primaryDim : 'transparent',
          color: on ? t.primary : t.text2,
          fontWeight: on ? '600' : '400',
          fontSize: '14px',
          transition: 'background-color 100ms ease, color 100ms ease',
        }}
        onMouseEnter={e => { if (!on) e.currentTarget.style.backgroundColor = t.surface2; }}
        onMouseLeave={e => { if (!on) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
        {label}
      </button>
    );
  };

  if (isMobile) {
    const bottomItems = navItems.slice(0, 4);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: t.bg }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '62px' }}>
          {children}
        </div>
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '62px',
          backgroundColor: t.surface, borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', zIndex: 100,
        }}>
          {bottomItems.map(item => {
            const on = active === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
                  color: on ? t.primary : t.text3, paddingTop: '8px',
                }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: '9px', fontWeight: on ? '700' : '500' }}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => onNavigate('profile')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
              color: view === 'profile' ? t.primary : t.text3, paddingTop: '8px',
            }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>👤</span>
            <span style={{ fontSize: '9px', fontWeight: view === 'profile' ? '700' : '500' }}>Perfil</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: t.bg }}>

      {/* Botón hamburger flotante — siempre visible */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        style={{
          position: 'fixed', top: '14px', left: '14px', zIndex: 200,
          width: '38px', height: '38px', borderRadius: '10px',
          backgroundColor: t.surface, border: `1px solid ${t.border2}`,
          cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '5px',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = t.surface2}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = t.surface}
      >
        <span style={{ display: 'block', width: '16px', height: '2px', backgroundColor: t.text2, borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '16px', height: '2px', backgroundColor: t.text2, borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '16px', height: '2px', backgroundColor: t.text2, borderRadius: '2px' }} />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 150,
        width: `${SIDEBAR_W}px`,
        backgroundColor: t.surface, borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
        transition: 'transform 230ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo alineado con el hamburger — mismo top que el botón flotante */}
        <div style={{
          height: '66px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          paddingLeft: '66px', gap: '9px', userSelect: 'none',
        }}>
          <span style={{
            width: '28px', height: '28px', backgroundColor: t.primary, borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
          }}>⚡</span>
          <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>B2L</span>
        </div>
        <nav style={{ flex: 1, padding: '0 10px 4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => <NavBtn key={item.id} {...item} />)}
        </nav>
        <div style={{ padding: '10px 10px 18px', borderTop: `1px solid ${t.border2}`, flexShrink: 0 }}>
          <NavBtn id="profile" icon="👤" label="Mi Perfil" isProfile />
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '11px',
              padding: '9px 13px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              backgroundColor: 'transparent', color: t.text3, fontSize: '13px',
              marginTop: '2px', transition: 'background-color 100ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.surface2}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '14px' }}>↩</span>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default AppShell;
