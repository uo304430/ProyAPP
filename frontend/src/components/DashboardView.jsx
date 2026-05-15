import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const LIFT_COLORS = { SQ: '#00ff87', BP: '#3a86ff', DL: '#ffa502', OTHER: '#9898b0' };
const LIFT_LABELS = { SQ: 'Sentadilla', BP: 'Press Banca', DL: 'Peso Muerto' };
const LIFTS = ['SQ', 'BP', 'DL'];

const classifyLift = (name = '', sub = '') => {
  const s = sub.toUpperCase();
  if (['SQ', 'BP', 'DL'].includes(s)) return s;
  const n = name.toLowerCase();
  if (/squat|sentadilla/.test(n)) return 'SQ';
  if (/bench|banca|banco/.test(n)) return 'BP';
  if (/deadlift|muerto/.test(n)) return 'DL';
  return 'OTHER';
};

const fmt1 = v => (v == null || v === 0 ? '—' : v.toFixed(1));
const fmtTon = v => (!v ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}`);

// ── SVG Charts ────────────────────────────────────────────────────────────────

const SIBarChart = ({ entries }) => {
  const n = entries.length || 1;
  const W = Math.max(340, n * 22), H = 130;
  const PAD = { t: 10, r: 8, b: 22, l: 30 };
  const pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b;
  const maxSI = Math.max(...entries.flatMap(e => LIFTS.map(l => e.by_lift[l]?.si || 0)), 0.01);
  const groupW = pw / n;
  const barW = (groupW * 0.8) / LIFTS.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: `${W}px`, minWidth: '100%', display: 'block' }}>
        {[0, 0.5, 1].map(p => {
          const y = PAD.t + ph * (1 - p);
          return (
            <g key={p}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#ffffff12" strokeWidth="0.8" />
              <text x={PAD.l - 3} y={y + 3} fontSize="7" fill="#666" textAnchor="end">{(maxSI * p).toFixed(1)}</text>
            </g>
          );
        })}
        {entries.map((entry, i) => {
          const gx = PAD.l + i * groupW + groupW * 0.1;
          return (
            <g key={i}>
              {entry.is_new_block && i > 0 && (
                <line x1={PAD.l + i * groupW} x2={PAD.l + i * groupW} y1={PAD.t} y2={PAD.t + ph}
                  stroke="#ffffff30" strokeWidth="1" strokeDasharray="3,2" />
              )}
              {LIFTS.map((lift, li) => {
                const val = entry.by_lift[lift]?.si || 0;
                if (!val) return null;
                const bh = (val / maxSI) * ph;
                return (
                  <rect key={lift} x={gx + li * barW} y={PAD.t + ph - bh} width={barW * 0.88}
                    height={bh} fill={LIFT_COLORS[lift]} rx="2" opacity="0.85" />
                );
              })}
              <text x={PAD.l + i * groupW + groupW / 2} y={H - 5} fontSize="7" fill="#666" textAnchor="middle">
                {entry.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const E1RMLineChart = ({ entries }) => {
  const n = entries.length || 1;
  const W = Math.max(340, n * 22), H = 130;
  const PAD = { t: 10, r: 8, b: 22, l: 34 };
  const pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b;
  const allVals = entries.flatMap(e => LIFTS.map(l => e.by_lift[l]?.e1rm || 0)).filter(v => v > 0);
  if (!allVals.length) return null;

  const minV = Math.floor(Math.min(...allVals) * 0.93);
  const maxV = Math.ceil(Math.max(...allVals) * 1.05);
  const range = maxV - minV || 1;
  const toX = i => n > 1 ? PAD.l + i * (pw / (n - 1)) : PAD.l + pw / 2;
  const toY = v => PAD.t + ph - ((v - minV) / range) * ph;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: `${W}px`, minWidth: '100%', display: 'block' }}>
        {[0, 0.5, 1].map(p => {
          const y = PAD.t + ph * (1 - p);
          return (
            <g key={p}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#ffffff12" strokeWidth="0.8" />
              <text x={PAD.l - 3} y={y + 3} fontSize="7" fill="#666" textAnchor="end">{Math.round(minV + range * p)}</text>
            </g>
          );
        })}
        {entries.map((entry, i) => entry.is_new_block && i > 0 && (
          <line key={i} x1={toX(i)} x2={toX(i)} y1={PAD.t} y2={PAD.t + ph}
            stroke="#ffffff30" strokeWidth="1" strokeDasharray="3,2" />
        ))}
        {LIFTS.map(lift => {
          const pts = entries.reduce((acc, e, i) => {
            const v = e.by_lift[lift]?.e1rm;
            if (v) acc.push({ x: toX(i), y: toY(v) });
            return acc;
          }, []);
          if (!pts.length) return null;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          return (
            <g key={lift}>
              <path d={d} fill="none" stroke={LIFT_COLORS[lift]} strokeWidth="1.5" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={LIFT_COLORS[lift]} />)}
            </g>
          );
        })}
        {entries.map((e, i) => (
          <text key={i} x={toX(i)} y={H - 5} fontSize="7" fill="#666" textAnchor="middle">{e.label}</text>
        ))}
      </svg>
    </div>
  );
};

const LiftLegend = ({ activeLiftTypes }) => (
  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
    {activeLiftTypes.map(l => (
      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: LIFT_COLORS[l] }} />
        <span style={{ fontSize: '12px', color: t.text2, fontWeight: '500' }}>{LIFT_LABELS[l]}</span>
      </div>
    ))}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px 14px' }}>
    <p style={{ fontSize: '11px', fontWeight: '700', color: t.text3, marginBottom: '8px', letterSpacing: '0.5px' }}>{title}</p>
    {children}
  </div>
);

// ── Tab 1: Histórico ──────────────────────────────────────────────────────────

const HistoricoTab = ({ analyticsBlocks }) => {
  const sorted = [...analyticsBlocks].sort((a, b) => {
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return a.start_date.localeCompare(b.start_date);
  });

  const timeline = sorted.flatMap((block, bi) =>
    block.weeks.map((week, wi) => ({
      label: wi === 0 ? `B${bi + 1}·1` : `${week.week_number}`,
      by_lift: week.by_lift,
      is_new_block: wi === 0,
    }))
  );

  const activeLiftTypes = LIFTS.filter(l => timeline.some(e => e.by_lift[l]));

  if (!timeline.length) return (
    <p style={{ color: t.text3, fontSize: '14px', textAlign: 'center', marginTop: '32px' }}>Sin series registradas aún</p>
  );

  return (
    <div>
      <LiftLegend activeLiftTypes={activeLiftTypes} />
      {sorted.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {sorted.map((block, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: t.surface2, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ fontSize: '10px', color: t.text3, fontWeight: '700' }}>B{i + 1}</span>
              <span style={{ fontSize: '11px', color: t.text2 }}>{block.block_name}</span>
              {block.start_date && <span style={{ fontSize: '10px', color: t.text3 }}>{block.start_date}</span>}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ChartCard title="ÍNDICE DE ESTRÉS (S.I) — HISTÓRICO"><SIBarChart entries={timeline} /></ChartCard>
        <ChartCard title="e1RM ESTIMADO (kg) — HISTÓRICO"><E1RMLineChart entries={timeline} /></ChartCard>
      </div>
    </div>
  );
};

// ── Tab 2: Resumen ────────────────────────────────────────────────────────────

const ResumenTab = ({ weeks }) => {
  const entries = weeks.map(w => ({ label: `S${w.week_number}`, by_lift: w.by_lift }));
  const activeLiftTypes = LIFTS.filter(l => weeks.some(w => w.by_lift[l]));

  if (!weeks.length) return (
    <p style={{ color: t.text3, fontSize: '14px', textAlign: 'center', marginTop: '32px' }}>Sin series registradas en este bloque</p>
  );

  return (
    <div>
      <LiftLegend activeLiftTypes={activeLiftTypes} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <ChartCard title="ÍNDICE DE ESTRÉS (S.I) POR SEMANA"><SIBarChart entries={entries} /></ChartCard>
        <ChartCard title="e1RM ESTIMADO (kg)"><E1RMLineChart entries={entries} /></ChartCard>
      </div>
      {activeLiftTypes.map(lift => (
        <div key={lift} style={{ marginBottom: '14px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: LIFT_COLORS[lift] }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>{LIFT_LABELS[lift]}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '340px' }}>
              <thead>
                <tr style={{ backgroundColor: t.surface2 }}>
                  {['Sem', 'S.I', 'Ton.(kg)', 'e1RM', '%RM', 'RPE', 'NS', 'NL'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Sem' ? 'left' : 'right', color: t.text3, fontWeight: '600', fontSize: '10px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w, i) => {
                  const lm = w.by_lift[lift];
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${t.border}` }}>
                      <td style={{ padding: '8px 10px', color: t.text, fontWeight: '600' }}>S{w.week_number}</td>
                      {lm ? (
                        <>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: LIFT_COLORS[lift], fontWeight: '700' }}>{fmt1(lm.si)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{fmtTon(lm.tonnage)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{lm.e1rm > 0 ? fmt1(lm.e1rm) : '—'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{lm.pct_rm_avg > 0 ? `${fmt1(lm.pct_rm_avg)}%` : '—'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{lm.rpe_avg > 0 ? fmt1(lm.rpe_avg) : '—'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{lm.ns}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: t.text2 }}>{lm.nl}</td>
                        </>
                      ) : (
                        <td colSpan="7" style={{ padding: '8px 10px', textAlign: 'center', color: t.text3 }}>—</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tab 3: Detalle (block editor) ─────────────────────────────────────────────

// Fila de serie editable individualmente
const SetRow = ({ s, index, planId, onRemove, onUpdated }) => {
  const [pw, setPw] = useState(s.planned_weight != null ? String(s.planned_weight) : '');
  const [pr, setPr] = useState(s.planned_reps != null ? String(s.planned_reps) : '');
  const [prpe, setPrpe] = useState(s.planned_rpe != null ? String(s.planned_rpe) : '');

  const isLogged = s.weight != null;

  const save = async () => {
    const payload = {
      planned_weight: pw !== '' ? parseFloat(pw) : null,
      planned_reps: pr !== '' ? parseInt(pr) : null,
      planned_rpe: prpe !== '' ? parseFloat(prpe) : null,
    };
    try {
      await axios.put(`${API}/series/${s.id}/plan/`, payload);
      onUpdated(s.id, payload);
    } catch {}
  };

  const inputStyle = {
    width: '52px', padding: '4px 6px', backgroundColor: t.surface3 || t.surface2,
    border: `1px solid ${t.border2}`, borderRadius: '5px', color: t.text,
    fontSize: '12px', outline: 'none', textAlign: 'center',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '5px 14px 5px 28px', borderTop: `1px solid ${t.border2}`,
      backgroundColor: isLogged ? '#00ff8706' : 'transparent',
    }}>
      <span style={{ fontSize: '11px', color: t.text3, flexShrink: 0, width: '20px' }}>#{index + 1}</span>
      {isLogged ? (
        <>
          <span style={{ fontSize: '12px', color: '#00ff87', flex: 1 }}>
            {s.weight}kg × {s.reps} @ {s.rpe}
          </span>
          <span style={{ fontSize: '11px', color: t.text3 }}>
            plan: {s.planned_weight ? `${s.planned_weight}kg × ` : ''}{s.planned_reps}@{s.planned_rpe}
          </span>
        </>
      ) : (
        <>
          <input
            value={pw} onChange={e => setPw(e.target.value)}
            onBlur={save} onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="kg" style={{ ...inputStyle, width: '56px' }}
            onFocus={e => e.target.style.borderColor = t.primary}
          />
          <span style={{ fontSize: '11px', color: t.text3 }}>kg ×</span>
          <input
            value={pr} onChange={e => setPr(e.target.value)}
            onBlur={save} onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="reps" style={inputStyle}
            onFocus={e => e.target.style.borderColor = t.primary}
          />
          <span style={{ fontSize: '11px', color: t.text3 }}>@</span>
          <input
            value={prpe} onChange={e => setPrpe(e.target.value)}
            onBlur={save} onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="rpe" style={inputStyle}
            onFocus={e => e.target.style.borderColor = t.primary}
          />
          <button onClick={() => onRemove(planId, s.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.text3, fontSize: '14px', padding: '0 2px', flexShrink: 0, lineHeight: 1, marginLeft: '2px' }}>
            ×
          </button>
        </>
      )}
    </div>
  );
};

const DetalleTab = ({ blockId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [publishLoading, setPublishLoading] = useState(null);

  // Add exercise per day
  const [addExDay, setAddExDay] = useState(null);
  const [exSearch, setExSearch] = useState('');
  const [exLibrary, setExLibrary] = useState([]);
  const [addExLoading, setAddExLoading] = useState(false);

  useEffect(() => {
    if (!blockId) return;
    setLoading(true);
    setSelectedWeek(0);
    setAddExDay(null);
    axios.get(`${API}/blocks/${blockId}/full/`)
      .then(r => setDetail(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [blockId]);

  useEffect(() => {
    if (addExDay && exLibrary.length === 0) {
      axios.get(`${API}/ejercicios/`).then(r => setExLibrary(r.data.ejercicios || [])).catch(() => {});
    }
  }, [addExDay]);

  const togglePublish = async week => {
    setPublishLoading(week.week_id);
    const url = week.published
      ? `${API}/weeks/${week.week_id}/unpublish/`
      : `${API}/weeks/${week.week_id}/publish/`;
    try {
      await axios.post(url);
      setDetail(prev => ({
        ...prev,
        weeks: prev.weeks.map(wk =>
          wk.week_id === week.week_id ? { ...wk, published: wk.published ? 0 : 1 } : wk
        ),
      }));
    } catch {} finally {
      setPublishLoading(null);
    }
  };

  const addSet = async (planId) => {
    try {
      const { data } = await axios.post(`${API}/planned_workouts/${planId}/series/add/`);
      setDetail(prev => ({
        ...prev,
        weeks: prev.weeks.map(wk => ({
          ...wk,
          days: wk.days.map(day => ({
            ...day,
            exercises: day.exercises.map(ex =>
              ex.plan_id === planId
                ? { ...ex, num_sets: ex.num_sets + 1, sets: [...ex.sets, data] }
                : ex
            ),
          })),
        })),
      }));
    } catch {}
  };

  const removeSet = async (planId, setId) => {
    try {
      await axios.delete(`${API}/series/${setId}/`);
      setDetail(prev => ({
        ...prev,
        weeks: prev.weeks.map(wk => ({
          ...wk,
          days: wk.days.map(day => ({
            ...day,
            exercises: day.exercises.map(ex =>
              ex.plan_id === planId
                ? { ...ex, num_sets: ex.num_sets - 1, sets: ex.sets.filter(s => s.id !== setId) }
                : ex
            ),
          })),
        })),
      }));
    } catch {}
  };

  const removeExercise = async (planId) => {
    if (!window.confirm('¿Eliminar este ejercicio del día?')) return;
    try {
      await axios.delete(`${API}/planned_workouts/${planId}/`);
      setDetail(prev => ({
        ...prev,
        weeks: prev.weeks.map(wk => ({
          ...wk,
          days: wk.days.map(day => ({
            ...day,
            exercises: day.exercises.filter(ex => ex.plan_id !== planId),
          })),
        })),
      }));
    } catch {}
  };

  const addExercise = async (dayId, ex) => {
    setAddExLoading(true);
    try {
      const { data } = await axios.post(`${API}/planned_workouts/`, {
        day_id: dayId,
        exercise_id: ex.id,
        target_reps: 5,
        target_rpe: 8,
        num_sets: 3,
      });
      // Refresh just this block to get the new exercise with sets
      const { data: full } = await axios.get(`${API}/blocks/${blockId}/full/`);
      setDetail(full);
      setAddExDay(null);
      setExSearch('');
    } catch {} finally {
      setAddExLoading(false);
    }
  };

  if (!blockId) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ color: t.text3, fontSize: '14px' }}>No hay ningún bloque activo en este momento</p>
    </div>
  );
  if (loading) return <p style={{ color: t.text3, fontSize: '14px' }}>Cargando estructura…</p>;
  if (!detail) return null;

  const weeks = detail.weeks;
  const week = weeks[selectedWeek];

  const filteredEx = exLibrary.filter(e =>
    !exSearch || `${e.name} ${e.variant || ''}`.toLowerCase().includes(exSearch.toLowerCase())
  ).slice(0, 20);

  return (
    <div>
      {/* Week chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
        {weeks.map((w, i) => (
          <button key={i} onClick={() => { setSelectedWeek(i); setAddExDay(null); }}
            style={{
              padding: '5px 12px', border: `1px solid ${i === selectedWeek ? t.primary : t.border2}`,
              borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              whiteSpace: 'nowrap', flexShrink: 0,
              backgroundColor: i === selectedWeek ? `${t.primary}20` : 'transparent',
              color: i === selectedWeek ? t.primary : t.text2,
            }}>
            S{w.week_number}{w.published ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {week && (
        <>
          {/* Publish row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700' }}>Semana {week.week_number}</span>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                backgroundColor: week.published ? '#00ff8718' : t.surface2,
                color: week.published ? '#00ff87' : t.text3,
                border: `1px solid ${week.published ? '#00ff8740' : t.border2}`,
              }}>
                {week.published ? 'Publicada' : 'Borrador'}
              </span>
            </div>
            <button onClick={() => togglePublish(week)} disabled={publishLoading === week.week_id}
              style={{
                padding: '5px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                border: `1px solid ${week.published ? t.border2 : t.primary}`,
                backgroundColor: week.published ? 'transparent' : `${t.primary}15`,
                color: week.published ? t.text3 : t.primary,
              }}>
              {publishLoading === week.week_id ? '…' : week.published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>

          {/* Days */}
          {week.days.map((day, di) => (
            <div key={di} style={{ marginBottom: '14px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Day header */}
              <div style={{ padding: '9px 14px', borderBottom: `1px solid ${t.border}`, backgroundColor: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{day.day_name || `Día ${day.day_number}`}</span>
              </div>

              {day.exercises.length === 0 && (
                <p style={{ padding: '12px 14px', color: t.text3, fontSize: '13px', margin: 0 }}>Sin ejercicios planificados</p>
              )}

              {day.exercises.map((ex, ei) => {
                const lift = classifyLift(ex.exercise_name, ex.exercise_subcategory || '');
                return (
                  <div key={ei} style={{ borderTop: `1px solid ${t.border}` }}>
                    {/* Exercise header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', backgroundColor: `${LIFT_COLORS[lift]}08` }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: LIFT_COLORS[lift], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: t.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ex.exercise_name}
                      </span>
                      {ex.modifier && (
                        <span style={{ fontSize: '10px', color: t.text3, backgroundColor: t.surface2, borderRadius: '4px', padding: '1px 6px', flexShrink: 0 }}>{ex.modifier}</span>
                      )}
                      <button onClick={() => addSet(ex.plan_id)} title="Añadir serie"
                        style={{ background: 'none', flexShrink: 0, border: `1px solid ${t.border2}`, borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '15px', color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +
                      </button>
                      <button onClick={() => removeExercise(ex.plan_id)} title="Eliminar ejercicio"
                        style={{ background: 'none', flexShrink: 0, border: `1px solid ${t.border2}`, borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '13px', color: t.text3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🗑
                      </button>
                    </div>

                    {/* Cabecera columnas */}
                    {(ex.sets || []).length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 14px 3px 28px', backgroundColor: t.surface2 }}>
                        <span style={{ width: '20px' }} />
                        <span style={{ width: '56px', fontSize: '10px', color: t.text3, textAlign: 'center' }}>Peso</span>
                        <span style={{ fontSize: '10px', color: t.text3 }}>kg ×</span>
                        <span style={{ width: '52px', fontSize: '10px', color: t.text3, textAlign: 'center' }}>Reps</span>
                        <span style={{ fontSize: '10px', color: t.text3 }}>@</span>
                        <span style={{ width: '52px', fontSize: '10px', color: t.text3, textAlign: 'center' }}>RPE</span>
                      </div>
                    )}

                    {/* Filas de serie */}
                    {(ex.sets || []).map((s, si) => (
                      <SetRow
                        key={s.id}
                        s={s}
                        index={si}
                        planId={ex.plan_id}
                        onRemove={removeSet}
                        onUpdated={(setId, vals) => {
                          setDetail(prev => ({
                            ...prev,
                            weeks: prev.weeks.map(wk => ({
                              ...wk,
                              days: wk.days.map(d => ({
                                ...d,
                                exercises: d.exercises.map(e =>
                                  e.plan_id === ex.plan_id
                                    ? { ...e, sets: e.sets.map(ss => ss.id === setId ? { ...ss, ...vals } : ss) }
                                    : e
                                ),
                              })),
                            })),
                          }));
                        }}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Add exercise button */}
              <div style={{ borderTop: day.exercises.length > 0 ? `1px solid ${t.border}` : 'none', padding: '8px 14px' }}>
                {addExDay === day.day_id ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        autoFocus
                        value={exSearch}
                        onChange={e => setExSearch(e.target.value)}
                        placeholder="Buscar ejercicio…"
                        style={{ flex: 1, padding: '6px 10px', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '6px', color: t.text, fontSize: '13px', outline: 'none' }}
                      />
                      <button onClick={() => { setAddExDay(null); setExSearch(''); }}
                        style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: t.text3, fontSize: '13px' }}>
                        ✕
                      </button>
                    </div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {filteredEx.map(e => (
                        <button key={e.id} onClick={() => addExercise(day.day_id, e)} disabled={addExLoading}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '5px 8px', cursor: 'pointer', borderRadius: '6px', color: t.text2, fontSize: '12px' }}
                          onMouseEnter={ev => ev.currentTarget.style.backgroundColor = t.surface2}
                          onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}>
                          {e.name}{e.variant ? ` (${e.variant})` : ''}
                        </button>
                      ))}
                      {filteredEx.length === 0 && exSearch && (
                        <p style={{ color: t.text3, fontSize: '12px', padding: '4px 8px' }}>Sin resultados</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddExDay(day.day_id); setExSearch(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.primary, fontSize: '12px', fontWeight: '600', padding: '0' }}>
                    + Añadir ejercicio
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ── Athlete list (coach entry screen) ─────────────────────────────────────────

const AthleteList = ({ athletes, loading, onSelect, onBack }) => (
  <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '20px 16px' }}>
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>Dashboard</h1>
      </div>

      {loading && <p style={{ color: t.text3, fontSize: '14px' }}>Cargando atletas…</p>}

      {!loading && athletes.length === 0 && (
        <p style={{ textAlign: 'center', color: t.text3, fontSize: '14px', marginTop: '48px' }}>
          No tienes atletas conectados aún
        </p>
      )}

      {!loading && athletes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {athletes.map(a => (
            <div key={a.athlete_id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
              {a.avatar_url ? (
                <img src={a.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: t.text2, flexShrink: 0 }}>
                  {a.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: t.text, margin: 0 }}>{a.display_name}</p>
                {a.username && (
                  <p style={{ fontSize: '12px', color: t.text3, margin: '1px 0 0' }}>@{a.username}</p>
                )}
                <p style={{ fontSize: '12px', color: t.text3, margin: '2px 0 0' }}>
                  {a.blocks.length === 0 ? 'Sin bloques' : `${a.blocks.length} bloque${a.blocks.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button onClick={() => onSelect(a)}
                style={{ padding: '7px 16px', backgroundColor: `${t.primary}15`, border: `1px solid ${t.primary}40`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: t.primary, flexShrink: 0 }}>
                Ver Dashboard →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ── Main DashboardView ────────────────────────────────────────────────────────

const TABS = [
  { id: 'historico', label: 'Histórico' },
  { id: 'resumen',   label: 'Resumen'   },
  { id: 'detalle',   label: 'Detalle'   },
];

const DashboardView = ({ athleteId, userId, userRole, onBack }) => {
  // Coach: athlete selection
  const [athletes, setAthletes] = useState([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  // Dashboard data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [allBlocks, setAllBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [tab, setTab] = useState('historico');
  const [detalleBlockId, setDetalleBlockId] = useState(null);

  // Fetch athletes list for coach
  useEffect(() => {
    if (userRole !== 'coach') return;
    setAthletesLoading(true);
    axios.get(`${API}/coach/${userId}/athletes/`)
      .then(r => setAthletes(r.data.athletes || []))
      .catch(() => {})
      .finally(() => setAthletesLoading(false));
  }, [userId, userRole]);

  // Effective athlete ID to fetch data for
  const effectiveId = userRole === 'coach' && selectedAthlete
    ? selectedAthlete.athlete_id
    : athleteId;

  // Fetch dashboard analytics + full block list whenever the target athlete changes
  useEffect(() => {
    if (userRole === 'coach' && !selectedAthlete) return;
    setLoading(true);
    setAnalyticsData(null);
    setAllBlocks([]);
    setSelectedBlock(0);
    setDetalleBlockId(null);
    setTab('historico');
    Promise.all([
      axios.get(`${API}/atleta/${effectiveId}/dashboard-semanal/`),
      axios.get(`${API}/atleta/${effectiveId}/blocks/`),
    ])
      .then(([dash, blocks]) => {
        setAnalyticsData(dash.data);
        setAllBlocks(blocks.data.bloques || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [effectiveId, userRole, selectedAthlete]);

  // Coach with no athlete selected → show athlete list
  if (userRole === 'coach' && !selectedAthlete) {
    return (
      <AthleteList
        athletes={athletes}
        loading={athletesLoading}
        onSelect={a => { setSelectedAthlete(a); setTab('historico'); }}
        onBack={onBack}
      />
    );
  }

  const handleBack = userRole === 'coach'
    ? () => { setSelectedAthlete(null); setAnalyticsData(null); setAllBlocks([]); }
    : onBack;

  const athleteName = userRole === 'coach' && selectedAthlete ? selectedAthlete.display_name : null;

  // Resumen: block selector
  const currentBlock = allBlocks[selectedBlock];
  const analyticsBlock = analyticsData?.blocks?.find(b => b.block_id === currentBlock?.id);
  const weeks = analyticsBlock?.weeks || [];

  // Detalle: lista de bloques ordenada de más reciente a más antiguo
  const sortedBlocks = [...allBlocks].sort((a, b) => {
    if (!a.start_date && !b.start_date) return b.id - a.id;
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return b.start_date.localeCompare(a.start_date);
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '20px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={handleBack} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0 }}>Dashboard</h1>
            {athleteName && <p style={{ fontSize: '12px', color: t.text3, margin: '2px 0 0' }}>{athleteName}</p>}
          </div>
        </div>

        {loading && <p style={{ color: t.text3, fontSize: '14px' }}>Cargando…</p>}

        {!loading && (
          <>
            {/* Tab bar */}
            <div style={{ display: 'flex', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
              {TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{
                    flex: 1, padding: '8px', border: 'none', cursor: 'pointer', borderRadius: '8px',
                    fontSize: '13px', fontWeight: tab === id ? '700' : '500',
                    backgroundColor: tab === id ? t.primary : 'transparent',
                    color: tab === id ? '#0a0a0a' : t.text2,
                    transition: 'background-color 100ms ease',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Block selector — shown for Resumen only (Detalle auto-selects active block) */}
            {tab === 'resumen' && allBlocks.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {allBlocks.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '4px' }}>
                    {allBlocks.map((b, i) => (
                      <button key={b.id} onClick={() => setSelectedBlock(i)}
                        style={{
                          padding: '6px 14px', border: `1px solid ${i === selectedBlock ? t.primary : t.border2}`,
                          borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                          whiteSpace: 'nowrap', flexShrink: 0,
                          backgroundColor: i === selectedBlock ? `${t.primary}20` : 'transparent',
                          color: i === selectedBlock ? t.primary : t.text2,
                        }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
                {currentBlock && (
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: t.text }}>{currentBlock.name}</span>
                    {currentBlock.start_date && <span style={{ fontSize: '12px', color: t.text3 }}> · desde {currentBlock.start_date}</span>}
                    <span style={{ fontSize: '12px', color: t.text3 }}> · {currentBlock.num_weeks} semana{currentBlock.num_weeks !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* No blocks at all — only for Resumen */}
            {tab === 'resumen' && allBlocks.length === 0 && (
              <p style={{ textAlign: 'center', color: t.text3, fontSize: '14px', marginTop: '32px' }}>
                Sin bloques creados aún
              </p>
            )}

            {tab === 'historico' && (
              <HistoricoTab analyticsBlocks={analyticsData?.blocks || []} />
            )}
            {tab === 'resumen' && allBlocks.length > 0 && (
              <ResumenTab weeks={weeks} />
            )}
            {tab === 'detalle' && (
              <>
                {allBlocks.length === 0 && (
                  <p style={{ textAlign: 'center', color: t.text3, fontSize: '14px', marginTop: '32px' }}>Sin bloques creados aún</p>
                )}
                {allBlocks.length > 0 && !detalleBlockId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sortedBlocks.map(b => (
                      <button key={b.id} onClick={() => setDetalleBlockId(b.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 18px', backgroundColor: t.surface, border: `1px solid ${t.border}`,
                          borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = t.primary}
                        onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                      >
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: t.text, margin: 0 }}>{b.name}</p>
                          <p style={{ fontSize: '12px', color: t.text3, margin: '3px 0 0' }}>
                            {b.start_date ? `Desde ${b.start_date}` : 'Sin fecha'} · {b.num_weeks} semana{b.num_weeks !== 1 ? 's' : ''}
                            {b.objective ? ` · ${b.objective}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: '16px', color: t.text3, flexShrink: 0 }}>›</span>
                      </button>
                    ))}
                  </div>
                )}
                {detalleBlockId && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <button onClick={() => setDetalleBlockId(null)}
                        style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: t.text2, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        ←
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: t.text }}>
                        {allBlocks.find(b => b.id === detalleBlockId)?.name}
                      </span>
                    </div>
                    <DetalleTab blockId={detalleBlockId} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
