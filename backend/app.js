const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Files Statically
// Since app.js is inside /backend, we step out one level to access /frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Placeholder Core API Routes (We will hook up the files next)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));

// Fallback to serve index.html for any undefined routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;