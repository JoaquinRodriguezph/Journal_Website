// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, forwardAuthenticated } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
// @desc    Show registration page
// @route   GET /register
// UPDATED: Added the new middleware
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// @desc    Show login page
// @route   GET /login
// UPDATED: Added the new middleware
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// @desc    Handle user registration
// @route   POST /register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, dateOfBirth } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            // UPDATED: Use flash instead of res.send
            req.flash('error_msg', 'A user with that email already exists.');
            return res.redirect('/register');
        }

        // --- NEW: Array of default avatars ---
        const defaultAvatars = [
            '/images/avatars/person1.jpg',
            '/images/avatars/person2.jpg',
            '/images/avatars/person3.jpg',
            '/images/avatars/person4.jpg',
            '/images/avatars/person5.jpg',
        ];

        // --- NEW: Pick a random avatar ---
        const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with the random profile picture
        user = new User({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            profilePicture: randomAvatar // <-- Assign the random avatar here
        });

        await user.save();
        req.flash('success_msg', 'You are now registered and can log in!');
        res.redirect('/login');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/profile', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.name = name || user.name;
        user.description = description || user.description;

        // If a new profile picture was uploaded, update the path
        if (req.file) {
            user.profilePicture = '/uploads/' + req.file.filename;
        }

        await user.save();
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Handle user login
// @route   POST /login
router.post('/login', async (req, res) => {
    try {
        // Get the 'rememberMe' value from the form
        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.isSuspended) {
            req.flash('error_msg', 'Invalid credentials or account suspended.');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid credentials.');
            return res.redirect('/login');
        }
        
        // --- UPDATED LOGIC ---
        // Set expiration options based on the checkbox
        const expiresIn = rememberMe ? '30d' : '1d'; // JWT expiration
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : null; // Cookie expiration (30 days or session)

        // Create JWT with the determined expiration
        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
        
        // Set cookie options with the determined maxAge
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: maxAge 
        });

        // Check user role and redirect accordingly
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/dashboard');
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @desc    Handle user logout
// @route   GET /logout
router.get('/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0) }); // Clear the cookie
    res.redirect('/login');
});

module.exports = router;