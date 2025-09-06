# backend/app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime, timedelta
import json
import numpy as np # Make sure to import numpy

# --- 1. INITIALIZATION ---
app = Flask(__name__)
CORS(app)

# --- 2. LOAD MODELS ---
try:
    solar_model = joblib.load('models/solar_production_model.joblib')
    wind_model = joblib.load('models/wind_production_model.joblib')
    demand_model = joblib.load('models/household_demand_model.joblib')
    print("Models loaded successfully!")
except FileNotFoundError as e:
    print(f"Error loading models: {e}")
    solar_model = wind_model = demand_model = None

# --- 3. PREDICTION & DECISION LOGIC ---

def create_features_for_now():
    now = datetime.now()
    data = {'hour': [now.hour],'dayofweek': [now.weekday()],'month': [now.month],'year': [now.year]}
    return pd.DataFrame(data)

# UPDATED: make_predictions now includes the solar-at-night fix
def make_predictions():
    if not all([solar_model, wind_model, demand_model]): return 0, 0, 0
    features = create_features_for_now()
    
    solar_pred = solar_model.predict(features)[0]
    wind_pred = wind_model.predict(features)[0]
    demand_pred = demand_model.predict(features)[0]
    
    # Apply the night rule even for the single prediction
    now = datetime.now()
    if not (6 <= now.hour <= 19): # If it's between 7 PM and 6 AM
        solar_pred = 0
        
    return max(0, solar_pred), max(0, wind_pred), max(0, demand_pred)

# UPDATED: This function now contains the logic for realistic data
def generate_24h_forecasts():
    now = datetime.now()
    future_hours = [now + timedelta(hours=i) for i in range(24)]
    
    future_features = pd.DataFrame({
        'hour': [dt.hour for dt in future_hours],
        'dayofweek': [dt.weekday() for dt in future_hours],
        'month': [dt.month for dt in future_hours],
        'year': [dt.year for dt in future_hours]
    })

    labels = [dt.strftime('%I %p').lstrip('0') for dt in future_hours]

    # Make initial predictions
    solar_forecast = solar_model.predict(future_features)
    wind_forecast = wind_model.predict(future_features)
    demand_forecast = demand_model.predict(future_features)
    
    # --- FIXES AND REALISM LOGIC ---
    # 1. Fix Solar at Night: Apply our common-sense rule
    for i, dt in enumerate(future_hours):
        if not (6 <= dt.hour <= 19):
            solar_forecast[i] = 0
            
    # 2. Add Realistic Variation to Wind
    wind_variation = np.sin(np.linspace(0, 2 * np.pi, 24)) * np.mean(wind_forecast) * 0.5
    wind_forecast += wind_variation

    # Ensure no predictions are negative
    solar_forecast = [max(0, p) for p in solar_forecast]
    wind_forecast = [max(0, p) for p in wind_forecast]
    demand_forecast = [max(0, p) for p in demand_forecast]
    
    return {
        "labels": labels,
        "solar_forecast": solar_forecast,
        "wind_forecast": wind_forecast,
        "demand_forecast": demand_forecast
    }

def decision_engine(predictions, settings):
    solar, wind, demand = predictions
    total_production = solar + wind
    net_power = total_production - demand
    battery_discharging = False
    if net_power < 0: pass
    else: pass
    battery_level = 65
    return {"solarProduction": round(solar, 2),"windProduction": round(wind, 2),"homeConsumption": round(demand, 2),"batteryLevel": battery_level,"gridStatus": round(net_power, 2),"batteryDischarging": battery_discharging}

# --- 4. API ENDPOINTS ---

# THIS IS THE UPDATED FUNCTION
@app.route("/api/test")
def test_route():
    # Get the current time on the server
    server_time_utc = datetime.utcnow()
    # Also get the local time on the server (might be the same as UTC)
    server_time_local = datetime.now()
    
    return jsonify({
        "message": "Hello from Synapse Home Backend!",
        "server_time_local": server_time_local.strftime("%Y-%m-%d %H:%M:%S"),
        "server_time_utc": server_time_utc.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route("/api/status")
def get_status():
    mock_settings = { "primaryGoal": "minimizeBill" }
    predictions = make_predictions()
    status = decision_engine(predictions, mock_settings)
    return jsonify(status)

@app.route("/api/forecasts")
def get_forecasts():
    forecast_data = generate_24h_forecasts()
    return jsonify(forecast_data)

@app.route("/api/logs")
def get_logs():
    mock_logs = [{"timestamp": "2025-08-29 16:15:10", "type": "DECISION", "message": "Surplus solar detected. Prioritizing battery charging."},{"timestamp": "2025-08-29 15:30:05", "type": "ACTION", "message": "EV charging complete."},{"timestamp": "2025-08-29 14:05:45", "type": "ALERT", "message": "High consumption detected from AC unit."},{"timestamp": "2025-08-29 13:00:00", "type": "ACTION", "message": "Started charging EV from 100% solar power."}]
    return jsonify(mock_logs)

@app.route("/api/settings", methods=['GET', 'POST'])
def handle_settings():
    settings_filepath = 'data/settings.json'
    
    if request.method == 'GET':
        try:
            with open(settings_filepath, 'r') as f:
                settings = json.load(f)
            return jsonify(settings)
        except FileNotFoundError:
            return jsonify({"error": "Settings file not found."}), 404

    elif request.method == 'POST':
        new_settings = request.json
        with open(settings_filepath, 'w') as f:
            json.dump(new_settings, f, indent=2)
        return jsonify({"message": "Settings saved successfully!"})