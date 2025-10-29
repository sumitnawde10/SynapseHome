# backend/app.py

import os
import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np 

# --- NEW IMPORTS FOR VERSION 2 & 3 ---
from utils import get_current_tou_prices
from decision_engine import make_decision 
# --- END NEW IMPORTS ---

app = Flask(__name__)
CORS(app)

# Load AI models
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

try:
    solar_model = joblib.load(os.path.join(MODEL_DIR, 'solar_production_model.joblib'))
    wind_model = joblib.load(os.path.join(MODEL_DIR, 'wind_production_model.joblib'))
    demand_model = joblib.load(os.path.join(MODEL_DIR, 'household_demand_model.joblib'))
    print("Models loaded successfully!")
except FileNotFoundError as e:
    print(f"Error loading models: {e}")
    solar_model = None
    wind_model = None
    demand_model = None


def get_settings():
    settings_filepath = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
    
    default_settings_structure = {
        "solar_capacity_kw": 5.0,
        "wind_capacity_kw": 2.0,
        "battery_capacity_kwh": 10.0,
        "battery_current_charge_kwh": 5.0, 
        "battery_min_reserve_percent": 20, # Hard minimum for battery discharge
        "allow_grid_charge": True, 
        "operating_mode": "Cost Optimization", 
        "min_battery_reserve_user_percent": 20 
    }

    current_settings = {}
    try:
        with open(settings_filepath, 'r') as f:
            file_settings = json.load(f)
            for key, default_value in default_settings_structure.items():
                current_settings[key] = file_settings.get(key, default_value)
            
    except (FileNotFoundError, json.JSONDecodeError):
        print("Settings file not found or corrupted. Creating with default values.")
        current_settings = default_settings_structure 
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        with open(settings_filepath, 'w') as f:
            json.dump(current_settings, f, indent=4)
            
    return current_settings


# Prediction helper function (no changes)
def create_features_for_time(dt_object):
    data = {'hour': [dt_object.hour], 'dayofweek': [dt_object.weekday()], 'month': [dt_object.month], 'year': [dt_object.year]}
    return pd.DataFrame(data)

def make_predictions_for_time(dt_object):
    if not all([solar_model, wind_model, demand_model]): 
        return 0.0, 0.0, 0.0
    
    features = create_features_for_time(dt_object)
    hour = features['hour'].iloc[0]
    
    solar_pred = solar_model.predict(features)[0]
    wind_pred = wind_model.predict(features)[0]
    demand_pred = demand_model.predict(features)[0]
    
    if hour < 6 or hour > 19:
        solar_pred = 0.0
            
    return max(0.0, solar_pred), max(0.0, wind_pred), max(0.0, demand_pred)


# backend/app.py (Relevant section, make sure to replace only this part)

@app.route("/api/status")
def get_status():
    settings = get_settings()
    
    solar_pred, wind_pred, demand_pred = make_predictions_for_time(datetime.now())
    
    solar_kwh = solar_pred * settings.get('solar_capacity_kw', 5.0)
    wind_kwh = wind_pred * settings.get('wind_capacity_kw', 2.0)
    demand_kwh = demand_pred 

    current_hour = datetime.now().hour
    tou_prices = get_current_tou_prices(current_hour)

    decision_output = make_decision(
        current_solar_production=solar_kwh,
        current_wind_production=wind_kwh,
        current_demand=demand_kwh,
        current_battery_charge=settings.get('battery_current_charge_kwh', 5.0), 
        battery_capacity=settings.get('battery_capacity_kwh', 10.0), 
        battery_min_reserve=settings.get('min_battery_reserve_user_percent', 20), 
        buying_price_per_kwh=tou_prices['buying_price_per_kwh'],
        selling_price_per_kwh=tou_prices['selling_price_per_kwh'],
        operating_mode=settings.get('operating_mode', 'Cost Optimization') 
    )
    
    # --- NEW: Calculate Instantaneous Grid Dependence and Self-Sufficiency ---
    total_production_instant = solar_kwh + wind_kwh
    total_consumption_instant = demand_kwh # This is home demand

    grid_dependence_percent = 0.0
    self_sufficiency_percent = 0.0
    
    if total_consumption_instant > 0:
        # Grid Dependence: What % of current demand is met by the grid?
        # If power_from_grid is 0, dependence is 0.
        grid_dependence_percent = (decision_output['power_from_grid'] / total_consumption_instant) * 100
        grid_dependence_percent = min(100.0, max(0.0, grid_dependence_percent)) # Clamp between 0-100

        # Self-Sufficiency: What % of current demand is met by own sources (solar/wind/battery)?
        # Power to home comes from own_production (solar+wind) + battery_discharge.
        # It's what's *not* from the grid.
        power_from_own_sources_to_home = decision_output['power_to_home'] - decision_output['power_from_grid']
        self_sufficiency_percent = (power_from_own_sources_to_home / total_consumption_instant) * 100
        self_sufficiency_percent = min(100.0, max(0.0, self_sufficiency_percent)) # Clamp between 0-100
    # --- END NEW ---

    status_data = {
        "timestamp": datetime.now().isoformat(),
        "live_data": {
            "solar": round(solar_kwh, 2),
            "wind": round(wind_kwh, 2),
            "grid": 0.0, 
            "home_demand": round(demand_kwh, 2),
            "battery_level": round(settings.get('battery_current_charge_kwh', 5.0), 2)
        },
        "kpi": {
            "total_production": round(total_production_instant, 2), # Use calculated values
            "total_consumption": round(total_consumption_instant, 2), # Use calculated values
            "grid_dependence": round(grid_dependence_percent, 2), # Now calculated
            "self_sufficiency": round(self_sufficiency_percent, 2) # Now calculated
        },
        "tou_prices": tou_prices, 
        "decision_engine_output": decision_output,
        "user_settings": settings 
    }
    return jsonify(status_data)

