import React from 'react';
import MeasuringTape from './MeasuringTape.jsx';

export default function PageShell({
  tape,
  children,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`page-shell ${className}`}
      style={{
        minHeight: '100vh',
        background: '#E9EEF2',
        color: '#10233A',
        fontFamily: "'Figtree', system-ui, sans-serif",
        ...style
      }}
      {...props}
    >
      {tape && <MeasuringTape {...tape} />}
      {children}
    </div>
  );
}
