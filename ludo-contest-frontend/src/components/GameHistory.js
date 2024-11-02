import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function GameHistory() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGameHistory();
    }, []);

    const fetchGameHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            const response = await axios.get(
                `${config.apiBaseUrl}/api/games/history`,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Game history response:', response.data); // For debugging
            setGames(response.data);
        } catch (error) {
            console.error('Error fetching game history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading game history...</div>;

    return (
        <div className="game-history">
            <h2>Game History</h2>
            <div className="games-grid">
                {games.map(game => (
                    <div key={game._id} className={`game-card ${game.status}`}>
                        <div className="game-header">
                            <h3>Room Code: {game.roomCode}</h3>
                            <span className="entry-fee">₹{game.entryFee}</span>
                        </div>
                        
                        <div className="game-details">
                            <div className="players">
                                <p>Opponent: {
                                    game.participants.find(p => p._id !== localStorage.getItem('userId'))?.username || 'Unknown'
                                }</p>
                            </div>

                            <div className="game-result">
                                {game.status === 'completed' && (
                                    <>
                                        <p className={`result ${game.result === 'player1win' && game.participants[0]._id === localStorage.getItem('userId') || 
                                                              game.result === 'player2win' && game.participants[1]._id === localStorage.getItem('userId') 
                                                              ? 'won' : 'lost'}`}>
                                            {game.result === 'player1win' && game.participants[0]._id === localStorage.getItem('userId') || 
                                             game.result === 'player2win' && game.participants[1]._id === localStorage.getItem('userId') 
                                                ? 'Won' : 'Lost'}
                                        </p>
                                        <p className="winnings">
                                            {game.result === 'player1win' && game.participants[0]._id === localStorage.getItem('userId') || 
                                             game.result === 'player2win' && game.participants[1]._id === localStorage.getItem('userId') 
                                                ? `Won ₹${game.entryFee * 1.8}` : 'No winnings'}
                                        </p>
                                    </>
                                )}
                                {game.status === 'disputed' && (
                                    <p className="disputed">Under Review</p>
                                )}
                                {game.status === 'running' && (
                                    <p className="running">In Progress</p>
                                )}
                            </div>

                            <p className="time">
                                {game.status === 'completed' 
                                    ? `Completed: ${new Date(game.updatedAt).toLocaleString()}`
                                    : `Started: ${new Date(game.createdAt).toLocaleString()}`
                                }
                            </p>
                        </div>
                    </div>
                ))}
                {games.length === 0 && (
                    <p className="no-games">No games played yet</p>
                )}
            </div>

            <style>{`
                .game-history {
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .games-grid {
                    display: grid;
                    gap: 20px;
                    margin-top: 20px;
                }

                .game-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .game-card.completed {
                    border-left: 4px solid #28a745;
                }

                .game-card.disputed {
                    border-left: 4px solid #ffc107;
                }

                .game-card.running {
                    border-left: 4px solid #17a2b8;
                }

                .game-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .entry-fee {
                    background: #e9ecef;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                }

                .game-details {
                    color: #495057;
                }

                .game-result {
                    margin: 10px 0;
                    font-weight: bold;
                }

                .result {
                    margin: 5px 0;
                    font-size: 18px;
                }

                .result.won {
                    color: #28a745;
                }

                .result.lost {
                    color: #dc3545;
                }

                .winnings {
                    color: #28a745;
                    font-size: 14px;
                }

                .disputed {
                    color: #ffc107;
                }

                .running {
                    color: #17a2b8;
                }

                .time {
                    color: #6c757d;
                    font-size: 12px;
                    margin-top: 10px;
                }

                .no-games {
                    text-align: center;
                    color: #6c757d;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                @media (max-width: 768px) {
                    .game-history {
                        padding: 10px;
                    }
                }
            `}</style>
        </div>
    );
}

export default GameHistory;