# ... (rest of app.py) ...

@app.route("/api/forecasts")
def get_forecasts():
    # This route will eventually be replaced or enhanced by /api/simulate for richer forecasts
    forecast_data = {
        "timestamp": datetime.now().isoformat(),
        "hourly_forecasts": []
    }
    
    settings = get_settings()
    current_time = datetime.now()

    for i in range(24):
        forecast_hour_dt = current_time + timedelta(hours=i)
        
        forecast_solar_pred, forecast_wind_pred, forecast_demand_pred = \
            make_predictions_for_time(forecast_hour_dt)
        
        forecast_solar_kwh = forecast_solar_pred * settings.get('solar_capacity_kw', 5.0)
        forecast_wind_kwh = forecast_wind_pred * settings.get('wind_capacity_kw', 2.0)
        
        forecast_data["hourly_forecasts"].append({
            "hour": forecast_hour_dt.hour,
            "timestamp": forecast_hour_dt.isoformat(),
            "solar_kwh": round(max(0.0, forecast_solar_kwh), 2),
            "wind_kwh": round(max(0.0, forecast_wind_kwh), 2),
            "demand_kwh": round(max(0.0, forecast_demand_pred), 2),
        })
    
    return jsonify(forecast_data)

@app.route("/api/logs")
def get_logs():
    mock_logs = [
        {"timestamp": "2025-08-29 16:15:10", "type": "DECISION", "message": "Surplus solar detected. Prioritizing battery charging."},
        {"timestamp": "2025-08-29 15:30:05", "type": "ACTION", "message": "EV charging complete."},
        {"timestamp": "2025-08-29 14:05:45", "type": "ALERT", "message": "High consumption detected from AC unit."},
        {"timestamp": "2025-08-29 13:00:00", "type": "ACTION", "message": "Started charging EV from 100% solar power."}
    ]
    return jsonify(mock_logs)

@app.route("/api/settings", methods=['GET', 'POST'])
def handle_settings():
    settings_filepath = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
    
    if request.method == 'GET':
        settings = get_settings() 
        return jsonify(settings)

    elif request.method == 'POST':
        new_settings_payload = request.json
        settings = get_settings() 

        valid_settings = {
            "solar_capacity_kw": {'type': float, 'min': 0.0},
            "wind_capacity_kw": {'type': float, 'min': 0.0},
            "battery_capacity_kwh": {'type': float, 'min': 0.0},
            "battery_current_charge_kwh": {'type': float, 'min': 0.0}, # This would typically not be user-editable
            "battery_min_reserve_percent": {'type': int, 'min': 0, 'max': 100},
            "allow_grid_charge": {'type': bool},
            "operating_mode": {'type': str, 'options': ["Cost Optimization", "Self-Sufficiency", "Environmental"]},
            "min_battery_reserve_user_percent": {'type': int, 'min': 0, 'max': 100}
        }
        
        updated = False
        for key, value in new_settings_payload.items():
            if key in valid_settings:
                try:
                    expected_type = valid_settings[key]['type']
                    converted_value = expected_type(value)

                    if 'options' in valid_settings[key] and converted_value not in valid_settings[key]['options']:
                        return jsonify({"error": f"Invalid option for {key}: {value}"}), 400
                    if 'min' in valid_settings[key] and converted_value < valid_settings[key]['min']:
                        return jsonify({"error": f"{key} must be at least {valid_settings[key]['min']}"}), 400
                    if 'max' in valid_settings[key] and converted_value > valid_settings[key]['max']:
                        return jsonify({"error": f"{key} must be at most {valid_settings[key]['max']}"}), 400
                    
                    settings[key] = converted_value
                    updated = True
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid type or format for {key}: expected {valid_settings[key]['type'].__name__}"}), 400
            else:
                print(f"Warning: Attempted to update unknown setting key: {key}") 

        if updated:
            try:
                with open(settings_filepath, 'w') as f:
                    json.dump(settings, f, indent=4)
                return jsonify({"message": "Settings updated successfully", "new_settings": settings}), 200
            except IOError as e:
                return jsonify({"error": f"Could not write settings: {e}"}), 500
        else:
            return jsonify({"message": "No valid settings provided for update", "current_settings": settings}), 400

