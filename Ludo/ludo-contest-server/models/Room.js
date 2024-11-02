const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: String,
    entryFee: {
        type: Number,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['open', 'running', 'completed', 'disputed', 'cancelled'],
        default: 'open'
    },
    player1Result: {
        type: String,
        enum: ['player1win', 'player2win', 'cancelled', null],
        default: null
    },
    player2Result: {
        type: String,
        enum: ['player1win', 'player2win', 'cancelled', null],
        default: null
    },
    result: {
        type: String,
        enum: ['player1win', 'player2win', null],
        default: null
    },
    resultDecisionPending: {
        type: Boolean,
        default: false
    },
    disputeDetails: {
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        claim: String,
        screenshotUrl: String,
        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    player1Screenshot: {
        type: String,
        default: null
    },
    player2Screenshot: {
        type: String,
        default: null
    },
    adminDecision: {
        decidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        decision: {
            type: String,
            enum: ['player1win', 'player2win', null],
            default: null
        },
        decidedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        // Ensure these fields are included when converting to JSON
        transform: function(doc, ret) {
            ret.player1Screenshot = doc.player1Screenshot;
            ret.player2Screenshot = doc.player2Screenshot;
            return ret;
        }
    }
});

module.exports = mongoose.model('Room', roomSchema);
