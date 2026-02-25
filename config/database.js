const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/marketplace.db');
const WASM_PATH = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');

let sqlDb = null;

function saveDb() {
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

const db = {
  prepare(sql) {
    return {
      run(...params) {
        sqlDb.run(sql, params);
        saveDb();
        return this;
      },
      get(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      all(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    sqlDb.exec(sql);
    saveDb();
  }
};

async function initDB() {
  const wasmBinary = fs.readFileSync(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'both',
      bio TEXT,
      portfolio TEXT,
      wallet_balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      budget REAL NOT NULL,
      category TEXT DEFAULT 'general',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      video_url TEXT,
      video_file TEXT,
      editor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (editor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      editor_id TEXT NOT NULL,
      video_file TEXT,
      video_url TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (editor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      job_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  saveDb();
}

module.exports = { db, initDB };
