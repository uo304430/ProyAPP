import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t, input, btnPrimary, btnSecondary, label } from '../styles/theme';
import ExercisePicker from './ExercisePicker';

const API = '/api';

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ current }) => {
  const steps = ['Configuración', 'Ejercicios', 'Progresión'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
      {steps.map((s, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', flexShrink: 0,
                backgroundColor: done ? t.primary : active ? t.primaryDim : t.surface3,
                border: `2px solid ${done || active ? t.primary : t.border2}`,
                color: done ? t.bg : active ? t.primary : t.text3,
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                fontSize: '13px', fontWeight: active ? '600' : '400',
                color: active ? t.text : t.text2,
                whiteSpace: 'nowrap',
              }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: '1px', margin: '0 12px',
                backgroundColor: done ? t.primary : t.border2,
                minWidth: '20px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ChipSelect = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
    {options.map(opt => {
      const selected = value === opt.value;
      return (
        <button
          key={opt.value} type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500', transition: 'all 150ms ease',
            backgroundColor: selected ? t.primaryDim : t.surface2,
            border: `1px solid ${selected ? t.primary : t.border2}`,
            color: selected ? t.primary : t.text,
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ─── Inline create-exercise form ──────────────────────────────────────────────

const CreateExerciseInline = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('accessory');
  const [variant, setVariant] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setErr('');
    try {
      const { data } = await axios.post(`${API}/ejercicios/`, {
        name: name.trim(),
        category,
        variant: variant.trim() || null,
      });
      onCreated(data.ejercicio);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
      borderRadius: '10px', padding: '14px', marginTop: '10px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: '700', color: t.text2, margin: 0 }}>NUEVO EJERCICIO</p>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Nombre del ejercicio"
        style={{ ...input, padding: '8px 12px', fontSize: '13px' }}
        onFocus={e => e.target.style.borderColor = t.primary}
        onBlur={e => e.target.style.borderColor = t.border2}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <select
          value={category} onChange={e => setCategory(e.target.value)}
          style={{ ...input, padding: '8px 10px', fontSize: '13px', cursor: 'pointer' }}
        >
          <option value="basic">Básico</option>
          <option value="accessory">Accesorio</option>
        </select>
        <input
          type="text" value={variant} onChange={e => setVariant(e.target.value)}
          placeholder="Variante (opcional)"
          style={{ ...input, padding: '8px 10px', fontSize: '13px' }}
          onFocus={e => e.target.style.borderColor = t.primary}
          onBlur={e => e.target.style.borderColor = t.border2}
        />
      </div>
      {err && <p style={{ fontSize: '12px', color: t.danger, margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{ ...btnSecondary, flex: 1, padding: '8px', fontSize: '13px' }}>
          Cancelar
        </button>
        <button
          onClick={handleSubmit} disabled={!name.trim() || saving}
          style={{ ...btnPrimary, flex: 2, padding: '8px', fontSize: '13px', opacity: name.trim() ? 1 : 0.4 }}
        >
          {saving ? 'Guardando…' : 'Crear ejercicio'}
        </button>
      </div>
    </div>
  );
};

// ─── Step 1: Block config ─────────────────────────────────────────────────────

const Step1 = ({ config, setConfig, onNext }) => {
  const weekOptions = [3, 4, 5, 6, 7, 8].map(n => ({ value: n, label: `${n}` }));
  const dayOptions = [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n}` }));
  const objectives = [
    { value: 'acumulacion', label: 'Acumulación' },
    { value: 'intensificacion', label: 'Intensificación' },
    { value: 'peaking', label: 'Peaking' },
    { value: 'descarga', label: 'Descarga' },
  ];

  const [customWeeks, setCustomWeeks] = useState('');
  const effectiveWeeks = customWeeks && parseInt(customWeeks) > 0 ? parseInt(customWeeks) : config.numWeeks;

  const handleCustomWeeks = (val) => {
    setCustomWeeks(val);
    const n = parseInt(val);
    if (n > 0) setConfig(c => ({ ...c, numWeeks: n }));
  };

  const valid = config.name.trim().length > 0 && config.objective && effectiveWeeks > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={label}>Nombre del bloque</label>
        <input
          style={input} type="text" value={config.name}
          onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
          placeholder="ej. Peaking Enero 2026"
          onFocus={e => e.target.style.borderColor = t.primary}
          onBlur={e => e.target.style.borderColor = t.border2}
        />
      </div>

      <div>
        <label style={label}>Objetivo del bloque</label>
        <ChipSelect options={objectives} value={config.objective} onChange={v => setConfig(c => ({ ...c, objective: v }))} />
      </div>

      <div>
        <label style={label}>Duración (semanas)</label>
        <ChipSelect
          options={weekOptions}
          value={customWeeks ? null : config.numWeeks}
          onChange={v => { setCustomWeeks(''); setConfig(c => ({ ...c, numWeeks: v })); }}
        />
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: t.text3 }}>o introduce un número:</span>
          <input
            type="number" min="1" max="52" value={customWeeks}
            onChange={e => handleCustomWeeks(e.target.value)}
            placeholder="ej. 10"
            style={{
              ...input, width: '80px', padding: '7px 10px', fontSize: '14px',
              borderColor: customWeeks ? t.primary : t.border2,
            }}
            onFocus={e => e.target.style.borderColor = t.primary}
            onBlur={e => e.target.style.borderColor = customWeeks ? t.primary : t.border2}
          />
          {customWeeks && (
            <span style={{ fontSize: '13px', color: t.primary, fontWeight: '600' }}>
              {customWeeks} sem seleccionadas
            </span>
          )}
        </div>
      </div>

      <div>
        <label style={label}>Sesiones por semana</label>
        <ChipSelect options={dayOptions} value={config.daysPerWeek} onChange={v => setConfig(c => ({ ...c, daysPerWeek: v }))} />
      </div>

      <div>
        <label style={label}>Fecha de inicio <span style={{ color: t.text3, fontWeight: '400' }}>(opcional — para el calendario)</span></label>
        <input
          type="date"
          value={config.startDate || ''}
          onChange={e => setConfig(c => ({ ...c, startDate: e.target.value || null }))}
          style={{
            ...input,
            colorScheme: 'dark',
            width: 'auto',
          }}
          onFocus={e => e.target.style.borderColor = t.primary}
          onBlur={e => e.target.style.borderColor = t.border2}
        />
      </div>

      {/* Preview */}
      <div style={{
        backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
        borderRadius: '10px', padding: '14px 18px',
        display: 'flex', gap: '24px', flexWrap: 'wrap',
      }}>
        {[
          { val: `${effectiveWeeks} semanas` },
          { val: `${config.daysPerWeek} días/semana` },
          { val: `${effectiveWeeks * config.daysPerWeek} sesiones totales` },
        ].map(item => (
          <div key={item.val} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: t.text2 }}>{item.val}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext} disabled={!valid}
        style={{ ...btnPrimary, width: '100%', opacity: valid ? 1 : 0.4 }}
      >
        Continuar →
      </button>
    </div>
  );
};

// ─── Step 2: 3-panel exercise designer ───────────────────────────────────────

const Step2ExCard = ({ plan, onDeleted }) => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    axios.get(`${API}/planned_workouts/${plan.plan_id}/series/`)
      .then(r => setSeries(r.data.series || []));
  }, [plan.plan_id]);

  const updateSet = async (setId, field, value) => {
    const parsed = field === 'planned_reps' ? parseInt(value) : parseFloat(value);
    if (isNaN(parsed)) return;
    await axios.put(`${API}/series/${setId}/plan/`, { [field]: parsed });
    setSeries(prev => prev.map(s => s.id === setId ? { ...s, [field]: parsed } : s));
  };

  const addSet = async () => {
    const r = await axios.post(`${API}/planned_workouts/${plan.plan_id}/series/add/`);
    setSeries(prev => [...prev, r.data]);
  };

  const dotColor = (rpe) => {
    if (!rpe) return t.border2;
    if (rpe <= 7) return t.primary;
    if (rpe <= 8.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>{plan.ejercicio_nombre}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: t.text3 }}>Series</span>
          <button onClick={() => { if (series.length > 1) { const last = series[series.length-1]; axios.delete(`${API}/series/${last.id}/`).then(() => setSeries(p => p.slice(0,-1))); } }}
            style={{ width: '22px', height: '22px', borderRadius: '5px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '16px', textAlign: 'center' }}>{series.length}</span>
          <button onClick={addSet}
            style={{ width: '22px', height: '22px', borderRadius: '5px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => axios.delete(`${API}/planned_workouts/${plan.plan_id}/`).then(() => onDeleted(plan.plan_id))}
            style={{ width: '22px', height: '22px', borderRadius: '5px', border: `1px solid ${t.danger}30`, background: 'none', color: t.danger, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>×</button>
        </div>
      </div>
      {series.length > 0 && (
        <div style={{ padding: '0 14px 2px', display: 'grid', gridTemplateColumns: '12px 1fr 1fr 1fr', gap: '5px' }}>
          <div />{['PESO','REPS','RPE'].map(h => <div key={h} style={{ fontSize: '9px', color: t.text3, letterSpacing: '0.4px', textAlign: 'center' }}>{h}</div>)}
        </div>
      )}
      <div style={{ padding: '2px 14px 10px' }}>
        {series.map(s => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '12px 1fr 1fr 1fr', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor(s.planned_rpe), justifySelf: 'center' }} />
            {[
              { key: 'planned_weight', val: s.planned_weight, step: 2.5, placeholder: '—' },
              { key: 'planned_reps',   val: s.planned_reps,   step: 1 },
              { key: 'planned_rpe',    val: s.planned_rpe,    step: 0.5 },
            ].map(f => (
              <input key={f.key} type="number" step={f.step} defaultValue={f.val ?? ''} placeholder={f.placeholder}
                onBlur={e => { if (e.target.value !== '') updateSet(s.id, f.key, e.target.value); }}
                style={{ backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '5px 2px', textAlign: 'center', color: t.text, fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Step2AddInline = ({ exercises, dayId, onAdded, onCancel }) => {
  const [exId, setExId] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('5');
  const [rpe, setRpe] = useState('8');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const filtered = query.length >= 1
    ? exercises.filter(e => (e.name + (e.variant ? ` (${e.variant})` : '')).toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const handleSelect = (ex) => {
    setExId(String(ex.id));
    setQuery(ex.name + (ex.variant ? ` (${ex.variant})` : ''));
    setShowDrop(false);
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
    <div style={{ backgroundColor: t.surface, border: `1px solid ${t.primary}40`, borderRadius: '12px', padding: '12px 14px', marginBottom: '10px' }}>
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setExId(''); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder="Buscar ejercicio..."
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '8px', padding: '8px 12px', color: t.text, fontSize: '13px', outline: 'none' }}
        />
        {showDrop && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto', marginTop: '3px' }}>
            {filtered.map(ex => (
              <button key={ex.id} onMouseDown={() => handleSelect(ex)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${t.border2}`, cursor: 'pointer', color: t.text, fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = t.surface2}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >{ex.name}{ex.variant ? ` (${ex.variant})` : ''}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 12px 1fr 12px 1fr', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
        {[
          { v: sets, s: setSets, lbl: 'SERIES' },
          null,
          { v: reps, s: setReps, lbl: 'REPS' },
          null,
          { v: rpe, s: setRpe, lbl: 'RPE' },
        ].map((f, i) =>
          f === null ? (
            <span key={i} style={{ color: t.text3, fontWeight: '700', textAlign: 'center', fontSize: '11px' }}>{i === 1 ? '×' : '@'}</span>
          ) : (
            <div key={f.lbl} style={{ textAlign: 'center' }}>
              <input type="number" value={f.v} onChange={e => f.s(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '6px 2px', textAlign: 'center', color: t.text, fontSize: '14px', fontWeight: '600', outline: 'none' }}
              />
              <div style={{ fontSize: '9px', color: t.text3, marginTop: '2px' }}>{f.lbl}</div>
            </div>
          )
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleSave} disabled={!exId || saving}
          style={{ flex: 2, padding: '8px', borderRadius: '7px', border: 'none', backgroundColor: exId ? t.primary : t.surface3, color: exId ? t.bg : t.text3, fontWeight: '700', fontSize: '13px', cursor: exId ? 'pointer' : 'default' }}>
          {saving ? '...' : 'Añadir'}
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '8px', borderRadius: '7px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
      </div>
    </div>
  );
};

const Step2 = ({ blockId, athleteId, daysPerWeek, onNext, onBack }) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [exercises, setExercises] = useState([]);
  const [dayWorkouts, setDayWorkouts] = useState({});   // { dayNum: [entrenos] }
  const [dayIds, setDayIds] = useState({});              // { dayNum: dayId }
  const [showAdd, setShowAdd] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    axios.get(`${API}/ejercicios/`).then(r => setExercises(r.data.ejercicios || []));
    if (athleteId) {
      axios.get(`${API}/atleta/${athleteId}/blocks/`)
        .then(r => setAvailableBlocks((r.data.bloques || []).filter(b => b.id !== blockId)))
        .catch(() => {});
    }
  }, [athleteId, blockId]);

  useEffect(() => {
    if (!blockId) return;
    axios.get(`${API}/blocks/${blockId}/weeks/1/days/${selectedDay}/`)
      .then(r => {
        const dayId = r.data.day_id;
        setDayIds(prev => ({ ...prev, [selectedDay]: dayId }));
        return axios.get(`${API}/days/${dayId}/workouts/`);
      })
      .then(r => setDayWorkouts(prev => ({ ...prev, [selectedDay]: r.data.entrenos || [] })))
      .catch(() => {});
    setShowAdd(false);
  }, [blockId, selectedDay]);

  const currentDayId = dayIds[selectedDay];
  const currentList = dayWorkouts[selectedDay] || [];
  const anyExercises = Object.values(dayWorkouts).some(l => l.length > 0);

  const handleCopy = async (sourceId) => {
    setCopying(true);
    try {
      await axios.post(`${API}/blocks/${blockId}/copy-from/${sourceId}/`);
      const refreshed = {};
      for (let d = 1; d <= daysPerWeek; d++) {
        try {
          const r1 = await axios.get(`${API}/blocks/${blockId}/weeks/1/days/${d}/`);
          const r2 = await axios.get(`${API}/days/${r1.data.day_id}/workouts/`);
          refreshed[d] = r2.data.entrenos || [];
        } catch {}
      }
      setDayWorkouts(refreshed);
      setShowCopyPicker(false);
    } finally { setCopying(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ display: 'flex', height: 'calc(100vh - 300px)', minHeight: '360px', border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>

      {/* Left: Day tabs */}
      <div style={{ width: '140px', flexShrink: 0, borderRight: `1px solid ${t.border}`, backgroundColor: t.surface, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', padding: '0 6px', marginBottom: '4px' }}>SEMANA 1</p>
        {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map(d => {
          const active = selectedDay === d;
          const hasEx = (dayWorkouts[d] || []).length > 0;
          return (
            <button key={d} onClick={() => setSelectedDay(d)}
              style={{
                textAlign: 'left', padding: '10px 10px', borderRadius: '8px',
                border: `1px solid ${active ? t.primary : 'transparent'}`,
                backgroundColor: active ? t.primaryDim : 'transparent',
                cursor: 'pointer', position: 'relative', transition: 'all 100ms ease',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = t.surface2; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontWeight: active ? '700' : '500', fontSize: '13px', color: active ? t.primary : t.text }}>Día {d}</span>
              {hasEx && <span style={{ position: 'absolute', top: '6px', right: '8px', width: '6px', height: '6px', backgroundColor: t.primary, borderRadius: '50%' }} />}
            </button>
          );
        })}
      </div>

      {/* Center: Exercise list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minWidth: 0 }}>
        {/* Copy from block button */}
        {availableBlocks.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <button onClick={() => setShowCopyPicker(v => !v)}
              style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '7px', padding: '6px 12px', fontSize: '12px', color: t.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⎘</span> Copiar de bloque anterior
            </button>
            {showCopyPicker && (
              <div style={{ marginTop: '8px', backgroundColor: t.surface2, borderRadius: '9px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {availableBlocks.map(b => (
                  <button key={b.id} onClick={() => handleCopy(b.id)} disabled={copying}
                    style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: t.surface, border: `1px solid ${t.border2}`, borderRadius: '7px', cursor: 'pointer', opacity: copying ? 0.5 : 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{b.name}</span>
                    <span style={{ fontSize: '12px', color: t.primary }}>{copying ? '…' : 'Usar →'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {currentList.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: t.text3 }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📭</div>
            <p style={{ fontSize: '13px' }}>Sin ejercicios para este día</p>
          </div>
        )}

        {currentList.map(plan => (
          <Step2ExCard key={plan.plan_id} plan={plan}
            onDeleted={(id) => setDayWorkouts(prev => ({ ...prev, [selectedDay]: (prev[selectedDay] || []).filter(w => w.plan_id !== id) }))}
          />
        ))}

        {showAdd && currentDayId ? (
          <Step2AddInline exercises={exercises} dayId={currentDayId}
            onAdded={(list) => { setDayWorkouts(prev => ({ ...prev, [selectedDay]: list })); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <button onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '10px', borderRadius: '9px', border: `1px dashed ${t.border2}`, background: 'none', color: t.text3, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.color = t.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border2; e.currentTarget.style.color = t.text3; }}
          >+ Añadir ejercicio</button>
        )}
      </div>
    </div>

    {/* Navigation */}
    <div style={{ display: 'flex', gap: '12px' }}>
      <button onClick={onBack}
        style={{ flex: 1, padding: '12px', borderRadius: '9px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
        ← Volver
      </button>
      <button onClick={onNext} disabled={!anyExercises}
        style={{ flex: 2, padding: '12px', borderRadius: '9px', border: 'none', backgroundColor: t.primary, color: t.bg, fontWeight: '700', fontSize: '14px', cursor: anyExercises ? 'pointer' : 'default', opacity: anyExercises ? 1 : 0.4 }}>
        Continuar → Progresión
      </button>
    </div>
    </div>
  );
};

// ─── Step 3: Progression ─────────────────────────────────────────────────────

const PROGRESSION_TYPES = [
  { value: 'same', icon: '═', title: 'Mismo todas las semanas', desc: 'Las series, reps y RPE son idénticas cada semana' },
  { value: 'rpe_wave', icon: '↑', title: 'Ola de RPE', desc: 'El RPE aumenta semana a semana. Ideal para peaking' },
  { value: 'volume_wave', icon: '⟰', title: 'Ola de Volumen', desc: 'Las series aumentan semana a semana. Ideal para acumulación' },
];

const Step3 = ({ config, blockId, onFinish, onBack }) => {
  const [progType, setProgType] = useState('same');
  const [rpeWave, setRpeWave] = useState(
    Array.from({ length: config.numWeeks }, (_, i) => Math.min(7 + i * 0.5, 9.5).toString())
  );
  const [volumeWave, setVolumeWave] = useState(
    Array.from({ length: config.numWeeks }, (_, i) => (Math.min(3 + i, 6)).toString())
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const body = { progression_type: progType };
      if (progType === 'rpe_wave') body.rpe_values = rpeWave.slice(1).map(Number);
      if (progType === 'volume_wave') body.volume_sets = volumeWave.slice(1).map(Number);
      await axios.post(`${API}/blocks/${blockId}/replicate-template/`, body);
      onFinish();
    } catch {
      setError('Error al generar el bloque. Intenta de nuevo.');
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={label}>¿Cómo progresa el bloque semana a semana?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PROGRESSION_TYPES.map(pt => (
            <button key={pt.value} type="button" onClick={() => setProgType(pt.value)} style={{
              textAlign: 'left', padding: '16px 18px', cursor: 'pointer',
              borderRadius: '12px', transition: 'all 150ms ease',
              border: `1px solid ${progType === pt.value ? t.primary : t.border2}`,
              backgroundColor: progType === pt.value ? t.primaryDim : t.surface2,
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                backgroundColor: progType === pt.value ? `${t.primary}25` : t.surface3,
                border: `1px solid ${progType === pt.value ? t.primary : t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '700',
                color: progType === pt.value ? t.primary : t.text2,
              }}>{pt.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: progType === pt.value ? t.primary : t.text }}>{pt.title}</div>
                <div style={{ fontSize: '13px', color: t.text2, marginTop: '2px' }}>{pt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {progType === 'rpe_wave' && (
        <div>
          <label style={label}>RPE objetivo por semana</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {rpeWave.map((val, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <input
                  type="number" min="5" max="10" step="0.5" value={val}
                  onChange={e => { const n = [...rpeWave]; n[i] = e.target.value; setRpeWave(n); }}
                  style={{ width: '60px', padding: '8px 6px', textAlign: 'center', backgroundColor: t.surface2, color: t.text, border: `1px solid ${t.border2}`, borderRadius: '8px', fontSize: '15px', fontWeight: '600' }}
                />
                <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>S{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progType === 'volume_wave' && (
        <div>
          <label style={label}>Número de series por semana</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {volumeWave.map((val, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <input
                  type="number" min="1" max="10" value={val}
                  onChange={e => { const n = [...volumeWave]; n[i] = e.target.value; setVolumeWave(n); }}
                  style={{ width: '60px', padding: '8px 6px', textAlign: 'center', backgroundColor: t.surface2, color: t.text, border: `1px solid ${t.border2}`, borderRadius: '8px', fontSize: '15px', fontWeight: '600' }}
                />
                <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>S{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '12px', padding: '18px 20px' }}>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>Resumen del bloque</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { k: 'Nombre', v: config.name },
            { k: 'Objetivo', v: config.objective || '—' },
            { k: 'Duración', v: `${config.numWeeks} semanas × ${config.daysPerWeek} días` },
            { k: 'Total sesiones', v: `${config.numWeeks * config.daysPerWeek}` },
            { k: 'Progresión', v: PROGRESSION_TYPES.find(p => p.value === progType)?.title },
          ].map(row => (
            <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: t.text2 }}>{row.k}</span>
              <span style={{ fontWeight: '500' }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`, borderRadius: '8px', padding: '12px 16px', color: t.danger, fontSize: '13px' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onBack} style={{ ...btnSecondary, flex: 1 }}>← Volver</button>
        <button onClick={handleGenerate} disabled={generating} style={{ ...btnPrimary, flex: 2, opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Generando...' : 'Generar Bloque'}
        </button>
      </div>
    </div>
  );
};

// ─── Main wizard ─────────────────────────────────────────────────────────────

const CrearBloqueView = ({ coachId, athleteId, onBlockCreated, onFinished, onBack }) => {
  const [step, setStep] = useState(1);
  const [blockId, setBlockId] = useState(null);
  const [config, setConfig] = useState({ name: '', objective: '', numWeeks: 4, daysPerWeek: 4, startDate: null });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleStep1Next = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await axios.post(`${API}/blocks/full/`, {
        name: config.name,
        coach_id: parseInt(coachId) || 1,
        athlete_id: parseInt(athleteId) || 1,
        num_weeks: config.numWeeks,
        days_per_week: config.daysPerWeek,
        objective: config.objective,
        start_date: config.startDate || null,
      });
      setBlockId(data.bloque_id);
      onBlockCreated?.(data.bloque_id);
      setStep(2);
    } catch {
      setCreateError('Error al crear el bloque. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  // Exit wizard: clean up the partially-created block so it doesn't pollute the list
  const handleExit = async () => {
    if (blockId) {
      try { await axios.delete(`${API}/blocks/${blockId}/`); } catch {}
    }
    onBack();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <button onClick={handleExit} style={{
            background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px',
            width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Nuevo Bloque</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>Configura y diseña tu próximo ciclo de entrenamiento</p>
          </div>
        </div>

        <StepIndicator current={step} />

        {createError && (
          <div style={{ backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`, borderRadius: '8px', padding: '12px 16px', color: t.danger, fontSize: '13px', marginBottom: '20px' }}>
            {createError}
          </div>
        )}

        {step === 1 && <Step1 config={config} setConfig={setConfig} onNext={creating ? undefined : handleStep1Next} />}
        {step === 2 && blockId && <Step2 blockId={blockId} athleteId={athleteId} daysPerWeek={config.daysPerWeek} onNext={() => setStep(3)} onBack={handleExit} />}
        {step === 3 && blockId && <Step3 config={config} blockId={blockId} onFinish={onFinished} onBack={() => setStep(2)} />}
      </div>
    </div>
  );
};

export default CrearBloqueView;
