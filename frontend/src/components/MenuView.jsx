import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const OBJECTIVE_LABELS = {
  acumulacion: 'Acumulación',
  intensificacion: 'Intensificación',
  peaking: 'Peaking',
  descarga: 'Descarga',
};

const MenuView = ({ userId, userRole, setView, onViewAthleteBlocks, onViewCalendar, onViewCoachPanel, onViewProgress, onViewCheckin, onViewCompetitions }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [athletes, setAthletes] = useState([]);
  const [expandedAthlete, setExpandedAthlete] = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API}/users/${userId}/connections/pending/`)
      .then(r => setPendingCount(r.data.pending?.length || 0))
      .catch(() => {});
    if (userRole === 'coach') {
      axios.get(`${API}/coach/${userId}/athletes/`)
        .then(r => setAthletes(r.data.athletes || []))
        .catch(() => {});
    }
  }, [userId, userRole]);

  const cards = [
    {
      id: 'blocks',
      icon: '📋',
      iconBg: t.primaryDim,
      title: 'Mis Bloques',
      desc: 'Ver, crear y gestionar tus bloques de entrenamiento',
      enabled: true,
    },
    {
      id: 'connections',
      icon: '🔗',
      iconBg: t.infoDim,
      title: 'Conexiones',
      desc: 'Entrenadores y atletas conectados',
      enabled: true,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'profile',
      icon: '👤',
      iconBg: 'rgba(160, 100, 255, 0.12)',
      title: 'Mi Perfil',
      desc: 'Foto, nombre y récords personales',
      enabled: true,
    },
    {
      id: 'calendario',
      icon: '📅',
      iconBg: 'rgba(58, 134, 255, 0.12)',
      title: 'Calendario',
      desc: 'Visualiza tus sesiones programadas por fecha',
      enabled: true,
    },
    ...(userRole === 'coach' ? [{
      id: 'coach-panel',
      icon: '🏋️',
      iconBg: t.primaryDim,
      title: 'Panel de Atletas',
      desc: 'Estado y bloques de todos tus atletas',
      enabled: true,
    }] : []),
    {
      id: 'progress',
      icon: '📈',
      iconBg: t.infoDim,
      title: 'Progreso',
      desc: 'e1RM por ejercicio y volumen semanal',
      enabled: true,
    },
    {
      id: 'checkin',
      icon: '💚',
      iconBg: 'rgba(34, 197, 94, 0.12)',
      title: 'Bienestar',
      desc: 'Check-in semanal de fatiga, sueño y motivación',
      enabled: true,
    },
    {
      id: 'competitions',
      icon: '🏆',
      iconBg: 'rgba(251, 191, 36, 0.12)',
      title: 'Competiciones',
      desc: 'Registra y sigue tu historial competitivo',
      enabled: true,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>

      {/* Top bar */}
      <div style={{ maxWidth: '640px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '32px', height: '32px', backgroundColor: t.primary, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚡</span>
          <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.3px' }}>PowerApp</span>
        </div>
        <button onClick={() => setView('login')} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', padding: '7px 14px', color: t.text2, fontSize: '13px', cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      {/* Greeting */}
      <div style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          {userRole === 'coach' ? 'Panel del entrenador' : 'Buen trabajo, atleta 💪'}
        </h1>
        <p style={{ color: t.text2, fontSize: '15px' }}>
          {userRole === 'coach' ? 'Gestiona a tus atletas y sus bloques' : '¿Qué hacemos hoy?'}
        </p>
      </div>

      {/* Coach athlete dashboard */}
      {userRole === 'coach' && (
        <div style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>
              Tus atletas
              {athletes.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600', color: t.text3 }}>
                  {athletes.length}
                </span>
              )}
            </h2>
            {athletes.length > 0 && (
              <button
                onClick={onViewCoachPanel}
                style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: t.text2, cursor: 'pointer' }}
              >
                Panel completo →
              </button>
            )}
          </div>

          {athletes.length === 0 ? (
            <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '24px', textAlign: 'center', color: t.text3, fontSize: '14px' }}>
              Sin atletas conectados — ve a Conexiones para invitar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {athletes.map(athlete => {
                const isOpen = expandedAthlete === athlete.athlete_id;
                return (
                  <div key={athlete.athlete_id} style={{ backgroundColor: t.surface, border: `1px solid ${isOpen ? t.primary : t.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 150ms ease' }}>

                    {/* Athlete header row */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer' }}
                      onClick={() => setExpandedAthlete(isOpen ? null : athlete.athlete_id)}
                    >
                      {/* Avatar */}
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, backgroundColor: t.primaryDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: t.primary, overflow: 'hidden' }}>
                        {athlete.avatar_url
                          ? <img src={athlete.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (athlete.display_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{athlete.display_name}</div>
                        <div style={{ fontSize: '12px', color: t.text3, marginTop: '1px' }}>
                          {athlete.blocks.length} bloque{athlete.blocks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onViewAthleteBlocks(athlete.athlete_id, athlete.display_name); }}
                        style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '5px 12px', fontSize: '12px', color: t.text2, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        Ver todos →
                      </button>
                      <span style={{ color: t.text3, fontSize: '16px', flexShrink: 0, marginLeft: '4px' }}>
                        {isOpen ? '▾' : '▸'}
                      </span>
                    </div>

                    {/* Expanded block list */}
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${t.border2}`, padding: '10px 18px 14px' }}>
                        {athlete.blocks.length === 0 ? (
                          <p style={{ fontSize: '13px', color: t.text3, margin: '8px 0' }}>Sin bloques creados</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            {athlete.blocks.map(block => (
                              <div
                                key={block.id}
                                onClick={() => onViewAthleteBlocks(athlete.athlete_id, athlete.display_name)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: t.surface2, borderRadius: '8px', cursor: 'pointer' }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{block.name}</div>
                                  <div style={{ fontSize: '12px', color: t.text3, marginTop: '1px' }}>
                                    {block.num_weeks} sem{block.objective ? ` · ${OBJECTIVE_LABELS[block.objective] || block.objective}` : ''}
                                  </div>
                                </div>
                                <span style={{ color: t.text3, fontSize: '14px' }}>›</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nav cards */}
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'grid', gap: '12px' }}>
        {cards.map(card => (
          <button
            key={card.title}
            onClick={() => {
              if (!card.enabled || !card.id) return;
              if (card.id === 'calendario') { onViewCalendar?.(); return; }
              if (card.id === 'coach-panel') { onViewCoachPanel?.(); return; }
              if (card.id === 'progress') { onViewProgress?.(); return; }
              if (card.id === 'checkin') { onViewCheckin?.(); return; }
              if (card.id === 'competitions') { onViewCompetitions?.(); return; }
              setView(card.id);
            }}
            disabled={!card.enabled}
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px 22px', textAlign: 'left', cursor: card.enabled ? 'pointer' : 'default', transition: 'border-color 150ms ease, background-color 150ms ease', display: 'flex', alignItems: 'center', gap: '16px', opacity: card.enabled ? 1 : 0.5 }}
            onMouseEnter={e => { if (card.enabled) { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.backgroundColor = t.surface2; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.backgroundColor = t.surface; }}
          >
            <span style={{ width: '46px', height: '46px', backgroundColor: card.iconBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
              {card.icon}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '3px' }}>{card.title}</div>
              <div style={{ color: t.text2, fontSize: '13px' }}>{card.desc}</div>
            </div>
            {card.badge && (
              <span style={{ backgroundColor: t.danger, color: '#fff', borderRadius: '50%', minWidth: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', padding: '0 4px' }}>
                {card.badge}
              </span>
            )}
            {card.soon && (
              <span style={{ backgroundColor: t.surface3, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', color: t.text3, letterSpacing: '0.3px' }}>PRONTO</span>
            )}
            {card.enabled && !card.soon && <span style={{ color: t.text3, fontSize: '20px' }}>›</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuView;
