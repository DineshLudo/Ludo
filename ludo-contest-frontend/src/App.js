import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import GameSection from './components/GameSection';
import Wallet from './components/Wallet';
import AdminPanel from './components/AdminPanel';
import CurrentChallenge from './components/CurrentChallenge';
import GameHistory from './components/GameHistory';
import Header from './components/Header';
import config from './config';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleSetCurrentUser = (userData) => {
    setCurrentUser(userData);
    setIsAdmin(userData?.role === 'admin');
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        handleSetCurrentUser(response.data);
        
        // Navigate after authentication
        if (response.data.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        handleSetCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove navigate from dependencies

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {currentUser && <Header currentUser={currentUser} />}
      
      <main className="main-content">
        <Routes>
          <Route 
            path="/login" 
            element={
              currentUser ? (
                <Navigate to={isAdmin ? "/admin" : "/"} replace />
              ) : (
                <Login setCurrentUser={handleSetCurrentUser} />
              )
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : !isAdmin ? (
                <Navigate to="/" replace />
              ) : (
                <AdminPanel />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <GameSection 
                  currentUser={currentUser} 
                  setCurrentUser={handleSetCurrentUser} 
                  rooms={rooms} 
                  setRooms={setRooms} 
                />
              )
            } 
          />
          <Route 
            path="/wallet" 
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : (
                <Wallet 
                  currentUser={currentUser} 
                  setCurrentUser={handleSetCurrentUser} 
                />
              )
            } 
          />
          <Route 
            path="/challenge/:challengeId" 
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : (
                <CurrentChallenge />
              )
            } 
          />
          <Route 
            path="/game-history" 
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : (
                <GameHistory currentUser={currentUser} />
              )
            } 
          />
        </Routes>
      </main>

      <style>{`
        .App {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .main-content {
          padding-top: ${currentUser ? '20px' : '0'};
        }
      `}</style>
    </div>
  );
}

export default App;
