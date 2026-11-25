import React from 'react';

export default function Skeleton({
  width = '100%',
  height = '48px',
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`sk ${className}`}
      aria-hidden="true"
      style={{
        width,
        height,
        boxSizing: 'border-box',
        ...style
      }}
      {...props}
    />
  );
}
