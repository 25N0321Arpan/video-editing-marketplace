const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function createTransaction(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO transactions (id, user_id, type, amount, description, job_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.user_id, data.type, data.amount, data.description || null, data.job_id || null);
  return id;
}

function getTransactionsByUser(userId) {
  return db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
}

function getAllTransactions() {
  return db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `).all();
}

function getPlatformRevenue() {
  const result = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'commission'
  `).get();
  return result.total;
}

function getRecentTransactions(limit = 10) {
  return db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = { createTransaction, getTransactionsByUser, getAllTransactions, getPlatformRevenue, getRecentTransactions };
