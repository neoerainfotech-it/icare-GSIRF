const express = require('express');
const router = express.Router();

// Placeholder route
router.get('/test', (req, res) => res.json({ msg: "Route working" }));

module.exports = router;