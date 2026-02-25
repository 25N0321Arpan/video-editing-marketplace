const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getAllUsers } = require('../models/User');
const { getAllJobs } = require('../models/Job');
const { getAllTransactions, getPlatformRevenue, getRecentTransactions } = require('../models/Transaction');

// GET /admin
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = getAllUsers();
    const jobs = getAllJobs();
    const revenue = getPlatformRevenue();
    const recentTransactions = getRecentTransactions(10);
    const recentUsers = users.slice(0, 10);

    const stats = {
      totalUsers: users.length,
      totalJobs: jobs.length,
      openJobs: jobs.filter(j => j.status === 'open').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      platformRevenue: revenue
    };

    res.render('admin', {
      title: 'Admin Dashboard',
      stats,
      recentTransactions,
      recentUsers,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/?error=An error occurred.');
  }
});

// GET /admin/users
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = getAllUsers();
    res.render('admin', { title: 'Admin - Users', stats: {}, recentTransactions: [], recentUsers: users, success: null, error: null });
  } catch (err) {
    console.error(err);
    res.redirect('/admin?error=An error occurred.');
  }
});

// GET /admin/transactions
router.get('/transactions', requireAdmin, (req, res) => {
  try {
    const transactions = getAllTransactions();
    const revenue = getPlatformRevenue();
    res.render('admin', {
      title: 'Admin - Transactions',
      stats: { platformRevenue: revenue },
      recentTransactions: transactions,
      recentUsers: [],
      success: null,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin?error=An error occurred.');
  }
});

module.exports = router;
