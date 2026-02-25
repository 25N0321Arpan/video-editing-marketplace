const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getJobsByOwner, getJobsByEditor } = require('../models/Job');
const { getSubmissionsByEditor } = require('../models/Submission');
const { getTransactionsByUser, createTransaction } = require('../models/Transaction');
const { updateWallet, findUserById } = require('../models/User');

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const ownedJobs = getJobsByOwner(user.id);
    const editingJobs = getJobsByEditor(user.id);
    const submissions = getSubmissionsByEditor(user.id);
    const transactions = getTransactionsByUser(user.id).slice(0, 5);

    const activeJobs = ownedJobs.filter(j => j.status === 'open' || j.status === 'in_progress').length;
    const completedJobs = ownedJobs.filter(j => j.status === 'completed').length;
    const activeEditing = editingJobs.filter(j => j.status === 'in_progress').length;
    const completedEditing = editingJobs.filter(j => j.status === 'completed').length;

    const totalEarnings = transactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);

    res.render('dashboard', {
      title: 'Dashboard',
      ownedJobs,
      editingJobs,
      submissions,
      transactions,
      stats: { activeJobs, completedJobs, activeEditing, completedEditing, totalEarnings },
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', {
      title: 'Dashboard',
      ownedJobs: [], editingJobs: [], submissions: [], transactions: [],
      stats: { activeJobs: 0, completedJobs: 0, activeEditing: 0, completedEditing: 0, totalEarnings: 0 },
      success: null, error: 'An error occurred loading the dashboard.'
    });
  }
});

// GET /wallet
router.get('/wallet', requireAuth, (req, res) => {
  try {
    const user = findUserById(req.user.id);
    const transactions = getTransactionsByUser(user.id);
    res.render('wallet', {
      title: 'Wallet',
      user,
      transactions,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard?error=An error occurred.');
  }
});

// POST /wallet/deposit
router.post('/wallet/deposit', requireAuth, (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.redirect('/wallet?error=Invalid deposit amount.');
    }
    updateWallet(req.user.id, amount);
    createTransaction({
      user_id: req.user.id,
      type: 'deposit',
      amount,
      description: `Wallet deposit of $${amount.toFixed(2)}`
    });
    res.redirect('/wallet?success=Funds deposited successfully!');
  } catch (err) {
    console.error(err);
    res.redirect('/wallet?error=An error occurred.');
  }
});

// POST /wallet/withdraw
router.post('/wallet/withdraw', requireAuth, (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const user = findUserById(req.user.id);
    if (isNaN(amount) || amount <= 0) {
      return res.redirect('/wallet?error=Invalid withdrawal amount.');
    }
    if (user.wallet_balance < amount) {
      return res.redirect('/wallet?error=Insufficient balance.');
    }
    updateWallet(req.user.id, -amount);
    createTransaction({
      user_id: req.user.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Wallet withdrawal of $${amount.toFixed(2)}`
    });
    res.redirect('/wallet?success=Withdrawal successful!');
  } catch (err) {
    console.error(err);
    res.redirect('/wallet?error=An error occurred.');
  }
});

module.exports = router;
