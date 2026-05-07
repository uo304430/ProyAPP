// Design tokens — single source of truth for all inline styles
export const t = {
  bg: '#0c0c10',
  surface: '#13131a',
  surface2: '#1a1a24',
  surface3: '#21212e',
  border: '#252535',
  border2: '#2e2e42',
  primary: '#00ff87',
  primaryDim: 'rgba(0, 255, 135, 0.1)',
  primaryDark: '#00cc6a',
  text: '#ffffff',
  text2: '#9898b0',
  text3: '#55556a',
  danger: '#ff4757',
  dangerDim: 'rgba(255, 71, 87, 0.12)',
  warning: '#ffa502',
  info: '#3a86ff',
  infoDim: 'rgba(58, 134, 255, 0.12)',
};

export const card = {
  backgroundColor: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: '10px',
};

export const input = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: t.surface2,
  color: t.text,
  border: `1px solid ${t.border2}`,
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 150ms ease',
};

export const btnPrimary = {
  padding: '11px 20px',
  backgroundColor: t.primary,
  color: t.bg,
  border: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'opacity 150ms ease, transform 100ms ease',
};

export const btnSecondary = {
  padding: '10px 18px',
  backgroundColor: t.surface3,
  color: t.text,
  border: `1px solid ${t.border2}`,
  borderRadius: '8px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
};

export const btnDanger = {
  padding: '8px 14px',
  backgroundColor: t.dangerDim,
  color: t.danger,
  border: `1px solid ${t.danger}30`,
  borderRadius: '8px',
  fontWeight: '500',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
};

export const label = {
  fontSize: '13px',
  fontWeight: '500',
  color: t.text2,
  marginBottom: '6px',
  display: 'block',
};

export const pageContainer = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 20px',
};

export const wideContainer = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '32px 20px',
};
