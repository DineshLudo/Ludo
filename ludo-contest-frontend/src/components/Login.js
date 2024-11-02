import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import './Login.css';

function Login({ setCurrentUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${config.apiBaseUrl}/api/auth/login`, { username, password });
      
      if (response.data.token) {
        console.log('Login response:', response.data);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);

        // Fetch user data using the token
        const userResponse = await axios.get(`${config.apiBaseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${response.data.token}` }
        });

        const userData = userResponse.data;
        setCurrentUser({
          ...userData,
          isAdmin: userData.role === 'admin'
        });

        // Redirect based on user role
        if (userData.isAdmin) {
          navigate('/admin'); // Redirect to the admin panel
        } else {
          navigate('/'); // Redirect to the homepage
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return (
      <div className="auth-container">
        <Register />
        <p className="toggle-text">
          Already have an account? 
          <button className="toggle-button" onClick={() => setShowRegister(false)}>
            Login
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Login to Ludo Game</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="toggle-text">
          Don't have an account? 
          <button className="toggle-button" onClick={() => setShowRegister(true)}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
