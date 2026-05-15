import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CoachPanelView = ({ coachId, onViewAthleteBlocks, onViewAthleteCalendar }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState({ pending: {}, total: 0 });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/coach/${coachId}/weekly-overview/`),
      axios.get(`${API}/coach/${coachId}/pending-reviews/`),
    ]).then(([overview, pend]) => {
      setData(overview.data);
      setPending(pend.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [coachId]);

  const stats = data?.stats || { total: 0, active: 0, no_active_block: 0 };
  const filtered = (data?.athletes || []).filter(a =>
    !search || a.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '28px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>Panel de Atletas</h1>
          <p style={{ fontSize: '13px', color: t.text3, marginTop: '4px' }}>
            {stats.total} atleta{stats.total !== 1 ? 's' : ''} conectado{stats.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Activos esta semana', value: `${stats.active}/${stats.total}`, accent: t.primary },
            { label: 'Sin bloque activo', value: stats.no_active_block, accent: stats.no_active_block > 0 ? '#ffa502' : t.text3 },
            { label: 'Total atletas', value: stats.total, accent: '#3a86ff' },
            { label: 'Semanas por revisar', value: pending.total, accent: pending.total > 0 ? '#ffa502' : t.text3 },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', color: t.text3, fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: s.accent, letterSpacing: '-0.5px' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.text3, fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar atleta…"
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '10px 12px 10px 36px', color: t.text, fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: t.text3, textAlign: 'center', fontSize: '14px', marginTop: '40px' }}>Cargando…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px' }}>
            <p style={{ color: t.text3, fontSize: '15px' }}>{search ? 'Sin resultados' : 'Sin atletas conectados'}</p>
            {!search && <p style={{ color: t.text3, fontSize: '13px', marginTop: '6px' }}>Ve a Conexiones para invitar atletas</p>}
          </div>
        ) : (
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', overflowX: 'auto' }}>

            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 72px repeat(7, 40px) 88px 88px',
              minWidth: '700px',
              borderBottom: `1px solid ${t.border}`,
              padding: '0 16px',
            }}>
              {['ATLETA', 'SEMANA', ...DAYS_SHORT, 'ESTADO', ''].map((h, i) => (
                <div key={i} style={{
                  padding: '12px 4px',
                  fontSize: '11px', fontWeight: '700', color: t.text3,
                  letterSpacing: '0.5px',
                  textAlign: i === 0 ? 'left' : 'center',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Athlete rows */}
            {filtered.map((athlete, ri) => {
              const b = athlete.active_block;
              const isLast = ri === filtered.length - 1;
              return (
                <div
                  key={athlete.athlete_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 72px repeat(7, 40px) 88px 88px',
                    minWidth: '700px',
                    borderBottom: isLast ? 'none' : `1px solid ${t.border2}`,
                    padding: '0 16px',
                    alignItems: 'center',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.surface2}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Athlete name + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 4px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: t.primaryDim,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '700', color: t.primary, overflow: 'hidden',
                    }}>
                      {athlete.avatar_url
                        ? <img src={athlete.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (athlete.display_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {athlete.display_name}
                      </div>
                      {athlete.username && (
                        <div style={{ fontSize: '11px', color: t.text3, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{athlete.username}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Week progress */}
                  <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '700', color: b ? t.text : t.text3 }}>
                    {b ? `${b.current_week}/${b.total_weeks}` : '—'}
                  </div>

                  {/* Day dots */}
                  {Array.from({ length: 7 }, (_, di) => (
                    <div key={di} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                      {b ? (
                        b.week_days[di]
                          ? <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.primary }} />
                          : <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `1.5px solid ${t.border2}` }} />
                      ) : (
                        <span style={{ fontSize: '14px', color: t.border2, lineHeight: 1 }}>·</span>
                      )}
                    </div>
                  ))}

                  {/* Status badge */}
                  <div style={{ textAlign: 'center' }}>
                    {athlete.status === 'active'
                      ? <span style={{ backgroundColor: `${t.primary}15`, color: t.primary, border: `1px solid ${t.primary}30`, borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: '700' }}>Activo</span>
                      : <span style={{ backgroundColor: t.surface3, color: t.text3, border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: '700' }}>Sin bloque</span>
                    }
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => onViewAthleteCalendar(athlete.athlete_id, athlete.display_name)}
                        title="Ver calendario"
                        style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: t.text3, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >📅</button>
                      <button
                        onClick={() => onViewAthleteBlocks(athlete.athlete_id, athlete.display_name)}
                        style={{ background: 'none', border: `1px solid ${t.border2}`, borderRadius: '6px', padding: '0 8px', height: '28px', cursor: 'pointer', color: t.text2, fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}
                      >Bloques</button>
                    </div>
                    {(pending.pending[athlete.athlete_id] || 0) > 0 && (
                      <div style={{
                        fontSize: '10px', fontWeight: '700', color: '#ffa502',
                        backgroundColor: '#ffa50215', border: '1px solid #ffa50240',
                        borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap',
                      }}>
                        {pending.pending[athlete.athlete_id]} sem. pendiente{pending.pending[athlete.athlete_id] !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachPanelView;
