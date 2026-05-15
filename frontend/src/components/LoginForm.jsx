import React, { useState } from 'react';
import axios from 'axios';
import { t, input, btnPrimary, label } from '../styles/theme';

const API = '/api';

const LoginForm = ({ onLoginSuccess, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/login/`, { email, password, role: 'athlete' });
      onLoginSuccess(data.usuario_id, data.rol);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', backgroundColor: t.bg,
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px',
          }}>
            <span style={{
              width: '36px', height: '36px', backgroundColor: t.primary,
              borderRadius: '9px', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px',
            }}>⚡</span>
            <span style={{ color: t.text }}>B2L</span>
          </div>
          <p style={{ color: t.text2, fontSize: '14px', marginTop: '8px' }}>
            Born to Lift
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '16px', padding: '32px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Bienvenido de vuelta</h2>
          <p style={{ color: t.text2, fontSize: '14px', marginBottom: '28px' }}>
            Inicia sesión para ver tus entrenamientos
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={label}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value.toLowerCase())}
                required placeholder="tu@email.com"
                style={input}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border2}
              />
            </div>
            <div>
              <label style={label}>Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={input}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border2}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
                borderRadius: '8px', padding: '10px 14px',
                color: t.danger, fontSize: '13px',
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              ...btnPrimary, width: '100%', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: t.text2, fontSize: '14px' }}>
          ¿No tienes cuenta?{' '}
          <button onClick={onGoRegister} style={{
            background: 'none', border: 'none', color: t.primary,
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
          }}>
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
