import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../context/ContextApi';
import { PageShell, Navbar, Footer, Button } from '../components';

export default function NotFound() {
  const { user, authLoading, logout } = useContext(Context) || {};
  const isLoggedIn = Boolean(user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      try {
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      } catch (err) {
        console.error(err);
      }
    }
    navigate('/');
  };

  return (
    <PageShell tape={{ variant: 'outOfRange', caption: '✕ Out of range' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(20px, 5vw, 56px) 40px'
        }}
      >
        <Navbar
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
          showSections={false}
          authLoading={authLoading}
          maxWidth="100%"
        />

        <div style={{ margin: '24px 0 0' }}>
          <svg
            viewBox="0 0 760 300"
            role="img"
            aria-label="404, with the zero drawn as a dashed pattern piece"
            style={{ width: 'min(100%, 760px)', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <text
              x="0"
              y="250"
              fontFamily="'Bricolage Grotesque', sans-serif"
              fontWeight="800"
              fontSize="320"
              letterSpacing="-12"
              fill="#10233A"
            >
              4
            </text>
            <ellipse
              className="ring"
              cx="380"
              cy="160"
              rx="96"
              ry="126"
              fill="none"
              stroke="#B83A16"
              strokeWidth="6"
              strokeDasharray="14 10"
            />
            <ellipse
              cx="380"
              cy="160"
              rx="50"
              ry="76"
              fill="none"
              stroke="#10233A"
              strokeWidth="3"
              strokeDasharray="6 6"
            />
            <text
              x="470"
              y="250"
              fontFamily="'Bricolage Grotesque', sans-serif"
              fontWeight="800"
              fontSize="320"
              letterSpacing="-12"
              fill="#10233A"
            >
              4
            </text>
          </svg>

          <p
            style={{
              font: "800 clamp(30px, 4vw, 48px)/1.05 'Bricolage Grotesque', sans-serif",
              margin: '16px 0 28px',
              letterSpacing: '-.02em'
            }}
          >
            This page does not exist.
          </p>
        </div>

        {authLoading ? (
          <div style={{ minHeight: '58px' }} aria-hidden="true" />
        ) : isLoggedIn ? (
          <Button
            as={Link}
            to="/dashboard"
            arrow
            style={{ minHeight: '58px', padding: '0 32px', fontSize: '18px' }}
          >
            Go to dashboard
          </Button>
        ) : (
          <Button
            as={Link}
            to="/"
            arrow
            style={{ minHeight: '58px', padding: '0 32px', fontSize: '18px' }}
          >
            Go to home
          </Button>
        )}

        {!authLoading && !isLoggedIn && (
          <Footer maxWidth="100%" style={{ marginTop: '72px', padding: '28px 0 8px' }} />
        )}
      </div>
    </PageShell>
  );
}
