import React from 'react';

export default function Navbar({
  isLoggedIn = false,
  activeKey = '',
  user = { name: 'User' },
  onLogout,
  maxWidth = '1200px',
  className = '',
  style = {},
  variant,
  authAction,
  brandHref = '/',
  showSections = true,
  authLoading = false
}) {
  if (variant === 'auth' || authAction) {
    return (
      <header
        className={`nav ${className}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          padding: '28px 0',
          maxWidth: maxWidth,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          ...style
        }}
      >
        <a
          href={brandHref}
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: '22px',
            textDecoration: 'none',
            color: '#10233A',
            border: 0
          }}
        >
          Pattern Cutter
        </a>
        {authAction && (
          <span style={{ fontSize: '15px', fontWeight: 500 }}>
            {authAction.prompt || 'New here?'}{' '}
            <a href={authAction.href || authAction.to || '/register'} style={{ color: '#B83A16', fontWeight: 600 }}>
              {authAction.linkText || 'Create an account'}
            </a>
          </span>
        )}
      </header>
    );
  }

  return (
    <header
      className={`nav ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 0',
        maxWidth: maxWidth,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <a
        href={isLoggedIn ? '/dashboard' : '/'}
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: '22px',
          textDecoration: 'none',
          color: '#10233A',
          border: 0
        }}
      >
        Pattern Cutter
      </a>

      <div className="links" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {authLoading ? (
          <div style={{ minHeight: '44px' }} aria-hidden="true" />
        ) : isLoggedIn ? (
          <>
            <a
              href="/dashboard"
              className={activeKey === 'dashboard' ? 'on' : ''}
              aria-current={activeKey === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </a>
            <a
              href="/analysis/new"
              className={activeKey === 'analysis' ? 'on' : ''}
              aria-current={activeKey === 'analysis' ? 'page' : undefined}
            >
              New analysis
            </a>
            <a
              href="/history"
              className={activeKey === 'history' ? 'on' : ''}
              aria-current={activeKey === 'history' ? 'page' : undefined}
            >
              History
            </a>

            <details style={{ position: 'relative' }}>
              <summary
                aria-label="Account menu"
                style={{
                  listStyle: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '44px'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid #10233A',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="7" r="4" fill="none" stroke="#10233A" strokeWidth="2" />
                    <path d="M3 18c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="#10233A" strokeWidth="2" />
                  </svg>
                </span>
                <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="M1 1l5 5 5-5" fill="none" stroke="#10233A" strokeWidth="2" />
                </svg>
              </summary>
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50px',
                  background: '#F6F8FA',
                  border: '2px solid #10233A',
                  padding: '8px 0',
                  minWidth: '170px',
                  zIndex: 9
                }}
              >
                <a href="/settings" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  Settings
                </a>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    padding: '0 18px',
                    height: '40px',
                    alignItems: 'center',
                    color: '#B83A16',
                    width: '100%',
                    background: 'none',
                    border: 0,
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Log out
                </button>
              </div>
            </details>
          </>
        ) : (
          <>
            {showSections && (
              <>
                <a href="#how">How it works</a>
                <a href="#faq">FAQ</a>
              </>
            )}
            <a href="/login">Log in</a>
            <a
              className="btn"
              href="/register"
              style={{ minHeight: '44px', padding: '0 20px', fontSize: '15px', color: '#fff' }}
            >
              Get started
            </a>
          </>
        )}
      </div>

      <details className="burger" style={{ position: 'relative' }}>
        <summary
          aria-label="Menu"
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #10233A',
            background: 'transparent'
          }}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <path d="M0 2h22M0 8h22M0 14h22" stroke="#10233A" strokeWidth="2.5" />
          </svg>
        </summary>
        {!authLoading && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '52px',
              background: '#F6F8FA',
              border: '2px solid #10233A',
              padding: isLoggedIn || !showSections ? '8px 0' : '16px 24px',
              display: 'grid',
              gap: isLoggedIn || !showSections ? '0' : '14px',
              zIndex: 99,
              minWidth: isLoggedIn ? '190px' : showSections ? '160px' : '170px'
            }}
          >
            {isLoggedIn ? (
              <>
                <a href="/dashboard" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  Dashboard
                </a>
                <a href="/analysis/new" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  New analysis
                </a>
                <a href="/history" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  History
                </a>
                <a href="/settings" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  Settings
                </a>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    padding: '0 18px',
                    height: '40px',
                    alignItems: 'center',
                    color: '#B83A16',
                    width: '100%',
                    background: 'none',
                    border: 0,
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Log out
                </button>
              </>
            ) : showSections ? (
              <>
                <a href="#how">How it works</a>
                <a href="#faq">FAQ</a>
                <a href="/login">Log in</a>
                <a href="/register" style={{ color: '#B83A16', fontWeight: 600 }}>
                  Get started
                </a>
              </>
            ) : (
              <>
                <a href="/login" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center' }}>
                  Log in
                </a>
                <a href="/register" style={{ display: 'flex', padding: '0 18px', height: '40px', alignItems: 'center', color: '#B83A16' }}>
                  Get started
                </a>
              </>
            )}
          </div>
        )}
      </details>
    </header>
  );
}
