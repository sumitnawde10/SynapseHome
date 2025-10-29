// src/pages/app/Analytics.js
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import '../../assets/css/Analytics.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function Analytics() {
    const [simulationData, setSimulationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSimulationData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/simulate');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setSimulationData(data);
            } catch (e) {
                console.error("Error fetching simulation data:", e);
                setError("Failed to load simulation data. Please ensure the backend is running and models are loaded.");
            } finally {
                setLoading(false);
            }
        };

        fetchSimulationData();
        // You might want to refresh this periodically or upon settings change
        // const interval = setInterval(fetchSimulationData, 60000); // e.g., refresh every minute
        // return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="analytics-page">Loading simulation data...</div>;
    }

    if (error) {
        return <div className="analytics-page error-message">{error}</div>;
    }

    if (!simulationData || !simulationData.hourly_results) {
        return <div className="analytics-page">No simulation data available.</div>;
    }

    const labels = simulationData.hourly_results.map(h => `${h.hour}:00`);
    
    // --- Chart Data Preparation ---

    const productionDemandChartData = {
        labels,
        datasets: [
            {
                label: 'Predicted Solar (kWh)',
                data: simulationData.hourly_results.map(h => h.predicted_solar_kwh),
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Predicted Wind (kWh)',
                data: simulationData.hourly_results.map(h => h.predicted_wind_kwh),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Predicted Demand (kWh)',
                data: simulationData.hourly_results.map(h => h.predicted_demand_kwh),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
                tension: 0.4,
                borderDash: [5, 5] // Dashed line for demand
            }
        ]
    };

    const batteryChartData = {
        labels,
        datasets: [
            {
                label: 'Simulated Battery Charge (kWh)',
                data: simulationData.hourly_results.map(h => h.simulated_battery_charge_kwh_end_of_hour),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const gridInteractionChartData = {
        labels,
        datasets: [
            {
                label: 'Grid Import (kWh)',
                data: simulationData.hourly_results.map(h => h.decision.power_from_grid),
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Grid Export (kWh)',
                data: simulationData.hourly_results.map(h => h.decision.power_to_grid),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const costChartData = {
        labels,
        datasets: [
            {
                label: 'Hourly Net Cost ($)',
                data: simulationData.hourly_results.map(h => h.hourly_net_cost),
                borderColor: 'rgba(201, 203, 207, 1)',
                backgroundColor: 'rgba(201, 203, 207, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // This is key for controlling height with CSS
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#e0e0e0', // Legend text color
                }
            },
            title: {
                display: true,
                text: '24-Hour Simulation',
                color: '#f9d71c', // Title text color
                font: {
                    size: 18
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Hour of Day',
                    color: '#e0e0e0'
                },
                ticks: {
                    color: '#a0a0a0', // X-axis tick labels color
                    // --- NEW: X-axis label handling ---
                    autoSkip: true,    // Automatically skip labels to prevent overlap
                    maxRotation: 0,    // Do not rotate labels
                    minRotation: 0,    // Ensure no rotation
                    // --- END NEW ---
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)' // X-axis grid lines
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Energy (kWh) / Cost ($)',
                    color: '#e0e0e0'
                },
                ticks: {
                    color: '#a0a0a0', // Y-axis tick labels color
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)' // Y-axis grid lines
                }
            }
        }
    };

    return (
        <div className="analytics-page">
            <h2>Energy Simulation & Analytics</h2>

            <div className="simulation-summary">
                <h3>Simulation Summary ({simulationData.hourly_results[0].decision.current_operating_mode} Mode)</h3>
                <p><strong>Total Grid Import:</strong> {simulationData.summary.total_grid_import_kwh} kWh</p>
                <p><strong>Total Grid Export:</strong> {simulationData.summary.total_grid_export_kwh} kWh</p>
                <p><strong>Net Grid Cost:</strong> ${simulationData.summary.net_grid_cost.toFixed(2)}</p>
                <p><strong>Final Battery Charge:</strong> {simulationData.summary.final_battery_charge_kwh} kWh</p>
            </div>

            <div className="analytics-grid"> {/* NEW: Wrap charts in this grid container */}
                <div className="chart-container">
                    <h3>Predicted Production & Demand</h3>
                    <Line options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Predicted Production & Demand (24h)' }}}} data={productionDemandChartData} />
                </div>

                <div className="chart-container">
                    <h3>Simulated Battery Level</h3>
                    <Line options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Simulated Battery Level (24h)' }}}} data={batteryChartData} />
                </div>

                <div className="chart-container">
                    <h3>Simulated Grid Interaction</h3>
                    <Line options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Simulated Grid Import/Export (24h)' }}}} data={gridInteractionChartData} />
                </div>

                <div className="chart-container">
                    <h3>Simulated Hourly Net Cost</h3>
                    <Line options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Simulated Hourly Net Cost (24h)' }}}} data={costChartData} />
                </div>
            </div> {/* END NEW: Wrap charts in this grid container */}
        </div>
    );
}

export default Analytics;