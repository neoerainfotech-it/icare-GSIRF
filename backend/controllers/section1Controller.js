const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles saving/updating Section 1: Institute Profile & Registration
 * Route: POST /api/applications/section1
 */
exports.saveProfile = async (req, res) => {
    const {
        institute_id,
        gsirf_id,
        ranking_year,
        institute_name,
        institute_type,
        affiliated_university,
        city,
        district,
        nodal_name,
        nodal_designation,
        official_email,
        mobile_number,
        submission_date,
        is_revised
    } = req.body;

    // 1. Mandatory Data Verification
    if (!institute_id || !gsirf_id || !institute_name || !institute_type) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing core mandatory fields (Institute ID, GSIRF ID, Name, or Type).' 
        });
    }

    // Generate a fresh tracking ID if it's a completely new row entry
    const recordId = uuidv4();
    const cleanYear = ranking_year || 2026;

    // 2. Structured Relational Upsert Query
    const query = `
        INSERT INTO gsirf_institute_profiles (
            id, institute_id, gsirf_id, ranking_year, institute_name, institute_type, 
            affiliated_university, city, district, nodal_name, nodal_designation, 
            official_email, mobile_number, submission_date, is_revised
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            gsirf_id = VALUES(gsirf_id),
            institute_name = VALUES(institute_name),
            institute_type = VALUES(institute_type),
            affiliated_university = VALUES(affiliated_university),
            city = VALUES(city),
            district = VALUES(district),
            nodal_name = VALUES(nodal_name),
            nodal_designation = VALUES(nodal_designation),
            official_email = VALUES(official_email),
            mobile_number = VALUES(mobile_number),
            submission_date = VALUES(submission_date),
            is_revised = VALUES(is_revised)
    `;

    try {
        await pool.query(query, [
            recordId, 
            institute_id, 
            gsirf_id, 
            cleanYear, 
            institute_name, 
            institute_type,
            affiliated_university || null, 
            city, 
            district || null, 
            nodal_name, 
            nodal_designation || null, 
            official_email, 
            mobile_number, 
            submission_date, 
            is_revised || 'N'
        ]);

        res.json({ 
            success: true, 
            message: 'Section 1: Institute Profile synchronized column-by-column.' 
        });

    } catch (err) {
        console.error('[Section 1 Controller Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};