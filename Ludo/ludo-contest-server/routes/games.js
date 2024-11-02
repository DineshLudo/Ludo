const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Room = require('../models/Room');

router.get('/history', auth, async (req, res) => {
    try {
        const games = await Room.find({
            participants: req.user.id,
            status: { $in: ['completed', 'disputed', 'running'] }
        })
        .populate('participants', 'username')
        .populate('creator', 'username')
        .populate('adminDecision.decidedBy', 'username')
        .sort({ updatedAt: -1 })
        .limit(50);

        // Transform the data to include all necessary information
        const transformedGames = games.map(game => ({
            _id: game._id,
            roomCode: game.roomCode,
            entryFee: game.entryFee,
            status: game.status,
            result: game.result,
            participants: game.participants,
            creator: game.creator,
            player1Screenshot: game.player1Screenshot,
            player2Screenshot: game.player2Screenshot,
            adminDecision: game.adminDecision,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt
        }));

        res.json(transformedGames);
    } catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
