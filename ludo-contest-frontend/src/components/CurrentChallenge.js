import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

function CurrentChallenge() {
    const { challengeId } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [localRoomCode, setLocalRoomCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');
    const [screenshot, setScreenshot] = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
    const [cancelStatus, setCancelStatus] = useState(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${config.apiBaseUrl}/api/rooms/${challengeId}`,
                    { headers: { 'Authorization': `Bearer ${token}` }}
                );
                setChallenge(response.data);
                setRoomCode(response.data.roomCode || '');
                setError(null);

                // Check if current user has already submitted a result
                const currentUserId = localStorage.getItem('userId');
                const isPlayer1 = response.data.participants[0]._id === currentUserId;
                
                if (isPlayer1 && response.data.player1Result) {
                    setHasSubmittedResult(true);
                    setResult(response.data.player1Result);
                } else if (!isPlayer1 && response.data.player2Result) {
                    setHasSubmittedResult(true);
                    setResult(response.data.player2Result);
                }
            } catch (error) {
                console.error('Error fetching challenge:', error);
                setError(error.response?.data?.message || 'Failed to load challenge');
            } finally {
                setLoading(false);
            }
        };

        if (challengeId) {
            fetchChallenge();
        }
        const intervalId = setInterval(fetchChallenge, 5000);
        return () => clearInterval(intervalId);
    }, [challengeId]);

    const handleRoomCodeSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${config.apiBaseUrl}/api/rooms/${challengeId}`,
                { roomCode },
                { headers: { 'Authorization': `Bearer ${token}` }}
            );
            
            // Update local challenge state
            setChallenge(prev => ({
                ...prev,
                roomCode,
                status: 'running'
            }));
            
            alert('Room code submitted successfully!');
        } catch (error) {
            console.error('Error submitting room code:', error);
            alert(error.response?.data?.message || 'Failed to submit room code');
        }
    };

    const handleScreenshotChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setScreenshot(file);
            // Just store the file, don't upload yet
        }
    };

    const handleWin = async () => {
        if (!screenshot) {
            alert('Please select a screenshot first');
            return;
        }

        try {
            // First upload the screenshot
            const formData = new FormData();
            formData.append('screenshot', screenshot);

            console.log('Uploading screenshot...');
            const uploadResponse = await axios.post(
                `${config.apiBaseUrl}/api/upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const screenshotUrl = uploadResponse.data.url;
            console.log('Screenshot uploaded successfully:', screenshotUrl);

            // Then submit the result with the screenshot URL
            const currentUserId = localStorage.getItem('userId');
            const isPlayer1 = challenge.participants[0]._id === currentUserId;
            const result = isPlayer1 ? 'player1win' : 'player2win';

            const payload = {
                result,
                screenshot: screenshotUrl
            };
            console.log('Sending result with payload:', payload);

            const response = await axios.patch(
                `${config.apiBaseUrl}/api/rooms/result/${challengeId}`,
                payload,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            );

            console.log('Result updated:', response.data);
            setResult('win');
            setHasSubmittedResult(true);
            alert('Your result has been recorded as a win with the screenshot.');
        } catch (error) {
            console.error('Failed to update result:', error.response?.data || error);
            alert('Failed to update result. Please try again.');
        }
    };

    const handleLose = async () => {
        try {
            const currentUserId = localStorage.getItem('userId');
            const isPlayer1 = challenge.participants[0]._id === currentUserId;
            const result = isPlayer1 ? 'player2win' : 'player1win';

            await axios.patch(
                `${config.apiBaseUrl}/api/rooms/result/${challengeId}`,
                { result },
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );

            setHasSubmittedResult(true);
            setResult('lose');
            alert('Your result has been recorded as a loss.');
        } catch (error) {
            console.error('Failed to update result:', error);
            alert('Failed to update result. Please try again.');
        }
    };

    const handleSaveRoomCode = async () => {
        try {
            console.log('Saving room code:', localRoomCode);
            const response = await axios.patch(
                `${config.apiBaseUrl}/api/rooms/${challengeId}`,
                {
                    roomCode: localRoomCode
                },
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            );

            console.log('Response after saving room code:', response.data);
            setRoomCode(localRoomCode);
            setChallenge(response.data);
        } catch (error) {
            console.error('Failed to save room code:', error);
            alert('Failed to save room code. Please try again.');
        }
    };

    const handleCancel = async () => {
        try {
            const currentUserId = localStorage.getItem('userId');
            const isPlayer1 = challenge.participants[0]._id === currentUserId;
            
            const response = await axios.patch(
                `${config.apiBaseUrl}/api/rooms/cancel/${challengeId}`,
                { 
                    cancelledBy: currentUserId 
                },
                { 
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
                }
            );

            setHasSubmittedResult(true);
            setCancelStatus('cancelled');
            
            if (response.data.status === 'cancelled') {
                alert('Game cancelled successfully. Entry fee refunded.');
                navigate('/');
            } else {
                alert('Cancellation request submitted. Waiting for opponent\'s response.');
            }
        } catch (error) {
            console.error('Failed to cancel game:', error);
            alert('Failed to cancel game. Please try again.');
        }
    };

    const renderResultSection = () => {
        if (hasSubmittedResult) {
            return (
                <div className="result-status">
                    <h3>Result Status</h3>
                    <div className="status-message">
                        {challenge.status === 'completed' ? (
                            <p>Game completed! Final result: {challenge.result}</p>
                        ) : challenge.resultDecisionPending ? (
                            <p>Your result has been submitted. Waiting for admin decision.</p>
                        ) : (
                            <p>Your result has been submitted. Waiting for opponent's result.</p>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h3>Submit Your Result</h3>
                {roomCode && (  // Only show screenshot section if room code exists
                    <div className="screenshot-section">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            style={{ marginBottom: '10px' }}
                        />
                        {screenshot && (
                            <img
                                src={URL.createObjectURL(screenshot)}
                                alt="Selected screenshot"
                                style={{ 
                                    maxWidth: '200px', 
                                    marginBottom: '10px',
                                    display: 'block' 
                                }}
                            />
                        )}
                    </div>
                )}
                <div className="result-buttons">
                    {roomCode && (  // Only show win/lose buttons if room code exists
                        <>
                            <button onClick={handleLose} className="lose-button">I Lost</button>
                            <button 
                                onClick={handleWin} 
                                disabled={!screenshot}
                                className="win-button"
                            >
                                I Won
                            </button>
                        </>
                    )}
                    <button 
                        onClick={handleCancel} 
                        className="cancel-button"
                    >
                        Cancel Game
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div>Loading challenge...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!challenge) return <div>Challenge not found</div>;

    const isCreator = challenge.creator._id === currentUserId;
    const showRoomCodeInput = isCreator && (!challenge.roomCode || challenge.status === 'open');
    const showResultButtons = challenge.status === 'running' && challenge.roomCode;

    return (
        <div className="current-challenge">
            <h2>Current Challenge</h2>
            <div className="challenge-details">
                <p>Entry Fee: ₹{challenge.entryFee}</p>
                <p>Status: {challenge.status}</p>
                
                {/* Room Code Section */}
                {isCreator && !challenge.roomCode && (
                    <div className="room-code-input">
                        <input
                            type="text"
                            value={localRoomCode}
                            onChange={(e) => setLocalRoomCode(e.target.value)}
                            placeholder="Enter room code"
                        />
                        <button onClick={handleSaveRoomCode}>Save Room Code</button>
                    </div>
                )}

                {challenge.roomCode && (
                    <p>Room Code: {challenge.roomCode}</p>
                )}

                <div className="participants">
                    <p>Player 1: {challenge.participants[0]?.username}</p>
                    <p>Player 2: {challenge.participants[1]?.username}</p>
                </div>
            </div>

            {renderResultSection()}

            <style>{`
                .current-challenge {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .challenge-details {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .result-status {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                }

                .status-message {
                    color: #666;
                    font-size: 16px;
                    text-align: center;
                    padding: 10px;
                }

                .result-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }

                .win-button, .lose-button, .cancel-button {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    color: white;
                    min-width: 120px;
                }

                .cancel-button {
                    background-color: #6c757d;
                }

                .cancel-button:hover {
                    background-color: #5a6268;
                }
            `}</style>
        </div>
    );
}

export default CurrentChallenge;
