import React from 'react';

export default function EmptyState({
  title = 'No analyses yet',
  description = 'Upload your resume to see your first score.',
  actionLabel = 'Analyze my first resume',
  actionHref,
  onAction,
  icon,
  maxWidth = '620px',
  className = '',
  style = {}
}) {
  return (
    <div
      className={className}
      style={{
        maxWidth,
        margin: '16px auto 0',
        border: '2px solid #10233A',
        background: '#F6F8FA',
        padding: '44px clamp(22px, 4vw, 44px)',
        textAlign: 'center',
        boxShadow: '8px 8px 0 #10233A',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {icon || (
        <svg
          className="bob"
          width="96"
          height="96"
          viewBox="0 0 96 96"
          aria-hidden="true"
          style={{ display: 'block', margin: '0 auto 18px' }}
        >
          <rect x="26" y="12" width="44" height="72" fill="#fff" stroke="#10233A" strokeWidth="3" strokeDasharray="7 5" />
          <rect x="16" y="2" width="64" height="92" fill="none" stroke="#B83A16" strokeWidth="2.5" strokeDasharray="7 5" />
          <path d="M48 34v28M36 46h24" stroke="#B83A16" strokeWidth="3.5" />
        </svg>
      )}

      <h2
        style={{
          font: "800 34px/1.05 'Bricolage Grotesque', sans-serif",
          margin: '0 0 12px',
          color: '#10233A'
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          style={{
            margin: '0 0 26px',
            fontSize: '18px',
            lineHeight: 1.55,
            color: '#3E5068'
          }}
        >
          {description}
        </p>
      )}

      {actionHref ? (
        <a className="btn" href={actionHref}>
          {actionLabel} <span className="pin" aria-hidden="true">→</span>
        </a>
      ) : onAction ? (
        <button type="button" className="btn" onClick={onAction}>
          {actionLabel} <span className="pin" aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}
