import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DiasView = ({ weekId, onSelectDay, onCheckin, onBack }) => {
  const [dias, setDias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!weekId) return;
    axios.get(`${API}/weeks/${weekId}/days/`)
      .then(r => setDias(r.data.dias || []))
      .catch(() => setError('No se pudieron cargar los días'))
      .finally(() => setLoading(false));
  }, [weekId]);

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
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Días</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>Elige qué día entrenar hoy</p>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: t.text2, padding: '48px 0' }}>Cargando...</p>}
        {error && (
          <div style={{
            backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
            borderRadius: '10px', padding: '14px', color: t.danger, fontSize: '14px',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dias.map(dia => (
            <button
              key={dia.id}
              onClick={() => onSelectDay(dia.id)}
              style={{
                backgroundColor: t.surface, border: `1px solid ${t.border}`,
                borderRadius: '12px', padding: '18px 20px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = t.primary;
                e.currentTarget.style.backgroundColor = t.surface2;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.backgroundColor = t.surface;
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                backgroundColor: t.primaryDim, border: `1px solid ${t.primary}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '800', color: t.primary, flexShrink: 0,
              }}>
                {dia.day_number}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>
                  {dia.day_name || `Día ${dia.day_number}`}
                  {!dia.day_name && dia.day_number <= 6 && (
                    <span style={{ color: t.text2, fontWeight: '400', fontSize: '13px', marginLeft: '8px' }}>
                      {DAY_NAMES[dia.day_number - 1]}
                    </span>
                  )}
                </div>
                <div style={{ color: t.text2, fontSize: '13px', marginTop: '2px' }}>
                  Ver ejercicios planificados
                </div>
              </div>
              <span style={{ marginLeft: 'auto', color: t.text3, fontSize: '20px' }}>›</span>
            </button>
          ))}

          {/* Cuestionario semanal */}
          {onCheckin && (
            <button
              onClick={onCheckin}
              style={{
                backgroundColor: t.surface, border: `1px solid ${t.border}`,
                borderRadius: '12px', padding: '18px 20px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 150ms ease', marginTop: '4px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#3a86ff';
                e.currentTarget.style.backgroundColor = t.surface2;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.backgroundColor = t.surface;
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                backgroundColor: '#3a86ff18', border: '1px solid #3a86ff30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                💚
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>Cuestionario semanal</div>
                <div style={{ color: t.text2, fontSize: '13px', marginTop: '2px' }}>
                  Bienestar · fatiga · sueño · motivación
                </div>
              </div>
              <span style={{ marginLeft: 'auto', color: t.text3, fontSize: '20px' }}>›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiasView;