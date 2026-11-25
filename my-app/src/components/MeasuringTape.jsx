import React, { useState, useEffect, useRef } from 'react';

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getScoreColor(v) {
  if (v >= 70) return '#1F7A4D';
  if (v >= 40) return '#B45309';
  return '#B3261E';
}

function getScoreTextColor(v) {
  if (v >= 70) return '#1F7A4D';
  if (v >= 40) return '#9A4A06';
  return '#B3261E';
}

export default function MeasuringTape({
  variant = 'base',
  value,
  compareValue,
  total,
  done,
  progress,
  page,
  totalPages,
  caption,
  showCaption = true,
  maxWidth = '1200px',
  outOfRange = false,
  compact,
  className = '',
  style = {}
}) {
  let effectiveVariant = variant;
  if (outOfRange) {
    effectiveVariant = 'outOfRange';
  } else if (progress || (done !== undefined && total !== undefined)) {
    effectiveVariant = 'progress';
  } else if (compareValue !== undefined && compareValue !== null) {
    effectiveVariant = 'compare';
  } else if (value !== undefined && effectiveVariant === 'base') {
    effectiveVariant = 'score';
  }

  let numericValue = 0;
  let effectiveDone = done;
  let effectiveTotal = total;

  if (effectiveVariant === 'progress') {
    if (progress) {
      effectiveDone = progress.done ?? 0;
      effectiveTotal = progress.total ?? 1;
    }
    const t = effectiveTotal || 1;
    const d = effectiveDone || 0;
    numericValue = (d / t) * 100;
  } else if (effectiveVariant === 'position') {
    const p = page || 1;
    const tp = totalPages || 1;
    numericValue = tp > 1 ? ((p - 1) / (tp - 1)) * 100 : 0;
  } else if (effectiveVariant === 'score' || effectiveVariant === 'compare') {
    numericValue = value !== undefined ? Number(value) : 0;
  }

  const clampedVal = clamp(numericValue, 0, 100);

  const [mediaCompact, setMediaCompact] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 600;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 599.98px)');
    const handler = (e) => setMediaCompact(e.matches);
    setMediaCompact(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const isCompact = compact !== undefined ? compact : mediaCompact;

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReducedMotion(e.matches);
    setReducedMotion(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const multiplier = isCompact ? 4 : 10;
  const targetX = Math.round(clampedVal * multiplier);

  const showSecondMarker =
    effectiveVariant === 'compare' &&
    compareValue !== undefined &&
    compareValue !== null &&
    Number(compareValue) !== Number(value);

  const targetCompareX = showSecondMarker
    ? Math.round(clamp(Number(compareValue), 0, 100) * multiplier)
    : null;

  const [markerX, setMarkerX] = useState(() => (reducedMotion ? targetX : 0));
  const [compareX, setCompareX] = useState(() => (reducedMotion ? (targetCompareX ?? 0) : 0));
  const [isInitial, setIsInitial] = useState(() => !reducedMotion);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setMarkerX(targetX);
      if (targetCompareX !== null) setCompareX(targetCompareX);
      return;
    }

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const raf = requestAnimationFrame(() => {
        setMarkerX(targetX);
        if (targetCompareX !== null) setCompareX(targetCompareX);
      });
      const timer = setTimeout(() => {
        setIsInitial(false);
      }, 2000);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      setMarkerX(targetX);
      if (targetCompareX !== null) setCompareX(targetCompareX);
    }
  }, [targetX, targetCompareX, reducedMotion]);

  let markerColor = '#10233A';
  let captionColor = '#3E5068';

  if (effectiveVariant === 'score') {
    markerColor = getScoreColor(clampedVal);
    captionColor = getScoreTextColor(clampedVal);
  } else if (effectiveVariant === 'progress' || effectiveVariant === 'position') {
    markerColor = '#B83A16';
    captionColor = '#B83A16';
  } else if (effectiveVariant === 'compare') {
    markerColor = getScoreColor(clampedVal);
    captionColor = getScoreTextColor(clampedVal);
  } else if (effectiveVariant === 'outOfRange') {
    markerColor = '#B3261E';
    captionColor = '#B3261E';
  }

  let defaultCaption = null;
  if (effectiveVariant === 'score') {
    if (clampedVal >= 70) {
      defaultCaption = `✓ Score: ${clampedVal} / 100 · Good`;
    } else if (clampedVal >= 40) {
      defaultCaption = `~ Score: ${clampedVal} / 100 · Fair`;
    } else {
      defaultCaption = `✕ Score: ${clampedVal} / 100 · Weak`;
    }
  } else if (effectiveVariant === 'progress') {
    defaultCaption = `${effectiveDone || 0} of ${effectiveTotal || 4} measurements`;
  } else if (effectiveVariant === 'compare') {
    if (showSecondMarker) {
      defaultCaption = `▲ Latest: ${clampedVal} · △ Best of last 10: ${compareValue}`;
    } else {
      defaultCaption = `▲ Latest: ${clampedVal}`;
    }
  } else if (effectiveVariant === 'position') {
    defaultCaption = `Page ${page || 1} of ${totalPages || 1}`;
  } else if (effectiveVariant === 'outOfRange') {
    defaultCaption = '✕ Out of range';
  }

  const finalCaption = caption !== undefined ? caption : defaultCaption;
  const isAriaLive = effectiveVariant === 'progress' || effectiveVariant === 'score';

  const fullTicks = Array.from({ length: 101 }, (_, i) => {
    const x = i * 10;
    const y2 = i % 5 === 0 ? 22 : 12;
    return <line key={x} x1={x} y1="0" x2={x} y2={y2} stroke="#10233A" strokeWidth="2" />;
  });

  const fullLabels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => (
    <text
      key={n}
      x={n * 10}
      y="44"
      fontSize="13"
      textAnchor="middle"
      fill="#10233A"
      fontFamily="'DM Mono', monospace"
    >
      {n}
    </text>
  ));

  const compactTicks = Array.from({ length: 101 }, (_, i) => {
    const x = i * 4;
    const y2 = i % 25 === 0 ? 22 : i % 5 === 0 ? 14 : 8;
    return <line key={x} x1={x} y1="0" x2={x} y2={y2} stroke="#10233A" strokeWidth="2" />;
  });

  const compactLabels = [0, 25, 50, 75, 100].map((n) => (
    <text
      key={n}
      x={n * 4}
      y="46"
      fontSize="15"
      textAnchor="middle"
      fill="#10233A"
      fontFamily="'DM Mono', monospace"
    >
      {n}
    </text>
  ));

  const hasMarker = effectiveVariant !== 'base';

  return (
    <div
      className={`tape-strip ${className}`}
      style={{
        width: '100%',
        background: '#F6F8FA',
        borderBottom: '2px solid #10233A',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <style>{`
        @keyframes tape-unroll {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes tape-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tape-drop-full {
          0% { transform: translateX(0px); }
          70% { transform: translateX(1120px); }
          100% { transform: translateX(1020px); }
        }
        @keyframes tape-drop-compact {
          0% { transform: translateX(0px); }
          70% { transform: translateX(448px); }
          100% { transform: translateX(408px); }
        }
        .tape-ticks {
          animation: tape-unroll 0.9s ease-out both;
        }
        .tape-labels {
          animation: tape-fade 0.9s ease-out both;
        }
        .tape-drop-full {
          animation: tape-drop-full 2.4s cubic-bezier(.3,.7,.3,1) 0.3s both;
        }
        .tape-drop-compact {
          animation: tape-drop-compact 2.4s cubic-bezier(.3,.7,.3,1) 0.3s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .tape-ticks {
            animation: none !important;
            clip-path: none !important;
          }
          .tape-labels {
            animation: none !important;
            opacity: 1 !important;
          }
          .tape-drop-full, .tape-drop-compact {
            animation: none !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '18px clamp(20px, 5vw, 56px) 14px',
          boxSizing: 'border-box'
        }}
      >
        {isCompact ? (
          <svg
            viewBox="-12 0 424 80"
            aria-hidden="true"
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <g className="tape-ticks">
              {compactTicks}
            </g>
            <g className="tape-labels">
              {compactLabels}
            </g>

            {hasMarker && (
              <>
                {effectiveVariant === 'outOfRange' ? (
                  <polygon
                    className="tape-drop-compact"
                    points="0,56 -8,72 8,72"
                    fill="#B3261E"
                    style={reducedMotion ? { transform: 'translateX(408px)' } : undefined}
                  />
                ) : (
                  <>
                    <polygon
                      points="0,56 -8,72 8,72"
                      fill={markerColor}
                      style={{
                        transform: `translateX(${markerX}px)`,
                        transition: reducedMotion
                          ? 'none'
                          : isInitial
                          ? 'transform 1.8s cubic-bezier(.2,.8,.2,1) 0.2s, fill 0.3s ease'
                          : 'transform 0.5s cubic-bezier(.2,.8,.2,1), fill 0.3s ease'
                      }}
                    />

                    {showSecondMarker && (
                      <polygon
                        points="0,56 -8,72 8,72"
                        fill="#FFFFFF"
                        stroke="#1F7A4D"
                        strokeWidth="2.5"
                        style={{
                          transform: `translateX(${compareX}px)`,
                          transition: reducedMotion
                            ? 'none'
                            : isInitial
                            ? 'transform 2.2s cubic-bezier(.2,.8,.2,1) 0.4s'
                            : 'transform 0.5s cubic-bezier(.2,.8,.2,1)'
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </svg>
        ) : (
          <svg
            viewBox="-10 0 1020 74"
            aria-hidden="true"
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <g className="tape-ticks">
              {fullTicks}
            </g>
            <g className="tape-labels">
              {fullLabels}
            </g>

            {hasMarker && (
              <>
                {effectiveVariant === 'outOfRange' ? (
                  <polygon
                    className="tape-drop-full"
                    points="0,54 -10,70 10,70"
                    fill="#B3261E"
                    style={reducedMotion ? { transform: 'translateX(1020px)' } : undefined}
                  />
                ) : (
                  <>
                    <polygon
                      points="0,54 -10,70 10,70"
                      fill={markerColor}
                      style={{
                        transform: `translateX(${markerX}px)`,
                        transition: reducedMotion
                          ? 'none'
                          : isInitial
                          ? 'transform 1.8s cubic-bezier(.2,.8,.2,1) 0.2s, fill 0.3s ease'
                          : 'transform 0.5s cubic-bezier(.2,.8,.2,1), fill 0.3s ease'
                      }}
                    />

                    {showSecondMarker && (
                      <polygon
                        points="0,54 -10,70 10,70"
                        fill="#FFFFFF"
                        stroke="#1F7A4D"
                        strokeWidth="2.5"
                        style={{
                          transform: `translateX(${compareX}px)`,
                          transition: reducedMotion
                            ? 'none'
                            : isInitial
                            ? 'transform 2.2s cubic-bezier(.2,.8,.2,1) 0.4s'
                            : 'transform 0.5s cubic-bezier(.2,.8,.2,1)'
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </svg>
        )}

        {showCaption && finalCaption && (
          <p
            className="mono"
            aria-live={isAriaLive ? 'polite' : undefined}
            style={{
              margin: '12px 0 0',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: captionColor
            }}
          >
            {finalCaption}
          </p>
        )}
      </div>
    </div>
  );
}
