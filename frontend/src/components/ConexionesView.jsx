import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t, input, label } from '../styles/theme';

const API = '/api';

const TABS = [
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'conexiones', label: 'Conexiones' },
  { id: 'invitar', label: 'Invitar' },
];

const Avatar = ({ src, name, size = 40 }) => {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  return src ? (
    <img
      src={src} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: t.primaryDim, border: `1px solid ${t.primary}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '700', color: t.primary,
    }}>
      {initials}
    </div>
  );
};

const UserCard = ({ conn, actions }) => (
  <div style={{
    backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
    borderRadius: '12px', padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '14px',
  }}>
    <Avatar src={conn.avatar_url} name={conn.display_name} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>
        {conn.display_name}
      </div>
      <div style={{ fontSize: '12px', color: t.text2 }}>{conn.email}</div>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
      {actions}
    </div>
  </div>
);

// ─── Tab: Solicitudes pendientes ──────────────────────────────────────────────

const TabSolicitudes = ({ userId, onAccepted }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get(`${API}/users/${userId}/connections/pending/`)
      .then(r => setPending(r.data.pending || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [userId]);

  const accept = async (connId) => {
    await axios.put(`${API}/connections/${connId}/accept/`);
    setPending(p => p.filter(r => r.connection_id !== connId));
    onAccepted();
  };

  const reject = async (connId) => {
    await axios.delete(`${API}/connections/${connId}/`);
    setPending(p => p.filter(r => r.connection_id !== connId));
  };

  if (loading) return <p style={{ color: t.text2, textAlign: 'center', padding: '32px 0' }}>Cargando…</p>;

  if (pending.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 20px',
        backgroundColor: t.surface, border: `1px solid ${t.border}`,
        borderRadius: '14px',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
        <p style={{ color: t.text2, fontSize: '14px' }}>Sin solicitudes pendientes</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {pending.map(req => (
        <UserCard
          key={req.connection_id}
          conn={req}
          actions={<>
            <button
              onClick={() => accept(req.connection_id)}
              style={{
                padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: t.primaryDim, color: t.primary,
                border: `1px solid ${t.primary}40`, fontWeight: '600', fontSize: '13px',
              }}
            >
              Aceptar
            </button>
            <button
              onClick={() => reject(req.connection_id)}
              style={{
                padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: t.surface3, color: t.text2,
                border: `1px solid ${t.border2}`, fontSize: '13px',
              }}
            >
              Rechazar
            </button>
          </>}
        />
      ))}
    </div>
  );
};

// ─── Tab: Conexiones activas ──────────────────────────────────────────────────

const TabConexiones = ({ userId, onViewAthleteBlocks }) => {
  const [data, setData] = useState({ coaches: [], athletes: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get(`${API}/users/${userId}/connections/`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [userId]);

  const disconnect = async (connId) => {
    await axios.delete(`${API}/connections/${connId}/`);
    load();
  };

  if (loading) return <p style={{ color: t.text2, textAlign: 'center', padding: '32px 0' }}>Cargando…</p>;

  const empty = data.coaches.length === 0 && data.athletes.length === 0;

  if (empty) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 20px',
        backgroundColor: t.surface, border: `1px solid ${t.border}`,
        borderRadius: '14px',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔗</div>
        <p style={{ color: t.text2, fontSize: '14px' }}>Sin conexiones activas todavía</p>
        <p style={{ color: t.text3, fontSize: '13px', marginTop: '6px' }}>
          Usa "Invitar" para conectar con otro usuario
        </p>
      </div>
    );
  }

  const Section = ({ title, items, isAthletes }) => (
    items.length > 0 ? (
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: t.text3, fontWeight: '600', letterSpacing: '0.5px', marginBottom: '10px' }}>
          {title} · {items.length}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(c => (
            <UserCard
              key={c.connection_id}
              conn={c}
              actions={<>
                {isAthletes && (
                  <button
                    onClick={() => onViewAthleteBlocks(c.user_id, c.display_name)}
                    style={{
                      padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: t.primaryDim, color: t.primary,
                      border: `1px solid ${t.primary}40`, fontWeight: '600', fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver bloques
                  </button>
                )}
                <button
                  onClick={() => disconnect(c.connection_id)}
                  style={{
                    padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                    background: 'none', color: t.text3,
                    border: `1px solid ${t.border2}`, fontSize: '13px',
                  }}
                  title="Desconectar"
                >
                  ×
                </button>
              </>}
            />
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <>
      <Section title="MIS ENTRENADORES" items={data.coaches} isAthletes={false} />
      <Section title="MIS ATLETAS" items={data.athletes} isAthletes={true} />
    </>
  );
};

// ─── Tab: Invitar ─────────────────────────────────────────────────────────────

const TabInvitar = ({ userId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await axios.post(`${API}/connections/send/`, {
        from_user_id: userId,
        to_email: email.trim(),
      });
      setMsg({ ok: true, text: `Solicitud enviada a ${email}` });
      setEmail('');
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || 'Error al enviar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
        borderRadius: '12px', padding: '16px 18px',
        fontSize: '13px', color: t.text2, lineHeight: '1.6',
      }}>
        Invita a otro usuario por su email. Una vez acepte la solicitud podrás{' '}
        <span style={{ color: t.primary, fontWeight: '600' }}>programarle y editarle bloques</span>.
        Tanto entrenadores como atletas pueden conectar con cualquier otro usuario.
      </div>

      <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={label}>Email del usuario</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@email.com"
            style={input}
            onFocus={e => e.target.style.borderColor = t.primary}
            onBlur={e => e.target.style.borderColor = t.border2}
          />
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
            backgroundColor: msg.ok ? t.primaryDim : t.dangerDim,
            color: msg.ok ? t.primary : t.danger,
            border: `1px solid ${msg.ok ? t.primary : t.danger}30`,
          }}>
            {msg.text}
          </div>
        )}

        <button
          type="submit" disabled={loading || !email.trim()}
          style={{
            padding: '11px 20px', borderRadius: '8px', cursor: 'pointer',
            backgroundColor: t.primary, color: t.bg,
            border: 'none', fontWeight: '600', fontSize: '14px',
            opacity: (loading || !email.trim()) ? 0.5 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          {loading ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ConexionesView = ({ userId, onViewAthleteBlocks, onBack }) => {
  const [tab, setTab] = useState('solicitudes');
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = () => {
    axios.get(`${API}/users/${userId}/connections/pending/`)
      .then(r => setPendingCount(r.data.pending?.length || 0))
      .catch(() => {});
  };

  useEffect(refreshPending, [userId]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
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
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Conexiones</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>Entrenadores y atletas</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          backgroundColor: t.surface2, borderRadius: '10px', padding: '4px',
        }}>
          {TABS.map(tb => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '7px',
                cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                border: 'none', transition: 'all 150ms ease',
                backgroundColor: tab === tb.id ? t.surface : 'transparent',
                color: tab === tb.id ? t.text : t.text2,
                position: 'relative',
              }}
            >
              {tb.label}
              {tb.id === 'solicitudes' && pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '6px',
                  backgroundColor: t.danger, color: '#fff',
                  borderRadius: '50%', width: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'solicitudes' && (
          <TabSolicitudes userId={userId} onAccepted={refreshPending} />
        )}
        {tab === 'conexiones' && (
          <TabConexiones userId={userId} onViewAthleteBlocks={onViewAthleteBlocks} />
        )}
        {tab === 'invitar' && (
          <TabInvitar userId={userId} />
        )}
      </div>
    </div>
  );
};

export default ConexionesView;
