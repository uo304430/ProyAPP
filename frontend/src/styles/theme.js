// Design tokens — single source of truth for all inline styles
export const t = {
  // Backgrounds — warm carbon-black, not cold blue-black
  bg: '#080706',
  surface: '#0f0c09',
  surface2: '#161209',
  surface3: '#1d180f',

  // Borders — warm tinted
  border: '#2c2418',
  border2: '#3a3020',
  borderHover: '#4e4030',

  // Primary — copper-amber (cast iron & competition gold)
  primary: '#d4892a',
  primaryDim: 'rgba(212, 137, 42, 0.1)',
  primaryDark: '#b07020',
  primaryGrad: 'linear-gradient(135deg, #c97820 0%, #e8a030 100%)',
  primaryGlow: '0 0 20px rgba(212, 137, 42, 0.3), 0 0 40px rgba(212, 137, 42, 0.08)',

  // Text — warm cream, not sterile cold white
  text: '#f0e6d2',
  text2: '#9a8868',
  text3: '#554535',

  // Semantic — warm palette throughout
  danger: '#c84030',
  dangerDim: 'rgba(200, 64, 48, 0.1)',
  warning: '#e07830',
  warningDim: 'rgba(224, 120, 48, 0.1)',
  info: '#4a8fd4',
  infoDim: 'rgba(74, 143, 212, 0.1)',

  // Lift colors — contextually appropriate
  sq: '#d4892a',  // squat: amber (primary)
  bp: '#4a8fd4',  // bench: steel blue
  dl: '#c84030',  // deadlift: burnt red

  // Typography
  fontDisplay: '"Bebas Neue", sans-serif',
  fontBody: '"Barlow Semi Condensed", system-ui, sans-serif',

  // Shadows
  shadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
  shadowLg: '0 20px 60px rgba(0, 0, 0, 0.8)',
  shadowGlow: '0 8px 32px rgba(212, 137, 42, 0.15)',

  // Glass surface
  glass: 'rgba(15, 12, 9, 0.92)',
};

export const card = {
  backgroundColor: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: '16px',
  boxShadow: '0 1px 0 rgba(255, 245, 220, 0.03) inset',
};

export const input = {
  width: '100%',
  padding: '11px 15px',
  backgroundColor: t.surface2,
  color: t.text,
  border: `1px solid ${t.border2}`,
  borderRadius: '10px',
  fontSize: '15px',
  fontFamily: t.fontBody,
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  letterSpacing: '0.01em',
};

export const btnPrimary = {
  padding: '12px 24px',
  background: t.primaryGrad,
  color: '#0a0602',
  border: 'none',
  borderRadius: '10px',
  fontWeight: '600',
  fontSize: '13px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'box-shadow 180ms ease, transform 100ms ease, opacity 180ms ease',
  fontFamily: t.fontBody,
};

export const btnSecondary = {
  padding: '10px 18px',
  backgroundColor: t.surface3,
  color: t.text,
  border: `1px solid ${t.border2}`,
  borderRadius: '10px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 180ms ease, border-color 180ms ease',
  letterSpacing: '0.02em',
  fontFamily: t.fontBody,
};

export const btnDanger = {
  padding: '8px 14px',
  backgroundColor: t.dangerDim,
  color: t.danger,
  border: `1px solid rgba(200, 64, 48, 0.2)`,
  borderRadius: '10px',
  fontWeight: '500',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background-color 180ms ease',
  letterSpacing: '0.02em',
  fontFamily: t.fontBody,
};

export const label = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: t.text3,
  marginBottom: '7px',
};

export const pageContainer = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '36px 20px 64px',
};

export const wideContainer = {
  maxWidth: '980px',
  margin: '0 auto',
  padding: '36px 20px 64px',
};
