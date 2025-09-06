// src/pages/app/Analytics.js
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import '../../assets/css/Analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// THIS IS THE UPDATED SECTION with more professional styling
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom', 
      labels: { color: '#e0e0e0', font: { size: 14 } } 
    },
    tooltip: {
      backgroundColor: '#121212',
      titleColor: '#ffffff',
      bodyColor: '#e0e0e0',
      padding: 10,
      borderColor: '#333',
      borderWidth: 1,
    }
  },
  scales: {
    y: { 
      ticks: { color: '#a0a0a0' }, 
      grid: { color: 'rgba(255, 255, 255, 0.1)' } // Lighter grid lines
    }, 
    x: { 
      ticks: { color: '#a0a0a0' }, 
      grid: { color: 'rgba(255, 255, 255, 0.1)' } // Lighter grid lines
    }
  },
  elements: {
      point: {
          radius: 0 // Hides the dots on the line for a cleaner look
      }
  }
};

function Analytics() {
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/forecasts');
        const data = await response.json();
        setForecastData(data);
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      }
    };
    fetchForecasts();
  }, []);

  if (!forecastData) {
    return <div>Loading forecast data...</div>;
  }

  const productionChartData = {
    labels: forecastData.labels,
    datasets: [{
      label: 'Solar Production Forecast (kW)',
      data: forecastData.solar_forecast,
      borderColor: '#f9d71c',
      fill: true,
      backgroundColor: 'rgba(249, 215, 28, 0.2)', 
      tension: 0.4,
    }],
  };

  const demandChartData = {
    labels: forecastData.labels,
    datasets: [{
      label: 'Household Demand Forecast (kW)',
      data: forecastData.demand_forecast,
      borderColor: '#ff6f61',
      fill: true,
      backgroundColor: 'rgba(255, 111, 97, 0.2)', 
      tension: 0.4
    }],
  };

  const windChartData = {
    labels: forecastData.labels,
    datasets: [{
      label: 'Wind Production Forecast (kW)',
      data: forecastData.wind_forecast,
      borderColor: '#add8e6',
      fill: true,
      backgroundColor: 'rgba(173, 216, 230, 0.2)', 
      tension: 0.4,
    }],
  };

  return (
    <div>
      <h2>Analytics & Forecasts</h2>
      <div className="analytics-grid">
        <div className="chart-container">
          <Line options={chartOptions} data={productionChartData} height={300} />
        </div>
        <div className="chart-container">
          <Line options={chartOptions} data={windChartData} height={300} />
        </div>
        <div className="chart-container">
          <Line options={chartOptions} data={demandChartData} height={300} />
        </div>
      </div>
    </div>
  );
}

export default Analytics;