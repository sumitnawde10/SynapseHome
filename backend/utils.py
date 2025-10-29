import json
import os

# Cache for TOU pricing to avoid reading file on every request
_tou_prices_cache = None

def load_tou_prices():
    global _tou_prices_cache
    if _tou_prices_cache is None:
        script_dir = os.path.dirname(__file__) # Get current directory of utils.py
        file_path = os.path.join(script_dir, 'data', 'tou_pricing.json')
        try:
            with open(file_path, 'r') as f:
                _tou_prices_cache = json.load(f)
        except FileNotFoundError:
            print(f"Error: tou_pricing.json not found at {file_path}")
            _tou_prices_cache = {"buying_prices": [], "selling_prices": []} # Return empty to prevent crashes
    return _tou_prices_cache

def get_current_tou_prices(hour):
    """
    Returns the buying and selling price for a given hour based on TOU schedule.
    Args:
        hour (int): The current hour (0-23).
    Returns:
        dict: {'buying_price_per_kwh': float, 'selling_price_per_kwh': float}
    """
    tou_data = load_tou_prices()

    buying_price = 0.0
    for tier in tou_data.get('buying_prices', []):
        if tier['start_hour'] <= hour < tier['end_hour']:
            buying_price = tier['rate_per_kwh']
            break

    selling_price = 0.0
    for tier in tou_data.get('selling_prices', []):
        if tier['start_hour'] <= hour < tier['end_hour']:
            selling_price = tier['rate_per_kwh']
            break

    return {
        'buying_price_per_kwh': buying_price,
        'selling_price_per_kwh': selling_price
    }

# Example of how to use it (can be removed later or placed in a test)
if __name__ == "__main__":
    print(f"Price at 1 AM: {get_current_tou_prices(1)}")
    print(f"Price at 7 AM: {get_current_tou_prices(7)}")
    print(f"Price at 15 PM: {get_current_tou_prices(15)}")
    print(f"Price at 23 PM: {get_current_tou_prices(23)}")