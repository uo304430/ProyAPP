import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t, btnPrimary, btnDanger } from '../styles/theme';

const API = '/api';

const OBJECTIVE_META = {
  acumulacion:    { label: 'Acumulación',    color: t.info,    bg: t.infoDim    },
  intensificacion:{ label: 'Intensificación',color: t.warning, bg: t.warningDim },
  peaking:        { label: 'Peaking',        color: t.primary, bg: t.primaryDim },
  descarga:       { label: 'Descarga',       color: t.text2,   bg: 'rgba(136,136,168,0.08)' },
};

const BloquesView = ({ athleteId, userId, viewingAthleteName, onSelectBlock, onEditBlock, onBack, onCreateBlock }) => {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/atleta/${athleteId}/blocks/`)
      .then(r => setBloques(r.data.bloques))
      .catch(() => setError('No se pudieron cargar los bloques'))
      .finally(() => setLoading(false));
  }, [athleteId]);

  const eliminar = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este bloque?')) return;
    try {
      await axios.delete(`${API}/blocks/${id}/`);
      setBloques(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Error al eliminar');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '36px 20px 64px' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeInUp 320ms cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Coach banner */}
        {viewingAthleteName && (
          <div style={{
            background: t.infoDim,
            border: `1px solid rgba(41,121,255,0.2)`,
            borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            fontFamily: t.fontBody,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.info} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ color: t.text2 }}>
              Viendo bloques de{' '}
              <span style={{ color: t.info, fontWeight: '600' }}>{viewingAthleteName}</span>
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: `1px solid ${t.border2}`,
              borderRadius: '10px', width: '38px', height: '38px',
              cursor: 'pointer', color: t.text2, fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'border-color 160ms ease, color 160ms ease',
              fontFamily: t.fontBody,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderHover; e.currentTarget.style.color = t.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border2; e.currentTarget.style.color = t.text2; }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px',
              fontFamily: t.fontBody,
            }}>
              Mis Bloques
            </h1>
            <p style={{ color: t.text3, fontSize: '13px', fontFamily: t.fontBody }}>
              {loading ? '...' : `${bloques.length} bloque${bloques.length !== 1 ? 's' : ''} de entrenamiento`}
            </p>
          </div>
          <button
            onClick={onCreateBlock}
            className="btn btn-primary"
          >
            + Nuevo
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '84px', borderRadius: '16px' }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: t.dangerDim, border: `1px solid rgba(255,61,85,0.22)`,
            borderRadius: '12px', padding: '14px', color: t.danger,
            fontSize: '14px', fontFamily: t.fontBody,
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && bloques.length === 0 && !error && (
          <div style={{
            textAlign: 'center', padding: '64px 20px',
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '20px',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            animation: 'fadeInUp 320ms 60ms both',
          }}>
            {/* Dumbbell icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
              <path d="M6.5 6.5h11"/>
              <path d="M6.5 17.5h11"/>
              <path d="M3 9.5V14.5"/>
              <path d="M21 9.5V14.5"/>
              <path d="M3 7.5a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"/>
              <path d="M16.5 7.5a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-.5a2 2 0 0 1-2-2v-9z"/>
              <line x1="7.5" y1="12" x2="16.5" y2="12"/>
            </svg>
            <p style={{
              fontWeight: '700', fontSize: '16px', marginBottom: '8px',
              fontFamily: t.fontBody,
            }}>
              Sin bloques todavía
            </p>
            <p style={{
              color: t.text2, fontSize: '14px', marginBottom: '28px',
              fontFamily: t.fontBody,
            }}>
              Crea tu primer bloque de entrenamiento
            </p>
            <button onClick={onCreateBlock} className="btn btn-primary">
              Crear primer bloque
            </button>
          </div>
        )}

        {/* Block list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bloques.map((b, idx) => {
            const obj = OBJECTIVE_META[b.objective] || null;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBlock(b)}
                className="card card-hover"
                style={{
                  padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  animation: `fadeInUp 320ms ${idx * 50}ms both`,
                }}
              >
                {/* Week count — display font */}
                <div style={{
                  flexShrink: 0, textAlign: 'center',
                  width: '48px',
                }}>
                  <div style={{
                    fontFamily: t.fontDisplay,
                    fontSize: '36px',
                    color: obj ? obj.color : t.text2,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                  }}>
                    {b.num_weeks}
                  </div>
                  <div style={{
                    fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: t.text3,
                    fontFamily: t.fontBody, marginTop: '2px',
                  }}>
                    {b.num_weeks === 1 ? 'SEM' : 'SEMS'}
                  </div>
                </div>

                {/* Vertical separator */}
                <div style={{
                  width: '1px', height: '40px', flexShrink: 0,
                  background: t.border,
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '4px', flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontWeight: '700', fontSize: '15px',
                      letterSpacing: '-0.1px', fontFamily: t.fontBody,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {b.name}
                    </span>
                    {obj && (
                      <span className="tag" style={{
                        color: obj.color,
                        backgroundColor: obj.bg,
                        borderColor: `${obj.color}30`,
                      }}>
                        {obj.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  flexShrink: 0,
                }}>
                  {userId === b.coach_id && (
                    <button
                      onClick={e => { e.stopPropagation(); onEditBlock(b.id); }}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: t.surface3, color: t.text2,
                        border: `1px solid ${t.border2}`,
                        transition: 'all 160ms ease',
                        fontFamily: t.fontBody,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.borderColor = t.borderHover; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.text2; e.currentTarget.style.borderColor = t.border2; }}
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={e => eliminar(e, b.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Eliminar
                  </button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BloquesView;
