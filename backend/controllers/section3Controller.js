const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles saving/updating Section 3: Student Strength & Ph.D. Details
 * Route: POST /api/applications/section3
 */
exports.saveStudentAndPhd = async (req, res) => {
    const { institute_id, ranking_year, strengths, phd } = req.body;
    const cleanYear = ranking_year || 2026;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute identity context.' });
    }

    // 1. Relational Queries Configuration
    const strengthQuery = `
        INSERT INTO gsirf_student_strength (
            id, institute_id, ranking_year, program_key, male, female, transgender, total,
            within_state, outside_state, outside_country, economically_backward, socially_challenged,
            fee_gov, fee_inst, fee_pvt, fee_none
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            male = VALUES(male), female = VALUES(female), transgender = VALUES(transgender), total = VALUES(total),
            within_state = VALUES(within_state), outside_state = VALUES(outside_state), outside_country = VALUES(outside_country),
            economically_backward = VALUES(economically_backward), socially_challenged = VALUES(socially_challenged),
            fee_gov = VALUES(fee_gov), fee_inst = VALUES(fee_inst), fee_pvt = VALUES(fee_pvt), fee_none = VALUES(fee_none)
    `;

    const phdQuery = `
        INSERT INTO gsirf_phd_details (
            institute_id, ranking_year, phd_ft_current, phd_pt_current, phd_total_current,
            phd_grad_ft_2526, phd_grad_ft_2425, phd_grad_ft_2324,
            phd_grad_pt_2526, phd_grad_pt_2425, phd_grad_pt_2324,
            phd_med_pursuing, phd_med_grad_2526, phd_med_grad_2425, phd_med_grad_2324
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            phd_ft_current = VALUES(phd_ft_current), phd_pt_current = VALUES(phd_pt_current), phd_total_current = VALUES(phd_total_current),
            phd_grad_ft_2526 = VALUES(phd_grad_ft_2526), phd_grad_ft_2425 = VALUES(phd_grad_ft_2425), phd_grad_ft_2324 = VALUES(phd_grad_ft_2324),
            phd_grad_pt_2526 = VALUES(phd_grad_pt_2526), phd_grad_pt_2425 = VALUES(phd_grad_pt_2425), phd_grad_pt_2324 = VALUES(phd_grad_pt_2324),
            phd_med_pursuing = VALUES(phd_med_pursuing), phd_med_grad_2526 = VALUES(phd_med_grad_2526), phd_med_grad_2425 = VALUES(phd_med_grad_2425), phd_med_grad_2324 = VALUES(phd_med_grad_2324)
    `;

    try {
        // 2. Process Array of Program Strengths
        if (Array.isArray(strengths)) {
            for (const row of strengths) {
                const rowId = uuidv4();
                await pool.query(strengthQuery, [
                    rowId, institute_id, cleanYear, row.program_key,
                    row.male || 0, row.female || 0, row.transgender || 0, row.total || 0,
                    row.within_state || 0, row.outside_state || 0, row.outside_country || 0,
                    row.economically_backward || 0, row.socially_challenged || 0,
                    row.fee_gov || 0, row.fee_inst || 0, row.fee_pvt || 0, row.fee_none || 0
                ]);
            }
        }

        // 3. Process Global Ph.D. Details Metrics Record
        if (phd) {
            await pool.query(phdQuery, [
                institute_id, cleanYear,
                phd.phd_ft_current || 0, phd.phd_pt_current || 0, phd.phd_total_current || 0,
                phd.phd_grad_ft_2526 || 0, phd.phd_grad_ft_2425 || 0, phd.phd_grad_ft_2324 || 0,
                phd.phd_grad_pt_2526 || 0, phd.phd_grad_pt_2425 || 0, phd.phd_grad_pt_2324 || 0,
                phd.phd_med_pursuing || 0, phd.phd_med_grad_2526 || 0, phd.phd_med_grad_2425 || 0, phd.phd_med_grad_2324 || 0
            ]);
        }

        res.json({ success: true, message: 'Section 3 datasets synchronized successfully.' });
    } catch (err) {
        console.error('[Section 3 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};