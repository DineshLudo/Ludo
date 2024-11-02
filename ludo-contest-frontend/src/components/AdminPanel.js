import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

function AdminPanel() {
    const [summary, setSummary] = useState({
        totalGames: 0,
        totalWinnings: 0,
        totalCommission: 0,
        activeGames: 0,
        disputedGames: 0,
        totalWalletBalance: 0
    });
    const [runningGames, setRunningGames] = useState([]);
    const [disputedGames, setDisputedGames] = useState([]);
    const [pastGames, setPastGames] = useState([]);
    const [pendingTransactions, setPendingTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const currentPath = location.pathname;

    const fetchAdminData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            if (currentPath === '/admin' || currentPath === '/admin/') {
                const summaryResponse = await axios.get(
                    `${config.apiBaseUrl}/api/admin/summary`,
                    { headers }
                );
                setSummary(summaryResponse.data);
            }

            if (currentPath === '/admin/games') {
                const [runningResponse, pastResponse] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/admin/games/running`, { headers }),
                    axios.get(`${config.apiBaseUrl}/api/admin/games/completed`, { headers })
                ]);
                setRunningGames(runningResponse.data);
                setPastGames(pastResponse.data);
            }

            if (currentPath === '/admin/disputes') {
                const disputedResponse = await axios.get(
                    `${config.apiBaseUrl}/api/admin/games/disputed`,
                    { headers }
                );
                setDisputedGames(disputedResponse.data);
            }

            if (currentPath === '/admin/transactions') {
                const transactionsResponse = await axios.get(
                    `${config.apiBaseUrl}/api/admin/transactions/pending`,
                    { headers }
                );
                setPendingTransactions(transactionsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
        const interval = setInterval(fetchAdminData, 5000);
        return () => clearInterval(interval);
    }, [currentPath]);

    const handleDecision = async (gameId, decision) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${config.apiBaseUrl}/api/rooms/${gameId}/admin-decision`,
                { decision },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            alert('Decision submitted successfully');
            fetchAdminData();
        } catch (error) {
            console.error('Error submitting decision:', error);
            alert('Failed to submit decision');
        }
    };

    const handleTransaction = async (transactionId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${config.apiBaseUrl}/api/transactions/${transactionId}/process`,
                { status },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            alert(`Transaction ${status} successfully`);
            fetchAdminData();
        } catch (error) {
            console.error('Error processing transaction:', error);
            alert('Failed to process transaction');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    };

    if (loading) return <div>Loading admin panel...</div>;

    const renderContent = () => {
        switch (currentPath) {
            case '/admin':
            case '/admin/':
                return (
                    <section className="summary-section">
                        <h2>Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <h3>Total Games</h3>
                                <p>{summary.totalGames}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Total Winnings</h3>
                                <p>₹{summary.totalWinnings}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Commission Earned</h3>
                                <p>₹{summary.totalCommission}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Active Games</h3>
                                <p>{summary.activeGames}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Disputed Games</h3>
                                <p>{summary.disputedGames}</p>
                            </div>
                            <div className="summary-card wallet-balance">
                                <h3>Total User Balance</h3>
                                <p>₹{summary.totalWalletBalance}</p>
                            </div>
                        </div>
                    </section>
                );

            case '/admin/games':
                return (
                    <>
                        <section className="running-games-section">
                            <h2>Running Games</h2>
                            <div className="games-grid">
                                {runningGames.map(game => (
                                    <div key={game._id} className="game-card running-game">
                                        <div className="game-header">
                                            <h3>Room Code: {game.roomCode}</h3>
                                            <span className="entry-fee">₹{game.entryFee}</span>
                                        </div>
                                        <div className="players">
                                            <p>Player 1: {game.participants[0]?.username}</p>
                                            <p>Player 2: {game.participants[1]?.username}</p>
                                        </div>
                                        <p className="time">
                                            Started: {new Date(game.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {runningGames.length === 0 && (
                                    <p className="no-games">No running games</p>
                                )}
                            </div>
                        </section>
                        <section className="past-games-section">
                            <h2>Past Games</h2>
                            <div className="games-grid">
                                {pastGames.map(game => (
                                    <div key={game._id} className="game-card past-game">
                                        <div className="game-header">
                                            <h3>Room Code: {game.roomCode}</h3>
                                            <span className="entry-fee">₹{game.entryFee}</span>
                                        </div>
                                        <div className="players">
                                            <p>Player 1: {game.participants[0]?.username}</p>
                                            <p>Player 2: {game.participants[1]?.username}</p>
                                        </div>
                                        <div className="game-result">
                                            <p className="winner">
                                                Winner: {
                                                    game.result === 'player1win' 
                                                        ? game.participants[0]?.username 
                                                        : game.participants[1]?.username
                                                }
                                            </p>
                                            {game.adminDecision?.decidedBy && (
                                                <p className="admin-decided">Admin Decision</p>
                                            )}
                                        </div>
                                        <p className="time">
                                            Completed: {new Date(game.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {pastGames.length === 0 && (
                                    <p className="no-games">No completed games</p>
                                )}
                            </div>
                        </section>
                    </>
                );

            case '/admin/disputes':
                return (
                    <section className="disputed-games-section">
                        <h2>Disputed Games</h2>
                        <div className="disputed-games">
                            <h3>Disputed Games</h3>
                            {disputedGames.map(game => (
                                <div key={game._id} className="dispute-card">
                                    <div className="game-header">
                                        <h3>Room Code: {game.roomCode}</h3>
                                        <span className="entry-fee">₹{game.entryFee}</span>
                                    </div>
                                    <div className="players">
                                        <p>Player 1: {game.participants[0]?.username}</p>
                                        <p>Player 2: {game.participants[1]?.username}</p>
                                    </div>
                                    <div className="claims">
                                        <p>Player 1 claims: {game.player1Result}</p>
                                        <p>Player 2 claims: {game.player2Result}</p>
                                    </div>
                                    <div className="screenshots-container">
                                        <div className="player-screenshot">
                                            <h5>Player 1 Screenshot</h5>
                                            {game.player1Screenshot ? (
                                                <div className="screenshot-container">
                                                    <img 
                                                        src={game.player1Screenshot}
                                                        alt="Player 1's screenshot"
                                                        className="dispute-screenshot"
                                                        onClick={() => window.open(game.player1Screenshot, '_blank')}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = 'Failed to load screenshot';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="no-screenshot">No screenshot provided</p>
                                            )}
                                        </div>
                                        <div className="player-screenshot">
                                            <h5>Player 2 Screenshot</h5>
                                            {game.player2Screenshot ? (
                                                <div className="screenshot-container">
                                                    <img 
                                                        src={game.player2Screenshot}
                                                        alt="Player 2's screenshot"
                                                        className="dispute-screenshot"
                                                        onClick={() => window.open(game.player2Screenshot, '_blank')}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = 'Failed to load screenshot';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="no-screenshot">No screenshot provided</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="admin-actions">
                                        <button 
                                            onClick={() => handleDecision(game._id, 'player1win')}
                                            className="decision-button win"
                                        >
                                            Player 1 Won
                                        </button>
                                        <button 
                                            onClick={() => handleDecision(game._id, 'player2win')}
                                            className="decision-button win"
                                        >
                                            Player 2 Won
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {disputedGames.length === 0 && (
                                <p className="no-games">No disputed games</p>
                            )}
                        </div>
                    </section>
                );

            case '/admin/transactions':
                return (
                    <section className="transactions-section">
                        <h2>Pending Transactions</h2>
                        <div className="transactions-grid">
                            {pendingTransactions.map(transaction => (
                                <div key={transaction._id} className="transaction-card">
                                    <div className="transaction-header">
                                        <h4>Amount: ₹{transaction.amount}</h4>
                                        <span className="status-badge pending">Pending</span>
                                    </div>
                                    
                                    <div className="user-details">
                                        <p>User: {transaction.user.username}</p>
                                        <p>Requested: {new Date(transaction.createdAt).toLocaleString()}</p>
                                    </div>

                                    {transaction.screenshot && (
                                        <div className="screenshot-section">
                                            <h5>Payment Screenshot</h5>
                                            <div className="screenshot-container">
                                                <img 
                                                    src={`${config.apiBaseUrl}${transaction.screenshot}`}
                                                    alt="Payment Screenshot" 
                                                    className="transaction-screenshot"
                                                    onClick={() => window.open(`${config.apiBaseUrl}${transaction.screenshot}`, '_blank')}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = 'Failed to load screenshot';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="action-buttons">
                                        <button 
                                            className="approve-button"
                                            onClick={() => handleTransaction(transaction._id, 'approved')}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className="reject-button"
                                            onClick={() => handleTransaction(transaction._id, 'rejected')}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingTransactions.length === 0 && (
                                <p className="no-transactions">No pending transactions</p>
                            )}
                        </div>
                    </section>
                );

            default:
                return <div>Select a section from the navigation menu</div>;
        }
    };

    return (
        <div className="admin-panel">
            {renderContent()}
            <style>{`
                .admin-panel {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                    background: #f8f9fa;
                    min-height: calc(100vh - 60px);
                }

                /* Section Headers */
                h2 {
                    color: #2c3e50;
                    font-size: 1.8rem;
                    margin-bottom: 25px;
                    padding-bottom: 10px;
                    border-bottom: 3px solid #3498db;
                    display: inline-block;
                }

                /* Summary Section */
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 25px;
                    margin-bottom: 40px;
                }

                .summary-card {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    padding: 25px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
                    transition: all 0.3s ease;
                    color: white;
                }

                .summary-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                }

                .summary-card h3 {
                    color: rgba(255,255,255,0.9);
                    font-size: 1rem;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .summary-card p {
                    font-size: 2rem;
                    font-weight: 600;
                    color: white;
                    margin: 0;
                }

                .summary-card.wallet-balance {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                }

                .summary-card.wallet-balance h3 {
                    color: rgba(255,255,255,0.9);
                }

                .summary-card.wallet-balance p {
                    color: white;
                }

                /* Games Section Styles */
                .running-games-section,
                .past-games-section {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    margin-bottom: 40px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }

                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 25px;
                    margin-top: 25px;
                }

                .game-card {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(0,0,0,0.05);
                    position: relative;
                    overflow: hidden;
                }

                .game-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                }

                .running-game::before {
                    background: linear-gradient(to right, #f1c40f, #f39c12);
                }

                .past-game::before {
                    background: linear-gradient(to right, #2ecc71, #27ae60);
                }

                .game-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                }

                .game-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                }

                .game-header h3 {
                    color: #2c3e50;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .entry-fee {
                    background: #3498db;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
                }

                .players {
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                }

                .players p {
                    margin: 8px 0;
                    color: #34495e;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                }

                .players p::before {
                    content: '👤';
                    margin-right: 8px;
                }

                .game-result {
                    background: rgba(46, 204, 113, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                }

                .winner {
                    color: #27ae60;
                    font-weight: 600;
                    margin: 0;
                    display: flex;
                    align-items: center;
                }

                .winner::before {
                    content: '👑';
                    margin-right: 8px;
                }

                .admin-decided {
                    background: #3498db;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    display: inline-block;
                    margin-top: 10px;
                }

                .time {
                    color: #7f8c8d;
                    font-size: 0.85rem;
                    margin-top: 15px;
                    display: flex;
                    align-items: center;
                }

                .time::before {
                    content: '🕒';
                    margin-right: 8px;
                }

                .no-games {
                    text-align: center;
                    padding: 40px;
                    background: #f8f9fa;
                    border-radius: 15px;
                    border: 2px dashed #e0e0e0;
                    color: #7f8c8d;
                    font-size: 1.1rem;
                    margin: 20px 0;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .running-games-section,
                    .past-games-section {
                        padding: 20px;
                    }

                    .games-grid {
                        grid-template-columns: 1fr;
                    }

                    .game-card {
                        padding: 20px;
                    }
                }

                /* Animation for new games */
                @keyframes highlightNew {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }

                .game-card.new {
                    animation: highlightNew 1s ease;
                }

                /* Disputed Games */
                .dispute-card {
                    background: white;
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 25px;
                    border-left: 4px solid #e74c3c;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
                    transition: all 0.3s ease;
                }

                .dispute-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                }

                .claims {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    border: 1px solid #eee;
                }

                .screenshots-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }

                .player-screenshot {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                }

                .player-screenshot h5 {
                    color: #2c3e50;
                    margin-bottom: 15px;
                }

                .dispute-screenshot {
                    max-width: 100%;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }

                .dispute-screenshot:hover {
                    transform: scale(1.05);
                }

                /* Admin Actions */
                .admin-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 20px;
                }

                .decision-button {
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .decision-button.win {
                    background: #2ecc71;
                    color: white;
                }

                .decision-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }

                /* Transactions */
                .transaction-card {
                    background: white;
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
                    transition: all 0.3s ease;
                }

                .transaction-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge.pending {
                    background: #f1c40f;
                    color: #000;
                }

                .action-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 20px;
                }

                .approve-button, .reject-button {
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .approve-button {
                    background: #2ecc71;
                    color: white;
                }

                .reject-button {
                    background: #e74c3c;
                    color: white;
                }

                .approve-button:hover, .reject-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }

                /* Empty States */
                .no-games, .no-transactions {
                    text-align: center;
                    color: #7f8c8d;
                    padding: 40px;
                    background: white;
                    border-radius: 15px;
                    font-size: 1.1rem;
                    margin: 20px 0;
                    border: 2px dashed #bdc3c7;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .admin-panel {
                        padding: 15px;
                    }

                    .summary-grid {
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    }

                    .games-grid {
                        grid-template-columns: 1fr;
                    }

                    .screenshots-container {
                        grid-template-columns: 1fr;
                    }

                    .admin-actions, .action-buttons {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default AdminPanel;
