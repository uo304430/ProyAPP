import React, { useState, useEffect } from 'react';
import { t } from '../styles/theme';

const SIDEBAR_W = 240;

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

// Inline SVG icon set — no external dependency
const Ico = {
  Layers: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="M7 4H4a2 2 0 0 0-2 2v1c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V6a2 2 0 0 0-2-2h-3"/>
      <path d="M5 4h14v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V4z"/>
    </svg>
  ),
  Link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7a5 5 0 0 1 0-10h2"/>
      <path d="M15 7h2a5 5 0 0 1 0 10h-2"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

const NAV = (userRole) => [
  { id: 'blocks',       Icon: Ico.Layers,   label: 'Mis Bloques'   },
  { id: 'calendario',   Icon: Ico.Calendar, label: 'Calendario'    },
  { id: 'dashboard',    Icon: Ico.BarChart, label: 'Dashboard'     },
  { id: 'competitions', Icon: Ico.Trophy,   label: 'Competiciones' },
  { id: 'connections',  Icon: Ico.Link,     label: 'Conexiones'    },
  ...(userRole === 'coach' ? [{ id: 'coach-panel', Icon: Ico.Users, label: 'Atletas' }] : []),
];

const AppShell = ({ view, userRole, onNavigate, onLogout, children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 680);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const active = VIEW_GROUP[view] || '';
  const navItems = NAV(userRole);

  const NavItem = ({ id, label, Icon, isProfile = false }) => {
    const isActive = isProfile ? view === 'profile' : active === id;
    return (
      <button
        onClick={() => onNavigate(isProfile ? 'profile' : id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '11px',
          width: '100%',
          padding: '10px 14px 10px 17px',
          background: isActive ? 'rgba(0, 255, 135, 0.07)' : 'transparent',
          border: 'none',
          borderLeft: `3px solid ${isActive ? t.primary : 'transparent'}`,
          borderRadius: '0 10px 10px 0',
          cursor: 'pointer',
          color: isActive ? t.primary : t.text2,
          fontFamily: t.fontBody,
          fontWeight: isActive ? '600' : '400',
          fontSize: '14px',
          letterSpacing: '0.02em',
          transition: 'all 160ms ease',
          textAlign: 'left',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = t.text;
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = t.text2;
          }
        }}
      >
        <Icon />
        {label}
      </button>
    );
  };

  // ── MOBILE: frosted glass bottom bar ──
  if (isMobile) {
    const bottomItems = navItems.slice(0, 4);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: t.bg }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
          {children}
        </div>

        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '70px',
          background: 'rgba(6, 6, 9, 0.9)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {bottomItems.map(item => {
            const isOn = active === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '5px', background: 'none', border: 'none', cursor: 'pointer',
                  color: isOn ? t.primary : t.text3,
                  padding: '10px 4px',
                  transition: 'color 160ms ease',
                  position: 'relative',
                }}>
                {isOn && (
                  <span style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '28px', height: '2px', borderRadius: '0 0 2px 2px',
                    background: t.primaryGrad,
                    boxShadow: '0 0 8px rgba(0,255,135,0.6)',
                  }} />
                )}
                <item.Icon />
                <span style={{
                  fontSize: '9px', fontWeight: isOn ? '700' : '500',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontFamily: t.fontBody,
                }}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          <button onClick={() => onNavigate('profile')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '5px', background: 'none', border: 'none', cursor: 'pointer',
              color: view === 'profile' ? t.primary : t.text3,
              padding: '10px 4px',
              transition: 'color 160ms ease',
              position: 'relative',
            }}>
            {view === 'profile' && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '28px', height: '2px', borderRadius: '0 0 2px 2px',
                background: t.primaryGrad,
                boxShadow: '0 0 8px rgba(0,255,135,0.6)',
              }} />
            )}
            <Ico.User />
            <span style={{
              fontSize: '9px', fontWeight: view === 'profile' ? '700' : '500',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              fontFamily: t.fontBody,
            }}>
              Perfil
            </span>
          </button>
        </nav>
      </div>
    );
  }

  // ── DESKTOP: permanent sidebar ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: `${SIDEBAR_W}px`,
        background: t.surface,
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflow: 'hidden',
      }}>

        {/* Logo area */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px',
              background: t.primaryGrad,
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 18px rgba(0, 255, 135, 0.4)',
              color: '#040407',
            }}>
              <Ico.Bolt />
            </div>
            <div>
              <div style={{
                fontFamily: t.fontDisplay,
                fontSize: '22px',
                letterSpacing: '0.1em',
                lineHeight: 1,
                color: t.text,
              }}>B2L</div>
              <div style={{
                fontSize: '9px', fontWeight: '600', letterSpacing: '0.14em',
                color: t.text3, textTransform: 'uppercase', marginTop: '1px',
                fontFamily: t.fontBody,
              }}>Born to Lift</div>
            </div>
          </div>

          {/* Role chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 9px', borderRadius: '4px',
            background: userRole === 'coach'
              ? 'rgba(41, 121, 255, 0.1)'
              : 'rgba(0, 255, 135, 0.08)',
            border: `1px solid ${userRole === 'coach'
              ? 'rgba(41, 121, 255, 0.2)'
              : 'rgba(0, 255, 135, 0.18)'}`,
          }}>
            <span style={{
              fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: userRole === 'coach' ? t.info : t.primary,
              fontFamily: t.fontBody,
            }}>
              {userRole === 'coach' ? 'Entrenador' : 'Atleta'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '10px 12px 4px 0',
          display: 'flex', flexDirection: 'column', gap: '1px',
          overflowY: 'auto',
        }}>
          {navItems.map(item => (
            <NavItem key={item.id} id={item.id} label={item.label} Icon={item.Icon} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: '8px 12px 20px 0',
          borderTop: `1px solid ${t.border}`,
          flexShrink: 0,
        }}>
          <NavItem id="profile" label="Mi Perfil" Icon={Ico.User} isProfile />
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px 10px 17px',
              border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left',
              background: 'transparent', color: t.text3,
              fontSize: '13px', fontFamily: t.fontBody,
              fontWeight: '400', letterSpacing: '0.02em',
              borderLeft: '3px solid transparent',
              borderRadius: '0 10px 10px 0',
              transition: 'color 160ms ease, background 160ms ease',
              marginTop: '2px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = t.danger;
              e.currentTarget.style.background = 'rgba(255, 61, 85, 0.07)';
              e.currentTarget.style.borderLeftColor = t.danger;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = t.text3;
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeftColor = 'transparent';
            }}
          >
            <Ico.LogOut />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content — offset by sidebar width */}
      <main style={{
        flex: 1,
        marginLeft: `${SIDEBAR_W}px`,
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
