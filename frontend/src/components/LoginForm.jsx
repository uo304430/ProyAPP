import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const LoginForm = ({ onLoginSuccess, onGoRegister, onForgotPassword }) => {
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
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* B2L display header */}
        <div
          className="animate-in"
          style={{ textAlign: 'center', marginBottom: '28px' }}
        >
          <div style={{
            fontFamily: t.fontDisplay,
            fontSize: '82px',
            letterSpacing: '0.1em',
            lineHeight: 0.88,
            background: t.primaryGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
          }}>
            B2L
          </div>
          <div style={{
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: t.text3,
            fontFamily: t.fontBody,
          }}>
            Born to Lift
          </div>
        </div>

        {/* Glass card */}
        <div className="glass-card animate-in-delay" style={{ padding: '32px 28px' }}>
          <h2 style={{
            fontSize: '22px', fontWeight: '700',
            marginBottom: '4px', letterSpacing: '-0.2px',
            fontFamily: t.fontBody,
          }}>
            Bienvenido de vuelta
          </h2>
          <p style={{
            color: t.text2, fontSize: '14px', marginBottom: '28px',
            fontFamily: t.fontBody,
          }}>
            Inicia sesión para ver tus entrenamientos
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="field-label">Email</label>
              <input
                className="field"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.toLowerCase())}
                required
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '7px',
              }}>
                <label className="field-label" style={{ margin: 0 }}>Contraseña</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: 'none', border: 'none',
                    color: t.text3, fontSize: '12px',
                    cursor: 'pointer', padding: 0,
                    transition: 'color 160ms ease',
                    fontFamily: t.fontBody, letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = t.primary}
                  onMouseLeave={e => e.currentTarget.style.color = t.text3}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                className="field"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="animate-fade"
                style={{
                  background: t.dangerDim,
                  border: `1px solid rgba(255, 61, 85, 0.22)`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: t.danger,
                  fontSize: '13px',
                  fontFamily: t.fontBody,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p style={{
          textAlign: 'center', marginTop: '24px',
          color: t.text2, fontSize: '14px',
          fontFamily: t.fontBody,
          animation: 'fadeIn 500ms 200ms both',
        }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={onGoRegister}
            style={{
              background: 'none', border: 'none',
              color: t.primary, cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
              fontFamily: t.fontBody,
              transition: 'opacity 160ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
