// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @desc    Show admin dashboard with all users and entries
// @route   GET /admin/dashboard
router.get('/dashboard', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        const entries = await JournalEntry.find().populate('author', 'name email');
        
        res.render('adminDashboard', {
            users,
            entries
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Suspend a user's account
// @route   POST /admin/users/suspend/:id
router.post('/users/suspend/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isSuspended = !user.isSuspended; // Toggle suspension status
            await user.save();
        }
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete a user account (and all their entries)
// @route   POST /admin/users/delete/:id
router.post('/users/delete/:id', protect, isAdmin, async (req, res) => {
    try {
        // First, delete all entries by this user to clean up the database
        await JournalEntry.deleteMany({ author: req.params.id });
        // Then, delete the user
        await User.deleteOne({ _id: req.params.id });
        
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;