// src/components/dashboard/HomeEnergyFlow.js
import React from 'react';
// import '../../assets/css/HomeEnergyFlow.css'; // REMOVE OR COMMENT OUT THIS LINE

function HomeEnergyFlow({ data }) {
  // ... rest of your component code ...
  // (The rest of the code I provided previously is correct, just remove the import)

  // Example: Your existing content would go here
  if (!data || !data.live_data || !data.decision_engine_output) {
    return (
      <svg viewBox="0 0 400 280" className="flow-diagram-svg">
        <text x="200" y="140" textAnchor="middle" fill="#a0a0a0" fontSize="1.2rem">
          Loading energy flow...
        </text>
      </svg>
    );
  }

  // Extract relevant values
  const solarProduction = data.live_data.solar;
  const windProduction = data.live_data.wind;
  const homeDemand = data.live_data.home_demand;
  const batteryLevel = data.live_data.battery_level;

  const powerToHome = data.decision_engine_output.power_to_home;
  const powerToBattery = data.decision_engine_output.power_to_battery;
  const powerFromBattery = data.decision_engine_output.power_from_battery;
  const powerFromGrid = data.decision_engine_output.power_from_grid;
  const powerToGrid = data.decision_engine_output.power_to_grid;

  const flowThreshold = 0.1; 

  const isPowerToHomeActive = powerToHome > flowThreshold;
  const isPowerToBatteryActive = powerToBattery > flowThreshold;
  const isPowerFromBatteryActive = powerFromBattery > flowThreshold;
  const isPowerFromGridActive = powerFromGrid > flowThreshold;
  const isPowerToGridActive = powerToGrid > flowThreshold;

  // For solar/wind, activate if there's production AND the overall flow to home is active
  // (This is a simplified way to visualize, more detailed logic could be added later in V2.3)
  const isSolarActive = solarProduction > flowThreshold;
  const isWindActive = windProduction > flowThreshold;


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

      <g className="node" transform="translate(200, 125)">
        <circle className="node-bg home" r="30" />
        <text y="10" style={{fontSize: "30px"}}>🏠</text>
        <text y="55" className="node-label">Home</text>
      </g>

      {/* ENERGY FLOW LINES - UPDATED LOGIC */}
      {/* Solar connection (active if solar is producing) */}
      <path d="M 75 40 L 180 40 L 180 100" className={`flow-line ${isSolarActive ? 'active' : ''}`} />
      
      {/* Wind connection (active if wind is producing) */}
      <path d="M 75 120 L 170 120 L 170 125" className={`flow-line ${isWindActive ? 'active' : ''}`} />
      
      {/* Grid to Home (Import) */}
      <path d="M 325 80 L 230 80 L 230 115" className={`flow-line ${isPowerFromGridActive ? 'active' : ''}`} />
      
      {/* Home to Grid (Export) */}
      <path d="M 230 135 L 230 80 L 325 80" className={`flow-line ${isPowerToGridActive ? 'active' : ''}`} />
      
      {/* Home (or surplus) to Battery (Charging) */}
      <path d="M 200 160 L 200 195" className={`flow-line ${isPowerToBatteryActive ? 'active' : ''}`} />
      
      {/* Battery to Home (Discharging) */}
      <path d="M 200 195 L 200 160" className={`flow-line ${isPowerFromBatteryActive ? 'active' : ''}`} />
    </svg>
  );
}

export default HomeEnergyFlow;