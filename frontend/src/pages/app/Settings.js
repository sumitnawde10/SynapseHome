// src/pages/app/Settings.js
import React, { useState, useEffect } from 'react';
import '../../assets/css/Settings.css'; // We'll create this file next

function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // State for individual form fields
    const [operatingMode, setOperatingMode] = useState('Cost Optimization');
    const [minBatteryReserve, setMinBatteryReserve] = useState(20);
    const [solarCapacity, setSolarCapacity] = useState(5.0); // Assuming you might want to adjust these later
    const [windCapacity, setWindCapacity] = useState(2.0);
    const [batteryCapacity, setBatteryCapacity] = useState(10.0);
    const [batteryCurrentCharge, setBatteryCurrentCharge] = useState(5.0); // Note: This will be dynamic, but good to display
    const [batteryMinReserveSystem, setBatteryMinReserveSystem] = useState(20); // Hard system min

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/settings');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSettings(data);
            setOperatingMode(data.operating_mode);
            setMinBatteryReserve(data.min_battery_reserve_user_percent);
            setSolarCapacity(data.solar_capacity_kw);
            setWindCapacity(data.wind_capacity_kw);
            setBatteryCapacity(data.battery_capacity_kwh);
            setBatteryCurrentCharge(data.battery_current_charge_kwh);
            setBatteryMinReserveSystem(data.battery_min_reserve_percent); // For display purposes
        } catch (e) {
            console.error("Error fetching settings:", e);
            setError("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setError(null);

        const updatedSettings = {
            operating_mode: operatingMode,
            min_battery_reserve_user_percent: parseInt(minBatteryReserve),
            solar_capacity_kw: parseFloat(solarCapacity),
            wind_capacity_kw: parseFloat(windCapacity),
            battery_capacity_kwh: parseFloat(batteryCapacity),
            battery_current_charge_kwh: parseFloat(batteryCurrentCharge),
            battery_min_reserve_percent: parseInt(batteryMinReserveSystem),
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedSettings),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            setMessage(result.message || "Settings updated successfully!");
            // Re-fetch settings to ensure UI is in sync with backend's saved state
            fetchSettings(); 

        } catch (e) {
            console.error("Error updating settings:", e);
            setError(e.message || "Failed to update settings.");
        }
    };

    if (loading) {
        return <div className="settings-page">Loading settings...</div>;
    }

    if (error && !settings) { // Only show error if initial fetch failed and no settings loaded
        return <div className="settings-page error-message">Error: {error}</div>;
    }

    return (
        <div className="settings-page">
            <h2>System Settings & Strategy</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label htmlFor="operatingMode">Operating Mode:</label>
                    <select
                        id="operatingMode"
                        value={operatingMode}
                        onChange={(e) => setOperatingMode(e.target.value)}
                    >
                        <option value="Cost Optimization">Cost Optimization</option>
                        <option value="Self-Sufficiency">Self-Sufficiency</option>
                        <option value="Environmental">Environmental</option>
                    </select>
                    <p className="field-description">
                        Determines the primary goal of your energy system.
                        (e.g., minimize electricity bill, maximize renewable usage).
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="minBatteryReserve">Min Battery Reserve (%):</label>
                    <input
                        type="number"
                        id="minBatteryReserve"
                        value={minBatteryReserve}
                        onChange={(e) => setMinBatteryReserve(e.target.value)}
                        min="0"
                        max="100"
                    />
                    <p className="field-description">
                        Keep this percentage of battery charge as a reserve, even when discharging.
                    </p>
                </div>

                {/* Other existing settings, allowing for future user modification */}
                <div className="form-group">
                    <label htmlFor="solarCapacity">Solar Capacity (kW):</label>
                    <input
                        type="number"
                        id="solarCapacity"
                        value={solarCapacity}
                        onChange={(e) => setSolarCapacity(e.target.value)}
                        step="0.1"
                        min="0"
                    />
                    <p className="field-description">
                        The maximum power output of your solar array.
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="windCapacity">Wind Capacity (kW):</label>
                    <input
                        type="number"
                        id="windCapacity"
                        value={windCapacity}
                        onChange={(e) => setWindCapacity(e.target.value)}
                        step="0.1"
                        min="0"
                    />
                    <p className="field-description">
                        The maximum power output of your wind turbine(s).
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="batteryCapacity">Battery Capacity (kWh):</label>
                    <input
                        type="number"
                        id="batteryCapacity"
                        value={batteryCapacity}
                        onChange={(e) => setBatteryCapacity(e.target.value)}
                        step="0.1"
                        min="0"
                    />
                    <p className="field-description">
                        The total energy storage capacity of your battery system.
                    </p>
                </div>
                {/* Display current charge, but don't allow direct editing here for realism */}
                <div className="form-group">
                    <label htmlFor="batteryCurrentCharge">Current Battery Charge (kWh):</label>
                    <input
                        type="number"
                        id="batteryCurrentCharge"
                        value={batteryCurrentCharge}
                        readOnly // Display only, not directly editable by user
                    />
                    <p className="field-description">
                        Current energy stored in the battery. (Updated by system)
                    </p>
                </div>
                <div className="form-group">
                    <label htmlFor="batteryMinReserveSystem">System Min Battery Reserve (%):</label>
                    <input
                        type="number"
                        id="batteryMinReserveSystem"
                        value={batteryMinReserveSystem}
                        readOnly // Display only, not directly editable by user
                    />
                    <p className="field-description">
                        System-level minimum charge for battery health/longevity.
                    </p>
                </div>


                <button type="submit" className="submit-button">Save Settings</button>
            </form>
        </div>
    );
}

export default Settings;