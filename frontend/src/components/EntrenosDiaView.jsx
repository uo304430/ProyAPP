import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const CATEGORY_COLORS = {
  basic: { bg: t.primaryDim, text: t.primary, border: `${t.primary}30` },
  accessory: { bg: t.infoDim, text: t.info, border: `${t.info}30` },
};

const EntrenosDiaView = ({ dayId, onSelectWorkout, onBack }) => {
  const [entrenos, setEntrenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dayId) return;
    axios.get(`${API}/days/${dayId}/workouts/`)
      .then(r => setEntrenos(r.data.entrenos || []))
      .catch(() => setError('No se pudieron cargar los ejercicios'))
      .finally(() => setLoading(false));
  }, [dayId]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: `1px solid ${t.border2}`,
              borderRadius: '8px', width: '36px', height: '36px',
              cursor: 'pointer', color: t.text2, fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>
              Sesión de hoy
            </h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              {entrenos.length} ejercicio{entrenos.length !== 1 ? 's' : ''} planificado{entrenos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: t.text2, padding: '48px 0' }}>Cargando...</p>}
        {error && (
          <div style={{
            backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
            borderRadius: '10px', padding: '14px', color: t.danger, fontSize: '14px',
          }}>{error}</div>
        )}

        {!loading && entrenos.length === 0 && !error && (
          <div style={{
            textAlign: 'center', padding: '64px 20px',
            backgroundColor: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '16px',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontWeight: '600', marginBottom: '6px' }}>Sin ejercicios planificados</p>
            <p style={{ color: t.text2, fontSize: '14px' }}>Este día no tiene ejercicios asignados aún</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entrenos.map((e, idx) => (
            <button
              key={e.plan_id}
              onClick={() => onSelectWorkout(e)}
              style={{
                backgroundColor: t.surface, border: `1px solid ${t.border}`,
                borderRadius: '14px', padding: '18px 20px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={el => {
                el.currentTarget.style.borderColor = t.primary;
                el.currentTarget.style.backgroundColor = t.surface2;
              }}
              onMouseLeave={el => {
                el.currentTarget.style.borderColor = t.border;
                el.currentTarget.style.backgroundColor = t.surface;
              }}
            >
              {/* Order number */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: t.surface3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700', color: t.text2, flexShrink: 0,
              }}>
                {idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '-0.2px' }}>
                  {e.ejercicio_nombre}
                </div>
                {e.modifier && (
                  <div style={{ fontSize: '12px', color: t.text3, marginTop: '3px' }}>{e.modifier}</div>
                )}
              </div>

              <span style={{ color: t.text3, fontSize: '20px', flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntrenosDiaView;
