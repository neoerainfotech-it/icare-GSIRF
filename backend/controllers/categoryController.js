const pool = require('../config/db');

/**
 * Handles saving chosen ranking categories for an active submission
 * Route: POST /api/applications/categories
 */
exports.saveCategories = async (req, res) => {
    const { submission_id, institute_id, ranking_year, categories } = req.body;
    const cleanYear = ranking_year || 2026;

    if (!submission_id || !institute_id) {
        return res.status(400).json({ success: false, error: 'Missing submission or institute context identifiers.' });
    }

    // Prepare connection transaction sequence
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Clear out any previous categories for this submission to avoid old row pollution
        await connection.query(
            'DELETE FROM gsirf_submission_categories WHERE submission_id = ?',
            [submission_id]
        );

        // 2. Insert selected categories if any exist
        if (Array.isArray(categories) && categories.length > 0) {
            const insertQuery = `
                INSERT INTO gsirf_submission_categories 
                (submission_id, institute_id, ranking_year, category_key) 
                VALUES (?, ?, ?, ?)
            `;
            
            for (const catKey of categories) {
                await connection.query(insertQuery, [submission_id, institute_id, cleanYear, catKey]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Ranking category configurations recorded successfully.' });
    } catch (err) {
        await connection.rollback();
        console.error('[Category Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
};