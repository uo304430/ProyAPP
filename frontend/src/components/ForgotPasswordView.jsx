import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const ForgotPasswordView = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/forgot-password/', { email: email.trim().toLowerCase() });
      if (data.dev_link) setDevLink(data.dev_link);
      setSent(true);
    } catch {
      setError('Error al procesar la solicitud. Inténtalo de nuevo.');
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
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Recuperar contraseña</h1>
          <p style={{ color: t.text2, fontSize: '14px' }}>Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {sent ? (
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📬</div>
            <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '8px' }}>Revisa tu email</p>
            <p style={{ color: t.text2, fontSize: '13px', lineHeight: '1.5' }}>
              Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.
            </p>

            {devLink && (
              <div style={{ marginTop: '16px', backgroundColor: t.surface2, border: `1px solid ${t.border2}`, borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: t.text3, letterSpacing: '0.5px', marginBottom: '8px' }}>MODO DEV — enlace de reset</p>
                <button
                  onClick={() => { window.location.href = devLink; }}
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: t.primary, wordBreak: 'break-all', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                >
                  {devLink}
                </button>
              </div>
            )}

            <button
              onClick={onBack}
              style={{ marginTop: '20px', color: t.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.text2, marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', backgroundColor: t.surface2,
                  border: `1px solid ${t.border2}`, borderRadius: '8px',
                  color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`, borderRadius: '8px', padding: '10px 12px', color: t.danger, fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                backgroundColor: t.primary, color: t.bg, fontWeight: '700', fontSize: '15px',
                cursor: loading || !email.trim() ? 'default' : 'pointer',
                opacity: loading || !email.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>

            <button
              type="button"
              onClick={onBack}
              style={{ display: 'block', width: '100%', marginTop: '12px', padding: '10px', background: 'none', border: 'none', color: t.text2, fontSize: '14px', cursor: 'pointer' }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
