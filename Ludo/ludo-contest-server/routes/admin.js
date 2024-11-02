const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const Room = require('../models/Room');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcrypt');

router.get('/summary', auth, adminAuth, async (req, res) => {
    try {
        const totalGames = await Room.countDocuments();
        const completedGames = await Room.countDocuments({ status: 'completed' });
        const activeGames = await Room.countDocuments({ status: 'running' });
        const disputedGames = await Room.countDocuments({ status: 'disputed' });

        // Calculate total winnings and commission
        const completedRooms = await Room.find({ status: 'completed' });
        let totalWinnings = 0;
        let totalCommission = 0;

        completedRooms.forEach(room => {
            const totalPool = room.entryFee * 2;
            const commission = totalPool * 0.1; // 10% commission
            totalWinnings += totalPool - commission;
            totalCommission += commission;
        });

        // Calculate total wallet balance of all users
        const users = await User.find({});
        const totalWalletBalance = users.reduce((total, user) => total + (user.balance || 0), 0);

        res.json({
            totalGames,
            completedGames,
            activeGames,
            disputedGames,
            totalWinnings,
            totalCommission,
            totalWalletBalance
        });
    } catch (error) {
        console.error('Error in summary route:', error);
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
});

router.get('/games/running', auth, adminAuth, async (req, res) => {
    try {
        const runningGames = await Room.find({ status: 'running' })
            .populate('participants', 'username')
            .sort('-createdAt')
            .limit(10);
        res.json(runningGames);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching running games', error: error.message });
    }
});

router.get('/games/disputed', auth, adminAuth, async (req, res) => {
    try {
        const disputedGames = await Room.find({ status: 'disputed' })
            .populate('participants', 'username')
            .sort('-createdAt');
        
        console.log('Disputed games:', disputedGames); // Debug log
        res.json(disputedGames);
    } catch (error) {
        console.error('Error fetching disputed games:', error);
        res.status(500).json({ message: 'Error fetching disputed games', error: error.message });
    }
});

// Get completed games
router.get('/games/completed', auth, async (req, res) => {
    try {
        // Verify if user is admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Fetch completed games, sorted by most recent first
        const completedGames = await Room.find({ 
            status: 'completed'
        })
        .populate('participants', 'username')
        .populate('creator', 'username')
        .populate('adminDecision.decidedBy', 'username')
        .sort({ updatedAt: -1 })
        .limit(50); // Limit to last 50 games for performance

        res.json(completedGames);
    } catch (error) {
        console.error('Error fetching completed games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pending transactions
router.get('/transactions/pending', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const pendingTransactions = await Transaction.find({ status: 'pending' })
            .populate('user', 'username')
            .sort({ createdAt: -1 });

        res.json(pendingTransactions);
    } catch (error) {
        console.error('Error fetching pending transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Temporary admin creation endpoint
router.post('/create-initial-admin', async (req, res) => {
    try {
        // Check for existing admin
        const existingAdmin = await User.findOne({ isAdmin: true });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create new admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            isAdmin: true,
            email: 'admin@example.com'
        });
        
        await adminUser.save();
        res.json({ 
            message: 'Admin created successfully',
            username: 'admin',
            email: 'admin@example.com'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
