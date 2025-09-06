// src/pages/app/Logs.js
import React, { useState, useEffect } from 'react';
import '../../assets/css/Logs.css'; 

function Logs() {
  const [logs, setLogs] = useState([]); // Default to an empty array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getTypeClassName = (type) => {
    if (type === 'DECISION') return 'type-decision';
    if (type === 'ACTION') return 'type-action';
    if (type === 'ALERT') return 'type-alert';
    return '';
  };

  if (loading) {
    return <div>Loading logs...</div>;
  }

  return (
    <div>
      <h2>System Logs</h2>
      <div className="logs-container">
        <div className="logs-header">
          <span className="header-ts">Timestamp</span>
          <span className="header-msg">Event Details</span>
          <span className="header-type">Type</span>
        </div>
        {logs.map((log, index) => (
          <div className="log-item" key={index}>
            <span className="timestamp">{log.timestamp}</span>
            <span className="message">{log.message}</span>
            <span className={`type ${getTypeClassName(log.type)}`}>{log.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Logs;