const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get transaction history
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.user.id,
            status: { $ne: 'pending' }
        })
        .sort({ createdAt: -1 })
        .limit(50);

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending requests
router.get('/pending', auth, async (req, res) => {
    try {
        const pendingTransactions = await Transaction.find({
            user: req.user.id,
            status: 'pending'
        }).sort({ createdAt: -1 });

        res.json(pendingTransactions);
    } catch (error) {
        console.error('Error fetching pending transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit add money request
router.post('/request', auth, upload.single('screenshot'), async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const screenshotUrl = req.file 
            ? `/uploads/${req.file.filename}`
            : null;

        const transaction = new Transaction({
            user: req.user.id,
            amount: parsedAmount,
            type: 'credit',
            status: 'pending',
            description: 'Add money request',
            screenshot: screenshotUrl
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin routes for processing transactions
router.post('/:transactionId/process', auth, async (req, res) => {
    try {
        const { status } = req.body;
        
        // Verify admin
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ message: 'Transaction already processed' });
        }

        transaction.status = status;
        transaction.processedBy = req.user.id;

        if (status === 'approved') {
            const user = await User.findById(transaction.user);
            if (transaction.type === 'credit') {
                user.balance += transaction.amount;
            }
            await user.save();
        }

        await transaction.save();
        res.json(transaction);
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
