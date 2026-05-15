import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const ResetPasswordView = ({ token, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/reset-password/', { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Token inválido o expirado. Solicita un nuevo enlace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ width: '32px', height: '32px', backgroundColor: t.primary, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚡</span>
            <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px' }}>B2L</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Nueva contraseña</h1>
          <p style={{ color: t.text2, fontSize: '14px' }}>Elige una contraseña segura para tu cuenta</p>
        </div>

        {done ? (
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '8px' }}>Contraseña actualizada</p>
            <p style={{ color: t.text2, fontSize: '13px', marginBottom: '20px' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button
              onClick={onSuccess}
              style={{ padding: '11px 28px', backgroundColor: t.primary, color: t.bg, border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.text2, marginBottom: '6px' }}>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
                style={{ width: '100%', padding: '11px 14px', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '8px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.text2, marginBottom: '6px' }}>Repetir contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                style={{ width: '100%', padding: '11px 14px', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '8px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`, borderRadius: '8px', padding: '10px 12px', color: t.danger, fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                backgroundColor: t.primary, color: t.bg, fontWeight: '700', fontSize: '15px',
                cursor: loading || !password || !confirm ? 'default' : 'pointer',
                opacity: loading || !password || !confirm ? 0.6 : 1,
              }}
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
