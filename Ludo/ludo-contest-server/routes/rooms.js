const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User'); // Import the User model

console.log('auth middleware:', auth);  // Add this line for debugging

// Move these admin routes to the top of the file, before other routes
// Get all rooms (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Verify if user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const rooms = await Room.find()
      .populate('participants', 'username balance')
      .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active rooms
router.get('/active', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'active' })
      .populate('participants', 'username balance');
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching active rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/create', auth, async (req, res) => {
    try {
        const { entryFee } = req.body;
        const user = await User.findById(req.user.id);

        if (user.balance < entryFee) {
            return res.status(400).json({ message: 'Insufficient balance to create room' });
        }

        // Check if the user is already in an ongoing or open challenge
        const existingChallenge = await Room.findOne({
            participants: req.user.id,
            status: { $in: ['open', 'running'] }
        });
        if (existingChallenge) {
            return res.status(400).json({ message: 'You are already in a challenge' });
        }

        const newRoom = new Room({
            entryFee,
            creator: req.user.id,
            participants: [req.user.id],
            status: 'open'
        });

        user.balance -= entryFee; // Deduct entry fee from user's balance
        await user.save();
        await newRoom.save();

        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Join a room
router.post('/join/:roomId', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId).populate('participants', 'username');
        const user = await User.findById(req.user.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        if (room.participants.length >= 2) {
            return res.status(400).json({ message: 'Room is full' });
        }
        if (room.creator.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot join your own room' });
        }
        if (user.balance < room.entryFee) {
            return res.status(400).json({ message: 'Insufficient balance to join room' });
        }

        // Check if the user is already in an ongoing or open challenge
        const existingChallenge = await Room.findOne({
            participants: req.user.id,
            status: { $in: ['open', 'running'] }
        });
        if (existingChallenge) {
            return res.status(400).json({ message: 'You are already in a challenge' });
        }

        if (!room.participants.includes(req.user.id)) {
            room.participants.push(req.user.id);
            if (room.participants.length === 2) {
                room.status = 'running'; // Update status to running
            }

            user.balance -= room.entryFee; // Deduct entry fee from user's balance
            await user.save();
            await room.save();
        }

        res.json(room);
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ message: 'Error joining room', error: error.message });
    }
});

