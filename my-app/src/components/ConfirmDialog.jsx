import React from 'react';

export default function ConfirmDialog({
  open = false,
  title = 'Are you sure?',
  message = 'Delete this analysis and its cover letter?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
  children
}) {
  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 35, 58, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 'min(440px, 92%)',
          border: '2px solid #10233A',
          background: '#fff',
          padding: '26px',
          boxShadow: '8px 8px 0 #10233A',
          zIndex: 51,
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 8px',
            font: "800 30px/1.05 'Bricolage Grotesque', sans-serif",
            color: '#10233A'
          }}
        >
          {title}
        </h2>
        {message && (
          <p
            style={{
              margin: '0 0 22px',
              color: '#3E5068',
              lineHeight: 1.5,
              fontSize: '17px'
            }}
          >
            {message}
          </p>
        )}
        {children}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn2"
            style={{ minHeight: '48px' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDestructive ? 'red' : ''}`}
            style={{ minHeight: '48px' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
