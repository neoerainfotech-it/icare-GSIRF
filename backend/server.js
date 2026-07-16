const path = require('path');
// Automatically points to the .env file in the root directory relative to this file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server fully operational on http://localhost:${PORT}`);
});

// Handle graceful termination signs
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('💥 Process terminated safely.');
    });
});