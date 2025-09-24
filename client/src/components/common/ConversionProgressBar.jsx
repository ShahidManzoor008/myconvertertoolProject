import React from 'react';
import './ConversionProgressBar.css';

const ConversionProgressBar = ({ message = 'Processing...', progress }) => {
  const barWidth = progress !== undefined ? Math.max(progress, 5) : 100; // Ensure minimum 5% or 100% for indeterminate
  const isIndeterminate = progress === undefined;

  return (
    <div className="conversion-progress-bar-container">
      <div className={`conversion-progress-bar ${isIndeterminate ? 'indeterminate' : ''}`} style={{ width: `${barWidth}%` }}></div>
      <p className="conversion-progress-message">{message}</p>
    </div>
  );
};

export default ConversionProgressBar;
