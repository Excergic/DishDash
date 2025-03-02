import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Sending signup request:', { email, username });
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });
      
      const data = await response.json();
      console.log('Signup response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      navigate('/dashboard');
      window.location.reload(); // To update navbar state
    } catch (err) {
      console.error('Signup error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default SignUp; 