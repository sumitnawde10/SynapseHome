// src/pages/app/AppLayout.js
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

import Dashboard from './Dashboard';
import Analytics from './Analytics';
import Logs from './Logs';
import Settings from './Settings';

import '../../assets/css/AppLayout.css';

// CHANGE 1: The component now accepts the 'user' prop from App.js
function AppLayout({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-nav-container">
          <h2>Synapse Home</h2>

          {/* CHANGE 2: Added the welcome message to display the user's name */}
          <div className="welcome-message">
            Welcome, {user ? user.displayName : 'Guest'}!
          </div>

          <div className="sidebar-nav">
            <NavLink to="/app/dashboard">Dashboard</NavLink>
            <NavLink to="/app/analytics">Analytics</NavLink>
            <NavLink to="/app/logs">Logs</NavLink>
            <NavLink to="/app/settings">Settings</NavLink>
          </div>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>
      
      <main className="content-area">
        <Routes>
          <Route path="/" element={<Dashboard />} /> 
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppLayout;