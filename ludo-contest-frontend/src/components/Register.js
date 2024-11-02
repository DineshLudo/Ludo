import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

function Register({ onLoginClick }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.apiBaseUrl}/api/auth/register`, { username, email, password });
      setSuccess('Registration successful! Please log in.');
      setError('');
      // Optionally, you can automatically switch to the login view after successful registration
      // if (onLoginClick) setTimeout(onLoginClick, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
      setSuccess('');
    }
  };

  return (
    <>
      <h2>Register for Ludo Game</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
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
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="new-password"
        />
        <button type="submit">Register</button>
      </form>

      <style>{`
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
          width: 100%;
        }

        button:hover {
          background: #2980b9;
        }

        .error {
          color: #e74c3c;
          text-align: center;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .success {
          color: #2ecc71;
          text-align: center;
          margin-bottom: 15px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
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

          button {
            min-height: 44px;
          }
        }
      `}</style>
    </>
  );
}

export default Register;
