import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "mudita.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-create tables on first import
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    twitter_id TEXT UNIQUE,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    tweet_count INTEGER DEFAULT 0,
    account_created_at TEXT,
    overall_score REAL DEFAULT 0,
    builder_score REAL DEFAULT 0,
    authenticity_score REAL DEFAULT 0,
    growth_score REAL DEFAULT 0,
    red_flag_score REAL DEFAULT 0,
    engagement_growth_ratio REAL,
    engagement_trend TEXT,
    engagement_data_points INTEGER DEFAULT 0,
    pipeline_stage TEXT DEFAULT 'discovered',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_scored_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tweets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id TEXT UNIQUE,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    retweets INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_retweet INTEGER DEFAULT 0,
    is_reply INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS search_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    query_type TEXT DEFAULT 'Latest',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scoring_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    builder_weight REAL DEFAULT 0.4,
    authenticity_weight REAL DEFAULT 0.3,
    growth_weight REAL DEFAULT 0.2,
    red_flag_weight REAL DEFAULT 0.1,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS search_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id INTEGER REFERENCES search_queries(id),
    query_text TEXT NOT NULL,
    candidates_found INTEGER DEFAULT 0,
    new_candidates INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );
`);

// Migrate existing databases: add new columns if missing
const alterStatements = [
  "ALTER TABLE candidates ADD COLUMN engagement_growth_ratio REAL",
  "ALTER TABLE candidates ADD COLUMN engagement_trend TEXT",
  "ALTER TABLE candidates ADD COLUMN engagement_data_points INTEGER DEFAULT 0",
];
for (const stmt of alterStatements) {
  try { sqlite.prepare(stmt).run(); } catch { /* column already exists */ }
}

// Ensure default scoring weights exist
const weightCount = sqlite.prepare("SELECT COUNT(*) as count FROM scoring_weights").get() as { count: number };
if (weightCount.count === 0) {
  sqlite.prepare(
    "INSERT INTO scoring_weights (builder_weight, authenticity_weight, growth_weight, red_flag_weight) VALUES (0.4, 0.3, 0.2, 0.1)"
  ).run();
}

export { schema };
