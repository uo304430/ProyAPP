import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

// ─── History panel ────────────────────────────────────────────────────────────

const HistoryPanel = ({ athleteId, exerciseId, exerciseName }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athleteId || !exerciseId) return;
    setLoading(true);
    axios.get(`${API}/atleta/${athleteId}/ejercicio/${exerciseId}/historial-sesiones/`)
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [athleteId, exerciseId]);

  if (!exerciseId) return (
    <div style={{ padding: '24px 16px', color: t.text3, fontSize: '13px', textAlign: 'center' }}>
      Selecciona un ejercicio para ver su historial
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: t.text }}>{exerciseName}</p>
      <p style={{ fontSize: '11px', fontWeight: '600', color: t.text3, letterSpacing: '0.4px', marginBottom: '14px' }}>HISTORIAL</p>

      {loading && <p style={{ fontSize: '13px', color: t.text3 }}>Cargando...</p>}
      {!loading && sessions.length === 0 && (
        <p style={{ fontSize: '13px', color: t.text3 }}>Sin datos registrados aún</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sessions.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: t.text2 }}>
                Sem {s.week_number}{s.date ? ` · ${s.date}` : ''}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: t.text3, marginBottom: '4px' }}>
              {s.block_name} — Día {s.day_number}
            </div>
            {s.sets.map((set, si) => (
              <div key={si} style={{ fontSize: '12px', color: t.text2 }}>{set}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Exercise card ────────────────────────────────────────────────────────────

const ExerciseCard = ({ plan, onFocus, isFocused, onDeleted }) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSeries = useCallback(async () => {
    const r = await axios.get(`${API}/planned_workouts/${plan.plan_id}/series/`);
    setSeries(r.data.series || []);
    setLoading(false);
  }, [plan.plan_id]);

  useEffect(() => { loadSeries(); }, [loadSeries]);

  const updateSet = async (setId, field, value) => {
    const parsed = field === 'planned_reps' ? parseInt(value) : parseFloat(value);
    if (isNaN(parsed)) return;
    await axios.put(`${API}/series/${setId}/plan/`, { [field]: parsed });
    setSeries(prev => prev.map(s => s.id === setId ? { ...s, [field]: parsed } : s));
  };

  const deleteLastSet = async () => {
    if (series.length <= 1) return;
    const last = series[series.length - 1];
    await axios.delete(`${API}/series/${last.id}/`);
    setSeries(prev => prev.slice(0, -1));
  };

  const addSet = async () => {
    const r = await axios.post(`${API}/planned_workouts/${plan.plan_id}/series/add/`);
    setSeries(prev => [...prev, r.data]);
  };

  const removeExercise = async () => {
    await axios.delete(`${API}/planned_workouts/${plan.plan_id}/`);
    onDeleted(plan.plan_id);
  };

  const dotColor = (rpe) => {
    if (!rpe) return t.border2;
    if (rpe <= 7) return t.primary;
    if (rpe <= 8.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      onClick={onFocus}
      style={{
        backgroundColor: t.surface, border: `1px solid ${isFocused ? t.primary : t.border}`,
        borderRadius: '12px', marginBottom: '12px', overflow: 'hidden',
        cursor: 'default', transition: 'border-color 150ms ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '13px 16px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '700', fontSize: '15px', margin: 0 }}>{plan.ejercicio_nombre}</p>
          {plan.modifier && <p style={{ fontSize: '11px', color: t.text3, margin: '2px 0 0' }}>{plan.modifier}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: t.text3 }}>Series</span>
          <button onClick={e => { e.stopPropagation(); deleteLastSet(); }}
            style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>{series.length}</span>
          <button onClick={e => { e.stopPropagation(); addSet(); }}
            style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={e => { e.stopPropagation(); removeExercise(); }}
            style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${t.danger}30`, background: 'none', color: t.danger, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>×</button>
        </div>
      </div>

      {/* Column headers */}
      {!loading && series.length > 0 && (
        <div style={{ padding: '0 16px 2px', display: 'grid', gridTemplateColumns: '14px 1fr 1fr 1fr 18px', gap: '6px' }}>
          <div />
          {['PESO', 'REPS', 'RPE', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '9px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', textAlign: 'center' }}>{h}</div>
          ))}
        </div>
      )}

      {/* Set rows */}
      <div style={{ padding: '4px 16px 12px' }}>
        {loading ? (
          <p style={{ fontSize: '12px', color: t.text3, padding: '8px 0', textAlign: 'center' }}>…</p>
        ) : series.map((s) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '14px 1fr 1fr 1fr 22px', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dotColor(s.planned_rpe), justifySelf: 'center' }} />
            {[
              { key: 'planned_weight', val: s.planned_weight, step: 2.5, min: 0, placeholder: '—' },
              { key: 'planned_reps',   val: s.planned_reps,   step: 1,   min: 1 },
              { key: 'planned_rpe',    val: s.planned_rpe,    step: 0.5, min: 5, max: 10 },
            ].map(f => (
              <input
                key={f.key} type="number" step={f.step} min={f.min} max={f.max}
                defaultValue={f.val ?? ''} placeholder={f.placeholder}
                onBlur={e => { if (e.target.value !== '') updateSet(s.id, f.key, e.target.value); }}
                onClick={e => e.stopPropagation()}
                style={{
                  backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '7px',
                  padding: '6px 2px', textAlign: 'center', color: t.text, fontSize: '13px',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
            ))}
            <button
              onClick={e => {
                e.stopPropagation();
                axios.delete(`${API}/series/${s.id}/`)
                  .then(() => setSeries(prev => prev.filter(x => x.id !== s.id)))
                  .catch(() => {});
              }}
              style={{
                width: '22px', height: '22px', borderRadius: '5px',
                border: `1px solid ${t.danger}40`, background: 'none',
                color: t.danger, cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.danger}15`; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >×</button>
          </div>
        ))}
      </div>

      {plan.weight_cap && (
        <div style={{ padding: '0 16px 10px' }}>
          <span style={{ fontSize: '11px', color: '#f59e0b' }}>Cap: {plan.weight_cap}</span>
        </div>
      )}
    </div>
  );
};

