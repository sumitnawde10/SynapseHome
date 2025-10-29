// src/pages/app/Dashboard.js

import React, { useState, useEffect } from 'react';
import '../../assets/css/Dashboard.css';


function Dashboard() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/status');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // --- NEW: Calculate Grid Dependence and Self-Sufficiency here ---
                if (data && data.live_data && data.kpi) {
                    const total_production = data.live_data.solar + data.live_data.wind;
                    const total_demand = data.live_data.home_demand;
                    
                    let current_grid_dependence = "N/A";
                    let current_self_sufficiency = "N/A";

                    if (total_demand > 0) {
                        // Calculate how much demand is met by own production or battery,
                        // and how much by grid. This is a simplified instantaneous view.
                        // Removed: met_by_own, net_to_grid, energy_for_home

                        // If grid import > 0, we have dependence
                        if (data.decision_engine_output.power_from_grid > 0) {
                            current_grid_dependence = (data.decision_engine_output.power_from_grid / total_demand) * 100;
                        } else {
                            current_grid_dependence = 0; // No import, so 0 dependence
                        }
                        
                        // Self-sufficiency: how much of demand is met by own production (solar + wind + battery discharge)
                        const own_source_to_home = (total_production - (data.decision_engine_output.power_to_battery || 0) - (data.decision_engine_output.power_to_grid || 0)) // own gen that didn't go to batt or grid
                                                         + (data.decision_engine_output.power_from_battery || 0); // plus battery discharge
                        
                        // If home demand is met by own sources (and not from grid)
                        if (data.decision_engine_output.power_from_grid === 0) { // If not buying from grid
                            current_self_sufficiency = (own_source_to_home / total_demand) * 100;
                            if (current_self_sufficiency > 100) current_self_sufficiency = 100; // Cap at 100%
                        } else {
                            current_self_sufficiency = ((total_demand - data.decision_engine_output.power_from_grid) / total_demand) * 100;
                            if (current_self_sufficiency < 0) current_self_sufficiency = 0; // Floor at 0%
                        }
                    } else {
                        current_self_sufficiency = 100; // No demand, so 100% self-sufficient
                    }

                    // Update the KPI values in the status object
                    data.kpi.grid_dependence = current_grid_dependence;
                    data.kpi.self_sufficiency = current_self_sufficiency;
                }
                // --- END NEW KPI CALCULATION ---

                setStatus(data); // Set status *after* modifying kpi values
                setLoading(false);
            } catch (e) {
                console.error("Error fetching status:", e);
                setError("Failed to load dashboard data. Please ensure the backend is running.");
                setLoading(false);
            }
        };

        fetchStatus();
        const intervalId = setInterval(fetchStatus, 5000); // Fetch every 5 seconds
        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    // ... (rest of your Dashboard.js file from `if (loading)` down, remains unchanged) ...


    if (loading) {
        return <div className="dashboard-page">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="dashboard-page error-message">{error}</div>;
    }

    const { live_data, kpi, tou_prices, decision_engine_output, user_settings } = status;

    // Helper to format values
    const formatValue = (value, unit = '') => {
        if (value === "N/A" || value === null || value === undefined) {
            return "N/A";
        }
        return `${value.toFixed(2)} ${unit}`;
    };

    return (
        <div className="dashboard-page">
            <h2>Live Energy Dashboard</h2>

            <div className="kpi-cards-grid"> {/* NEW: KPI Grid Container */}
                <div className="kpi-card production">
                    <h3>Total Production</h3>
                    <p>{formatValue(kpi.total_production, 'kW')}</p>
                </div>
                <div className="kpi-card consumption">
                    <h3>Total Consumption</h3>
                    <p>{formatValue(kpi.total_consumption, 'kW')}</p>
                </div>
                <div className="kpi-card grid-dependence">
                    <h3>Grid Dependence</h3>
                    <p>{kpi.grid_dependence === "N/A" ? "N/A" : `${kpi.grid_dependence.toFixed(2)}%`}</p>
                </div>
                <div className="kpi-card self-sufficiency">
                    <h3>Self-Sufficiency</h3>
                    <p>{kpi.self_sufficiency === "N/A" ? "N/A" : `${kpi.self_sufficiency.toFixed(2)}%`}</p>
                </div>
            </div> {/* END NEW: KPI Grid Container */}

            {/* Existing Live Energy Flow section */}
            <div className="live-energy-flow">
                <h3>Live Energy Flow</h3>
                <p>Operating Mode: <strong>{user_settings.operating_mode}</strong></p>
                <p>Battery Reserve: <strong>{user_settings.min_battery_reserve_user_percent}%</strong></p>
                
                <div className="energy-diagram">
                    {/* Source: Solar */}
                    <div className="energy-source">
                        Solar<br/>{formatValue(live_data.solar, 'kW')}
                    </div>

                    {/* Source: Wind */}
                    <div className="energy-source">
                        Wind<br/>{formatValue(live_data.wind, 'kW')}
                    </div>

                    {/* Storage: Battery */}
                    <div className="energy-storage">
                        Battery<br/>{formatValue(live_data.battery_level, 'kWh')}
                    </div>

                    {/* Target: Home */}
                    <div className="energy-home">
                        Home Demand<br/>{formatValue(live_data.home_demand, 'kW')}
                    </div>

                    {/* Grid Info */}
                    <div className="energy-target">
                        Grid<br/>
                        Buy: ${tou_prices.buying_price_per_kwh.toFixed(2)}/kWh<br/>
                        Sell: ${tou_prices.selling_price_per_kwh.toFixed(2)}/kWh
                    </div>

                    {/*
                    // Placeholder arrows - these will be dynamically rendered and animated in Step 4.4
                    // Example of how arrows might look statically:
                    <div className="energy-arrow arrow-solar-to-home active">
                        <span className="arrow-text">5.0kW</span> →
                    </div>
                    */}

                </div>
                {/* Decision from engine */}
                <p className="decision-text">
                    <strong>Current Decision:</strong> {decision_engine_output.recommended_action} 
                    <br/>
                    {decision_engine_output.power_to_battery > 0 && `(Charge Battery: ${formatValue(decision_engine_output.power_to_battery, 'kW')}) `}
                    {decision_engine_output.power_from_battery > 0 && `(Discharge Battery: ${formatValue(decision_engine_output.power_from_battery, 'kW')}) `}
                    {decision_engine_output.power_to_grid > 0 && `(Export to Grid: ${formatValue(decision_engine_output.power_to_grid, 'kW')}) `}
                    {decision_engine_output.power_from_grid > 0 && `(Import from Grid: ${formatValue(decision_engine_output.power_from_grid, 'kW')}) `}
                </p>
            </div>
        </div>
    );
}

export default Dashboard;