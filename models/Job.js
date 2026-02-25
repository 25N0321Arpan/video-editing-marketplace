const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function createJob(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO jobs (id, owner_id, title, description, instructions, budget, category, deadline, video_url, video_file)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.owner_id, data.title, data.description, data.instructions, data.budget,
    data.category || 'general', data.deadline || null, data.video_url || null, data.video_file || null);
  return findJobById(id);
}

function findJobById(id) {
  return db.prepare(`
    SELECT j.*, u.name as owner_name, u.email as owner_email,
           e.name as editor_name
    FROM jobs j
    LEFT JOIN users u ON j.owner_id = u.id
    LEFT JOIN users e ON j.editor_id = e.id
    WHERE j.id = ?
  `).get(id);
}

function getAllJobs(filters = {}) {
  let query = `
    SELECT j.*, u.name as owner_name
    FROM jobs j
    LEFT JOIN users u ON j.owner_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ' AND j.status = ?';
    params.push(filters.status);
  }
  if (filters.category) {
    query += ' AND j.category = ?';
    params.push(filters.category);
  }
  if (filters.minBudget) {
    query += ' AND j.budget >= ?';
    params.push(parseFloat(filters.minBudget));
  }
  if (filters.maxBudget) {
    query += ' AND j.budget <= ?';
    params.push(parseFloat(filters.maxBudget));
  }

  query += ' ORDER BY j.created_at DESC';
  return db.prepare(query).all(...params);
}

function getJobsByOwner(ownerId) {
  return db.prepare(`
    SELECT j.*, u.name as owner_name, e.name as editor_name
    FROM jobs j
    LEFT JOIN users u ON j.owner_id = u.id
    LEFT JOIN users e ON j.editor_id = e.id
    WHERE j.owner_id = ?
    ORDER BY j.created_at DESC
  `).all(ownerId);
}

function getJobsByEditor(editorId) {
  return db.prepare(`
    SELECT j.*, u.name as owner_name
    FROM jobs j
    LEFT JOIN users u ON j.owner_id = u.id
    WHERE j.editor_id = ?
    ORDER BY j.created_at DESC
  `).all(editorId);
}

function updateJob(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return findJobById(id);
}

function deleteJob(id) {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
}

module.exports = { createJob, findJobById, getAllJobs, getJobsByOwner, getJobsByEditor, updateJob, deleteJob };
