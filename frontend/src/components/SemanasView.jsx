import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const SemanasView = ({ blockId, block, userRole, athleteId, onSelectWeek, onBack }) => {
  const [semanas, setSemanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Athletes always filter by published — self-coached blocks auto-publish all weeks so no regression
  const athleteFiltered = userRole === 'athlete';

  useEffect(() => {
    if (!blockId) return;
    const params = athleteFiltered ? { published_only: true } : {};
    axios.get(`${API}/blocks/${blockId}/weeks/`, { params })
      .then(r => setSemanas(r.data.semanas || []))
      .catch(() => setError('No se pudieron cargar las semanas'))
      .finally(() => setLoading(false));
  }, [blockId, athleteFiltered]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>
              {block?.name || 'Semanas'}
            </h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              {athleteFiltered
                ? `${semanas.length} semana${semanas.length !== 1 ? 's' : ''} publicada${semanas.length !== 1 ? 's' : ''}`
                : `${semanas.length} semana${semanas.length !== 1 ? 's' : ''} en total`}
            </p>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: t.text2, padding: '48px 0' }}>Cargando...</p>}
        {error && (
          <div style={{ backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`, borderRadius: '10px', padding: '14px', color: t.danger, fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!loading && semanas.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
            <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>Sin semanas disponibles</p>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              {athleteFiltered
                ? 'Tu entrenador aún no ha publicado ninguna semana'
                : 'Este bloque no tiene semanas'}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {semanas.map(s => {
            const isPublished = s.published === 1;
            return (
              <button key={s.id} onClick={() => onSelectWeek(s.id)}
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${isPublished ? t.border : t.border2}`,
                  borderRadius: '12px', padding: '22px 12px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 150ms ease', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.backgroundColor = t.surface2; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isPublished ? t.border : t.border2; e.currentTarget.style.backgroundColor = t.surface; }}
              >
                <div style={{ fontSize: '22px', fontWeight: '800', color: isPublished ? t.primary : t.text3, letterSpacing: '-0.5px' }}>
                  {s.week_number}
                </div>
                <div style={{ fontSize: '12px', color: t.text2, marginTop: '4px' }}>Semana</div>
                {/* Publication badge — only visible for coaches */}
                {userRole === 'coach' && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    fontSize: '9px', fontWeight: '700', letterSpacing: '0.3px',
                    padding: '2px 5px', borderRadius: '4px',
                    backgroundColor: isPublished ? `${t.primary}20` : `${t.text3}15`,
                    color: isPublished ? t.primary : t.text3,
                    border: `1px solid ${isPublished ? t.primary + '40' : t.border2}`,
                  }}>
                    {isPublished ? '✓' : '—'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SemanasView;
