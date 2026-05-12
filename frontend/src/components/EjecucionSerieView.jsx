import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const DOT_COLORS = {
  on:    t.primary,
  under: '#3a86ff',
  over:  '#ef4444',
  empty: t.border2,
};

const STATUS_BG = {
  on:    `${t.primary}12`,
  under: '#3a86ff12',
  over:  '#ef444412',
  empty: 'transparent',
};

const getStatus = (planned_rpe, actual_rpe) => {
  if (!actual_rpe) return 'empty';
  const diff = parseFloat(actual_rpe) - parseFloat(planned_rpe);
  if (Math.abs(diff) <= 0.4) return 'on';
  return diff < 0 ? 'under' : 'over';
};

const calcE1rm = (weight, reps, rpe) => {
  if (!weight || !reps || !rpe || weight <= 0) return null;
  const repsEq = reps + (10 - rpe);
  if (repsEq <= 0) return null;
  return Math.round((weight / (1.0278 - 0.0278 * repsEq)) * 10) / 10;
};

const EjecucionSerieView = ({ workout, athleteId, userRole, onBack }) => {
  const [series, setSeries] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [e1rms, setE1rms] = useState([]);
  const [tab, setTab] = useState('actual');
  const [error, setError] = useState('');

  const isBasic = workout?.exercise_category === 'basic';
  const isCoach = userRole === 'coach';

  useEffect(() => {
    if (!workout?.plan_id) { setSeries([]); setActuals([]); setNotes([]); setE1rms([]); return; }
    axios.get(`${API}/planned_workouts/${workout.plan_id}/series/`)
      .then(r => {
        const loaded = r.data.series || [];
        setSeries(loaded);
        setActuals(loaded.map(s => ({ weight: s.weight ?? '', reps: s.reps ?? '', rpe: s.rpe ?? '' })));
        setNotes(loaded.map(s => s.note ?? ''));
        setE1rms(loaded.map(s => s.estimated_1rm || null));
      })
      .catch(() => setError('Error cargando series'));
  }, [workout]);

  const handleChange = async (idx, field, value) => {
    const next = actuals.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setActuals(next);
    const row = next[idx];
    const serie = series[idx];
    if (!serie?.id || !row.weight || !row.reps || !row.rpe) return;
    try {
      const { data } = await axios.put(`${API}/series/${serie.id}/`, {
        weight: parseFloat(row.weight),
        reps: parseInt(row.reps),
        rpe: parseFloat(row.rpe),
        note: notes[idx] || null,
      });
      if (isBasic && data.e1rm) setE1rms(prev => prev.map((v, i) => i === idx ? data.e1rm : v));
    } catch {}
  };

  const handleNoteBlur = async (idx) => {
    const serie = series[idx];
    if (!serie?.id) return;
    try {
      await axios.put(`${API}/series/${serie.id}/`, {
        note: notes[idx] || null,
        ...(actuals[idx]?.weight ? {
          weight: parseFloat(actuals[idx].weight),
          reps: parseInt(actuals[idx].reps) || undefined,
          rpe: parseFloat(actuals[idx].rpe) || undefined,
        } : {}),
      });
    } catch {}
  };

  const handleAddSet = async () => {
    try {
      const { data } = await axios.post(`${API}/planned_workouts/${workout.plan_id}/series/add/`);
      setSeries(prev => [...prev, data]);
      setActuals(prev => [...prev, { weight: '', reps: '', rpe: '' }]);
      setNotes(prev => [...prev, '']);
      setE1rms(prev => [...prev, null]);
    } catch {}
  };

  const completedCount = actuals.filter(r => r.weight && r.reps && r.rpe).length;
  const bestE1rm = isBasic ? (e1rms.filter(Boolean).length > 0 ? Math.max(...e1rms.filter(Boolean)) : null) : null;
  const tonnage = actuals.reduce((sum, r) => {
    if (r.weight && r.reps) return sum + parseFloat(r.weight) * parseInt(r.reps);
    return sum;
  }, 0);

  if (!workout) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer' }}>Volver</button>
      </div>
    );
  }

  // Grid: dot | plan_ref | WEIGHT | REPS | RPE | NOTA
  const GRID = '16px 1fr 1fr 1fr 1fr 1.4fr';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: t.text2, fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ‹ Atrás
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {workout.ejercicio_nombre}
          </h1>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: completedCount === series.length && series.length > 0 ? t.primary : t.text }}>
              {completedCount}/{series.length}
            </div>
            <div style={{ fontSize: '10px', color: t.text3, fontWeight: '700', letterSpacing: '0.5px' }}>SERIES</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, marginBottom: '20px' }}>
          {['target', 'actual'].map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              style={{
                background: 'none', border: 'none', padding: '10px 24px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                letterSpacing: '0.8px', textTransform: 'uppercase',
                color: tab === tb ? t.text : t.text3,
                borderBottom: `2px solid ${tab === tb ? t.primary : 'transparent'}`,
                marginBottom: '-1px', transition: 'all 150ms ease',
              }}
            >
              {tb === 'target' ? 'Target' : 'Actual'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#ef444415', border: '1px solid #ef444430', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Column headers */}
        {series.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '8px', paddingLeft: '4px', marginBottom: '6px' }}>
            <div /><div />
            {(tab === 'actual' ? ['PESO', 'REPS', 'RPE', 'NOTA'] : ['PESO', 'REPS', 'RPE']).map(h => (
              <div key={h} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: t.text3, letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
        )}

        {/* Set rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {series.map((serie, idx) => {
            const r = actuals[idx] || {};
            const status = getStatus(serie.planned_rpe, r.rpe);
            const done = !!(r.weight && r.reps && r.rpe);

            return (
              <div key={serie.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: tab === 'actual' ? GRID : '16px 1fr 1fr 1fr 1fr',
                  gap: '8px', alignItems: 'center',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  backgroundColor: done ? STATUS_BG[status] : t.surface,
                  border: `1px solid ${done ? `${DOT_COLORS[status]}30` : t.border2}`,
                  transition: 'all 200ms ease',
                }}
              >
                {/* Status dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: DOT_COLORS[status], transition: 'background-color 200ms ease' }} />
                </div>

                {/* Plan reference */}
                <div style={{ fontSize: '12px', fontWeight: '600', color: t.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {serie.planned_weight ? `${serie.planned_weight}kg` : ''} ×{serie.planned_reps} @{serie.planned_rpe}
                </div>

                {tab === 'actual' ? (
                  <>
                    {[
                      { field: 'weight', step: '0.5', placeholder: '—' },
                      { field: 'reps',   step: '1',   placeholder: '—' },
                      { field: 'rpe',    step: '0.5', placeholder: '—' },
                    ].map(({ field, step, placeholder }) => (
                      <input key={field} type="number" step={step} min="0"
                        value={r[field] ?? ''}
                        onChange={e => handleChange(idx, field, e.target.value)}
                        placeholder={placeholder}
                        style={{
                          width: '100%', padding: '8px 4px', boxSizing: 'border-box',
                          backgroundColor: t.surface2, color: t.text,
                          border: `1px solid ${t.border2}`,
                          borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                          textAlign: 'center', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = t.primary}
                        onBlur={e => e.target.style.borderColor = t.border2}
                      />
                    ))}
                    {/* Note input */}
                    <input
                      type="text"
                      value={notes[idx] ?? ''}
                      onChange={e => setNotes(prev => prev.map((n, i) => i === idx ? e.target.value : n))}
                      onBlur={() => handleNoteBlur(idx)}
                      placeholder="nota..."
                      style={{
                        width: '100%', padding: '8px 6px', boxSizing: 'border-box',
                        backgroundColor: t.surface2, color: t.text,
                        border: `1px solid ${t.border2}`,
                        borderRadius: '8px', fontSize: '12px',
                        outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = t.primary}
                      onBlur2={e => e.target.style.borderColor = t.border2}
                    />
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: t.text2, fontWeight: '600' }}>
                      {serie.planned_weight != null ? serie.planned_weight : '—'}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: t.text2, fontWeight: '600' }}>
                      {serie.planned_reps}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: t.text2, fontWeight: '600' }}>
                      {serie.planned_rpe}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* + set button — only coaches can add sets */}
        {tab === 'actual' && isCoach && (
          <button onClick={handleAddSet}
            style={{
              width: '100%', marginTop: '10px',
              backgroundColor: t.primaryDim, border: `1px dashed ${t.primary}50`,
              borderRadius: '10px', padding: '11px',
              color: t.primary, fontSize: '22px', cursor: 'pointer',
              fontWeight: '300', lineHeight: 1,
            }}
          >+</button>
        )}

        {series.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', color: t.text3, fontSize: '14px' }}>
            Sin series definidas
          </div>
        )}

        {/* Statistics */}
        {series.length > 0 && (
          <div style={{ marginTop: '20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Estadísticas</div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: t.text2 }}>
              {bestE1rm ? (
                <span>E1RM: <strong style={{ color: t.primary, fontSize: '15px' }}>{bestE1rm} kg</strong></span>
              ) : (
                <span style={{ color: t.text3 }}>E1RM: —</span>
              )}
              <span>
                Tonelaje:{' '}
                <strong style={{ fontSize: '15px' }}>
                  {tonnage > 0 ? `${tonnage.toLocaleString('es-ES')} kg` : '—'}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Completion bar */}
        {series.length > 0 && completedCount > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '3px', backgroundColor: t.surface3, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', backgroundColor: t.primary, borderRadius: '2px',
                width: `${(completedCount / series.length) * 100}%`,
                transition: 'width 300ms ease',
              }} />
            </div>
            {completedCount === series.length && (
              <p style={{ textAlign: 'center', color: t.primary, fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
                ✓ Ejercicio completado
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EjecucionSerieView;
