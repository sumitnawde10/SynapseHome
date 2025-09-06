// src/pages/LandingPage.js

import React from 'react';
// NEW: Imports for navigation and Firebase authentication
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import '../assets/css/LandingPage.css';

// --- Sub-components for each section ---

const Header = () => (
  <header className="header">
    <div className="logo">Synapse Home</div>
    <nav className="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#how-it-works">How It Works</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
);

// UPDATED: This component now includes the login logic
const Hero = () => {
  const navigate = useNavigate();

  // This function handles the entire Google login process
  const handleGoogleLogin = async () => {
    try {
      // Triggers the Google Sign-In pop-up window
      await signInWithPopup(auth, googleProvider);
      // On successful login, navigate the user to the main application
      navigate('/app');
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Failed to log in. Please try again.");
    }
  };

  return (
    <section className="hero section" id="home">
      <h1>Empowering the Future of Energy with AI</h1>
      <p>Optimizing power distribution, reducing waste, and enhancing grid stability through artificial intelligence.</p>
      {/* The button now calls our login function and the text is updated */}
      <button className="cta-button" onClick={handleGoogleLogin}>
        Login with Google
      </button>
    </section>
  );
};

const About = () => (
  <section className="section" id="about">
    <h2>About The Project</h2>
    <p className="section-subtitle">
      Synapse Home is a smart energy management system designed for the modern, sustainable household. Managing home-generated renewable energy can be complex. Our application simplifies this by using a powerful AI engine to automate the entire process, ensuring you get the most out of your solar panels and home battery, effortlessly. The goal is to lower your electricity bills, maximize your use of clean energy, and provide peace of mind.
    </p>
  </section>
);

const HowItWorks = () => (
  <section className="section" id="how-it-works">
    <h2>How It Works</h2>
    <div className="how-it-works-grid">
      <div className="step-card">
        <h3>1. Forecast</h3>
        <p>The AI core continuously analyzes historical data to accurately forecast your rooftop solar panel production and your family's likely energy consumption for the next 24 hours.</p>
      </div>
      <div className="step-card">
        <h3>2. Decide</h3>
        <p>Based on the forecast, your primary goal (e.g., save money), and real-time utility rates, the Synapse brain makes the smartest decision: use solar power now, store it in the battery, or charge your EV.</p>
      </div>
      <div className="step-card">
        <h3>3. Act</h3>
        <p>The system automatically executes the decision, intelligently directing the flow of energy throughout your home. You can monitor every action in real-time from your dashboard.</p>
      </div>
    </div>
  </section>
);

const Contact = () => (
  <section className="section" id="contact">
    <h2>Get In Touch</h2>
    <p className="section-subtitle">Have questions about the project or want to collaborate? Feel free to reach out.</p>
    <div className="contact-details">
      <p><strong>Email:</strong> <a href="mailto:sumitnawde2004@gmail.com">synapsehome@gmail.com</a></p>
      <p><strong>Service Phone:</strong> +91-7977297789 </p>
    </div>
  </section>
);

const Footer = () => (
    <footer className="footer">
      <p>&copy; 2025 Synapse Home. All Rights Reserved.</p>
    </footer>
);

// --- Main Landing Page Component ---
// This component remains unchanged
function LandingPage() {
  return (
    <div>
      <Header />
      <Hero />
      <About />
      <HowItWorks />
      <Contact />
      <Footer />
    </div>
  );
}

export default LandingPage;