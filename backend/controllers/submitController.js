const pool = require('../config/db'); 
const crypto = require('crypto'); // 🌟 FIX: Use Node's built-in crypto module

/**
 * Handles final master data submission
 * Route: POST /api/applications/submit
 */
exports.submitApplication = async (req, res) => {
    const { institute_id, username, institute_name, gsirf_id, form_data } = req.body;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute identity context.' });
    }

    const query = `
        INSERT INTO gsirf_submissions (id, institute_id, username, institute_name, gsirf_id, status, form_data, submitted_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
        ON DUPLICATE KEY UPDATE 
            gsirf_id = VALUES(gsirf_id),
            institute_name = VALUES(institute_name),
            status = 'pending',
            form_data = VALUES(form_data),
            submitted_at = NOW()
    `;

    try {
        // 🌟 FIX: Generate a secure UUID natively without any external npm packages
        const submissionId = crypto.randomUUID(); 
        
        await pool.query(query, [
            submissionId, institute_id, username, institute_name, gsirf_id, JSON.stringify(form_data)
        ]);

        res.json({ success: true, submissionId, message: 'Application submitted into central registry.' });
    } catch (err) {
        console.error('[Submission Route Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};