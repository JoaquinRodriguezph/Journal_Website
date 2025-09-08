const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../middleware/authMiddleware'); // <-- IMPORT

// @desc    Landing page
// @route   GET /
// UPDATED: Added the new middleware
router.get('/', forwardAuthenticated, (req, res) => {
    res.render('index');
});

module.exports = router;
