import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const METRICS = [
  { key: 'fatigue',    label: 'Fatiga',      desc: '1 = fresco  ·  10 = agotado',     color: '#ef4444' },
  { key: 'soreness',   label: 'Agujetas',    desc: '1 = ninguna  ·  10 = muy fuertes', color: '#f97316' },
  { key: 'sleep',      label: 'Sueño',       desc: '1 = pésimo  ·  10 = perfecto',     color: '#3a86ff' },
  { key: 'motivation', label: 'Motivación',  desc: '1 = baja  ·  10 = muy alta',       color: t.primary },
  { key: 'stress',     label: 'Estrés',      desc: '1 = ninguno  ·  10 = máximo',      color: '#a855f7' },
];

function getMondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ScoreBar({ value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            transition: 'all 120ms ease',
            backgroundColor: value >= n ? color : t.surface3,
            color: value >= n ? '#000' : t.text3,
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function scoreColor(v) {
  if (!v) return t.text3;
  if (v <= 3) return t.primary;
  if (v <= 6) return '#f59e0b';
  return '#ef4444';
}

const CheckinView = ({ athleteId, onBack }) => {
  const weekStart = getMondayOf(today());

  const [form, setForm] = useState({ fatigue: 5, soreness: 5, sleep: 7, motivation: 7, stress: 4, notes: '' });
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/atleta/${athleteId}/checkins/`)
      .then(r => {
        const checkins = r.data.checkins || [];
        setHistory(checkins);
        const thisWeek = checkins.find(c => c.week_start === weekStart);
        if (thisWeek) {
          setForm({
            fatigue: thisWeek.fatigue ?? 5,
            soreness: thisWeek.soreness ?? 5,
            sleep: thisWeek.sleep ?? 7,
            motivation: thisWeek.motivation ?? 7,
            stress: thisWeek.stress ?? 4,
            notes: thisWeek.notes || '',
          });
        }
      })
      .catch(() => {});
  }, [athleteId, weekStart]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/atleta/${athleteId}/checkin/`, { week_start: weekStart, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      const r = await axios.get(`${API}/atleta/${athleteId}/checkins/`);
      setHistory(r.data.checkins || []);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pastCheckins = history.filter(c => c.week_start !== weekStart);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Bienestar semanal</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>Semana del {weekStart}</p>
          </div>
        </div>

        {/* Current week form */}
        <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', marginBottom: '20px' }}>ESTA SEMANA</p>

          {METRICS.map(m => (
            <div key={m.key} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{m.label}</span>
                <span style={{ fontSize: '11px', color: t.text3 }}>{m.desc}</span>
              </div>
              <ScoreBar value={form[m.key]} onChange={v => set(m.key, v)} color={m.color} />
            </div>
          ))}

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>Notas</p>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Lesiones, viajes, situación general..."
              rows={3}
              style={{
                width: '100%', resize: 'none', backgroundColor: t.surface2,
                border: `1px solid ${t.border2}`, borderRadius: '10px',
                padding: '10px 12px', color: t.text, fontSize: '14px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              backgroundColor: saved ? '#22c55e' : t.primary, color: t.bg,
              fontWeight: '700', fontSize: '15px', cursor: saving ? 'default' : 'pointer',
              transition: 'background-color 300ms ease',
            }}
          >
            {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar check-in'}
          </button>
        </div>

        {/* History */}
        {pastCheckins.length > 0 && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', marginBottom: '12px' }}>HISTORIAL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pastCheckins.map(c => (
                <div key={c.id} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>Sem. {c.week_start}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {METRICS.map(m => (
                      <div key={m.key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: m.color }}>
                          {c[m.key] ?? '—'}
                        </div>
                        <div style={{ fontSize: '10px', color: t.text3, marginTop: '2px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {c.notes && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: t.text2, borderTop: `1px solid ${t.border2}`, paddingTop: '10px' }}>{c.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinView;
