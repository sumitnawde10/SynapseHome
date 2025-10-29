// src/components/dashboard/KPICard.js
import React from 'react';

function KPICard({ title, value, formattedValue, unit }) {
  // Use formattedValue if provided, otherwise format the value
  const displayValue = formattedValue || value?.toFixed(2); // Safely format to 2 decimal places

  return (
    <div className="kpi-card">
      <h3>{title}</h3>
      <div className="value-unit-wrapper"> {/* NEW: Wrapper for value and unit */}
        <span className="value">{displayValue}</span>
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

export default KPICard;