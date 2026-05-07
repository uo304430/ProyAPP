import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t, input, btnPrimary, btnSecondary, label } from '../styles/theme';

const API = 'http://127.0.0.1:8000';

// ─── Sub-components ──────────────────────────────────────────────────────────

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

const ChipSelect = ({ options, value, onChange, multi = false }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
    {options.map(opt => {
      const selected = multi ? value.includes(opt.value) : value === opt.value;
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

// ─── Step 1: Block config ─────────────────────────────────────────────────────

const Step1 = ({ config, setConfig, onNext }) => {
  const weekOptions = [3, 4, 5, 6, 8, 10, 12, 16].map(n => ({ value: n, label: `${n}` }));
  const dayOptions = [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n}` }));
  const objectives = [
    { value: 'acumulacion', label: 'Acumulación' },
    { value: 'intensificacion', label: 'Intensificación' },
    { value: 'peaking', label: 'Peaking' },
    { value: 'descarga', label: 'Descarga' },
  ];

  const valid = config.name.trim().length > 0 && config.objective;

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
        <ChipSelect
          options={objectives}
          value={config.objective}
          onChange={v => setConfig(c => ({ ...c, objective: v }))}
        />
      </div>

      <div>
        <label style={label}>Duración (semanas)</label>
        <ChipSelect
          options={weekOptions}
          value={config.numWeeks}
          onChange={v => setConfig(c => ({ ...c, numWeeks: v }))}
        />
      </div>

      <div>
        <label style={label}>Sesiones por semana</label>
        <ChipSelect
          options={dayOptions}
          value={config.daysPerWeek}
          onChange={v => setConfig(c => ({ ...c, daysPerWeek: v }))}
        />
      </div>

      {/* Preview */}
      <div style={{
        backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
        borderRadius: '10px', padding: '14px 18px',
        display: 'flex', gap: '24px', flexWrap: 'wrap',
      }}>
        {[
          { icon: '📆', val: `${config.numWeeks} semanas` },
          { icon: '🏋️', val: `${config.daysPerWeek} días/semana` },
          { icon: '📝', val: `${config.numWeeks * config.daysPerWeek} sesiones totales` },
        ].map(item => (
          <div key={item.val} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{item.icon}</span>
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

// ─── Step 2: Exercise designer ───────────────────────────────────────────────

const Step2 = ({ blockId, daysPerWeek, onNext, onBack }) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [exercises, setExercises] = useState([]);
  const [dayExercises, setDayExercises] = useState({});
  const [currentDayId, setCurrentDayId] = useState(null);

  const [exId, setExId] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('5');
  const [rpe, setRpe] = useState('8');
  const [modifier, setModifier] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Load exercise library
  useEffect(() => {
    axios.get(`${API}/ejercicios/`).then(r => setExercises(r.data.ejercicios || []));
  }, []);

  // Load day_id and exercises for selected day
  useEffect(() => {
    if (!blockId) return;
    axios.get(`${API}/blocks/${blockId}/weeks/1/days/${selectedDay}/`)
      .then(r => {
        const dayId = r.data.day_id;
        setCurrentDayId(dayId);
        return axios.get(`${API}/days/${dayId}/workouts/`);
      })
      .then(r => setDayExercises(prev => ({ ...prev, [selectedDay]: r.data.entrenos || [] })))
      .catch(() => setCurrentDayId(null));
  }, [blockId, selectedDay]);

  const handleAdd = async () => {
    if (!exId || !currentDayId) return;
    setSaving(true);
    setMsg('');
    try {
      await axios.post(`${API}/planned_workouts/`, {
        day_id: currentDayId,
        exercise_id: parseInt(exId),
        target_reps: parseInt(reps),
        target_rpe: parseFloat(rpe),
        target_weight: null,
        modifier: modifier || null,
        num_sets: parseInt(sets),
      });
      // Refresh day list
      const r = await axios.get(`${API}/days/${currentDayId}/workouts/`);
      setDayExercises(prev => ({ ...prev, [selectedDay]: r.data.entrenos || [] }));
      setExId(''); setSets('3'); setReps('5'); setRpe('8'); setModifier('');
      setMsg('Ejercicio añadido');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (planId) => {
    await axios.delete(`${API}/planned_workouts/${planId}/`);
    setDayExercises(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(e => e.plan_id !== planId),
    }));
  };

  const currentList = dayExercises[selectedDay] || [];
  const anyExercises = Object.values(dayExercises).some(l => l.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Day tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map(d => {
          const hasEx = (dayExercises[d] || []).length > 0;
          return (
            <button
              key={d} onClick={() => setSelectedDay(d)}
              style={{
                padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px', transition: 'all 150ms ease',
                border: `1px solid ${selectedDay === d ? t.primary : t.border2}`,
                backgroundColor: selectedDay === d ? t.primaryDim : t.surface2,
                color: selectedDay === d ? t.primary : t.text2,
                position: 'relative',
              }}
            >
              Día {d}
              {hasEx && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '8px', height: '8px', backgroundColor: t.primary,
                  borderRadius: '50%',
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left: Add form */}
        <div style={{
          backgroundColor: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '12px', padding: '20px',
        }}>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '16px', color: t.text2 }}>
            AÑADIR EJERCICIO — DÍA {selectedDay}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={label}>Ejercicio</label>
              <select
                value={exId} onChange={e => setExId(e.target.value)}
                style={{ ...input, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border2}
              >
                <option value="">— Seleccionar —</option>
                {exercises.filter(e => e.category === 'basic').length > 0 && (
                  <optgroup label="Básicos">
                    {exercises.filter(e => e.category === 'basic').map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}{e.variant ? ` (${e.variant})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {exercises.filter(e => e.category === 'accessory').length > 0 && (
                  <optgroup label="Accesorios">
                    {exercises.filter(e => e.category === 'accessory').map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Sets × Reps @ RPE */}
            <div>
              <label style={label}>Volumen e Intensidad</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 10px 1fr 10px 1fr', alignItems: 'center', gap: '6px' }}>
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="number" min="1" max="10" value={sets}
                    onChange={e => setSets(e.target.value)}
                    style={{ ...input, textAlign: 'center', padding: '10px 6px' }}
                    onFocus={e => e.target.style.borderColor = t.primary}
                    onBlur={e => e.target.style.borderColor = t.border2}
                  />
                  <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>SERIES</div>
                </div>
                <span style={{ color: t.text3, fontWeight: '700', textAlign: 'center' }}>×</span>
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="number" min="1" max="20" value={reps}
                    onChange={e => setReps(e.target.value)}
                    style={{ ...input, textAlign: 'center', padding: '10px 6px' }}
                    onFocus={e => e.target.style.borderColor = t.primary}
                    onBlur={e => e.target.style.borderColor = t.border2}
                  />
                  <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>REPS</div>
                </div>
                <span style={{ color: t.text3, fontWeight: '700', textAlign: 'center' }}>@</span>
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="number" min="5" max="10" step="0.5" value={rpe}
                    onChange={e => setRpe(e.target.value)}
                    style={{ ...input, textAlign: 'center', padding: '10px 6px' }}
                    onFocus={e => e.target.style.borderColor = t.primary}
                    onBlur={e => e.target.style.borderColor = t.border2}
                  />
                  <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>RPE</div>
                </div>
              </div>
            </div>

            <div>
              <label style={label}>Modificador (opcional)</label>
              <input
                style={input} type="text" value={modifier}
                onChange={e => setModifier(e.target.value)}
                placeholder="ej. Pausa 2s, Tempo 3-0-1"
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border2}
              />
            </div>

            {msg && (
              <div style={{
                fontSize: '13px', padding: '8px 12px', borderRadius: '7px',
                backgroundColor: msg.startsWith('Error') ? t.dangerDim : t.primaryDim,
                color: msg.startsWith('Error') ? t.danger : t.primary,
                border: `1px solid ${msg.startsWith('Error') ? t.danger : t.primary}30`,
              }}>{msg}</div>
            )}

            <button
              onClick={handleAdd} disabled={!exId || saving}
              style={{
                ...btnPrimary, width: '100%',
                opacity: (!exId || saving) ? 0.4 : 1,
              }}
            >
              {saving ? 'Guardando...' : '+ Añadir al Día ' + selectedDay}
            </button>
          </div>
        </div>

        {/* Right: Day exercise list */}
        <div style={{
          backgroundColor: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '12px', padding: '20px', minHeight: '200px',
        }}>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '16px', color: t.text2 }}>
            DÍA {selectedDay} — {currentList.length} EJERCICIO{currentList.length !== 1 ? 'S' : ''}
          </p>

          {currentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: t.text3 }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>➕</div>
              <p style={{ fontSize: '13px' }}>Sin ejercicios</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentList.map((ex, idx) => (
                <div
                  key={ex.plan_id}
                  style={{
                    backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
                    borderRadius: '9px', padding: '12px 14px',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}
                >
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    backgroundColor: t.primaryDim, color: t.primary,
                    fontSize: '11px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '3px' }}>
                      {ex.ejercicio_nombre}
                    </div>
                    <div style={{ fontSize: '13px', color: t.primary, fontWeight: '600' }}>
                      {ex.num_sets}×{ex.target_reps} @ {ex.target_rpe}
                    </div>
                    {ex.modifier && (
                      <div style={{
                        display: 'inline-block', marginTop: '4px',
                        fontSize: '11px', color: t.text2,
                        backgroundColor: t.surface3, borderRadius: '5px',
                        padding: '2px 8px',
                      }}>{ex.modifier}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(ex.plan_id)}
                    style={{
                      background: 'none', border: 'none',
                      color: t.text3, cursor: 'pointer', fontSize: '16px',
                      padding: '2px', lineHeight: 1,
                    }}
                    title="Eliminar"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
        <button onClick={onBack} style={{ ...btnSecondary, flex: 1 }}>← Volver</button>
        <button
          onClick={onNext}
          disabled={!anyExercises}
          style={{ ...btnPrimary, flex: 2, opacity: anyExercises ? 1 : 0.4 }}
        >
          Continuar → Progresión
        </button>
      </div>
    </div>
  );
};

// ─── Step 3: Progression ─────────────────────────────────────────────────────

const PROGRESSION_TYPES = [
  {
    value: 'same',
    icon: '═',
    title: 'Mismo todas las semanas',
    desc: 'Las series, reps y RPE son idénticas cada semana',
  },
  {
    value: 'rpe_wave',
    icon: '↑',
    title: 'Ola de RPE',
    desc: 'El RPE aumenta semana a semana. Ideal para peaking',
  },
  {
    value: 'volume_wave',
    icon: '⟰',
    title: 'Ola de Volumen',
    desc: 'Las series aumentan semana a semana. Ideal para acumulación',
  },
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
    } catch (e) {
      setError('Error al generar el bloque. Intenta de nuevo.');
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Type selector */}
      <div>
        <label style={label}>¿Cómo progresa el bloque semana a semana?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PROGRESSION_TYPES.map(pt => (
            <button
              key={pt.value} type="button"
              onClick={() => setProgType(pt.value)}
              style={{
                textAlign: 'left', padding: '16px 18px', cursor: 'pointer',
                borderRadius: '12px', transition: 'all 150ms ease',
                border: `1px solid ${progType === pt.value ? t.primary : t.border2}`,
                backgroundColor: progType === pt.value ? t.primaryDim : t.surface2,
                display: 'flex', alignItems: 'center', gap: '16px',
              }}
            >
              <span style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                backgroundColor: progType === pt.value ? `${t.primary}25` : t.surface3,
                border: `1px solid ${progType === pt.value ? t.primary : t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '700',
                color: progType === pt.value ? t.primary : t.text2,
              }}>{pt.icon}</span>
              <div>
                <div style={{
                  fontWeight: '600', fontSize: '15px',
                  color: progType === pt.value ? t.primary : t.text,
                }}>{pt.title}</div>
                <div style={{ fontSize: '13px', color: t.text2, marginTop: '2px' }}>{pt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RPE wave editor */}
      {progType === 'rpe_wave' && (
        <div>
          <label style={label}>RPE objetivo por semana</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {rpeWave.map((val, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <input
                  type="number" min="5" max="10" step="0.5" value={val}
                  onChange={e => { const n = [...rpeWave]; n[i] = e.target.value; setRpeWave(n); }}
                  style={{
                    width: '60px', padding: '8px 6px', textAlign: 'center',
                    backgroundColor: t.surface2, color: t.text,
                    border: `1px solid ${t.border2}`, borderRadius: '8px', fontSize: '15px', fontWeight: '600',
                  }}
                />
                <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>S{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume wave editor */}
      {progType === 'volume_wave' && (
        <div>
          <label style={label}>Número de series por semana</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {volumeWave.map((val, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <input
                  type="number" min="1" max="10" value={val}
                  onChange={e => { const n = [...volumeWave]; n[i] = e.target.value; setVolumeWave(n); }}
                  style={{
                    width: '60px', padding: '8px 6px', textAlign: 'center',
                    backgroundColor: t.surface2, color: t.text,
                    border: `1px solid ${t.border2}`, borderRadius: '8px', fontSize: '15px', fontWeight: '600',
                  }}
                />
                <div style={{ fontSize: '11px', color: t.text3, marginTop: '4px' }}>S{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{
        backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
        borderRadius: '12px', padding: '18px 20px',
      }}>
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
        <div style={{
          backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
          borderRadius: '8px', padding: '12px 16px', color: t.danger, fontSize: '13px',
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onBack} style={{ ...btnSecondary, flex: 1 }}>← Volver</button>
        <button
          onClick={handleGenerate} disabled={generating}
          style={{ ...btnPrimary, flex: 2, opacity: generating ? 0.6 : 1 }}
        >
          {generating ? 'Generando...' : '⚡ Generar Bloque'}
        </button>
      </div>
    </div>
  );
};

// ─── Main wizard ─────────────────────────────────────────────────────────────

const CrearBloqueView = ({ coachId, athleteId, onFinished, onBack }) => {
  const [step, setStep] = useState(1);
  const [blockId, setBlockId] = useState(null);
  const [config, setConfig] = useState({
    name: '',
    objective: '',
    numWeeks: 4,
    daysPerWeek: 4,
  });
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
      });
      setBlockId(data.bloque_id);
      setStep(2);
    } catch (e) {
      setCreateError('Error al crear el bloque. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
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
              Nuevo Bloque
            </h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>
              Configura y diseña tu próximo ciclo de entrenamiento
            </p>
          </div>
        </div>

        <StepIndicator current={step} />

        {createError && (
          <div style={{
            backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
            borderRadius: '8px', padding: '12px 16px', color: t.danger,
            fontSize: '13px', marginBottom: '20px',
          }}>{createError}</div>
        )}

        {step === 1 && (
          <Step1
            config={config}
            setConfig={setConfig}
            onNext={creating ? undefined : handleStep1Next}
          />
        )}

        {step === 2 && blockId && (
          <Step2
            blockId={blockId}
            daysPerWeek={config.daysPerWeek}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && blockId && (
          <Step3
            config={config}
            blockId={blockId}
            onFinish={onFinished}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
};

export default CrearBloqueView;
