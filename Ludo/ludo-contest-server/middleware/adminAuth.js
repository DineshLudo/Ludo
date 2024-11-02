const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        // req.user is already set by the auth middleware
        const user = await User.findById(req.user.id);
        console.log('Admin check for user:', user); // Debug log
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({ msg: 'Server error during admin authentication' });
    }
};

module.exports = { adminAuth };
