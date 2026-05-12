import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { t, input, label, btnPrimary } from '../styles/theme';

const API = '/api';

const PR_LIFTS = [
  { key: 'squat_pr', label: 'Squat', icon: '🏋️' },
  { key: 'bench_pr', label: 'Bench Press', icon: '🔵' },
  { key: 'deadlift_pr', label: 'Deadlift', icon: '⬆️' },
];

const PerfilView = ({ userId, onBack }) => {
  const [profile, setProfile] = useState({
    display_name: '',
    avatar_url: '',
    squat_pr: '',
    bench_pr: '',
    deadlift_pr: '',
    email: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    axios.get(`${API}/users/${userId}/profile/`)
      .then(r => setProfile({
        display_name: r.data.display_name || '',
        avatar_url: r.data.avatar_url || '',
        squat_pr: r.data.squat_pr ?? '',
        bench_pr: r.data.bench_pr ?? '',
        deadlift_pr: r.data.deadlift_pr ?? '',
        email: r.data.email || '',
        role: r.data.role || '',
      }))
      .catch(() => setError('Error cargando perfil'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfile(p => ({ ...p, avatar_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/users/${userId}/profile/`, {
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        squat_pr: profile.squat_pr !== '' ? parseFloat(profile.squat_pr) : null,
        bench_pr: profile.bench_pr !== '' ? parseFloat(profile.bench_pr) : null,
        deadlift_pr: profile.deadlift_pr !== '' ? parseFloat(profile.deadlift_pr) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const total = [profile.squat_pr, profile.bench_pr, profile.deadlift_pr]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: t.text2 }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, padding: '32px 20px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
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
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Mi Perfil</h1>
            <p style={{ color: t.text2, fontSize: '13px' }}>Foto, nombre y récords personales</p>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url} alt="avatar"
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${t.primary}` }}
              />
            ) : (
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                backgroundColor: t.primaryDim, border: `3px solid ${t.primary}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', fontWeight: '700', color: t.primary,
              }}>
                {(profile.display_name || profile.email || '?')[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: t.primary, color: t.bg,
                border: 'none', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Cambiar foto"
            >
              +
            </button>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImage}
            />
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Display name */}
          <div>
            <label style={label}>Nombre visible</label>
            <input
              type="text" value={profile.display_name}
              onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
              placeholder="ej. Izan Sánchez"
              style={input}
              onFocus={e => e.target.style.borderColor = t.primary}
              onBlur={e => e.target.style.borderColor = t.border2}
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label style={label}>Email</label>
            <div style={{
              ...input, color: t.text2, cursor: 'default',
              display: 'flex', alignItems: 'center',
            }}>
              {profile.email}
            </div>
          </div>

          {/* PRs */}
          <div>
            <label style={label}>Récords personales (kg)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PR_LIFTS.map(lift => (
                <div
                  key={lift.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: t.surface2, border: `1px solid ${t.border2}`,
                    borderRadius: '10px', padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{lift.icon}</span>
                  <span style={{ flex: 1, fontWeight: '500', fontSize: '14px' }}>{lift.label}</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min="0" step="0.5"
                      value={profile[lift.key]}
                      onChange={e => setProfile(p => ({ ...p, [lift.key]: e.target.value }))}
                      placeholder="—"
                      style={{
                        width: '90px', padding: '8px 30px 8px 10px',
                        backgroundColor: t.surface3, color: t.text,
                        border: `1px solid ${t.border2}`, borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700', textAlign: 'center',
                        outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = t.primary}
                      onBlur={e => e.target.style.borderColor = t.border2}
                    />
                    <span style={{
                      position: 'absolute', right: '8px', top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px', color: t.text3, pointerEvents: 'none',
                    }}>kg</span>
                  </div>
                </div>
              ))}

              {/* Total */}
              {total > 0 && (
                <div style={{
                  backgroundColor: t.primaryDim, border: `1px solid ${t.primary}30`,
                  borderRadius: '10px', padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: t.primary }}>Total</span>
                  <span style={{ fontWeight: '800', fontSize: '20px', color: t.primary, letterSpacing: '-0.5px' }}>
                    {total} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: t.dangerDim, border: `1px solid ${t.danger}40`,
              borderRadius: '8px', padding: '10px 14px', color: t.danger, fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSave} disabled={saving}
            style={{
              ...btnPrimary, width: '100%',
              opacity: saving ? 0.6 : 1,
              backgroundColor: saved ? '#00cc6a' : t.primary,
              transition: 'background-color 300ms ease, opacity 150ms ease',
            }}
          >
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilView;
