const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 1. Fetch complete faculty roster for an institution
exports.getFaculty = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, gender, designation, dob, age, highest_degree, 
                    pan_exempt, pan, teaching_exp, industry_exp, working, 
                    association, date_of_joining 
             FROM gsirf_faculty 
             WHERE institute_id = ? AND ranking_year = 2026 
             ORDER BY name ASC`,
            [req.params.instituteId]
        );
        res.json({ success: true, faculty: rows });
    } catch (err) {
        console.error('[Section 5 GET Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. Add a new faculty record entry
exports.addFaculty = async (req, res) => {
    const { 
        institute_id, name, gender, designation, dob, age, highest_degree, 
        pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining 
    } = req.body;

    if (!institute_id || !name) {
        return res.status(400).json({ success: false, error: 'Mandatory fields missing.' });
    }

    const recordId = uuidv4();
    const query = `
        INSERT INTO gsirf_faculty (
            id, institute_id, ranking_year, name, gender, designation, dob, age, 
            highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, 
            association, date_of_joining
        ) VALUES (?, ?, 2026, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [
            recordId, institute_id, name, gender || null, designation || null, 
            dob || null, age || null, highest_degree || null, pan_exempt ? 1 : 0, 
            pan || null, teaching_exp || 0, industry_exp || 0, working || null, 
            association || null, date_of_joining || null
        ]);
        
        res.status(201).json({ success: true, id: recordId, message: 'Faculty record appended.' });
    } catch (err) {
        console.error('[Section 5 POST Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Update an existing specialized faculty member record
exports.updateFaculty = async (req, res) => {
    const { 
        name, gender, designation, dob, age, highest_degree, pan_exempt, 
        pan, teaching_exp, industry_exp, working, association, date_of_joining 
    } = req.body;

    const query = `
        UPDATE gsirf_faculty SET 
            name=?, gender=?, designation=?, dob=?, age=?, highest_degree=?, 
            pan_exempt=?, pan=?, teaching_exp=?, industry_exp=?, working=?, 
            association=?, date_of_joining=? 
        WHERE id=?
    `;

    try {
        await pool.query(query, [
            name, gender || null, designation || null, dob || null, age || null, 
            highest_degree || null, pan_exempt ? 1 : 0, pan || null, teaching_exp || 0, 
            industry_exp || 0, working || null, association || null, date_of_joining || null,
            req.params.id
        ]);
        res.json({ success: true, message: 'Faculty specifications updated successfully.' });
    } catch (err) {
        console.error('[Section 5 PUT Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Drop an individual faculty line record
exports.deleteFaculty = async (req, res) => {
    try {
        await pool.query('DELETE FROM gsirf_faculty WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Faculty record removed.' });
    } catch (err) {
        console.error('[Section 5 DELETE Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};