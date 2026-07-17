const pool = require('../config/db');

/**
 * Handles saving/updating Section 2: Sanctioned Intake
 * Route: POST /api/applications/section2
 */
exports.saveIntake = async (req, res) => {
    const { institute_id, ranking_year, intakes } = req.body;

    if (!institute_id || !Array.isArray(intakes)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required parameters or invalid intakes format.' 
        });
    }

    const query = `
        INSERT INTO gsirf_sanctioned_intake (
            institute_id, ranking_year, program_key, year_1, year_2, year_3, year_4, year_5, year_6
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            year_1 = VALUES(year_1),
            year_2 = VALUES(year_2),
            year_3 = VALUES(year_3),
            year_4 = VALUES(year_4),
            year_5 = VALUES(year_5),
            year_6 = VALUES(year_6)
    `;

    try {
        for (const intake of intakes) {
            await pool.query(query, [
                institute_id,
                ranking_year || 2026,
                intake.program_key,
                intake.year_1 || 0,
                intake.year_2 || 0,
                intake.year_3 || 0,
                intake.year_4 || 0,
                intake.year_5 || 0,
                intake.year_6 || 0
            ]);
        }
        res.json({ success: true, message: 'Section 2 data synchronized successfully.' });
    } catch (err) {
        console.error('[Section 2 Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};