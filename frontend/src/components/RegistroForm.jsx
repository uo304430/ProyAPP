import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../styles/theme';

const API = '/api';

const ROLES = [
  { value: 'athlete', label: 'Atleta', desc: 'Entreno y registro mis series' },
  { value: 'coach',   label: 'Entrenador', desc: 'Programo a mis atletas' },
];

const RegistroForm = ({ onRegisterSuccess, onGoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('athlete');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('El nombre y los apellidos son obligatorios');
      return;
    }
    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/register/`, {
        email,
        password,
        role,
        username: username.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      onRegisterSuccess(data.usuario_id, data.rol);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg" style={{ alignItems: 'flex-start', paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* B2L header */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontFamily: t.fontDisplay,
            fontSize: '60px',
            letterSpacing: '0.1em',
            lineHeight: 0.88,
            background: t.primaryGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}>
            B2L
          </div>
          <div style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: t.text3, fontFamily: t.fontBody,
          }}>
            Crea tu cuenta gratis
          </div>
        </div>

        {/* Glass card */}
        <div className="glass-card animate-in-delay" style={{ padding: '28px 28px 32px' }}>
          <h2 style={{
            fontSize: '20px', fontWeight: '700', marginBottom: '4px',
            fontFamily: t.fontBody, letterSpacing: '-0.2px',
          }}>
            Crear cuenta
          </h2>
          <p style={{
            color: t.text2, fontSize: '14px', marginBottom: '24px',
            fontFamily: t.fontBody,
          }}>
            Empieza a programar tus entrenamientos
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Role selector */}
            <div>
              <label className="field-label">¿Cuál es tu rol?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ROLES.map(r => (
                  <button
                    key={r.value} type="button" onClick={() => setRole(r.value)}
                    style={{
                      padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
                      borderRadius: '10px', transition: 'all 160ms ease',
                      background: role === r.value ? 'rgba(0,255,135,0.08)' : t.surface2,
                      border: `1px solid ${role === r.value ? t.primary : t.border2}`,
                      boxShadow: role === r.value ? '0 0 0 1px rgba(0,255,135,0.12)' : 'none',
                      fontFamily: t.fontBody,
                    }}
                  >
                    <div style={{
                      fontWeight: '600', fontSize: '14px',
                      color: role === r.value ? t.primary : t.text,
                      marginBottom: '2px',
                    }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '12px', color: t.text2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="field-label">Nombre</label>
                <input
                  className="field"
                  type="text" value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required placeholder="Juan"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="field-label">Apellidos</label>
                <input
                  className="field"
                  type="text" value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required placeholder="García"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="field-label">Nombre de usuario</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: t.text3, fontSize: '14px',
                  pointerEvents: 'none', userSelect: 'none',
                  fontFamily: t.fontBody,
                }}>@</span>
                <input
                  className="field"
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_.-]/gi, '').toLowerCase())}
                  required placeholder="juangarcia"
                  style={{ paddingLeft: '28px' }}
                  autoComplete="username"
                />
              </div>
              <p style={{
                fontSize: '11px', color: t.text3, marginTop: '5px',
                fontFamily: t.fontBody, letterSpacing: '0.01em',
              }}>
                Otros usuarios te encontrarán por este nombre
              </p>
            </div>

            <div>
              <label className="field-label">Email</label>
              <input
                className="field"
                type="email" value={email}
                onChange={e => setEmail(e.target.value.toLowerCase())}
                required placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="field-label">Contraseña</label>
              <input
                className="field"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p style={{
          textAlign: 'center', marginTop: '24px',
          color: t.text2, fontSize: '14px',
          fontFamily: t.fontBody,
          animation: 'fadeIn 500ms 200ms both',
        }}>
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onGoLogin}
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
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegistroForm;
