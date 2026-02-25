const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function createUser(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, name, role, bio, portfolio, wallet_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.email, data.password, data.name, data.role || 'both', data.bio || null, data.portfolio || null, data.wallet_balance || 0);
  return findUserById(id);
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUser(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return findUserById(id);
}

function updateWallet(id, amount) {
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, id);
  return findUserById(id);
}

function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

module.exports = { createUser, findUserByEmail, findUserById, updateUser, updateWallet, getAllUsers };
