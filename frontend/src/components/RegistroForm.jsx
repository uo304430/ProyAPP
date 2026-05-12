import React, { useState } from 'react';
import axios from 'axios';
import { t, input, btnPrimary, label } from '../styles/theme';

const API = '/api';

const ROLES = [
  { value: 'athlete', label: 'Atleta', desc: 'Entreno y registro mis series' },
  { value: 'coach', label: 'Entrenador', desc: 'Programo a mis atletas' },
];

const RegistroForm = ({ onRegisterSuccess, onGoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('athlete');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/register/`, { email, password, role });
      onRegisterSuccess(data.usuario_id, data.rol);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar');
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
            <span style={{ color: t.text }}>PowerApp</span>
          </div>
          <p style={{ color: t.text2, fontSize: '14px', marginTop: '8px' }}>
            Crea tu cuenta gratis
          </p>
        </div>

        <div style={{
          backgroundColor: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '16px', padding: '32px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Crear cuenta</h2>
          <p style={{ color: t.text2, fontSize: '14px', marginBottom: '28px' }}>
            Empieza a programar tus entrenamientos
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Role selector */}
            <div>
              <label style={label}>¿Cuál es tu rol?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ROLES.map(r => (
                  <button
                    key={r.value} type="button" onClick={() => setRole(r.value)}
                    style={{
                      padding: '12px', textAlign: 'left', cursor: 'pointer',
                      borderRadius: '10px', transition: 'all 150ms ease',
                      backgroundColor: role === r.value ? t.primaryDim : t.surface2,
                      border: `1px solid ${role === r.value ? t.primary : t.border2}`,
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', color: role === r.value ? t.primary : t.text }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '12px', color: t.text2, marginTop: '2px' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

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
                required placeholder="Mínimo 8 caracteres"
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: t.text2, fontSize: '14px' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={onGoLogin} style={{
            background: 'none', border: 'none', color: t.primary,
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
          }}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegistroForm;
