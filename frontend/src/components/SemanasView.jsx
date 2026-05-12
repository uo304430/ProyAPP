import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const SemanasView = ({ blockId, onSelectWeek, onBack }) => {
  const [semanas, setSemanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!blockId) return;
    axios.get(`${API}/blocks/${blockId}/weeks/`)
      .then(r => setSemanas(r.data.semanas || []))
      .catch(() => setError('No se pudieron cargar las semanas'))
      .finally(() => setLoading(false));
  }, [blockId]);

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
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Semanas</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              Selecciona una semana para ver los días
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {semanas.map(s => (
            <button
              key={s.id}
              onClick={() => onSelectWeek(s.id)}
              style={{
                backgroundColor: t.surface, border: `1px solid ${t.border}`,
                borderRadius: '12px', padding: '22px 12px',
                cursor: 'pointer', textAlign: 'center',
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
              <div style={{ fontSize: '22px', fontWeight: '800', color: t.primary, letterSpacing: '-0.5px' }}>
                {s.week_number}
              </div>
              <div style={{ fontSize: '12px', color: t.text2, marginTop: '4px' }}>Semana</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SemanasView;