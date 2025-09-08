const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { protect } = require('../middleware/authMiddleware');
// You'll need to set up Multer for file uploads
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

// @desc    Show dashboard with user's profile and entries
// @route   GET /dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        // Fetch journal entries for the logged-in user, sorted by most recent
        const entries = await JournalEntry.find({ author: req.user.id }).sort({ createdAt: 'desc' });
        
        res.render('dashboard', {
            user: req.user, // The 'user' object is available from the 'protect' middleware
            entries: entries
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Process new journal entry creation
// @route   POST /entries
router.post('/entries', protect, upload.single('photo'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const newEntry = {
            title,
            content,
            author: req.user.id,
        };

        // If a photo was uploaded, add its path to the new entry object
        if (req.file) {
            newEntry.photo = '/uploads/' + req.file.filename;
        }

        await JournalEntry.create(newEntry);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Process deleting a journal entry
// @route   POST /entries/delete/:id
router.post('/entries/delete/:id', protect, async (req, res) => {
    try {
        let entry = await JournalEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).send('Entry not found');
        }

        // Make sure the logged-in user is the author of the entry
        if (entry.author.toString() !== req.user.id) {
            return res.status(401).send('Not authorized');
        }

        await JournalEntry.deleteOne({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// --- NEW: Route to handle editing a journal entry ---
// @desc    Process editing a journal entry
// @route   POST /entries/edit/:id
router.post('/entries/edit/:id', protect, async (req, res) => {
    try {
        let entry = await JournalEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).send('Entry not found');
        }

        // Make sure the logged-in user is the author of the entry
        if (entry.author.toString() !== req.user.id) {
            return res.status(401).send('Not Authorized');
        }

        // Update the fields from the form submission
        entry.title = req.body.title;
        entry.content = req.body.content;

        await entry.save(); // Save the updated entry
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
