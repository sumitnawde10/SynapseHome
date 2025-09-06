// src/components/dashboard/HomeEnergyFlow.js
import React from 'react';

function HomeEnergyFlow({ data }) {
  // Determine which paths are active based on data
  const isSolarToHome = data.solarProduction > 0 && data.homeConsumption > 0;
  const isWindToHome = data.windProduction > 0 && data.homeConsumption > 0;
  const isGridToHome = data.gridStatus > 0;
  const isHomeToGrid = data.gridStatus < 0;
  const isBatteryToHome = data.batteryDischarging;
  const isHomeToBattery = !data.batteryDischarging && (data.solarProduction + data.windProduction > data.homeConsumption);

  return (
    <svg viewBox="0 0 400 280" className="flow-diagram-svg">
      {/* ICONS */}
      <g className="node" transform="translate(50, 40)">
        <circle className="node-bg solar" r="22" />
        <text y="8">☀️</text>
        <text y="40" className="node-label">Solar</text>
      </g>
      <g className="node" transform="translate(50, 120)">
        <circle className="node-bg wind" r="22" />
        <text y="8">🌬️</text>
        <text y="40" className="node-label">Wind</text>
      </g>
      <g className="node" transform="translate(350, 80)">
        <circle className="node-bg grid" r="22" />
        <text y="8">⚡️</text>
        <text y="40" className="node-label">Grid</text>
      </g>
       <g className="node" transform="translate(200, 220)">
        <circle className="node-bg battery" r="22" />
        <text y="8">🔋</text>
        <text y="40" className="node-label">Battery</text>
      </g>

      {/* UPDATED: House is now a proper icon */}
      <g className="node" transform="translate(200, 125)">
        <circle className="node-bg home" r="30" />
        <text y="10" style={{fontSize: "30px"}}>🏠</text>
        <text y="55" className="node-label">Home</text>
      </g>

      {/* ENERGY FLOW LINES */}
      <path d="M 75 40 L 180 40 L 180 100" className={`flow-line ${isSolarToHome ? 'active' : ''}`} />
      <path d="M 75 120 L 170 120 L 170 125" className={`flow-line ${isWindToHome ? 'active' : ''}`} />
      <path d="M 325 80 L 230 80 L 230 115" className={`flow-line ${isGridToHome ? 'active' : ''}`} />
      <path d="M 230 135 L 230 80 L 325 80" className={`flow-line ${isHomeToGrid ? 'active' : ''}`} />
      <path d="M 200 160 L 200 195" className={`flow-line ${isHomeToBattery ? 'active' : ''}`} />
      <path d="M 200 195 L 200 160" className={`flow-line ${isBatteryToHome ? 'active' : ''}`} />
    </svg>
  );
}

export default HomeEnergyFlow;