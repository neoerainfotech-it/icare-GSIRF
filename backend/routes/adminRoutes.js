const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt'); // <-- ADD THIS LINE HERE

// 1. Fetch Complete List of Active Institutes
router.get('/institutes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, username, is_active, created_at FROM institutes ORDER BY created_at DESC');
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create New Institute Account Profile (SECURED WITH BCRYPT HASHING)
router.post('/create-institute', async (req, res) => {
    const { username, password, instituteName } = req.body;
    const newId = uuidv4(); 
    
    try {
        // Generate a secure cryptographic salt and hash the plain text password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save the hashed password string instead of the clear plain text
        await pool.query(
            'INSERT INTO institutes (id, name, username, password, is_active) VALUES (?, ?, ?, ?, 1)', 
            [newId, instituteName, username, hashedPassword] // <-- CHANGED: password to hashedPassword
        );
        
        res.status(201).json({ success: true, message: 'Institute registered securely.' });
    } catch (err) {
        res.status(400).json({ error: err.message }); 
    }
});

// 3. Drop / Remove Institute Account Configuration
router.delete('/institutes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM institutes WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Account purged successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Fetch All Overall and Category Submissions
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

// 5. Update Status of a Specific Submission (Accept/Reject)
router.put('/submissions/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE gsirf_submissions SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Submission updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;