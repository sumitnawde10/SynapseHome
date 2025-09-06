// src/pages/app/Settings.js
import React, { useState, useEffect } from 'react';
import '../../assets/css/Settings.css';

function Settings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/settings');
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Make sure to convert number inputs to actual numbers
    const parsedValue = e.target.type === 'number' ? parseFloat(value) : value;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: parsedValue,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      console.log("Save response:", result);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    }
  };
  
  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <form className="settings-form" onSubmit={handleSave}>
        
        <div className="form-section">
          <h3>My Energy Sources</h3>
          <div className="form-group">
            <label htmlFor="solarCapacity">Solar Panel Capacity (kW) - (Enter 0 if none)</label>
            <input type="number" id="solarCapacity" name="solarCapacity" value={settings.solarCapacity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="windCapacity">Wind Turbine Capacity (kW) - (Enter 0 if none)</label>
            <input type="number" id="windCapacity" name="windCapacity" value={settings.windCapacity} onChange={handleChange} />
          </div>
        </div>

        {/* THIS IS THE MISSING SECTION */}
        <div className="form-section">
          <h3>My Storage & EV</h3>
          <div className="form-group">
            <label htmlFor="batteryCapacity">Home Battery Capacity (kWh)</label>
            <input type="number" id="batteryCapacity" name="batteryCapacity" value={settings.batteryCapacity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="evChargerSpeed">EV Charger Speed (kW)</label>
            <input type="number" id="evChargerSpeed" name="evChargerSpeed" value={settings.evChargerSpeed} onChange={handleChange} />
          </div>
        </div>
        
        {/* THIS IS THE OTHER MISSING SECTION */}
        <div className="form-section">
            <h3>My Primary Goal</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="primaryGoal" value="minimizeBill" checked={settings.primaryGoal === 'minimizeBill'} onChange={handleChange} />
                <span className="custom-radio"></span>
                Minimize Electricity Bill
              </label>
              <label className="radio-label">
                <input type="radio" name="primaryGoal" value="maximizeSelfSufficiency" checked={settings.primaryGoal === 'maximizeSelfSufficiency'} onChange={handleChange} />
                <span className="custom-radio"></span>
                Maximize Self-Sufficiency
              </label>
            </div>
        </div>

        <div className="save-button-container">
          <button type="submit" className="save-button">Save Settings</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;