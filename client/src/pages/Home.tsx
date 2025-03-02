import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Generate Delicious Recipes</h1>
        <p>Enter your ingredients and let AI create personalized recipes for you</p>
        {!localStorage.getItem('token') ? (
          <div className="cta-buttons">
            <Link to="/signin" className="cta-button signin">Sign In</Link>
            <Link to="/signup" className="cta-button signup">Sign Up</Link>
          </div>
        ) : (
          <Link to="/dashboard" className="cta-button dashboard">Go to Dashboard</Link>
        )}
      </div>
    </div>
  );
};

export default Home; 