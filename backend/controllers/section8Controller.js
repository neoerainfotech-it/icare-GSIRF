const pool = require('../config/db');

/**
 * Handles saving/updating Section 8: About Institute & Declaration
 * Route: POST /api/applications/section8
 */
exports.saveDeclaration = async (req, res) => {
    const { 
        institute_id, ranking_year, about_constituent, about_campuses, 
        declaration_agreed, signatory_name, submission_date, form_status 
    } = req.body;
    
    const cleanYear = ranking_year || 2026;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute identification context.' });
    }

    const query = `
        INSERT INTO gsirf_declaration_details (
            institute_id, ranking_year, about_constituent, about_campuses, 
            declaration_agreed, signatory_name, submission_date, form_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            about_constituent = VALUES(about_constituent),
            about_campuses = VALUES(about_campuses),
            declaration_agreed = VALUES(declaration_agreed),
            signatory_name = VALUES(signatory_name),
            submission_date = VALUES(submission_date),
            form_status = VALUES(form_status)
    `;

    try {
        await pool.query(query, [
            institute_id, cleanYear, 
            about_constituent || 'NO', about_campuses || 'NO',
            declaration_agreed ? 1 : 0, signatory_name || null, 
            submission_date || null, form_status || 'draft'
        ]);

        res.json({ success: true, message: 'Section 8 final confirmation data synchronized.' });
    } catch (err) {
        console.error('[Section 8 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};