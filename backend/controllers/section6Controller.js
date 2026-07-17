const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles saving/updating Section 6: Institution Details
 * Route: POST /api/applications/section6
 */
exports.saveInstitutionDetails = async (req, res) => {
    const { institute_id, ranking_year, finances, configs } = req.body;
    const cleanYear = ranking_year || 2026;

    if (!institute_id) {
        return res.status(400).json({ success: false, error: 'Missing institute ID context.' });
    }

    // 1. Matrix Upsert for Financial Expenditures (Capex/Opex over 3 years)
    const financeQuery = `
        INSERT INTO gsirf_financial_expenditures (
            id, institute_id, ranking_year, expenditure_type, head_key, 
            financial_year, utilized_amount, amount_in_words
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            utilized_amount = VALUES(utilized_amount),
            amount_in_words = VALUES(amount_in_words)
    `;

    // 2. Flat Upsert for Institutional Policies, Accreditation, and Sustainability
    const configQuery = `
        INSERT INTO gsirf_institutional_configs (
            institute_id, ranking_year,
            pcs_lift, pcs_walking, pcs_toilet,
            naac_accred, naac_grade, naac_cgpa, naac_valid,
            nba_accred, nba_total_progs, nba_accred_progs,
            mee_q1, mee_q2, mee_q3, mee_q4, mee_q5,
            slp_q1, slp_q2_a, slp_q2_b, slp_q2_c, slp_q2_d, slp_q2_e,
            slp_q3, slp_q4_a, slp_q4_b, slp_q4_c, slp_q4_d, slp_q4_e, slp_q4_f,
            slp_q5_a, slp_q5_b, slp_q5_c, slp_q5_d, slp_q5_e,
            slp_q6_a, slp_q6_b, slp_q6_c, slp_q6_d
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            pcs_lift=VALUES(pcs_lift), pcs_walking=VALUES(pcs_walking), pcs_toilet=VALUES(pcs_toilet),
            naac_accred=VALUES(naac_accred), naac_grade=VALUES(naac_grade), naac_cgpa=VALUES(naac_cgpa), naac_valid=VALUES(naac_valid),
            nba_accred=VALUES(nba_accred), nba_total_progs=VALUES(nba_total_progs), nba_accred_progs=VALUES(nba_accred_progs),
            mee_q1=VALUES(mee_q1), mee_q2=VALUES(mee_q2), mee_q3=VALUES(mee_q3), mee_q4=VALUES(mee_q4), mee_q5=VALUES(mee_q5),
            slp_q1=VALUES(slp_q1), slp_q2_a=VALUES(slp_q2_a), slp_q2_b=VALUES(slp_q2_b), slp_q2_c=VALUES(slp_q2_c), slp_q2_d=VALUES(slp_q2_d), slp_q2_e=VALUES(slp_q2_e),
            slp_q3=VALUES(slp_q3), slp_q4_a=VALUES(slp_q4_a), slp_q4_b=VALUES(slp_q4_b), slp_q4_c=VALUES(slp_q4_c), slp_q4_d=VALUES(slp_q4_d), slp_q4_e=VALUES(slp_q4_e), slp_q4_f=VALUES(slp_q4_f),
            slp_q5_a=VALUES(slp_q5_a), slp_q5_b=VALUES(slp_q5_b), slp_q5_c=VALUES(slp_q5_c), slp_q5_d=VALUES(slp_q5_d), slp_q5_e=VALUES(slp_q5_e),
            slp_q6_a=VALUES(slp_q6_a), slp_q6_b=VALUES(slp_q6_b), slp_q6_c=VALUES(slp_q6_c), slp_q6_d=VALUES(slp_q6_d)
    `;

    try {
        // Execute Finances array dynamically
        if (Array.isArray(finances)) {
            for (const item of finances) {
                const rowId = uuidv4();
                await pool.query(financeQuery, [
                    rowId, institute_id, cleanYear, item.expenditure_type, 
                    item.head_key, item.financial_year, item.utilized_amount || 0.00, item.amount_in_words || null
                ]);
            }
        }

        // Execute Configs mapping
        if (configs) {
            await pool.query(configQuery, [
                institute_id, cleanYear,
                configs.pcs_lift || 'NA', configs.pcs_walking || 'No', configs.pcs_toilet || 'NA',
                configs.naac_accred || 'NO', configs.naac_grade || null, configs.naac_cgpa || null, configs.naac_valid || null,
                configs.nba_accred || 'NO', configs.nba_total_progs || 0, configs.nba_accred_progs || 0,
                configs.mee_q1 || 'No', configs.mee_q2 || 'No', configs.mee_q3 || 'No', configs.mee_q4 || 'No', configs.mee_q5 || 'No',
                configs.slp_q1 || 'none', 
                configs.slp_q2_a || 0, configs.slp_q2_b || 0, configs.slp_q2_c || 0, configs.slp_q2_d || 0, configs.slp_q2_e || 0,
                configs.slp_q3 || 'none', 
                configs.slp_q4_a || 0, configs.slp_q4_b || 0, configs.slp_q4_c || 0, configs.slp_q4_d || 0, configs.slp_q4_e || 0, configs.slp_q4_f || 0,
                configs.slp_q5_a || 0, configs.slp_q5_b || 0, configs.slp_q5_c || 0, configs.slp_q5_d || 0, configs.slp_q5_e || 0,
                configs.slp_q6_a || 0, configs.slp_q6_b || 0, configs.slp_q6_c || 0, configs.slp_q6_d || 0
            ]);
        }

        res.json({ success: true, message: 'Section 6 structural data synced safely.' });
    } catch (err) {
        console.error('[Section 6 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};