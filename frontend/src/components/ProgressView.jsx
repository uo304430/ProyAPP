import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

function LineChart({ data, color = t.primary }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text3, fontSize: '13px' }}>
        {data && data.length === 1 ? 'Solo 1 sesión — registra más para ver la curva' : 'Sin datos suficientes'}
      </div>
    );
  }

  const W = 400, H = 180;
  const PAD = { top: 16, right: 16, bottom: 34, left: 46 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const ys = data.map(d => d.e1rm);
  const minY = Math.min(...ys) * 0.96;
  const maxY = Math.max(...ys) * 1.04;

  const xScale = i => PAD.left + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW);
  const yScale = v => PAD.top + cH - ((v - minY) / (maxY - minY || 1)) * cH;

  const pts = data.map((d, i) => `${xScale(i)},${yScale(d.e1rm)}`).join(' ');

  const step = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data.reduce((acc, d, i) => {
    if (i === 0 || i === data.length - 1 || i % step === 0) acc.push({ d, i });
    return acc;
  }, []);

  const yTicks = [0, 0.5, 1].map(p => ({ p, v: minY + p * (maxY - minY) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map(({ p, v }) => (
        <line key={p}
          x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + (1 - p) * cH} y2={PAD.top + (1 - p) * cH}
          stroke="#ffffff0d" strokeWidth="1" />
      ))}

      <polygon
        points={`${xScale(0)},${PAD.top + cH} ${pts} ${xScale(data.length - 1)},${PAD.top + cH}`}
        fill="url(#chartFill)"
      />

      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {data.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.e1rm)} r="3" fill={color} />
      ))}

      {yTicks.map(({ p, v }) => (
        <text key={p} x={PAD.left - 6} y={PAD.top + (1 - p) * cH + 4}
          textAnchor="end" fontSize="9" fill="#ffffff55">
          {Math.round(v)}
        </text>
      ))}

      {xLabels.map(({ d, i }) => (
        <text key={i} x={xScale(i)} y={H - 4}
          textAnchor="middle" fontSize="8.5" fill="#ffffff55">
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data, color = '#3a86ff' }) {
  if (!data || data.length === 0) return null;

  const W = 400, H = 110;
  const PAD = { top: 8, right: 16, bottom: 28, left: 46 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const maxV = Math.max(...data.map(d => d.tonelaje), 1);
  const n = data.length;
  const barW = Math.max(3, cW / n - 3);

  const step = Math.max(1, Math.floor(n / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barH = Math.max(1, (d.tonelaje / maxV) * cH);
        const x = PAD.left + (i / n) * cW + (cW / n - barW) / 2;
        const y = PAD.top + cH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={color} rx="2" opacity="0.75" />
            {(i === 0 || i === n - 1 || i % step === 0) && (
              <text x={x + barW / 2} y={H - 4}
                textAnchor="middle" fontSize="8" fill="#ffffff44">
                {d.week_start.slice(5)}
              </text>
            )}
          </g>
        );
      })}
      {[0, 0.5, 1].map(p => {
        const v = maxV * p;
        return (
          <text key={p} x={PAD.left - 6} y={PAD.top + cH - p * cH + 4}
            textAnchor="end" fontSize="9" fill="#ffffff44">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}`}
          </text>
        );
      })}
    </svg>
  );
}

const ProgressView = ({ athleteId, onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tonnage, setTonnage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/atleta/${athleteId}/ejercicios-con-datos/`),
      axios.get(`${API}/atleta/${athleteId}/tonelaje-semanal/`),
    ]).then(([exRes, tonRes]) => {
      const exs = exRes.data.ejercicios || [];
      setExercises(exs);
      setTonnage(tonRes.data.semanas || []);
      if (exs.length > 0) setSelectedId(exs[0].exercise_id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [athleteId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingProgress(true);
    axios.get(`${API}/atleta/${athleteId}/ejercicio/${selectedId}/progreso/`)
      .then(r => setProgress(r.data))
      .catch(() => setProgress(null))
      .finally(() => setLoadingProgress(false));
  }, [selectedId, athleteId]);

  const selectedEx = exercises.find(e => e.exercise_id === selectedId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Progreso</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>e1RM estimado y volumen semanal</p>
          </div>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: t.text2, padding: '48px 0' }}>Cargando...</p>
        )}

        {!loading && exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
            <p style={{ fontWeight: '600', marginBottom: '6px' }}>Sin datos aún</p>
            <p style={{ color: t.text2, fontSize: '14px' }}>Completa series en tus entrenamientos para ver tu progreso</p>
          </div>
        )}

        {!loading && exercises.length > 0 && (
          <>
            {/* Exercise selector */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', marginBottom: '10px' }}>EJERCICIO</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {exercises.map(ex => (
                  <button
                    key={ex.exercise_id}
                    onClick={() => setSelectedId(ex.exercise_id)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', border: 'none',
                      backgroundColor: selectedId === ex.exercise_id ? t.primary : t.surface2,
                      color: selectedId === ex.exercise_id ? t.bg : t.text2,
                      transition: 'all 150ms ease',
                    }}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* e1RM card */}
            <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px' }}>E1RM ESTIMADO</p>
                  <p style={{ fontSize: '13px', color: t.text2, marginTop: '2px' }}>{selectedEx?.name || ''}</p>
                </div>
                {progress && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: t.primary, letterSpacing: '-0.5px' }}>
                      {progress.best_e1rm ? `${progress.best_e1rm}kg` : '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: t.text3 }}>
                      {progress.total_sesiones} sesión{progress.total_sesiones !== 1 ? 'es' : ''}
                    </p>
                  </div>
                )}
              </div>

              {loadingProgress ? (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: t.text3, fontSize: '13px' }}>Cargando...</p>
                </div>
              ) : (
                <LineChart data={progress?.historial || []} />
              )}
            </div>

            {/* Tonnage card */}
            {tonnage.length > 0 && (
              <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px' }}>TONELAJE SEMANAL</p>
                  <p style={{ fontSize: '13px', color: t.text2, marginTop: '2px' }}>Peso × reps total por semana</p>
                </div>
                <BarChart data={tonnage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressView;
