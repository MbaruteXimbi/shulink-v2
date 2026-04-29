const jwt = require('jsonwebtoken');
const pool = require('../db');

const auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [[user]] = await pool.query(
      `SELECT u.id, u.school_id, u.full_name, u.email, u.role, u.is_active,
              s.name AS school_name, s.slug AS school_slug, s.governing_body
       FROM users u
       JOIN schools s ON u.school_id = s.id
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.id]
    );
    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const roles = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user.role) && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const checkSubscription = async (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  const [[sub]] = await pool.query(
    `SELECT status, expires_at FROM school_subscriptions
     WHERE school_id = ? ORDER BY created_at DESC LIMIT 1`,
    [req.user.school_id]
  );
  if (!sub || sub.status === 'suspended') {
    return res.status(402).json({ error: 'Subscription inactive. Contact Shulink support.' });
  }
  if (sub.status === 'expired' || (sub.expires_at && new Date(sub.expires_at) < new Date())) {
    return res.status(402).json({ error: 'Subscription expired. Please renew.' });
  }
  next();
};

module.exports = { auth, roles, checkSubscription };
