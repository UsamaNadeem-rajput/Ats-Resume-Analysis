import React, { useId } from 'react';

export default function Tooltip({
  content,
  text,
  label = 'About this item',
  id,
  children,
  className = '',
  style = {}
}) {
  const generatedId = useId();
  const tooltipId = id || generatedId;
  const tooltipText = text || content;

  return (
    <span className={`tipw ${className}`} style={style}>
      {children || (
        <button
          type="button"
          className="tip"
          aria-label={label}
          aria-describedby={tooltipId}
        />
      )}
      <span id={tooltipId} role="tooltip" className="tipbox">
        {tooltipText}
      </span>
    </span>
  );
}
