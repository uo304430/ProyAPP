import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const EMPTY_FORM = {
  name: '', date: '', weight_class: '', federation: '',
  squat_best: '', bench_best: '', deadlift_best: '', total: '', notes: '',
};

function TotalChart({ comps }) {
  const withTotal = [...comps].filter(c => c.total).reverse();
  if (withTotal.length < 2) return null;

  const W = 400, H = 110;
  const PAD = { top: 10, right: 16, bottom: 30, left: 46 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const totals = withTotal.map(c => c.total);
  const minY = Math.min(...totals) * 0.96;
  const maxY = Math.max(...totals) * 1.04;

  const xScale = i => PAD.left + (withTotal.length === 1 ? cW / 2 : (i / (withTotal.length - 1)) * cW);
  const yScale = v => PAD.top + cH - ((v - minY) / (maxY - minY || 1)) * cH;

  const pts = withTotal.map((c, i) => `${xScale(i)},${yScale(c.total)}`).join(' ');
  const color = t.primary;

  return (
    <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px 16px 10px', marginBottom: '24px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', marginBottom: '10px' }}>PROGRESIÓN TOTAL (kg)</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${xScale(0)},${PAD.top + cH} ${pts} ${xScale(withTotal.length - 1)},${PAD.top + cH}`}
          fill="url(#totalFill)"
        />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        {withTotal.map((c, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(c.total)} r="3" fill={color} />
        ))}
        {withTotal.map((c, i) => (
          <text key={i} x={xScale(i)} y={H - 2}
            textAnchor="middle" fontSize="8" fill="#ffffff44">
            {c.date.slice(0, 7)}
          </text>
        ))}
        {[0, 1].map(p => (
          <text key={p} x={PAD.left - 6} y={PAD.top + cH - p * cH + 4}
            textAnchor="end" fontSize="9" fill="#ffffff44">
            {Math.round(minY + p * (maxY - minY))}
          </text>
        ))}
      </svg>
    </div>
  );
}

function CompetitionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.date) return;
    const payload = {
      ...form,
      squat_best: form.squat_best ? parseFloat(form.squat_best) : null,
      bench_best: form.bench_best ? parseFloat(form.bench_best) : null,
      deadlift_best: form.deadlift_best ? parseFloat(form.deadlift_best) : null,
      total: form.total ? parseFloat(form.total) : null,
    };
    onSave(payload);
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: t.text3 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        style={{
          backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
          borderRadius: '8px', padding: '9px 12px', color: t.text,
          fontSize: '14px', outline: 'none',
        }}
      />
    </div>
  );

  return (
    <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
        {initial ? 'Editar competición' : 'Nueva competición'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {field('Nombre *', 'name', 'text', 'Open de Madrid 2025')}
        {field('Fecha *', 'date', 'date')}
        {field('Categoría de peso', 'weight_class', 'text', '-93 kg')}
        {field('Federación', 'federation', 'text', 'IPF, USPA...')}
        {field('Mejor Squat (kg)', 'squat_best', 'number', '200')}
        {field('Mejor Bench (kg)', 'bench_best', 'number', '140')}
        {field('Mejor Deadlift (kg)', 'deadlift_best', 'number', '250')}
        {field('Total (kg)', 'total', 'number', '590')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: t.text3 }}>Notas</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Condiciones, sensaciones, resultados..."
          style={{ backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '8px', padding: '9px 12px', color: t.text, fontSize: '14px', outline: 'none', resize: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmit}
          disabled={!form.name || !form.date}
          style={{ flex: 1, padding: '11px', borderRadius: '9px', border: 'none', backgroundColor: t.primary, color: t.bg, fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '11px 18px', borderRadius: '9px', border: `1px solid ${t.border2}`, backgroundColor: 'none', color: t.text2, fontWeight: '600', fontSize: '14px', cursor: 'pointer', background: 'none' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const CompetitionsView = ({ athleteId, onBack }) => {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/atleta/${athleteId}/competitions/`)
      .then(r => setComps(r.data.competitions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [athleteId]);

  const handleCreate = async (payload) => {
    await axios.post(`${API}/atleta/${athleteId}/competitions/`, payload);
    setShowForm(false);
    load();
  };

  const handleUpdate = async (id, payload) => {
    await axios.put(`${API}/competitions/${id}/`, payload);
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta competición?')) return;
    await axios.delete(`${API}/competitions/${id}/`);
    load();
  };

  const editComp = comps.find(c => c.id === editId);
  const editInitial = editComp ? {
    name: editComp.name, date: editComp.date,
    weight_class: editComp.weight_class || '', federation: editComp.federation || '',
    squat_best: editComp.squat_best ?? '', bench_best: editComp.bench_best ?? '',
    deadlift_best: editComp.deadlift_best ?? '', total: editComp.total ?? '',
    notes: editComp.notes || '',
  } : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Competiciones</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>{comps.length} registrada{comps.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); }}
            style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: t.primary, color: t.bg, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            + Nueva
          </button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: t.text2, padding: '48px 0' }}>Cargando...</p>}

        {!loading && (
          <>
            {showForm && (
              <CompetitionForm
                onSave={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

            {comps.length > 1 && <TotalChart comps={comps} />}

            {comps.length === 0 && !showForm && (
              <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
                <p style={{ fontWeight: '600', marginBottom: '6px' }}>Sin competiciones</p>
                <p style={{ color: t.text2, fontSize: '14px' }}>Registra tus resultados en competición</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comps.map(c => (
                editId === c.id ? (
                  <CompetitionForm
                    key={c.id}
                    initial={editInitial}
                    onSave={p => handleUpdate(c.id, p)}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div key={c.id} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px' }}>{c.name}</p>
                        <p style={{ fontSize: '12px', color: t.text3, marginTop: '2px' }}>
                          {c.date}{c.federation ? ` · ${c.federation}` : ''}{c.weight_class ? ` · ${c.weight_class}` : ''}
                        </p>
                      </div>
                      {c.total && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: t.primary }}>{c.total}</span>
                          <span style={{ fontSize: '13px', color: t.text3 }}> kg</span>
                        </div>
                      )}
                    </div>

                    {(c.squat_best || c.bench_best || c.deadlift_best) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                        {[['Squat', c.squat_best], ['Bench', c.bench_best], ['Deadlift', c.deadlift_best]].map(([label, val]) => (
                          <div key={label} style={{ backgroundColor: t.surface2, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>{val ?? '—'}</div>
                            <div style={{ fontSize: '10px', color: t.text3, marginTop: '2px' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {c.notes && (
                      <p style={{ fontSize: '13px', color: t.text2, marginBottom: '12px', borderTop: `1px solid ${t.border2}`, paddingTop: '10px' }}>{c.notes}</p>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditId(c.id)}
                        style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${t.border2}`, background: 'none', color: t.text2, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${t.danger}40`, background: 'none', color: t.danger, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompetitionsView;
