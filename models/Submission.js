const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function createSubmission(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO submissions (id, job_id, editor_id, video_file, video_url, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.job_id, data.editor_id, data.video_file || null, data.video_url || null, data.notes || null);
  return findSubmissionById(id);
}

function findSubmissionById(id) {
  return db.prepare(`
    SELECT s.*, u.name as editor_name, u.email as editor_email
    FROM submissions s
    LEFT JOIN users u ON s.editor_id = u.id
    WHERE s.id = ?
  `).get(id);
}

function getSubmissionsByJob(jobId) {
  return db.prepare(`
    SELECT s.*, u.name as editor_name, u.email as editor_email
    FROM submissions s
    LEFT JOIN users u ON s.editor_id = u.id
    WHERE s.job_id = ?
    ORDER BY s.created_at DESC
  `).all(jobId);
}

function getSubmissionsByEditor(editorId) {
  return db.prepare(`
    SELECT s.*, j.title as job_title, j.budget as job_budget
    FROM submissions s
    LEFT JOIN jobs j ON s.job_id = j.id
    WHERE s.editor_id = ?
    ORDER BY s.created_at DESC
  `).all(editorId);
}

function updateSubmission(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  db.prepare(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return findSubmissionById(id);
}

module.exports = { createSubmission, findSubmissionById, getSubmissionsByJob, getSubmissionsByEditor, updateSubmission };
