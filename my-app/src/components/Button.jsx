import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  arrow = false,
  as: Component,
  href,
  type = 'button',
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const isSecondary = variant === 'secondary' || variant === 'outline';
  const isDanger = variant === 'danger' || variant === 'red';

  const classes = [
    'btn',
    isSecondary ? 'btn2' : '',
    isDanger ? 'red' : '',
    loading ? 'loading' : '',
    disabled || loading ? 'dis' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="spin" aria-hidden="true" />}
      {children}
      {arrow && !loading && <span className="pin" aria-hidden="true">→</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={disabled || loading ? undefined : href}
        className={classes}
        style={style}
        aria-disabled={disabled || loading}
        onClick={disabled || loading ? (e) => e.preventDefault() : onClick}
        {...props}
      >
        {content}
      </a>
    );
  }

  const Tag = Component || 'button';

  return (
    <Tag
      type={Tag === 'button' ? type : undefined}
      className={classes}
      disabled={disabled || loading}
      style={style}
      onClick={onClick}
      {...props}
    >
      {content}
    </Tag>
  );
}
