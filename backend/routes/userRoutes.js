const express = require('express');
const router = express.Router();

// Test endpoint to verify the file works
router.get('/test', (req, res) => {
    res.json({ success: true, message: "User routes working cleanly" });
});

module.exports = router;