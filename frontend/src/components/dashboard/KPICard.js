// src/components/dashboard/KPICard.js
import React from 'react';

function KPICard({ title, value, unit }) {
  return (
    <div className="kpi-card">
      <h3>{title}</h3>
      <span className="value">{value}</span>
      <span className="unit">{unit}</span>
    </div>
  );
}

export default KPICard;