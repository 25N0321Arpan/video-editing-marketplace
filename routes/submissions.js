const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getSubmissionsByEditor } = require('../models/Submission');

// GET /submissions - redirect to dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

module.exports = router;
