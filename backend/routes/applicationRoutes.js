const express = require('express');
const router = express.Router();

// Import the modular section controllers
const section1Controller = require('../controllers/section1Controller');
const section2Controller = require('../controllers/section2Controller');
const section3Controller = require('../controllers/section3Controller');
const section4Controller = require('../controllers/section4Controller');
const section5Controller = require('../controllers/section5Controller'); 
const section6Controller = require('../controllers/section6Controller');
const section7Controller = require('../controllers/section7Controller');
const section8Controller = require('../controllers/section8Controller');
const submitController = require('../controllers/submitController');
const categoryController = require('../controllers/categoryController');// <-- Add this import

// ─── MODULAR ROUTE TARGETS ──────────────────────────────────────────
router.post('/section1', section1Controller.saveProfile);
router.post('/section2', section2Controller.saveIntake);
router.post('/section3', section3Controller.saveStudentAndPhd);
router.post('/section4', section4Controller.savePlacementDetails);

// ─── SECTION 5 ROUTE MAPPINGS ───────────────────────────────────────
router.get('/faculty/:instituteId', section5Controller.getFaculty);
router.post('/faculty', section5Controller.addFaculty);
router.put('/faculty/:id', section5Controller.updateFaculty);
router.delete('/faculty/:id', section5Controller.deleteFaculty);
router.post('/section6', section6Controller.saveInstitutionDetails);
router.post('/section7', section7Controller.saveResearchFunding);
router.post('/section8', section8Controller.saveDeclaration);
router.post('/submit', submitController.submitApplication);
router.post('/categories', categoryController.saveCategories);

// ==========================================
// ─── 📋 EXISTING ACTIVE PIPELINES ─────────
// ==========================================

// 1. Fetch Complete Faculty Roster for an Institution
router.get('/faculty/:instituteId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining FROM gsirf_faculty WHERE institute_id = ? ORDER BY name ASC',
            [req.params.instituteId]
        );
        res.json({ success: true, faculty: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Add dynamic faculty configuration entries
router.post('/faculty', async (req, res) => {
    const { id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining } = req.body;
    try {
        await pool.query(
            'INSERT INTO gsirf_faculty (id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, institute_id, ranking_year, name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining]
        );
        res.status(201).json({ success: true, message: 'Faculty record appended successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Update existing specialized faculty members
router.put('/faculty/:id', async (req, res) => {
    const { name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining } = req.body;
    try {
        await pool.query(
            'UPDATE gsirf_faculty SET name=?, gender=?, designation=?, dob=?, age=?, highest_degree=?, pan_exempt=?, pan=?, teaching_exp=?, industry_exp=?, working=?, association=?, date_of_joining=? WHERE id=?',
            [name, gender, designation, dob, age, highest_degree, pan_exempt, pan, teaching_exp, industry_exp, working, association, date_of_joining, req.params.id]
        );
        res.json({ success: true, message: 'Faculty specifications updated.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Drop individual faculty lines
router.delete('/faculty/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM gsirf_faculty WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Faculty record removed.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Submit Overall Primary Application Context Block
router.post('/submit', async (req, res) => {
    const { id, institute_id, username, institute_name, gsirf_id, status, form_data } = req.body;
    try {
        const stringifiedFormData = JSON.stringify(form_data);
        const now = new Date();
        await pool.query(
            'INSERT INTO gsirf_submissions (id, institute_id, username, institute_name, gsirf_id, status, form_data, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE gsirf_id=?, institute_name=?, status=?, form_data=?, submitted_at=?',
            [id, institute_id, username, institute_name, gsirf_id, status, stringifiedFormData, now, gsirf_id, institute_name, status, stringifiedFormData, now]
        );
        res.json({ success: true, message: 'Primary evaluation form block synchronized.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Category-Specific Target Form Mapping Split (Upsert Model)
router.post('/category-submit', async (req, res) => {
    const { instituteId, overallSubmissionId, category, data } = req.body;
    try {
        const stringifiedData = JSON.stringify(data);
        const now = new Date();
        await pool.query(
            'INSERT INTO gsirf_category_submissions (institute_id, overall_submission_id, category, data, status, submitted_at, updated_at) VALUES (?, ?, ?, ?, "submitted", ?, ?) ON DUPLICATE KEY UPDATE data=?, status="submitted", updated_at=?',
            [instituteId, overallSubmissionId, category, stringifiedData, now, now, stringifiedData, now]
        );
        res.json({ success: true, message: `Data split mapped perfectly to ${category}.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;