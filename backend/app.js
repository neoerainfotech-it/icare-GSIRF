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
// This handles bringing up all your HTML, CSS, and JS assets automatically
app.use(express.static(path.join(__dirname, '../frontend')));

// Core API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));

// SAFE CATCH-ALL MIDDLEWARE
// Using app.use() completely avoids path-to-regexp string compilation errors
app.use((req, res, next) => {
    // If an API route wasn't found, don't serve the HTML page—let it pass to the error handler
    if (req.url.startsWith('/api/')) {
        return next();
    }
    // For all other page requests, fallback safely to index.html
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;