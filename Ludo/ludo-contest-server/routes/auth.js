const express = require('express');
const bcrypt = require('bcryptjs');
console.log('Bcrypt full object:', bcrypt);
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  console.log('Bcrypt loaded:', !!bcrypt);
  console.log('Bcrypt version:', bcrypt.version);
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email, password: '[REDACTED]' });

    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    console.log('User object before save:', { ...newUser.toObject(), password: '[REDACTED]' });
    await newUser.save();
    const savedUser = await User.findOne({ username: newUser.username });
    console.log('User object after save:', { ...savedUser.toObject(), password: '[REDACTED]' });

    console.log('Saving user with hashed password:', hashedPassword);
    console.log('User registered successfully:', username);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  console.log('Bcrypt version:', bcrypt.version);
  console.log('Login attempt received:', { ...req.body, password: '[REDACTED]' });
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    console.log('User found in database:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Retrieved user from database:', { ...user.toObject(), password: '[REDACTED]' });

    // Check password
    console.log('Comparing passwords');
    console.log('Input password:', '[REDACTED]');
    console.log('Stored hashed password:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If we get here, login was successful
    console.log('Login successful for user:', username);

    // Create and sign the token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          userId: user._id,
          username: user.username,
          balance: user.balance,
          isAdmin: user.role === 'admin',
          role: user.role
        });
      }
    );
  } catch (error) {
    console.error('Server-side login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// '/me' endpoint to verify token and return user info
router.get('/me', auth.auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Add the additional fields you want to return
    res.json({
      _id: user._id,
      username: user.username,
      balance: user.balance,
      isAdmin: user.role === 'admin',
      role: user.role,
      ...user._doc // Spread the rest of the user properties
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
