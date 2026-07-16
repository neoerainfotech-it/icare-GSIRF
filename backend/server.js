const path = require('path');
// Automatically points to the .env file in the root directory relative to this file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server fully operational on http://localhost:${PORT}`);
});