// ─── Add exercise inline ──────────────────────────────────────────────────────

const CATEGORIES = ['basic', 'accessory', 'cardio', 'mobility'];

const AddExerciseInline = ({ exercises: initialExercises, dayId, onAdded, onCancel, userId }) => {
  const [exercises, setExercises] = useState(initialExercises);
  const [exId, setExId] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('5');
  const [rpe, setRpe] = useState('8');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  // New exercise creation
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('accessory');
  const [newVariant, setNewVariant] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = query.length >= 1
    ? exercises.filter(e => (e.name + (e.variant ? ` (${e.variant})` : '')).toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const noResults = query.length >= 2 && filtered.length === 0;

  const handleSelect = (ex) => {
    setExId(String(ex.id));
    setQuery(ex.name + (ex.variant ? ` (${ex.variant})` : ''));
    setShowDrop(false);
    setShowCreate(false);
  };

  const handleCreateExercise = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await axios.post(`${API}/ejercicios/`, {
        name: newName.trim(),
        category: newCategory,
        variant: newVariant.trim() || null,
        user_id: userId || null,
      });
      const created = data.ejercicio;
      setExercises(prev => [...prev, created]);
      handleSelect(created);
      setShowCreate(false);
      setNewName(''); setNewVariant('');
    } catch (e) {
      if (e.response?.status === 400) alert('Este ejercicio ya existe.');
    } finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!exId || !dayId) return;
    setSaving(true);
    try {
      await axios.post(`${API}/planned_workouts/`, {
        day_id: dayId, exercise_id: parseInt(exId),
        target_reps: parseInt(reps), target_rpe: parseFloat(rpe),
        target_weight: null, num_sets: parseInt(sets),
      });
      const r = await axios.get(`${API}/days/${dayId}/workouts/`);
      onAdded(r.data.entrenos || []);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ backgroundColor: t.surface, border: `1px solid ${t.primary}50`, borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: t.text3, letterSpacing: '0.4px', marginBottom: '10px' }}>AÑADIR EJERCICIO</p>

      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setExId(''); setShowDrop(true); setShowCreate(false); }}
          onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 180)}
          placeholder="Buscar ejercicio..."
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '8px', padding: '9px 12px', color: t.text, fontSize: '14px', outline: 'none' }}
        />
        {showDrop && (filtered.length > 0 || noResults) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto', marginTop: '3px' }}>
            {filtered.map(ex => (
              <button key={ex.id} onMouseDown={() => handleSelect(ex)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${t.border2}`, cursor: 'pointer', color: t.text, fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = t.surface2}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {ex.name}{ex.variant ? ` (${ex.variant})` : ''}
                <span style={{ fontSize: '11px', color: t.text3, marginLeft: '6px' }}>{ex.category}</span>
              </button>
            ))}
            {noResults && (
              <button onMouseDown={() => { setShowCreate(true); setNewName(query); setShowDrop(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: t.primary, fontSize: '13px', fontWeight: '600' }}
              >
                + Crear «{query}»
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create new exercise mini-form */}
      {showCreate && (
        <div style={{ backgroundColor: t.surface2, borderRadius: '9px', padding: '12px', marginBottom: '10px', border: `1px solid ${t.border}` }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: t.primary, letterSpacing: '0.4px', marginBottom: '8px' }}>NUEVO EJERCICIO</p>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Nombre"
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface, border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '7px 10px', color: t.text, fontSize: '13px', outline: 'none', marginBottom: '6px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '9px', color: t.text3, marginBottom: '3px', letterSpacing: '0.4px' }}>CATEGORÍA</div>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                style={{ width: '100%', backgroundColor: t.surface, border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '7px 8px', color: t.text, fontSize: '13px', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: t.text3, marginBottom: '3px', letterSpacing: '0.4px' }}>VARIANTE (opc.)</div>
              <input type="text" value={newVariant} onChange={e => setNewVariant(e.target.value)}
                placeholder="p.ej. paused"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface, border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '7px 8px', color: t.text, fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleCreateExercise} disabled={!newName.trim() || creating}
              style={{ flex: 2, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: newName.trim() ? t.primary : t.surface3, color: newName.trim() ? t.bg : t.text3, fontWeight: '700', fontSize: '12px', cursor: newName.trim() ? 'pointer' : 'default' }}>
              {creating ? '...' : 'Crear y añadir'}
            </button>
            <button onClick={() => setShowCreate(false)}
              style={{ flex: 1, padding: '7px', borderRadius: '7px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 14px 1fr 14px 1fr', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
        {[
          { v: sets, s: setSets, lbl: 'SERIES', min: 1, max: 10 },
          null,
          { v: reps, s: setReps, lbl: 'REPS', min: 1, max: 20 },
          null,
          { v: rpe, s: setRpe, lbl: 'RPE', min: 5, max: 10, step: 0.5 },
        ].map((f, i) =>
          f === null ? (
            <span key={i} style={{ color: t.text3, fontWeight: '700', textAlign: 'center', fontSize: '11px' }}>{i === 1 ? '×' : '@'}</span>
          ) : (
            <div key={f.lbl} style={{ textAlign: 'center' }}>
              <input type="number" min={f.min} max={f.max} step={f.step || 1} value={f.v}
                onChange={e => f.s(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '7px 2px', textAlign: 'center', color: t.text, fontSize: '14px', fontWeight: '600', outline: 'none' }}
              />
              <div style={{ fontSize: '9px', color: t.text3, marginTop: '3px', letterSpacing: '0.3px' }}>{f.lbl}</div>
            </div>
          )
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} disabled={!exId || saving}
          style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: exId ? t.primary : t.surface3, color: exId ? t.bg : t.text3, fontWeight: '700', fontSize: '13px', cursor: exId ? 'pointer' : 'default' }}>
          {saving ? '...' : 'Añadir'}
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '9px', borderRadius: '8px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

const EditarBloqueView = ({ blockId, athleteId, userId, userRole, onBack }) => {
  const [block, setBlock] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [focusedPlanId, setFocusedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const isCoach = userRole === 'coach';

  useEffect(() => {
    if (!blockId) return;
    Promise.all([
      axios.get(`${API}/atleta/${athleteId || 0}/blocks/`),
      axios.get(`${API}/blocks/${blockId}/weeks/`),
      axios.get(`${API}/ejercicios/`, { params: userId ? { user_id: userId } : {} }),
    ]).then(([bRes, wRes, eRes]) => {
      const b = (bRes.data.bloques || []).find(bl => bl.id === blockId);
      setBlock(b || null);
      const ws = wRes.data.semanas || [];
      setWeeks(ws);
      setExercises(eRes.data.ejercicios || []);
      if (ws.length > 0) setSelectedWeek(ws[0].week_number);
    }).finally(() => setLoading(false));
  }, [blockId, athleteId]);

  useEffect(() => {
    if (!blockId || weeks.length === 0) return;
    const week = weeks.find(w => w.week_number === selectedWeek);
    if (!week) return;
    axios.get(`${API}/weeks/${week.id}/days/`)
      .then(r => {
        const ds = r.data.dias || [];
        setDays(ds);
        setSelectedDay(ds.length > 0 ? ds[0] : null);
        setShowAdd(false);
        setFocusedPlanId(null);
      });
  }, [blockId, weeks, selectedWeek]);

  useEffect(() => {
    if (!selectedDay) return;
    axios.get(`${API}/days/${selectedDay.id}/workouts/`)
      .then(r => setWorkouts(r.data.entrenos || []));
  }, [selectedDay]);

  const dayDate = (day) => {
    if (!block?.start_date) return null;
    try {
      const start = new Date(block.start_date + 'T00:00:00');
      const offset = (selectedWeek - 1) * 7 + (day.day_number - 1);
      const d = new Date(start.getTime() + offset * 86400000);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return null; }
  };

  const focusedWorkout = workouts.find(w => w.plan_id === focusedPlanId);

  const currentWeekObj = weeks.find(w => w.week_number === selectedWeek);
  const isCurrentWeekPublished = currentWeekObj?.published === 1;

  const handlePublishWeek = async () => {
    if (!currentWeekObj) return;
    setPublishing(true);
    try {
      const endpoint = isCurrentWeekPublished ? 'unpublish' : 'publish';
      await axios.post(`${API}/weeks/${currentWeekObj.id}/${endpoint}/`);
      setWeeks(prev => prev.map(w =>
        w.id === currentWeekObj.id ? { ...w, published: isCurrentWeekPublished ? 0 : 1 } : w
      ));
    } finally { setPublishing(false); }
  };

  if (loading) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: t.text2 }}>Cargando...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ height: '52px', backgroundColor: t.surface, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 18px', flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '5px 10px', color: t.text2, fontSize: '13px', cursor: 'pointer' }}>
          ← Volver
        </button>
        <span style={{ fontWeight: '700', fontSize: '16px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block?.name || 'Editar Bloque'}
        </span>

        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button onClick={() => setSelectedWeek(w => Math.max(1, w - 1))} disabled={selectedWeek <= 1}
            style={{ width: '26px', height: '26px', borderRadius: '6px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', opacity: selectedWeek <= 1 ? 0.3 : 1, fontSize: '14px' }}>‹</button>
          <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '88px', textAlign: 'center', color: t.text }}>
            Semana {selectedWeek} / {weeks.length}
          </span>
          <button onClick={() => setSelectedWeek(w => Math.min(weeks.length, w + 1))} disabled={selectedWeek >= weeks.length}
            style={{ width: '26px', height: '26px', borderRadius: '6px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', opacity: selectedWeek >= weeks.length ? 0.3 : 1, fontSize: '14px' }}>›</button>
        </div>

        {/* Publish button — coaches only, on coach-managed blocks */}
        {isCoach && block && block.coach_id !== block.athlete_id && (
          <button onClick={handlePublishWeek} disabled={publishing}
            style={{
              padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
              backgroundColor: isCurrentWeekPublished ? t.surface2 : t.primary,
              color: isCurrentWeekPublished ? t.text2 : t.bg,
              border: isCurrentWeekPublished ? `1px solid ${t.border2}` : 'none',
              opacity: publishing ? 0.6 : 1,
            }}>
            {publishing ? '...' : isCurrentWeekPublished ? '🔒 Despublicar' : '✓ Publicar semana'}
          </button>
        )}
      </div>

      {/* 3-panel body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Days */}
        <div style={{ width: '170px', flexShrink: 0, borderRight: `1px solid ${t.border}`, backgroundColor: t.surface, overflowY: 'auto', padding: '10px 8px' }}>
          {days.map(day => {
            const date = dayDate(day);
            const active = selectedDay?.id === day.id;
            return (
              <button key={day.id} onClick={() => { setSelectedDay(day); setShowAdd(false); setFocusedPlanId(null); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: '9px',
                  border: `1px solid ${active ? t.primary : 'transparent'}`,
                  backgroundColor: active ? t.primaryDim : 'transparent',
                  cursor: 'pointer', marginBottom: '3px', transition: 'all 100ms ease',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = t.surface2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ fontWeight: active ? '700' : '500', fontSize: '13px', color: active ? t.primary : t.text }}>
                  {day.day_name || `Día ${day.day_number}`}
                </div>
                {date && <div style={{ fontSize: '11px', color: t.text3, marginTop: '1px' }}>{date}</div>}
              </button>
            );
          })}
        </div>

        {/* Center: Exercises */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', minWidth: 0 }}>
          {workouts.length === 0 && !showAdd && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: t.text3 }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
              <p style={{ fontSize: '13px' }}>Sin ejercicios para este día</p>
            </div>
          )}

          {workouts.map(plan => (
            <ExerciseCard
              key={plan.plan_id}
              plan={plan}
              isFocused={focusedPlanId === plan.plan_id}
              onFocus={() => setFocusedPlanId(plan.plan_id)}
              onDeleted={(id) => {
                setWorkouts(prev => prev.filter(w => w.plan_id !== id));
                if (focusedPlanId === id) setFocusedPlanId(null);
              }}
            />
          ))}

          {showAdd && selectedDay ? (
            <AddExerciseInline
              exercises={exercises}
              dayId={selectedDay.id}
              userId={userId}
              onAdded={(list) => { setWorkouts(list); setShowAdd(false); }}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <button onClick={() => setShowAdd(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: `1px dashed ${t.border2}`, background: 'none',
                color: t.text3, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.color = t.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border2; e.currentTarget.style.color = t.text3; }}
            >
              + Añadir ejercicio
            </button>
          )}
        </div>

        {/* Right: History */}
        <div style={{ width: '220px', flexShrink: 0, borderLeft: `1px solid ${t.border}`, backgroundColor: t.surface, overflowY: 'auto' }}>
          <HistoryPanel
            athleteId={athleteId}
            exerciseId={focusedWorkout?.ejercicio_id || null}
            exerciseName={focusedWorkout?.ejercicio_nombre || null}
          />
        </div>
      </div>
    </div>
  );
};

export default EditarBloqueView;
