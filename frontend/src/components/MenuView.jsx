import React from 'react';
import { t } from '../styles/theme';

const MenuView = ({ userId, userRole, setView }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>

      {/* Top bar */}
      <div style={{
        maxWidth: '640px', margin: '0 auto 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '32px', height: '32px', backgroundColor: t.primary,
            borderRadius: '8px', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px',
          }}>⚡</span>
          <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.3px' }}>Progresar</span>
        </div>
        <button
          onClick={() => setView('login')}
          style={{
            background: 'none', border: `1px solid ${t.border2}`,
            borderRadius: '8px', padding: '7px 14px',
            color: t.text2, fontSize: '13px', cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Greeting */}
      <div style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Buen trabajo, atleta 💪
        </h1>
        <p style={{ color: t.text2, fontSize: '15px' }}>
          {userRole === 'coach' ? 'Panel del entrenador' : '¿Qué hacemos hoy?'}
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'grid', gap: '14px' }}>

        <button
          onClick={() => setView('blocks')}
          style={{
            backgroundColor: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '14px', padding: '22px 24px',
            textAlign: 'left', cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
            display: 'flex', alignItems: 'center', gap: '18px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.backgroundColor = t.surface2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.backgroundColor = t.surface; }}
        >
          <span style={{
            width: '46px', height: '46px', backgroundColor: t.primaryDim,
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', flexShrink: 0,
          }}>📋</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
              Mis Bloques
            </div>
            <div style={{ color: t.text2, fontSize: '13px' }}>
              Ver, crear y gestionar tus bloques de entrenamiento
            </div>
          </div>
          <span style={{ marginLeft: 'auto', color: t.text3, fontSize: '20px' }}>›</span>
        </button>

        <div style={{
          backgroundColor: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '14px', padding: '22px 24px',
          display: 'flex', alignItems: 'center', gap: '18px', opacity: 0.5,
        }}>
          <span style={{
            width: '46px', height: '46px', backgroundColor: t.infoDim,
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', flexShrink: 0,
          }}>📈</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
              Progreso y Analytics
            </div>
            <div style={{ color: t.text2, fontSize: '13px' }}>
              Próximamente — gráficas de e1RM y cumplimiento
            </div>
          </div>
          <span style={{
            marginLeft: 'auto', backgroundColor: t.surface3,
            borderRadius: '6px', padding: '3px 8px',
            fontSize: '11px', fontWeight: '600', color: t.text3, letterSpacing: '0.3px',
          }}>PRONTO</span>
        </div>

      </div>
    </div>
  );
};

export default MenuView;
