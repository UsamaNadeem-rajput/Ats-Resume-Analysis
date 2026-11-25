import React from 'react';

export default function Chip({
  children,
  variant = 'gr',
  className = '',
  style = {},
  ...props
}) {
  let vClass = 'gr';
  if (variant === 'ok' || variant === 'good' || variant === 'ready' || variant === 'success') {
    vClass = 'ok';
  } else if (variant === 'bad' || variant === 'weak' || variant === 'failed' || variant === 'error') {
    vClass = 'bad';
  } else if (variant === 'no' || variant === 'missing' || variant === 'fair') {
    vClass = 'no';
  }

  return (
    <span className={`chip ${vClass} ${className}`} style={style} {...props}>
      {children}
    </span>
  );
}
