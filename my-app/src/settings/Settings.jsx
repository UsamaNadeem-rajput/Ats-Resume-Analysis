import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../context/ContextApi';
import { PageShell, Navbar } from '../components';

export default function Settings() {
  const { user, name, authLoading, logout } = useContext(Context) || {};
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      try {
        await axios.post(
          'http://localhost:5000/api/auth/logout',
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error('Logout error:', err.response?.data?.message || err.message);
      }
    }
    navigate('/', { state: { toast: '✓ Logged out successfully' } });
  };

  const displayName = name || user?.name || 'User';
  const displayEmail = user?.email || '';
  const avatarUrl = user?.avatar || null;
  const initial = (displayName.trim()?.[0] || 'U').toUpperCase();

  const isGoogle = Boolean(user?.googleId);
  const providerLabel = isGoogle
    ? 'Signed in with Google'
    : displayEmail
    ? 'Signed in with email'
    : null;

  return (
    <PageShell
      tape={{ variant: 'base', caption: 'Settings' }}
      style={{
        minHeight: '100vh',
        background: '#E9EEF2',
        color: '#10233A',
        fontFamily: "'Figtree', system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px) 64px' }}>
        <Navbar
          isLoggedIn={Boolean(user)}
          activeKey="settings"
          user={user || { name: displayName }}
          onLogout={handleLogout}
          authLoading={authLoading}
          maxWidth="100%"
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 40px', margin: '28px 0 36px' }}>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(44px, 6.4vw, 96px)',
              lineHeight: 0.94,
              letterSpacing: '-0.03em',
              margin: 0,
              flex: '1 1 360px'
            }}
          >
            Settings<span style={{ color: '#B83A16' }}>.</span>
          </h1>
        </div>

        {authLoading ? (
          <div aria-hidden="true" style={{ display: 'grid', gap: '14px', maxWidth: '640px', padding: '28px 0 36px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="sk" style={{ width: '88px', height: '88px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: '16px', width: '40%', marginBottom: '10px' }} />
                <div className="sk" style={{ height: '30px', width: '60%' }} />
              </div>
            </div>
            <div className="sk" style={{ height: '52px' }} />
            <div className="sk" style={{ height: '52px' }} />
            <div className="sk" style={{ height: '140px', marginTop: '20px' }} />
          </div>
        ) : (
          <div>
            <section
              className="row"
              style={{
                borderTop: '3px dashed #10233A',
                padding: '28px 0 36px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px 40px',
                animationDelay: '0.05s'
              }}
            >
              <div style={{ flex: '0 0 min(100%, 280px)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span className="mark">A</span>
                <div>
                  <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>Profile</h2>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#3E5068' }}>Read only.</p>
                </div>
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: '640px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {avatarUrl ? (
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        border: '3px solid #10233A',
                        background: '#C5CFDA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flex: 'none'
                      }}
                      role="img"
                      aria-label={isGoogle ? 'Profile photo from Google' : 'Profile photo'}
                    >
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.style.border = '3px solid #B83A16';
                            e.currentTarget.parentElement.style.background = '#fff';
                            e.currentTarget.parentElement.innerHTML = `<span style="font: 800 44px 'Bricolage Grotesque', sans-serif; color: #B83A16;">${initial}</span>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        border: '3px solid #B83A16',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: "800 44px 'Bricolage Grotesque', sans-serif",
                        color: '#B83A16',
                        flex: 'none'
                      }}
                      role="img"
                      aria-label={`Profile initial ${initial}`}
                    >
                      {initial}
                    </div>
                  )}

                  <div>
                    {providerLabel && (
                      <span className="chip gr" style={{ marginBottom: '10px' }}>
                        {providerLabel}
                      </span>
                    )}
                    <p style={{ margin: 0, font: "800 32px/1.1 'Bricolage Grotesque', sans-serif" }}>
                      {displayName}
                    </p>
                  </div>
                </div>

                <dl style={{ margin: 0, display: 'grid', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'center',
                      border: '2px solid #10233A',
                      background: '#F6F8FA',
                      padding: '14px 18px'
                    }}
                  >
                    <dt className="mono" style={{ color: '#3E5068' }}>Name</dt>
                    <dd style={{ margin: 0, fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {displayName}{' '}
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: 'none' }}>
                        <rect x="3" y="7" width="10" height="7" fill="none" stroke="#3E5068" strokeWidth="1.8" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#3E5068" strokeWidth="1.8" />
                      </svg>
                    </dd>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'center',
                      border: '2px solid #10233A',
                      background: '#F6F8FA',
                      padding: '14px 18px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <dt className="mono" style={{ color: '#3E5068' }}>Email</dt>
                    <dd style={{ margin: 0, fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {displayEmail}{' '}
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: 'none' }}>
                        <rect x="3" y="7" width="10" height="7" fill="none" stroke="#3E5068" strokeWidth="1.8" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#3E5068" strokeWidth="1.8" />
                      </svg>
                    </dd>
                  </div>
                </dl>

                <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#3E5068' }}>
                  Name and password changes are not available in this version.
                </p>
              </div>
            </section>

            <section
              className="row"
              style={{
                borderTop: '3px dashed #10233A',
                padding: '28px 0 36px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px 40px',
                animationDelay: '0.1s'
              }}
            >
              <div style={{ flex: '0 0 min(100%, 280px)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span className="mark">B</span>
                <div>
                  <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>Session</h2>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#3E5068' }}>End your session on this device.</p>
                </div>
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: '640px' }}>
                <button
                  type="button"
                  className="btn btn2"
                  onClick={handleLogout}
                  style={{ color: '#B83A16', borderColor: '#B83A16' }}
                >
                  Log out
                </button>
                <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#3E5068' }}>
                  You return to the home page.
                </p>
              </div>
            </section>

            <section
              className="row"
              style={{
                borderTop: '3px dashed #10233A',
                padding: '28px 0 36px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px 40px',
                animationDelay: '0.15s'
              }}
            >
              <div style={{ flex: '0 0 min(100%, 280px)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span className="mark">C</span>
                <div>
                  <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>Privacy and data</h2>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#3E5068' }}>What happens to your resume text.</p>
                </div>
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: '640px' }}>
                <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.65, fontWeight: 500 }}>
                  Your resume text is stored to avoid reparsing. Name, email and phone are removed before anything is sent to the AI. You can delete any analysis from History.
                </p>
                <p style={{ margin: '16px 0 0' }}>
                  <Link
                    to="/dashboard"
                    style={{
                      fontWeight: 600,
                      color: '#B83A16',
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: '44px',
                      textDecoration: 'none'
                    }}
                  >
                    Go to History →
                  </Link>
                </p>
              </div>
            </section>

            <section
              className="row"
              style={{
                borderTop: '3px dashed #10233A',
                padding: '28px 0 36px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px 40px',
                animationDelay: '0.2s'
              }}
            >
              <div style={{ flex: '0 0 min(100%, 280px)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span className="mark">D</span>
                <div>
                  <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>Delete account</h2>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#3E5068' }}>Not available in this version.</p>
                </div>
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: '640px' }}>
                <button type="button" className="btn dis" disabled>
                  Delete account · Coming soon
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
