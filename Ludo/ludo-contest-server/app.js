require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const uploadRoutes = require('./routes/upload'); // Adjust the path as necessary
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const transactionRoutes = require('./routes/transactions');
const gamesRoutes = require('./routes/games');
const path = require('path');
const fs = require('fs');

console.log('authRoutes type:', typeof authRoutes);
console.log('authRoutes content:', authRoutes);
console.log('roomRoutes type:', typeof roomRoutes);
console.log('roomRoutes content:', roomRoutes);

const app = express();

// Update CORS configuration
app.use(cors({
    origin: [
        'https://ludofrontend.onrender.com',
        'http://localhost:3000',  // for local development
        'http://localhost:5001'   // for local backend
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add CORS headers middleware
app.use((req, res, next) => {
    const allowedOrigins = ['https://ludofrontend.onrender.com', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware
app.use(express.json());

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB (replace with your MongoDB connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Ludo';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
});

// Add event listeners for MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Routes
console.log('Setting up /api/rooms route');
app.use('/api/rooms', roomRoutes);
console.log('Setting up /api/auth route');
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes); // This will make the upload route available at /api/upload
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/games', gamesRoutes);

const PORT = process.env.PORT || 5001;  // Changed from 5000 to 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
