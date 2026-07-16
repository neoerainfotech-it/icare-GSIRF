const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔍 DIAGNOSTIC TRAFFIC LOGGER
// Prints every single network request directly to your VS Code terminal
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} request received at: ${req.url}`);
    next();
});

// Serve Frontend Files Statically
app.use(express.static(path.join(__dirname, '../frontend')));

// =================================================================
// 1. ACTIVE API ENDPOINTS
// =================================================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// =================================================================
// 2. CATCH-ALL MIDDLEWARE (Strictly avoids intercepting valid API calls)
// =================================================================
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`⚠️ Route missed endpoints. Forwarding to API 404 Handler: ${req.url}`);
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// =================================================================
// 3. GLOBAL ERROR & JSON 404 HANDLERS
// =================================================================
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint ${req.originalUrl} not found on this server.` });
});

app.use((err, req, res, next) => {
    console.error('💥 Critical Server Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;