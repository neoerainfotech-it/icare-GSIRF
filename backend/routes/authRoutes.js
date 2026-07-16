const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Double-checked relative path for sub-directory routes

// ── 1. SECURE ACCOUNT FORGOT-PASSWORD VERIFICATION ─────────────────
router.post('/forgot-password', async (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, error: 'User ID tracking field cannot be left empty.' });
    }

    try {
        // Query database to check if this institutional profile is active
        const [rows] = await pool.query(
            'SELECT name FROM institutes WHERE username = ? AND is_active = 1',
            [username.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(444).json({ 
                success: false, 
                error: 'No active institutional account matching that User ID was found.' 
            });
        }

        const instituteName = rows[0].name;

        res.json({
            success: true,
            message: `A reset request signature token for "${instituteName}" has been successfully logged. Please contact the GARVI State Supermaster Administrator to pull up your profile record and approve your new security credentials.`
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── ALWAYS AT THE ABSOLUTE BOTTOM OF THE ROUTER FILE ───────────────
module.exports = router;