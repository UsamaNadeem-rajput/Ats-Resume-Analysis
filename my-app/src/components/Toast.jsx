import React from 'react';

export default function Toast({
  open = true,
  message = '✓ Analysis deleted',
  onClose,
  position = 'fixed',
  className = '',
  style = {}
}) {
  if (!open) return null;

  const positionStyle =
    position === 'fixed'
      ? {
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 90
        }
      : {
          position: 'relative'
        };

  return (
    <div
      className={`toast ${className}`}
      role="status"
      style={{
        ...positionStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: '#10233A',
        color: '#fff',
        padding: '14px 8px 14px 20px',
        fontWeight: 600,
        boxShadow: '6px 6px 0 #B83A16',
        maxWidth: 'min(420px, 92vw)',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <span style={{ fontSize: '15px' }}>{message}</span>
      {onClose && (
        <button
          type="button"
          aria-label="Close message"
          onClick={onClose}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            border: 0,
            background: 'transparent',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
