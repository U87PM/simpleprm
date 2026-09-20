const Database = require("better-sqlite3");
const db = new Database("people.db");

db.exec(
    `
    CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        group_name TEXT,
        email TEXT,
        phone TEXT,
        birthday TEXT
    );
    
    CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        type TEXT,
        FOREIGN KEY (source_id) REFERENCES people(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES people(id) ON DELETE CASCADE
    );
    `
);

module.exports = db;