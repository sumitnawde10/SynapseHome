// src/pages/app/Dashboard.js
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import KPICard from '../../components/dashboard/KPICard';
import HomeEnergyFlow from '../../components/dashboard/HomeEnergyFlow';
import '../../assets/css/Dashboard.css';

function Dashboard() {
  // 1. Create a state variable to hold our live data
  const [liveData, setLiveData] = useState(null);

// Inside src/pages/app/Dashboard.js

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ADD THIS LINE
        console.log('Fetching new data at:', new Date().toLocaleTimeString());

        const response = await fetch('http://127.0.0.1:5000/api/status');
        const data = await response.json();
        setLiveData(data);
      } catch (error) {
        console.error("Error fetching live data:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); 
    return () => clearInterval(intervalId);
  }, []);

  // 3. Display a loading message until the data arrives
  if (!liveData) {
    return <div>Loading live data...</div>;
  }

  // 4. Use the live data in our components
  return (
    <div>
      <h2>Dashboard</h2>
      
      <div className="dashboard-grid">
        <KPICard title="Solar Production" value={liveData.solarProduction} unit="kW" />
        <KPICard title="Wind Production" value={liveData.windProduction} unit="kW" />
        <KPICard title="Home Consumption" value={liveData.homeConsumption} unit="kW" />
        <KPICard title="Battery Level" value={liveData.batteryLevel} unit="%" />
        <KPICard title="Grid Status" value={liveData.gridStatus > 0 ? `Import: ${liveData.gridStatus}` : `Export: ${-liveData.gridStatus}`} unit="kW" />
      </div>

      <div className="home-flow-container">
        <h3>Live Energy Flow</h3>
        <HomeEnergyFlow data={liveData} />
      </div>
    </div>
  );
}

export default Dashboard;