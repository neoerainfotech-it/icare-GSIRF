const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Fetch Complete Faculty Roster for an Institution
router.get('/faculty/:instituteId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining FROM gsirf_faculty WHERE institute_id = ? ORDER BY name ASC',
            [req.params.instituteId]
        );
        res.json({ success: true, faculty: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Add dynamic faculty configuration entries
router.post('/faculty', async (req, res) => {
    const { id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining } = req.body;
    try {
        await pool.query(
            'INSERT INTO gsirf_faculty (id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining]
        );
        res.status(201).json({ success: true, message: 'Faculty record appended successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Update existing specialized faculty members
router.put('/faculty/:id', async (req, res) => {
    const { name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining } = req.body;
    try {
        await pool.query(
            'UPDATE gsirf_faculty SET name=?, gender=?, designation=?, dob=?, age=?, highest_degree=?, pan_exempt=?, pan=?, teaching_exp=?, industry_exp=?, working=?, association=?, date_of_joining=? WHERE id=?',
            [name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining, req.params.id]
        );
        res.json({ success: true, message: 'Faculty specifications updated.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Drop individual faculty lines
router.delete('/faculty/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM gsirf_faculty WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Faculty record removed.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Submit Overall Primary Application Context Block
router.post('/submit', async (req, res) => {
    const { id, institute_id, username, institute_name, gsirf_id, status, form_data } = req.body;
    try {
        // Stringify the form JSON object for storage safety in MySQL JSON field types
        const stringifiedFormData = JSON.stringify(form_data);
        const now = new Date();

        // High-speed transaction mapping via standard clean updates
        await pool.query(
            'INSERT INTO gsirf_submissions (id, institute_id, username, institute_name, gsirf_id, status, form_data, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE gsirf_id=?, institute_name=?, status=?, form_data=?, submitted_at=?',
            [id, institute_id, username, institute_name, gsirf_id, status, stringifiedFormData, now, gsirf_id, institute_name, status, stringifiedFormData, now]
        );
        res.json({ success: true, message: 'Primary evaluation form block synchronized.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Category-Specific Target Form Mapping Split (Upsert Model)
router.post('/category-submit', async (req, res) => {
    const { instituteId, overallSubmissionId, category, data } = req.body;
    try {
        const stringifiedData = JSON.stringify(data);
        const now = new Date();

        // Leverage Hostinger MySQL's atomic ON DUPLICATE KEY UPDATE engine
        await pool.query(
            'INSERT INTO gsirf_category_submissions (institute_id, overall_submission_id, category, data, status, submitted_at, updated_at) VALUES (?, ?, ?, ?, "submitted", ?, ?) ON DUPLICATE KEY UPDATE data=?, status="submitted", updated_at=?',
            [instituteId, overallSubmissionId, category, stringifiedData, now, now, stringifiedData, now]
        );

        res.json({ success: true, message: `Data split mapped perfectly to ${category}.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;