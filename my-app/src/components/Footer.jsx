import React from 'react';

export default function Footer({
  tagline = 'Estimate, not a real ATS score',
  githubUrl = '#',
  maxWidth = '1280px',
  className = '',
  style = {}
}) {
  return (
    <footer
      className={className}
      style={{
        borderTop: '2px solid #10233A',
        padding: '28px 0 40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 32px',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <span
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: '18px',
          color: '#10233A'
        }}
      >
        Pattern Cutter
      </span>
      <span className="mono" style={{ color: '#3E5068' }}>
        {tagline}
      </span>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontWeight: 600,
          color: '#B83A16',
          minHeight: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        GitHub
      </a>
    </footer>
  );
}
