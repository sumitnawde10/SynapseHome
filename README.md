# Synapse Home: Intelligent Energy Management System

## Table of Contents
1.  [Introduction](#1-introduction)
2.  [Features](#2-features)
    * [Version 1: Machine Learning Core](#version-1-machine-learning-core)
    * [Version 2: Decision Engine & Smart Management](#version-2-decision-engine--smart-management)
3.  [Architecture](#3-architecture)
4.  [Setup & Installation](#4-setup--installation)
    * [Prerequisites](#prerequisites)
    * [1. Database Setup](#1-database-setup)
    * [2. Backend Setup](#2-backend-setup)
    * [3. Frontend Setup](#3-frontend-setup)
5.  [Usage](#5-usage)
    * [Dashboard](#dashboard)
    * [Analytics](#analytics)
    * [Settings](#settings)
6.  [Future Enhancements](#6-future-enhancements)
7.  [Contact](#7-contact)

---

## 1. Introduction

Synapse Home is an intelligent energy management system designed for smart homes. It leverages machine learning to forecast solar, wind, and home energy demand, and uses a sophisticated decision engine to optimize energy flow based on real-time data, time-of-use (TOU) pricing, and user-defined strategies. The goal is to maximize self-sufficiency, minimize energy costs, and provide users with comprehensive insights into their energy consumption and production.

## 2. Features

### Version 1: Machine Learning Core
* **Data Ingestion & Preprocessing:** Handles real-world household electric power consumption data.
* **Machine Learning Models:**
    * **Solar Power Prediction:** Forecasts solar energy generation.
    * **Wind Power Prediction:** Forecasts wind energy generation.
    * **Home Energy Demand Prediction:** Forecasts household electricity consumption.
* **Model Training & Evaluation:** Establishes a robust foundation for accurate energy forecasting.

### Version 2: Decision Engine & Smart Management
* **Live Data Simulation:** Simulates real-time energy production, consumption, and battery levels.
* **Time-of-Use (TOU) Pricing:** Integrates dynamic electricity buying and selling prices into decision-making.
* **Core Decision Engine:**
    * Analyzes forecasts, TOU prices, battery status, and user settings.
    * Recommends optimal actions (charge/discharge battery, import/export from grid) for each hour.
* **User-Definable Strategies:** Allows users to select operating modes:
    * **Cost Optimization:** Prioritizes minimizing electricity bills.
    * **Self-Sufficiency:** Prioritizes maximizing reliance on self-generated power.
* **Interactive Dashboard:**
    * Displays real-time KPIs (Total Production, Consumption, Grid Dependence, Self-Sufficiency).
    * Visualizes live energy flow between solar, wind, battery, home, and grid.
* **24-Hour Simulation & Analytics:**
    * Runs the decision engine over a 24-hour period using predicted data.
    * Presents comprehensive charts for:
        * Predicted Production & Demand
        * Simulated Battery Level
        * Simulated Grid Interaction (Import/Export)
        * Simulated Hourly Net Cost
    * Provides a summary of the simulation's outcome (total import/export, net cost, final battery charge).
* **User Settings Page:** Interface to configure battery capacity, minimum reserve, and operating mode.

## 3. Architecture

Synapse Home follows a client-server architecture:

* **Frontend (React.js):** Provides an interactive web interface for the Dashboard, Analytics, and Settings pages.
* **Backend (Flask Python):**
    * Serves API endpoints for real-time data (`/api/status`), simulation (`/api/simulate`), and user settings (`/api/settings`).
    * Hosts the trained Machine Learning models for predictions.
    * Contains the core Decision Engine logic.
* **Machine Learning (Scikit-learn/TensorFlow/Keras):** Pre-trained models are loaded by the Flask backend for energy forecasting.
* **Database (CSV/Flat file):** Historical energy consumption data.

## 4. Setup & Installation

To run Synapse Home locally, follow these steps:

### Prerequisites
* **Python 3.8+:** For the backend and ML models.
* **Node.js & npm (or yarn):** For the React frontend.
* **Git:** For cloning the repository.

### 1. Database Setup

The project uses the "Individual household electric power consumption" dataset. This dataset is **not** included in the repository due to its size and is excluded by `.gitignore`. You need to download it manually.

1.  **Download the dataset:**
    Go to: [https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption](https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption)
    Download the file named `household_power_consumption.zip`.

2.  **Extract the data:**
    Unzip `household_power_consumption.zip`. You should find a file named `household_power_consumption.txt` inside.

3.  **Place the file:**
    Create a directory named `data` inside your `backend` folder:
    `synapse-home/backend/data/`
    Place `household_power_consumption.txt` into this `data` folder.
    The full path should look like: `synapse-home/backend/data/household_power_consumption.txt`

### 2. Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd synapse-home
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

3.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    ```

4.  **Activate the virtual environment:**
    * **On Windows:**
        ```bash
        .\venv\Scripts\activate
        ```
    * **On macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```

5.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Ensure `requirements.txt` includes `flask`, `pandas`, `scikit-learn`, `tensorflow`, `keras`, etc.)*

6.  **Run the ML model training script (if not already done during Version 1):**
    The backend needs pre-trained models. This script will train and save them.
    ```bash
    python train_models.py
    ```
    *(If you don't have a `train_models.py` or similar, the backend might train them on first run or expect them to exist.)*

7.  **Start the Flask backend server:**
    ```bash
    flask run
    ```
    The backend should now be running on `http://127.0.0.1:5000`.

### 3. Frontend Setup

1.  **Open a new terminal window.**
2.  **Navigate back to the project root and then into the frontend directory:**
    ```bash
    cd ../ # (if you were in the backend folder)
    cd src # (or wherever your package.json for React is, typically the root if it's a monorepo or 'frontend' folder if structured that way)
    ```
    *Self-correction: Based on your previous code snippets, your React app's `package.json` is likely in the project root (`synapse-home/`), not in a separate `src` or `frontend` folder. So, from the project root after `git clone`, you would stay there for npm commands.*
    ```bash
    cd synapse-home # Ensure you are in the project root
    ```

3.  **Install frontend dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```

4.  **Start the React development server:**
    ```bash
    npm start
    # OR
    yarn start
    ```
    The frontend should open in your browser, typically at `http://localhost:3000`.

## 5. Usage

Once both the backend and frontend servers are running:

### Dashboard
* The primary view for real-time energy data.
* Displays live KPIs: Total Production, Total Consumption, Grid Dependence, Self-Sufficiency.
* Shows a visual representation of current energy flow (Solar, Wind, Battery, Home, Grid) with real-time values.
* Indicates the current decision made by the intelligent engine.

### Analytics
* Provides a 24-hour simulation based on predicted data and your selected operating mode.
* View charts for:
    * Predicted Production & Demand over 24 hours.
    * Simulated Battery Level changes.
    * Grid Import/Export trends.
    * Hourly Net Cost/Earnings.
* Offers a summary of the simulation's total outcomes.

### Settings
* Configure the smart home system.
* **Operating Mode:** Choose between "Cost Optimization" or "Self-Sufficiency".
* **Battery Capacity:** Set the total storage capacity of your battery (in kWh).
* **Minimum Battery Reserve:** Define the percentage of battery capacity to always keep in reserve (e.g., for emergencies).

## 6. Future Enhancements

* **Historical Data View:** Store and display long-term trends for KPIs, production, and consumption.
* **Prediction Accuracy Metrics:** Integrate metrics to evaluate ML model performance over time.
* **User Notifications:** Alert users about significant events (e.g., high export, low battery).
* **Advanced Scheduling:** Allow users to schedule specific operating modes or define custom rules.
* **Device Control Integration:** Connect to smart home devices for direct energy management.
* **Cloud Deployment:** Deploy the application to a cloud platform for remote access.
* **Improved Energy Flow Animation:** More sophisticated visual effects for energy movement.

## 7. Contact

For any questions or suggestions, please contact https://github.com/sumitnawde10.
