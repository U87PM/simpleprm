const Database = require('better-sqlite3');

const db = new Database('test.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )
`);

//prepar sql statement for execution
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
// insert.run('Alice', 'alice@test.com');
// insert.run('Bob', 'bob@test.com');

const insertUsers = db.transaction((users) => {
    const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    for (const user of users) {
        stmt.run(user.name, user.email);
    }
})
// insertUsers([
//     {name: "Charlie", email: "charlie@test.com"},
//     {name: "Jeff", email: "jeff@test.com"}
// ]);


//all() executes query & returns result array
const rows = db.prepare('SELECT * FROM users').all();

console.log(rows);

db.close();
