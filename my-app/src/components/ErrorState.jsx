import React from 'react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load your analyses.',
  retryLabel = 'Try again',
  onRetry,
  icon,
  maxWidth = '620px',
  className = '',
  style = {},
  variant = 'default'
}) {
  const isOutline = variant === 'outline' || variant === 'white';

  return (
    <div
      className={className}
      style={{
        maxWidth,
        margin: '16px auto 0',
        border: isOutline ? '2px solid #B3261E' : '2px solid #10233A',
        background: isOutline ? '#fff' : '#FCE9E7',
        padding: isOutline ? '40px clamp(22px, 4vw, 44px)' : '44px clamp(22px, 4vw, 44px)',
        textAlign: 'center',
        boxShadow: isOutline ? 'none' : '8px 8px 0 #10233A',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {icon || (
        isOutline ? (
          <svg
            width="120"
            height="48"
            viewBox="0 0 120 48"
            aria-hidden="true"
            style={{ display: 'block', margin: '0 auto 18px' }}
          >
            <line x1="4" y1="24" x2="48" y2="24" stroke="#B83A16" strokeWidth="3" strokeDasharray="6 5" />
            <line x1="72" y1="24" x2="116" y2="24" stroke="#B83A16" strokeWidth="3" strokeDasharray="6 5" />
            <path d="M54 14l12 20M66 14L54 34" stroke="#B3261E" strokeWidth="3.5" />
          </svg>
        ) : (
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            aria-hidden="true"
            style={{ display: 'block', margin: '0 auto 18px' }}
          >
            <circle cx="48" cy="48" r="38" fill="#fff" stroke="#10233A" strokeWidth="3" />
            <line x1="28" y1="48" x2="68" y2="48" stroke="#B83A16" strokeWidth="3" strokeDasharray="6 5" />
            <path d="M54 14l12 20M66 14L54 34" stroke="#B3261E" strokeWidth="3.5" />
          </svg>
        )
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

      {message && (
        <p
          role="alert"
          style={{
            margin: '0 0 26px',
            fontSize: '18px',
            color: '#7A1A12',
            fontWeight: 600
          }}
        >
          {message}
        </p>
      )}

      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
