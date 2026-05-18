import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const DOT_COLORS = {
  on:    t.primary,
  under: t.info,
  over:  t.danger,
  empty: t.border2,
};

const STATUS_BG = {
  on:    t.primaryDim,
  under: t.infoDim,
  over:  t.dangerDim,
  empty: 'transparent',
};

const STATUS_BORDER = {
  on:    `rgba(212, 137, 42, 0.25)`,
  under: `rgba(74, 143, 212, 0.25)`,
  over:  `rgba(200, 64, 48, 0.25)`,
  empty: t.border2,
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
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontFamily: t.fontBody }}>
          Volver
        </button>
      </div>
    );
  }

  const GRID = '14px 1fr 1fr 1fr 1fr 1.4fr';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg }}>
      <div style={{
        maxWidth: '620px', margin: '0 auto',
        padding: '28px 16px 56px',
        animation: 'fadeInUp 320ms cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', padding: '0 0 4px',
            cursor: 'pointer', color: t.text2, fontSize: '14px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: t.fontBody, letterSpacing: '0.02em',
            transition: 'color 160ms ease',
            marginBottom: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = t.text}
          onMouseLeave={e => e.currentTarget.style.color = t.text2}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Atrás
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: '24px', gap: '16px',
        }}>
          <h1 style={{
            fontSize: '21px', fontWeight: '800', letterSpacing: '-0.3px',
            lineHeight: 1.2, fontFamily: t.fontBody, flex: 1,
          }}>
            {workout.ejercicio_nombre}
          </h1>

          {/* Set counter — Bebas Neue */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              fontFamily: t.fontDisplay,
              fontSize: '42px',
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: completedCount === series.length && series.length > 0 ? t.primary : t.text,
              transition: 'color 300ms ease',
            }}>
              {completedCount}<span style={{ color: t.text3, fontSize: '28px' }}>/{series.length}</span>
            </div>
            <div style={{
              fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: t.text3,
              fontFamily: t.fontBody, marginTop: '2px',
            }}>
              SERIES
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${t.border}`,
          marginBottom: '20px',
        }}>
          {['target', 'actual'].map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              style={{
                background: 'none', border: 'none',
                padding: '10px 24px',
                cursor: 'pointer',
                fontSize: '11px', fontWeight: '700',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: tab === tb ? t.text : t.text3,
                borderBottom: `2px solid ${tab === tb ? t.primary : 'transparent'}`,
                marginBottom: '-1px',
                transition: 'all 160ms ease',
                fontFamily: t.fontBody,
              }}
            >
              {tb === 'target' ? 'Target' : 'Actual'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: '10px', padding: '10px 14px',
            color: '#ef4444', fontSize: '13px', marginBottom: '16px',
            fontFamily: t.fontBody,
          }}>
            {error}
          </div>
        )}

        {/* Column headers */}
        {series.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: tab === 'actual' ? GRID : '14px 1fr 1fr 1fr 1fr',
            gap: '8px', paddingLeft: '4px', marginBottom: '8px',
          }}>
            <div /><div />
            {(tab === 'actual' ? ['PESO', 'REPS', 'RPE', 'NOTA'] : ['PESO', 'REPS', 'RPE']).map(h => (
              <div key={h} style={{
                textAlign: 'center', fontSize: '9px', fontWeight: '700',
                color: t.text3, letterSpacing: '0.1em', fontFamily: t.fontBody,
              }}>
                {h}
              </div>
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
                  gridTemplateColumns: tab === 'actual' ? GRID : '14px 1fr 1fr 1fr 1fr',
                  gap: '8px', alignItems: 'center',
                  padding: '10px 10px',
                  borderRadius: '10px',
                  backgroundColor: done ? STATUS_BG[status] : t.surface,
                  border: `1px solid ${done ? STATUS_BORDER[status] : t.border2}`,
                  transition: 'background-color 200ms ease, border-color 200ms ease',
                }}
              >
                {/* Status dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    backgroundColor: DOT_COLORS[status],
                    boxShadow: done && status !== 'empty' ? `0 0 6px ${DOT_COLORS[status]}80` : 'none',
                    transition: 'background-color 200ms ease, box-shadow 200ms ease',
                  }} />
                </div>

                {/* Plan reference */}
                <div style={{
                  fontSize: '12px', fontWeight: '500', color: t.text2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: t.fontBody, letterSpacing: '0.01em',
                }}>
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
                          width: '100%', padding: '8px 4px',
                          backgroundColor: t.surface2, color: t.text,
                          border: `1px solid ${t.border2}`,
                          borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                          textAlign: 'center', outline: 'none',
                          fontFamily: t.fontBody,
                          transition: 'border-color 160ms ease, box-shadow 160ms ease',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = t.primary;
                          e.target.style.boxShadow = '0 0 0 2px rgba(0,255,135,0.1)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = t.border2;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    ))}
                    <input
                      type="text"
                      value={notes[idx] ?? ''}
                      onChange={e => setNotes(prev => prev.map((n, i) => i === idx ? e.target.value : n))}
                      onBlur={() => handleNoteBlur(idx)}
                      placeholder="nota..."
                      style={{
                        width: '100%', padding: '8px 8px',
                        backgroundColor: t.surface2, color: t.text,
                        border: `1px solid ${t.border2}`,
                        borderRadius: '8px', fontSize: '12px',
                        outline: 'none', fontFamily: t.fontBody,
                        transition: 'border-color 160ms ease',
                      }}
                      onFocus={e => e.target.style.borderColor = t.primary}
                      onBlur={e => e.target.style.borderColor = t.border2}
                    />
                  </>
                ) : (
                  <>
                    {[serie.planned_weight, serie.planned_reps, serie.planned_rpe].map((val, i) => (
                      <div key={i} style={{
                        textAlign: 'center', fontSize: '14px',
                        color: t.text2, fontWeight: '600',
                        fontFamily: t.fontBody,
                      }}>
                        {val != null ? val : '—'}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add set button — coaches only */}
        {tab === 'actual' && isCoach && (
          <button onClick={handleAddSet}
            style={{
              width: '100%', marginTop: '10px',
              background: t.primaryDim,
              border: `1px dashed rgba(0,255,135,0.3)`,
              borderRadius: '10px', padding: '12px',
              color: t.primary, fontSize: '20px', cursor: 'pointer',
              fontWeight: '300', lineHeight: 1,
              transition: 'background 160ms ease, border-color 160ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,255,135,0.12)';
              e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = t.primaryDim;
              e.currentTarget.style.borderColor = 'rgba(0,255,135,0.3)';
            }}
          >
            +
          </button>
        )}

        {series.length === 0 && !error && (
          <div style={{
            textAlign: 'center', padding: '48px',
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '16px', color: t.text3, fontSize: '14px',
            fontFamily: t.fontBody,
          }}>
            Sin series definidas
          </div>
        )}

        {/* Statistics */}
        {series.length > 0 && (
          <div style={{
            marginTop: '20px',
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: '16px', padding: '20px 22px',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: t.text3,
              fontFamily: t.fontBody, marginBottom: '16px',
            }}>
              Estadísticas
            </div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {isBasic && (
                <div>
                  <div style={{
                    fontFamily: t.fontDisplay,
                    fontSize: '38px',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    color: bestE1rm ? t.primary : t.text3,
                  }}>
                    {bestE1rm ? bestE1rm : '—'}
                  </div>
                  <div style={{
                    fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: t.text3,
                    fontFamily: t.fontBody, marginTop: '4px',
                  }}>
                    E1RM (kg)
                  </div>
                </div>
              )}
              <div>
                <div style={{
                  fontFamily: t.fontDisplay,
                  fontSize: '38px',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  color: tonnage > 0 ? t.text : t.text3,
                }}>
                  {tonnage > 0 ? tonnage.toLocaleString('es-ES') : '—'}
                </div>
                <div style={{
                  fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: t.text3,
                  fontFamily: t.fontBody, marginTop: '4px',
                }}>
                  Tonelaje (kg)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion bar */}
        {series.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: `${series.length > 0 ? (completedCount / series.length) * 100 : 0}%` }}
              />
            </div>
            {completedCount === series.length && series.length > 0 && (
              <p style={{
                textAlign: 'center', color: t.primary,
                fontSize: '12px', fontWeight: '700',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginTop: '10px', fontFamily: t.fontBody,
                animation: 'fadeIn 300ms both',
              }}>
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
