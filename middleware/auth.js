const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/User');

function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = findUserById(decoded.id);
      if (user) {
        req.user = user;
        res.locals.user = user;
      }
    } catch (err) {
      // Invalid token - continue without user
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
}

module.exports = { authenticate, requireAuth, requireAdmin };
