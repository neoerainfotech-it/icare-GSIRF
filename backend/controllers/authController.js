// backend/controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper function to enforce the strict password policy required by BUG-001
function validatePasswordPolicy(password) {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character[cite: 2]
  const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return policyRegex.test(password);
}

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
      isMatch = (password === user.password); // Supports plaintext superadmin fallback matching seed data
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // ✅ SECURED: Enforce backend policy validation check[cite: 2]
    // Note: If checking older legacy seed data accounts (like plaintext master seeds) that don't match the policy,
    // you can conditionally wrap this check to run strictly for normal users, or enforce it universally:
    if (!validatePasswordPolicy(password)) {
      return res.status(400).json({ 
        message: 'Password security policy violation. Minimum 8 characters with an uppercase letter, lowercase letter, number, and special character required.'
      });
    }

    // ✅ FIXED SECURITY FLAW: Use the true, verified database entity role, or hardcode it based on the table checked.
    // Do not trust the raw user role string payload coming blindly from req.body.
    const calculatedRole = role === 'admin' ? 'admin' : 'institute';

    // Generate structured active token assignment
    const token = jwt.sign(
      { id: user.id, username: user.username, role: calculatedRole },
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
        role: calculatedRole
      }
    });

  } catch (error) {
    console.error('Login Pipeline Breakdown Error:', error);
    return res.status(500).json({ message: 'Internal Server error.' });
  }
};