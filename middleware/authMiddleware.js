const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (ensures user is logged in)
const protect = async (req, res, next) => {
    let token;
    if (req.cookies.token) {
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).send('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401).redirect('/login');
    }
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Not authorized as an admin');
    }
};

// --- NEW MIDDLEWARE ---
// Middleware to forward users who are already logged in
const forwardAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    // If no token exists, they are a guest, so continue to the requested page
    if (!token) {
        return next();
    }

    // If a token exists, they are logged in
    try {
        // Verify the token to see who they are
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Redirect based on their role
        if (decoded.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/dashboard');
        }
    } catch (err) {
        // If token is invalid for any reason, clear it and let them proceed as a guest
        res.clearCookie('token');
        return next();
    }
};


module.exports = { protect, isAdmin, forwardAuthenticated };
