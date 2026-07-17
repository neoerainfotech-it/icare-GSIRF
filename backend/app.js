const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔍 DIAGNOSTIC TRAFFIC LOGGER
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} request received at: ${req.url}`);
    next();
});

// =================================================================
// 🖥️ PROFESSIONAL CLEAN NAVIGATION ROUTING (Strips .html extensions)
// =================================================================

// Primary root "/" opens index.html automatically on system startup
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Accessible via http://localhost:5000/index cleanly
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Accessible via http://localhost:5000/landing cleanly
app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/auth/login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/dashboard.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/analytics.html'));
});

app.get('/benchmarking', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/benchmarking.html')); 
});

app.get('/gsirf-data-collection', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/gsirf-data-collection.html'));
});

app.get('/simulator', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cms/dashboard/simulator.html')); 
});


// Serve Frontend Files Statically (For assets like CSS, images, client JS files)
app.use(express.static(path.join(__dirname, '../frontend')));

// =================================================================
// ⚡ ACTIVE SYSTEM API ENDPOINTS
// =================================================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// =================================================================
// 🚧 FAILSAFES & CATCH-ALL MIDDLEWARE
// =================================================================

// Handle API specific 404s cleanly
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint ${req.originalUrl} not found on this server.` });
});

// Global Frontend Fallback (Redirects missing views gracefully back to index view)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('💥 Critical Server Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;