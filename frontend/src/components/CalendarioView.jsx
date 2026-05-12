import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const BLOCK_COLORS = ['#00ff87', '#3a86ff', '#ffa502', '#a855f7', '#ef4444', '#06b6d4'];

const getBlockColor = (blockId, blockIndex) => BLOCK_COLORS[blockIndex % BLOCK_COLORS.length];

const pad = n => String(n).padStart(2, '0');

const CalendarioView = ({ userId, onBack }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [sessions, setSessions] = useState({});
  const [blockColorMap, setBlockColorMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayWorkouts, setDayWorkouts] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const fetchCalendar = useCallback(() => {
    axios.get(`${API}/atleta/${userId}/calendar/`, { params: { year, month } })
      .then(r => {
        setSessions(r.data.sessions || {});
        // Build color map from all block_ids seen
        const seen = {};
        let idx = 0;
        Object.values(r.data.sessions || {}).forEach(dayArr => {
          dayArr.forEach(s => {
            if (seen[s.block_id] === undefined) seen[s.block_id] = idx++;
          });
        });
        setBlockColorMap(seen);
      })
      .catch(() => {});
  }, [userId, year, month]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const handleDayClick = async (d) => {
    const key = `${year}-${pad(month)}-${pad(d)}`;
    const daySessions = sessions[key];
    if (!daySessions?.length) return;
    setSelectedDate(key);
    setLoadingDay(true);
    setDayWorkouts([]);
    try {
      const results = await Promise.all(
        daySessions.map(s =>
          axios.get(`${API}/days/${s.day_id}/workouts/`)
            .then(r => ({ ...s, entrenos: r.data.entrenos || [] }))
            .catch(() => ({ ...s, entrenos: [] }))
        )
      );
      setDayWorkouts(results);
    } finally {
      setLoadingDay(false);
    }
  };

  // Build grid
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Unique blocks shown this month for legend
  const blocksThisMonth = [];
  const seenLegend = new Set();
  Object.values(sessions).forEach(arr => arr.forEach(s => {
    if (!seenLegend.has(s.block_id)) {
      seenLegend.add(s.block_id);
      blocksThisMonth.push({ id: s.block_id, name: s.block_name });
    }
  }));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '28px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={onBack} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: t.text2, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>Calendario</h1>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: t.text2, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>{MONTHS_ES[month - 1]} {year}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: t.text2, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        {/* Legend */}
        {blocksThisMonth.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {blocksThisMonth.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: t.surface, border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '4px 10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: BLOCK_COLORS[blockColorMap[b.id] % BLOCK_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: t.text2, fontWeight: '500' }}>{b.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${t.border}` }}>
            {DAYS_ES.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: t.text3, letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const key = day ? `${year}-${pad(month)}-${pad(day)}` : null;
              const daySessions = key ? (sessions[key] || []) : [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const hasSessions = daySessions.length > 0;
              const isWeekend = i % 7 >= 5;

              return (
                <div
                  key={i}
                  onClick={() => day && hasSessions && handleDayClick(day)}
                  style={{
                    minHeight: '72px',
                    padding: '8px 6px',
                    borderRight: i % 7 < 6 ? `1px solid ${t.border}` : 'none',
                    borderBottom: i < cells.length - 7 ? `1px solid ${t.border}` : 'none',
                    cursor: day && hasSessions ? 'pointer' : 'default',
                    backgroundColor: isSelected ? `${t.primary}10` : isToday ? `${t.surface2}` : 'transparent',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={e => { if (day && hasSessions) e.currentTarget.style.backgroundColor = t.surface2; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? `${t.primary}10` : isToday ? t.surface2 : 'transparent'; }}
                >
                  {day && (
                    <>
                      <div style={{
                        fontSize: '13px', fontWeight: isToday ? '800' : '500',
                        color: isToday ? t.primary : isWeekend ? t.text3 : t.text,
                        marginBottom: '6px', textAlign: 'right',
                        ...(isToday && { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', backgroundColor: `${t.primary}20`, borderRadius: '50%', float: 'right' }),
                      }}>
                        {day}
                      </div>
                      <div style={{ clear: 'both', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {daySessions.map((s, si) => (
                          <div key={si} style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            backgroundColor: `${BLOCK_COLORS[blockColorMap[s.block_id] % BLOCK_COLORS.length]}18`,
                            border: `1px solid ${BLOCK_COLORS[blockColorMap[s.block_id] % BLOCK_COLORS.length]}40`,
                            borderRadius: '4px', padding: '2px 5px',
                          }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: BLOCK_COLORS[blockColorMap[s.block_id] % BLOCK_COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: '10px', fontWeight: '600', color: BLOCK_COLORS[blockColorMap[s.block_id] % BLOCK_COLORS.length], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              S{s.week_number}D{s.day_number}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        {selectedDate && (
          <div style={{ marginTop: '20px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            {loadingDay ? (
              <p style={{ color: t.text3, fontSize: '14px' }}>Cargando…</p>
            ) : (
              dayWorkouts.map((session, si) => (
                <div key={si} style={{ marginBottom: si < dayWorkouts.length - 1 ? '16px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: BLOCK_COLORS[blockColorMap[session.block_id] % BLOCK_COLORS.length] }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: t.text2 }}>
                      {session.block_name} — Semana {session.week_number}, Día {session.day_number}
                    </span>
                  </div>
                  {session.entrenos.length === 0 ? (
                    <p style={{ fontSize: '13px', color: t.text3, paddingLeft: '16px' }}>Sin ejercicios programados</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px' }}>
                      {session.entrenos.map((e, ei) => (
                        <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: t.surface2, borderRadius: '8px', padding: '8px 12px' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{e.ejercicio_nombre}</span>
                          </div>
                          <span style={{
                            backgroundColor: `${BLOCK_COLORS[blockColorMap[session.block_id] % BLOCK_COLORS.length]}15`,
                            color: BLOCK_COLORS[blockColorMap[session.block_id] % BLOCK_COLORS.length],
                            border: `1px solid ${BLOCK_COLORS[blockColorMap[session.block_id] % BLOCK_COLORS.length]}30`,
                            borderRadius: '5px', padding: '2px 8px', fontSize: '12px', fontWeight: '700',
                          }}>
                            {e.num_sets}×x{e.target_reps} @{e.target_rpe}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {blocksThisMonth.length === 0 && (
          <p style={{ textAlign: 'center', color: t.text3, fontSize: '14px', marginTop: '32px' }}>
            Ningún bloque tiene fecha de inicio asignada este mes
          </p>
        )}
      </div>
    </div>
  );
};

export default CalendarioView;
