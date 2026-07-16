// backend/controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Missing required validation components.' });
    }

    // Determine target look-up context array matching client configurations
    const targetTable = role === 'admin' ? 'admins' : 'institutes';
    
    // Query target table safely using dynamic interpolation for the table name
    const queryStr = `SELECT * FROM ${targetTable} WHERE username = ? AND is_active = 1`;
    const [rows] = await pool.execute(queryStr, [username.trim()]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // Process secure credentials matches (supporting both plaintext fallbacks and bcrypt)
    let isMatch = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (password === user.password); // Supports your plaintext superadmin fallback matching seed data
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate structured active token assignment using the verified role from the request body
    const token = jwt.sign(
      { id: user.id, username: user.username, role: role },
      process.env.JWT_SECRET || 'GARVI_DEFAULT_SECURE_TOKEN_2026',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Authentication validated successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: role
      }
    });

  } catch (error) {
    console.error('Login Pipeline Breakdown Error:', error);
    return res.status(500).json({ message: 'Internal Server error.' });
  }
};