// List open challenges (less than 2 participants)
router.get('/open', auth, async (req, res) => {
    try {
        const openChallenges = await Room.find({ 'participants.1': { $exists: false } })
            .populate('creator', 'username')
            .populate('participants', 'username');
        res.json(openChallenges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching open challenges', error: error.message });
    }
});

// List ongoing challenges (exactly 2 participants and not completed)
router.get('/ongoing', auth, async (req, res) => {
    try {
        const ongoingGames = await Room.find({
            participants: req.user.id,
            status: { 
                $in: ['running'], // Remove 'cancelled' from ongoing games
                $nin: ['completed', 'cancelled', 'disputed'] // Explicitly exclude cancelled games
            }
        })
        .populate('participants', 'username')
        .populate('creator', 'username')
        .sort({ createdAt: -1 });

        res.json(ongoingGames);
    } catch (error) {
        console.error('Error fetching ongoing games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update result submission endpoint
router.patch('/result/:roomId', auth, async (req, res) => {
    try {
        console.log('Result submission received:', {
            roomId: req.params.roomId,
            body: req.body,
            userId: req.user.id
        });

        const room = await Room.findById(req.params.roomId)
            .populate('participants', 'username _id')
            .select('+player1Screenshot +player2Screenshot');

        if (!room) {
            console.log('Room not found');
            return res.status(404).json({ message: 'Room not found' });
        }

        console.log('Room found:', room);

        // Check if user is a participant
        const isParticipant = room.participants.some(
            p => p._id.toString() === req.user.id
        );

        if (!isParticipant) {
            console.log('User not participant');
            return res.status(403).json({ message: 'You are not a participant in this room' });
        }

        // Determine if user is player1 or player2
        const isPlayer1 = room.participants[0]._id.toString() === req.user.id;
        console.log('Is player 1:', isPlayer1);
        console.log('Screenshot URL received:', req.body.screenshot);

        console.log('Screenshot handling:', {
            isPlayer1,
            receivedScreenshot: req.body.screenshot,
            currentPlayer1Screenshot: room.player1Screenshot,
            currentPlayer2Screenshot: room.player2Screenshot
        });

        // Save screenshot based on player
        if (req.body.screenshot) {
            if (isPlayer1) {
                room.player1Screenshot = req.body.screenshot;
                console.log('Updated player1Screenshot:', room.player1Screenshot);
            } else {
                room.player2Screenshot = req.body.screenshot;
                console.log('Updated player2Screenshot:', room.player2Screenshot);
            }
        }

        // Update the appropriate result
        if (isPlayer1) {
            room.player1Result = req.body.result;
        } else {
            room.player2Result = req.body.result;
        }

        // Check if both results are submitted
        if (room.player1Result && room.player2Result) {
            if (room.player1Result === room.player2Result) {
                room.result = room.player1Result;
                room.resultDecisionPending = false;
                room.status = 'completed';

                // Add platform fee and winning amount calculation
                const platformFeePercentage = 10; // 10% platform fee
                const totalPool = room.entryFee * 2;
                const platformFee = (totalPool * platformFeePercentage) / 100;
                const winningAmount = totalPool - platformFee;

                // Determine winner and update wallet
                const winnerIndex = room.result === 'player1win' ? 0 : 1;
                const winner = await User.findById(room.participants[winnerIndex]);
                
                if (winner) {
                    winner.balance += winningAmount;
                    await winner.save();
                    console.log(`Winner ${winner.username} awarded ${winningAmount}`);
                }

                console.log('Game completed normally, winner paid');
            } else {
                room.resultDecisionPending = true;
                room.status = 'disputed';
                console.log('Results conflict, marked as disputed');
            }
        } else {
            room.resultDecisionPending = true;
            console.log('Waiting for other player result');
        }

        console.log('Final room state before save:', {
            player1Screenshot: room.player1Screenshot,
            player2Screenshot: room.player2Screenshot,
            player1Result: room.player1Result,
            player2Result: room.player2Result
        });

        await room.save();

        const updatedRoom = await Room.findById(room._id)
            .populate('participants', 'username _id')
            .select('+player1Screenshot +player2Screenshot');

        console.log('Room after save:', {
            player1Screenshot: updatedRoom.player1Screenshot,
            player2Screenshot: updatedRoom.player2Screenshot
        });

        res.json(updatedRoom);
    } catch (error) {
        console.error('Error in result submission:', error);
        res.status(500).json({ 
            message: 'Error submitting result', 
            error: error.message 
        });
    }
});

// Add admin decision endpoint
router.post('/:roomId/admin-decision', auth, async (req, res) => {
    try {
        // Verify if user is admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { decision } = req.body;
        if (decision !== 'player1win' && decision !== 'player2win') {
            return res.status(400).json({ message: 'Invalid decision format' });
        }

        const room = await Room.findById(req.params.roomId)
            .populate('participants');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.resultDecisionPending) {
            return res.status(400).json({ message: 'This room does not require admin decision' });
        }

        // Calculate winning amount (entry fee * 2 - platform fee)
        const platformFeePercentage = 10; // 10% platform fee
        const totalPool = room.entryFee * 2;
        const platformFee = (totalPool * platformFeePercentage) / 100;
        const winningAmount = totalPool - platformFee;

        // Determine winner and update wallets
        const winner = decision === 'player1win' ? room.participants[0] : room.participants[1];
        
        // Update winner's wallet
        winner.balance += winningAmount;
        await winner.save();

        // Update room with admin decision
        room.result = decision;
        room.resultDecisionPending = false;
        room.status = 'completed';
        room.adminDecision = {
            decidedBy: req.user.id,
            decidedAt: new Date(),
            decision
        };

        await room.save();

        // Send response with updated room and winner details
        res.json({
            room,
            winningAmount,
            winner: {
                id: winner._id,
                username: winner.username,
                newBalance: winner.balance
            }
        });

    } catch (error) {
        console.error('Error making admin decision:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Endpoint to get running challenges for the current user
router.get('/running', auth, async (req, res) => {
    try {
        const runningChallenges = await Room.find({
            status: 'running',
            participants: req.user.id
        }).populate('creator', 'username').populate('participants', 'username');
        
        res.json(runningChallenges);
    } catch (error) {
        console.error('Error fetching running challenges:', error); // Log the error for debugging
        res.status(500).json({ message: 'Error fetching running challenges', error: error.message });
    }
});

// Define the '/:roomId' route to fetch a specific room
router.get('/:roomId', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId)
            .populate('creator', 'username')
            .populate('participants', 'username');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error: error.message });
    }
});

// Cancel room endpoint
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the user is the creator of the room
    if (room.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to cancel this room' });
    }

    // Check if the room is open
    if (room.status !== 'open') {
      return res.status(400).json({ message: 'Cannot cancel a room that is not open' });
    }

    // Refund the entry fee to the creator's balance
    const user = await User.findById(req.user.id);
    user.balance += room.entryFee; // Add the entry fee back to the user's balance
    await user.save(); // Save the updated user

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room canceled successfully, and money refunded' });
  } catch (error) {
    console.error('Error canceling room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room code endpoint
router.patch('/:id', auth, async (req, res) => {
    console.log('Received request to update room code for room ID:', req.params.id);
    try {
      const { roomCode } = req.body;
      console.log('New room code:', roomCode);
      const room = await Room.findById(req.params.id);
      console.log('Room found:', room);
  
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Check if the user is the creator of the room
      if (room.creator.toString() !== req.user.id) {
        console.log('User is not authorized to update this room');
        return res.status(403).json({ message: 'You are not authorized to update this room' });
      }
  
      room.roomCode = roomCode; // Update the room code
      await room.save(); // Save the updated room
      console.log('Room code updated successfully:', room);
  
      res.json(room); // Return the updated room
    } catch (error) {
      console.error('Error updating room code:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Cancel route
router.patch('/cancel/:roomId', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const isPlayer1 = room.participants[0].toString() === req.user.id;
        const isPlayer2 = room.participants[1].toString() === req.user.id;

        if (!isPlayer1 && !isPlayer2) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Set the current player's cancel status
        if (isPlayer1) {
            room.player1Result = 'cancelled';
        } else {
            room.player2Result = 'cancelled';
        }

        // Check if both players have cancelled
        if (room.player1Result === 'cancelled' && room.player2Result === 'cancelled') {
            // Refund both players
            const player1 = await User.findById(room.participants[0]);
            const player2 = await User.findById(room.participants[1]);
            
            player1.balance += room.entryFee;
            player2.balance += room.entryFee;
            
            await Promise.all([
                player1.save(),
                player2.save()
            ]);

            room.status = 'cancelled';
            room.resultDecisionPending = false;
            await room.save();
            
            return res.json({ 
                status: 'cancelled', 
                message: 'Game cancelled by both players. Entry fees refunded.' 
            });
        }

        // If the other player has already submitted a different result
        if ((isPlayer1 && room.player2Result && room.player2Result !== 'cancelled') ||
            (isPlayer2 && room.player1Result && room.player1Result !== 'cancelled')) {
            room.status = 'disputed';
            room.resultDecisionPending = true;
        }

        await room.save();
        
        res.json({ 
            status: room.status,
            message: 'Cancellation request recorded'
        });
    } catch (error) {
        console.error('Error in cancel route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
