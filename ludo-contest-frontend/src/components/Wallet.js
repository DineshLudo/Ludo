import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function Wallet({ currentUser, setCurrentUser }) {
    const [amount, setAmount] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        fetchTransactions();
        fetchPendingRequests();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${config.apiBaseUrl}/api/transactions`,
                { headers: { 'Authorization': `Bearer ${token}` }}
            );
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${config.apiBaseUrl}/api/transactions/pending`,
                { headers: { 'Authorization': `Bearer ${token}` }}
            );
            setPendingRequests(response.data);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    const handleScreenshotChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setScreenshot(file);
        }
    };

    const submitRequest = async () => {
        if (!amount || !screenshot) {
            alert('Please enter amount and upload payment screenshot');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('amount', parsedAmount);
            formData.append('screenshot', screenshot);

            const token = localStorage.getItem('token');
            await axios.post(
                `${config.apiBaseUrl}/api/transactions/request`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert('Add money request submitted successfully');
            setAmount('');
            setScreenshot(null);
            fetchPendingRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wallet-container">
            <div className="wallet-header">
                <h2>Wallet</h2>
                <div className="balance-card">
                    <span className="balance-label">Current Balance</span>
                    <span className="balance-amount">₹{currentUser.balance}</span>
                </div>
            </div>

            <div className="add-money-section">
                <h3>Add Money</h3>
                <div className="upi-details">
                    <p>UPI ID: <strong>your-upi-id@bank</strong></p>
                    <p className="upi-instructions">
                        1. Send money to the above UPI ID<br/>
                        2. Enter the amount below<br/>
                        3. Upload payment screenshot<br/>
                        4. Submit for verification
                    </p>
                </div>

                <div className="add-money-form">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="amount-input"
                    />
                    <div className="screenshot-upload">
                        <label className="upload-label">
                            {screenshot ? 'Screenshot Selected' : 'Upload Payment Screenshot'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <button 
                        onClick={submitRequest} 
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>

            {pendingRequests.length > 0 && (
                <div className="pending-requests">
                    <h3>Pending Requests</h3>
                    {pendingRequests.map(request => (
                        <div key={request._id} className="request-card">
                            <span>₹{request.amount}</span>
                            <span className="status-pending">Pending</span>
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="transaction-history">
                <h3>Transaction History</h3>
                {transactions.map(transaction => (
                    <div key={transaction._id} className="transaction-card">
                        <div className="transaction-details">
                            <span className={`amount ${transaction.type}`}>
                                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                            </span>
                            <span className="transaction-type">{transaction.description}</span>
                        </div>
                        <span className="transaction-date">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                ))}
            </div>

            <style>{`
                .wallet-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .wallet-header {
                    margin-bottom: 30px;
                }

                .balance-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .balance-amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #28a745;
                }

                .add-money-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .upi-details {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .upi-instructions {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .amount-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }

                .upload-label {
                    display: block;
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 4px;
                    text-align: center;
                    cursor: pointer;
                    margin-bottom: 15px;
                }

                .submit-button {
                    width: 100%;
                    padding: 12px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .submit-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }

                .transaction-history {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                }

                .transaction-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #eee;
                }

                .amount.credit {
                    color: #28a745;
                }

                .amount.debit {
                    color: #dc3545;
                }

                .transaction-date {
                    color: #666;
                    font-size: 14px;
                }

                .pending-requests {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .request-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }

                .status-pending {
                    color: #ffc107;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}

export default Wallet;
