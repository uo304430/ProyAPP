import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t, btnPrimary, btnDanger } from '../styles/theme';

const API = '/api';

const OBJECTIVE_LABELS = {
  acumulacion: { label: 'Acumulación', color: t.info },
  intensificacion: { label: 'Intensificación', color: t.warning },
  peaking: { label: 'Peaking', color: t.primary },
  descarga: { label: 'Descarga', color: t.text2 },
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
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Coach viewing athlete banner */}
        {viewingAthleteName && (
          <div style={{
            backgroundColor: t.infoDim, border: `1px solid ${t.info}30`,
            borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
          }}>
            <span style={{ fontSize: '16px' }}>👁️</span>
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
              borderRadius: '8px', width: '36px', height: '36px',
              cursor: 'pointer', color: t.text2, fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Mis Bloques</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              {bloques.length} bloque{bloques.length !== 1 ? 's' : ''} de entrenamiento
            </p>
          </div>
          <button onClick={onCreateBlock} style={btnPrimary}>
            + Nuevo
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: t.text2 }}>
            Cargando...
          </div>
        )}
        {error && (
          <div style={{
            backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
            borderRadius: '10px', padding: '14px', color: t.danger, fontSize: '14px',
          }}>{error}</div>
        )}

        {!loading && bloques.length === 0 && !error && (
          <div style={{
            textAlign: 'center', padding: '64px 20px',
            backgroundColor: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '16px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏋️</div>
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>Sin bloques todavía</p>
            <p style={{ color: t.text2, fontSize: '14px', marginBottom: '24px' }}>
              Crea tu primer bloque de entrenamiento
            </p>
            <button onClick={onCreateBlock} style={btnPrimary}>Crear primer bloque</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bloques.map(b => {
            const obj = OBJECTIVE_LABELS[b.objective] || null;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBlock(b.id)}
                style={{
                  backgroundColor: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: '14px', padding: '20px 22px',
                  cursor: 'pointer', transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.backgroundColor = t.surface2; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.backgroundColor = t.surface; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '-0.2px', truncate: true }}>
                      {b.name}
                    </span>
                    {obj && (
                      <span style={{
                        fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px',
                        padding: '2px 8px', borderRadius: '20px',
                        backgroundColor: `${obj.color}18`,
                        color: obj.color, border: `1px solid ${obj.color}35`,
                      }}>
                        {obj.label.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: t.text2 }}>
                    {b.num_weeks} semana{b.num_weeks !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {userId === b.coach_id && (
                    <button
                      onClick={e => { e.stopPropagation(); onEditBlock(b.id); }}
                      style={{
                        padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '500',
                        backgroundColor: t.surface3, color: t.text2,
                        border: `1px solid ${t.border2}`,
                      }}
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={e => eliminar(e, b.id)}
                    style={btnDanger}
                  >
                    Eliminar
                  </button>
                  <span style={{ color: t.text3, fontSize: '20px' }}>›</span>
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
