const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Test endpoint to verify the file works
router.get('/test', (req, res) => {
    res.json({ success: true, message: "Auth routes working cleanly" });
});

// ✅ ADD THIS CRITICAL ROUTE: Maps the frontend login request to the controller logic
router.post('/login', authController.login);

module.exports = router;