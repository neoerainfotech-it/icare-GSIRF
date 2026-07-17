const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles saving/updating Section 7: Research Funding
 * Route: POST /api/applications/section7
 */
exports.saveResearchFunding = async (req, res) => {
    const { institute_id, ranking_year, ipr, funding } = req.body;
    const cleanYear = ranking_year || 2026;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute identity parameter.' });
    }

    const iprQuery = `
        INSERT INTO gsirf_ipr_details (id, institute_id, ranking_year, calendar_year, patents_published, patents_granted)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            patents_published = VALUES(patents_published),
            patents_granted = VALUES(patents_granted)
    `;

    const fundingQuery = `
        INSERT INTO gsirf_research_funding_details (id, institute_id, ranking_year, funding_type, financial_year, count_1, count_2, amount, amount_in_words)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            count_1 = VALUES(count_1),
            count_2 = VALUES(count_2),
            amount = VALUES(amount),
            amount_in_words = VALUES(amount_in_words)
    `;

    try {
        // 1. Process Calendar Year Patent Matrix (IPR)
        if (Array.isArray(ipr)) {
            for (const item of ipr) {
                const rowId = uuidv4();
                await pool.query(iprQuery, [
                    rowId, institute_id, cleanYear, item.calendar_year,
                    item.patents_published || 0, item.patents_granted || 0
                ]);
            }
        }

        // 2. Process Financial Year Research Matrix (Sponsored, Consultancy, EDP/MDP)
        if (Array.isArray(funding)) {
            for (const item of funding) {
                const rowId = uuidv4();
                await pool.query(fundingQuery, [
                    rowId, institute_id, cleanYear, item.funding_type, item.financial_year,
                    item.count_1 || 0, item.count_2 || 0, item.amount || 0.00, item.amount_in_words || null
                ]);
            }
        }

        res.json({ success: true, message: 'Section 7 research metrics synchronized successfully.' });
    } catch (err) {
        console.error('[Section 7 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};