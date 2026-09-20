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
    
    -- Virtual table - invokes callback methods instead of r/w to db file.
    -- Full text search implementation
    CREATE VIRTUAL TABLE IF NOT EXISTS people_fts USING fts5(
        name,
        content='people',       -- mirror 'people' data, wout storing it's own copy. "External content mode"
        content_rowid='id'      -- match by id
    );
    -- updates virual table on change to people table
    CREATE TRIGGER IF NOT EXISTS people_after_insert AFTER INSERT ON people BEGIN
        -- inside trigger, new - keyword for new row added
        INSERT INTO people_fts(rowid, name) VALUES (new.id, new.name);
    END;
    CREATE TRIGGER IF NOT EXISTS people_after_delete AFTER DELETE ON people BEGIN
        INSERT INTO people_fts(rowid, name) VALUES ('delete', old.id, old.name);
    END;
    CREATE TRIGGER IF NOT EXISTS people_after_update AFTER UPDATE ON people BEGIN
        -- old - row's value before update. new is value after.
        INSERT INTO people_fts(people_fts, rowid, name) VALUES ('delete', old.id, old.name);
        INSERT INTO people_fts(rowid, name) VALUES (new.id, new.name);
    END;

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