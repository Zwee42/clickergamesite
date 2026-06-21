import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS saves (
        username TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export function loadSave(username: string): string | null {
  const row = getDb().prepare('SELECT state FROM saves WHERE username = ?').get(username) as { state: string } | undefined;
  return row?.state ?? null;
}

export function saveGame(username: string, state: string): void {
  getDb().prepare(`
    INSERT INTO saves (username, state, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(username) DO UPDATE SET state = excluded.state, updated_at = datetime('now')
  `).run(username, state);
}

export function usernameExists(username: string): boolean {
  const row = getDb().prepare('SELECT 1 FROM saves WHERE username = ?').get(username);
  return !!row;
}

export function deleteSave(username: string): void {
  getDb().prepare('DELETE FROM saves WHERE username = ?').run(username);
}
