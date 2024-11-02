import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

function GameSection({ currentUser, setCurrentUser }) {
  const [entryFee, setEntryFee] = useState('');
  const [openChallenges, setOpenChallenges] = useState([]);
  const [ongoingChallenges, setOngoingChallenges] = useState([]);
  const [runningChallenges, setRunningChallenges] = useState([]);
  const navigate = useNavigate();

  const fetchChallenges = async () => {
    try {
      const openResponse = await axios.get(`${config.apiBaseUrl}/api/rooms/open`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOpenChallenges(openResponse.data);

      const ongoingResponse = await axios.get(`${config.apiBaseUrl}/api/rooms/ongoing`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOngoingChallenges(ongoingResponse.data);

      const runningResponse = await axios.get(`${config.apiBaseUrl}/api/rooms/running`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRunningChallenges(runningResponse.data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    }
  };

  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 5000); // Auto-update every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [currentUser]);

  const updateUserBalance = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Fetched user data:', response.data); // Log the fetched data
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to update user balance:', error);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (currentUser.balance >= parseFloat(entryFee)) {
      try {
        await axios.post(`${config.apiBaseUrl}/api/rooms/create`, {
          entryFee: parseFloat(entryFee)
        }, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Room created successfully!');
        fetchChallenges(); // Immediately fetch challenges after creating a room
        updateUserBalance(); // Update user balance
      } catch (error) {
        console.error('Failed to create room:', error);
        alert(error.response?.data?.message || 'Failed to create room');
      }
    } else {
      alert('Insufficient balance');
    }
  };

  const joinRoom = async (roomId) => {
    try {
      await axios.post(`${config.apiBaseUrl}/api/rooms/join/${roomId}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Joined room successfully!');
      fetchChallenges(); // Optionally fetch challenges after joining a room
      updateUserBalance(); // Update user balance
    } catch (error) {
      console.error('Failed to join room:', error);
      alert(error.response?.data?.message || 'Failed to join room');
    }
  };

  const handleChallengeClick = (roomId) => {
    navigate(`/challenge/${roomId}`);
  };

  const cancelRoom = async (roomId) => {
    try {
      await axios.delete(`${config.apiBaseUrl}/api/rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Room canceled successfully, and money refunded!'); // Inform the user about the refund
      fetchChallenges(); // Refresh challenges after cancellation
      updateUserBalance();
    } catch (error) {
      console.error('Failed to cancel room:', error);
      alert(error.response?.data?.message || 'Failed to cancel room');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Welcome, {currentUser.username}</h2>
        <div 
            className="wallet-balance"
            onClick={() => navigate('/wallet')}
        >
          Balance: ₹{currentUser.balance}
        </div>
      </div>

      <div className="card">
        <h2>Create a Room</h2>
        <form onSubmit={createRoom}>
          <input
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="Entry Fee"
            required
          />
          <button type="submit">Create Room</button>
        </form>
      </div>

      {runningChallenges.length > 0 && (
        <div className="card">
          <h2>Running Challenges</h2>
          <ul>
            {runningChallenges.map((room) => (
              <li key={room._id}>
                Room: {room.name} - Entry Fee: ${room.entryFee}
                {room.participants.some(p => p._id === currentUser._id) && (
                  <button onClick={() => handleChallengeClick(room._id)}>Go to Challenge</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Open Challenges</h2>
        <ul>
          {openChallenges.map((room) => (
            <li key={room._id}>
              Room: {room.name} - Entry Fee: ${room.entryFee} - Created by: {room.creator.username}
              {room.creator._id === currentUser._id && room.status === 'open' && (
                <button onClick={() => cancelRoom(room._id)}>Cancel Challenge</button>
              )}
              {room.creator._id !== currentUser._id && (
                <button onClick={() => joinRoom(room._id)}>Join Room</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Ongoing Challenges</h2>
        <ul>
          {ongoingChallenges.map((room) => (
            <li key={room._id}>
              Room: {room.name} - Entry Fee: ${room.entryFee} - Participants: {room.participants.map(p => p.username).join(', ')}
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .wallet-balance {
            background: #28a745;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            display: inline-block;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .wallet-balance:hover {
            background: #218838;
        }

        /* Keep your existing styles */
        .card {
            /* Your existing card styles */
        }
      `}</style>
    </div>
  );
}

export default GameSection;
