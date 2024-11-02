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
        <div className="card">
          <Register />
          <p className="toggle-text">
            Already have an account? 
            <button 
              className="toggle-button" 
              onClick={() => setShowRegister(false)}
              style={{ 
                background: 'none',
                border: 'none',
                color: '#3498db',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '14px',
                minHeight: 'auto',
                width: 'auto',
                fontWeight: 'normal',
                marginLeft: '5px'
              }}
            >
              Login
            </button>
          </p>
        </div>

        <style>{`
          .toggle-text {
            text-align: center;
            margin-top: 20px;
            color: #7f8c8d;
            font-size: 14px;
          }

          .toggle-button {
            background: none !important;
            border: none !important;
            color: #3498db !important;
            padding: 5px 10px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            min-height: auto !important;
            width: auto !important;
            font-weight: normal !important;
          }

          .toggle-button:hover {
            text-decoration: underline !important;
            background: none !important;
          }
        `}</style>
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
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
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

      <style>{`
        .auth-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }

        .card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            box-sizing: border-box;
        }

        h2 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 25px;
            font-size: 24px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
        }

        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px !important;
            line-height: 1.3;
            transition: border-color 0.3s;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background: #f8f9fa;
            box-sizing: border-box;
        }

        input:focus {
            outline: none;
            border-color: #3498db;
            background: white;
        }

        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s;
            min-height: 44px;
        }

        button:disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }

        button:hover:not(:disabled) {
            background: #2980b9;
        }

        .error {
            color: #e74c3c;
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
        }

        .toggle-text {
            text-align: center;
            margin-top: 20px;
            color: #7f8c8d;
            font-size: 14px;
        }

        .toggle-button {
            background: none !important;
            border: none;
            color: #3498db !important;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 14px;
            min-height: auto !important;
            width: auto !important;
            font-weight: normal !important;
        }

        .toggle-button:hover {
            text-decoration: underline;
            background: none !important;
        }

        /* Override any default button styles for toggle buttons */
        button.toggle-button {
            background: none !important;
            color: #3498db !important;
            min-height: auto !important;
            width: auto !important;
            padding: 5px 10px !important;
        }

        @media (max-width: 768px) {
            .card {
                width: calc(100vw - 40px);
                margin: 0 20px;
                padding: 20px;
                max-width: none;
            }

            input, button {
                width: 100%;
                box-sizing: border-box;
                font-size: 16px !important;
                -webkit-text-size-adjust: 100%;
                padding: 12px 15px;
            }

            input::placeholder {
                font-size: 16px;
            }

            /* Improve touch targets */
            button {
                min-height: 44px;
            }
        }
      `}</style>
    </div>
  );
}

export default Login;
