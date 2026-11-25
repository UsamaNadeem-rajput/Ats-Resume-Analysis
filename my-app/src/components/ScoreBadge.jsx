import React from 'react';

export default function ScoreBadge({
  score,
  showSymbol = true,
  showWord = true,
  label,
  children,
  className = '',
  style = {},
  ...props
}) {
  const num = Number(score || 0);

  let variantClass = 'g';
  let defaultSymbol = '✓';
  let defaultWord = 'Good';

  if (num >= 70) {
    variantClass = 'g';
    defaultSymbol = '✓';
    defaultWord = 'Good';
  } else if (num >= 40) {
    variantClass = 'o';
    defaultSymbol = '~';
    defaultWord = 'Fair';
  } else {
    variantClass = 'r';
    defaultSymbol = '✕';
    defaultWord = 'Weak';
  }

  const word = label || defaultWord;

  return (
    <span className={`sc ${variantClass} ${className}`} style={style} {...props}>
      {children ? (
        children
      ) : (
        <>
          {showSymbol && `${defaultSymbol} `}
          {score}
          {showWord && ` · ${word}`}
        </>
      )}
    </span>
  );
}
