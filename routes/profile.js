const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { findUserById, updateUser } = require('../models/User');

// GET /profile
router.get('/', requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  res.render('profile', {
    title: 'My Profile',
    profileUser: user,
    success: req.query.success || null,
    error: req.query.error || null
  });
});

// POST /profile - update profile
router.post('/', requireAuth, (req, res) => {
  try {
    const { name, bio, portfolio } = req.body;
    if (!name || name.trim() === '') {
      return res.redirect('/profile?error=Name cannot be empty.');
    }
    updateUser(req.user.id, { name: name.trim(), bio: bio || null, portfolio: portfolio || null });
    res.redirect('/profile?success=Profile updated successfully!');
  } catch (err) {
    console.error(err);
    res.redirect('/profile?error=An error occurred while updating your profile.');
  }
});

module.exports = router;
