import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { t, input, btnPrimary, btnSecondary } from '../styles/theme';

const API = '/api';

const BASIC_LIFTS = ['Squat', 'Bench Press', 'Deadlift'];
const BASIC_SUBS = ['Barra y Técnica', 'Pausa', 'Tempo', 'Sobrecarga'];
const ACC_SUBS = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazos', 'Core'];

const LIFT_SHORT = { Squat: 'Squat', 'Bench Press': 'Press Banca', Deadlift: 'Peso Muerto' };

// ─── Inline create form ───────────────────────────────────────────────────────

const InlineCreate = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('accessory');
  const [variant, setVariant] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true); setErr('');
    try {
      const { data } = await axios.post(`${API}/ejercicios/`, {
        name: name.trim(), category, variant: variant.trim() || null,
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
      backgroundColor: t.surface3, border: `1px solid ${t.border2}`,
      borderRadius: '10px', padding: '12px', marginTop: '8px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: t.text2, margin: 0 }}>NUEVO EJERCICIO</p>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Nombre del ejercicio"
        style={{ ...input, padding: '8px 10px', fontSize: '13px' }}
        onFocus={e => e.target.style.borderColor = t.primary}
        onBlur={e => e.target.style.borderColor = t.border2}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <select
          value={category} onChange={e => setCategory(e.target.value)}
          style={{ ...input, padding: '7px 8px', fontSize: '12px', cursor: 'pointer' }}
        >
          <option value="basic">Básico</option>
          <option value="accessory">Accesorio</option>
        </select>
        <input
          type="text" value={variant} onChange={e => setVariant(e.target.value)}
          placeholder="Variante (opcional)"
          style={{ ...input, padding: '7px 8px', fontSize: '12px' }}
          onFocus={e => e.target.style.borderColor = t.primary}
          onBlur={e => e.target.style.borderColor = t.border2}
        />
      </div>
      {err && <p style={{ fontSize: '11px', color: t.danger, margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={onCancel} style={{ ...btnSecondary, flex: 1, padding: '7px', fontSize: '12px' }}>
          Cancelar
        </button>
        <button
          onClick={handleSubmit} disabled={!name.trim() || saving}
          style={{ ...btnPrimary, flex: 2, padding: '7px', fontSize: '12px', opacity: name.trim() ? 1 : 0.4 }}
        >
          {saving ? 'Guardando…' : 'Crear ejercicio'}
        </button>
      </div>
    </div>
  );
};

// ─── Chip ─────────────────────────────────────────────────────────────────────

const Chip = ({ label, selected, onClick }) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '6px 12px', borderRadius: '7px', cursor: 'pointer',
      fontSize: '13px', fontWeight: selected ? '700' : '500',
      backgroundColor: selected ? t.primaryDim : t.surface2,
      border: `1px solid ${selected ? t.primary : t.border2}`,
      color: selected ? t.primary : t.text,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// ─── ExercisePicker ───────────────────────────────────────────────────────────

const ExercisePicker = ({ exercises, value, onChange, onExerciseCreated }) => {
  const [activeTab, setActiveTab] = useState('Squat');
  const [activeBodyPart, setActiveBodyPart] = useState(ACC_SUBS[0]);
  const [showPicker, setShowPicker] = useState(!value);
  const [showCreate, setShowCreate] = useState(false);
  // Keep a local copy of the selected exercise for immediate display after creation
  const [localEx, setLocalEx] = useState(null);

  useEffect(() => { if (!value) { setShowPicker(true); setLocalEx(null); } }, [value]);

  const selectedEx = useMemo(
    () => exercises.find(e => String(e.id) === String(value)) || (value ? localEx : null),
    [exercises, value, localEx]
  );

  // Group basic lifts by subcategory
  const byLift = useMemo(() => {
    const res = {};
    BASIC_LIFTS.forEach(lift => {
      const liftExs = exercises.filter(e => e.category === 'basic' && e.name === lift);
      const grouped = {};
      BASIC_SUBS.forEach(sub => {
        grouped[sub] = liftExs.filter(e => e.subcategory === sub);
      });
      grouped['Otros'] = liftExs.filter(e => !BASIC_SUBS.includes(e.subcategory));
      res[lift] = grouped;
    });
    return res;
  }, [exercises]);

  // Group accessories by body part subcategory
  const byBodyPart = useMemo(() => {
    const res = {};
    ACC_SUBS.forEach(sub => {
      res[sub] = exercises.filter(e => e.category === 'accessory' && e.subcategory === sub);
    });
    res['Otros'] = exercises.filter(
      e => e.category === 'accessory' && !ACC_SUBS.includes(e.subcategory)
    );
    return res;
  }, [exercises]);

  const visibleAccSubs = [...ACC_SUBS, ...(byBodyPart['Otros']?.length ? ['Otros'] : [])];

  const handleSelect = (id, ex = null) => {
    if (ex) setLocalEx(ex);
    onChange(String(id));
    setShowPicker(false);
    setShowCreate(false);
  };

  const handleExCreated = (newEx) => {
    if (onExerciseCreated) onExerciseCreated(newEx);
    handleSelect(newEx.id, newEx);
  };

  // ── Selected / collapsed state ──────────────────────────────────────────────
  if (!showPicker && selectedEx) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        backgroundColor: t.primaryDim, border: `1px solid ${t.primary}40`,
        borderRadius: '10px', padding: '10px 14px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', color: t.primary, fontWeight: '700', letterSpacing: '0.4px', opacity: 0.8 }}>
            {selectedEx.category === 'basic' ? 'BÁSICO' : 'ACCESORIO'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: t.text, marginTop: '1px' }}>
            {selectedEx.name}{selectedEx.variant ? ` — ${selectedEx.variant}` : ''}
          </div>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            background: 'none', border: `1px solid ${t.border2}`, borderRadius: '6px',
            padding: '5px 10px', fontSize: '12px', color: t.text2, cursor: 'pointer',
          }}
        >
          Cambiar
        </button>
        <button
          onClick={() => onChange('')}
          style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: '18px', padding: '2px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    );
  }

  // ── Picker open state ───────────────────────────────────────────────────────
  const isAcc = activeTab === 'acc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Back button if there's already a selection */}
      {selectedEx && (
        <button
          type="button" onClick={() => setShowPicker(false)}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: t.text3, fontSize: '12px', cursor: 'pointer', padding: '0' }}
        >
          ← volver
        </button>
      )}

      {/* Tab row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {BASIC_LIFTS.map(lift => (
          <button
            key={lift} type="button" onClick={() => setActiveTab(lift)}
            style={{
              padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600',
              backgroundColor: activeTab === lift ? t.primaryDim : t.surface2,
              border: `1px solid ${activeTab === lift ? t.primary : t.border2}`,
              color: activeTab === lift ? t.primary : t.text2,
            }}
          >
            {LIFT_SHORT[lift]}
          </button>
        ))}
        <button
          type="button" onClick={() => setActiveTab('acc')}
          style={{
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            backgroundColor: isAcc ? t.primaryDim : t.surface2,
            border: `1px solid ${isAcc ? t.primary : t.border2}`,
            color: isAcc ? t.primary : t.text2,
          }}
        >
          Accesorios
        </button>
      </div>

      {/* Content panel */}
      <div style={{
        backgroundColor: t.surface, border: `1px solid ${t.border}`,
        borderRadius: '10px', padding: '14px',
        maxHeight: '300px', overflowY: 'auto',
      }}>
        {!isAcc ? (
          // Basic lift — subcategory sections
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[...BASIC_SUBS, 'Otros'].map(sub => {
              const items = (byLift[activeTab] || {})[sub] || [];
              if (items.length === 0) return null;
              return (
                <div key={sub}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: t.text3, letterSpacing: '0.5px', marginBottom: '6px' }}>
                    {sub.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {items.map(ex => (
                      <Chip
                        key={ex.id}
                        label={ex.variant || ex.name}
                        selected={String(ex.id) === String(value)}
                        onClick={() => handleSelect(ex.id, ex)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {BASIC_LIFTS.includes(activeTab) &&
              Object.values(byLift[activeTab] || {}).every(arr => arr.length === 0) && (
              <span style={{ fontSize: '12px', color: t.text3 }}>Sin ejercicios en esta categoría</span>
            )}
          </div>
        ) : (
          // Accessories — body part selector + exercise chips
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px', borderBottom: `1px solid ${t.border2}`, paddingBottom: '10px' }}>
              {visibleAccSubs.map(sub => (
                <button
                  key={sub} type="button" onClick={() => setActiveBodyPart(sub)}
                  style={{
                    padding: '5px 11px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '600',
                    backgroundColor: activeBodyPart === sub ? t.surface3 : 'transparent',
                    border: `1px solid ${activeBodyPart === sub ? t.border2 : 'transparent'}`,
                    color: activeBodyPart === sub ? t.text : t.text3,
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(byBodyPart[activeBodyPart] || []).length === 0 ? (
                <span style={{ fontSize: '12px', color: t.text3 }}>Sin ejercicios</span>
              ) : (
                (byBodyPart[activeBodyPart] || []).map(ex => (
                  <Chip
                    key={ex.id}
                    label={ex.name + (ex.variant ? ` (${ex.variant})` : '')}
                    selected={String(ex.id) === String(value)}
                    onClick={() => handleSelect(ex.id, ex)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create new */}
      <div>
        <button
          type="button" onClick={() => setShowCreate(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.primary, fontSize: '12px', fontWeight: '600', padding: '0' }}
        >
          {showCreate ? '— Cancelar' : '+ Crear nuevo ejercicio'}
        </button>
        {showCreate && (
          <InlineCreate onCreated={handleExCreated} onCancel={() => setShowCreate(false)} />
        )}
      </div>
    </div>
  );
};

export default ExercisePicker;
