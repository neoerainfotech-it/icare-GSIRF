const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles saving/updating Section 4: Placement & Higher Studies
 * Route: POST /api/applications/section4
 */
exports.savePlacementDetails = async (req, res) => {
    const { institute_id, ranking_year, nep_transition, placements } = req.body;
    const cleanYear = ranking_year || 2026;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute identity context.' });
    }

    // 1. Atomic Upsert for Global NEP Configuration
    const configQuery = `
        INSERT INTO gsirf_placement_configs (institute_id, ranking_year, nep_transition)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE nep_transition = VALUES(nep_transition)
    `;

    // 2. Atomic Upsert for Historical Program Batch Performance Row Matrix
    const detailsQuery = `
        INSERT INTO gsirf_placement_details (
            id, institute_id, ranking_year, program_key, batch_index,
            intake_year, intake_count, admitted_count,
            lateral_year, lateral_admitted_count,
            grad_year, grad_min_time_count, placed_count,
            median_salary, median_salary_words, higher_studies_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            intake_year = VALUES(intake_year),
            intake_count = VALUES(intake_count),
            admitted_count = VALUES(admitted_count),
            lateral_year = VALUES(lateral_year),
            lateral_admitted_count = VALUES(lateral_admitted_count),
            grad_year = VALUES(grad_year),
            grad_min_time_count = VALUES(grad_min_time_count),
            placed_count = VALUES(placed_count),
            median_salary = VALUES(median_salary),
            median_salary_words = VALUES(median_salary_words),
            higher_studies_count = VALUES(higher_studies_count)
    `;

    try {
        // Run global configuration query
        await pool.query(configQuery, [institute_id, cleanYear, nep_transition || 'No']);

        // Process batch performance array row-by-row
        if (Array.isArray(placements)) {
            for (const item of placements) {
                const rowId = uuidv4();
                await pool.query(detailsQuery, [
                    rowId, institute_id, cleanYear, item.program_key, item.batch_index,
                    item.intake_year, item.intake_count || 0, item.admitted_count || 0,
                    item.lateral_year || null, item.lateral_admitted_count || 0,
                    item.grad_year, item.grad_min_time_count || 0, item.placed_count || 0,
                    item.median_salary || 0.00, item.median_salary_words || null, item.higher_studies_count || 0
                ]);
            }
        }

        res.json({ success: true, message: 'Section 4 data matrix cleanly synchronized.' });
    } catch (err) {
        console.error('[Section 4 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};