const jwt = require('jsonwebtoken');

const auth = function(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ msg: 'Authorization header is missing' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ msg: 'Invalid authorization header format' });
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'Authentication token is missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ msg: 'Token has expired' });
    }

    // Add user from payload
    req.user = decoded.user; // Use the correct structure based on your token
    console.log('User authenticated:', req.user);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ msg: 'Server error during authentication' });
  }
};
module.exports = { auth };

