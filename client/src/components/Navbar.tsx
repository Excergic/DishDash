import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Recipe Generator
        </Link>
        
        <div className="navbar-menu">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="navbar-item">Dashboard</Link>
              <Link to="/recipes" className="navbar-item">My Recipes</Link>
              <button onClick={handleLogout} className="navbar-button logout-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="navbar-button signin-button">
                Sign In
              </Link>
              <Link to="/signup" className="navbar-button signup-button">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;