# --- NEW: Simulation Endpoint ---
@app.route("/api/simulate")
def get_simulation():
    settings = get_settings()
    
    sim_data = {
        "timestamp_start": datetime.now().isoformat(),
        "simulation_duration_hours": 24,
        "hourly_results": [],
        "summary": {
            "total_grid_import_kwh": 0.0,
            "total_grid_export_kwh": 0.0,
            "net_grid_cost": 0.0,
            "final_battery_charge_kwh": 0.0
        }
    }

    current_battery_charge_kwh = settings.get('battery_current_charge_kwh', 5.0)
    battery_capacity_kwh = settings.get('battery_capacity_kwh', 10.0)
    solar_capacity_kw = settings.get('solar_capacity_kw', 5.0)
    wind_capacity_kw = settings.get('wind_capacity_kw', 2.0)
    operating_mode = settings.get('operating_mode', 'Cost Optimization')
    min_battery_reserve_user_percent = settings.get('min_battery_reserve_user_percent', 20)
    
    total_grid_import_kwh = 0.0
    total_grid_export_kwh = 0.0
    net_grid_cost = 0.0

    current_time = datetime.now()
    for i in range(24): # Simulate for the next 24 hours
        forecast_hour_dt = current_time + timedelta(hours=i)
        
        # 1. Get predictions for this hour
        forecast_solar_pred, forecast_wind_pred, forecast_demand_pred = \
            make_predictions_for_time(forecast_hour_dt)
        
        forecast_solar_kwh = forecast_solar_pred * solar_capacity_kw
        forecast_wind_kwh = forecast_wind_pred * wind_capacity_kw
        forecast_demand_kwh = forecast_demand_pred # Model should output kWh for the hour

        # 2. Get TOU prices for this hour
        tou_prices = get_current_tou_prices(forecast_hour_dt.hour)

        # 3. Run the decision engine for this hour
        decision_output = make_decision(
            current_solar_production=forecast_solar_kwh,
            current_wind_production=forecast_wind_kwh,
            current_demand=forecast_demand_kwh,
            current_battery_charge=current_battery_charge_kwh, # Use the dynamic charge level
            battery_capacity=battery_capacity_kwh,
            battery_min_reserve=min_battery_reserve_user_percent,
            buying_price_per_kwh=tou_prices['buying_price_per_kwh'],
            selling_price_per_kwh=tou_prices['selling_price_per_kwh'],
            operating_mode=operating_mode
        )

        # 4. Update battery charge for the next hour's simulation
        # Net change = power_to_battery - power_from_battery
        # Assuming 1-hour time steps, kWh directly represents change
        current_battery_charge_kwh += decision_output['power_to_battery'] 
        current_battery_charge_kwh -= decision_output['power_from_battery']
        
        # Ensure battery charge stays within physical limits
        current_battery_charge_kwh = max(0, min(current_battery_charge_kwh, battery_capacity_kwh))
        
        # 5. Calculate costs/benefits for this hour
        hourly_cost = (decision_output['power_from_grid'] * tou_prices['buying_price_per_kwh']) - \
                      (decision_output['power_to_grid'] * tou_prices['selling_price_per_kwh'])
        
        total_grid_import_kwh += decision_output['power_from_grid']
        total_grid_export_kwh += decision_output['power_to_grid']
        net_grid_cost += hourly_cost

        # 6. Store hourly results
        hourly_result = {
            "hour": forecast_hour_dt.hour,
            "timestamp": forecast_hour_dt.isoformat(),
            "predicted_solar_kwh": round(forecast_solar_kwh, 2),
            "predicted_wind_kwh": round(forecast_wind_kwh, 2),
            "predicted_demand_kwh": round(forecast_demand_kwh, 2),
            "tou_prices": tou_prices,
            "decision": decision_output,
            "simulated_battery_charge_kwh_end_of_hour": round(current_battery_charge_kwh, 2),
            "hourly_net_cost": round(hourly_cost, 2)
        }
        sim_data["hourly_results"].append(hourly_result)
    
    # Update summary
    sim_data["summary"]["total_grid_import_kwh"] = round(total_grid_import_kwh, 2)
    sim_data["summary"]["total_grid_export_kwh"] = round(total_grid_export_kwh, 2)
    sim_data["summary"]["net_grid_cost"] = round(net_grid_cost, 2)
    sim_data["summary"]["final_battery_charge_kwh"] = round(current_battery_charge_kwh, 2)

    return jsonify(sim_data)


if __name__ == '__main__':
    if solar_model is None or wind_model is None or demand_model is None:
        print("Warning: One or more models failed to load. Predictions will return zeros.")

    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    get_settings() 

    app.run(debug=True, port=5000)