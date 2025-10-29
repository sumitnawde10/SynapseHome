# backend/decision_engine.py

def make_decision(
    current_solar_production, # kW
    current_wind_production,  # kW
    current_demand,           # kW
    current_battery_charge,   # kWh
    battery_capacity,         # kWh (Max capacity)
    battery_min_reserve,      # Percentage (0-100) - This is now the user-defined minimum
    buying_price_per_kwh,     # $/kWh
    selling_price_per_kwh,    # $/kWh
    operating_mode            # "Cost Optimization", "Self-Sufficiency", "Environmental"
):
    """
    Determines optimal energy flow based on current conditions and user-defined operating mode.
    
    Returns a dictionary of recommended power flows and an action message.
    """
    
    # Calculate absolute battery reserve from percentage
    min_battery_reserve_kwh = (battery_min_reserve / 100) * battery_capacity

    # Initialize all power flows to zero
    power_to_home = 0
    power_to_battery = 0
    power_from_battery = 0
    power_from_grid = 0
    power_to_grid = 0
    recommended_action = "NO_ACTION"

    # Total available generation from renewables
    total_generation = current_solar_production + current_wind_production
    
    # --- Decision Logic based on Operating Mode ---
    
    if operating_mode == "Self-Sufficiency":
        # Prioritize using own generation, minimize grid interaction
        
        remaining_demand = current_demand

        # 1. Use own generation for home demand
        if total_generation >= remaining_demand:
            power_to_home = remaining_demand
            surplus_after_home = total_generation - remaining_demand
            remaining_demand = 0 # Home demand met
            recommended_action = "USE_OWN_GENERATION"

            # 2. Charge battery with surplus, respecting user reserve and max capacity
            if surplus_after_home > 0 and current_battery_charge < battery_capacity:
                charge_amount = min(surplus_after_home, battery_capacity - current_battery_charge)
                power_to_battery = charge_amount
                surplus_after_home -= charge_amount
                recommended_action = "CHARGE_BATTERY" if charge_amount > 0 else recommended_action

            # 3. If battery is full and there's still surplus, export to grid (as a last resort for self-sufficiency)
            if surplus_after_home > 0:
                power_to_grid = surplus_after_home
                recommended_action = "EXPORT_SURPLUS" if recommended_action == "NO_ACTION" else recommended_action

        else: # total_generation < remaining_demand (deficit)
            power_to_home = total_generation # Use all available generation for home
            remaining_demand -= total_generation
            recommended_action = "USE_OWN_GENERATION"

            # 2. Discharge battery for remaining demand, respecting user reserve
            if remaining_demand > 0 and current_battery_charge > min_battery_reserve_kwh:
                discharge_amount = min(remaining_demand, current_battery_charge - min_battery_reserve_kwh)
                power_from_battery = discharge_amount
                remaining_demand -= discharge_amount
                recommended_action = "DISCHARGE_BATTERY" if recommended_action == "NO_ACTION" else recommended_action

            # 3. Import from grid for critical remaining demand (as a last resort for self-sufficiency)
            if remaining_demand > 0:
                power_from_grid = remaining_demand
                recommended_action = "IMPORT_FROM_GRID" if recommended_action == "NO_ACTION" else recommended_action
                
    elif operating_mode == "Cost Optimization":
        # Prioritize minimizing grid import/export costs based on TOU prices
        
        # Scenario 1: Generation exceeds demand
        if total_generation >= current_demand:
            power_to_home = current_demand # Always meet home demand first
            surplus_after_home = total_generation - current_demand

            # Consider what to do with surplus: charge battery or export to grid
            if current_battery_charge < battery_capacity: # Battery has space
                if selling_price_per_kwh > buying_price_per_kwh and selling_price_per_kwh > 0.20: # High selling price
                    # Maybe export if price is very good, even if battery has space
                    power_to_grid = surplus_after_home
                    recommended_action = "EXPORT_TO_GRID"
                elif buying_price_per_kwh < 0.15: # Grid price is low, good time to store if it makes sense
                    charge_amount = min(surplus_after_home, battery_capacity - current_battery_charge)
                    power_to_battery = charge_amount
                    surplus_after_home -= charge_amount
                    recommended_action = "CHARGE_BATTERY_LOW_GRID_PRICE" if charge_amount > 0 else recommended_action
                else: # Neutral prices, maybe still charge battery if there's surplus
                     charge_amount = min(surplus_after_home, battery_capacity - current_battery_charge)
                     power_to_battery = charge_amount
                     surplus_after_home -= charge_amount
                     recommended_action = "CHARGE_BATTERY" if charge_amount > 0 else recommended_action
            
            # If battery is full or we chose not to charge, export remaining surplus
            if surplus_after_home > 0:
                power_to_grid = surplus_after_home
                recommended_action = "EXPORT_TO_GRID" if recommended_action == "NO_ACTION" else recommended_action

        # Scenario 2: Demand exceeds generation (deficit)
        else:
            deficit = current_demand - total_generation
            power_to_home = total_generation # Use all own generation

            # Consider discharging battery or importing from grid
            if current_battery_charge > min_battery_reserve_kwh: # Battery has available charge
                if buying_price_per_kwh > selling_price_per_kwh and buying_price_per_kwh > 0.25: # High buying price, discharge battery
                    discharge_amount = min(deficit, current_battery_charge - min_battery_reserve_kwh)
                    power_from_battery = discharge_amount
                    deficit -= discharge_amount
                    recommended_action = "DISCHARGE_BATTERY_HIGH_GRID_PRICE" if discharge_amount > 0 else recommended_action
                else: # Neutral or low buying prices, maybe still discharge battery
                    discharge_amount = min(deficit, current_battery_charge - min_battery_reserve_kwh)
                    power_from_battery = discharge_amount
                    deficit -= discharge_amount
                    recommended_action = "DISCHARGE_BATTERY" if discharge_amount > 0 else recommended_action
            
            # Import from grid for any remaining deficit
            if deficit > 0:
                power_from_grid = deficit
                recommended_action = "IMPORT_FROM_GRID" if recommended_action == "NO_ACTION" else recommended_action

    elif operating_mode == "Environmental":
        # Prioritize using and storing renewable energy, minimize grid import
        
        remaining_demand = current_demand

        # 1. Use own generation for home demand
        if total_generation >= remaining_demand:
            power_to_home = remaining_demand
            surplus_after_home = total_generation - remaining_demand
            remaining_demand = 0 # Home demand met
            recommended_action = "USE_OWN_GENERATION_RENEWABLE"

            # 2. Charge battery with surplus (prioritize storing renewable energy)
            if surplus_after_home > 0 and current_battery_charge < battery_capacity:
                charge_amount = min(surplus_after_home, battery_capacity - current_battery_charge)
                power_to_battery = charge_amount
                surplus_after_home -= charge_amount
                recommended_action = "CHARGE_BATTERY_RENEWABLE_PRIORITY" if charge_amount > 0 else recommended_action
            
            # 3. Export remaining surplus (it's renewable, so good for grid)
            if surplus_after_home > 0:
                power_to_grid = surplus_after_home
                recommended_action = "EXPORT_RENEWABLE_SURPLUS" if recommended_action == "NO_ACTION" else recommended_action

        else: # total_generation < remaining_demand (deficit)
            power_to_home = total_generation
            remaining_demand -= total_generation
            recommended_action = "USE_OWN_GENERATION_RENEWABLE"

            # 2. Discharge battery for remaining demand (prefer stored renewables)
            if remaining_demand > 0 and current_battery_charge > min_battery_reserve_kwh:
                discharge_amount = min(remaining_demand, current_battery_charge - min_battery_reserve_kwh)
                power_from_battery = discharge_amount
                remaining_demand -= discharge_amount
                recommended_action = "DISCHARGE_BATTERY_RENEWABLE" if discharge_amount > 0 else recommended_action

            # 3. If still a deficit, import from grid (unavoidable, but last resort for environmental)
            if remaining_demand > 0:
                power_from_grid = remaining_demand
                recommended_action = "IMPORT_FROM_GRID_LAST_RESORT" if recommended_action == "NO_ACTION" else recommended_action
    
    else: # Default or unknown mode - fall back to a safe default
        # Simple default: Meet demand from own gen, then battery, then grid. Export surplus.
        remaining_demand = current_demand
        
        # Use own generation
        if total_generation >= remaining_demand:
            power_to_home = remaining_demand
            surplus = total_generation - remaining_demand
            
            if current_battery_charge < battery_capacity:
                charge_amount = min(surplus, battery_capacity - current_battery_charge)
                power_to_battery = charge_amount
                surplus -= charge_amount
            power_to_grid = surplus # Export remaining
            recommended_action = "DEFAULT_SURPLUS_HANDLING"
        else: # Deficit
            power_to_home = total_generation
            deficit = remaining_demand - total_generation
            
            if current_battery_charge > min_battery_reserve_kwh:
                discharge_amount = min(deficit, current_battery_charge - min_battery_reserve_kwh)
                power_from_battery = discharge_amount
                deficit -= discharge_amount
            power_from_grid = deficit # Import remaining
            recommended_action = "DEFAULT_DEFICIT_HANDLING"


    # Round all output values for cleaner display
    power_to_home = max(0, round(power_to_home, 2))
    power_to_battery = max(0, round(power_to_battery, 2))
    power_from_battery = max(0, round(power_from_battery, 2))
    power_from_grid = max(0, round(power_from_grid, 2))
    power_to_grid = max(0, round(power_to_grid, 2))

    return {
        "power_to_home": power_to_home,
        "power_to_battery": power_to_battery,
        "power_from_battery": power_from_battery,
        "power_from_grid": power_from_grid,
        "power_to_grid": power_to_grid,
        "recommended_action": recommended_action,
        "current_operating_mode": operating_mode, # For debugging/info
        "actual_min_reserve_kwh": round(min_battery_reserve_kwh, 2) # For debugging/info
    }