const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');

// Step 1: lookup email → return schools this user belongs to
exports.lookup = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [rows] = await pool.query(
      `SELECT u.school_id, s.name AS school_name, s.slug, s.logo_url,
              s.school_type, s.district, u.role
       FROM users u
       JOIN schools s ON u.school_id = s.id
       WHERE u.email = ? AND u.is_active = 1 AND s.is_active = 1
       ORDER BY s.name`,
      [email.toLowerCase().trim()]
    );
    if (!rows.length) return res.status(404).json({ error: 'No account found for this email' });
    res.json({ schools: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Step 2: login with school selected
exports.login = async (req, res) => {
  const { email, password, school_id } = req.body;
  if (!email || !password || !school_id)
    return res.status(400).json({ error: 'Email, password and school required' });
  try {
    const [[user]] = await pool.query(
      `SELECT u.*, s.name AS school_name, s.slug, s.logo_url,
              s.school_type, s.governing_body, s.primary_color
       FROM users u
       JOIN schools s ON u.school_id = s.id
       WHERE u.email = ? AND u.school_id = ? AND u.is_active = 1`,
      [email.toLowerCase().trim(), school_id]
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Check subscription
    const [[sub]] = await pool.query(
      `SELECT status, expires_at FROM school_subscriptions
       WHERE school_id = ? ORDER BY created_at DESC LIMIT 1`,
      [school_id]
    );
    if (sub && sub.status === 'suspended')
      return res.status(402).json({ error: 'School subscription suspended. Contact Shulink.' });

    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

    const token = jwt.sign(
      { id: user.id, school_id: user.school_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, ...safe } = user;
    res.json({ token, user: safe, subscription: sub });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Change password
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const [[user]] = await pool.query(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id]);
    const ok = await bcrypt.compare(current_password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.me = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.school_id, u.full_name, u.email, u.role, u.phone,
              u.photo_url, u.last_login, s.name AS school_name, s.slug,
              s.logo_url, s.primary_color, s.school_type, s.governing_body, s.district
       FROM users u JOIN schools s ON u.school_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
