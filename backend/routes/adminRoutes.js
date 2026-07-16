const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// 1. Fetch Complete List of Active Institutes
router.get('/institutes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, username, is_active, created_at FROM institutes ORDER BY created_at DESC');
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create New Institute Account Profile (Secured with Bcrypt Hashing)
router.post('/create-institute', async (req, res) => {
    const { username, password, instituteName } = req.body;
    const newId = uuidv4(); 
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pool.query(
            'INSERT INTO institutes (id, name, username, password, is_active) VALUES (?, ?, ?, ?, 1)', 
            [newId, instituteName, username, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'Institute registered securely.' });
    } catch (err) {
        res.status(400).json({ error: err.message }); 
    }
});

// 3. Securely Update An Existing Institute's Password Profile
router.put('/institutes/:id/password', async (req, res) => {
    const { password } = req.body;
    const targetUserId = req.params.id;

    if (!password || password.trim() === '') {
        return res.status(400).json({ success: false, error: 'Password parameters cannot be blank.' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

        const [result] = await pool.query(
            'UPDATE institutes SET password = ? WHERE id = ?',
            [hashedPassword, targetUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Target institute profile not found.' });
        }

        res.json({ success: true, message: 'Institutional password updated securely.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Drop / Remove Institute Account Configuration
router.delete('/institutes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM institutes WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Account purged successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Fetch All Overall and Category Submissions
router.get('/submissions', async (req, res) => {
    try {
        const [submissions] = await pool.query(
            'SELECT id, institute_id, institute_name, gsirf_id, status, form_data, submitted_at FROM gsirf_submissions ORDER BY submitted_at DESC'
        );
        const [categorySubmissions] = await pool.query(
            'SELECT institute_id, category FROM gsirf_category_submissions'
        );
        res.json({ 
            success: true, 
            submissions: submissions, 
            categorySubmissions: categorySubmissions 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Update Status of a Specific Submission (Accept/Reject)
router.put('/submissions/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE gsirf_submissions SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Submission updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ALWAYS AT THE ABSOLUTE BOTTOM OF THE FILE
module.exports = router;